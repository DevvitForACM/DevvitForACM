export const LEVEL_SCHEMA_VERSION = '1.0.0';

export enum LevelObjectType {
  Player = 'player',
  Enemy = 'enemy',
  Platform = 'platform',
  Goal = 'goal',
  Coin = 'coin',
  Obstacle = 'obstacle',
  Door = 'door',
  Trigger = 'trigger',
  Decoration = 'decoration',
  Spring = 'spring',
  Spike = 'spike',
}

export enum LevelLayer {
  Background = 'background',
  Middleground = 'middleground',
  Foreground = 'foreground',
  UI = 'ui',
}

export enum PhysicsType {
  Static = 'static',
  Dynamic = 'dynamic',
  Kinematic = 'kinematic',
  None = 'none',
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
  movementPattern?: 'patrol' | 'follow' | 'idle';
  speed?: number;
  targetId?: string;
  triggerEvents?: string[];
}


export interface LevelObject extends BaseObject {
  templateId?: string; 
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
  gravity?: { x: number; y: number };
  backgroundColor?: string;
  music?: string;
  ambientLight?: number;
  bounds?: { width: number; height: number };
  defaults?: {
    physics?: Partial<PhysicsProperties>;
    visual?: Partial<VisualProperties>;
  };
}

export interface LevelData {
  version: string;
  name: string;
  description?: string;
  settings: LevelSettings;
  objects: LevelObject[] | Record<LevelObjectType, LevelObject[]>; // NEW
  metadata?: {
    createdBy?: string;
    createdAt?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    tags?: string[];
  };
}

export const DEFAULT_TEMPLATES: Record<string, Partial<LevelObject>> = {
  [LevelObjectType.Platform]: {
    physics: { type: PhysicsType.Static, isCollidable: true },
    visual: { texture: 'platform_tile' },
  },
  [LevelObjectType.Player]: {
    physics: { type: PhysicsType.Dynamic },
    visual: { texture: 'player_sprite', frame: 0 },
  },
  [LevelObjectType.Spike]: {
    physics: { type: PhysicsType.Static, isCollidable: true },
    visual: { texture: 'spike_tile' },
  },
};

export function expandLevelObject(obj: LevelObject): LevelObject {
  const template = DEFAULT_TEMPLATES[obj.templateId || obj.type] || {};
  return {
    ...template,
    ...obj,
    physics: {
      ...(template.physics || {}),
      ...(obj.physics || {}),
      type: obj.physics?.type ?? template.physics?.type ?? PhysicsType.None,
    },
    visual: { ...(template.visual || {}), ...(obj.visual || {}) },
    behavior: { ...(template.behavior || {}), ...(obj.behavior || {}) },
  };
}


export const exampleLevel: LevelData = {
  version: LEVEL_SCHEMA_VERSION,
  name: 'Sample Level 1',
  description: 'Optimized demo level with templates and defaults.',
  settings: {
    gravity: { x: 0, y: 1 },
    backgroundColor: '#87CEEB',
    bounds: { width: 2000, height: 1000 },
    defaults: {
      physics: { friction: 0.1, restitution: 0.2 },
      visual: { alpha: 1 },
    },
  },
  objects: [
    {
      id: 'player_1',
      type: LevelObjectType.Player,
      position: { x: 100, y: 800 },
      templateId: 'player',
    },
    {
      id: 'ground_1',
      type: LevelObjectType.Platform,
      position: { x: 0, y: 950 },
      scale: { x: 10, y: 1 },
      templateId: 'platform',
    },
  ],
  metadata: {
    createdBy: 'Adarsh Dubey',
    createdAt: new Date().toISOString(),
    difficulty: 'easy',
  },
};
