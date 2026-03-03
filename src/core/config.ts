import Phaser from 'phaser';

export const GAME_FONT = 'Fredoka, Arial, sans-serif';

export const GameConfig = {
  // Screen dimensions (mobile-first)
  width: 375,
  height: 667,
  
  // Colors — vivid & high-contrast
  colors: {
    background: 0xe8f6f3,
    target: 0x1abc9c,
    current: 0xff4757,
    numberPositive: 0x0984e3,
    numberNegative: 0xd63031,
    antBody: 0xa0522d,
    antHead: 0x5d3a1a,
    sackBalanced: 0x2ecc71,
    sackSeeking: 0x0984e3,
    sackBurdened: 0xff4757,
  },
  
  // Ant configuration
  ant: {
    baseSpeed: 200,
    size: 40,
    startX: 187.5, // Center of screen
    startY: 600,
  },
  
  // Number spawn configuration
  numbers: {
    fontSize: 32,
    spawnY: -50,
    minX: 50,
    maxX: 325,
  },
};

// Difficulty formulas for endless progression
export class DifficultySystem {
  static getTarget(level: number): number {
    const baseTarget = 10 + (level * 5) + (Math.log(level + 1) * 10);
    const variance = Math.max(3, Math.floor(baseTarget * 0.18));
    const minTarget = Math.max(6, Math.floor(baseTarget - variance));
    const maxTarget = Math.floor(baseTarget + variance);

    return Phaser.Math.Between(minTarget, maxTarget);
  }
  
  static getNumberRange(level: number): { min: number; max: number } {
    const maxValue = Math.min(3 + Math.floor(level / 5), 15);
    return { min: -maxValue, max: maxValue };
  }
  
  static getFallSpeed(level: number): number {
    const baseSpeed = 160;
    const speedIncrease = Math.min(level * 8, 340);
    return baseSpeed + speedIncrease;
  }
  
  static getSpawnRate(level: number): number {
    // Milliseconds between spawns
    return Math.max(1600 - (level * 35), 600);
  }
}

// ── Per-level stats persistence ──

export interface LevelStatsEntry {
  numbers: number[];
  bestTime: number; // seconds
  target: number;
}

export class LevelStatsStorage {
  private static readonly KEY = 'accumulator.levelStats';

  static save(
    level: number,
    numbers: number[],
    time: number,
    target: number,
  ): boolean {
    const all = this.loadAll();
    const key = String(level);
    const existing = all[key];
    const isNewBest = !existing || time < existing.bestTime;

    if (isNewBest) {
      all[key] = { numbers, bestTime: time, target };
    }

    try {
      window.localStorage.setItem(this.KEY, JSON.stringify(all));
    } catch { /* ignore */ }

    return isNewBest;
  }

  static load(level: number): LevelStatsEntry | null {
    const all = this.loadAll();
    return all[String(level)] || null;
  }

  static loadAll(): Record<string, LevelStatsEntry> {
    try {
      const raw = window.localStorage.getItem(this.KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return {};
  }

  static formatNumbers(numbers: number[]): string {
    const parts = numbers.map(n => (n >= 0 ? `+${n}` : `${n}`));
    if (parts.length <= 12) return parts.join(', ');
    return parts.slice(0, 5).join(', ') + ', …, ' + parts.slice(-3).join(', ');
  }
}
