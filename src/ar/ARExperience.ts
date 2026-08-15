import * as THREE from 'three';
import { ExperienceConfig } from '../config/experience.ts';
import { TargetTracker } from './TargetTracker.ts';
import { AnimationController } from './AnimationController.ts';

export interface ARExperienceCallbacks {
  onStatusChange?: (status: string) => void;
  onTargetFound?: () => void;
  onTargetLost?: () => void;
  onError?: (err: Error) => void;
  onReady?: () => void;
}

export class ARExperience {
  private tracker: TargetTracker | null = null;
  private animController: AnimationController | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private isRunning = false;
  private lostGraceTimeout: number | null = null;
  private readonly GRACE_PERIOD_MS = 750; // Keep tracking active across minor frame drops

  constructor(
    private container: HTMLElement,
    private config: ExperienceConfig,
    private callbacks: ARExperienceCallbacks = {}
  ) {}

  public async initialize(): Promise<void> {
    this.callbacks.onStatusChange?.('Initializing AR tracking engine...');

    this.tracker = new TargetTracker(this.container, this.config, {
      onTargetFound: () => {
        // Cancel pending target loss grace timeout
        if (this.lostGraceTimeout !== null) {
          window.clearTimeout(this.lostGraceTimeout);
          this.lostGraceTimeout = null;
        }

        if (this.animController && this.config.autoPlayAnimation) {
          this.animController.play();
        }
        this.callbacks.onTargetFound?.();
      },
      onTargetLost: () => {
        // Debounce target lost with grace period to prevent flickering/restarting
        if (this.lostGraceTimeout !== null) {
          window.clearTimeout(this.lostGraceTimeout);
        }

        this.lostGraceTimeout = window.setTimeout(() => {
          if (this.animController) {
            this.animController.pause();
          }
          this.callbacks.onTargetLost?.();
          this.lostGraceTimeout = null;
        }, this.GRACE_PERIOD_MS);
      },
      onError: (err) => {
        this.callbacks.onError?.(err);
      }
    });

    const { renderer, scene, camera, anchorGroup } = await this.tracker.init();
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    this.callbacks.onStatusChange?.('Loading 3D avatar & animations...');
    this.animController = new AnimationController(scene, anchorGroup, this.config);
    await this.animController.loadModel();

    this.callbacks.onStatusChange?.('AR Experience ready');
    this.callbacks.onReady?.();
  }

  public async start(): Promise<void> {
    if (!this.tracker || !this.renderer || !this.scene || !this.camera) {
      throw new Error('ARExperience not initialized. Call initialize() first.');
    }

    this.callbacks.onStatusChange?.('Starting camera video stream...');
    await this.tracker.start();
    this.isRunning = true;

    // Continuous 60fps render & animation loop
    this.renderer.setAnimationLoop(() => {
      if (this.isRunning) {
        if (this.animController) {
          this.animController.update();
        }
        if (this.scene && this.camera && this.renderer) {
          this.renderer.render(this.scene, this.camera);
        }
      }
    });

    this.callbacks.onStatusChange?.('Point camera at the poster');
  }

  public stop(): void {
    this.isRunning = false;
    if (this.lostGraceTimeout !== null) {
      window.clearTimeout(this.lostGraceTimeout);
      this.lostGraceTimeout = null;
    }
    if (this.renderer) {
      this.renderer.setAnimationLoop(null);
    }
    if (this.animController) {
      this.animController.pause();
    }
    if (this.tracker) {
      this.tracker.stop();
    }
  }

  public getAnimationController(): AnimationController | null {
    return this.animController;
  }
}
