import { z } from "zod";

export const LEVEL_SCHEMA_VERSION = "1.0.0";


export const LevelObjectTypeSchema = z.enum([
  "player",
  "enemy",
  "platform",
  "goal",
  "collectible",
  "obstacle",
  "trigger",
  "decoration",
  "upvote-1",
  "upvote-2",
  "upvote-3",
  "upvote-4",
  "downvote-1",
  "downvote-2",
  "downvote-3",
  "downvote-4",
]);

export const LevelLayerSchema = z.enum([
  "background",
  "middleground",
  "foreground",
  "ui",
]);

export const PhysicsTypeSchema = z.enum([
  "static",
  "dynamic",
  "kinematic",
  "none",
]);



export const Vector2Schema = z.object({
  x: z.number(),
  y: z.number(),
}).strict();

export const ScaleSchema = z.object({
  x: z.number(),
  y: z.number(),
}).strict();



export const PhysicsPropertiesSchema = z.object({
  type: PhysicsTypeSchema,
  isCollidable: z.boolean().optional(),
  gravityScale: z.number().optional(),
  friction: z.number().optional(),
  restitution: z.number().optional(),
  density: z.number().optional(),
}).strict();

export const VisualPropertiesSchema = z.object({
  texture: z.string().optional(),
  frame: z.union([z.string(), z.number()]).optional(),
  tint: z.number().optional(),
  alpha: z.number().optional(),
}).strict();

export const BehaviorPropertiesSchema = z.object({
  movementPattern: z.enum(["patrol", "follow", "idle"]).optional(),
  speed: z.number().optional(),
  targetId: z.string().optional(),
  triggerEvents: z.array(z.string()).optional(),
}).strict();



export const BaseObjectSchema = z.object({
  id: z.string(),
  type: LevelObjectTypeSchema,
  name: z.string().optional(),
  position: Vector2Schema,
  rotation: z.number().optional(),
  scale: ScaleSchema.optional(),
  layer: LevelLayerSchema.optional(),
  visible: z.boolean().optional(),
}).strict();

export const LevelObjectSchema = BaseObjectSchema.extend({
  physics: PhysicsPropertiesSchema.optional(),
  visual: VisualPropertiesSchema.optional(),
  behavior: BehaviorPropertiesSchema.optional(),
  properties: z.record(z.string(), z.any()).optional(),
}).strict();



export const LevelSettingsSchema = z.object({
  gravity: Vector2Schema.optional(),
  backgroundColor: z.string().optional(),
  music: z.string().optional(),
  ambientLight: z.number().optional(),
  bounds: z.object({
    width: z.number(),
    height: z.number(),
  }).strict().optional(),
}).strict();



export const LegacyLevelFormatSchema = z.object({
  world: z.object({
    width: z.number(),
    height: z.number(),
    backgroundColor: z.string().optional(),
  }).strict(),
  player: z.object({
    x: z.number(),
    y: z.number(),
    radius: z.number(),
    color: z.string(),
  }).strict(),
  platforms: z.array(z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    color: z.string(),
  }).strict()),
}).strict();


export const LevelDataSchema = z.object({
  id: z.string().optional(),
  version: z.string(),
  name: z.string(),
  description: z.string().optional(),
  settings: LevelSettingsSchema,
  objects: z.array(LevelObjectSchema),
  isPublic: z.boolean(),
  metadata: z.object({
    createdBy: z.string().optional(),
    createdAt: z.string().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    tags: z.array(z.string()).optional(),
  }).strict().optional(),
}).strict();


