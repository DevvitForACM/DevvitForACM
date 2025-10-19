// src/client/config/game-config.ts
import Phaser from 'phaser';
import { PlayScene } from '../game/scenes/play-scene';
import { GAME_CONFIG } from '../constants/game-constants';
import type { LevelConfig } from '../game/level/level-types';

/**
 * Returns a Phaser Game Configuration optimized for Matter.js physics
 * and responsive scaling.
 * Combines constants from GAME_CONFIG with level-specific data.
 */
export const createGameConfig = (level: LevelConfig): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent: 'phaser-game-container',
  backgroundColor: level.bgColor || GAME_CONFIG.BACKGROUND_COLOR,

  scale: {
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%',
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: level.gravityY ?? GAME_CONFIG.GRAVITY_Y },
      debug: GAME_CONFIG.DEBUG,
    } satisfies Phaser.Types.Physics.Matter.MatterWorldConfig,
  },

  scene: [new PlayScene(level)],
});
