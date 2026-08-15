import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ExperienceConfig } from '../config/experience.ts';

export class AnimationController {
  private mixer: THREE.AnimationMixer | null = null;
  private actions: THREE.AnimationAction[] = [];
  private modelRoot: THREE.Group | null = null;
  private anchorGroup: THREE.Group;
  private isPlaying = false;
  private clock = new THREE.Clock();

  // Instant real-time tracking transforms
  private targetPos = new THREE.Vector3();
  private targetQuat = new THREE.Quaternion();
  private targetScaleVec = new THREE.Vector3(1, 1, 1);

  // Dynamic threshold for instant snapping vs fine smoothing
  private readonly SNAP_DISTANCE_THRESHOLD = 0.35; // Three.js units
  private readonly SNAP_ANGLE_THRESHOLD = 0.30;    // Radians (~17 degrees)
  private readonly FINE_LERP_FACTOR = 0.85;

  constructor(
    private scene: THREE.Scene,
    private config: ExperienceConfig
  ) {
    this.anchorGroup = new THREE.Group();
    this.anchorGroup.name = 'XR8_Target_Anchor';
    this.scene.add(this.anchorGroup);
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

    // Optimize materials for rendering
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

  public updatePose(pos: { x: number; y: number; z: number }, rot: { x: number; y: number; z: number; w: number }, scale?: number): void {
    this.targetPos.set(pos.x, pos.y, pos.z);
    this.targetQuat.set(rot.x, rot.y, rot.z, rot.w);
    if (scale) {
      this.targetScaleVec.set(scale, scale, scale);
    }

    const posDelta = this.anchorGroup.position.distanceTo(this.targetPos);
    const rotDelta = this.anchorGroup.quaternion.angleTo(this.targetQuat);

    // Adaptive Snapping: If movement is fast (large delta), snap instantly to eliminate catch-up lag
    if (posDelta > this.SNAP_DISTANCE_THRESHOLD || rotDelta > this.SNAP_ANGLE_THRESHOLD) {
      this.anchorGroup.position.copy(this.targetPos);
      this.anchorGroup.quaternion.copy(this.targetQuat);
      this.anchorGroup.scale.copy(this.targetScaleVec);
    } else {
      // Fine Smoothing: Gentle interpolation to eliminate hand tremors/jitter
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
  }

  public dispose(): void {
    this.pause();
    if (this.anchorGroup) {
      this.scene.remove(this.anchorGroup);
    }
  }
}
