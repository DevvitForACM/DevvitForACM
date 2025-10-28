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
import { ENTITY_CONFIG, PLAYER, ENTITY_SIZES } from '@/constants/game-constants';
import { Player } from '../entities/player';
import { Coin } from '../entities/coin';

export function loadLevel(
  scene: Phaser.Scene,
  json: LevelData | LegacyLevelFormat
): Phaser.GameObjects.GameObject[] {
  const level: LevelData = 'version' in json ? json : convertLegacyLevel(json);

  console.log(
    '[loadLevel] Loading level:',
    level.name,
    'with',
    level.objects.length,
    'objects'
  );
  validateLevel(level);
  applySettings(scene, level.settings);

  const createdObjects: Phaser.GameObjects.GameObject[] = [];
  
  // Create a static physics group for platforms to ensure proper collision
  if (!(scene as any).platformGroup && (scene as any).physics?.world) {
    (scene as any).platformGroup = scene.physics.add.staticGroup();
  }

  level.objects.forEach((obj) => {
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
    // Use sensible Arcade Physics gravity in pixels/sec^2
    gravity: { x: 0, y: 800 },
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
      const gy = settings.gravity.y;
      // Normalize legacy/normalized gravity values (e.g., 0..2) to Arcade pixels/sec^2
      scene.physics.world.gravity.y = gy !== undefined && gy > 10 ? gy : 800;
    }
    if (settings.bounds) {
      scene.physics.world.setBounds(0, 0, settings.bounds.width, settings.bounds.height);
    }
  }
}

function createGameObject(
  scene: Phaser.Scene,
  obj: LevelObject
): Phaser.GameObjects.GameObject | null {
  // Texture-directed overrides
  const tex = obj.visual?.texture?.toLowerCase();
  if (tex === 'lava' || tex === 'lava-filler') {
    return createLava(scene, obj);
  }
  if (tex === 'door') {
    return createDoor(scene, obj);
  }

  switch (obj.type) {
    case LevelObjectType.Player:
      return createPlayer(scene, obj);
    case LevelObjectType.Platform:
      return createPlatform(scene, obj);
    case LevelObjectType.Spring:
      return createSpring(scene, obj);
    case LevelObjectType.Spike:
      return createSpike(scene, obj);
    case LevelObjectType.Collectible:
      return createCoin(scene, obj);
    case LevelObjectType.Obstacle:
      return tex ? createLava(scene, obj) : null;
    case LevelObjectType.Decoration:
    case LevelObjectType.Goal:
      return tex === 'door' ? createDoor(scene, obj) : null;
    default:
      return null;
  }
}

