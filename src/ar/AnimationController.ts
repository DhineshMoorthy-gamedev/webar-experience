import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ExperienceConfig } from '../config/experience.ts';

export class AnimationController {
  private mixer: THREE.AnimationMixer | null = null;
  private actions: THREE.AnimationAction[] = [];
  private modelRoot: THREE.Group | null = null;
  private isPlaying = false;
  private clock = new THREE.Clock();

  constructor(
    private scene: THREE.Scene,
    private anchorGroup: THREE.Group,
    private config: ExperienceConfig
  ) {}

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

    // Optimize materials for AR visibility and rendering
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

    // Add model to anchor group (so it tracks directly with the poster)
    this.anchorGroup.add(this.modelRoot);

    // Setup animation mixer if clips exist
    if (gltf.animations && gltf.animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(this.modelRoot);
      gltf.animations.forEach((clip: THREE.AnimationClip) => {
        const action = this.mixer!.clipAction(clip);
        action.setLoop(THREE.LoopRepeat, Infinity);
        this.actions.push(action);
      });
    }

    // Initially hide model until target is detected
    this.setVisible(false);
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(2, 4, 3);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x80d8ff, 0.8);
    fillLight.position.set(-2, -1, -2);
    this.scene.add(fillLight);
  }

  public play(): void {
    this.setVisible(true);
    if (this.actions.length > 0) {
      this.actions.forEach((action) => {
        action.paused = false;
        action.play();
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
  }

  public reset(): void {
    if (this.actions.length > 0) {
      this.actions.forEach((action) => {
        action.reset();
      });
    }
  }

  public setVisible(visible: boolean): void {
    if (this.modelRoot) {
      this.modelRoot.visible = visible;
    }
  }

  public update(): void {
    const delta = this.clock.getDelta();
    if (this.mixer && this.isPlaying) {
      this.mixer.update(delta);
    }
  }

  public dispose(): void {
    this.pause();
    if (this.modelRoot && this.anchorGroup) {
      this.anchorGroup.remove(this.modelRoot);
    }
  }
}
