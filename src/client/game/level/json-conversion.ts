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
import { ENTITY_CONFIG } from "../../constants/game-constants";

/**
 * Loads and builds all entities from a JSON level definition.
 * Works with both new schema-based levels and old "backup" JSONs.
 */
export function loadLevel(
  scene: Phaser.Scene,
  json: LevelData | LegacyLevelFormat
): Phaser.GameObjects.GameObject[] {
  console.log("[LEVEL] 🧩 Starting level load...");

  // Backward compatibility
  const level: LevelData = "version" in json ? json : convertLegacyLevel(json);

  validateLevel(level);
  applySettings(scene, level.settings);

  console.log(`[LEVEL] ✅ Level schema version: ${level.version}`);
  console.log(`[LEVEL] 🌈 Background: ${level.settings.backgroundColor}`);
  console.log(`[LEVEL] 🌍 Gravity: ${JSON.stringify(level.settings.gravity)}`);

  const createdObjects: Phaser.GameObjects.GameObject[] = [];

  level.objects.forEach((obj) => {
    const gameObject = createGameObject(scene, obj);
    if (gameObject) {
      createdObjects.push(gameObject);
      console.log(`[LEVEL] ✅ Created object: ${obj.id} (${obj.type})`);
    } else {
      console.warn(`[LEVEL] ⚠️ Skipped object: ${obj.id} (${obj.type})`);
    }
  });

  console.log(`[LEVEL] 🎉 Finished loading ${createdObjects.length} objects.`);
  return createdObjects;
}

/**
 * Converts a legacy JSON level into modern schema format.
 */
function convertLegacyLevel(legacy: LegacyLevelFormat): LevelData {
  console.warn("[LEVEL] ⚠️ Converting legacy level format...");

  const objects: LevelObject[] = [];

  // Player
  objects.push({
    id: "player_1",
    type: LevelObjectType.Player,
    position: { x: legacy.player.x, y: legacy.player.y },
    physics: { type: PhysicsType.Dynamic },
    visual: { tint: parseColor(legacy.player.color) ?? ENTITY_CONFIG.PLAYER_COLOR_DEFAULT },
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
      visual: { tint: parseColor(p.color) ?? ENTITY_CONFIG.PLATFORM_COLOR_DEFAULT },
    });
  });

  // Settings
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

/**
 * Parse hex color string into numeric tint.
 */
function parseColor(hex?: string): number | undefined {
  if (!hex) return undefined;
  const sanitized = hex.replace(/[^0-9A-Fa-f]/g, "");
  return parseInt("0x" + sanitized);
}

/**
 * Apply world bounds, gravity, and background.
 */
function applySettings(scene: Phaser.Scene, settings: LevelSettings): void {
  const isMatterWorld = !!(scene as any).matter?.world;
  const world = isMatterWorld ? (scene as any).matter.world : null;

  if (settings.backgroundColor && scene.cameras?.main) {
    scene.cameras.main.setBackgroundColor(settings.backgroundColor);
  }

  if (!world) {
    console.warn("[LEVEL] ⚠️ Matter world not found — using fallback physics.");
    return;
  }

  if (settings.gravity)
    world.setGravity(settings.gravity.x ?? 0, settings.gravity.y ?? 1);
  if (settings.bounds)
    world.setBounds(0, 0, settings.bounds.width, settings.bounds.height);

  console.log("[LEVEL] 🌍 Applied physics & bounds");
}

/**
 * Factory for all game objects.
 */
function createGameObject(
  scene: Phaser.Scene,
  obj: LevelObject
): Phaser.GameObjects.GameObject | null {
  switch (obj.type) {
    case LevelObjectType.Player:
      return createPlayer(scene, obj);
    case LevelObjectType.Platform:
      return createPlatform(scene, obj);
    default:
      console.warn(`[LEVEL] Unknown object type: ${obj.type}`);
      return null;
  }
}

/**
 * Player: Matter.js circle with bounce and tint.
 */
function createPlayer(scene: Phaser.Scene, obj: LevelObject): Phaser.GameObjects.GameObject {
  const radius = ENTITY_CONFIG.PLAYER_RADIUS;
  const color = obj.visual?.tint ?? ENTITY_CONFIG.PLAYER_COLOR_DEFAULT;

  const player = scene.matter.add.image(obj.position.x, obj.position.y, "", undefined, {
    shape: { type: "circle", radius },
    restitution: ENTITY_CONFIG.PLAYER_RESTITUTION,
    friction: ENTITY_CONFIG.PLAYER_FRICTION,
  });

  player.setTint(color);
  player.setName(obj.id);
  player.setBounce(ENTITY_CONFIG.PLAYER_BOUNCE);
  player.setFixedRotation();
  scene.cameras.main.startFollow(player, true, 0.1, 0.1);

  return player;
}

/**
 * Platform: Static Matter rectangle + visual graphics layer.
 */
function createPlatform(scene: Phaser.Scene, obj: LevelObject): Phaser.GameObjects.GameObject {
  const color = obj.visual?.tint ?? ENTITY_CONFIG.PLATFORM_COLOR_DEFAULT;
  const width = (obj.scale?.x ?? 1) * ENTITY_CONFIG.PLATFORM_WIDTH;
  const height = (obj.scale?.y ?? 1) * ENTITY_CONFIG.PLATFORM_HEIGHT;
  const { x, y } = obj.position;

  scene.matter.add.rectangle(x, y, width, height, { isStatic: true, label: obj.id });

  const graphics = scene.add.graphics();
  graphics.fillStyle(color);
  graphics.fillRect(x - width / 2, y - height / 2, width, height);
  graphics.name = obj.id;

  return graphics;
}

/**
 * Sanity checks for schema consistency.
 */
function validateLevel(level: LevelData): void {
  if (!Array.isArray(level.objects)) throw new Error("Invalid level: objects array missing.");
  if (!level.version) throw new Error("Invalid level: missing version field.");
}