function createPlayer(
  scene: Phaser.Scene,
  obj: LevelObject
): Phaser.GameObjects.GameObject {
  const textureKey = obj.visual?.texture || 'player-idle-1';

  if ((scene as any).physics?.world) {
    const playerSprite = scene.physics.add.sprite(obj.position.x, obj.position.y, textureKey);
    playerSprite.setName(obj.id);
    playerSprite.setDepth(10);
    // Disable bounce and set sane movement params
    playerSprite.setBounce(0);
    playerSprite.setCollideWorldBounds(true);

    // Scale uniformly to target height to avoid squeezing
    const nativeW = playerSprite.width || playerSprite.displayWidth || 32;
    const nativeH = playerSprite.height || playerSprite.displayHeight || 32;
    const targetH = PLAYER.SIZE.HEIGHT;
    const uniformScale = targetH / nativeH;
    playerSprite.setScale(uniformScale);

    // Set physics body size to match visual size and tune physics
    const body = playerSprite.body as Phaser.Physics.Arcade.Body;
    const dispW = nativeW * uniformScale;
    const dispH = nativeH * uniformScale;
    body.setSize(dispW, dispH, true);
    body.setBounce(0, 0);
    body.setDragX(900);
    body.setMaxVelocity(400, 1200);
    body.allowRotation = false;
    
    const player = new Player(scene, obj.id, obj.position.x, obj.position.y, textureKey);
    player.sprite.destroy();
    player.sprite = playerSprite;
    
    // Play idle animation if it exists
    if (scene.anims.exists('player-idle')) {
      playerSprite.play('player-idle');
    }
    
    return playerSprite;
  } else {
    const playerSprite = scene.add.sprite(obj.position.x, obj.position.y, textureKey);
    playerSprite.setName(obj.id);
    playerSprite.setDepth(10);

    // Scale uniformly to target height to avoid squeezing
    const nativeW = playerSprite.width || playerSprite.displayWidth || 32;
    const nativeH = playerSprite.height || playerSprite.displayHeight || 32;
    const targetH = PLAYER.SIZE.HEIGHT;
    const uniformScale = targetH / nativeH;
    playerSprite.setScale(uniformScale);
    
    const player = new Player(scene, obj.id, obj.position.x, obj.position.y, textureKey);
    player.sprite.destroy();
    player.sprite = playerSprite;
    
    if (scene.anims.exists('player-idle')) {
      playerSprite.play('player-idle');
    }
    
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
  const yBase = obj.position.y; // incoming Y represents BASE (ground line)
  const y = yBase - height / 2; // center so tile sits on the base, fully visible

  // Choose texture: grass or dirt-only ground
  const requested = obj.visual?.texture?.toLowerCase();
  let texKey = 'grass';
  if (requested === 'ground' || requested === 'dirt') {
    if (scene.textures.exists('ground')) texKey = 'ground';
    else if (scene.textures.exists('grass-filler')) texKey = 'grass-filler';
  } else if (requested === 'grass') {
    texKey = 'grass';
  }

  console.log(`[createPlatform] Creating ${obj.id} (${texKey}) at x=${x}, y=${y}, w=${width}, h=${height}`);

  if ((scene as any).physics?.world) {
    let node: Phaser.GameObjects.GameObject;
    if (scene.textures.exists(texKey)) {
      const sprite = scene.add.sprite(x, y, texKey);
      sprite.setDisplaySize(width, height);
      sprite.name = obj.id;
      sprite.setDepth(-1);
      scene.physics.add.existing(sprite, true);
      const body = sprite.body as Phaser.Physics.Arcade.StaticBody;
      body.setSize(width, height);
      body.updateFromGameObject();
      (sprite as any).setData && (sprite as any).setData('isPlatform', true);
      node = sprite;
    } else {
      const rect = scene.add.rectangle(x, y, width, height, 0x4a8f38);
      rect.name = obj.id;
      rect.setDepth(-1);
      scene.physics.add.existing(rect, true);
      const body = rect.body as Phaser.Physics.Arcade.StaticBody;
      body.setSize(width, height);
      body.updateFromGameObject();
      (rect as any).setData && (rect as any).setData('isPlatform', true);
      node = rect;
    }
    return node;
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
  const key = 'spring';
  const springW = (ENTITY_SIZES as any)?.SPRING?.WIDTH ?? 32;
  const springH = (ENTITY_SIZES as any)?.SPRING?.HEIGHT ?? 24;

  let node: Phaser.GameObjects.GameObject;
  if ((scene as any).physics?.world) {
    const simg = scene.physics.add.staticImage(x, y - springH / 2, key);
    simg.setDisplaySize(springW, springH);
    simg.name = obj.id;
    simg.setDepth(0);
    const body = simg.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(springW, springH);
    body.updateFromGameObject();
    node = simg as unknown as Phaser.GameObjects.GameObject;
  } else {
    const img = scene.add.image(x, y - springH / 2, key);
    img.setDisplaySize(springW, springH);
    img.name = obj.id;
    img.setDepth(0);
    node = img;
  }

  (node as any).setData && (node as any).setData('isSpring', true);
  return node;
}

function createSpike(
  scene: Phaser.Scene,
  obj: LevelObject
): Phaser.GameObjects.GameObject {
  const x = obj.position.x;
  const y = obj.position.y;
  const key = 'spike';
  const spikeW = (ENTITY_SIZES as any)?.BASE?.WIDTH ?? 32;
  const spikeH = (ENTITY_SIZES as any)?.BASE?.HEIGHT ?? 32;

  let node: Phaser.GameObjects.GameObject;
  if ((scene as any).physics?.world) {
    const simg = scene.physics.add.staticImage(x, y - spikeH / 2, key);
    simg.setDisplaySize(spikeW, spikeH);
    simg.name = obj.id;
    simg.setDepth(0);
    const body = simg.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(spikeW, spikeH);
    body.updateFromGameObject();
    node = simg as unknown as Phaser.GameObjects.GameObject;
  } else {
    const img = scene.add.image(x, y - spikeH / 2, key);
    img.setDisplaySize(spikeW, spikeH);
    img.name = obj.id;
    img.setDepth(0);
    node = img;
  }

  (node as any).setData && (node as any).setData('isSpike', true);
  return node;
}

function createCoin(
  scene: Phaser.Scene,
  obj: LevelObject
): Phaser.GameObjects.GameObject {
  const textureKey = obj.visual?.texture || 'coin-0';
  const coinW = ENTITY_SIZES.COIN.WIDTH;
  const coinH = ENTITY_SIZES.COIN.HEIGHT;
  
  let coinSprite: Phaser.GameObjects.Sprite;
  
  if ((scene as any).physics?.world) {
    // Create sprite with physics
    coinSprite = scene.physics.add.sprite(obj.position.x, obj.position.y, textureKey);
    coinSprite.setDisplaySize(coinW, coinH);
    coinSprite.setDepth(5);
    coinSprite.setName(obj.id);
    
    // Set physics body
    const body = coinSprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(coinW, coinH);
    body.setAllowGravity(false); // Coins float in place
    body.setImmovable(true);
  } else {
    // No physics, just visual
    coinSprite = scene.add.sprite(obj.position.x, obj.position.y, textureKey);
    coinSprite.setDisplaySize(coinW, coinH);
    coinSprite.setDepth(5);
    coinSprite.setName(obj.id);
  }
  
  // Tag as coin for collision detection
  (coinSprite as any).setData && (coinSprite as any).setData('isCoin', true);
  
  // Auto-play spin if available
  if (scene.anims.exists('coin-spin')) {
    try { coinSprite.play('coin-spin'); } catch {}
  }
  
  return coinSprite;
}

function createLava(
  scene: Phaser.Scene,
  obj: LevelObject
): Phaser.GameObjects.GameObject {
  const w = (obj.scale?.x ?? 1) * ENTITY_CONFIG.PLATFORM_WIDTH;
  const h = (obj.scale?.y ?? 1) * ENTITY_CONFIG.PLATFORM_HEIGHT;
  const x = obj.position.x;
  const y = obj.position.y - h / 2; // incoming y is base
  const key = scene.textures.exists('lava') ? 'lava' : 'Lava-filler';
  let node: Phaser.GameObjects.GameObject;
  if ((scene as any).physics?.world) {
    const img = scene.physics.add.staticImage(x, y, key);
    img.setDisplaySize(w, h);
    img.name = obj.id;
    img.setDepth(-1);
    const body = img.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(w, h);
    body.updateFromGameObject();
    node = img as unknown as Phaser.GameObjects.GameObject;
  } else {
    const img = scene.add.image(x, y, key);
    img.setDisplaySize(w, h);
    img.name = obj.id;
    img.setDepth(-1);
    node = img;
  }
  (node as any).setData && (node as any).setData('isLava', true);
  return node;
}

function createDoor(
  scene: Phaser.Scene,
  obj: LevelObject
): Phaser.GameObjects.GameObject {
  const w = (obj.scale?.x ?? 1) * ENTITY_SIZES.DOOR.WIDTH;
  const h = (obj.scale?.y ?? 1) * ENTITY_SIZES.DOOR.HEIGHT;
  const x = obj.position.x;
  const y = obj.position.y - h / 2; // incoming y is base
  const key = 'door';
  let node: Phaser.GameObjects.GameObject;
  if ((scene as any).physics?.world) {
    const img = scene.physics.add.staticImage(x, y, key);
    img.setDisplaySize(w, h);
    img.name = obj.id;
    img.setDepth(0);
    const body = img.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(w, h);
    body.updateFromGameObject();
    node = img as unknown as Phaser.GameObjects.GameObject;
  } else {
    const img = scene.add.image(x, y, key);
    img.setDisplaySize(w, h);
    img.name = obj.id;
    img.setDepth(0);
    node = img;
  }
  // treat door as solid platform for now
  (node as any).setData && (node as any).setData('isPlatform', true);
  (node as any).setData && (node as any).setData('isDoor', true);
  return node;
}

function validateLevel(level: LevelData): void {
  if (!level.objects || !Array.isArray(level.objects)) {
    throw new Error('Invalid level: objects array missing.');
  }
  if (!level.version) {
    throw new Error('Invalid level: missing version field.');
  }
}
