import { ExperienceConfig } from '../config/experience.ts';

export type AppState = 'IDLE' | 'STARTING' | 'SCANNING' | 'TRACKING' | 'ERROR';

export interface UIControllerCallbacks {
  onStartRequested: () => Promise<void>;
  onStopRequested: () => void;
  onRestartRequested: () => void;
}

export class UIController {
  private currentState: AppState = 'IDLE';
  private rootElement: HTMLElement;
  private statusTextElement: HTMLElement | null = null;
  private errorDetailElement: HTMLElement | null = null;
  private posterModalElement: HTMLElement | null = null;

  constructor(
    private container: HTMLElement,
    private config: ExperienceConfig,
    private callbacks: UIControllerCallbacks
  ) {
    this.rootElement = document.createElement('div');
    this.rootElement.className = 'webar-ui-root';
    this.container.appendChild(this.rootElement);
    this.render();
  }

  public setState(state: AppState, statusMessage?: string): void {
    this.currentState = state;
    this.updateStateView();
    if (statusMessage) {
      this.setStatusMessage(statusMessage);
    }
  }

  public getState(): AppState {
    return this.currentState;
  }

  public setStatusMessage(msg: string): void {
    if (this.statusTextElement) {
      this.statusTextElement.textContent = msg;
    }
  }

  public setError(title: string, detail: string): void {
    this.setState('ERROR');
    const titleEl = this.rootElement.querySelector('.error-title');
    if (titleEl) titleEl.textContent = title;
    if (this.errorDetailElement) this.errorDetailElement.textContent = detail;
  }

