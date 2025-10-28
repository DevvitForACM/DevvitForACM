import Phaser from 'phaser';
import {
  LevelData,
  LevelObject,
  LevelObjectType,
  PhysicsType,
  LevelSettings,
  LEVEL_SCHEMA_VERSION,
  LegacyLevelFormat,
} from './level-schema';
import { ENTITY_CONFIG } from '@/constants/game-constants';
import { Player } from '../entities/player';
import { Coin } from '../entities/coin';

export function loadLevel(
  scene: Phaser.Scene,
  json: LevelData | LegacyLevelFormat
): Phaser.GameObjects.GameObject[] {
  const level: LevelData = 'version' in json ? json : convertLegacyLevel(json);

  const objectsArray = Array.isArray(level.objects)
    ? level.objects
    : Object.values(level.objects).flat();

  console.log(
    '[loadLevel] Loading level:',
    level.name,
    'with',
    objectsArray.length,
    'objects'
  );
  validateLevel(level);
  applySettings(scene, level.settings);

  const createdObjects: Phaser.GameObjects.GameObject[] = [];

  objectsArray.forEach((obj: LevelObject) => {
    console.log('[loadLevel] Creating object:', obj.type, 'at', obj.position);
    const gameObject = createGameObject(scene, obj);
    if (gameObject) {
      createdObjects.push(gameObject);
      console.log('[loadLevel] Created:', obj.id, obj.type);
    } else {
      console.warn('[loadLevel] Failed to create:', obj.type);
    }
  });

  console.log('[loadLevel] Total objects created:', createdObjects.length);
  return createdObjects;
}

function convertLegacyLevel(legacy: LegacyLevelFormat): LevelData {
  const objects: LevelObject[] = [];

  // Player
  objects.push({
    id: 'player_1',
    type: LevelObjectType.Player,
    position: { x: legacy.player.x, y: legacy.player.y },
    physics: { type: PhysicsType.Dynamic },
    visual: {
      tint:
        parseColor(legacy.player.color) ?? ENTITY_CONFIG.PLAYER_COLOR_DEFAULT,
    },
  });

  // Platforms
  legacy.platforms.forEach((p, i) => {
    objects.push({
      id: `platform_${i + 1}`,
      type: LevelObjectType.Platform,
      position: { x: p.x, y: p.y },
      scale: {
        x: p.width / ENTITY_CONFIG.PLATFORM_WIDTH,
        y: p.height / ENTITY_CONFIG.PLATFORM_HEIGHT,
      },
      physics: { type: PhysicsType.Static, isCollidable: true },
      visual: {
        tint: parseColor(p.color) ?? ENTITY_CONFIG.PLATFORM_COLOR_DEFAULT,
      },
    });
  });

  const settings: LevelSettings = {
    backgroundColor: legacy.world.backgroundColor ?? '#87CEEB',
    bounds: {
      width: legacy.world.width,
      height: legacy.world.height,
    },
    gravity: { x: 0, y: 1 },
  };

  return {
    version: LEVEL_SCHEMA_VERSION,
    name: 'Legacy Level',
    settings,
    objects,
  };
}

function parseColor(hex?: string): number | undefined {
  if (!hex) return undefined;
  return parseInt(hex.replace('#', '0x'));
}

function applySettings(scene: Phaser.Scene, settings: LevelSettings): void {
  if (settings.backgroundColor !== undefined && scene.cameras?.main) {
    scene.cameras.main.setBackgroundColor(settings.backgroundColor);
  }

  if ((scene as any).physics?.world) {
    if (settings.gravity) {
      scene.physics.world.gravity.y = settings.gravity.y ?? 800;
    }
    if (settings.bounds) {
      scene.physics.world.setBounds(
        0,
        0,
        settings.bounds.width,
        settings.bounds.height
      );
    }
  }
}

function createGameObject(
  scene: Phaser.Scene,
  obj: LevelObject
): Phaser.GameObjects.GameObject | null {
  switch (obj.type) {
    case LevelObjectType.Player:
      return createPlayer(scene, obj);
    case LevelObjectType.Platform:
      return createPlatform(scene, obj);
    case LevelObjectType.Spring:
      return createSpring(scene, obj);
    case LevelObjectType.Spike:
      return createSpike(scene, obj);
    case LevelObjectType.Coin:
      return createCoin(scene, obj);
    case LevelObjectType.Door:
      return createDoor(scene, obj); // ✅ New door case
    default:
      return null;
  }
}

