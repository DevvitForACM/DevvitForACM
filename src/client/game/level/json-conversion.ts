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

  validateLevel(level);
  applySettings(scene, level.settings);

  const createdObjects: Phaser.GameObjects.GameObject[] = [];

  level.objects.forEach((obj) => {
    const gameObject = createGameObject(scene, obj);
    if (gameObject) createdObjects.push(gameObject);
  });

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
    case LevelObjectType.UpvoteDown:
    case LevelObjectType.UpvoteLeft:
    case LevelObjectType.UpvoteUp:
    case LevelObjectType.UpvoteRight:
      return createUpvote(scene, obj);
    case LevelObjectType.DownvoteDown:
    case LevelObjectType.DownvoteLeft:
    case LevelObjectType.DownvoteUp:
    case LevelObjectType.DownvoteRight:
      return createDownvote(scene, obj);
    default:
      return null;
  }
}

function createPlayer(scene: Phaser.Scene, obj: LevelObject): Phaser.GameObjects.GameObject {
  const radius = ENTITY_CONFIG.PLAYER_RADIUS;

  // Use the loaded player sprite; no fallback circle
  const textureKey = 'player-idle-1';

  const player = scene.matter.add.image(obj.position.x, obj.position.y, textureKey, undefined, {
    restitution: ENTITY_CONFIG.PLAYER_RESTITUTION,
    friction: ENTITY_CONFIG.PLAYER_FRICTION,
  });

  player.setCircle(radius);
  player.setName(obj.id);
  player.setBounce(ENTITY_CONFIG.PLAYER_BOUNCE);
  player.setFixedRotation();

  return player;
}

function createPlatform(scene: Phaser.Scene, obj: LevelObject): Phaser.GameObjects.GameObject {
  const color = obj.visual?.tint ?? ENTITY_CONFIG.PLATFORM_COLOR_DEFAULT;
  const width = (obj.scale?.x ?? 1) * ENTITY_CONFIG.PLATFORM_WIDTH;
  const height = (obj.scale?.y ?? 1) * ENTITY_CONFIG.PLATFORM_HEIGHT;
  const x = obj.position.x;
  const y = obj.position.y;

  scene.matter.add.rectangle(x, y, width, height, { isStatic: true, label: obj.id });

  const graphics = scene.add.graphics();
  graphics.fillStyle(color);
  graphics.fillRect(x - width / 2, y - height / 2, width, height);
  graphics.name = obj.id;

  return graphics;
}

function createUpvote(scene: Phaser.Scene, obj: LevelObject): Phaser.GameObjects.GameObject {
  const x = obj.position.x;
  const y = obj.position.y;
  // Map enum value to asset suffix 1..4
  const suffix = String(obj.type).split('-')[1];
  const key = `upvote${suffix}`;
  const img = scene.add.image(x, y, key);
  img.name = obj.id;
  return img;
}

function createDownvote(scene: Phaser.Scene, obj: LevelObject): Phaser.GameObjects.GameObject {
  const x = obj.position.x;
  const y = obj.position.y;
  const suffix = String(obj.type).split('-')[1];
  const key = `downvote${suffix}`;
  const img = scene.add.image(x, y, key);
  img.name = obj.id;
  return img;
}

function validateLevel(level: LevelData): void {
  if (!level.objects || !Array.isArray(level.objects)) {
    throw new Error("Invalid level: objects array missing.");
  }
  if (!level.version) {
    throw new Error("Invalid level: missing version field.");
  }
}
