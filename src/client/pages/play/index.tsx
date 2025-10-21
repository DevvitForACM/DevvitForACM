import PhaserContainer from '@/components/phaser-container';
import { createGameConfig } from '@/config/game-config';
import { DEFAULT_LEVEL, type LevelConfig } from '@/game/level/level-types';

export default function Play() {
  // Example: configure props per level; can be sourced from props, query, or state
  const level: LevelConfig = {
    ...DEFAULT_LEVEL,
    worldWidth: 8000,
    gravityY: 1100,
    moveSpeed: 260,
    jumpVelocity: 520,
    hazards: [
      { x: 1200, y: 540, width: 20, height: 40, color: 0x2dd4bf },
      { x: 2500, y: 540, width: 20, height: 40, color: 0x2dd4bf },
    ],
  };

  const config = createGameConfig(level);

  return (
    <main className="w-screen h-screen overflow-hidden" style={{ background: level.bgColor }}>
      <PhaserContainer config={config} />
    </main>
  );
}
