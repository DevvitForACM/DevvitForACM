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
    
    if (currentScore === null || score > currentScore) {
      // Add/update score in sorted set
      await redis.zAdd(LEADERBOARD_KEY, { member: userId, score });
    }
    
    // Store username in a separate hash for quick lookup
    await redis.hSet(USER_HASH_KEY, { [userId]: username });
    
    return entry;
  }

  static async getTopUsers(limit: number = 10): Promise<LeaderboardEntry[]> {
    // Get top scores in descending order with scores
    const results = await redis.zRange(LEADERBOARD_KEY, 0, limit - 1, { 
      reverse: true, 
      withScores: true 
    });
    
    if (results.length === 0) {
      return [];
    }

    const entries: LeaderboardEntry[] = [];
    
    // Get all usernames in one call for efficiency
    const userIds = results.map(r => r.member);
    const usernames = await redis.hMGet(USER_HASH_KEY, userIds);
    
    for (let i = 0; i < results.length; i++) {
      const userId = results[i].member;
      const score = results[i].score;
      const username = usernames[i] || 'Unknown';
      
      entries.push(LeaderboardModel.createEntry(userId, username, score));
    }

    return entries;
  }

  static async getUserRank(userId: string): Promise<number | null> {
    // Get 0-based rank (0 = highest score) in reverse order
    const rank = await redis.zRank(userId, LEADERBOARD_KEY, { reverse: true });
    
    if (rank === null) {
      return null;
    }

    // Convert to 1-based rank
    return rank + 1;
  }

  static async getTotalPlayers(): Promise<number> {
    // Get total count of players in leaderboard
    return await redis.zCard(LEADERBOARD_KEY);
  }

  static async getUserScore(userId: string): Promise<number | null> {
    const score = await redis.zScore(userId, LEADERBOARD_KEY);
    return score;
  }

  static async removeUser(userId: string): Promise<void> {
    await redis.zRem(LEADERBOARD_KEY, [userId]);
    await redis.hDel(USER_HASH_KEY, [userId]);
  }

  // Note: For real-time updates in Devvit, you'd typically use the UI state management
  // or implement polling from the client side since Redis doesn't have built-in listeners
}