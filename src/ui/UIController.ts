import { ExperienceConfig } from '../config/experience.ts';
import { ProjectItem } from '../config/portfolio.ts';

export interface UICallbacks {
  onStartRequested: () => Promise<void>;
  onStopRequested: () => void;
  onRestartRequested: () => Promise<void>;
  onMilestoneSelected?: (index: number) => void;
  onRotateRequested?: () => number;
}

export type UIState = 'IDLE' | 'STARTING' | 'SCANNING' | 'TRACKING' | 'ERROR';

export class UIController {
  private currentState: UIState = 'IDLE';
  private statusTextElement: HTMLElement | null = null;
  private errorDetailElement: HTMLElement | null = null;
  private posterModalElement: HTMLElement | null = null;
  private projectDetailsModalElement: HTMLElement | null = null;
  
  // Timeline State
  private currentMilestoneIndex = 0;
  private isAutoPlaying = false;
  private autoPlayTimer: number | null = null;
  private readonly AUTO_PLAY_INTERVAL_MS = 5000;

  constructor(
    private rootElement: HTMLElement,
    private config: ExperienceConfig,
    private callbacks: UICallbacks
  ) {
    this.render();
  }

  public setState(state: UIState, message?: string): void {
    this.currentState = state;
    this.updateStateView();

    if (message && this.statusTextElement) {
      this.statusTextElement.textContent = message;
    }

    if (state === 'TRACKING') {
      this.updateActiveMilestoneUI();
    }
  }

  public setStatusMessage(message: string): void {
    if (this.statusTextElement) {
      this.statusTextElement.textContent = message;
    }
    const hudStatus = this.rootElement.querySelector('#hud-status-text');
    if (hudStatus) {
      hudStatus.textContent = message;
    }
  }

  public setError(title: string, detail: string): void {
    this.currentState = 'ERROR';
    this.updateStateView();

    const errTitle = this.rootElement.querySelector('#error-title-text');
    if (errTitle) errTitle.textContent = title;
    if (this.errorDetailElement) this.errorDetailElement.textContent = detail;
  }

