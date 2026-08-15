import * as THREE from 'three';
(window as any).THREE = THREE;
import { ExperienceConfig } from '../config/experience.ts';

export interface ImageTargetDetail {
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  scale: number;
}

export interface TrackerCallbacks {
  onSessionStarted?: (scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) => void;
  onTargetFound?: (detail: ImageTargetDetail) => void;
  onTargetUpdated?: (detail: ImageTargetDetail) => void;
  onTargetLost?: () => void;
  onTick?: () => void;
  onError?: (err: Error) => void;
}

declare global {
  interface Window {
    XR8?: any;
  }
}

export class TargetTracker {
  private isTracking = false;
  private canvasElement: HTMLCanvasElement;
  private isInitialized = false;
  private xr8Promise: Promise<any> | null = null;

  constructor(
    private container: HTMLElement,
    private config: ExperienceConfig,
    private callbacks: TrackerCallbacks = {}
  ) {
    let canvas = this.container.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'camera-canvas';
      this.container.appendChild(canvas);
    }
    
    // Set high-DPI canvas resolution for crisp rendering
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.objectFit = 'cover';

    this.canvasElement = canvas;
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (!window.isSecureContext) {
        throw new Error(
          'Camera access requires a Secure Context (HTTPS or localhost). Please connect via HTTPS.'
        );
      } else {
        throw new Error('Your browser does not support camera media streams.');
      }
    }

    const XR8 = await this.loadXR8();
    if (!XR8) {
      throw new Error('8th Wall XR8 engine failed to initialize.');
    }

    // Explicitly load the SLAM and image tracking engine chunk
    await XR8.loadChunk('slam');

    // Load Target Descriptor JSON
    const jsonUrl = new URL(this.config.targetJsonSrc, document.baseURI).href;
    let targetJsonData: any = null;
    try {
      const resp = await fetch(jsonUrl);
      if (resp.ok) {
        targetJsonData = await resp.json();
      }
    } catch (e) {
      console.warn('Could not fetch target JSON descriptor:', e);
    }

    const anyDevice = XR8.XrConfig.device().ANY;

    // Create 8th Wall custom pipeline module
    const customPipelineModule = {
      name: 'webar-image-tracker',
      onStart: () => {
        try {
          const { scene, camera, renderer } = XR8.Threejs.xrScene();
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
          this.callbacks.onSessionStarted?.(scene, camera, renderer);
        } catch (err: any) {
          this.callbacks.onError?.(err);
        }
      },
      onUpdate: () => {
        this.callbacks.onTick?.();
      },
      listeners: [
        {
          event: 'reality.imagefound',
          process: ({ detail }: { detail: ImageTargetDetail }) => {
            this.isTracking = true;
            this.callbacks.onTargetFound?.(detail);
          }
        },
        {
          event: 'reality.imageupdated',
          process: ({ detail }: { detail: ImageTargetDetail }) => {
            this.callbacks.onTargetUpdated?.(detail);
          }
        },
        {
          event: 'reality.imagelost',
          process: () => {
            this.isTracking = false;
            this.callbacks.onTargetLost?.();
          }
        }
      ]
    };

    // Instantiate pipeline modules and register them
    const glModule = XR8.GlTextureRenderer.pipelineModule();
    const threeModule = XR8.Threejs.pipelineModule();
    const xrModule = XR8.XrController.pipelineModule();

    XR8.addCameraPipelineModules([
      glModule,
      threeModule,
      xrModule,
      customPipelineModule
    ]);

    // Configure Three.js and XrController for all devices
    XR8.Threejs.configure({
      cameraDirection: 'back',
      allowedDevices: anyDevice
    });

    const xrConfig: any = {
      allowedDevices: anyDevice,
      disableWorldTracking: true
    };

    if (targetJsonData) {
      xrConfig.imageTargetData = [targetJsonData];
    } else {
      xrConfig.imageTargets = ['sample-poster'];
    }

    XR8.XrController.configure(xrConfig);

    this.isInitialized = true;
  }

  public async start(): Promise<void> {
    const XR8 = await this.loadXR8();
    if (!XR8) {
      throw new Error('8th Wall XR8 engine not loaded.');
    }

    // Ensure canvas is visible for active camera rendering
    this.canvasElement.style.display = 'block';

    const anyDevice = XR8.XrConfig.device().ANY;

    try {
      XR8.run({
        canvas: this.canvasElement,
        allowedDevices: anyDevice,
        verbose: true
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.callbacks.onError?.(error);
      throw error;
    }
  }

  public stop(): void {
    const XR8 = window.XR8;
    if (XR8) {
      try {
        XR8.stop();
      } catch (e) {
        console.warn('XR8 stop warning:', e);
      }
      this.isTracking = false;
    }

    // Stop all media stream camera tracks and release hardware camera lock
    try {
      document.querySelectorAll('video').forEach((video) => {
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
          video.srcObject = null;
        }
        video.remove();
      });
    } catch (e) {
      console.warn('Camera track cleanup warning:', e);
    }

    // Hide canvas and clear WebGL context so frozen frame does not persist
    if (this.canvasElement) {
      this.canvasElement.style.display = 'none';
      try {
        const gl = this.canvasElement.getContext('webgl2') || this.canvasElement.getContext('webgl');
        if (gl) {
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }
      } catch (e) {}
    }
  }

  public getIsTracking(): boolean {
    return this.isTracking;
  }

  private async loadXR8(): Promise<any> {
    if (window.XR8) {
      return window.XR8;
    }

    if (this.xr8Promise) {
      return this.xr8Promise;
    }

    this.xr8Promise = new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (window.XR8) {
          clearInterval(checkInterval);
          resolve(window.XR8);
        }
      }, 50);

      window.addEventListener('xrloaded', () => {
        clearInterval(checkInterval);
        resolve(window.XR8);
      }, { once: true });

      setTimeout(() => {
        clearInterval(checkInterval);
        if (window.XR8) resolve(window.XR8);
        else reject(new Error('Timed out waiting for 8th Wall XR8 engine.'));
      }, 30000);
    });

    return this.xr8Promise;
  }
}
