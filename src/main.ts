import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/latin-800.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/ibm-plex-mono/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-700.css';
import '@fontsource/titan-one/latin-400.css';
import '@fontsource/rampart-one/latin-400.css';
import '@fontsource/rampart-one/japanese-400.css';
import './style.css';
import { AudioEngine, UI_SOUND_PACKS, isUiSoundPack, type UiSound } from './audio';
import { HOME_PANEL_ART, HOME_WORLD_ART } from './homeAssets';
import { refreshIcons } from './icons';
import { AnimationSandbox } from './game/AnimationSandbox';
import { CharacterSheetsGallery } from './game/CharacterSheetsGallery';
import { FrameAnimationGallery } from './game/FrameAnimationGallery';
import { FlightGame, type RunResult } from './game/FlightGame';
import { FutureHomepageAudio } from './game/FutureHomepageAudio';
import { Version03AnimationGallery } from './game/Version03AnimationGallery';
import {
  Version03Cinematic,
  type Version03CinematicFrame,
} from './game/Version03Cinematic';
import type { FlightGameState } from './game/engine';
import { createDefaultPlayerState, loadPlayerState, recordRun, savePlayerState, type PlayerState } from './state';
import { getWorld, type WorldId } from './worlds';

type IntroVariant = 'smash' | 'magic';

class HugoGoApp {
  readonly audio = new AudioEngine();
  private state: PlayerState = loadPlayerState();
  private introVariant: IntroVariant = 'smash';
  private readonly mobileHomeMedia = window.matchMedia('(max-width: 1024px)');
  private readonly compactHomeSections: Array<{ section: HTMLElement; slot: HTMLElement; anchor: Comment }>;

  private readonly homeScreen = this.element('home-screen');
  private readonly gameScreen = this.element('game-screen');
  private readonly sandboxScreen = this.element('sandbox-screen');
  private readonly outfit03Screen = this.element('outfit-03-screen');
  private readonly outfit03Scroll = this.element('outfit-03-scroll');
  private readonly characterSheetsScreen = this.element('character-sheets-screen');
  private readonly characterSheetsScroll = this.element('character-sheets-scroll');
  private readonly version03Screen = this.element('version-03-screen');
  private readonly version03Scroll = this.element('version-03-scroll');
  private readonly futureHomepageScreen = this.element('future-homepage-screen');
  private readonly futureHomepageScroll = this.element('future-homepage-scroll');
  private readonly futureHomepageStart = this.button('future-homepage-start');
  private readonly homeHero = this.element('home-hero');
  private readonly homeTopbar = this.element('home-topbar');
  private readonly homeProfileButton = this.button('home-profile-button');
  private readonly homeResources = this.element('home-resources');
  private readonly homeFeatureCards = this.element('home-feature-cards');
  private readonly homeWorldGrid = this.element('home-world-grid');
  private readonly homeFooter = this.element('home-footer');
  private readonly homeMenuButton = this.button('home-menu-button');
  private readonly homeMobileMenu = this.element('home-mobile-menu');
  private readonly homeStatus = this.element('home-status');
  private readonly homePanelModal = this.element('home-panel-modal');
  private readonly homePanelContent = this.element('home-panel-content');
  private readonly toastRegion = this.element('toast-region');
  private readonly flightGame: FlightGame;
  private readonly animationSandbox: AnimationSandbox;
  private readonly frameAnimationGallery: FrameAnimationGallery;
  private readonly characterSheetsGallery: CharacterSheetsGallery;
  private readonly version03AnimationGallery: Version03AnimationGallery;
  private readonly version03Cinematic: Version03Cinematic;
  private readonly futureHomepageCinematic: Version03Cinematic;
  private readonly futureHomepageAudio: FutureHomepageAudio;
  private futureHomepageMusicCued = false;
  private futureHomepageSequenceResolved = false;

