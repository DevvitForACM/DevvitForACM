import { LeaderboardEntry, UpdateScoreRequest } from '../../shared/types/leaderboard';
import { LeaderboardModel } from '../models/leaderboard';
import { redis } from '@devvit/web/server';

// Using simple key-value storage for Devvit Redis compatibility
const LEADERBOARD_PREFIX = 'leaderboard:user:';
const LEADERBOARD_DATA_KEY = 'leaderboard:data';

export class LeaderboardService {
  static async updateScore(request: UpdateScoreRequest): Promise<LeaderboardEntry> {
    const { userId, username, score } = request;

    const entry = LeaderboardModel.createEntry(userId, username, score);

    if (!LeaderboardModel.validateEntry(entry)) {
      throw new Error('Invalid leaderboard entry data');
    }

    // Store user score
    const userKey = `${LEADERBOARD_PREFIX}${userId}`;
    const currentScoreStr = await redis.get(userKey);
    const currentScore = currentScoreStr ? parseFloat(currentScoreStr) : null;

    if (currentScore === null || score > currentScore) {
      // Update user's best score
      await redis.set(userKey, score.toString());

      // Store user data as individual key
      const userDataKey = `${LEADERBOARD_DATA_KEY}:${userId}`;
      const userData = JSON.stringify({
        userId,
        username,
        score,
        timestamp: entry.timestamp
      });
      await redis.set(userDataKey, userData);

      // Add user to the list if not already there
      await this.addUserToList(userId);
    }

    return entry;
  }

  static async getTopUsers(limit: number = 10): Promise<LeaderboardEntry[]> {
    // Since we can't use KEYS in Devvit, we'll maintain a list of user IDs
    const userListKey = 'leaderboard:userlist';
    const userIds = await redis.get(userListKey);

    if (!userIds) {
      return [];
    }

    const entries: LeaderboardEntry[] = [];
    const userIdList = JSON.parse(userIds) as string[];

    // Get data for each user
    for (const userId of userIdList) {
      const userDataKey = `${LEADERBOARD_DATA_KEY}:${userId}`;
      const dataStr = await redis.get(userDataKey);

      if (dataStr) {
        try {
          const entry = JSON.parse(dataStr) as LeaderboardEntry;
          entries.push(entry);
        } catch (error) {
          console.error(`Error parsing leaderboard entry for user ${userId}:`, error);
        }
      }
    }

    // Sort by score (highest first) and limit results
    return entries
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  static async getUserRank(userId: string): Promise<number | null> {
    const topUsers = await this.getTopUsers(1000); // Get more users to find rank
    const userIndex = topUsers.findIndex(entry => entry.userId === userId);

    return userIndex === -1 ? null : userIndex + 1;
  }

  static async getTotalPlayers(): Promise<number> {
    const userListKey = 'leaderboard:userlist';
    const userIds = await redis.get(userListKey);

    if (!userIds) {
      return 0;
    }

    try {
      const userIdList = JSON.parse(userIds) as string[];
      return userIdList.length;
    } catch {
      return 0;
    }
  }

  static async getUserScore(userId: string): Promise<number | null> {
    const userKey = `${LEADERBOARD_PREFIX}${userId}`;
    const scoreStr = await redis.get(userKey);
    return scoreStr ? parseFloat(scoreStr) : null;
  }

  static async removeUser(userId: string): Promise<void> {
    const userKey = `${LEADERBOARD_PREFIX}${userId}`;
    const userDataKey = `${LEADERBOARD_DATA_KEY}:${userId}`;
    const userListKey = 'leaderboard:userlist';

    // Remove user data
    await redis.del(userKey);
    await redis.del(userDataKey);

    // Remove from user list
    const userIds = await redis.get(userListKey);
    if (userIds) {
      try {
        const userIdList = JSON.parse(userIds) as string[];
        const updatedList = userIdList.filter(id => id !== userId);
        await redis.set(userListKey, JSON.stringify(updatedList));
      } catch (error) {
        console.error('Error updating user list:', error);
      }
    }
  }

  // Helper method to add user to the list (called internally)
  static async addUserToList(userId: string): Promise<void> {
    const userListKey = 'leaderboard:userlist';
    const userIds = await redis.get(userListKey);

    let userIdList: string[] = [];
    if (userIds) {
      try {
        userIdList = JSON.parse(userIds) as string[];
      } catch {
        userIdList = [];
      }
    }

    if (!userIdList.includes(userId)) {
      userIdList.push(userId);
      await redis.set(userListKey, JSON.stringify(userIdList));
    }
  }

  // Helper method to get user data
  static async getUserData(userId: string): Promise<LeaderboardEntry | null> {
    const userDataKey = `${LEADERBOARD_DATA_KEY}:${userId}`;
    const dataStr = await redis.get(userDataKey);

    if (!dataStr) {
      return null;
    }

    try {
      return JSON.parse(dataStr) as LeaderboardEntry;
    } catch (error) {
      console.error(`Error parsing user data for ${userId}:`, error);
      return null;
    }
  }
}