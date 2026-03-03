import Phaser from 'phaser';
import { GAME_FONT } from '../core/config';
import { startAntsTransition } from '../transitions/SceneTransition';
import { UiSfx } from '../audio/UiSfx';

export class StartScene extends Phaser.Scene {
  private static readonly LEVEL_KEY = 'accumulator.currentLevel';
  private static readonly MAX_LEVEL_KEY = 'accumulator.maxLevel';

  constructor() {
    super({ key: 'StartScene' });
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    this.cameras.main.setBackgroundColor(0x2c3e50);
    this.cameras.main.fadeIn(400);

    // Title
    const title = this.add.text(w / 2, h * 0.1, 'ACCUMULATOR', {
      fontSize: '38px',
      fontFamily: GAME_FONT,
      color: '#f39c12',
      fontStyle: 'bold',
      stroke: '#1a252f',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);

    // Ant image
    const logo = this.add.image(w / 2, h * 0.28, 'ant-logo');
    logo.setScale(Math.min(0.35, (w * 0.4) / logo.width));

    // About / intro text
    const about = this.add.text(w / 2, h * 0.46, [
      'Guide your ant to catch falling',
      'numbers and reach the exact target.',
      '',
    ].join('\n'), {
      fontSize: '16px',
      fontFamily: GAME_FONT,
      color: '#bdc3c7',
      align: 'center',
      lineSpacing: 6,
    });
    about.setOrigin(0.5);

    this.createMusicToggle(w - 20, 20);

    // Play button
    this.createButton(w / 2, h * 0.68, 'PLAY', 0x27ae60, () => {
      const highestLevel = this.getHighestUnlockedLevel();
      this.saveCurrentLevel(highestLevel);
      startAntsTransition(this, 'LevelScene');
    });

    // Levels button
    this.createButton(w / 2, h * 0.79, 'LEVELS', 0x2980b9, () => {
      startAntsTransition(this, 'LevelSelectScene');
    }, true);

    // Philosophy button
    this.createButton(w / 2, h * 0.87, 'PHILOSOPHY', 0x8e44ad, () => {
      startAntsTransition(this, 'PhilosophyScene');
    }, true);

    // Responsive
    this.scale.on(Phaser.Scale.Events.RESIZE, () => this.scene.restart());
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    color: number,
    onClick: () => void,
    small = false,
  ): void {
    const fontSize = small ? '15px' : '24px';
    const padX = small ? 22 : 40;
    const padY = small ? 8 : 14;
    const radius = small ? 10 : 18;

    const text = this.add.text(x, y, label, {
      fontSize,
      fontFamily: GAME_FONT,
      color: '#ffffff',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);

    const bw = text.width + padX * 2;
    const bh = text.height + padY * 2;

    const bg = this.add.graphics();
    // shadow
    bg.fillStyle(0x000000, 0.25);
    bg.fillRoundedRect(x - bw / 2 + 3, y - bh / 2 + 3, bw, bh, radius);
    // button
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, radius);

    // bring text to front
    text.setDepth(1);

    // interactive hit zone
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

  private createMusicToggle(x: number, y: number): void {
    const getLabel = (): string => (UiSfx.isMusicEnabled() ? 'ON : MUSIC' : 'OFF: MUSIC');

    const musicText = this.add.text(x, y, getLabel(), {
      fontSize: '16px',
      fontFamily: GAME_FONT,
      color: '#ecf0f1',
      fontStyle: 'bold',
    });
    musicText.setOrigin(1, 0);
    musicText.setInteractive({ useHandCursor: true });

    musicText.on('pointerover', () => musicText.setColor('#f39c12'));
    musicText.on('pointerout', () => musicText.setColor('#ecf0f1'));
    musicText.on('pointerup', () => {
      UiSfx.unlock();
      UiSfx.playClick();
      UiSfx.toggleMusicEnabled();
      musicText.setText(getLabel());
      musicText.setColor('#ecf0f1');
    });
  }

  private getHighestUnlockedLevel(): number {
    const currentLevel = this.loadStoredLevel(StartScene.LEVEL_KEY);
    const maxLevel = this.loadStoredLevel(StartScene.MAX_LEVEL_KEY);
    return Math.max(currentLevel, maxLevel, 1);
  }

  private saveCurrentLevel(level: number): void {
    try {
      window.localStorage.setItem(StartScene.LEVEL_KEY, String(level));
    } catch {
      // Ignore storage failures
    }
  }

  private loadStoredLevel(key: string): number {
    try {
      const saved = window.localStorage.getItem(key);
      const parsed = Number(saved);
      if (Number.isInteger(parsed) && parsed >= 1) {
        return parsed;
      }
    } catch {
      // Ignore storage failures
    }

    return 1;
  }
}