  constructor() {
    this.flightGame = new FlightGame({
      canvas: this.element('game-canvas') as HTMLCanvasElement,
      distance: this.element('game-distance'),
      coins: this.element('game-run-coins'),
      best: this.element('game-best'),
      overlay: this.element('game-over-overlay'),
      result: this.element('game-over-result'),
      restart: this.button('game-restart-button'),
      announcer: this.element('game-announcer'),
    }, {
      bestDistance: () => this.state.bestDistance,
      onRunComplete: (result) => this.completeRun(result),
    });
    this.animationSandbox = new AnimationSandbox(this.sandboxScreen);
    this.frameAnimationGallery = new FrameAnimationGallery(this.outfit03Screen);
    this.characterSheetsGallery = new CharacterSheetsGallery(this.characterSheetsScreen);
    this.version03AnimationGallery = new Version03AnimationGallery(this.version03Screen);
    this.version03Cinematic = new Version03Cinematic(
      this.version03Screen,
      this.version03Scroll,
    );
    this.futureHomepageAudio = new FutureHomepageAudio(this.futureHomepageScreen);
    this.futureHomepageCinematic = new Version03Cinematic(
      this.futureHomepageScreen,
      this.futureHomepageScroll,
      {
        onFrame: (frame) => this.handleFutureHomepageFrame(frame),
      },
    );
    this.compactHomeSections = this.prepareCompactHomeLayout();
    this.audio.configure(this.state.settings);
    this.applySettings();
    this.hydrateHomeMedia();
    this.syncCompactHomeLayout();
    this.bindControls();
    this.render();
    this.showRoute(false);
    refreshIcons();
  }

  showHome(updateRoute = true): void {
    this.flightGame.stop();
    this.animationSandbox.stop();
    this.frameAnimationGallery.stop();
    this.version03AnimationGallery.stop();
    this.version03Cinematic.stop();
    this.futureHomepageCinematic.stop();
    this.futureHomepageAudio.stop();
    this.gameScreen.hidden = true;
    this.sandboxScreen.hidden = true;
    this.outfit03Screen.hidden = true;
    this.characterSheetsScreen.hidden = true;
    this.version03Screen.hidden = true;
    this.futureHomepageScreen.hidden = true;
    this.homeScreen.classList.add('is-open');
    document.body.classList.remove('game-page-open', 'sandbox-page-open', 'outfit-03-page-open', 'character-sheets-page-open', 'version-03-page-open', 'future-homepage-page-open');
    this.setCompactMenuOpen(false);
    this.setMobileResourcesExpanded(false);
    if (updateRoute) this.pushRoute('#/home');
    document.title = 'HUGO GO!';
  }

  showGame(updateRoute = true): void {
    this.animationSandbox.stop();
    this.frameAnimationGallery.stop();
    this.version03AnimationGallery.stop();
    this.version03Cinematic.stop();
    this.futureHomepageCinematic.stop();
    this.futureHomepageAudio.stop();
    this.state.selectedWorld = 'forest';
    this.homeScreen.classList.remove('is-open');
    this.sandboxScreen.hidden = true;
    this.outfit03Screen.hidden = true;
    this.characterSheetsScreen.hidden = true;
    this.version03Screen.hidden = true;
    this.futureHomepageScreen.hidden = true;
    this.gameScreen.hidden = false;
    document.body.classList.add('game-page-open');
    document.body.classList.remove('sandbox-page-open', 'outfit-03-page-open', 'character-sheets-page-open', 'version-03-page-open', 'future-homepage-page-open');
    this.setCompactMenuOpen(false);
    this.setMobileResourcesExpanded(false);
    this.element('game-world-label').textContent = getWorld('forest').name;
    if (updateRoute) this.pushRoute('#/game');
    document.title = 'HUGO GO! — Game';
    this.flightGame.start();
  }

  showSandbox(updateRoute = true): void {
    this.flightGame.stop();
    this.closeHomePanel();
    this.homeScreen.classList.remove('is-open');
    this.gameScreen.hidden = true;
    this.outfit03Screen.hidden = true;
    this.characterSheetsScreen.hidden = true;
    this.version03Screen.hidden = true;
    this.futureHomepageScreen.hidden = true;
    this.frameAnimationGallery.stop();
    this.version03AnimationGallery.stop();
    this.version03Cinematic.stop();
    this.futureHomepageCinematic.stop();
    this.futureHomepageAudio.stop();
    this.sandboxScreen.hidden = false;
    document.body.classList.remove('game-page-open', 'outfit-03-page-open', 'character-sheets-page-open', 'version-03-page-open', 'future-homepage-page-open');
    document.body.classList.add('sandbox-page-open');
    this.setCompactMenuOpen(false);
    this.setMobileResourcesExpanded(false);
    if (updateRoute) this.pushRoute('#/sandbox');
    document.title = 'HUGO GO! — Animation Sandbox';
    this.animationSandbox.start();
    refreshIcons();
  }

