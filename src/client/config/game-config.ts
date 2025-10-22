import Phaser from 'phaser';
import { PlayScene } from '../game/scenes/play-scene';
import { CreateScene } from '../game/scenes/create-scene';
import type { LevelConfig } from '../game/level/level-types';
import { DEFAULT_LEVEL } from '../game/level/level-types';

export function createGameConfig(level: LevelConfig): Phaser.Types.Core.GameConfig {
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
        debug: false
      }
    },
    scene: [new PlayScene(level)],
  };
}

export function createBlankCanvasConfig(backgroundColor: string = '#f6f7f8'): Phaser.Types.Core.GameConfig {
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
      default: 'matter',
      matter: {
        gravity: { x: 0, y: 0.8 },
        debug: false
      },
      arcade: {
        gravity: { x: 0, y: 800 },
        debug: false,
      },
    },
    // Register both scenes so we can start PlayScene from the Create page
    scene: [new CreateScene(), new PlayScene(DEFAULT_LEVEL)],
  };
}

// Lightweight base config for consumers that want to supply their own scene
export function getPhaserConfig(): Phaser.Types.Core.GameConfig {
  return createBlankCanvasConfig('#000000');
}
