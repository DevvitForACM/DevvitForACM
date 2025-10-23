
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
  UpvoteDown = "upvote-1",
  UpvoteLeft = "upvote-2",
  UpvoteUp = "upvote-3",
  UpvoteRight = "upvote-4",
  DownvoteDown = "downvote-1",
  DownvoteLeft = "downvote-2",
  DownvoteUp = "downvote-3",
  DownvoteRight = "downvote-4",
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
  id?: string;
  version: string; // should match LEVEL_SCHEMA_VERSION
  name: string;
  description?: string;
  settings: LevelSettings;
  objects: LevelObject[];
  isPublic:boolean;
  plays?:number;
  likes?:number;
  metadata?: {
    createdBy?: string;
    createdAt?: string;
    difficulty?: "easy" | "medium" | "hard";
    tags?: string[];
  };
}

