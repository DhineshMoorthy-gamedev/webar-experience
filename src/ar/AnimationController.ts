import * as THREE from 'three';
import { ExperienceConfig } from '../config/experience.ts';
import { CareerMilestone, ProjectItem } from '../config/portfolio.ts';

export class AnimationController {
  private anchorGroup: THREE.Group;
  private clock = new THREE.Clock();

  // 3D Mechanical Card Hierarchy
  private cardChassisGroup: THREE.Group;
  private leftWingGroup: THREE.Group;
  private rightWingGroup: THREE.Group;
  private centerCoreGroup: THREE.Group;
  private timelineLaserTrack: THREE.Line | null = null;
  private laserPulseMesh: THREE.Mesh | null = null;

  // 3D Zen Fourier Waveform
  private fourierWaveMesh: THREE.Line | null = null;
  private fourierWaveGeometry: THREE.BufferGeometry | null = null;
  private readonly WAVE_POINT_COUNT = 80;

  // 3D Milestone Floating Panels
  private milestoneNodeMeshes: { mesh: THREE.Group; index: number; basePos: THREE.Vector3 }[] = [];
  private activeProjectCardGroup: THREE.Group;
  private particleGroup: THREE.Points | null = null;

  // Unfolding Animation State
  private unfoldProgress = 0.0;
  private isTargetLocked = false;
  private activeMilestoneIndex = 0;
  private activeMilestone: CareerMilestone;

  // Real-time tracking pose transforms
  private targetPos = new THREE.Vector3();
  private targetQuat = new THREE.Quaternion();
  private targetScaleVec = new THREE.Vector3(1, 1, 1);

  // Dynamic tracking thresholds
  private readonly SNAP_DISTANCE_THRESHOLD = 0.35;
  private readonly SNAP_ANGLE_THRESHOLD = 0.30;
  private readonly FINE_LERP_FACTOR = 0.85;

  constructor(
    private scene: THREE.Scene,
    private config: ExperienceConfig
  ) {
    this.anchorGroup = new THREE.Group();
    this.anchorGroup.name = 'XR8_Mechanical_Card_Anchor';
    this.scene.add(this.anchorGroup);

    this.cardChassisGroup = new THREE.Group();
    this.leftWingGroup = new THREE.Group();
    this.rightWingGroup = new THREE.Group();
    this.centerCoreGroup = new THREE.Group();
    this.activeProjectCardGroup = new THREE.Group();

    this.anchorGroup.add(this.cardChassisGroup);
    this.anchorGroup.add(this.leftWingGroup);
    this.anchorGroup.add(this.rightWingGroup);
    this.anchorGroup.add(this.centerCoreGroup);
    this.anchorGroup.add(this.activeProjectCardGroup);

    this.activeMilestone = this.config.portfolio.milestones[0];
  }

  public async loadModel(): Promise<void> {
    this.setupLighting();
    this.buildMechanicalCardChassis();
    this.buildLeftWing();
    this.buildRightWing();
    this.buildCenterFourierCore();
    this.buildTimelineLaserTrack();
    this.buildHolographicParticles();

    // Initial project card display
    this.displayActiveProjectCard(this.activeMilestone);

    this.setVisible(false);
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    this.scene.add(ambientLight);

    const cyanKeyLight = new THREE.DirectionalLight(0x00e5ff, 2.5);
    cyanKeyLight.position.set(2, 4, 3);
    this.scene.add(cyanKeyLight);

    const pinkFillLight = new THREE.DirectionalLight(0xff007f, 1.8);
    pinkFillLight.position.set(-2, 3, -2);
    this.scene.add(pinkFillLight);

    const coreLight = new THREE.PointLight(0x00e5ff, 3.0, 5);
    coreLight.position.set(0, 0.3, 0);
    this.anchorGroup.add(coreLight);
  }

