export class FutureHomepageAudio {
  private readonly audio: HTMLAudioElement;
  private readonly interactionTarget: EventTarget;
  private active = false;
  private retryController?: AbortController;
  private playAttempt?: Promise<void>;

  constructor(root: HTMLElement, interactionTarget: EventTarget = document) {
    const audio = root.querySelector<HTMLAudioElement>('#future-homepage-sleepy-audio');
    if (!audio) {
      throw new Error('Future Homepage Sleepy audio element is missing');
    }

    this.audio = audio;
    this.interactionTarget = interactionTarget;
    this.audio.volume = 0.55;
    this.audio.addEventListener('pause', this.handleUnexpectedPause);
  }

  start(): void {
    this.active = true;
    this.cancelRetry();
    this.audio.autoplay = true;
    if (this.audio.networkState === 0) {
      this.audio.load();
    }
    this.audio.currentTime = 0;
    this.armRetry();
    void this.playOrRetry();
  }

  stop(): void {
    this.active = false;
    this.cancelRetry();
    this.playAttempt = undefined;
    this.audio.autoplay = false;
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  private async playOrRetry(): Promise<void> {
    if (!this.active) return;
    if (this.audio.paused === false) {
      this.cancelRetry();
      return;
    }
    if (this.playAttempt) return this.playAttempt;

    const attempt = this.beginPlayback();
    this.playAttempt = attempt;
    try {
      await attempt;
      if (this.active) this.cancelRetry();
    } catch {
      if (this.active) this.armRetry();
    } finally {
      if (this.playAttempt === attempt) this.playAttempt = undefined;
    }
  }

  private beginPlayback(): Promise<void> {
    try {
      return this.audio.play();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  private armRetry(): void {
    if (this.retryController) return;

    const controller = new AbortController();
    this.retryController = controller;
    const retry = (): void => {
      if (!this.active || this.audio.paused === false) return;
      void this.playOrRetry();
    };
    const options: AddEventListenerOptions = {
      capture: true,
      signal: controller.signal,
    };

    this.interactionTarget.addEventListener('pointerdown', retry, options);
    this.interactionTarget.addEventListener('pointerup', retry, options);
    this.interactionTarget.addEventListener('touchend', retry, options);
    this.interactionTarget.addEventListener('click', retry, options);
    this.interactionTarget.addEventListener('keydown', retry, options);
    this.audio.addEventListener('canplay', retry, options);
    this.audio.addEventListener('loadeddata', retry, options);
  }

  private cancelRetry(): void {
    this.retryController?.abort();
    this.retryController = undefined;
  }

  private readonly handleUnexpectedPause = (): void => {
    if (!this.active) return;
    this.armRetry();
    void this.playOrRetry();
  };
}
