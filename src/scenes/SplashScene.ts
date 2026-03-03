import Phaser from 'phaser';
import { GAME_FONT } from '../core/config';
import { startAntsTransition } from '../transitions/SceneTransition';

export class SplashScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SplashScene' });
  }

  preload(): void {
    this.load.image('ant-logo', 'assets/ant.png');
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    this.cameras.main.setBackgroundColor(0x2c3e50);

    // Ant logo
    const logo = this.add.image(w / 2, h * 0.38, 'ant-logo');
    logo.setScale(Math.min(0.45, (w * 0.5) / logo.width));
    logo.setAlpha(0);

    // Title
    const title = this.add.text(w / 2, h * 0.6, 'ACCUMULATOR', {
      fontSize: '42px',
      fontFamily: GAME_FONT,
      color: '#f39c12',
      fontStyle: 'bold',
      stroke: '#2c3e50',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);
    title.setAlpha(0);

    // Subtitle
    const subtitle = this.add.text(w / 2, h * 0.67, 'Discipline Through Numbers', {
      fontSize: '18px',
      fontFamily: GAME_FONT,
      color: '#ecf0f1',
    });
    subtitle.setOrigin(0.5);
    subtitle.setAlpha(0);

    // Fade in logo then text
    this.tweens.add({
      targets: logo,
      alpha: 1,
      scale: logo.scale * 1.05,
      duration: 800,
      ease: 'Power2',
    });

    this.tweens.add({
      targets: title,
      alpha: 1,
      y: title.y - 8,
      duration: 600,
      ease: 'Back.easeOut',
      delay: 500,
    });

    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 500,
      delay: 900,
    });

    // Auto-advance
    this.time.delayedCall(2800, () => {
      startAntsTransition(this, 'StartScene');
    });
  }
}
