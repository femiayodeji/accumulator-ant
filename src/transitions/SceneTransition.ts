import Phaser from 'phaser';
import { GameConfig } from '../core/config';

type TransitionScene = Phaser.Scene & {
  __antsTransitionActive?: boolean;
};

export function startAntsTransition(
  scene: Phaser.Scene,
  sceneKey: string,
  data?: Record<string, unknown>,
): void {
  const transitionScene = scene as TransitionScene;
  if (transitionScene.__antsTransitionActive) {
    return;
  }
  transitionScene.__antsTransitionActive = true;
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    transitionScene.__antsTransitionActive = false;
  });

  window.gtag && window.gtag('event', 'scene_transition', {
    from_scene: scene.scene.key,
    to_scene: sceneKey,
  });

  const w = scene.scale.width;
  const h = scene.scale.height;

  const overlay = scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0);
  overlay.setDepth(9998);

  const antsEl = document.createElement('img');
  antsEl.src = 'assets/ants.gif';
  antsEl.style.width = `${w}px`;
  antsEl.style.height = `${h}px`;
  antsEl.style.objectFit = 'cover';
  antsEl.style.pointerEvents = 'none';

  const antsDom = scene.add.dom(w / 2, h / 2, antsEl);
  antsDom.setDepth(9999);
  antsDom.setAlpha(0);

  scene.tweens.add({
    targets: overlay,
    alpha: 0.35,
    duration: GameConfig.transitions.ants.overlayFadeMs,
    ease: 'Power2',
  });

  scene.tweens.add({
    targets: antsDom,
    alpha: 1,
    duration: GameConfig.transitions.ants.antsFadeInMs,
    ease: 'Power2',
    onComplete: () => {
      scene.time.delayedCall(GameConfig.transitions.ants.holdBeforeSwitchMs, () => {
        overlay.destroy();
        antsDom.destroy();
        transitionScene.__antsTransitionActive = false;
        scene.scene.start(sceneKey, data);
      });
    },
  });
}
