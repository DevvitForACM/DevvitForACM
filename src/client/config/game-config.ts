// src/client/config/game-config.ts
import Phaser from "phaser";
import { PlayScene } from "../game/scenes/play-scene";
import { CreateScene } from "../game/scenes/create-scene";
import { GAME_CONFIG } from "../constants/game-constants";
import type { LevelConfig } from "../game/level/level-types";

/**
 * Returns a Phaser Game Configuration.
 * Supports both Matter.js (for physics-heavy levels)
 * and Arcade (for simpler platformer-style levels).
 */
export function getPhaserConfig(level?: LevelConfig): Phaser.Types.Core.GameConfig {
  const useMatter = !level; // If no explicit level config, default to Matter.js + JSON levels

  return {
    type: Phaser.AUTO,
    parent: "phaser-game-container",
    backgroundColor: useMatter
      ? GAME_CONFIG.BACKGROUND_COLOR
      : level?.bgColor ?? "#000000",

    scale: {
      mode: Phaser.Scale.RESIZE,
      width: "100%",
      height: "100%",
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },

    physics: useMatter
      ? {
          default: "matter",
          matter: {
            gravity: { x: 0, y: GAME_CONFIG.GRAVITY_Y },
            debug: GAME_CONFIG.DEBUG,
          } satisfies Phaser.Types.Physics.Matter.MatterWorldConfig,
        }
      : {
          default: "arcade",
          arcade: {
            gravity: { x: 0, y: level?.gravityY ?? 800 },
            debug: false,
          },
        },

    scene: [useMatter ? new PlayScene() : new PlayScene(level!)],
  };
}
export function createBlankCanvasConfig(
  bgColor: string = '#f6f7f8'
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: 'phaser-game-container',
    backgroundColor: bgColor,
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: '100%',
      height: '100%',
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    // No physics needed for blank canvas
    scene: [new CreateScene()],
  };
}
