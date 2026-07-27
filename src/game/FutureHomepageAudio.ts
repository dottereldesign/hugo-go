export class FutureHomepageAudio {
  private readonly audio: HTMLAudioElement;
  private active = false;
  private retryController?: AbortController;

  constructor(root: HTMLElement) {
    const audio = root.querySelector<HTMLAudioElement>('#future-homepage-sleepy-audio');
    if (!audio) {
      throw new Error('Future Homepage Sleepy audio element is missing');
    }

    this.audio = audio;
    this.audio.volume = 0.55;
  }

  start(): void {
    this.active = true;
    this.cancelRetry();
    this.audio.currentTime = 0;
    void this.playOrRetry();
  }

  stop(): void {
    this.active = false;
    this.cancelRetry();
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  private async playOrRetry(): Promise<void> {
    try {
      await this.audio.play();
      this.cancelRetry();
    } catch {
      if (this.active) this.armRetry();
    }
  }

  private armRetry(): void {
    if (this.retryController) return;

    const controller = new AbortController();
    this.retryController = controller;
    const retry = (): void => {
      if (!this.active) return;
      this.cancelRetry();
      void this.playOrRetry();
    };
    const options: AddEventListenerOptions = {
      capture: true,
      once: true,
      signal: controller.signal,
    };

    document.addEventListener('pointerdown', retry, options);
    document.addEventListener('keydown', retry, options);
  }

  private cancelRetry(): void {
    this.retryController?.abort();
    this.retryController = undefined;
  }
}
