import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ExperienceConfig } from '../config/experience.ts';
import { CareerMilestone, ProjectItem } from '../config/portfolio.ts';

export class AnimationController {
  private mixer: THREE.AnimationMixer | null = null;
  private actions: THREE.AnimationAction[] = [];
  private modelRoot: THREE.Group | null = null;
  private anchorGroup: THREE.Group;
  private isPlaying = false;
  private clock = new THREE.Clock();

  // 3D Holographic Stage Elements
  private pedestalGroup: THREE.Group;
  private cardsGroup: THREE.Group;
  private particleGroup: THREE.Points | null = null;
  private projectCardMeshes: THREE.Mesh[] = [];

  // Career Timeline State
  private activeMilestone: CareerMilestone;

  // Real-time tracking transforms
  private targetPos = new THREE.Vector3();
  private targetQuat = new THREE.Quaternion();
  private targetScaleVec = new THREE.Vector3(1, 1, 1);

  // Dynamic thresholds
  private readonly SNAP_DISTANCE_THRESHOLD = 0.35;
  private readonly SNAP_ANGLE_THRESHOLD = 0.30;
  private readonly FINE_LERP_FACTOR = 0.85;

  constructor(
    private scene: THREE.Scene,
    private config: ExperienceConfig
  ) {
    this.anchorGroup = new THREE.Group();
    this.anchorGroup.name = 'XR8_Target_Anchor';
    this.scene.add(this.anchorGroup);

    this.pedestalGroup = new THREE.Group();
    this.anchorGroup.add(this.pedestalGroup);

    this.cardsGroup = new THREE.Group();
    this.anchorGroup.add(this.cardsGroup);

    this.activeMilestone = this.config.portfolio.milestones[0];
  }

