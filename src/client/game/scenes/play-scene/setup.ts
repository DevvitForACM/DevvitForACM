import Phaser from 'phaser';
import type { LevelData } from '@/game/level/level-schema';
import { loadLevel } from '@/game/level/json-conversion';
import { GAMEPLAY } from '@/constants/game-constants';

export async function fetchLevelData(levelName: string): Promise<LevelData | null> {
  try {
    // First try to load from API by ID
    const apiUrl = `/api/levels/${levelName}`;
    let response = await fetch(apiUrl);
    if (response.ok) {
      const data = (await response.json()) as LevelData;
      if (!data || typeof data !== 'object') throw new Error('Invalid structure');
      return data;
    }

    // Fallback to static JSON file by name
    const url = `/levels/${levelName}.json`;
    response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as LevelData;
    if (!data || typeof data !== 'object') throw new Error('Invalid structure');
    return data;
  } catch (err) {
    console.warn(`[PlayScene] Failed to fetch level '${levelName}':`, err);
    return null;
  }
}

export function createAnimations(scene: Phaser.Scene): void {
  // Coin animation
  const coinFrames = [0, 1, 2, 3, 4]
    .filter((i) => scene.textures.exists(`coin-${i}`))
    .map((i) => ({ key: `coin-${i}` }));
  if (!scene.anims.exists('coin-spin') && coinFrames.length > 0) {
    scene.anims.create({
      key: 'coin-spin',
      frames: coinFrames,
      frameRate: 6,
      repeat: -1,
    });
  }
  
  // Player idle animation
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
  
  // Player run animation
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
  
  // Jump launch animation (frame 1)
  if (scene.textures.exists('player-jump-1')) {
    if (!scene.anims.exists('player-jump-launch')) {
      scene.anims.create({
        key: 'player-jump-launch',
        frames: [{ key: 'player-jump-1' }],
        frameRate: 1,
        repeat: 0,
      });
    }
  }
  
  // Airborne animation (frame 2)
  if (scene.textures.exists('player-jump-2')) {
    if (!scene.anims.exists('player-jump-air')) {
      scene.anims.create({
        key: 'player-jump-air',
        frames: [{ key: 'player-jump-2' }],
        frameRate: 1,
        repeat: -1,
      });
    }
  }
  
  // Landing animation (frames 3-4)
  if (scene.textures.exists('player-jump-3') && scene.textures.exists('player-jump-4')) {
    if (!scene.anims.exists('player-jump-land')) {
      scene.anims.create({
        key: 'player-jump-land',
        frames: [{ key: 'player-jump-3' }, { key: 'player-jump-4' }],
        frameRate: 15,
        repeat: 0,
      });
    }
  }

  // Enemy walk animation
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

export function setupPhysics(scene: Phaser.Scene): void {
  if ((scene.physics as any)?.world) {
    scene.physics.world.gravity.y = GAMEPLAY.GRAVITY;
    
    // Set physics world bounds: walls at left (x=0) and bottom (y=0)
    // This prevents players from falling through or going past these edges
    const worldWidth = 3000; // Match CreateScene max width
    const worldHeight = 2000; // Match CreateScene max height
    scene.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    scene.physics.world.setBoundsCollision(true, true, true, true);
  }
}

export function loadLevelData(
  scene: Phaser.Scene,
  editorLevelData: LevelData | null,
  jsonData: LevelData | null
): boolean {
  if (editorLevelData) {
    loadLevel(scene, editorLevelData);
    const b = editorLevelData.settings?.bounds;
    if (b) {
      scene.cameras.main.setBounds(0, 0, b.width, b.height);
    }
    return true;
  } else if (jsonData) {
    loadLevel(scene, jsonData);
    const b = jsonData.settings?.bounds;
    if (b) {
      scene.cameras.main.setBounds(0, 0, b.width, b.height);
    }
    return true;
  }
  return false;
}