  showOutfit03(updateRoute = true): void {
    this.flightGame.stop();
    this.animationSandbox.stop();
    this.version03AnimationGallery.stop();
    this.version03Cinematic.stop();
    this.futureHomepageCinematic.stop();
    this.futureHomepageAudio.stop();
    this.closeHomePanel();
    this.homeScreen.classList.remove('is-open');
    this.gameScreen.hidden = true;
    this.sandboxScreen.hidden = true;
    this.characterSheetsScreen.hidden = true;
    this.version03Screen.hidden = true;
    this.futureHomepageScreen.hidden = true;
    this.outfit03Screen.hidden = false;
    document.body.classList.remove('game-page-open', 'sandbox-page-open', 'character-sheets-page-open', 'version-03-page-open', 'future-homepage-page-open');
    document.body.classList.add('outfit-03-page-open');
    this.setCompactMenuOpen(false);
    this.setMobileResourcesExpanded(false);
    if (updateRoute) this.pushRoute('#/outfit-03');
    document.title = 'HUGO GO! — Outfit 03';
    this.outfit03Scroll.scrollTop = 0;
    this.frameAnimationGallery.start();
    refreshIcons();
  }

  showCharacterSheets(updateRoute = true): void {
    this.flightGame.stop();
    this.animationSandbox.stop();
    this.frameAnimationGallery.stop();
    this.version03AnimationGallery.stop();
    this.version03Cinematic.stop();
    this.futureHomepageCinematic.stop();
    this.futureHomepageAudio.stop();
    this.closeHomePanel();
    this.homeScreen.classList.remove('is-open');
    this.gameScreen.hidden = true;
    this.sandboxScreen.hidden = true;
    this.outfit03Screen.hidden = true;
    this.version03Screen.hidden = true;
    this.futureHomepageScreen.hidden = true;
    this.characterSheetsScreen.hidden = false;
    document.body.classList.remove('game-page-open', 'sandbox-page-open', 'outfit-03-page-open', 'version-03-page-open', 'future-homepage-page-open');
    document.body.classList.add('character-sheets-page-open');
    if (updateRoute) this.pushRoute('#/character-sheets');
    document.title = 'HUGO GO! — Character Sheets';
    this.characterSheetsScroll.scrollTop = 0;
    this.characterSheetsGallery.hydrate();
    refreshIcons();
  }

  showVersion03(updateRoute = true): void {
    this.flightGame.stop();
    this.animationSandbox.stop();
    this.frameAnimationGallery.stop();
    this.futureHomepageCinematic.stop();
    this.futureHomepageAudio.stop();
    this.closeHomePanel();
    this.homeScreen.classList.remove('is-open');
    this.gameScreen.hidden = true;
    this.sandboxScreen.hidden = true;
    this.outfit03Screen.hidden = true;
    this.characterSheetsScreen.hidden = true;
    this.futureHomepageScreen.hidden = true;
    this.version03Screen.hidden = false;
    document.body.classList.remove('game-page-open', 'sandbox-page-open', 'outfit-03-page-open', 'character-sheets-page-open', 'future-homepage-page-open');
    document.body.classList.add('version-03-page-open');
    this.audio.pauseMusic();
    if (updateRoute) this.pushRoute('#/version-03');
    document.title = 'HUGO GO! — Version 03';
    this.version03Scroll.scrollTop = 0;
    this.version03AnimationGallery.start();
    this.version03Cinematic.start();
    refreshIcons();
  }

  showFutureHomepage(updateRoute = true): void {
    this.flightGame.stop();
    this.animationSandbox.stop();
    this.frameAnimationGallery.stop();
    this.version03AnimationGallery.stop();
    this.version03Cinematic.stop();
    this.closeHomePanel();
    this.homeScreen.classList.remove('is-open');
    this.gameScreen.hidden = true;
    this.sandboxScreen.hidden = true;
    this.outfit03Screen.hidden = true;
    this.characterSheetsScreen.hidden = true;
    this.version03Screen.hidden = true;
    this.futureHomepageScreen.hidden = false;
    document.body.classList.remove('game-page-open', 'sandbox-page-open', 'outfit-03-page-open', 'character-sheets-page-open', 'version-03-page-open');
    document.body.classList.add('future-homepage-page-open');
    this.audio.pauseMusic();
    if (updateRoute) this.pushRoute('#/future-homepage');
    document.title = 'HUGO GO! — Future Homepage';
    this.futureHomepageScroll.scrollTop = 0;
    this.futureHomepageAudio.stop();
    this.futureHomepageMusicCued = false;
    this.futureHomepageSequenceResolved = false;
    this.futureHomepageStart.disabled = false;
    this.futureHomepageScreen.classList.remove(
      'is-intro',
      'is-running',
      'is-resolved',
    );
    this.futureHomepageCinematic.holdFirstFrame();
    void this.futureHomepageScreen.offsetWidth;
    this.futureHomepageScreen.classList.add('is-intro');
    refreshIcons();
  }

