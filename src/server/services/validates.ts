import { z } from 'zod';

// Level validation schemas
export const LevelDataSchema = z.object({
  id: z.string().optional(),
  version: z.string().optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
  plays: z.number().int().min(0).optional(),
  likes: z.number().int().min(0).optional(),
  settings: z.object({
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
  }).optional(),
  objects: z.array(z.any()).optional(),
  chunks: z.any().optional(),
  metadata: z.object({
    createdBy: z.string().optional(),
    createdAt: z.string().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
});

export type LevelDataInput = z.infer<typeof LevelDataSchema>;
