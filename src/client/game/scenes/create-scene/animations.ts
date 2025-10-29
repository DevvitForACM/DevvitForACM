import Phaser from 'phaser';

export function createAnimations(scene: Phaser.Scene): void {
  const coinFrames = [0, 1, 2, 3, 4]
    .filter((i) => scene.textures.exists(`coin-${i}`))
    .map((i) => ({ key: `coin-${i}` }));

  if (!scene.anims.exists('coin-spin') && coinFrames.length > 0) {
    scene.anims.create({
      key: 'coin-spin',
      frames: coinFrames,
      frameRate: 4,
      repeat: -1,
    });
  }

  const idleFrames = [0, 1, 2, 3, 4]
    .filter((i) => scene.textures.exists(`player-idle-${i}`))
    .map((i) => ({ key: `player-idle-${i}` }));

  if (!scene.anims.exists('player-idle') && idleFrames.length > 0) {
    scene.anims.create({
      key: 'player-idle',
      frames: idleFrames,
      frameRate: 8,
      repeat: -1,
    });
  }

  const runFrames = [0, 1, 2]
    .filter((i) => scene.textures.exists(`player-run-${i}`))
    .map((i) => ({ key: `player-run-${i}` }));

  if (!scene.anims.exists('player-run') && runFrames.length > 0) {
    scene.anims.create({
      key: 'player-run',
      frames: runFrames,
      frameRate: 10,
      repeat: -1,
    });
  }

  const jumpFrames = [0, 1, 2, 3, 4]
    .filter((i) => scene.textures.exists(`player-jump-${i}`))
    .map((i) => ({ key: `player-jump-${i}` }));

  if (!scene.anims.exists('player-jump') && jumpFrames.length > 0) {
    scene.anims.create({
      key: 'player-jump',
      frames: jumpFrames,
      frameRate: 10,
      repeat: -1,
    });
  }

  const enemyFrames = [0, 1, 2, 3, 4]
    .filter((i) => scene.textures.exists(`enemy-${i}`))
    .map((i) => ({ key: `enemy-${i}` }));
  if (!scene.anims.exists('enemy-walk') && enemyFrames.length > 0) {
    scene.anims.create({
      key: 'enemy-walk',
      frames: [0, 1, 2, 3, 4].map((i) => ({ key: `enemy-${i}` })),
      frameRate: 6,
      repeat: -1,
    });
  }
}
