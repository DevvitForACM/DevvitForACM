import Phaser from 'phaser';
import { PlayScene } from '../game/scenes/play-scene';
import type { LevelConfig } from '../game/level/level-types';

export function createGameConfig(level: LevelConfig): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: 'phaser-game-container',
    backgroundColor: level.bgColor,
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
