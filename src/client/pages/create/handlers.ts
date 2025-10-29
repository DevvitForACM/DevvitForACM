import { SCENE_KEYS } from '@/constants/game-constants';

export function handleJoystickMove(x: number, y: number) {
  const game = (window as any).game;
  if (game) {
    const scene = game.scene.getScene(SCENE_KEYS.PLAY);
    if (scene && typeof scene.setMobileJoystick === 'function') {
      scene.setMobileJoystick(x, y);
    }
  }
}

export function handleJump() {
  const game = (window as any).game;
  if (game) {
    const scene = game.scene.getScene(SCENE_KEYS.PLAY);
    if (scene && typeof scene.setMobileJump === 'function') {
      scene.setMobileJump(true);
    }
  }
}