function createPlayer(
  scene: Phaser.Scene,
  obj: LevelObject
): Phaser.GameObjects.GameObject {
  const textureKey = obj.visual?.texture || 'player-idle-0';

  if ((scene as any).physics?.world) {
    const playerSprite = scene.physics.add.sprite(
      obj.position.x,
      obj.position.y,
      textureKey
    );
    playerSprite.setDisplaySize(60, 100);
    playerSprite.setName(obj.id);
    playerSprite.setBounce(ENTITY_CONFIG.PLAYER_BOUNCE);
    playerSprite.setCollideWorldBounds(true);

    const player = new Player(
      scene,
      obj.id,
      obj.position.x,
      obj.position.y,
      textureKey
    );
    player.sprite.destroy();
    player.sprite = playerSprite;

    return playerSprite;
  } else {
    const playerSprite = scene.add.sprite(
      obj.position.x,
      obj.position.y,
      textureKey
    );
    playerSprite.setDisplaySize(60, 100);
    playerSprite.setName(obj.id);

    const player = new Player(
      scene,
      obj.id,
      obj.position.x,
      obj.position.y,
      textureKey
    );
    player.sprite.destroy();
    player.sprite = playerSprite;

    return playerSprite;
  }
}

function createPlatform(
  scene: Phaser.Scene,
  obj: LevelObject
): Phaser.GameObjects.GameObject {
  const width = (obj.scale?.x ?? 1) * ENTITY_CONFIG.PLATFORM_WIDTH;
  const height = (obj.scale?.y ?? 1) * ENTITY_CONFIG.PLATFORM_HEIGHT;
  const x = obj.position.x;
  const y = obj.position.y;

  if ((scene as any).physics?.world) {
    const platform = scene.add.rectangle(x, y, width, height, 0x888888);
    scene.physics.add.existing(platform, true);
    platform.name = obj.id;
    return platform;
  } else {
    const platform = scene.add.rectangle(x, y, width, height, 0x888888);
    platform.name = obj.id;
    return platform;
  }
}

function createSpring(
  scene: Phaser.Scene,
  obj: LevelObject
): Phaser.GameObjects.GameObject {
  const x = obj.position.x;
  const y = obj.position.y;
  const img = scene.add.image(x, y, 'spring');
  img.setDisplaySize(32, 24);
  img.name = obj.id;
  return img;
}

function createSpike(
  scene: Phaser.Scene,
  obj: LevelObject
): Phaser.GameObjects.GameObject {
  const x = obj.position.x;
  const y = obj.position.y;
  const img = scene.add.image(x, y, 'spike');
  img.setDisplaySize(32, 32);
  img.name = obj.id;
  return img;
}

function createCoin(
  scene: Phaser.Scene,
  obj: LevelObject
): Phaser.GameObjects.GameObject {
  const textureKey = obj.visual?.texture || 'coin-0';
  const coinSprite = scene.add.sprite(
    obj.position.x,
    obj.position.y,
    textureKey
  );
  coinSprite.setDisplaySize(60, 60);
  coinSprite.setName(obj.id);

  const coin = new Coin(
    scene,
    obj.id,
    obj.position.x,
    obj.position.y,
    textureKey
  );
  coin.sprite = coinSprite;

  return coinSprite;
}

function createDoor(
  scene: Phaser.Scene,
  obj: LevelObject
): Phaser.GameObjects.GameObject {
  const x = obj.position.x;
  const y = obj.position.y;
  const textureKey = obj.visual?.texture || 'door';

  const doorSprite = scene.add.sprite(x, y, textureKey);
  doorSprite.setDisplaySize(80, 120);
  doorSprite.setName(obj.id);

  // optional physics body
  if ((scene as any).physics?.world) {
    scene.physics.add.existing(doorSprite, true);
  }

  console.log('[loadLevel] Created door at', x, y);
  return doorSprite;
}

function validateLevel(level: LevelData): void {
  if (!level.objects || !Array.isArray(level.objects)) {
    throw new Error('Invalid level: objects array missing.');
  }
  if (!level.version) {
    throw new Error('Invalid level: missing version field.');
  }
}
