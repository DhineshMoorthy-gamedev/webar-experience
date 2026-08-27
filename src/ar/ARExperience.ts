import { ExperienceConfig } from '../config/experience.ts';
import { TargetTracker, ImageTargetDetail } from './TargetTracker.ts';
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
  private isRunning = false;
  private lostGraceTimeout: number | null = null;
  private readonly GRACE_PERIOD_MS = 1200;
  private initPromise: Promise<void> | null = null;

  constructor(
    private container: HTMLElement,
    private config: ExperienceConfig,
    private callbacks: ARExperienceCallbacks = {}
  ) {}

  public async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      this.callbacks.onStatusChange?.('Configuring 8th Wall AR Pipeline...');

      this.tracker = new TargetTracker(this.container, this.config, {
        onSessionStarted: async (scene) => {
          try {
            this.callbacks.onStatusChange?.('Loading 3D holographic portfolio stage...');
            this.animController = new AnimationController(scene, this.config);
            await this.animController.loadModel();

            this.callbacks.onStatusChange?.('Scanning for Dhinesh Moorthy Visiting Card...');
            this.callbacks.onReady?.();
          } catch (err: any) {
            const error = err instanceof Error ? err : new Error(String(err));
            this.callbacks.onError?.(error);
          }
        },
        onTick: () => {
          if (this.isRunning && this.animController) {
            this.animController.update();
          }
        },
        onTargetFound: (detail: ImageTargetDetail) => {
          if (this.lostGraceTimeout !== null) {
            window.clearTimeout(this.lostGraceTimeout);
            this.lostGraceTimeout = null;
          }

          if (this.animController) {
            this.animController.updatePose(detail.position, detail.rotation, detail.scale);
            if (this.config.autoPlayAnimation) {
              this.animController.play();
            }
          }
          this.callbacks.onTargetFound?.();
        },
        onTargetUpdated: (detail: ImageTargetDetail) => {
          if (this.animController) {
            this.animController.updatePose(detail.position, detail.rotation, detail.scale);
          }
        },
        onTargetLost: () => {
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

      await this.tracker.init();
    })();

    return this.initPromise;
  }

  public setMilestone(index: number): void {
    if (this.animController) {
      this.animController.setMilestone(index);
    }
  }

  public async start(): Promise<void> {
    await this.initialize();

    if (!this.tracker) {
      throw new Error('Tracker could not be initialized.');
    }

    this.callbacks.onStatusChange?.('Requesting camera access...');
    await this.tracker.start();
    this.isRunning = true;
  }

  public stop(): void {
    this.isRunning = false;
    if (this.lostGraceTimeout !== null) {
      window.clearTimeout(this.lostGraceTimeout);
      this.lostGraceTimeout = null;
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
