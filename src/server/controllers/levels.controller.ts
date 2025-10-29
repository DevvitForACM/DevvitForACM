// src/controllers/level.controller.ts
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';
import { LevelsServiceRedis } from '../services/levels.service.redis';
import { redis, context } from '@devvit/web/server';
import { LevelData } from '../models/level';
import { AuthedRequest } from '../middlewares/auth';
import { LevelDataSchema } from '../services/validates';
import { LEVEL_SCHEMA_VERSION } from '../models/level';

export const LevelController = {
  // GET /levels/:id
  async getLevelByID(req: AuthedRequest, res: Response) {
    const { id } = req.params;
    const user = req.user;

    if (!id) {
      return res.status(400).json({ error: 'Level ID is required' });
    }

    try {
      if (!redis) {
        return res.status(500).json({ error: 'Redis not available' });
      }
      const db = new LevelsServiceRedis(redis);
      const doc = await db.get(`levels/${id}`);

      if (!doc.exists()) {
        return res.status(404).json({ error: 'Level not found' });
      }

      const level = doc.val() as LevelData;

      const isCreator = user && level.metadata?.createdBy === user.uid;

      if (!level.isPublic && !isCreator) {
        return res.status(403).json({ error: 'This level is private' });
      }

      return res.status(200).json(level);
    } catch (err) {
      console.error('Error fetching level:', err);

      if (err instanceof Error) {
        return res.status(500).json({
          error: 'Failed to fetch level',
          message: err.message,
        });
      }

      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // POST /levels
  async createLevel(req: AuthedRequest, res: Response) {
    const user = req.user;

    console.log('[createLevel] User:', user);
    console.log('[createLevel] Request body:', JSON.stringify(req.body).substring(0, 200));

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      console.log('[createLevel] Starting validation...');
      const validationResult = LevelDataSchema.safeParse(req.body);

      if (!validationResult.success) {
        console.error('[createLevel] Validation failed:', validationResult.error);
        return res.status(400).json({
          error: 'Invalid level data',
          details: validationResult.error.issues
        });
      }

      console.log('[createLevel] Validation passed');
      const levelData = validationResult.data;
      const levelId = uuidv4();
      const now = new Date().toISOString();

      const level: LevelData = {
        id: levelId,
        version: LEVEL_SCHEMA_VERSION,
        isPublic: levelData.isPublic,
        plays: 0,
        likes: 0,
        ...(levelData.name && { name: levelData.name }),
        ...(levelData.description && { description: levelData.description }),
        ...(levelData.settings && { settings: levelData.settings }),
        ...(levelData.objects && { objects: levelData.objects }),
        ...(levelData.chunks && { chunks: levelData.chunks }),
        metadata: {
          createdBy: user.uid,
          createdAt: now,
          ...(levelData.metadata?.difficulty && { difficulty: levelData.metadata.difficulty }),
          ...(levelData.metadata?.tags && { tags: levelData.metadata.tags }),
        },
      };

      console.log('[createLevel] Creating Redis services...');
      console.log('[createLevel] Context:', { hasContext: !!context, hasRedis: !!redis });

      if (!redis) {
        console.error('[createLevel] Redis client is undefined!');
        return res.status(500).json({ error: 'Redis service unavailable' });
      }

      const db = new LevelsServiceRedis(redis);

      console.log('[createLevel] Saving to Redis...');
      await db.set(`levels/${levelId}`, level);
      console.log('[createLevel] Saved successfully');

      return res.status(201).json({
        message: 'Level created successfully',
        id: levelId,
        level,
      });
    } catch (err) {
      console.error('Error creating level:', err);

      if (err instanceof Error) {
        return res.status(500).json({
          error: 'Failed to create level',
          message: err.message,
        });
      }

      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /levels/user/:userId
  async getAllLevelsByUser(req: AuthedRequest, res: Response) {
    const { userId } = req.params;
    const user = req.user;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    try {
      if (!redis) {
        return res.status(500).json({ error: 'Redis not available' });
      }
      const db = new LevelsServiceRedis(redis);

      let levels = await db.getLevelsByUser(userId);

      if (!user || user.uid !== userId) {
        // Filter only public levels if not owner
        levels = levels.filter((lvl) => lvl.isPublic === true);
      }

      return res.status(200).json({ levels, count: levels.length, userId });
    } catch (err) {
      console.error('Error fetching user levels:', err);

      if (err instanceof Error) {
        return res.status(500).json({
          error: 'Failed to fetch user levels',
          message: err.message,
        });
      }

      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /levels/public
  async getAllPublicLevels(req: Request, res: Response) {
    try {
      const { limit = '50' } = req.query;
      const limitNum = Math.min(parseInt(limit as string) || 50, 100);

      if (!redis) {
        return res.status(500).json({ error: 'Redis not available' });
      }
      const db = new LevelsServiceRedis(redis);
      const levels = await db.getPublicLevels(limitNum);

      return res.status(200).json({ levels });
    } catch (err) {
      console.error('Error fetching public levels:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // PATCH /levels/:id
  async updateLevel(req: AuthedRequest, res: Response) {
    const user = req.user;
    const { id } = req.params;
    const updates = req.body;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Level ID is required' });
    }

    try {
      if (!redis) {
        return res.status(500).json({ error: 'Redis not available' });
      }
      const db = new LevelsServiceRedis(redis);
      const doc = await db.get(`levels/${id}`);

      if (!doc.exists()) {
        return res.status(404).json({ error: 'Level not found' });
      }

      const level = doc.val() as LevelData;

      if (level.metadata?.createdBy !== user.uid) {
        return res.status(403).json({ error: 'You can only update your own levels' });
      }

      // Remove protected fields
      const {
        plays,
        likes,
        id: levelId,
        metadata,
        ...allowedUpdates
      } = updates;

      const safeUpdates: any = { ...allowedUpdates };

      if (metadata) {
        safeUpdates.metadata = {
          ...metadata,
          createdBy: level.metadata?.createdBy,
          createdAt: level.metadata?.createdAt,
        };
      }

      if (Object.keys(safeUpdates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      // Validate updates
      const validationResult = LevelDataSchema.partial().safeParse(safeUpdates);

      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Invalid update data'
        });
      }

      // Merge old data with safeUpdates and overwrite with set
      const updatedLevel = {
        ...level,
        ...safeUpdates,
      };

      await db.set(`levels/${id}`, updatedLevel);

      return res.status(200).json({
        message: 'Level updated successfully',
        updated: Object.keys(safeUpdates),
      });
    } catch (err) {
      console.error('Error updating level:', err);

      if (err instanceof Error) {
        return res.status(500).json({
          error: 'Failed to update level',
          message: err.message,
        });
      }

      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  ,

  // DELETE /levels/:id
  async deleteLevel(req: AuthedRequest, res: Response) {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Level ID is required' });
    }

    try {
      if (!redis) {
        return res.status(500).json({ error: 'Redis not available' });
      }
      const db = new LevelsServiceRedis(redis);
      const doc = await db.get(`levels/${id}`);

      if (!doc.exists()) {
        return res.status(404).json({ error: 'Level not found' });
      }

      const level = doc.val() as LevelData;

      if (level.metadata?.createdBy !== user.uid) {
        return res.status(403).json({ error: 'You can only delete your own levels' });
      }

      await db.set(`levels/${id}`, null);

      return res.status(200).json({
        message: 'Level deleted successfully',
        id,
      });
    } catch (err) {
      console.error('Error deleting level:', err);

      if (err instanceof Error) {
        return res.status(500).json({
          error: 'Failed to delete level',
          message: err.message,
        });
      }

      return res.status(500).json({ error: 'Internal server error' });
    }
  },
};
