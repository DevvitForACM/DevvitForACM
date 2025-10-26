import { LeaderboardEntry, UpdateScoreRequest } from '../../shared/types/leaderboard';
import { LeaderboardModel } from '../models/leaderboard';
import { redis } from './redis.service';

const LEADERBOARD_KEY = 'leaderboard:scores';
const USER_HASH_KEY = 'leaderboard:users';

export class LeaderboardService {
  static async updateScore(request: UpdateScoreRequest & { 
    level?: string; 
    completionTime?: number; 
    coinsCollected?: number; 
  }): Promise<LeaderboardEntry> {
    const { userId, username, score, level, completionTime, coinsCollected } = request;
    
    console.log('📊 LEADERBOARD SERVICE: Updating score for user:', username, 'score:', score);

    const entry = LeaderboardModel.createEntry(userId, username, score);

    if (!LeaderboardModel.validateEntry(entry)) {
      throw new Error('Invalid leaderboard entry data');
    }

    // Use level-specific leaderboard if provided
    const leaderboardKey = level ? `${LEADERBOARD_KEY}:${level}` : LEADERBOARD_KEY;
    const userHashKey = level ? `${USER_HASH_KEY}:${level}` : USER_HASH_KEY;

    // Check current score first since Devvit Redis doesn't support GT flag
    const currentScore = await redis.zScore(userId, leaderboardKey);
    console.log('📊 LEADERBOARD SERVICE: Current score:', currentScore, 'New score:', score);

    if (currentScore === null || score > (currentScore || 0)) {
      // Add/update score in sorted set
      await redis.zAdd(leaderboardKey, userId, score);
      console.log('✅ LEADERBOARD SERVICE: Score updated in Redis');
      
      // Store additional user data in hash
      const userData = {
        username,
        level: level || 'default',
        completionTime: completionTime?.toString() || '0',
        coinsCollected: coinsCollected?.toString() || '0',
        lastUpdated: new Date().toISOString()
      };
      
      await redis.hSet(userHashKey, userId, JSON.stringify(userData));
      console.log('✅ LEADERBOARD SERVICE: User data stored in Redis');
    } else {
      console.log('ℹ️  LEADERBOARD SERVICE: Score not updated (not higher than current)');
    }

    return entry;
  }

  static async getTopUsers(limit: number = 10, level?: string): Promise<LeaderboardEntry[]> {
    console.log('📊 LEADERBOARD SERVICE: Getting top users, limit:', limit, 'level:', level);
    
    // Use level-specific leaderboard if provided
    const leaderboardKey = level ? `${LEADERBOARD_KEY}:${level}` : LEADERBOARD_KEY;
    const userHashKey = level ? `${USER_HASH_KEY}:${level}` : USER_HASH_KEY;
    
    // Get top scores in descending order
    const results = await redis.zRange(leaderboardKey, -limit, -1);
    console.log('📊 LEADERBOARD SERVICE: Found', results.length, 'users in Redis');

    if (results.length === 0) {
      return [];
    }

    const entries: LeaderboardEntry[] = [];

    // Get scores and usernames for each user (reverse order for highest first)
    for (let i = results.length - 1; i >= 0; i--) {
      const userId = results[i];
      if (userId) {
        const score = await redis.zScore(userId, leaderboardKey) || 0;
        
        // Try to get user data from hash
        let username = 'Unknown';
        try {
          const userData = await redis.hGet(userHashKey, userId);
          if (userData) {
            const parsed = JSON.parse(userData);
            username = parsed.username || 'Unknown';
          }
        } catch (error) {
          console.warn('⚠️  Could not parse user data for:', userId);
        }

        entries.push(LeaderboardModel.createEntry(userId, username, score));
      }
    }

    console.log('✅ LEADERBOARD SERVICE: Returning', entries.length, 'entries');
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

  static async getTotalPlayers(level?: string): Promise<number> {
    // Get total count of players in leaderboard
    const leaderboardKey = level ? `${LEADERBOARD_KEY}:${level}` : LEADERBOARD_KEY;
    return await redis.zCard(leaderboardKey);
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