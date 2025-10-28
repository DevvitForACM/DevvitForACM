/**
 * RedisService - Wrapper around Devvit Redis Client
 * 
 * This service provides a clean interface for Redis operations in the Devvit app.
 * It replaces the Firebase service with Reddit's native Redis storage.
 * 
 * Key Features:
 * - Hash operations for structured data (user profiles)
 * - Sorted set operations for leaderboards
 * - TTL support for data expiration (GDPR compliance)
 * - Transaction support for atomic operations
 */

import type { RedisClient } from '@devvit/redis';

export interface RedisServiceOptions {
  defaultTTL?: number; // Default TTL in seconds (e.g., 30 days = 2592000)
}

export class RedisService {
  private redis: RedisClient;
  private options: RedisServiceOptions;

  constructor(redis: RedisClient, options: RedisServiceOptions = {}) {
    this.redis = redis;
    this.options = {
      defaultTTL: options.defaultTTL || 30 * 24 * 60 * 60, // 30 days default
    };
  }

  // ============================================
  // Hash Operations (for user profiles, etc.)
  // ============================================

  /**
   * Set all fields in a hash
   */
  async hSetAll(key: string, data: Record<string, string>, ttl?: number): Promise<void> {
    await this.redis.hSet(key, data);

    if (ttl !== undefined || this.options.defaultTTL) {
      await this.redis.expire(key, ttl ?? this.options.defaultTTL!);
    }
  }

  /**
   * Get all fields from a hash
   */
  async hGetAll(key: string): Promise<Record<string, string> | null> {
    const exists = await this.redis.exists(key);
    if (!exists) {
      return null;
    }

    return await this.redis.hGetAll(key);
  }

  /**
   * Get a single field from a hash
   */
  async hGet(key: string, field: string): Promise<string | null> {
    const value = await this.redis.hGet(key, field);
    return value ?? null;
  }

  /**
   * Set a single field in a hash
   */
  async hSet(key: string, field: string, value: string): Promise<void> {
    await this.redis.hSet(key, { [field]: value });
  }

