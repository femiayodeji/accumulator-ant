import Phaser from 'phaser';
import { startAntsTransition } from '../transitions/SceneTransition';

type NavigationState = {
  __accumulatorScene?: string;
};

type BackNavigationOptions = {
  fallbackScene?: string;
  replaceHistoryEntry?: boolean;
  edgeSwipeGesture?: boolean;
};

const EDGE_SWIPE_START_X = 36;
const EDGE_SWIPE_MIN_X_DELTA = 80;
const EDGE_SWIPE_MAX_Y_DELTA = 60;

function setSceneHistory(sceneKey: string, replace: boolean): void {
  if (typeof window === 'undefined' || !window.history) {
    return;
  }

  const current = (window.history.state || {}) as NavigationState;
  const nextState: NavigationState = {
    ...current,
    __accumulatorScene: sceneKey,
  };

  if (replace) {
    window.history.replaceState(nextState, '');
    return;
  }

  if (current.__accumulatorScene !== sceneKey) {
    window.history.pushState(nextState, '');
  }
}

function requestBack(fallback: (() => void) | null): void {
  if (typeof window === 'undefined' || !window.history) {
    fallback?.();
    return;
  }

  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  fallback?.();
}

export function registerSceneBackNavigation(
  scene: Phaser.Scene,
  options: BackNavigationOptions = {},
): void {
  const {
    fallbackScene,
    replaceHistoryEntry = false,
    edgeSwipeGesture = true,
  } = options;

  setSceneHistory(scene.scene.key, replaceHistoryEntry);

  let navigationTriggered = false;
  let edgeSwipeStart: { x: number; y: number; id: number } | null = null;

  const navigateTo = (sceneKey: string) => {
    if (navigationTriggered || sceneKey === scene.scene.key) {
      return;
    }

    navigationTriggered = true;
    startAntsTransition(scene, sceneKey);
  };

  const fallbackAction = fallbackScene
    ? () => navigateTo(fallbackScene)
    : null;

  const handleKeyboardBack = () => {
    requestBack(fallbackAction);
  };

  const escKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  const backspaceKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE);

  escKey?.on('down', (_key: Phaser.Input.Keyboard.Key, event: KeyboardEvent) => {
    event.preventDefault();
    handleKeyboardBack();
  });

  backspaceKey?.on('down', (_key: Phaser.Input.Keyboard.Key, event: KeyboardEvent) => {
    event.preventDefault();
    handleKeyboardBack();
  });

  const onPopState = (event: PopStateEvent) => {
    const targetScene = (event.state as NavigationState | null)?.__accumulatorScene;
    if (targetScene) {
      navigateTo(targetScene);
      return;
    }

    fallbackAction?.();
  };

  window.addEventListener('popstate', onPopState);

  const onPointerDown = (pointer: Phaser.Input.Pointer) => {
    if (!edgeSwipeGesture) {
      return;
    }

    if (pointer.x <= EDGE_SWIPE_START_X) {
      edgeSwipeStart = { x: pointer.x, y: pointer.y, id: pointer.id };
    }
  };

  const onPointerUp = (pointer: Phaser.Input.Pointer) => {
    if (!edgeSwipeGesture || !edgeSwipeStart || edgeSwipeStart.id !== pointer.id) {
      return;
    }

    const deltaX = pointer.x - edgeSwipeStart.x;
    const deltaY = Math.abs(pointer.y - edgeSwipeStart.y);
    edgeSwipeStart = null;

    if (deltaX >= EDGE_SWIPE_MIN_X_DELTA && deltaY <= EDGE_SWIPE_MAX_Y_DELTA) {
      requestBack(fallbackAction);
    }
  };

  scene.input.on('pointerdown', onPointerDown);
  scene.input.on('pointerup', onPointerUp);
  scene.input.on('pointerupoutside', onPointerUp);

  const cleanup = () => {
    window.removeEventListener('popstate', onPopState);
    escKey?.off('down');
    backspaceKey?.off('down');
    scene.input.off('pointerdown', onPointerDown);
    scene.input.off('pointerup', onPointerUp);
    scene.input.off('pointerupoutside', onPointerUp);
  };

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  scene.events.once(Phaser.Scenes.Events.DESTROY, cleanup);
}
