import Phaser from 'phaser';
import { SplashScene } from './scenes/SplashScene';
import { StartScene } from './scenes/StartScene';
import { PhilosophyScene } from './scenes/PhilosophyScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { LevelScene } from './scenes/LevelScene';
import { GameScene } from './scenes/GameScene';
import { registerPwa } from './pwa/registerPwa';
import { initGoogleIntegrations } from './analytics/telemetry';
import { initPersistentStorage } from './core/persistentStorage';

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

async function bootstrap(): Promise<void> {
  initGoogleIntegrations();
  await initPersistentStorage();
  new Phaser.Game(config);
  registerPwa();
}

void bootstrap();
