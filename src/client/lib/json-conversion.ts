/**
 * json-conversion.ts
 * --------------------------------------------
 * Converts JSON level data (modern or legacy) into Phaser game objects.
 * Supports Matter.js physics, visuals, and consistent naming.
 * --------------------------------------------
 */

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

//////////////////////////
// 🔹 1. MAIN ENTRY POINT
//////////////////////////
export function loadLevel(
  scene: Phaser.Scene,
  json: LevelData | LegacyLevelFormat
): Phaser.GameObjects.GameObject[] {
  // 🔹 Normalize legacy format into modern LevelData
  const level: LevelData = "version" in json ? json : convertLegacyLevel(json);

  // 🔹 Validate structure
  validateLevel(level);

  // 🔹 Apply level-wide settings (like world bounds, background, gravity)
  applySettings(scene, level.settings);

  // 🔹 Array to hold references to created objects
  const createdObjects: Phaser.GameObjects.GameObject[] = [];

  // 🔹 Create each object safely
  level.objects.forEach((obj) => {
    try {
      const gameObject = createGameObject(scene, obj);
      if (gameObject) {
        createdObjects.push(gameObject);
      }
      console.log(`[LevelLoader] Created: ${obj.type} (${obj.id}) at`, obj.position);
    } catch (err) {
      console.error(`[LevelLoader] Error creating object ${obj.id}:`, err);
    }
  });

  // ✅ Summary log
  console.log(
    `%c[LevelLoader] Loaded Level: ${level.name} — ${createdObjects.length} objects created.`,
    "color: limegreen; font-weight: bold;"
  );

  // 🔹 Return all created objects
  return createdObjects;
}

//////////////////////////
// 🔹 2. LEGACY CONVERTER
//////////////////////////

function convertLegacyLevel(legacy: LegacyLevelFormat): LevelData {
  const objects: LevelObject[] = [];

  // Player
  objects.push({
    id: "player_1",
    type: LevelObjectType.Player,
    position: { x: legacy.player.x, y: legacy.player.y },
    physics: { type: PhysicsType.Dynamic },
    visual: { tint: parseColor(legacy.player.color) ?? 0xffffff },
  });

  // Platforms
  legacy.platforms.forEach((p, i) => {
    objects.push({
      id: `platform_${i + 1}`,
      type: LevelObjectType.Platform,
      position: { x: p.x, y: p.y },
      scale: { x: p.width / 100, y: p.height / 20 },
      physics: { type: PhysicsType.Static, isCollidable: true },
      visual: { tint: parseColor(p.color) ?? 0x888888 },
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

//////////////////////////
// 🔹 3. SETTINGS HANDLER
//////////////////////////

function applySettings(scene: Phaser.Scene, settings: LevelSettings): void {
  const world = (scene as any).matter?.world;

  if (settings.backgroundColor !== undefined && scene.cameras?.main) {
    scene.cameras.main.setBackgroundColor(settings.backgroundColor);
  }

  if (!world) {
    console.warn("[LevelLoader] Matter world not found.");
    return;
  }

  if (settings.gravity) world.setGravity(settings.gravity.x ?? 0, settings.gravity.y ?? 1);
  if (settings.bounds) world.setBounds(0, 0, settings.bounds.width, settings.bounds.height);
}

//////////////////////////
// 🔹 4. OBJECT CREATION
//////////////////////////

function createGameObject(scene: Phaser.Scene, obj: LevelObject): Phaser.GameObjects.GameObject | null {
  switch (obj.type) {
    case LevelObjectType.Player:
      return createPlayer(scene, obj);
    case LevelObjectType.Platform:
      return createPlatform(scene, obj);
    default:
      console.warn(`[LevelLoader] Unknown object type: ${obj.type}`);
      return null;
  }
}

//////////////////////////
// 🔹 5. ENTITY FACTORIES
//////////////////////////

function createPlayer(scene: Phaser.Scene, obj: LevelObject): Phaser.GameObjects.GameObject {
  const radius = 20;
  const color = obj.visual?.tint ?? 0xffffff;

  const player = scene.matter.add.image(obj.position.x, obj.position.y, "", undefined, {
    restitution: 0.2,
    friction: 0.05,
  });

  player.setCircle(radius);
  player.setTint(color);
  player.setName(obj.id);
  player.setBounce(0.2);
  player.setFixedRotation();

  const graphics = scene.add.graphics();
  graphics.fillStyle(color);
  graphics.fillCircle(obj.position.x, obj.position.y, radius);
  graphics.name = obj.id;

  console.log(`[Player] Drawn at (${obj.position.x}, ${obj.position.y})`);
  return graphics;
}

function createPlatform(scene: Phaser.Scene, obj: LevelObject): Phaser.GameObjects.GameObject {
  const color = obj.visual?.tint ?? 0x888888;
  const width = (obj.scale?.x ?? 1) * 100;
  const height = (obj.scale?.y ?? 1) * 20;
  const x = obj.position.x;
  const y = obj.position.y;

  scene.matter.add.rectangle(x, y, width, height, { isStatic: true, label: obj.id });

  const graphics = scene.add.graphics();
  graphics.fillStyle(color);
  graphics.fillRect(x - width / 2, y - height / 2, width, height);
  graphics.name = obj.id;

  console.log(`[Platform] Drawn at (${x}, ${y})`);
  return graphics;
}

//////////////////////////
// 🔹 6. VALIDATION
//////////////////////////

function validateLevel(level: LevelData): void {
  if (!level.objects || !Array.isArray(level.objects)) {
    throw new Error("Invalid level: objects array missing.");
  }
  if (!level.version) {
    throw new Error("Invalid level: missing version field.");
  }
}
