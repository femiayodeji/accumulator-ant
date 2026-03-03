export class GameSfx {
  private audioContext: AudioContext | null = null;

  unlock(): void {
    const context = this.getOrCreateContext();
    if (!context) return;

    if (context.state === 'suspended') {
      void context.resume();
    }
  }

  playTopUp(): void {
    const context = this.getActiveContext();
    if (!context) return;

    this.playTone(context, {
      frequency: 680,
      duration: 0.08,
      type: 'triangle',
      gain: 0.07,
      slideTo: 860,
      offset: 0,
    });

    this.playTone(context, {
      frequency: 920,
      duration: 0.085,
      type: 'sine',
      gain: 0.06,
      slideTo: 1080,
      offset: 0.06,
    });
  }

  playTopDown(): void {
    const context = this.getActiveContext();
    if (!context) return;

    this.playTone(context, {
      frequency: 980,
      duration: 0.1,
      type: 'square',
      gain: 0.1,
      slideTo: 700,
      offset: 0,
    });

    this.playTone(context, {
      frequency: 760,
      duration: 0.11,
      type: 'triangle',
      gain: 0.085,
      slideTo: 520,
      offset: 0.06,
    });

    this.playTone(context, {
      frequency: 620,
      duration: 0.06,
      type: 'sawtooth',
      gain: 0.065,
      slideTo: 460,
      offset: 0.14,
    });
  }

  playLevelComplete(): void {
    const context = this.getActiveContext();
    if (!context) return;

    this.playTone(context, {
      frequency: 660,
      duration: 0.11,
      type: 'triangle',
      gain: 0.08,
      offset: 0,
    });

    this.playTone(context, {
      frequency: 880,
      duration: 0.12,
      type: 'triangle',
      gain: 0.08,
      offset: 0.1,
    });

    this.playTone(context, {
      frequency: 1100,
      duration: 0.14,
      type: 'sine',
      gain: 0.07,
      offset: 0.22,
    });
  }

  destroy(): void {
    if (!this.audioContext) return;

    if (this.audioContext.state !== 'closed') {
      void this.audioContext.close();
    }

    this.audioContext = null;
  }

  private getOrCreateContext(): AudioContext | null {
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

  private getActiveContext(): AudioContext | null {
    const context = this.getOrCreateContext();
    if (!context) {
      return null;
    }

    if (context.state === 'suspended') {
      void context.resume();
      return null;
    }

    if (context.state !== 'running') {
      return null;
    }

    return context;
  }

  private playTone(
    context: AudioContext,
    options: {
      frequency: number;
      duration: number;
      type: OscillatorType;
      gain: number;
      slideTo?: number;
      offset?: number;
    }
  ): void {
    const now = context.currentTime;
    const startAt = now + (options.offset ?? 0);
    const endAt = startAt + options.duration;

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = options.type;
    oscillator.frequency.setValueAtTime(options.frequency, startAt);

    if (options.slideTo !== undefined) {
      oscillator.frequency.linearRampToValueAtTime(options.slideTo, endAt);
    }

    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(options.gain, startAt + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(startAt);
    oscillator.stop(endAt + 0.01);

    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
  }
}