  private render(): void {
    this.rootElement.innerHTML = `
      <!-- 1. IDLE Screen -->
      <section class="ui-screen ui-screen-idle" id="screen-idle">
        <div class="idle-card glass-panel">
          <div class="brand-badge">
            <span class="badge-dot"></span>
            <span>WebAR Engine v1.0</span>
          </div>
          
          <h1 class="main-title">${this.config.title}</h1>
          <p class="main-desc">${this.config.description}</p>

          <div class="poster-preview-card" id="btn-open-poster-preview">
            <div class="preview-thumbnail">
              <img src="${this.config.posterImageSrc}" alt="Target Poster Preview" />
            </div>
            <div class="preview-meta">
              <span class="preview-label">Target Poster</span>
              <span class="preview-name">sample-poster.jpg</span>
              <span class="preview-hint">Tap to view / present on laptop</span>
            </div>
          </div>

          <div class="action-section">
            <button class="primary-btn" id="btn-start-camera">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
              <span>START CAMERA</span>
            </button>
            <p class="permission-notice">Requires camera access to detect and track the AR poster.</p>
          </div>
        </div>
      </section>

      <!-- 2. STARTING / Loading Screen -->
      <section class="ui-screen ui-screen-starting" id="screen-starting">
        <div class="loading-card glass-panel">
          <div class="radar-spinner">
            <div class="radar-ring r1"></div>
            <div class="radar-ring r2"></div>
            <div class="radar-core"></div>
            <div class="radar-sweep"></div>
          </div>
          <h2 class="loading-title">Initializing Experience</h2>
          <p class="loading-status" id="loading-status-text">Loading HD Camera & AR Engine...</p>
        </div>
      </section>

      <!-- 3. Active AR Viewfinder & Overlay (FULL SCREEN EDGE-TO-EDGE) -->
      <section class="ui-screen ui-screen-active" id="screen-active">
        <!-- Top Navigation / Status Header -->
        <header class="ar-hud-header">
          <div class="tracking-pill" id="tracking-status-pill">
            <span class="pill-beacon"></span>
            <span class="pill-text" id="hud-status-text">Scanning full screen for poster...</span>
          </div>

          <div class="hud-actions">
            <button class="icon-btn" id="btn-show-target-hud" title="View Target Poster">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </button>
            <button class="icon-btn" id="btn-stop-camera" title="Stop AR">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </header>

        <!-- Full-Screen Viewfinder Frame (Spans Full Screen) -->
        <div class="fullscreen-scan-frame" id="viewfinder-frame">
          <div class="fs-corner fs-corner-tl"></div>
          <div class="fs-corner fs-corner-tr"></div>
          <div class="fs-corner fs-corner-bl"></div>
          <div class="fs-corner fs-corner-br"></div>
          <div class="fullscreen-scan-beam"></div>
        </div>

        <div class="bottom-hud-bar">
          <aside class="mini-target-badge" id="mini-target-badge">
            <img src="${this.config.posterImageSrc}" alt="Target Thumbnail" />
            <span>Target Poster</span>
          </aside>
          <div class="viewfinder-hint" id="viewfinder-hint">Scan from any distance (point anywhere at poster)</div>
        </div>
      </section>

      <!-- 4. ERROR Modal -->
      <section class="ui-screen ui-screen-error" id="screen-error">
        <div class="error-card glass-panel">
          <div class="error-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff4d4f" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2 class="error-title">Camera Access Required</h2>
          <p class="error-detail" id="error-detail-text">
            Camera permission was not granted or your browser does not support WebGL/WebRTC camera streams.
          </p>
          <div class="troubleshoot-tips">
            <p><strong>Troubleshooting:</strong></p>
            <ul>
              <li>Ensure camera permission is allowed in browser site settings.</li>
              <li>Connect via HTTPS (e.g. https://192.168.x.x:5173).</li>
              <li>Use Google Chrome, Safari, or Microsoft Edge.</li>
            </ul>
          </div>
          <button class="primary-btn" id="btn-retry">
            <span>TRY AGAIN</span>
          </button>
        </div>
      </section>

      <!-- 5. Modal: Poster Preview & Fullscreen Presentation Mode -->
      <div class="poster-modal" id="poster-modal" style="display: none;">
        <div class="poster-modal-backdrop" id="poster-modal-backdrop"></div>
        <div class="poster-modal-content glass-panel" id="poster-modal-content">
          <!-- Floating Exit Button in Maximized Mode -->
          <button class="exit-maximized-btn" id="btn-exit-maximized-poster">
            ✕ Exit Fullscreen
          </button>
          <div class="modal-header">
            <h3>Sample AR Target Poster</h3>
            <button class="close-btn" id="btn-close-poster-modal">✕</button>
          </div>
          <div class="modal-body">
            <p class="modal-hint">Display this poster on your laptop or print it for testing:</p>
            <div class="full-poster-wrapper" id="poster-display-box">
              <img src="${this.config.posterImageSrc}" alt="AR Sample Poster" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="primary-btn-sm" id="btn-toggle-fullscreen-poster">
              🖥️ Maximize On Screen (Best for Phone Scanning)
            </button>
            <a href="${this.config.posterImageSrc}" download="sample-poster.jpg" class="secondary-btn">
              Download Image
            </a>
          </div>
        </div>
      </div>
    `;

    this.statusTextElement = this.rootElement.querySelector('#loading-status-text');
    this.errorDetailElement = this.rootElement.querySelector('#error-detail-text');
    this.posterModalElement = this.rootElement.querySelector('#poster-modal');

    this.bindEvents();
    this.updateStateView();
  }

