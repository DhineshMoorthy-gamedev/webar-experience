import * as THREE from 'three';
// Expose THREE globally for 8th Wall XR8.Threejs pipeline module
(window as any).THREE = THREE;

import './style.css';
import { DEFAULT_EXPERIENCE } from './config/experience.ts';
import { ARExperience } from './ar/ARExperience.ts';
import { UIController } from './ui/UIController.ts';

class App {
  private arExperience: ARExperience | null = null;
  private uiController: UIController | null = null;
  private arContainer: HTMLElement;
  private uiContainer: HTMLElement;

  constructor() {
    this.arContainer = document.getElementById('ar-container') as HTMLElement;
    this.uiContainer = document.getElementById('ui-container') as HTMLElement;

    if (!this.arContainer || !this.uiContainer) {
      throw new Error('Required DOM containers not found');
    }

    this.init();
  }

  private init(): void {
    this.uiController = new UIController(this.uiContainer, DEFAULT_EXPERIENCE, {
      onStartRequested: async () => {
        await this.startExperience();
      },
      onStopRequested: () => {
        this.stopExperience();
      },
      onRestartRequested: async () => {
        await this.restartExperience();
      },
      onMilestoneSelected: (index: number) => {
        if (this.arExperience) {
          this.arExperience.setMilestone(index);
        }
      }
    });

    // Create AR Experience instance
    this.arExperience = new ARExperience(this.arContainer, DEFAULT_EXPERIENCE, {
      onStatusChange: (status) => {
        this.uiController?.setStatusMessage(status);
      },
      onReady: () => {
        this.uiController?.setState('SCANNING');
      },
      onTargetFound: () => {
        this.uiController?.setState('TRACKING');
      },
      onTargetLost: () => {
        this.uiController?.setState('SCANNING');
      },
      onError: (err) => {
        console.error('AR Experience Error:', err);
        this.uiController?.setError('AR Tracking Error', err.message);
      }
    });

    // Pre-initialize in background on page load
    this.arExperience.initialize().catch((err) => {
      console.warn('Pre-initialize background note:', err);
    });
  }

  private async startExperience(): Promise<void> {
    if (!this.uiController || !this.arExperience) return;

    try {
      this.uiController.setState('STARTING', 'Starting Camera & AR Tracking...');
      await this.arExperience.start();
    } catch (err: unknown) {
      console.error('Failed to start experience:', err);
      const message = err instanceof Error ? err.message : String(err);
      this.uiController.setError('Camera / AR Initialization Failed', message);
      throw err;
    }
  }

  private stopExperience(): void {
    if (this.arExperience) {
      this.arExperience.stop();
    }
  }

  private async restartExperience(): Promise<void> {
    this.stopExperience();
    await this.startExperience();
  }
}

// Bootstrap application on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
