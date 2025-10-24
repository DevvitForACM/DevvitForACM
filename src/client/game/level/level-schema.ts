/**
 * level-schema.ts
 * --------------------------------------------
 * Defines the TypeScript schema for JSON-based game levels.
 * This schema is versioned, modular, and designed for scalable use
 * with Phaser or any other rendering engine.
 * --------------------------------------------
 */

//////////////////////////
// 🔹 ENUMS AND CONSTANTS
//////////////////////////

/**
 * Version number for backward compatibility.
 * Allows older levels to remain supported after schema upgrades.
 */
export const LEVEL_SCHEMA_VERSION = "1.0.0";

/**
 * Supported object types that can appear in a level.
 * Extend this list as your game evolves.
 */
export enum LevelObjectType {
  Player = "player",
  Enemy = "enemy",
  Platform = "platform",
  Goal = "goal",
  Collectible = "collectible",
  Obstacle = "obstacle",
  Trigger = "trigger",
  Decoration = "decoration",
  Spring = "spring",
  Spike = "spike",
}

/**
 * Common tags or layers — useful for selective collision or rendering.
 */
export enum LevelLayer {
  Background = "background",
  Middleground = "middleground",
  Foreground = "foreground",
  UI = "ui",
}

/**
 * Possible physics body types (useful for Matter.js or Arcade Physics).
 */
export enum PhysicsType {
  Static = "static",
  Dynamic = "dynamic",
  Kinematic = "kinematic",
  None = "none",
}

//////////////////////////
// 🔹 CORE INTERFACES
//////////////////////////

/**
 * Base interface for all game objects in a level.
 */
export interface BaseObject {
  id: string; // unique identifier
  type: LevelObjectType;
  name?: string; // optional label for editor/debugging
  position: {
    x: number;
    y: number;
  };
  rotation?: number; // degrees
  scale?: {
    x: number;
    y: number;
  };
  layer?: LevelLayer;
  visible?: boolean;
}

/**
 * Physics and collision properties applied to physical objects.
 */
export interface PhysicsProperties {
  type: PhysicsType;
  isCollidable?: boolean;
  gravityScale?: number;
  friction?: number;
  restitution?: number; // bounce
  density?: number;
}

/**
 * Sprite and texture properties for rendering.
 */
export interface VisualProperties {
  texture?: string; // key for loaded texture
  frame?: string | number;
  tint?: number; // optional color tint
  alpha?: number;
}

/**
 * Optional AI or behavior metadata for dynamic objects.
 */
export interface BehaviorProperties {
  movementPattern?: "patrol" | "follow" | "idle";
  speed?: number;
  targetId?: string; // used in 'follow' pattern
  triggerEvents?: string[]; // e.g., onEnter, onCollision
}

/**
 * Extended interface for any object with additional data.
 */
export interface LevelObject extends BaseObject {
  physics?: PhysicsProperties;
  visual?: VisualProperties;
  behavior?: BehaviorProperties;
  properties?: Record<string, any>; // flexible custom attributes
}




export interface LegacyLevelFormat {
  world: {
    width: number;
    height: number;
    backgroundColor?: string;
  };
  player: {
    x: number;
    y: number;
    radius: number;
    color: string;
  };
  platforms: {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
  }[];
}



/**
 * Defines background, gravity, and other environment-wide settings.
 */
export interface LevelSettings {
  gravity?: {
    x: number;
    y: number;
  };
  backgroundColor?: string;
  music?: string;
  ambientLight?: number;
  bounds?: {
    width: number;
    height: number;
  };
}

/**
 * The main structure of a level JSON file.
 */
export interface LevelData {
  version: string; // should match LEVEL_SCHEMA_VERSION
  name: string;
  description?: string;
  settings: LevelSettings;
  objects: LevelObject[];
  metadata?: {
    createdBy?: string;
    createdAt?: string;
    difficulty?: "easy" | "medium" | "hard";
    tags?: string[];
  };
}

//////////////////////////
// 🔹 EXAMPLE TEMPLATE
//////////////////////////

/**
 * A minimal example of what a JSON level might look like.
 * This is useful for testing and schema validation.
 */
export const exampleLevel: LevelData = {
  version: LEVEL_SCHEMA_VERSION,
  name: "Sample Level 1",
  description: "This is a demo level showing JSON layout.",
  settings: {
    gravity: { x: 0, y: 1 },
    backgroundColor: "#87CEEB",
    bounds: { width: 2000, height: 1000 },
  },
  objects: [
    {
      id: "player_1",
      type: LevelObjectType.Player,
      position: { x: 100, y: 800 },
      physics: { type: PhysicsType.Dynamic },
      visual: { texture: "player_sprite", frame: 0 },
    },
    {
      id: "ground_1",
      type: LevelObjectType.Platform,
      position: { x: 0, y: 950 },
      scale: { x: 10, y: 1 },
      physics: { type: PhysicsType.Static, isCollidable: true },
      visual: { texture: "platform_tile" },
    },
  ],
  metadata: {
    createdBy: "Adarsh Dubey",
    createdAt: new Date().toISOString(),
    difficulty: "easy",
  },
};

