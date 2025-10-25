import { LeaderboardEntry, UpdateScoreRequest } from '../../shared/types/leaderboard';
import { LeaderboardModel } from '../models/leaderboard';
import { redis } from './redis.service';

const LEADERBOARD_KEY = 'leaderboard:scores';
const USER_HASH_KEY = 'leaderboard:users';

export class LeaderboardService {
  static async updateScore(request: UpdateScoreRequest): Promise<LeaderboardEntry> {
    const { userId, username, score } = request;

    const entry = LeaderboardModel.createEntry(userId, username, score);

    if (!LeaderboardModel.validateEntry(entry)) {
      throw new Error('Invalid leaderboard entry data');
    }

    // Use Redis Sorted Set to store scores (higher scores = higher rank)
    // Check current score first since Devvit Redis doesn't support GT flag
    const currentScore = await redis.zScore(userId, LEADERBOARD_KEY);

    if (currentScore === null || score > (currentScore || 0)) {
      // Add/update score in sorted set
      await redis.zAdd(LEADERBOARD_KEY, userId, score);
    }

    // Store username in a separate hash for quick lookup
    await redis.hSet(USER_HASH_KEY, userId, username);

    return entry;
  }

  static async getTopUsers(limit: number = 10): Promise<LeaderboardEntry[]> {
    // Get top scores in descending order
    const results = await redis.zRange(LEADERBOARD_KEY, -limit, -1);

    if (results.length === 0) {
      return [];
    }

    const entries: LeaderboardEntry[] = [];

    // Get scores and usernames for each user (reverse order for highest first)
    for (let i = results.length - 1; i >= 0; i--) {
      const userId = results[i];
      if (userId) {
        const score = await redis.zScore(userId, LEADERBOARD_KEY) || 0;
        const username = await redis.hGet(USER_HASH_KEY, userId) || 'Unknown';

        entries.push(LeaderboardModel.createEntry(userId, username, score));
      }
    }

    return entries;
  }

  static async getUserRank(userId: string): Promise<number | null> {
    // Get user's rank by getting all users and finding position
    const allUsers = await redis.zRange(LEADERBOARD_KEY, 0, -1);
    const userIndex = allUsers.indexOf(userId);

    if (userIndex === -1) {
      return null;
    }

    // Convert to 1-based rank (highest score = rank 1)
    return allUsers.length - userIndex;
  }

  static async getTotalPlayers(): Promise<number> {
    // Get total count of players in leaderboard
    return await redis.zCard(LEADERBOARD_KEY);
  }

  static async getUserScore(userId: string): Promise<number | null> {
    const score = await redis.zScore(userId, LEADERBOARD_KEY);
    return score || null;
  }

  static async removeUser(userId: string): Promise<void> {
    await redis.zRem(LEADERBOARD_KEY, userId);
    await redis.hDel(USER_HASH_KEY, userId);
  }

  // Note: For real-time updates in Devvit, you'd typically use the UI state management
  // or implement polling from the client side since Redis doesn't have built-in listeners
}