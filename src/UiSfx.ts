export class UiSfx {
  private static audioContext: AudioContext | null = null;
  private static bgmStarted: boolean = false;
  private static bgmIntervalId: number | null = null;
  private static bgmStep: number = 0;

  static playClick(): void {
    const context = this.getContext();
    if (!context || context.state !== 'running') {
      return;
    }

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(620, now);
    oscillator.frequency.linearRampToValueAtTime(760, now + 0.05);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.09);
  }

  static unlock(): void {
    const context = this.getContext();
    if (context && context.state === 'suspended') {
      void context.resume();
    }

    this.startBackgroundMusic();
  }

  static stopBackgroundMusic(): void {
    if (this.bgmIntervalId !== null) {
      window.clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
    this.bgmStarted = false;
    this.bgmStep = 0;
  }

  private static getContext(): AudioContext | null {
    if (typeof window === 'undefined') {
      return null;
    }

    if (this.audioContext) {
      return this.audioContext;
    }

    const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      return null;
    }

    this.audioContext = new AudioContextCtor();
    return this.audioContext;
  }

  private static startBackgroundMusic(): void {
    const context = this.getContext();
    if (!context || context.state !== 'running' || this.bgmStarted) {
      return;
    }

    const melody = [261.63, 329.63, 392.0, 329.63, 349.23, 440.0, 392.0, 329.63];
    const stepDuration = 0.42;

    const playStep = (): void => {
      const activeContext = this.getContext();
      if (!activeContext || activeContext.state !== 'running') {
        return;
      }

      const note = melody[this.bgmStep % melody.length];
      const now = activeContext.currentTime;

      this.playBackgroundNote(activeContext, note, now, 0.28, 0.014, 'triangle');

      if (this.bgmStep % 2 === 0) {
        this.playBackgroundNote(activeContext, note / 2, now, 0.34, 0.01, 'sine');
      }

      this.bgmStep += 1;
    };

    this.bgmStarted = true;
    playStep();
    this.bgmIntervalId = window.setInterval(playStep, stepDuration * 1000);
  }

  private static playBackgroundNote(
    context: AudioContext,
    frequency: number,
    startAt: number,
    duration: number,
    peakGain: number,
    oscillatorType: OscillatorType,
  ): void {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const endAt = startAt + duration;

    oscillator.type = oscillatorType;
    oscillator.frequency.setValueAtTime(frequency, startAt);

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(peakGain, startAt + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(startAt);
    oscillator.stop(endAt + 0.02);

    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
}
