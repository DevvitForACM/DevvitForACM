import Phaser from 'phaser';
import { PlayScene } from '@/game/scenes/play-scene';
import { CreateScene } from '@/game/scenes/create-scene';
import type { LevelConfig } from '@/game/level/level-types';

export function getPhaserConfig(
  level?: LevelConfig
): Phaser.Types.Core.GameConfig {
  const useMatter = !level;

  if (useMatter) {
    return createBlankCanvasConfig();
  } else {
    return createGameConfig(level!);
  }
}

export function getPhaserConfigWithLevelName(
  levelName?: string
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: 'phaser-game-container',
    backgroundColor: '#f6f7f8',
    render: { pixelArt: true, antialias: false },
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: '100%',
      height: '100%',
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 800 },
        debug: false,
      },
    },
    scene: [new PlayScene(undefined, levelName)],
  };
}

export function createGameConfig(
  level: LevelConfig
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: 'phaser-game-container',
    backgroundColor: level.bgColor,
    render: { pixelArt: true, antialias: false },
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: '100%',
      height: '100%',
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: level.gravityY },
        debug: false,
      },
    },
    scene: [new PlayScene(level)],
  };
}

export function createBlankCanvasConfig(
  backgroundColor: string = '#f6f7f8'
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: 'phaser-game-container',
    backgroundColor,
    render: { pixelArt: true, antialias: false },
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: '100%',
      height: '100%',
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 800 },
        debug: false,
      },
    },
    scene: [new CreateScene(), new PlayScene()],
  };
}

export function getBasePhaserConfig(): Phaser.Types.Core.GameConfig {
  return createBlankCanvasConfig('#000000');
}
