import PhaserContainer from '@/components/phaser-container';
<<<<<<< HEAD
import { createGameConfig } from '@/lib/game-config';
import { DEFAULT_LEVEL, type LevelConfig } from '@/lib/level-types';

export default function Play() {
  // Example: configure props per level; can be sourced from props, query, or state
  const level: LevelConfig = {
    ...DEFAULT_LEVEL,
    worldWidth: 8000,
    gravityY: 1100,
    moveSpeed: 260,
    jumpVelocity: 520,
    useMapControls: true,
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
=======
import { gameConfig } from '@/lib/game-config';

export default function Play() {
  return (
    <main className="w-screen h-screen bg-black overflow-hidden">
      <PhaserContainer config={gameConfig} />
    </main>
  );
}
>>>>>>> origin/main
