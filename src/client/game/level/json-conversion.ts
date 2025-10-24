import Phaser from "phaser";
import {
  LevelData,
  LevelObject,
  LevelObjectType,
  PhysicsType,
  LevelSettings,
  LEVEL_SCHEMA_VERSION,
  LegacyLevelFormat,
} from "./level-schema";
import { ENTITY_CONFIG } from "../../constants/game-constants"; // ✅ added import

export function loadLevel(
  scene: Phaser.Scene,
  json: LevelData | LegacyLevelFormat
): Phaser.GameObjects.GameObject[] {
  const level: LevelData = "version" in json ? json : convertLegacyLevel(json);

  console.log('[loadLevel] Loading level:', level.name, 'with', level.objects.length, 'objects');
  validateLevel(level);
  applySettings(scene, level.settings);

  const createdObjects: Phaser.GameObjects.GameObject[] = [];

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
    id: "player_1",
    type: LevelObjectType.Player,
    position: { x: legacy.player.x, y: legacy.player.y },
    physics: { type: PhysicsType.Dynamic },
    visual: { tint: parseColor(legacy.player.color) ?? ENTITY_CONFIG.PLAYER_COLOR_DEFAULT },
  });

  legacy.platforms.forEach((p, i) => {
    objects.push({
      id: `platform_${i + 1}`,
      type: LevelObjectType.Platform,
      position: { x: p.x, y: p.y },
      scale: { x: p.width / ENTITY_CONFIG.PLATFORM_WIDTH, y: p.height / ENTITY_CONFIG.PLATFORM_HEIGHT },
      physics: { type: PhysicsType.Static, isCollidable: true },
      visual: { tint: parseColor(p.color) ?? ENTITY_CONFIG.PLATFORM_COLOR_DEFAULT },
    });
  });

  const settings: LevelSettings = {
    backgroundColor: legacy.world.backgroundColor ?? "#87CEEB",
    bounds: {
      width: legacy.world.width,
      height: legacy.world.height,
    },
    gravity: { x: 0, y: 1 },
  };

  return {
    version: LEVEL_SCHEMA_VERSION,
    name: "Legacy Level",
    settings,
    objects,
  };
}

function parseColor(hex?: string): number | undefined {
  if (!hex) return undefined;
  return parseInt(hex.replace("#", "0x"));
}

function applySettings(scene: Phaser.Scene, settings: LevelSettings): void {
  const world = (scene as any).matter?.world;

  if (settings.backgroundColor !== undefined && scene.cameras?.main) {
    scene.cameras.main.setBackgroundColor(settings.backgroundColor);
  }

  if (!world) return;

  if (settings.gravity) world.setGravity(settings.gravity.x ?? 0, settings.gravity.y ?? 1);
  if (settings.bounds) world.setBounds(0, 0, settings.bounds.width, settings.bounds.height);
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
    default:
      return null;
  }
}

function createPlayer(scene: Phaser.Scene, obj: LevelObject): Phaser.GameObjects.GameObject {
  const radius = ENTITY_CONFIG.PLAYER_RADIUS;

  // Use the loaded player sprite; no fallback circle
  const textureKey = 'player-idle-1';

  const player = scene.matter.add.sprite(obj.position.x, obj.position.y, textureKey, undefined, {
    restitution: ENTITY_CONFIG.PLAYER_RESTITUTION,
    friction: ENTITY_CONFIG.PLAYER_FRICTION,
  });

  player.setCircle(radius);
  player.setDisplaySize(48, 48); // Set visible size to match physics
  player.setName(obj.id);
  player.setBounce(ENTITY_CONFIG.PLAYER_BOUNCE);
  player.setFixedRotation();
  (player as any).setDepth?.(10);

  return player;
}

function createPlatform(scene: Phaser.Scene, obj: LevelObject): Phaser.GameObjects.GameObject {
  const width = (obj.scale?.x ?? 1) * ENTITY_CONFIG.PLATFORM_WIDTH;
  const height = (obj.scale?.y ?? 1) * ENTITY_CONFIG.PLATFORM_HEIGHT;
  const x = obj.position.x;
  const y = obj.position.y;

  // Create Matter physics body
  scene.matter.add.rectangle(x, y, width, height, { isStatic: true, label: obj.id });

  // Use grass texture if available, otherwise fallback to colored rectangle
  if (scene.textures.exists('grass')) {
    // Optional filler first to eliminate any transparent borders in the art
    if (scene.textures.exists('grass-filler')) {
      const filler = scene.add.image(x - width / 2, y - height / 2, 'grass-filler');
      filler.setOrigin(0, 0);
      filler.setDisplaySize(width, height);
      filler.setDepth(-2);
      filler.name = obj.id + '_filler';
    }

    // Top-left anchor to avoid subpixel seams between adjacent tiles
    const grassImg = scene.add.image(x - width / 2, y - height / 2, 'grass');
    grassImg.setOrigin(0, 0);
    grassImg.setDisplaySize(width, height);
    grassImg.setDepth(-1);
    grassImg.name = obj.id;
    return grassImg;
  } else {
    const color = obj.visual?.tint ?? ENTITY_CONFIG.PLATFORM_COLOR_DEFAULT;
    const graphics = scene.add.graphics();
    graphics.fillStyle(color);
    graphics.fillRect(x - width / 2, y - height / 2, width, height);
    graphics.name = obj.id;
    return graphics;
  }
}

function createSpring(scene: Phaser.Scene, obj: LevelObject): Phaser.GameObjects.GameObject {
  const x = obj.position.x;
  const y = obj.position.y;
  const img = scene.add.image(x, y, 'spring');
  img.setDisplaySize(32, 24);
  img.name = obj.id;
  img.setDepth(5);
  return img;
}

function createSpike(scene: Phaser.Scene, obj: LevelObject): Phaser.GameObjects.GameObject {
  const x = obj.position.x;
  const y = obj.position.y;
  const img = scene.add.image(x, y, 'spike');
  img.setDisplaySize(32, 32);
  img.name = obj.id;
  img.setDepth(5);
  return img;
}

function createCoin(scene: Phaser.Scene, obj: LevelObject): Phaser.GameObjects.GameObject {
  const x = obj.position.x;
  const y = obj.position.y;
  const sprite = scene.add.sprite(x, y, 'coin-1');
  sprite.setDisplaySize(24, 24);
  sprite.setDepth(6);
  sprite.setData('isCoin', true);
  try { sprite.play('coin-spin'); } catch {}
  sprite.name = obj.id;
  return sprite;
}

function validateLevel(level: LevelData): void {
  if (!level.objects || !Array.isArray(level.objects)) {
    throw new Error("Invalid level: objects array missing.");
  }
  if (!level.version) {
    throw new Error("Invalid level: missing version field.");
  }
}