  /**
   * 1. Center Base Chassis (Fits exact 3.5 x 2 ratio of the physical card)
   */
  private buildMechanicalCardChassis(): void {
    const cardWidth = 0.70;
    const cardHeight = 0.40;

    // Beveled Main Baseplate
    const plateGeo = new THREE.PlaneGeometry(cardWidth, cardHeight);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x080e1a,
      roughness: 0.3,
      metalness: 0.8,
      side: THREE.DoubleSide
    });
    const basePlate = new THREE.Mesh(plateGeo, plateMat);
    basePlate.rotation.x = -Math.PI / 2; // Flat on the card surface
    this.cardChassisGroup.add(basePlate);

    // Glowing Neon Chassis Border
    const edgesGeo = new THREE.EdgesGeometry(plateGeo);
    const edgesMat = new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      linewidth: 3
    });
    const edgeLine = new THREE.LineSegments(edgesGeo, edgesMat);
    edgeLine.rotation.x = -Math.PI / 2;
    edgeLine.position.y = 0.002;
    this.cardChassisGroup.add(edgeLine);

    // Corner Optical Anchor Beacons
    const beaconPositions = [
      { x: -cardWidth / 2 + 0.03, z: -cardHeight / 2 + 0.03 },
      { x: cardWidth / 2 - 0.03, z: -cardHeight / 2 + 0.03 },
      { x: -cardWidth / 2 + 0.03, z: cardHeight / 2 - 0.03 },
      { x: cardWidth / 2 - 0.03, z: cardHeight / 2 - 0.03 }
    ];

    const beaconGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.01, 16);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });

    beaconPositions.forEach((pos) => {
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(pos.x, 0.005, pos.z);
      this.cardChassisGroup.add(beacon);
    });
  }

  /**
   * 2. Left Mechanical Wing (Slides Left: 2022 & 2023 Stations)
   */
  private buildLeftWing(): void {
    const wingWidth = 0.44;
    const wingHeight = 0.36;

    // Wing Sub-Chassis
    const wingGeo = new THREE.PlaneGeometry(wingWidth, wingHeight);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x0b1329,
      roughness: 0.4,
      metalness: 0.7,
      side: THREE.DoubleSide
    });
    const wingMesh = new THREE.Mesh(wingGeo, wingMat);
    wingMesh.rotation.x = -Math.PI / 2;
    wingMesh.position.set(-wingWidth / 2, 0.004, 0);
    this.leftWingGroup.add(wingMesh);

    // Neon Wing Border
    const wingEdgeGeo = new THREE.EdgesGeometry(wingGeo);
    const wingEdgeMat = new THREE.LineBasicMaterial({ color: 0x7c4dff });
    const wingEdge = new THREE.LineSegments(wingEdgeGeo, wingEdgeMat);
    wingEdge.rotation.x = -Math.PI / 2;
    wingEdge.position.set(-wingWidth / 2, 0.006, 0);
    this.leftWingGroup.add(wingEdge);

    // Milestone Pad 1: 2022 (College / Fabbox Studios / Merkel Intro)
    const pad2022 = this.createMilestonePad('2022', 'FABBOX & IITM', '#00e5ff', 0);
    pad2022.position.set(-0.35, 0.01, -0.07);
    this.leftWingGroup.add(pad2022);
    this.milestoneNodeMeshes.push({ mesh: pad2022, index: 0, basePos: pad2022.position.clone() });

    // Milestone Pad 2: 2023 (Merkel Haptic Systems VR Simulators)
    const pad2023 = this.createMilestonePad('2023', 'IITM HAPTICS XR', '#00e676', 1);
    pad2023.position.set(-0.35, 0.01, 0.07);
    this.leftWingGroup.add(pad2023);
    this.milestoneNodeMeshes.push({ mesh: pad2023, index: 1, basePos: pad2023.position.clone() });
  }

  /**
   * 3. Right Mechanical Wing (Slides Right: 2024 & 2026 Stations)
   */
  private buildRightWing(): void {
    const wingWidth = 0.44;
    const wingHeight = 0.36;

    // Wing Sub-Chassis
    const wingGeo = new THREE.PlaneGeometry(wingWidth, wingHeight);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x0b1329,
      roughness: 0.4,
      metalness: 0.7,
      side: THREE.DoubleSide
    });
    const wingMesh = new THREE.Mesh(wingGeo, wingMat);
    wingMesh.rotation.x = -Math.PI / 2;
    wingMesh.position.set(wingWidth / 2, 0.004, 0);
    this.rightWingGroup.add(wingMesh);

    // Neon Wing Border
    const wingEdgeGeo = new THREE.EdgesGeometry(wingGeo);
    const wingEdgeMat = new THREE.LineBasicMaterial({ color: 0xff007f });
    const wingEdge = new THREE.LineSegments(wingEdgeGeo, wingEdgeMat);
    wingEdge.rotation.x = -Math.PI / 2;
    wingEdge.position.set(wingWidth / 2, 0.006, 0);
    this.rightWingGroup.add(wingEdge);

    // Milestone Pad 3: 2024 (Abhiwan Technologies Senior Unity)
    const pad2024 = this.createMilestonePad('2024', 'SENIOR UNITY', '#ffd600', 2);
    pad2024.position.set(0.35, 0.01, -0.07);
    this.rightWingGroup.add(pad2024);
    this.milestoneNodeMeshes.push({ mesh: pad2024, index: 2, basePos: pad2024.position.clone() });

    // Milestone Pad 4: 2026 (Olai Digital Studios & Zen Fourier)
    const pad2026 = this.createMilestonePad('2026', 'OLAI & ZEN FOURIER', '#ff007f', 3);
    pad2026.position.set(0.35, 0.01, 0.07);
    this.rightWingGroup.add(pad2026);
    this.milestoneNodeMeshes.push({ mesh: pad2026, index: 3, basePos: pad2026.position.clone() });
  }

  /**
   * Creates a textured 3D milestone pad
   */
  private createMilestonePad(year: string, label: string, colorHex: string, index: number): THREE.Group {
    const group = new THREE.Group();

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#060a14';
      ctx.roundRect(0, 0, 256, 100, 14);
      ctx.fill();

      ctx.lineWidth = 6;
      ctx.strokeStyle = colorHex;
      ctx.stroke();

      ctx.fillStyle = colorHex;
      ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
      ctx.fillText(year, 18, 44);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
      ctx.fillText(label, 18, 76);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const geo = new THREE.PlaneGeometry(0.20, 0.08);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    group.add(mesh);
    (group as any).milestoneIndex = index;

    return group;
  }

  /**
   * 4. Center Zen Fourier Harmonic Waveform Core
   */
  private buildCenterFourierCore(): void {
    // Pedestal Chamber Ring
    const ringGeo = new THREE.RingGeometry(0.09, 0.11, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.01;
    this.centerCoreGroup.add(ringMesh);

    // Inner Core Hex
    const hexGeo = new THREE.RingGeometry(0.05, 0.07, 6);
    const hexMat = new THREE.MeshBasicMaterial({
      color: 0xff007f,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const hexMesh = new THREE.Mesh(hexGeo, hexMat);
    hexMesh.rotation.x = -Math.PI / 2;
    hexMesh.position.y = 0.012;
    this.centerCoreGroup.add(hexMesh);

    // 3D Oscillating Fourier Mathematical Waveform
    this.fourierWaveGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.WAVE_POINT_COUNT * 3);
    this.fourierWaveGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const waveMaterial = new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      linewidth: 3,
      transparent: true,
      opacity: 0.95
    });

    this.fourierWaveMesh = new THREE.Line(this.fourierWaveGeometry, waveMaterial);
    this.fourierWaveMesh.position.set(0, 0.08, 0);
    this.centerCoreGroup.add(this.fourierWaveMesh);
  }

  /**
   * 5. Glowing Laser Timeline Circuit & Energy Spark
   */
  private buildTimelineLaserTrack(): void {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.35, 0.02, -0.07), // 2022
      new THREE.Vector3(-0.35, 0.02, 0.07),  // 2023
      new THREE.Vector3(0.0, 0.05, 0.0),     // Center Core
      new THREE.Vector3(0.35, 0.02, -0.07),  // 2024
      new THREE.Vector3(0.35, 0.02, 0.07)    // 2026
    ]);

    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.5
    });

    this.timelineLaserTrack = new THREE.Line(geometry, material);
    this.anchorGroup.add(this.timelineLaserTrack);

    // Energy Spark / Pulse
    const sparkGeo = new THREE.SphereGeometry(0.015, 12, 12);
    const sparkMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: false
    });
    this.laserPulseMesh = new THREE.Mesh(sparkGeo, sparkMat);
    this.laserPulseMesh.position.set(0, 0.05, 0);
    this.anchorGroup.add(this.laserPulseMesh);
  }

  /**
   * 6. Floating Ambient Hologram Particles
   */
  private buildHolographicParticles(): void {
    const count = 50;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 1.2;
      positions[i + 1] = Math.random() * 0.4 + 0.02;
      positions[i + 2] = (Math.random() - 0.5) * 0.8;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0x00e5ff,
      size: 0.018,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.particleGroup = new THREE.Points(geometry, material);
    this.anchorGroup.add(this.particleGroup);
  }

  public setMilestone(index: number): void {
    const milestones = this.config.portfolio.milestones;
    if (index < 0 || index >= milestones.length) return;

    this.activeMilestoneIndex = index;
    this.activeMilestone = milestones[index];

    this.displayActiveProjectCard(this.activeMilestone);
  }

  /**
   * Renders the floating 3D project card projected from the active wing
   */
  private displayActiveProjectCard(milestone: CareerMilestone): void {
    while (this.activeProjectCardGroup.children.length > 0) {
      this.activeProjectCardGroup.remove(this.activeProjectCardGroup.children[0]);
    }

    const project = milestone.projects[0];
    if (!project) return;

    const cardMesh = this.createFloatingCardMesh(project, milestone.accentColor);
    
    // Position floating above the center core facing the camera
    cardMesh.position.set(0, 0.28, -0.05);
    cardMesh.rotation.x = -0.25; // Tilted toward user for readability
    cardMesh.scale.set(0.01, 0.01, 0.01);

    // Spring scale-in animation
    this.animateScale(cardMesh, 1.0);
    this.activeProjectCardGroup.add(cardMesh);
  }

  private createFloatingCardMesh(project: ProjectItem, accentColorHex: string): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 280;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#080f24';
      ctx.roundRect(0, 0, 512, 280, 20);
      ctx.fill();

      // Glowing border
      ctx.lineWidth = 6;
      ctx.strokeStyle = accentColorHex || '#00e5ff';
      ctx.stroke();

      // Top Tag
      ctx.fillStyle = accentColorHex || '#00e5ff';
      ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
      ctx.fillText(`${project.icon} ${project.badge} • ${project.company}`, 24, 46);

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 32px "Segoe UI", Arial, sans-serif';
      ctx.fillText(project.title, 24, 94);

      // Subtitle
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.font = '600 20px "Segoe UI", Arial, sans-serif';
      ctx.fillText(project.subtitle, 24, 126);

      // Divider
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(24, 144);
      ctx.lineTo(488, 144);
      ctx.stroke();

      // Tech Stack
      ctx.font = 'bold 17px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = accentColorHex || '#00e5ff';
      ctx.fillText(`TECH: ${project.techStack.slice(0, 4).join(' • ')}`, 24, 180);

      // Highlight
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '15px "Segoe UI", Arial, sans-serif';
      const highlight = project.highlights[0] || project.description.substring(0, 50);
      ctx.fillText(`✦ ${highlight.substring(0, 50)}...`, 24, 218);

      // Tap CTA Pill
      ctx.fillStyle = 'rgba(0, 229, 255, 0.2)';
      ctx.roundRect(24, 238, 220, 32, 8);
      ctx.fill();
      ctx.strokeStyle = accentColorHex || '#00e5ff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
      ctx.fillText('🔍 TAP TO VIEW DETAILS', 36, 259);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const geo = new THREE.PlaneGeometry(0.52, 0.28);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true
    });

    return new THREE.Mesh(geo, mat);
  }

  private animateScale(mesh: THREE.Mesh, target: number): void {
    let cur = 0.05;
    const interval = setInterval(() => {
      cur += (target - cur) * 0.25;
      mesh.scale.set(cur, cur, cur);
      if (Math.abs(target - cur) < 0.01) {
        mesh.scale.set(target, target, target);
        clearInterval(interval);
      }
    }, 16);
  }

  public updatePose(pos: { x: number; y: number; z: number }, rot: { x: number; y: number; z: number; w: number }, scale?: number): void {
    this.targetPos.set(pos.x, pos.y, pos.z);
    this.targetQuat.set(rot.x, rot.y, rot.z, rot.w);
    if (scale) {
      this.targetScaleVec.set(scale, scale, scale);
    }

    const posDelta = this.anchorGroup.position.distanceTo(this.targetPos);
    const rotDelta = this.anchorGroup.quaternion.angleTo(this.targetQuat);

    if (posDelta > this.SNAP_DISTANCE_THRESHOLD || rotDelta > this.SNAP_ANGLE_THRESHOLD) {
      this.anchorGroup.position.copy(this.targetPos);
      this.anchorGroup.quaternion.copy(this.targetQuat);
      this.anchorGroup.scale.copy(this.targetScaleVec);
    } else {
      this.anchorGroup.position.lerp(this.targetPos, this.FINE_LERP_FACTOR);
      this.anchorGroup.quaternion.slerp(this.targetQuat, this.FINE_LERP_FACTOR);
      this.anchorGroup.scale.lerp(this.targetScaleVec, this.FINE_LERP_FACTOR);
    }
  }

  public play(): void {
    this.isTargetLocked = true;
    this.setVisible(true);
  }

  public pause(): void {
    this.isTargetLocked = false;
    this.setVisible(false);
  }

  public reset(): void {
    this.unfoldProgress = 0;
  }

  public setVisible(visible: boolean): void {
    if (this.anchorGroup) {
      this.anchorGroup.visible = visible;
    }
  }

  /**
   * Real-time 60fps Animation Loop:
   * - Smooth mechanical wing unfolding
   * - Multi-frequency Zen Fourier wave calculation
   * - Laser energy spark travel
   * - Milestone node elevation
   */
  public update(): void {
    const time = this.clock.getElapsedTime();

    // 1. Kinetic Unfolding Transition (0 -> 1.0)
    if (this.isTargetLocked && this.unfoldProgress < 1.0) {
      this.unfoldProgress = Math.min(1.0, this.unfoldProgress + 0.035);
    } else if (!this.isTargetLocked && this.unfoldProgress > 0) {
      this.unfoldProgress = Math.max(0, this.unfoldProgress - 0.05);
    }

    const easeUnfold = Math.sin((this.unfoldProgress * Math.PI) / 2);

    // Left Wing Slides Left (-0.28 units)
    if (this.leftWingGroup) {
      this.leftWingGroup.position.x = -0.28 * easeUnfold;
      this.leftWingGroup.rotation.z = 0.05 * (1 - easeUnfold);
    }

    // Right Wing Slides Right (+0.28 units)
    if (this.rightWingGroup) {
      this.rightWingGroup.position.x = 0.28 * easeUnfold;
      this.rightWingGroup.rotation.z = -0.05 * (1 - easeUnfold);
    }

    // Center Core Elevates Upward
    if (this.centerCoreGroup) {
      this.centerCoreGroup.position.y = 0.02 + 0.04 * easeUnfold;
      this.centerCoreGroup.rotation.y = time * 0.5;
    }

    // 2. Oscillating 3D Zen Fourier Waveform Synthesis
    if (this.fourierWaveGeometry) {
      const positions = this.fourierWaveGeometry.attributes.position.array as Float32Array;
      const waveWidth = 0.45;
      const is2026Active = this.activeMilestoneIndex === 3;
      const speed = is2026Active ? time * 5.0 : time * 2.5;
      const ampMult = is2026Active ? 1.5 : 0.8;

      for (let i = 0; i < this.WAVE_POINT_COUNT; i++) {
        const u = (i / (this.WAVE_POINT_COUNT - 1)) - 0.5;
        const x = u * waveWidth;
        
        // Fourier Series Synthesis: Fundamental + 2nd & 3rd Harmonics
        const f1 = Math.sin(u * 12.0 + speed) * 0.035;
        const f2 = Math.sin(u * 24.0 - speed * 1.5) * 0.015;
        const f3 = Math.cos(u * 36.0 + speed * 2.0) * 0.008;
        const y = (f1 + f2 + f3) * ampMult;
        const z = Math.cos(u * 8.0 + speed * 0.8) * 0.02;

        const idx = i * 3;
        positions[idx] = x;
        positions[idx + 1] = y;
        positions[idx + 2] = z;
      }
      this.fourierWaveGeometry.attributes.position.needsUpdate = true;
    }

    // 3. Laser Energy Spark Travelling along the Circuit
    if (this.laserPulseMesh) {
      const targets = [
        new THREE.Vector3(-0.28 - 0.35, 0.02, -0.07), // 2022
        new THREE.Vector3(-0.28 - 0.35, 0.02, 0.07),  // 2023
        new THREE.Vector3(0.28 + 0.35, 0.02, -0.07),  // 2024
        new THREE.Vector3(0.28 + 0.35, 0.02, 0.07)    // 2026
      ];
      const activeTarget = targets[this.activeMilestoneIndex] || targets[0];
      this.laserPulseMesh.position.lerp(activeTarget, 0.12);
    }

    // 4. Milestone Node Elevation & Hover
    this.milestoneNodeMeshes.forEach((node) => {
      const isActive = node.index === this.activeMilestoneIndex;
      const targetY = isActive ? node.basePos.y + 0.025 + Math.sin(time * 3) * 0.005 : node.basePos.y;
      node.mesh.position.y += (targetY - node.mesh.position.y) * 0.15;
    });

    // 5. Floating Project Card gentle bobbing
    if (this.activeProjectCardGroup) {
      this.activeProjectCardGroup.position.y = Math.sin(time * 2.0) * 0.012;
    }

    // 6. Particle Elevation
    if (this.particleGroup) {
      const positions = this.particleGroup.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += 0.002;
        if (positions[i] > 0.4) positions[i] = 0.01;
      }
      this.particleGroup.geometry.attributes.position.needsUpdate = true;
    }
  }

  public dispose(): void {
    this.pause();
    if (this.anchorGroup) {
      this.scene.remove(this.anchorGroup);
    }
  }
}
