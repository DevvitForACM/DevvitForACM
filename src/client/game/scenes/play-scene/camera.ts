import Phaser from 'phaser';
import type { LevelData } from '@/game/level/level-schema';
import { CAMERA_CONFIG } from '@/constants/game-constants';

export function calculateResponsiveZoom(
  camera: Phaser.Cameras.Scene2D.Camera,
  levelData: LevelData | null
): number {
  const bounds = levelData?.settings?.bounds;

  if (!bounds) {
    return CAMERA_CONFIG.ZOOM;
  }

  const viewportWidth = camera.width;
  const viewportHeight = camera.height;

  const zoomForWidth = viewportWidth / bounds.width;
  const zoomForHeight = viewportHeight / bounds.height;

  let calculatedZoom = Math.min(zoomForWidth, zoomForHeight) * 0.95;

  if (bounds.width < 800 && bounds.height < 400) {
    calculatedZoom = Math.min(2.0, Math.max(1.2, calculatedZoom));
  } else if (bounds.height < viewportHeight / CAMERA_CONFIG.ZOOM) {
    calculatedZoom = (viewportHeight / bounds.height) * 0.9;
  }

  calculatedZoom = Math.max(
    CAMERA_CONFIG.MIN_ZOOM,
    Math.min(CAMERA_CONFIG.MAX_ZOOM, calculatedZoom)
  );

  if (viewportWidth < 768) {
    calculatedZoom *= 0.85;
  }

  return calculatedZoom;
}

export function setupCamera(
  camera: Phaser.Cameras.Scene2D.Camera,
  player: Phaser.GameObjects.Sprite,
  levelData: LevelData | null
): void {
  camera.startFollow(
    player as any,
    true,
    CAMERA_CONFIG.FOLLOW_LERP,
    CAMERA_CONFIG.FOLLOW_LERP
  );

  const zoom = calculateResponsiveZoom(camera, levelData);
  camera.setZoom(zoom);
  camera.roundPixels = true;
}
