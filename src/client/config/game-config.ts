// src/client/config/game-config.ts
import Phaser from "phaser";
import { PlayScene } from "../game/scenes/play-scene";
import { GAME_CONFIG } from "../constants/game-constants";

/**
 * Returns a Phaser Game Configuration optimized for Matter.js physics
 * and responsive scaling.
 */
export const getPhaserConfig = (): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent: "phaser-game-container",
  backgroundColor: GAME_CONFIG.BACKGROUND_COLOR,

  scale: {
    mode: Phaser.Scale.RESIZE, // direct enum reference instead of dynamic string
    width: "100%",
    height: "100%",
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  physics: {
    default: "matter",
    matter: {
      gravity: { x: 0, y: GAME_CONFIG.GRAVITY_Y },
      debug: GAME_CONFIG.DEBUG,
    } satisfies Phaser.Types.Physics.Matter.MatterWorldConfig,
  },

  scene: [PlayScene],
});