  private startFutureHomepageSequence(): void {
    if (
      this.futureHomepageScreen.hidden ||
      this.futureHomepageScreen.classList.contains('is-running')
    ) {
      return;
    }

    this.futureHomepageStart.disabled = true;
    this.futureHomepageScreen.classList.add('is-running');
    this.futureHomepageAudio.prime();
    this.futureHomepageCinematic.start();
  }

  private handleFutureHomepageFrame(frame: Version03CinematicFrame): void {
    if (
      this.futureHomepageScreen.hidden ||
      !this.futureHomepageScreen.classList.contains('is-running')
    ) {
      return;
    }

    if (!this.futureHomepageMusicCued && frame.frameNumber === 7) {
      this.futureHomepageMusicCued = true;
      this.futureHomepageAudio.start();
    }

    if (
      !this.futureHomepageSequenceResolved &&
      frame.completedLoops >= 3
    ) {
      this.futureHomepageSequenceResolved = true;
      this.futureHomepageScreen.classList.add('is-resolved');
    }
  }

  getSelectedWorld(): WorldId {
    return this.state.selectedWorld;
  }

  getGameState(): Readonly<FlightGameState> {
    return this.flightGame.getState();
  }

  closeTopLayer(): boolean {
    if (this.homePanelModal.classList.contains('is-open')) {
      this.closeHomePanel();
      return true;
    }
    if (this.homeMobileMenu.classList.contains('is-open')) {
      this.setCompactMenuOpen(false);
      return true;
    }
    if (this.homeTopbar.classList.contains('is-resources-open')) {
      this.setMobileResourcesExpanded(false);
      return true;
    }
    if (!this.outfit03Screen.hidden) {
      this.showSandbox();
      return true;
    }
    if (!this.characterSheetsScreen.hidden) {
      this.showOutfit03();
      return true;
    }
    if (!this.version03Screen.hidden) {
      this.showOutfit03();
      return true;
    }
    if (!this.futureHomepageScreen.hidden) {
      this.showVersion03();
      return true;
    }
    if (!this.sandboxScreen.hidden) {
      this.showHome();
      return true;
    }
    if (!this.gameScreen.hidden) {
      this.showHome();
      return true;
    }
    return false;
  }

  private bindControls(): void {
    this.button('home-play-button').addEventListener('click', () => this.showGame());
    this.button('game-back-button').addEventListener('click', () => this.showHome());
    this.button('sandbox-back-button').addEventListener('click', () => this.showHome());
    this.button('sandbox-open-outfit-03').addEventListener('click', () => this.showOutfit03());
    this.button('outfit-03-back-button').addEventListener('click', () => this.showSandbox());
    this.button('character-sheets-button').addEventListener('click', () => this.showCharacterSheets());
    this.button('character-sheets-back-button').addEventListener('click', () => this.showOutfit03());
    this.button('version-03-button').addEventListener('click', () => this.showVersion03());
    this.button('version-03-back-button').addEventListener('click', () => this.showOutfit03());
    this.button('future-homepage-button').addEventListener('click', () => this.showFutureHomepage());
    this.button('version-03-future-homepage-button').addEventListener('click', () => this.showFutureHomepage());
    this.futureHomepageStart.addEventListener(
      'click',
      () => this.startFutureHomepageSequence(),
    );
    this.button('game-over-home').addEventListener('click', () => this.showHome());

    const introButton = this.button('home-intro-next');
    introButton.addEventListener('click', () => this.playHomeIntro(this.introVariant === 'smash' ? 'magic' : 'smash'));
    introButton.addEventListener('animationend', () => this.finishHomeIntro());
    this.homeHero.addEventListener('animationend', () => this.finishHomeIntro());

    this.mobileHomeMedia.addEventListener('change', () => this.syncCompactHomeLayout());
    this.homeMenuButton.addEventListener('click', () => {
      this.setCompactMenuOpen(!this.homeMobileMenu.classList.contains('is-open'));
    });
    this.button('home-mobile-menu-close').addEventListener('click', () => this.setCompactMenuOpen(false));

    this.homeScreen.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.closest('#home-profile-button') && this.mobileHomeMedia.matches) {
        this.setMobileResourcesExpanded(!this.homeTopbar.classList.contains('is-resources-open'));
        return;
      }
      if (this.mobileHomeMedia.matches && !target.closest('.home-topbar')) this.setMobileResourcesExpanded(false);

