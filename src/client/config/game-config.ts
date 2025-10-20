// src/client/config/game-config.ts
import Phaser from "phaser";
import { PlayScene } from "../game/scenes/play-scene";
import { GAME_CONFIG } from "../constants/game-constants";
import type { LevelConfig } from "../game/level/level-types";

/**
 * Generates a Phaser Game Configuration.
 * Automatically switches between Matter.js and Arcade physics
 * depending on whether a level config is passed.
 */
export function getPhaserConfig(level?: LevelConfig): Phaser.Types.Core.GameConfig {
  // Use Matter.js when no explicit level config is provided or useMatter flag is true
  const useMatter = !level || (level as { useMatter?: boolean }).useMatter === true;

  return {
    type: Phaser.AUTO,
    parent: "phaser-game-container",
    backgroundColor: level?.bgColor ?? GAME_CONFIG.BACKGROUND_COLOR,

    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: window.innerWidth,
      height: window.innerHeight,
    },

    physics: useMatter
      ? {
          default: "matter",
          matter: {
            gravity: { x: 0, y: level?.gravityY ?? GAME_CONFIG.GRAVITY_Y },
            debug: GAME_CONFIG.DEBUG,
          },
        }
      : {
          default: "arcade",
          arcade: {
            gravity: { x: 0, y: level?.gravityY ?? 800 },
            debug: GAME_CONFIG.DEBUG,
          },
        },

    // Pass scene class reference — Phaser will handle instantiation
    scene: [PlayScene],
  };
}