  private render(): void {
    const portfolio = this.config.portfolio;
    const milestones = portfolio.milestones;

    this.rootElement.innerHTML = `
      <!-- 1. Idle Hero View: Game Dev Portfolio Greeting -->
      <section class="ui-screen" id="screen-idle">
        <div class="glass-panel hero-card">
          <div class="hero-header">
            <div class="badge-pill">🚀 WebAR Portfolio</div>
            <div class="live-dot-container">
              <span class="live-dot"></span>
              <span class="live-text">8th Wall CV</span>
            </div>
          </div>
          
          <h1 class="hero-title">${portfolio.developerName}</h1>
          <p class="hero-role">${portfolio.title} • <span class="highlight-studio">${portfolio.studio}</span></p>
          <p class="hero-subtitle">${portfolio.tagline}</p>

          <div class="featured-game-chip" id="btn-hero-zen-fourier">
            <span class="chip-icon">🌌</span>
            <div class="chip-text">
              <span class="chip-label">FLAGSHIP INDIE TITLE</span>
              <span class="chip-title">${portfolio.flagshipGame}</span>
            </div>
            <span class="chip-arrow">➔</span>
          </div>

          <div class="hero-actions">
            <button class="primary-btn pulse" id="btn-start-camera">
              <span class="btn-icon">📷</span>
              <span>LAUNCH AR PORTFOLIO</span>
            </button>
            <button class="secondary-btn" id="btn-open-poster-preview">
              <span class="btn-icon">🪪</span>
              <span>View Business Card Target</span>
            </button>
          </div>

          <div class="social-bar">
            <a href="${portfolio.socials.github}" target="_blank" rel="noopener" class="social-btn" title="GitHub">
              <span>🐙 GitHub</span>
            </a>
            <a href="${portfolio.socials.linkedin}" target="_blank" rel="noopener" class="social-btn" title="LinkedIn">
              <span>💼 LinkedIn</span>
            </a>
            <a href="${portfolio.socials.email}" class="social-btn" title="Email">
              <span>✉️ Contact</span>
            </a>
          </div>
        </div>
      </section>

      <!-- 2. Starting / Initializing View -->
      <section class="ui-screen" id="screen-starting" style="display: none;">
        <div class="glass-panel status-card">
          <div class="spinner-ring"></div>
          <h3>Initializing AR Hologram...</h3>
          <p id="loading-status-text">Accessing camera and loading 3D assets...</p>
        </div>
      </section>

      <!-- 3. Active Scanning & Tracking HUD Overlay -->
      <section class="ui-screen" id="screen-active" style="display: none;">
        <!-- Top Navigation Bar -->
        <header class="hud-top-bar">
          <div class="hud-pill" id="tracking-status-pill">
            <span class="status-indicator"></span>
            <span id="hud-status-text">Scanning for Card...</span>
          </div>

          <div class="hud-right-actions">
            <button class="icon-btn-glass" id="btn-rotate-hud" title="Rotate 3D Alignment">
              🔄 Rotate
            </button>
            <button class="icon-btn-glass" id="btn-show-target-hud" title="Show Target Card">
              🪪 Target
            </button>
            <button class="icon-btn-glass" id="btn-stop-camera" title="Exit AR">
              ✕
            </button>
          </div>
        </header>

        <!-- Fullscreen Scanning Viewfinder Frame -->
        <div class="viewfinder-container" id="viewfinder-frame">
          <div class="hud-scanner-line"></div>
          <div class="corner-bracket top-left"></div>
          <div class="corner-bracket top-right"></div>
          <div class="corner-bracket bottom-left"></div>
          <div class="corner-bracket bottom-right"></div>
          <div class="scan-target-hint" id="viewfinder-hint">
            <span class="hint-icon">📱</span>
            <span>Aim at Dhinesh Moorthy's Visiting Card</span>
          </div>
        </div>

        <!-- 3D Era Role Banner (Floats when Tracking) -->
        <div class="era-hologram-banner" id="era-banner" style="display: none;">
          <div class="era-badge-row">
            <span class="era-badge" id="era-badge-text">2026 • PRESENT</span>
            <span class="era-company-badge" id="era-company-text">Olai Digital Studios</span>
          </div>
          <h2 class="era-role-title" id="era-role-title">Founder & Game Director</h2>
          <p class="era-summary" id="era-summary-text"></p>
        </div>

        <!-- Career Timeline Scrubber Bar -->
        <footer class="timeline-hud-container" id="timeline-hud">
          <div class="timeline-header-row">
            <span class="timeline-label">CAREER TIMELINE</span>
            <button class="autoplay-btn" id="btn-toggle-autoplay">
              <span id="autoplay-icon">▶</span>
              <span id="autoplay-text">Auto-Play Journey</span>
            </button>
          </div>

          <div class="timeline-pills-row">
            ${milestones.map((m, idx) => `
              <button class="timeline-pill ${idx === 0 ? 'active' : ''}" data-index="${idx}" id="milestone-pill-${idx}">
                <span class="pill-year">${m.displayYear}</span>
                <span class="pill-role-abbr">${m.company.split('&')[0].trim()}</span>
              </button>
            `).join('')}
          </div>
        </footer>
      </section>

      <!-- 4. Error View -->
      <section class="ui-screen" id="screen-error" style="display: none;">
        <div class="glass-panel error-card">
          <div class="error-icon">⚠️</div>
          <h3 id="error-title-text">AR Initialization Failed</h3>
          <p id="error-detail-text">Unable to start camera session.</p>
          <div class="troubleshoot-tips">
            <strong>Troubleshooting tips:</strong>
            <ul>
              <li>Ensure camera permissions are granted.</li>
              <li>Use HTTPS or localhost in your browser.</li>
              <li>Make sure no other app is using your camera.</li>
            </ul>
          </div>
          <button class="primary-btn" id="btn-retry">
            <span>TRY AGAIN</span>
          </button>
        </div>
      </section>

      <!-- 5. Modal: Business Card Target Preview & Fullscreen Presentation -->
      <div class="poster-modal" id="poster-modal" style="display: none;">
        <div class="poster-modal-backdrop" id="poster-modal-backdrop"></div>
        <div class="poster-modal-content glass-panel" id="poster-modal-content">
          <button class="exit-maximized-btn" id="btn-exit-maximized-poster">
            ✕ Exit Fullscreen
          </button>
          <div class="modal-header">
            <h3>Dhinesh Moorthy — AR Target Visiting Card</h3>
            <button class="close-btn" id="btn-close-poster-modal">✕</button>
          </div>
          <div class="modal-body">
            <p class="modal-hint">Display this visiting card on your laptop or print it to test tracking:</p>
            <div class="full-poster-wrapper" id="poster-display-box">
              <img src="${this.config.posterImageSrc}" alt="Dhinesh Moorthy Visiting Card AR Target" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="primary-btn-sm" id="btn-toggle-fullscreen-poster">
              🖥️ Maximize On Screen (Best for Phone Scanning)
            </button>
            <a href="${this.config.posterImageSrc}" download="dhinesh-moorthy-visiting-card.jpg" class="secondary-btn">
              Download Card
            </a>
          </div>
        </div>
      </div>

      <!-- 6. Modal: Detailed Project / Game Modal -->
      <div class="poster-modal" id="project-details-modal" style="display: none;">
        <div class="poster-modal-backdrop" id="project-modal-backdrop"></div>
        <div class="poster-modal-content glass-panel" id="project-modal-content">
          <div class="modal-header">
            <div class="modal-badge-row">
              <span class="badge-pill" id="modal-project-badge">🎮 Project</span>
              <span class="era-company-badge" id="modal-project-period">2026</span>
            </div>
            <button class="close-btn" id="btn-close-project-modal">✕</button>
          </div>
          <div class="modal-body project-details-body">
            <h2 id="modal-project-title" class="project-modal-title">Zen Fourier</h2>
            <h4 id="modal-project-subtitle" class="project-modal-subtitle">Flagship Indie Game</h4>
            <p id="modal-project-desc" class="project-modal-desc"></p>
            
            <div class="tech-tags-container" id="modal-project-tech-tags"></div>
            
            <div class="highlights-box">
              <h5>Key Engineering Highlights:</h5>
              <ul id="modal-project-highlights"></ul>
            </div>
          </div>
          <div class="modal-footer" id="modal-project-footer">
            <a href="#" target="_blank" rel="noopener" class="primary-btn" id="btn-modal-project-link">
              <span>View Repository / Demo</span>
            </a>
            <button class="secondary-btn" id="btn-dismiss-project-modal">
              Close
            </button>
          </div>
        </div>
      </div>
    `;

    this.statusTextElement = this.rootElement.querySelector('#loading-status-text');
    this.errorDetailElement = this.rootElement.querySelector('#error-detail-text');
    this.posterModalElement = this.rootElement.querySelector('#poster-modal');
    this.projectDetailsModalElement = this.rootElement.querySelector('#project-details-modal');

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
      this.stopAutoPlay();
      this.callbacks.onStopRequested();
      this.setState('IDLE');
    });

    const rotateBtn = this.rootElement.querySelector('#btn-rotate-hud');
    rotateBtn?.addEventListener('click', () => {
      const angle = this.callbacks.onRotateRequested?.();
      if (rotateBtn) {
        rotateBtn.textContent = `🔄 ${angle ?? 90}°`;
      }
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

    // Fullscreen presentation
    const fsBtn = this.rootElement.querySelector('#btn-toggle-fullscreen-poster');
    fsBtn?.addEventListener('click', () => this.toggleMaximizePoster(true));

    const exitFsBtn = this.rootElement.querySelector('#btn-exit-maximized-poster');
    exitFsBtn?.addEventListener('click', () => this.toggleMaximizePoster(false));

    // Project Details Modal Triggers
    const closeProjModalBtn = this.rootElement.querySelector('#btn-close-project-modal');
    closeProjModalBtn?.addEventListener('click', () => this.showProjectModal(false));

    const dismissProjBtn = this.rootElement.querySelector('#btn-dismiss-project-modal');
    dismissProjBtn?.addEventListener('click', () => this.showProjectModal(false));

    const projBackdrop = this.rootElement.querySelector('#project-modal-backdrop');
    projBackdrop?.addEventListener('click', () => this.showProjectModal(false));

    const heroZenBtn = this.rootElement.querySelector('#btn-hero-zen-fourier');
    heroZenBtn?.addEventListener('click', () => {
      const zenProj = this.config.portfolio.milestones[3]?.projects[0];
      if (zenProj) {
        this.openProjectDetails(zenProj);
      }
    });

    // Timeline Milestone Pills
    const milestones = this.config.portfolio.milestones;
    milestones.forEach((_, idx) => {
      const pill = this.rootElement.querySelector(`#milestone-pill-${idx}`);
      pill?.addEventListener('click', () => {
        this.stopAutoPlay();
        this.selectMilestone(idx);
      });
    });

    // Auto-Play Button
    const autoPlayBtn = this.rootElement.querySelector('#btn-toggle-autoplay');
    autoPlayBtn?.addEventListener('click', () => {
      this.toggleAutoPlay();
    });

    // Keyboard ESC to exit modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.posterModalElement?.classList.contains('is-maximized')) {
          this.toggleMaximizePoster(false);
        } else if (this.projectDetailsModalElement?.style.display === 'flex') {
          this.showProjectModal(false);
        }
      }
    });
  }

  public selectMilestone(index: number): void {
    const milestones = this.config.portfolio.milestones;
    if (index < 0 || index >= milestones.length) return;

    this.currentMilestoneIndex = index;

    // Update active pill styling
    milestones.forEach((_, idx) => {
      const pill = this.rootElement.querySelector(`#milestone-pill-${idx}`);
      if (pill) {
        if (idx === index) pill.classList.add('active');
        else pill.classList.remove('active');
      }
    });

    this.updateActiveMilestoneUI();
    this.callbacks.onMilestoneSelected?.(index);
  }

  private updateActiveMilestoneUI(): void {
    const milestone = this.config.portfolio.milestones[this.currentMilestoneIndex];
    if (!milestone) return;

    const eraBadge = this.rootElement.querySelector('#era-badge-text');
    const eraCompany = this.rootElement.querySelector('#era-company-text');
    const eraRole = this.rootElement.querySelector('#era-role-title');
    const eraSummary = this.rootElement.querySelector('#era-summary-text');
    const eraBanner = this.rootElement.querySelector('#era-banner') as HTMLElement;

    if (eraBadge) eraBadge.textContent = milestone.badge;
    if (eraCompany) eraCompany.textContent = milestone.company;
    if (eraRole) eraRole.textContent = milestone.role;
    if (eraSummary) eraSummary.textContent = milestone.headline;

    if (eraBanner && this.currentState === 'TRACKING') {
      eraBanner.style.display = 'flex';
      eraBanner.style.borderColor = milestone.accentColor;
    }
  }

  private toggleAutoPlay(): void {
    if (this.isAutoPlaying) {
      this.stopAutoPlay();
    } else {
      this.startAutoPlay();
    }
  }

  private startAutoPlay(): void {
    this.isAutoPlaying = true;
    const icon = this.rootElement.querySelector('#autoplay-icon');
    const text = this.rootElement.querySelector('#autoplay-text');
    if (icon) icon.textContent = '⏸';
    if (text) text.textContent = 'Pause Journey';

    if (this.autoPlayTimer) clearInterval(this.autoPlayTimer);
    this.autoPlayTimer = window.setInterval(() => {
      const nextIndex = (this.currentMilestoneIndex + 1) % this.config.portfolio.milestones.length;
      this.selectMilestone(nextIndex);
    }, this.AUTO_PLAY_INTERVAL_MS);
  }

  private stopAutoPlay(): void {
    this.isAutoPlaying = false;
    const icon = this.rootElement.querySelector('#autoplay-icon');
    const text = this.rootElement.querySelector('#autoplay-text');
    if (icon) icon.textContent = '▶';
    if (text) text.textContent = 'Auto-Play Journey';

    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }

  public openProjectDetails(project: ProjectItem): void {
    const title = this.rootElement.querySelector('#modal-project-title');
    const subtitle = this.rootElement.querySelector('#modal-project-subtitle');
    const badge = this.rootElement.querySelector('#modal-project-badge');
    const period = this.rootElement.querySelector('#modal-project-period');
    const desc = this.rootElement.querySelector('#modal-project-desc');
    const techTags = this.rootElement.querySelector('#modal-project-tech-tags');
    const highlights = this.rootElement.querySelector('#modal-project-highlights');
    const linkBtn = this.rootElement.querySelector('#btn-modal-project-link') as HTMLAnchorElement;

    if (title) title.textContent = project.title;
    if (subtitle) subtitle.textContent = `${project.subtitle} • ${project.company}`;
    if (badge) badge.textContent = `${project.icon} ${project.badge}`;
    if (period) period.textContent = project.period;
    if (desc) desc.textContent = project.description;

    if (techTags) {
      techTags.innerHTML = project.techStack
        .map(t => `<span class="tech-tag" style="border-color:${project.accentColor};color:${project.accentColor};">${t}</span>`)
        .join('');
    }

    if (highlights) {
      highlights.innerHTML = project.highlights
        .map(h => `<li>${h}</li>`)
        .join('');
    }

    if (linkBtn) {
      linkBtn.href = project.linkUrl || this.config.portfolio.socials.github;
      linkBtn.style.background = project.color;
      const span = linkBtn.querySelector('span');
      if (span) span.textContent = project.linkText || 'View on GitHub';
    }

    this.showProjectModal(true);
  }

  private showProjectModal(show: boolean): void {
    if (this.projectDetailsModalElement) {
      this.projectDetailsModalElement.style.display = show ? 'flex' : 'none';
    }
  }

  private toggleMaximizePoster(maximize: boolean, syncNative = true): void {
    if (!this.posterModalElement) return;

    if (maximize) {
      this.posterModalElement.classList.add('is-maximized');
      if (syncNative) {
        const el = this.posterModalElement as any;
        const requestFS = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
        if (typeof requestFS === 'function') requestFS.call(el).catch(() => {});
      }
    } else {
      this.posterModalElement.classList.remove('is-maximized');
      if (syncNative && document.fullscreenElement) {
        const doc = document as any;
        const exitFS = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
        if (typeof exitFS === 'function') exitFS.call(doc).catch(() => {});
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
    const eraBanner = this.rootElement.querySelector('#era-banner') as HTMLElement;
    const timelineHud = this.rootElement.querySelector('#timeline-hud') as HTMLElement;

    if (idleScreen) idleScreen.style.display = this.currentState === 'IDLE' ? 'flex' : 'none';
    if (startingScreen) startingScreen.style.display = this.currentState === 'STARTING' ? 'flex' : 'none';
    if (activeScreen) {
      activeScreen.style.display = (this.currentState === 'SCANNING' || this.currentState === 'TRACKING') ? 'flex' : 'none';
    }
    if (errorScreen) errorScreen.style.display = this.currentState === 'ERROR' ? 'flex' : 'none';

    if (this.currentState === 'SCANNING') {
      if (trackingPill) {
        trackingPill.classList.remove('tracking-active');
        trackingPill.classList.add('tracking-scanning');
      }
      if (hudStatusText) hudStatusText.textContent = 'Scanning for Card...';
      if (viewfinderFrame) {
        viewfinderFrame.classList.remove('locked');
        viewfinderFrame.classList.add('scanning');
      }
      if (viewfinderHint) viewfinderHint.style.display = 'flex';
      if (eraBanner) eraBanner.style.display = 'none';
      if (timelineHud) timelineHud.style.display = 'flex';
    } else if (this.currentState === 'TRACKING') {
      if (trackingPill) {
        trackingPill.classList.remove('tracking-scanning');
        trackingPill.classList.add('tracking-active');
      }
      if (hudStatusText) hudStatusText.textContent = '✨ Target Locked';
      if (viewfinderFrame) {
        viewfinderFrame.classList.remove('scanning');
        viewfinderFrame.classList.add('locked');
      }
      if (viewfinderHint) viewfinderHint.style.display = 'none';
      if (eraBanner) eraBanner.style.display = 'flex';
      if (timelineHud) timelineHud.style.display = 'flex';
    }
  }
}
