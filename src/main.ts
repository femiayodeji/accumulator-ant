import Phaser from 'phaser';
import { SplashScene } from './SplashScene';
import { StartScene } from './StartScene';
import { PhilosophyScene } from './PhilosophyScene';
import { LevelSelectScene } from './LevelSelectScene';
import { LevelScene } from './LevelScene';
import { GameScene } from './GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  antialias: true,
  roundPixels: true,
  dom: {
    createContainer: true,
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [SplashScene, StartScene, PhilosophyScene, LevelSelectScene, LevelScene, GameScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
};

new Phaser.Game(config);