      const worldButton = target.closest<HTMLButtonElement>('[data-home-world]');
      if (worldButton?.dataset.homeWorld) {
        this.selectWorld(worldButton.dataset.homeWorld as WorldId);
        return;
      }

      const panelButton = target.closest<HTMLButtonElement>('[data-home-panel]');
      if (panelButton?.dataset.homePanel) {
        this.openHomePanel(panelButton.dataset.homePanel);
        return;
      }

      const messageButton = target.closest<HTMLButtonElement>('[data-home-message]');
      if (messageButton?.dataset.homeMessage) this.showStatus(messageButton.dataset.homeMessage);
    });

    const toggleSound = () => {
      this.audio.toggle();
      this.updateSoundButtons();
    };
    this.button('sound-button').addEventListener('click', toggleSound);
    this.button('home-sound-button').addEventListener('click', (event) => {
      event.stopPropagation();
      toggleSound();
    });

    this.button('home-panel-close').addEventListener('click', () => this.closeHomePanel());
    this.homePanelModal.addEventListener('click', (event) => {
      if (event.target === this.homePanelModal) {
        this.closeHomePanel();
        return;
      }
      this.handlePanelAction(event);
    });
    this.homePanelContent.addEventListener('change', (event) => this.handleSettingChange(event));
    window.addEventListener('popstate', () => this.showRoute(false));

    document.addEventListener('pointerdown', () => this.audio.unlock(), { once: true });
    document.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
      if (!button || button.disabled) return;
      let sound: UiSound = 'click';
      if (button.matches('.home-world')) sound = 'card';
      else if (button.matches('.home-play')) sound = 'confirm';
      else if (button.matches('#sound-button, #home-sound-button, [data-toggle-sound], [data-toggle-motion]')) sound = 'toggle';
      else if (button.matches('.modal-close, .game-back-button, .game-over-home')) sound = 'back';
      else if (button.matches('[data-home-panel]')) sound = 'open';
      this.audio.playUi(sound);
    }, { capture: true });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.closeTopLayer();
    });
  }

  private selectWorld(worldId: WorldId): void {
    if (worldId !== 'forest') {
      const world = getWorld(worldId);
      this.showStatus(`${world.name} is coming soon. Forest World is ready to play now.`);
      return;
    }
    this.state.selectedWorld = 'forest';
    this.persist();
    this.renderWorldSelection();
    this.showStatus('Forest World is ready. Press Play to start running immediately.');
  }

  private render(): void {
    this.element('home-player-name').textContent = 'Hugo';
    this.element('home-player-level').textContent = String(this.state.level);
    this.element('home-energy-value').textContent = `${this.state.energy}/100`;
    this.element('home-coins-value').textContent = this.state.coins.toLocaleString();
    this.element('home-gems-value').textContent = this.state.gems.toLocaleString();
    this.element('home-power-value').textContent = this.state.flightPower.toLocaleString();
    this.element('home-streak-value').textContent = this.state.streak > 0 ? `${this.state.streak} days` : 'Start today';
    this.element('home-best-distance-value').textContent = this.state.bestDistance > 0
      ? `${this.state.bestDistance.toLocaleString()} m`
      : 'No runs';
    this.element('home-xp-fill').style.setProperty('--xp', `${(this.state.xp % 1_000) / 10}%`);
    this.renderWorldSelection();
    this.updateSoundButtons();
  }

  private renderWorldSelection(): void {
    this.homeScreen.querySelectorAll<HTMLButtonElement>('[data-home-world]').forEach((button) => {
      const selected = button.dataset.homeWorld === 'forest';
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    this.element('game-world-label').textContent = getWorld('forest').name;
  }

  private openHomePanel(panel: string): void {
    const copy: Record<string, [string, string, string]> = {
      profile: ['HUGO’S JOURNEY', 'Hugo', 'Flight distance, coins, and personal records are saved on this device.'],
      settings: ['GAME SETTINGS', 'Settings', 'Choose how HUGO GO! feels and sounds on this device.'],
      missions: ['FLIGHT MISSIONS', 'Missions', 'Run, glide, collect coins, and set a new Forest record.'],
      daily: ['DAILY DROP', 'Daily rewards', 'Daily flight rewards are planned for a future update.'],
      achievements: ['MILESTONES', 'Achievements', 'Your first playable milestones are tied to Forest distance and coins.'],
      collection: ['FLIGHT CREW', 'Collection', 'World discoveries and collectible flight companions will live here.'],
      leaderboard: ['LOCAL RECORDS', 'Leaderboards', 'Your five best Forest runs on this device.'],
    };
    const text = copy[panel] ?? copy.profile;
    this.element('home-panel-eyebrow').textContent = text[0];
    this.element('home-panel-title').textContent = text[1];
    this.element('home-panel-copy').textContent = text[2];
    this.homePanelContent.innerHTML = this.homePanelMarkup(panel);
    this.homePanelModal.dataset.panel = panel;
    this.homePanelModal.classList.add('is-open');
    this.setCompactMenuOpen(false);
    this.setMobileResourcesExpanded(false);
    refreshIcons();
    this.button('home-panel-close').focus();
  }

  private homePanelMarkup(panel: string): string {
    if (panel === 'settings') {
      return `
        <div class="settings-list">
          <div class="setting-row"><span><strong>Sound</strong><small>Music and interface sounds.</small></span><button class="panel-action" type="button" data-toggle-sound>${this.audio.muted ? 'Enable sound' : 'Mute sound'}</button></div>
          <div class="setting-row"><span><strong>Motion</strong><small>Reduce the animated home-screen entrance.</small></span><button class="panel-action" type="button" data-toggle-motion>${this.state.settings.reducedMotion ? 'Use full motion' : 'Reduce motion'}</button></div>
          <label class="setting-row setting-row--select"><span><strong>Sound style</strong><small>Choose the interface sound pack.</small></span><select data-setting="soundPack" aria-label="Sound style">${UI_SOUND_PACKS.map((pack) => `<option value="${pack.id}" ${this.state.settings.soundPack === pack.id ? 'selected' : ''}>${pack.name}</option>`).join('')}</select></label>
          <div class="setting-row setting-row--sandbox"><span><strong>Animation Sandbox</strong><small>Watch every Hugo animation looping live.</small></span><button class="panel-action panel-action--sandbox" type="button" data-open-sandbox><i data-lucide="flask-conical" aria-hidden="true"></i> Open Sandbox</button></div>
        </div>
        <div class="settings-reset"><span>Reset Hugo’s local home-screen preferences.</span><button class="panel-action panel-action--danger" type="button" data-reset-progress>Reset local data</button></div>
      `;
    }
    if (panel === 'profile') {
      return `
        <div class="progress-summary">
          <div><small>Player</small><strong>Hugo</strong></div>
          <div><small>Level</small><strong>${this.state.level}</strong></div>
          <div><small>Runs</small><strong>${this.state.totalRuns}</strong></div>
          <div><small>Best</small><strong>${this.state.bestDistance ? `${this.state.bestDistance} m` : '—'}</strong></div>
        </div>
        <div class="empty-progress"><strong>Forest World is open</strong><p>Press Play to start instantly. Run on safe ground, then use Hugo’s shoe jets to fly over every obstacle.</p></div>
      `;
    }
    if (panel === 'leaderboard') {
      if (this.state.topRuns.length === 0) {
        return '<div class="empty-progress"><strong>No Forest runs yet</strong><p>Press Play and your best five distances will appear here.</p></div>';
      }
      return `<ol class="local-leaderboard">${this.state.topRuns.map((run, index) => `
        <li><b>#${index + 1}</b><strong>${run.distance} m</strong><span>${run.coins} coin${run.coins === 1 ? '' : 's'}</span></li>
      `).join('')}</ol>`;
    }
    if (panel === 'missions') {
      return `
        <div class="mission-list">
          <div><strong>First flight</strong><span>${this.state.totalRuns > 0 ? 'Complete' : 'Play one Forest run'}</span></div>
          <div><strong>Coin trail</strong><span>${this.state.coins >= 10 ? 'Complete' : `${this.state.coins}/10 coins`}</span></div>
          <div><strong>Forest flyer</strong><span>${Math.min(this.state.bestDistance, 250)}/250 m</span></div>
        </div>
      `;
    }
    return '<div class="empty-progress"><strong>Coming soon</strong><p>This feature will open in a later HUGO GO! update.</p></div>';
  }

  private handlePanelAction(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.closest('[data-open-sandbox]')) {
      this.showSandbox();
      return;
    }
    if (target.closest('[data-toggle-sound]')) {
      this.audio.toggle();
      this.updateSoundButtons();
      this.openHomePanel('settings');
      return;
    }
    if (target.closest('[data-toggle-motion]')) {
      this.state.settings.reducedMotion = !this.state.settings.reducedMotion;
      this.applySettings();
      this.persist();
      this.openHomePanel('settings');
      return;
    }
    const reset = target.closest<HTMLButtonElement>('[data-reset-progress]');
    if (!reset) return;
    if (reset.dataset.confirm !== 'true') {
      reset.dataset.confirm = 'true';
      reset.textContent = 'Click again to reset';
      return;
    }
    this.state = createDefaultPlayerState();
    this.audio.configure(this.state.settings);
    this.applySettings();
    this.persist();
    this.render();
    this.openHomePanel('settings');
    this.toast('Hugo’s local data was reset.', 'warning');
  }

  private handleSettingChange(event: Event): void {
    const select = (event.target as HTMLElement).closest<HTMLSelectElement>('select[data-setting="soundPack"]');
    if (!select || !isUiSoundPack(select.value)) return;
    this.state.settings.soundPack = select.value;
    this.audio.configure(this.state.settings);
    this.persist();
    this.audio.playUi('confirm');
  }

  private closeHomePanel(): void {
    this.homePanelModal.classList.remove('is-open');
  }

  private playHomeIntro(variant: IntroVariant): void {
    this.introVariant = variant;
    this.homeHero.dataset.introState = 'running';
    this.homeScreen.dataset.introState = 'running';
    this.homeHero.classList.remove('home-hero--intro-smash', 'home-hero--intro-magic');
    this.homeScreen.classList.remove('home-screen--intro-smash', 'home-screen--intro-magic');
    void this.homeScreen.offsetWidth;
    this.homeHero.classList.add(`home-hero--intro-${variant}`);
    this.homeScreen.classList.add(`home-screen--intro-${variant}`);
    const nextIsMagic = variant === 'smash';
    const button = this.button('home-intro-next');
    button.setAttribute('aria-label', nextIsMagic ? 'Play the alternate magical intro' : 'Replay the smash intro');
    button.title = nextIsMagic ? 'Play alternate intro animation' : 'Replay smash intro animation';
    if (this.state.settings.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) this.finishHomeIntro();
  }

  private finishHomeIntro(): void {
    this.homeHero.dataset.introState = 'complete';
    this.homeScreen.dataset.introState = 'complete';
  }

  private prepareCompactHomeLayout(): Array<{ section: HTMLElement; slot: HTMLElement; anchor: Comment }> {
    return [
      { section: this.homeFeatureCards, slot: this.element('home-menu-features-slot') },
      { section: this.homeFooter, slot: this.element('home-menu-footer-slot') },
      { section: this.homeWorldGrid, slot: this.element('home-menu-worlds-slot') },
    ].map(({ section, slot }) => {
      const anchor = document.createComment(`${section.id}-desktop-anchor`);
      section.before(anchor);
      return { section, slot, anchor };
    });
  }

  private syncCompactHomeLayout(): void {
    if (this.mobileHomeMedia.matches) {
      for (const { section, slot } of this.compactHomeSections) slot.append(section);
    } else {
      for (const { section, anchor } of this.compactHomeSections) anchor.after(section);
    }
    this.hydrateHomeMedia();
    this.setMobileResourcesExpanded(false);
    this.setCompactMenuOpen(false);
  }

  private hydrateHomeMedia(): void {
    this.homeScreen.querySelectorAll<HTMLImageElement>('img[data-menu-art]').forEach((image) => {
      const asset = image.dataset.menuArt;
      const source = asset && asset in HOME_PANEL_ART
        ? HOME_PANEL_ART[asset as keyof typeof HOME_PANEL_ART]
        : HOME_WORLD_ART[asset as WorldId];
      if (!source) return;
      image.src = source;
      image.removeAttribute('data-menu-art');
    });
    this.homeScreen.querySelectorAll<HTMLImageElement>('img[data-menu-public-src]').forEach((image) => {
      const source = image.dataset.menuPublicSrc;
      if (!source) return;
      image.src = new URL(source, document.baseURI).href;
      image.removeAttribute('data-menu-public-src');
    });
  }

  private setCompactMenuOpen(open: boolean): void {
    const expanded = this.mobileHomeMedia.matches && open;
    this.homeMobileMenu.classList.toggle('is-open', expanded);
    this.homeMobileMenu.setAttribute('aria-hidden', String(!expanded));
    this.homeMenuButton.setAttribute('aria-expanded', String(expanded));
    this.homeMenuButton.setAttribute('aria-label', expanded ? 'Close flight menu' : 'Open flight menu');
    this.homeMenuButton.innerHTML = `<i data-lucide="${expanded ? 'x' : 'menu'}" aria-hidden="true"></i>`;
    if (expanded) this.setMobileResourcesExpanded(false);
    refreshIcons();
  }

  private setMobileResourcesExpanded(open: boolean): void {
    const expanded = this.mobileHomeMedia.matches && open;
    this.homeTopbar.classList.toggle('is-resources-open', expanded);
    this.homeProfileButton.setAttribute('aria-expanded', String(expanded));
    if (this.mobileHomeMedia.matches) {
      this.homeProfileButton.removeAttribute('aria-haspopup');
      this.homeResources.setAttribute('aria-hidden', String(!expanded));
    } else {
      this.homeProfileButton.setAttribute('aria-haspopup', 'dialog');
      this.homeResources.removeAttribute('aria-hidden');
    }
  }

  private updateSoundButtons(): void {
    const muted = this.audio.muted;
    for (const id of ['sound-button', 'home-sound-button']) {
      const button = this.button(id);
      button.setAttribute('aria-pressed', String(!muted));
      button.setAttribute('aria-label', muted ? 'Enable sound' : 'Mute sound');
      button.title = muted ? 'Enable sound' : 'Mute sound';
      button.innerHTML = `<i data-lucide="${muted ? 'volume-x' : 'volume-2'}" aria-hidden="true"></i>`;
    }
    refreshIcons();
  }

  private applySettings(): void {
    document.body.classList.toggle('reduce-motion', this.state.settings.reducedMotion);
    if (this.state.settings.reducedMotion) this.finishHomeIntro();
  }

  private showRoute(updateRoute: boolean): void {
    if (window.location.hash === '#/future-homepage') this.showFutureHomepage(updateRoute);
    else if (window.location.hash === '#/version-03') this.showVersion03(updateRoute);
    else if (window.location.hash === '#/character-sheets') this.showCharacterSheets(updateRoute);
    else if (window.location.hash === '#/outfit-03') this.showOutfit03(updateRoute);
    else if (window.location.hash === '#/sandbox') this.showSandbox(updateRoute);
    else if (window.location.hash === '#/game') this.showGame(updateRoute);
    else this.showHome(updateRoute);
  }

  private showStatus(message: string): void {
    this.setCompactMenuOpen(false);
    this.homeStatus.textContent = message;
    this.homeStatus.classList.remove('is-visible');
    window.requestAnimationFrame(() => this.homeStatus.classList.add('is-visible'));
    window.setTimeout(() => this.homeStatus.classList.remove('is-visible'), 2_800);
  }

  private toast(message: string, tone: 'default' | 'warning' | 'success' = 'default'): void {
    const toast = document.createElement('div');
    toast.className = `toast toast--${tone}`;
    toast.textContent = message;
    this.toastRegion.append(toast);
    window.setTimeout(() => toast.classList.add('is-leaving'), 2_300);
    window.setTimeout(() => toast.remove(), 2_700);
  }

  private completeRun(result: RunResult): void {
    const previousBest = this.state.bestDistance;
    this.state = recordRun(this.state, result);
    this.persist();
    this.render();
    if (result.distance > previousBest) this.toast(`New Forest record: ${result.distance} m!`, 'success');
  }

  private persist(): void {
    savePlayerState(this.state);
  }

  private pushRoute(hash: string): void {
    if (window.location.hash !== hash) window.history.pushState({}, '', hash);
  }

  private element(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Missing required element #${id}`);
    return element;
  }

  private button(id: string): HTMLButtonElement {
    return this.element(id) as HTMLButtonElement;
  }
}

const app = new HugoGoApp();

declare global {
  interface Window {
    __HUGO_GO__: {
      audio: AudioEngine;
      showHome: () => void;
      showGame: () => void;
      showSandbox: () => void;
      showOutfit03: () => void;
      showCharacterSheets: () => void;
      showVersion03: () => void;
      showFutureHomepage: () => void;
      getSelectedWorld: () => WorldId;
      getGameState: () => Readonly<FlightGameState>;
    };
  }
}

window.__HUGO_GO__ = {
  audio: app.audio,
  showHome: () => app.showHome(),
  showGame: () => app.showGame(),
  showSandbox: () => app.showSandbox(),
  showOutfit03: () => app.showOutfit03(),
  showCharacterSheets: () => app.showCharacterSheets(),
  showVersion03: () => app.showVersion03(),
  showFutureHomepage: () => app.showFutureHomepage(),
  getSelectedWorld: () => app.getSelectedWorld(),
  getGameState: () => app.getGameState(),
};
