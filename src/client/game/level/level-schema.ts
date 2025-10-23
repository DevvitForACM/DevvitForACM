export const LEVEL_SCHEMA_VERSION = "1.0.0";

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

export enum LevelLayer {
  Background = "background",
  Middleground = "middleground",
  Foreground = "foreground",
  UI = "ui",
}

export enum PhysicsType {
  Static = "static",
  Dynamic = "dynamic",
  Kinematic = "kinematic",
  None = "none",
}

export interface BaseObject {
  id: string;
  type: LevelObjectType;
  name?: string;
  position: {
    x: number;
    y: number;
  };
  rotation?: number;
  scale?: {
    x: number;
    y: number;
  };
  layer?: LevelLayer;
  visible?: boolean;
}

export interface PhysicsProperties {
  type: PhysicsType;
  isCollidable?: boolean;
  gravityScale?: number;
  friction?: number;
  restitution?: number;
  density?: number;
}

export interface VisualProperties {
  texture?: string;
  frame?: string | number;
  tint?: number;
  alpha?: number;
}

export interface BehaviorProperties {
  movementPattern?: "patrol" | "follow" | "idle";
  speed?: number;
  targetId?: string;
  triggerEvents?: string[];
}

export interface LevelObject extends BaseObject {
  physics?: PhysicsProperties;
  visual?: VisualProperties;
  behavior?: BehaviorProperties;
  properties?: Record<string, any>;
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

export interface LevelData {
  version: string;
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