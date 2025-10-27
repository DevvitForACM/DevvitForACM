/**
 * level-schema.ts
 * --------------------------------------------
 * Defines the TypeScript schema for JSON-based game levels.
 * This schema uses a grid-based tile system (60x60 pixel cells) for level design,
 * with separate pixel-based positioning for dynamic entities.
 * --------------------------------------------
 */

/**
 * Version number for backward compatibility.
 * Allows older levels to remain supported after schema upgrades.
 */
export const LEVEL_SCHEMA_VERSION = '2.0.0';

/**
 * Grid cell size in pixels
 */
export const GRID_CELL_SIZE = 60;

/**
 * Tile types that can be placed on the grid.
 * These represent static level elements like platforms, obstacles, etc.
 */
export enum TileType {
  Empty = 'empty',
  Grass = 'grass',
  Dirt = 'dirt',
  Stone = 'stone',
  Spring = 'spring',
  Spike = 'spike',
  Coin = 'coin',
  Door = 'door',
  Water = 'water',
  Lava = 'lava',
}

/**
 * Dynamic entity types that use pixel coordinates.
 * These are not part of the grid system.
 */
export enum EntityType {
  Player = 'player',
  Enemy = 'enemy',
  Collectible = 'collectible',
  Trigger = 'trigger',
  Decoration = 'decoration',
}

/**
 * Grid coordinate system (bottom-left origin)
 */
export interface GridPosition {
  x: number;
  y: number;
}

/**
 * Pixel coordinate system for dynamic entities
 */
export interface PixelPosition {
  x: number;
  y: number;
}

/**
 * A single tile in the grid system
 */
export interface GridTile {
  type: TileType;
  gridX: number;
  gridY: number;
  properties?: Record<string, any>;
}

/**
 * Base interface for dynamic entities (not grid-based)
 */
export interface BaseEntity {
  id: string;
  type: EntityType;
  name?: string;
  position: PixelPosition;
  rotation?: number;
  scale?: {
    x: number;
    y: number;
  };
  visible?: boolean;
}

/**
 * Physics and collision properties applied to physical objects.
 */
export interface PhysicsProperties {
  type: 'static' | 'dynamic' | 'kinematic' | 'none';
  isCollidable?: boolean;
  gravityScale?: number;
  friction?: number;
  restitution?: number;
  density?: number;
}

/**
 * Sprite and texture properties for rendering.
 */
export interface VisualProperties {
  texture?: string;
  frame?: string | number;
  tint?: number;
  alpha?: number;
}

/**
 * Optional AI or behavior metadata for dynamic objects.
 */
export interface BehaviorProperties {
  movementPattern?: 'patrol' | 'follow' | 'idle';
  speed?: number;
  targetId?: string;
  triggerEvents?: string[];
}

/**
 * Extended interface for dynamic entities with additional data.
 */
export interface LevelEntity extends BaseEntity {
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

/**
 * Grid dimensions and layout settings
 * Cell size is fixed at 60 pixels and not configurable
 */
export interface GridSettings {
  width: number;
  height: number;
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
 * Uses grid-based tiles for level design and pixel-based entities for dynamic objects.
 */
export interface LevelData {
  version: string;
  name: string;
  description?: string;
  settings: LevelSettings;
  grid: GridSettings;
  tiles: GridTile[];
  entities: LevelEntity[];
  metadata?: {
    createdBy?: string;
    createdAt?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    tags?: string[];
  };
}

/**
 * A minimal example of what a JSON level might look like.
 * This demonstrates the grid-based tile system with pixel-based entities.
 */
export const exampleLevel: LevelData = {
  version: LEVEL_SCHEMA_VERSION,
  name: 'Sample Grid Level',
  description:
    'A demo level showing grid-based tiles and pixel-based entities.',
  settings: {
    gravity: { x: 0, y: 1 },
    backgroundColor: '#87CEEB',
    bounds: { width: 1200, height: 600 },
  },
  grid: {
    width: 20,
    height: 10,
  },
  tiles: [
    { type: TileType.Grass, gridX: 0, gridY: 0 },
    { type: TileType.Grass, gridX: 1, gridY: 0 },
    { type: TileType.Grass, gridX: 2, gridY: 0 },
    { type: TileType.Grass, gridX: 3, gridY: 0 },
    { type: TileType.Grass, gridX: 4, gridY: 0 },
    { type: TileType.Grass, gridX: 5, gridY: 0 },
    { type: TileType.Grass, gridX: 6, gridY: 0 },
    { type: TileType.Grass, gridX: 7, gridY: 0 },
    { type: TileType.Grass, gridX: 8, gridY: 0 },
    { type: TileType.Grass, gridX: 9, gridY: 0 },
    { type: TileType.Grass, gridX: 10, gridY: 0 },
    { type: TileType.Grass, gridX: 11, gridY: 0 },
    { type: TileType.Grass, gridX: 12, gridY: 0 },
    { type: TileType.Grass, gridX: 13, gridY: 0 },
    { type: TileType.Grass, gridX: 14, gridY: 0 },
    { type: TileType.Grass, gridX: 15, gridY: 0 },
    { type: TileType.Grass, gridX: 16, gridY: 0 },
    { type: TileType.Grass, gridX: 17, gridY: 0 },
    { type: TileType.Grass, gridX: 18, gridY: 0 },
    { type: TileType.Grass, gridX: 19, gridY: 0 },

    { type: TileType.Grass, gridX: 3, gridY: 2 },
    { type: TileType.Grass, gridX: 4, gridY: 2 },
    { type: TileType.Grass, gridX: 5, gridY: 2 },

    { type: TileType.Spring, gridX: 1, gridY: 0 },
    { type: TileType.Spike, gridX: 2, gridY: 0 },

    { type: TileType.Coin, gridX: 6, gridY: 2 },
    { type: TileType.Coin, gridX: 8, gridY: 2 },
    { type: TileType.Coin, gridX: 10, gridY: 2 },
  ],
  entities: [
    {
      id: 'player_1',
      type: EntityType.Player,
      position: { x: 30, y: 540 },
      physics: { type: 'dynamic' },
      visual: { texture: 'player-idle-1' },
    },
  ],
  metadata: {
    createdBy: 'Developer',
    createdAt: new Date().toISOString(),
    difficulty: 'easy',
    tags: ['tutorial', 'grid-based'],
  },
};
