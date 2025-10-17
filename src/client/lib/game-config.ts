// game-config.ts
import Phaser from "phaser";
import { PlayScene } from "./play-scene";

/**
 * Returns a Phaser Game Configuration optimized for Matter.js physics
 * and responsive scaling.
 */
export const getPhaserConfig = (): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent: "phaser-game-container",
  backgroundColor: "#000000",

  scale: {
    mode: Phaser.Scale.RESIZE,
    width: "100%",
    height: "100%",
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  physics: {
    default: "matter",
    matter: {
      gravity: { x: 0, y: 1 }, // standard downward gravity
      debug: true,
    } satisfies Phaser.Types.Physics.Matter.MatterWorldConfig, // ✅ correct existing type
  },

  scene: [PlayScene],
});