  /**
   * Delete a hash
   */
  async hDel(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /**
   * Increment a numeric field in a hash
   */
  async hIncrBy(key: string, field: string, increment: number): Promise<number> {
    return await this.redis.hIncrBy(key, field, increment);
  }

  // ============================================
  // Sorted Set Operations (for leaderboards)
  // ============================================

  /**
   * Add or update a member in a sorted set
   */
  async zAdd(key: string, member: string, score: number): Promise<void> {
    await this.redis.zAdd(key, { member, score });
  }

  /**
   * Add or update multiple members in a sorted set
   */
  async zAddMultiple(key: string, members: Array<{ member: string; score: number }>): Promise<number> {
    return await this.redis.zAdd(key, ...members);
  }

  /**
   * Get members in a sorted set by rank range (0-based)
   * @param reverse - If true, returns highest scores first
   */
  async zRange(
    key: string,
    start: number,
    stop: number,
    reverse: boolean = false
  ): Promise<string[]> {
    const result = await this.redis.zRange(key, start, stop, {
      reverse,
      by: 'rank'
    });

    // If result is an array of objects with member/score, extract just the members
    if (Array.isArray(result) && result.length > 0 && typeof result[0] === 'object' && result[0] !== null && 'member' in result[0]) {
      return (result as Array<{ member: string; score: number }>).map(item => item.member);
    }

    // Otherwise assume it's already an array of strings
    return result as unknown as string[];
  }

  /**
   * Get members with scores in a sorted set
   */
  async zRangeWithScores(
    key: string,
    start: number,
    stop: number,
    reverse: boolean = false
  ): Promise<Array<{ member: string; score: number }>> {
    const rawResult = await this.redis.zRange(key, start, stop, {
      reverse,
      by: 'rank',
    });

    // Handle different return types from Redis client
    if (Array.isArray(rawResult) && rawResult.length > 0) {
      // If it's already objects with member/score, return as is
      if (typeof rawResult[0] === 'object' && rawResult[0] !== null && 'member' in rawResult[0]) {
        return rawResult as Array<{ member: string; score: number }>;
      }

      // If it's strings, fetch scores separately
      const results: Array<{ member: string; score: number }> = [];
      for (const member of rawResult as unknown as string[]) {
        const score = await this.redis.zScore(key, member);
        if (score !== null && score !== undefined) {
          results.push({ member, score });
        }
      }
      return results;
    }

    return [];
  }

  /**
   * Get the rank of a member (0-based)
   * @param reverse - If true, returns rank from highest score
   */
  async zRank(key: string, member: string, reverse: boolean = false): Promise<number | null> {
    const rank = await this.redis.zRank(key, member);
    if (rank === undefined) {
      return null;
    }

    // If reverse is requested, calculate reverse rank
    if (reverse) {
      const totalMembers = await this.redis.zCard(key);
      return totalMembers - rank - 1;
    }

    return rank;
  }

  /**
   * Get the score of a member
   */
  async zScore(key: string, member: string): Promise<number | null> {
    const score = await this.redis.zScore(key, member);
    return score ?? null;
  }

  /**
   * Increment the score of a member
   */
  async zIncrBy(key: string, member: string, increment: number): Promise<number> {
    return await this.redis.zIncrBy(key, member, increment);
  }

  /**
   * Remove a member from a sorted set
   */
  async zRem(key: string, ...members: string[]): Promise<number> {
    return await this.redis.zRem(key, members);
  }

  /**
   * Get the number of members in a sorted set
   */
  async zCard(key: string): Promise<number> {
    return await this.redis.zCard(key);
  }

  /**
   * Count members with scores between min and max
   * Note: This is a manual implementation since zCount is not available in Devvit Redis
   */
  async zCount(key: string, min: number, max: number): Promise<number> {
    // Get all members with scores
    const allMembers = await this.zRangeWithScores(key, 0, -1);

    // Count members within the score range
    return allMembers.filter(item => item.score >= min && item.score <= max).length;
  }

  // ============================================
  // String Operations (simple key-value)
  // ============================================

  /**
   * Set a string value
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    await this.redis.set(key, value);

    if (ttl !== undefined || this.options.defaultTTL) {
      await this.redis.expire(key, ttl ?? this.options.defaultTTL!);
    }
  }

  /**
   * Get a string value
   */
  async get(key: string): Promise<string | null> {
    const value = await this.redis.get(key);
    return value ?? null;
  }

  /**
   * Delete one or more keys
   */
  async del(...keys: string[]): Promise<void> {
    await this.redis.del(...keys);
  }

  /**
   * Check if a key exists
   */
  async exists(...keys: string[]): Promise<number> {
    return await this.redis.exists(...keys);
  }

  /**
   * Increment a numeric value
   */
  async incrBy(key: string, increment: number): Promise<number> {
    return await this.redis.incrBy(key, increment);
  }

  // ============================================
  // TTL / Expiration Operations
  // ============================================

  /**
   * Set expiration on a key (in seconds)
   */
  async expire(key: string, seconds: number): Promise<void> {
    await this.redis.expire(key, seconds);
  }

  /**
   * Get expiration time of a key
   */
  async expireTime(key: string): Promise<number> {
    return await this.redis.expireTime(key);
  }

  // ============================================
  // Transaction Support
  // ============================================

  /**
   * Execute operations in a transaction
   * @param keys - Keys to watch for changes
   * @param operations - Function that performs Redis operations using the transaction client
   * @returns Result of exec()
   */
  async transaction(
    keys: string[],
    operations: (txn: any) => Promise<void>
  ): Promise<any[]> {
    const txn = await this.redis.watch(...keys);

    try {
      await txn.multi();
      await operations(txn);
      return await txn.exec();
    } catch (error) {
      await txn.discard();
      throw error;
    }
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Get the raw Redis client for advanced operations
   */
  getClient(): RedisClient {
    return this.redis;
  }

  /**
   * Serialize object to JSON string for Redis storage
   */
  static serialize(obj: any): string {
    return JSON.stringify(obj);
  }

  /**
   * Deserialize JSON string from Redis
   */
  static deserialize<T = any>(str: string | null): T | null {
    if (!str) return null;
    try {
      return JSON.parse(str) as T;
    } catch {
      return null;
    }
  }
}
