import Phaser from 'phaser';
import { GAME_FONT } from '../core/config';
import { startAntsTransition } from '../transitions/SceneTransition';
import { UiSfx } from '../audio/UiSfx';
import { trackEvent, trackScreenView } from '../analytics/telemetry';

export class LevelSelectScene extends Phaser.Scene {
  private static readonly LEVEL_KEY = 'accumulator.currentLevel';
  private static readonly MAX_LEVEL_KEY = 'accumulator.maxLevel';

  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const maxLevel = this.getSavedLevel();

    trackScreenView('LevelSelectScene');

    this.cameras.main.setBackgroundColor(0x1a252f);
    this.cameras.main.fadeIn(300);

    // Back button
    this.createNavButton(20, 20, '← BACK', () => {
      trackEvent('level_select_back_clicked');
      startAntsTransition(this, 'StartScene');
    });

    // Title
    this.add.text(w / 2, h * 0.08, 'SELECT LEVEL', {
      fontSize: '32px',
      fontFamily: GAME_FONT,
      color: '#f39c12',
      fontStyle: 'bold',
      stroke: '#1a252f',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Scrollable grid area
    const gridTop = h * 0.15;
    const gridBottom = h - 20;
    const gridHeight = gridBottom - gridTop;

    // Grid configuration
    const cols = Math.min(5, Math.max(3, Math.floor((w - 40) / 72)));
    const cellSize = Math.min(64, Math.floor((w - 40 - (cols - 1) * 10) / cols));
    const gap = 10;
    const totalGridW = cols * cellSize + (cols - 1) * gap;
    const startX = (w - totalGridW) / 2;

    const container = this.add.container(0, 0);
    let row = 0;
    let col = 0;

    for (let level = 1; level <= maxLevel; level++) {
      const cx = startX + col * (cellSize + gap) + cellSize / 2;
      const cy = gridTop + row * (cellSize + gap + 16) + cellSize / 2;

      this.createLevelTile(container, cx, cy, cellSize, level, maxLevel);

      col++;
      if (col >= cols) {
        col = 0;
        row++;
      }
    }

    // Calculate content height for scrolling
    const totalRows = Math.ceil(maxLevel / cols);
    const contentHeight = totalRows * (cellSize + gap + 16);
    const maxScroll = Math.max(0, contentHeight - gridHeight + 20);

    // Scroll input
    let scrollY = 0;
    let isDragging = false;
    let lastY = 0;

    const applyScroll = () => {
      container.y = -scrollY;
    };

    this.input.on('wheel', (_p: Phaser.Input.Pointer, _g: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      scrollY = Phaser.Math.Clamp(scrollY + dy * 0.5, 0, maxScroll);
      applyScroll();
    });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.y > gridTop) {
        isDragging = true;
        lastY = p.y;
      }
    });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (isDragging) {
        scrollY = Phaser.Math.Clamp(scrollY + (lastY - p.y), 0, maxScroll);
        applyScroll();
        lastY = p.y;
      }
    });

    this.input.on('pointerup', () => { isDragging = false; });
    this.input.on('pointerupoutside', () => { isDragging = false; });

    // Responsive
    this.scale.on(Phaser.Scale.Events.RESIZE, () => this.scene.restart());
  }

  private createLevelTile(
    container: Phaser.GameObjects.Container,
    cx: number,
    cy: number,
    size: number,
    level: number,
    _maxLevel: number,
  ): void {
    // Tile background
    const bg = this.add.graphics();
    const color = 0x2980b9;
    bg.fillStyle(0x000000, 0.3);
    bg.fillRoundedRect(cx - size / 2 + 2, cy - size / 2 + 2, size, size, 10);
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(cx - size / 2, cy - size / 2, size, size, 10);
    container.add(bg);

    // Level number
    const numText = this.add.text(cx, cy - 4, `${level}`, {
      fontSize: `${Math.max(18, size * 0.4)}px`,
      fontFamily: GAME_FONT,
      color: '#ffffff',
      fontStyle: 'bold',
    });
    numText.setOrigin(0.5);
    container.add(numText);

    // Hit zone
    const hitZone = this.add.rectangle(cx, cy, size, size, 0x000000, 0);
    hitZone.setInteractive({ useHandCursor: true });
    container.add(hitZone);

    hitZone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x000000, 0.3);
      bg.fillRoundedRect(cx - size / 2 + 2, cy - size / 2 + 2, size, size, 10);
      bg.fillStyle(Phaser.Display.Color.IntegerToColor(color).brighten(20).color, 1);
      bg.fillRoundedRect(cx - size / 2, cy - size / 2, size, size, 10);
    });

    hitZone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x000000, 0.3);
      bg.fillRoundedRect(cx - size / 2 + 2, cy - size / 2 + 2, size, size, 10);
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(cx - size / 2, cy - size / 2, size, size, 10);
    });

    hitZone.on('pointerup', () => {
      UiSfx.unlock();
      UiSfx.playClick();
      trackEvent('level_selected', { level });
      startAntsTransition(this, 'GameScene', { level });
    });
  }

  private createNavButton(x: number, y: number, label: string, onClick: () => void): void {
    const text = this.add.text(x, y, label, {
      fontSize: '16px',
      fontFamily: GAME_FONT,
      color: '#ecf0f1',
      fontStyle: 'bold',
    });
    text.setOrigin(0, 0);
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
      const maxSaved = window.localStorage.getItem(LevelSelectScene.MAX_LEVEL_KEY);
      const maxParsed = Number(maxSaved);
      if (Number.isInteger(maxParsed) && maxParsed >= 1) return maxParsed;

      const currentSaved = window.localStorage.getItem(LevelSelectScene.LEVEL_KEY);
      const currentParsed = Number(currentSaved);
      if (Number.isInteger(currentParsed) && currentParsed >= 1) return currentParsed;
    } catch { /* ignore */ }
    return 1;
  }
}
