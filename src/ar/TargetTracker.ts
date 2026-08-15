import * as THREE from 'three';
import { ExperienceConfig } from '../config/experience.ts';

export interface TrackerCallbacks {
  onTargetFound?: () => void;
  onTargetLost?: () => void;
  onProgress?: (progress: number) => void;
  onError?: (err: Error) => void;
}

export interface MindARThreeInstance {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  addAnchor: (targetIndex: number) => {
    group: THREE.Group;
    targetIndex: number;
    onTargetFound?: () => void;
    onTargetLost?: () => void;
  };
  start: () => Promise<void>;
  stop: () => void;
}

type MindARThreeConstructor = new (options: Record<string, unknown>) => MindARThreeInstance;

export class TargetTracker {
  private mindarThree: MindARThreeInstance | null = null;
  private anchorGroup: THREE.Group | null = null;
  private isTracking = false;

  constructor(
    private container: HTMLElement,
    private config: ExperienceConfig,
    private callbacks: TrackerCallbacks = {}
  ) {}

  public async init(): Promise<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    anchorGroup: THREE.Group;
  }> {
    // Check for Secure Context & mediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (!window.isSecureContext) {
        throw new Error(
          'Camera access requires a Secure Context (HTTPS or localhost). Mobile browsers block camera access on plain HTTP IP addresses (e.g. http://192.168.x.x). Please connect via HTTPS.'
        );
      } else {
        throw new Error(
          'Your browser does not support camera media stream (navigator.mediaDevices.getUserMedia is unavailable).'
        );
      }
    }

    const MindARThreeClass = await this.loadMindARClass();

    // Resolve target src relative to base URI for GitHub Pages compatibility
    const targetUrl = new URL(this.config.targetSrc, document.baseURI).href;

    this.mindarThree = new MindARThreeClass({
      container: this.container,
      imageTargetSrc: targetUrl,
      filterMinCF: this.config.filterMinCF ?? 0.0001,
      filterBeta: this.config.filterBeta ?? 0.001,
      warmupTolerance: this.config.warmupTolerance ?? 5,
      missTolerance: this.config.missTolerance ?? 5
    });

    const anchor = this.mindarThree.addAnchor(0);
    this.anchorGroup = anchor.group;

    anchor.onTargetFound = () => {
      this.isTracking = true;
      this.callbacks.onTargetFound?.();
    };

    anchor.onTargetLost = () => {
      this.isTracking = false;
      this.callbacks.onTargetLost?.();
    };

    return {
      renderer: this.mindarThree.renderer,
      scene: this.mindarThree.scene,
      camera: this.mindarThree.camera,
      anchorGroup: this.anchorGroup
    };
  }

  public async start(): Promise<void> {
    if (!this.mindarThree) {
      throw new Error('TargetTracker not initialized. Call init() first.');
    }

    try {
      await this.mindarThree.start();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.callbacks.onError?.(error);
      throw error;
    }
  }

  public stop(): void {
    if (this.mindarThree) {
      this.mindarThree.stop();
      this.isTracking = false;
    }
  }

  public getIsTracking(): boolean {
    return this.isTracking;
  }

  public getAnchorGroup(): THREE.Group | null {
    return this.anchorGroup;
  }

  private async loadMindARClass(): Promise<MindARThreeConstructor> {
    const globalCls = (window as any).MINDAR?.IMAGE?.MindARThree;
    if (globalCls) return globalCls;

    const scriptUrl = new URL('libs/mindar-image-three.prod.js', document.baseURI).href;

    try {
      const mod: any = await import(/* @vite-ignore */ scriptUrl);
      const Cls = mod.MindARThree || (window as any).MINDAR?.IMAGE?.MindARThree;
      if (Cls) return Cls;
    } catch (err) {
      console.warn('Direct dynamic import failed, loading module script tag...', err);
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.textContent = `
        import { MindARThree } from '${scriptUrl}';
        window.MINDAR = window.MINDAR || {};
        window.MINDAR.IMAGE = window.MINDAR.IMAGE || {};
        window.MINDAR.IMAGE.MindARThree = MindARThree;
        window.dispatchEvent(new CustomEvent('mindar-loaded'));
      `;
      window.addEventListener('mindar-loaded', () => {
        const Cls = (window as any).MINDAR?.IMAGE?.MindARThree;
        if (Cls) resolve(Cls);
        else reject(new Error('Failed to retrieve MindARThree from global'));
      }, { once: true });
      script.onerror = () => reject(new Error(`Failed to load MindAR from ${scriptUrl}`));
      document.head.appendChild(script);
    });
  }
}