  private bindEvents(): void {
    const startBtn = this.rootElement.querySelector('#btn-start-camera');
    startBtn?.addEventListener('click', async () => {
      this.setState('STARTING');
      try {
        await this.callbacks.onStartRequested();
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        this.setError('Failed to start AR', error.message);
      }
    });

    const stopBtn = this.rootElement.querySelector('#btn-stop-camera');
    stopBtn?.addEventListener('click', () => {
      this.callbacks.onStopRequested();
      this.setState('IDLE');
    });

    const retryBtn = this.rootElement.querySelector('#btn-retry');
    retryBtn?.addEventListener('click', () => {
      this.callbacks.onRestartRequested();
    });

    // Poster Modal Triggers
    const openModalBtn = this.rootElement.querySelector('#btn-open-poster-preview');
    openModalBtn?.addEventListener('click', () => this.showPosterModal(true));

    const hudTargetBtn = this.rootElement.querySelector('#btn-show-target-hud');
    hudTargetBtn?.addEventListener('click', () => this.showPosterModal(true));

    const miniBadge = this.rootElement.querySelector('#mini-target-badge');
    miniBadge?.addEventListener('click', () => this.showPosterModal(true));

    const closeModalBtn = this.rootElement.querySelector('#btn-close-poster-modal');
    closeModalBtn?.addEventListener('click', () => this.showPosterModal(false));

    const backdrop = this.rootElement.querySelector('#poster-modal-backdrop');
    backdrop?.addEventListener('click', () => {
      if (this.posterModalElement?.classList.contains('is-maximized')) {
        this.toggleMaximizePoster(false);
      } else {
        this.showPosterModal(false);
      }
    });

    // Universal Dual-Engine Fullscreen Presentation Toggle
    const fsBtn = this.rootElement.querySelector('#btn-toggle-fullscreen-poster');
    fsBtn?.addEventListener('click', () => this.toggleMaximizePoster(true));

    const exitFsBtn = this.rootElement.querySelector('#btn-exit-maximized-poster');
    exitFsBtn?.addEventListener('click', () => this.toggleMaximizePoster(false));

    // Listen for browser native fullscreen changes
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && this.posterModalElement?.classList.contains('is-maximized')) {
        this.toggleMaximizePoster(false, false);
      }
    });

    // Keyboard ESC to exit
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.posterModalElement?.classList.contains('is-maximized')) {
        this.toggleMaximizePoster(false);
      }
    });
  }

  private toggleMaximizePoster(maximize: boolean, syncNative = true): void {
    if (!this.posterModalElement) return;

    if (maximize) {
      this.posterModalElement.classList.add('is-maximized');
      if (syncNative) {
        const el = this.posterModalElement as any;
        const requestFS = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
        if (typeof requestFS === 'function') {
          requestFS.call(el).catch(() => {});
        }
      }
    } else {
      this.posterModalElement.classList.remove('is-maximized');
      if (syncNative && document.fullscreenElement) {
        const doc = document as any;
        const exitFS = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
        if (typeof exitFS === 'function') {
          exitFS.call(doc).catch(() => {});
        }
      }
    }
  }

  private showPosterModal(show: boolean): void {
    if (this.posterModalElement) {
      if (!show) {
        this.toggleMaximizePoster(false);
      }
      this.posterModalElement.style.display = show ? 'flex' : 'none';
    }
  }

  private updateStateView(): void {
    const idleScreen = this.rootElement.querySelector('#screen-idle') as HTMLElement;
    const startingScreen = this.rootElement.querySelector('#screen-starting') as HTMLElement;
    const activeScreen = this.rootElement.querySelector('#screen-active') as HTMLElement;
    const errorScreen = this.rootElement.querySelector('#screen-error') as HTMLElement;

    const trackingPill = this.rootElement.querySelector('#tracking-status-pill') as HTMLElement;
    const hudStatusText = this.rootElement.querySelector('#hud-status-text') as HTMLElement;
    const viewfinderFrame = this.rootElement.querySelector('#viewfinder-frame') as HTMLElement;
    const viewfinderHint = this.rootElement.querySelector('#viewfinder-hint') as HTMLElement;

    if (idleScreen) idleScreen.style.display = this.currentState === 'IDLE' ? 'flex' : 'none';
    if (startingScreen) startingScreen.style.display = this.currentState === 'STARTING' ? 'flex' : 'none';
    if (activeScreen) {
      activeScreen.style.display = (this.currentState === 'SCANNING' || this.currentState === 'TRACKING') ? 'flex' : 'none';
    }
    if (errorScreen) errorScreen.style.display = this.currentState === 'ERROR' ? 'flex' : 'none';

    if (this.currentState === 'SCANNING') {
      if (trackingPill) {
        trackingPill.classList.remove('tracking-active');
        trackingPill.classList.add('tracking-searching');
      }
      if (hudStatusText) hudStatusText.textContent = 'Scanning full screen for poster...';
      if (viewfinderFrame) viewfinderFrame.classList.remove('tracking-locked');
      if (viewfinderHint) viewfinderHint.textContent = 'Scan anywhere across screen (natural distance)';
    } else if (this.currentState === 'TRACKING') {
      if (trackingPill) {
        trackingPill.classList.remove('tracking-searching');
        trackingPill.classList.add('tracking-active');
      }
      if (hudStatusText) hudStatusText.textContent = '✓ Poster Detected';
      if (viewfinderFrame) viewfinderFrame.classList.add('tracking-locked');
      if (viewfinderHint) viewfinderHint.textContent = 'Animation Active & Locked';
    }
  }
}
