// src/client/config/game-config.ts
import Phaser from "phaser";
import { PlayScene } from "../game/scenes/play-scene";
import { CreateScene } from "../game/scenes/create-scene";
import type { LevelConfig } from "../game/level/level-types";

/**
 * Returns a Phaser Game Configuration.
 * Supports both Matter.js (for physics-heavy levels)
 * and Arcade (for simpler platformer-style levels).
 */
export function getPhaserConfig(level?: LevelConfig): Phaser.Types.Core.GameConfig {
  const useMatter = !level; // If no explicit level config, default to Matter.js + JSON levels
  
  if (useMatter) {
    return createBlankCanvasConfig();
  } else {
    return createGameConfig(level!);
  }
}

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
    scene: [new CreateScene(), new PlayScene()],
  };
}

// Lightweight base config for consumers that want to supply their own scene
export function getBasePhaserConfig(): Phaser.Types.Core.GameConfig {
  return createBlankCanvasConfig('#000000');
}