  public async loadModel(): Promise<void> {
    this.setupLighting();
    this.buildHolographicPedestal();
    this.buildHolographicParticles();

    const modelUrl = new URL(this.config.modelSrc, document.baseURI).href;
    const loader = new GLTFLoader();
    const gltf = await new Promise<GLTF>((resolve, reject) => {
      loader.load(
        modelUrl,
        (data) => resolve(data),
        undefined,
        (err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          reject(new Error(`Failed to load 3D model: ${msg}`));
        }
      );
    });

    this.modelRoot = gltf.scene;
    if (!this.modelRoot) {
      throw new Error('GLTF scene root is invalid');
    }

    const [sx, sy, sz] = this.config.modelScale;
    this.modelRoot.scale.set(sx, sy, sz);

    const [px, py, pz] = this.config.modelPosition;
    this.modelRoot.position.set(px, py, pz);

    const [rx, ry, rz] = this.config.modelRotation;
    this.modelRoot.rotation.set(rx, ry, rz);

    this.modelRoot.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => (mat.side = THREE.DoubleSide));
          } else {
            mesh.material.side = THREE.DoubleSide;
          }
        }
      }
    });

    this.anchorGroup.add(this.modelRoot);

    if (gltf.animations && gltf.animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(this.modelRoot);
      gltf.animations.forEach((clip: THREE.AnimationClip) => {
        const action = this.mixer!.clipAction(clip);
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.clampWhenFinished = false;
        this.actions.push(action);
      });
    }

    // Build the initial 3D Floating Project Cards
    this.build3DProjectCards(this.activeMilestone);

    this.setVisible(false);
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x00e5ff, 2.2);
    keyLight.position.set(2, 4, 3);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xff007f, 1.4);
    fillLight.position.set(-2, -1, -2);
    this.scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xffd600, 1.8, 10);
    rimLight.position.set(0, 2, -1.5);
    this.scene.add(rimLight);
  }

  private buildHolographicPedestal(): void {
    // Outer energy ring
    const ringGeo = new THREE.RingGeometry(0.55, 0.62, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -0.24;
    this.pedestalGroup.add(ringMesh);

    // Inner hex platform
    const innerRingGeo = new THREE.RingGeometry(0.35, 0.40, 6);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0xff007f,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const innerRingMesh = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRingMesh.rotation.x = Math.PI / 2;
    innerRingMesh.position.y = -0.24;
    this.pedestalGroup.add(innerRingMesh);

    // Holographic floor grid disc
    const discGeo = new THREE.CircleGeometry(0.54, 32);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0x0a192f,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    const discMesh = new THREE.Mesh(discGeo, discMat);
    discMesh.rotation.x = Math.PI / 2;
    discMesh.position.y = -0.245;
    this.pedestalGroup.add(discMesh);
  }

  private buildHolographicParticles(): void {
    const particleCount = 60;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 1.6;
      positions[i + 1] = Math.random() * 1.5 - 0.2;
      positions[i + 2] = (Math.random() - 0.5) * 1.6;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x00e5ff,
      size: 0.025,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.particleGroup = new THREE.Points(geometry, material);
    this.anchorGroup.add(this.particleGroup);
  }

  public setMilestone(index: number): void {
    const milestones = this.config.portfolio.milestones;
    if (index < 0 || index >= milestones.length) return;

    this.activeMilestone = milestones[index];

    // Rebuild and animate the 3D project cards
    this.build3DProjectCards(this.activeMilestone);
  }

  private build3DProjectCards(milestone: CareerMilestone): void {
    // Clear old card meshes
    while (this.cardsGroup.children.length > 0) {
      const obj = this.cardsGroup.children[0];
      this.cardsGroup.remove(obj);
    }
    this.projectCardMeshes = [];

    const projects = milestone.projects || [];
    const positions = [
      { x: -0.65, y: 0.35, z: 0.1, rotY: 0.25 },
      { x: 0.65, y: 0.35, z: 0.1, rotY: -0.25 }
    ];

    projects.slice(0, 2).forEach((proj, idx) => {
      const cardMesh = this.createCardMesh(proj, milestone.accentColor);
      const pos = positions[idx] || { x: 0, y: 0.6, z: 0, rotY: 0 };
      cardMesh.position.set(pos.x, pos.y, pos.z);
      cardMesh.rotation.y = pos.rotY;

      // Animate entry with spring scale
      cardMesh.scale.set(0.01, 0.01, 0.01);
      this.animateCardScale(cardMesh, 1.0);

      this.cardsGroup.add(cardMesh);
      this.projectCardMeshes.push(cardMesh);
    });
  }

  private createCardMesh(project: ProjectItem, accentColorHex: string): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Card Background
      ctx.fillStyle = '#0a1128';
      ctx.roundRect(0, 0, 512, 320, 20);
      ctx.fill();

      // Neon Gradient Border
      ctx.lineWidth = 8;
      ctx.strokeStyle = accentColorHex || '#00e5ff';
      ctx.stroke();

      // Header Badge
      ctx.fillStyle = accentColorHex || '#00e5ff';
      ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
      ctx.fillText(`${project.icon} ${project.badge}`, 24, 48);

      // Project Title
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 32px "Segoe UI", Arial, sans-serif';
      ctx.fillText(project.title, 24, 96);

      // Subtitle / Company
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.font = '600 20px "Segoe UI", Arial, sans-serif';
      ctx.fillText(`${project.subtitle} • ${project.company}`, 24, 130);

      // Divider line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(24, 150);
      ctx.lineTo(488, 150);
      ctx.stroke();

      // Tech Stack Badges
      ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = accentColorHex || '#00e5ff';
      const techText = `TECH: ${project.techStack.slice(0, 4).join(' • ')}`;
      ctx.fillText(techText, 24, 190);

      // Highlight bullet point
      ctx.fillStyle = '#e0e0e0';
      ctx.font = '16px "Segoe UI", Arial, sans-serif';
      const highlight = project.highlights[0] || project.description.substring(0, 50);
      ctx.fillText(`✦ ${highlight.substring(0, 48)}...`, 24, 235);

      // Tap CTA Pill
      ctx.fillStyle = 'rgba(0, 229, 255, 0.2)';
      ctx.roundRect(24, 260, 240, 38, 10);
      ctx.fill();
      ctx.strokeStyle = accentColorHex || '#00e5ff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
      ctx.fillText('🔍 TAP TO VIEW DETAILS', 40, 284);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const geo = new THREE.PlaneGeometry(0.55, 0.35);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true
    });

    const mesh = new THREE.Mesh(geo, mat);
    (mesh as any).projectData = project;
    return mesh;
  }

  private animateCardScale(mesh: THREE.Mesh, target: number): void {
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
    this.setVisible(true);

    if (this.actions.length > 0) {
      this.actions.forEach((action) => {
        if (!action.isRunning()) {
          action.play();
        }
        action.paused = false;
      });
      this.isPlaying = true;
    }
  }

  public pause(): void {
    if (this.actions.length > 0) {
      this.actions.forEach((action) => (action.paused = true));
      this.isPlaying = false;
    }
    this.setVisible(false);
  }

  public reset(): void {
    if (this.actions.length > 0) {
      this.actions.forEach((action) => action.reset());
    }
  }

  public setVisible(visible: boolean): void {
    if (this.anchorGroup) {
      this.anchorGroup.visible = visible;
    }
  }

  public update(): void {
    const rawDelta = this.clock.getDelta();
    const delta = Math.min(rawDelta, 0.05);

    if (this.mixer && this.isPlaying) {
      this.mixer.update(delta);
    }

    // Gentle float animation on 3D floating project cards
    const time = this.clock.getElapsedTime();
    if (this.cardsGroup) {
      this.cardsGroup.position.y = Math.sin(time * 2) * 0.02;
    }

    // Rotate holographic pedestal energy rings
    if (this.pedestalGroup) {
      this.pedestalGroup.rotation.y = time * 0.4;
    }

    // Particle elevation animation
    if (this.particleGroup) {
      const positions = this.particleGroup.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += 0.003;
        if (positions[i] > 1.4) {
          positions[i] = -0.2;
        }
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
