import { GRID } from '@/constants/game-constants';

export function convertEditorGridToNewSystem(
  editorGridY: number,
  worldHeight: number
): number {

  const editorPixelY = -(editorGridY + 1) * GRID.SIZE + GRID.SIZE / 2;
  const pixelYFromBottom = worldHeight - editorPixelY;
  const newGridY = Math.floor(pixelYFromBottom / GRID.SIZE);

  const maxGridY = Math.floor(worldHeight / GRID.SIZE) - 1;
  return Math.max(0, Math.min(maxGridY, newGridY));
}

export function isMobileDevice(): boolean {
    
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) ||
    ('ontouchstart' in window && navigator.maxTouchPoints > 0)
  );
}
