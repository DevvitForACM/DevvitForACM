/**
 * Levels Service - Redis Version
 * 
 * Manages game levels using Redis storage.
 * Replaces Firebase service for level data.
 * 
 * Redis Data Structure:
 * - levels:{levelId} (String): JSON-serialized level data
 * - levels:user:{userId} (Set): Set of level IDs created by user
 * - levels:public (Sorted Set): Public levels sorted by creation time
 */

import type { RedisClient } from '@devvit/redis';
import { LevelData } from '../models/level';

export class LevelsServiceRedis {
  private redis: RedisClient;

  constructor(redis: RedisClient) {
    this.redis = redis;
  }

  /**
   * Get a level by ID
   */
  async get(path: string): Promise<{ exists: () => boolean; val: () => LevelData | null }> {
    // Extract level ID from path (e.g., "levels/abc123" -> "abc123")
    const levelId = path.replace('levels/', '');
    
    const levelJson = await this.redis.get(`levels:${levelId}`);
    
    return {
      exists: () => levelJson !== null,
      val: () => levelJson ? JSON.parse(levelJson) : null
    };
  }

  /**
   * Set/update a level (or delete if data is null)
   */
  async set(path: string, data: LevelData | null): Promise<void> {
    const levelId = path.replace('levels/', '');
    
    if (data === null) {
      // Delete level
      await this.deleteLevel(levelId);
      return;
    }

    const existingData = await this.redis.get(`levels:${levelId}`);
    const isNewLevel = !existingData;

    // Store level data as JSON string
    await this.redis.set(`levels:${levelId}`, JSON.stringify(data));

    const userId = data.metadata?.createdBy;

    // Add to user's level sorted set if it's a new level
    if (isNewLevel && userId) {
      const timestamp = new Date(data.metadata?.createdAt || Date.now()).getTime();
      await this.redis.zAdd(`levels:user:${userId}`, { member: levelId, score: timestamp });
    }

    // Manage public index
    if (data.isPublic) {
      const timestamp = new Date(data.metadata?.createdAt || Date.now()).getTime();
      await this.redis.zAdd('levels:public', { member: levelId, score: timestamp });
    } else {
      // Remove from public index if not public
      await this.redis.zRem('levels:public', [levelId]);
    }
  }

  /**
   * Delete a level
   */
  private async deleteLevel(levelId: string): Promise<void> {
    // Get level data first to clean up indices
    const levelJson = await this.redis.get(`levels:${levelId}`);
    
    if (levelJson) {
      const level: LevelData = JSON.parse(levelJson);
      const userId = level.metadata?.createdBy;

      // Remove from user's level sorted set
      if (userId) {
        await this.redis.zRem(`levels:user:${userId}`, [levelId]);
      }

      // Remove from public index
      if (level.isPublic) {
        await this.redis.zRem('levels:public', [levelId]);
      }
    }

    // Delete level data
    await this.redis.del(`levels:${levelId}`);
  }

  /**
   * Get all levels (for filtering)
   * This returns a snapshot-like object to match Firebase API
   */
  async getAllLevels(): Promise<{ exists: () => boolean; val: () => Record<string, LevelData> | null }> {
    // Get all public level IDs
    const results = await this.redis.zRange('levels:public', 0, -1, { by: 'rank' });
    
    // Get all user sets (this is expensive - consider maintaining a global set)
    // For now, we'll just return public levels
    
    const levels: Record<string, LevelData> = {};
    
    for (const result of results) {
      const levelId = typeof result === 'string' ? result : result.member;
      const levelJson = await this.redis.get(`levels:${levelId}`);
      if (levelJson) {
        levels[levelId] = JSON.parse(levelJson);
      }
    }

    return {
      exists: () => Object.keys(levels).length > 0,
      val: () => Object.keys(levels).length > 0 ? levels : null
    };
  }

  /**
   * Get levels by user ID
   */
  async getLevelsByUser(userId: string): Promise<LevelData[]> {
    // Get all level IDs for user from sorted set (sorted by creation time)
    const results = await this.redis.zRange(`levels:user:${userId}`, 0, -1, { by: 'rank', reverse: true });
    
    if (!results || results.length === 0) {
      return [];
    }

    const levels: LevelData[] = [];
    for (const result of results) {
      const levelId = typeof result === 'string' ? result : result.member;
      const levelJson = await this.redis.get(`levels:${levelId}`);
      if (levelJson) {
        levels.push(JSON.parse(levelJson));
      }
    }

    // Sort by creation date (newest first)
    levels.sort((a, b) => {
      const dateA = new Date(a.metadata?.createdAt || 0).getTime();
      const dateB = new Date(b.metadata?.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return levels;
  }

  /**
   * Get all public levels
   */
  async getPublicLevels(limit: number = 50): Promise<LevelData[]> {
    const results = await this.redis.zRange('levels:public', 0, limit - 1, { by: 'rank', reverse: true });
    
    if (!results || results.length === 0) {
      return [];
    }

    const levels: LevelData[] = [];
    for (const result of results) {
      const levelId = typeof result === 'string' ? result : result.member;
      const levelJson = await this.redis.get(`levels:${levelId}`);
      if (levelJson) {
        const level = JSON.parse(levelJson);
        if (level.isPublic) {
          levels.push(level);
        }
      }
    }

    return levels;
  }
}
