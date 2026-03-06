import { persistGetItem, persistSetItem } from '../core/persistentStorage';

export class UiSfx {
  private static readonly MUSIC_ENABLED_KEY = 'accumulator.musicEnabled';
  private static audioContext: AudioContext | null = null;
  private static bgmAudio: HTMLAudioElement | null = null;

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

  static isMusicEnabled(): boolean {
    if (typeof window === 'undefined') {
      return true;
    }

    try {
      const saved = persistGetItem(this.MUSIC_ENABLED_KEY);
      if (saved === null) {
        return true;
      }

      return saved === '1';
    } catch {
      return true;
    }
  }

  static toggleMusicEnabled(): boolean {
    const nextEnabled = !this.isMusicEnabled();
    this.setMusicEnabled(nextEnabled);

    if (nextEnabled) {
      this.startBackgroundMusic();
    } else {
      this.stopBackgroundMusic();
    }

    return nextEnabled;
  }

  static stopBackgroundMusic(): void {
    if (!this.bgmAudio) {
      return;
    }

    this.bgmAudio.pause();
    this.bgmAudio.currentTime = 0;
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
    if (!this.isMusicEnabled()) {
      this.stopBackgroundMusic();
      return;
    }

    const bgm = this.getOrCreateBackgroundAudio();
    if (!bgm) {
      return;
    }

    void bgm.play().catch(() => {
      // Autoplay can be blocked until user gesture.
    });
  }

  private static setMusicEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      persistSetItem(this.MUSIC_ENABLED_KEY, enabled ? '1' : '0');
    } catch {
      // Ignore storage failures
    }
  }

  private static getOrCreateBackgroundAudio(): HTMLAudioElement | null {
    if (typeof window === 'undefined') {
      return null;
    }

    if (this.bgmAudio) {
      return this.bgmAudio;
    }

    const audio = new Audio('/assets/antill.mp3');
    audio.loop = true;
    audio.volume = 0.35;
    audio.preload = 'auto';
    this.bgmAudio = audio;
    return audio;
  }
}
