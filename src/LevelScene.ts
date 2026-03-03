import Phaser from 'phaser';
import { GAME_FONT, DifficultySystem, LevelStatsStorage } from './config';
import { startAntsTransition } from './SceneTransition';
import { UiSfx } from './UiSfx';

export class LevelScene extends Phaser.Scene {
  private static readonly LEVEL_KEY = 'accumulator.currentLevel';

  constructor() {
    super({ key: 'LevelScene' });
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const level = this.getSavedLevel();
    const range = DifficultySystem.getNumberRange(level);

    this.cameras.main.setBackgroundColor(0x2c3e50);
    this.cameras.main.fadeIn(300);

    // Back button (top-left)
    this.createNavButton(20, 20, '← HOME', () => {
      startAntsTransition(this, 'StartScene');
    });

    // Levels button (top-right)
    this.createNavButton(w - 20, 20, 'LEVELS ≡', () => {
      startAntsTransition(this, 'LevelSelectScene');
    }, true);

    // Large level number
    this.add.text(w / 2, h * 0.18, `LEVEL ${level}`, {
      fontSize: '48px',
      fontFamily: GAME_FONT,
      color: '#f39c12',
      fontStyle: 'bold',
      stroke: '#1a252f',
      strokeThickness: 5,
    }).setOrigin(0.5);

    // Decorative line
    const lineGfx = this.add.graphics();
    lineGfx.lineStyle(3, 0xf39c12, 0.5);
    lineGfx.lineBetween(w * 0.2, h * 0.25, w * 0.8, h * 0.25);

    // Stats
    const stats = [
      `Numbers: ${range.min} to +${range.max}`,
    ];

    stats.forEach((line, i) => {
      this.add.text(w / 2, h * 0.32 + i * 36, line, {
        fontSize: '18px',
        fontFamily: GAME_FONT,
        color: '#ecf0f1',
      }).setOrigin(0.5);
    });

    // Best run stats (if available)
    const bestStats = LevelStatsStorage.load(level);
    if (bestStats) {
      this.add.text(w / 2, h * 0.49, `\u23F1 Best: ${bestStats.bestTime.toFixed(1)}s`, {
        fontSize: '16px',
        fontFamily: GAME_FONT,
        color: '#f1c40f',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      this.add.text(w / 2, h * 0.53, LevelStatsStorage.formatNumbers(bestStats.numbers), {
        fontSize: '12px',
        fontFamily: GAME_FONT,
        color: '#7f8c8d',
        align: 'center',
        wordWrap: { width: w - 60 },
      }).setOrigin(0.5);
    }

    // Ant walking gif (animated DOM img)
    const antEl = document.createElement('img');
    antEl.src = 'assets/ant-walking.gif';
    const gifSize = Math.min(w * 0.2, 80);
    antEl.style.width = `${gifSize}px`;
    antEl.style.height = `${gifSize}px`;
    antEl.style.objectFit = 'cover';
    antEl.style.borderRadius = '50%';
    antEl.style.border = '3px solid rgba(243,156,18,0.6)';
    antEl.style.boxShadow = '0 3px 12px rgba(0,0,0,0.4)';
    antEl.style.pointerEvents = 'none';
    const antDom = this.add.dom(w / 2, h * 0.62, antEl);

    // Pulse animation on ant
    this.tweens.add({
      targets: antDom,
      scaleX: 1.06,
      scaleY: 1.06,
      yoyo: true,
      repeat: -1,
      duration: 800,
      ease: 'Sine.easeInOut',
    });

    // GO button
    this.createGameButton(w / 2, h * 0.78, 'GO!', 0x27ae60, () => {
      startAntsTransition(this, 'GameScene', { level });
    });

    // Responsive
    this.scale.on(Phaser.Scale.Events.RESIZE, () => this.scene.restart());
  }

  private createNavButton(x: number, y: number, label: string, onClick: () => void, rightAlign = false): void {
    const text = this.add.text(x, y, label, {
      fontSize: '16px',
      fontFamily: GAME_FONT,
      color: '#ecf0f1',
      fontStyle: 'bold',
    });
    text.setOrigin(rightAlign ? 1 : 0, 0);
    text.setInteractive({ useHandCursor: true });
    text.on('pointerover', () => text.setColor('#f39c12'));
    text.on('pointerout', () => text.setColor('#ecf0f1'));
    text.on('pointerup', () => {
      UiSfx.unlock();
      UiSfx.playClick();
      onClick();
    });
  }

  private getSavedLevel(): number {
    try {
      const saved = window.localStorage.getItem(LevelScene.LEVEL_KEY);
      const parsed = Number(saved);
      if (Number.isInteger(parsed) && parsed >= 1) return parsed;
    } catch { /* ignore */ }
    return 1;
  }

  private createGameButton(
    x: number,
    y: number,
    label: string,
    color: number,
    onClick: () => void,
  ): void {
    const text = this.add.text(x, y, label, {
      fontSize: '32px',
      fontFamily: GAME_FONT,
      color: '#ffffff',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);

    const bw = text.width + 80;
    const bh = text.height + 28;
    const radius = 20;

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.25);
    bg.fillRoundedRect(x - bw / 2 + 3, y - bh / 2 + 3, bw, bh, radius);
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, radius);

    text.setDepth(1);

    const hitZone = this.add.rectangle(x, y, bw, bh, 0x000000, 0);
    hitZone.setInteractive({ useHandCursor: true });

    hitZone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x000000, 0.25);
      bg.fillRoundedRect(x - bw / 2 + 3, y - bh / 2 + 3, bw, bh, radius);
      bg.fillStyle(Phaser.Display.Color.IntegerToColor(color).brighten(15).color, 1);
      bg.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, radius);
    });

    hitZone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x000000, 0.25);
      bg.fillRoundedRect(x - bw / 2 + 3, y - bh / 2 + 3, bw, bh, radius);
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, radius);
    });

    hitZone.on('pointerdown', () => {
      text.y += 2;
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(x - bw / 2 + 1, y - bh / 2 + 2, bw, bh, radius);
    });

    hitZone.on('pointerup', () => {
      text.y = y;
      UiSfx.unlock();
      UiSfx.playClick();
      onClick();
    });
  }
}
