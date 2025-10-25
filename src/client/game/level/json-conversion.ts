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
    case LevelObjectType.Lava:
      return createLava(scene, obj);
    case LevelObjectType.Goal:
      return createDoor(scene, obj);
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
    frictionAir: 0.01, // Add air resistance to prevent tunneling
    density: 0.001, // Lighter body for better collision response
  });

  player.setCircle(radius);
  player.setDisplaySize(48, 48); // Set visible size to match physics
  player.setName(obj.id);
  player.setBounce(ENTITY_CONFIG.PLAYER_BOUNCE);
  player.setFixedRotation();
  (player as any).setDepth?.(10);
  
  // Enable better collision detection
  if (player.body && (player.body as any).body) {
    (player.body as any).body.isSleeping = false;
    (player.body as any).body.sleepThreshold = Infinity; // Never sleep
  }

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
  const w = 32, h = 32; // Make it a full tile height
  
  // Add a thin solid platform on top so player doesn't fall through
  scene.matter.add.rectangle(x, y - h / 2 + 2, w, 4, { isStatic: true, label: 'spring_platform' });
  
  // Large sensor body for collision detection (covers whole tile)
  scene.matter.add.rectangle(x, y, w, h, { isStatic: true, isSensor: true, label: 'spring' });
  
  // Add filler background
  if (scene.textures.exists('grass-filler')) {
    const filler = scene.add.image(x - w / 2, y - h / 2, 'grass-filler');
    filler.setOrigin(0, 0);
    filler.setDisplaySize(w, h);
    filler.setDepth(4);
    filler.name = obj.id + '_filler';
  }
  
  const img = scene.add.image(x, y, 'spring');
  img.setDisplaySize(w, 32); // Visual size
  img.name = obj.id;
  img.setDepth(5);
  return img;
}

function createSpike(scene: Phaser.Scene, obj: LevelObject): Phaser.GameObjects.GameObject {
  const x = obj.position.x;
  const y = obj.position.y;
  const w = 32, h = 32;
  
  // sensor body for hazard detection
  scene.matter.add.rectangle(x, y, 28, 28, { isStatic: true, isSensor: true, label: 'spike' });
  
  // Add filler background
  if (scene.textures.exists('grass-filler')) {
    const filler = scene.add.image(x - w / 2, y - h / 2, 'grass-filler');
    filler.setOrigin(0, 0);
    filler.setDisplaySize(w, h);
    filler.setDepth(4);
    filler.name = obj.id + '_filler';
  }
  
  const img = scene.add.image(x, y, 'spike');
  img.setDisplaySize(w, h);
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

function createLava(scene: Phaser.Scene, obj: LevelObject): Phaser.GameObjects.GameObject {
  const width = (obj.scale?.x ?? 1) * 32;
  const height = (obj.scale?.y ?? 1) * 32;
  const x = obj.position.x;
  const y = obj.position.y;
  
  // Large sensor area that kills the player
  scene.matter.add.rectangle(x, y, width, height, { isStatic: true, isSensor: true, label: 'lava' });
  
  // Add filler background
  if (scene.textures.exists('Lava-filler')) {
    const filler = scene.add.image(x - width / 2, y - height / 2, 'Lava-filler');
    filler.setOrigin(0, 0);
    filler.setDisplaySize(width, height);
    filler.setDepth(0);
    filler.name = obj.id + '_filler';
  }
  
  let go: Phaser.GameObjects.GameObject;
  if (scene.textures.exists('lava')) {
    const img = scene.add.image(x - width / 2, y - height / 2, 'lava');
    img.setOrigin(0, 0);
    img.setDisplaySize(width, height);
    img.setDepth(1); // above platforms (-1)
    img.name = obj.id;
    go = img;
  } else {
    const g = scene.add.graphics();
    g.fillStyle(0xf97316);
    g.fillRect(x - width / 2, y - height / 2, width, height);
    g.name = obj.id;
    go = g;
  }
  return go;
}

function createDoor(scene: Phaser.Scene, obj: LevelObject): Phaser.GameObjects.GameObject {
  const w = 48, h = 64;
  const x = obj.position.x;
  const y = obj.position.y - h / 2; // visually rest on tile
  // door sensor slightly inset
  scene.matter.add.rectangle(x, y + h / 2, w * 0.8, h, { isStatic: true, isSensor: true, label: 'door' });
  if (scene.textures.exists('door')) {
    const img = scene.add.image(x, y, 'door');
    img.setDisplaySize(w, h);
    img.name = obj.id;
    img.setDepth(4);
    return img;
  }
  const g = scene.add.rectangle(x, y + h / 2, w, h, 0x8b5cf6);
  g.setStrokeStyle(2, 0x4c1d95);
  (g as any).name = obj.id;
  (g as any).setDepth?.(4);
  return g as any;
}

function validateLevel(level: LevelData): void {
  if (!level.objects || !Array.isArray(level.objects)) {
    throw new Error("Invalid level: objects array missing.");
  }
  if (!level.version) {
    throw new Error("Invalid level: missing version field.");
  }
}
