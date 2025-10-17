import { LeaderboardEntry } from '../../shared/types/leaderboard';

export class LeaderboardModel {
  private static readonly LEADERBOARD_PATH = 'leaderboard';
  
  static createEntry(userId: string, username: string, score: number): LeaderboardEntry {
    return {
      userId,
      username,
      score,
      timestamp: Date.now()
    };
  }

  static validateEntry(entry: Partial<LeaderboardEntry>): boolean {
    return !!(
      entry.userId &&
      entry.username &&
      typeof entry.score === 'number' &&
      entry.score >= 0
    );
  }

  static getUserPath(userId: string): string {
    return `${this.LEADERBOARD_PATH}/${userId}`;
  }

  static getLeaderboardPath(): string {
    return this.LEADERBOARD_PATH;
  }
}