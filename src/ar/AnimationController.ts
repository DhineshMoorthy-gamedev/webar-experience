import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ExperienceConfig } from '../config/experience.ts';

export class AnimationController {
  private mixer: THREE.AnimationMixer | null = null;
  private actions: THREE.AnimationAction[] = [];
  private modelRoot: THREE.Group | null = null;
  private smoothedGroup: THREE.Group;
  private isPlaying = false;
  private isTargetVisible = false;
  private isFirstDetection = true;
  private clock = new THREE.Clock();

  // Temporary vectors for matrix calculations (avoids GC allocations in render loop)
  private targetWorldPos = new THREE.Vector3();
  private targetWorldQuat = new THREE.Quaternion();
  private targetWorldScale = new THREE.Vector3(1, 1, 1);

  // Smoothing interpolation factors (0.18 gives rock-solid stability with smooth tracking)
  private readonly POS_LERP_FACTOR = 0.18;
  private readonly ROT_SLERP_FACTOR = 0.18;
  private readonly SCALE_LERP_FACTOR = 0.20;

  constructor(
    private scene: THREE.Scene,
    private anchorGroup: THREE.Group,
    private config: ExperienceConfig
  ) {
    // Smoothed group is attached to scene root and interpolated every frame
    this.smoothedGroup = new THREE.Group();
    this.smoothedGroup.name = 'Smoothed_AR_Container';
    this.scene.add(this.smoothedGroup);
  }

  public async loadModel(): Promise<void> {
    this.setupLighting();

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

    // Apply transforms from config
    const [sx, sy, sz] = this.config.modelScale;
    this.modelRoot.scale.set(sx, sy, sz);

    const [px, py, pz] = this.config.modelPosition;
    this.modelRoot.position.set(px, py, pz);

    const [rx, ry, rz] = this.config.modelRotation;
    this.modelRoot.rotation.set(rx, ry, rz);

    // Optimize materials for AR rendering
    this.modelRoot.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => {
              mat.side = THREE.DoubleSide;
            });
          } else {
            mesh.material.side = THREE.DoubleSide;
          }
        }
      }
    });

    // Add model to smoothedGroup
    this.smoothedGroup.add(this.modelRoot);

    // Setup animation mixer if clips exist
    if (gltf.animations && gltf.animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(this.modelRoot);
      gltf.animations.forEach((clip: THREE.AnimationClip) => {
        const action = this.mixer!.clipAction(clip);
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.clampWhenFinished = false;
        this.actions.push(action);
      });
    }

    // Initially hide model until target is detected
    this.setVisible(false);
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(2, 4, 3);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x80d8ff, 0.8);
    fillLight.position.set(-2, -1, -2);
    this.scene.add(fillLight);
  }

  public play(): void {
    this.isTargetVisible = true;
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
    this.isTargetVisible = false;
    this.isFirstDetection = true;

    if (this.actions.length > 0) {
      this.actions.forEach((action) => {
        action.paused = true;
      });
      this.isPlaying = false;
    }
    this.setVisible(false);
  }

  public reset(): void {
    if (this.actions.length > 0) {
      this.actions.forEach((action) => {
        action.reset();
      });
    }
  }

  public setVisible(visible: boolean): void {
    if (this.smoothedGroup) {
      this.smoothedGroup.visible = visible;
    }
  }

  public update(): void {
    const rawDelta = this.clock.getDelta();
    const delta = Math.min(rawDelta, 0.05);

    // Update 3D animation timeline
    if (this.mixer && this.isPlaying) {
      this.mixer.update(delta);
    }

    // Pose stabilization via Lerp & Slerp
    if (this.isTargetVisible && this.anchorGroup.visible) {
      this.anchorGroup.getWorldPosition(this.targetWorldPos);
      this.anchorGroup.getWorldQuaternion(this.targetWorldQuat);
      this.anchorGroup.getWorldScale(this.targetWorldScale);

      if (this.isFirstDetection) {
        // Snap immediately on first frame lock
        this.smoothedGroup.position.copy(this.targetWorldPos);
        this.smoothedGroup.quaternion.copy(this.targetWorldQuat);
        this.smoothedGroup.scale.copy(this.targetWorldScale);
        this.isFirstDetection = false;
      } else {
        // Smoothly interpolate position (Vector3.lerp)
        this.smoothedGroup.position.lerp(this.targetWorldPos, this.POS_LERP_FACTOR);
        // Smoothly interpolate rotation (Quaternion.slerp)
        this.smoothedGroup.quaternion.slerp(this.targetWorldQuat, this.ROT_SLERP_FACTOR);
        // Smoothly interpolate scale
        this.smoothedGroup.scale.lerp(this.targetWorldScale, this.SCALE_LERP_FACTOR);
      }
    }
  }

  public dispose(): void {
    this.pause();
    if (this.smoothedGroup) {
      this.scene.remove(this.smoothedGroup);
    }
  }
}
