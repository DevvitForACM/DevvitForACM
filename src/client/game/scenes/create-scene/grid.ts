import Phaser from 'phaser';
import { GRID } from '@/constants/game-constants';

const GRID_SIZE = GRID.SIZE;

export function createGrid(
  scene: Phaser.Scene
): Phaser.GameObjects.Graphics | undefined {
  const graphics = scene.add.graphics();
  if (!graphics) return undefined;
  graphics.setScrollFactor(0);
  graphics.setDepth(-1);
  return graphics;
}

export function drawGrid(
  graphics: Phaser.GameObjects.Graphics,
  camera: Phaser.Cameras.Scene2D.Camera
): { offsetX: number; offsetY: number } {
  const width = camera.width;
  const height = camera.height;

  if (!width || !height || width <= 0 || height <= 0) {
    return { offsetX: -1, offsetY: -1 };
  }

  graphics.clear();
  graphics.lineStyle(1, 0xe5e7eb, 0.5);

  const scrollX = camera.scrollX;
  const scrollY = camera.scrollY;
  const offX = ((-scrollX % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
  const offY = ((-scrollY % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;

  for (let x = offX; x <= width + GRID_SIZE; x += GRID_SIZE) {
    graphics.lineBetween(x, 0, x, height);
  }
  for (let y = offY; y <= height + GRID_SIZE; y += GRID_SIZE) {
    graphics.lineBetween(0, y, width, y);
  }

  return { offsetX: offX, offsetY: offY };
}
