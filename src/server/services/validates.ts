import { z } from 'zod';
import { LevelObjectType, LevelLayer, PhysicsType } from '../models/level';

// Base object schema
const BaseObjectSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(LevelObjectType),
  name: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  rotation: z.number().optional(),
  scale: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  layer: z.nativeEnum(LevelLayer).optional(),
  visible: z.boolean().optional(),
});

// Physics properties schema
const PhysicsPropertiesSchema = z.object({
  type: z.nativeEnum(PhysicsType),
  isCollidable: z.boolean().optional(),
  gravityScale: z.number().optional(),
  friction: z.number().optional(),
  restitution: z.number().optional(),
  density: z.number().optional(),
});

// Visual properties schema
const VisualPropertiesSchema = z.object({
  texture: z.string().optional(),
  frame: z.union([z.string(), z.number()]).optional(),
  tint: z.number().optional(),
  alpha: z.number().optional(),
});

// Behavior properties schema
const BehaviorPropertiesSchema = z.object({
  movementPattern: z.enum(['patrol', 'follow', 'idle']).optional(),
  speed: z.number().optional(),
  targetId: z.string().optional(),
  triggerEvents: z.array(z.string()).optional(),
});

// Level object schema
const LevelObjectSchema = BaseObjectSchema.extend({
  physics: PhysicsPropertiesSchema.optional(),
  visual: VisualPropertiesSchema.optional(),
  behavior: BehaviorPropertiesSchema.optional(),
  properties: z.record(z.any()).optional(),
});

// Level settings schema
const LevelSettingsSchema = z.object({
  gravity: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  backgroundColor: z.string().optional(),
  music: z.string().optional(),
  ambientLight: z.number().optional(),
  bounds: z.object({
    width: z.number(),
    height: z.number(),
  }).optional(),
});

// Main level data schema
export const LevelDataSchema = z.object({
  id: z.string().optional(),
  version: z.string(),
  name: z.string().min(1, 'Level name is required'),
  description: z.string().optional(),
  settings: LevelSettingsSchema,
  objects: z.array(LevelObjectSchema),
  isPublic: z.boolean(),
  plays: z.number().optional(),
  likes: z.number().optional(),
  metadata: z.object({
    createdBy: z.string().optional(),
    createdAt: z.string().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
});