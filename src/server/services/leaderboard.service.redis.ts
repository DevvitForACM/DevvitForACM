/**
 * Leaderboard Service - Redis Version
 * 
 * Manages leaderboard functionality using Redis sorted sets.
 * Replaces Firebase Realtime Database with Reddit's native Redis storage.
 * 
 * Redis Data Structure:
 * - leaderboard:scores (Sorted Set): userId -> score
 * - leaderboard:user:{userId} (Hash): username, score, timestamp
 */

import { LeaderboardEntry, UpdateScoreRequest } from '../../shared/types/leaderboard';
import { RedisService } from './redis.service';

const LEADERBOARD_KEY = 'leaderboard:scores';
const USER_PREFIX = 'leaderboard:user:';

export class LeaderboardServiceRedis {
  private redisService: RedisService;

  constructor(redisService: RedisService) {
    this.redisService = redisService;
  }

  /**
   * Update or create a user's score on the leaderboard
   */
  async updateScore(request: UpdateScoreRequest): Promise<LeaderboardEntry> {
    const { userId, username, score } = request;

    if (!userId || !username || typeof score !== 'number') {
      throw new Error('Invalid leaderboard entry data');
    }

    const timestamp = Date.now();

    // Store score in sorted set
    await this.redisService.zAdd(LEADERBOARD_KEY, userId, score);

    // Store user details in hash
    await this.redisService.hSetAll(
      `${USER_PREFIX}${userId}`,
      {
        userId,
        username,
        score: score.toString(),
        timestamp: timestamp.toString(),
      }
    );

    return {
      userId,
      username,
      score,
      timestamp,
    };
  }

  /**
   * Get top N users from the leaderboard
   */
  async getTopUsers(limit: number = 10): Promise<LeaderboardEntry[]> {
    // Get top user IDs from sorted set (highest scores first)
    const userIds = await this.redisService.zRange(
      LEADERBOARD_KEY,
      0,
      limit - 1,
      true // reverse = true for highest scores first
    );

    if (userIds.length === 0) {
      return [];
    }

    // Fetch user details for each ID
    const entries: LeaderboardEntry[] = [];
    for (const userId of userIds) {
      const userData = await this.redisService.hGetAll(`${USER_PREFIX}${userId}`);

      if (userData && userData.userId && userData.username && userData.score && userData.timestamp) {
        entries.push({
          userId: userData.userId,
          username: userData.username,
          score: parseInt(userData.score, 10),
          timestamp: parseInt(userData.timestamp, 10),
        });
      }
    }

    return entries;
  }

  /**
   * Get a user's rank (1-indexed)
   */
  async getUserRank(userId: string): Promise<number | null> {
    // Check if user exists in sorted set
    const score = await this.redisService.zScore(LEADERBOARD_KEY, userId);

    if (score === null) {
      return null;
    }

    // Get rank (0-based) from sorted set, reversed for highest score first
    const rank = await this.redisService.zRank(LEADERBOARD_KEY, userId, true);

    if (rank === null) {
      return null;
    }

    // Convert to 1-indexed rank
    return rank + 1;
  }

  /**
   * Get a specific user's leaderboard entry
   */
  async getUserEntry(userId: string): Promise<LeaderboardEntry | null> {
    const userData = await this.redisService.hGetAll(`${USER_PREFIX}${userId}`);

    if (!userData || !userData.userId || !userData.username || !userData.score || !userData.timestamp) {
      return null;
    }

    return {
      userId: userData.userId,
      username: userData.username,
      score: parseInt(userData.score, 10),
      timestamp: parseInt(userData.timestamp, 10),
    };
  }

  /**
   * Get total number of players on the leaderboard
   */
  async getTotalPlayers(): Promise<number> {
    return await this.redisService.zCard(LEADERBOARD_KEY);
  }

  /**
   * Get users within a score range
   */
  async getUsersByScoreRange(minScore: number, maxScore: number): Promise<LeaderboardEntry[]> {
    const count = await this.redisService.zCount(LEADERBOARD_KEY, minScore, maxScore);

    if (count === 0) {
      return [];
    }

    // Note: This is a simplified implementation
    // A full implementation would need to use ZRANGEBYSCORE which may not be available
    console.warn('getUsersByScoreRange: Full implementation requires ZRANGEBYSCORE');
    return [];
  }

  /**
   * Increment a user's score atomically
   */
  async incrementScore(userId: string, increment: number): Promise<number> {
    // Increment score in sorted set
    const newScore = await this.redisService.zIncrBy(LEADERBOARD_KEY, userId, increment);

    // Update user hash
    const userData = await this.redisService.hGetAll(`${USER_PREFIX}${userId}`);

    if (userData) {
      await this.redisService.hSet(`${USER_PREFIX}${userId}`, 'score', newScore.toString());
      await this.redisService.hSet(`${USER_PREFIX}${userId}`, 'timestamp', Date.now().toString());
    }

    return newScore;
  }

  /**
   * Remove a user from the leaderboard (GDPR compliance)
   */
  async removeUser(userId: string): Promise<void> {
    // Remove from sorted set
    await this.redisService.zRem(LEADERBOARD_KEY, userId);

    // Remove user hash
    await this.redisService.del(`${USER_PREFIX}${userId}`);
  }

  /**
   * Clear the entire leaderboard (use with caution)
   */
  async clearLeaderboard(): Promise<void> {
    // This would require getting all user IDs first
    const totalPlayers = await this.getTotalPlayers();

    if (totalPlayers > 0) {
      const allUserIds = await this.redisService.zRange(LEADERBOARD_KEY, 0, -1, false);

      // Delete all user hashes
      for (const userId of allUserIds) {
        await this.redisService.del(`${USER_PREFIX}${userId}`);
      }

      // Delete the sorted set
      await this.redisService.del(LEADERBOARD_KEY);
    }
  }

  /**
   * Get leaderboard entries around a specific user
   * @param userId - User to center the leaderboard around
   * @param range - Number of users above and below (default 5)
   */
  async getLeaderboardAroundUser(userId: string, range: number = 5): Promise<LeaderboardEntry[]> {
    const rank = await this.redisService.zRank(LEADERBOARD_KEY, userId, true);

    if (rank === null) {
      return [];
    }

    const start = Math.max(0, rank - range);
    const stop = rank + range;

    const userIds = await this.redisService.zRange(LEADERBOARD_KEY, start, stop, true);

    const entries: LeaderboardEntry[] = [];
    for (const uid of userIds) {
      const userData = await this.redisService.hGetAll(`${USER_PREFIX}${uid}`);

      if (userData && userData.userId && userData.username && userData.score && userData.timestamp) {
        entries.push({
          userId: userData.userId,
          username: userData.username,
          score: parseInt(userData.score, 10),
          timestamp: parseInt(userData.timestamp, 10),
        });
      }
    }

    return entries;
  }

  /**
   * Batch update multiple scores (useful for migrations)
   */
  async batchUpdateScores(entries: Array<{ userId: string; username: string; score: number }>): Promise<void> {
    for (const entry of entries) {
      await this.updateScore({
        userId: entry.userId,
        username: entry.username,
        score: entry.score,
      });
    }
  }
}
