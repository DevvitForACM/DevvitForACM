import { LeaderboardEntry, UpdateScoreRequest } from '../../shared/types/leaderboard';
import { LeaderboardModel } from '../models/leaderboard';
import { FirebaseService } from './firebase.service';

export class LeaderboardService {
  private static firebaseService = new FirebaseService();
  static async updateScore(request: UpdateScoreRequest): Promise<LeaderboardEntry> {
    const { userId, username, score } = request;
    
    const entry = LeaderboardModel.createEntry(userId, username, score);
    
    if (!LeaderboardModel.validateEntry(entry)) {
      throw new Error('Invalid leaderboard entry data');
    }

    const userPath = LeaderboardModel.getUserPath(userId);
    await this.firebaseService.set(userPath, entry);
    
    return entry;
  }

  static async getTopUsers(limit: number = 10): Promise<LeaderboardEntry[]> {
    const leaderboardPath = LeaderboardModel.getLeaderboardPath();
    
    const snapshot = await this.firebaseService.query(
      leaderboardPath,
      {
        orderBy: 'score',
        limitToLast: limit
      }
    );

    if (!snapshot.exists()) {
      return [];
    }

    const entries: LeaderboardEntry[] = [];
    snapshot.forEach((child) => {
      const data = child.val() as LeaderboardEntry;
      entries.unshift(data); // Reverse order for descending scores
    });

    return entries;
  }

  static async getUserRank(userId: string): Promise<number | null> {
    const userPath = LeaderboardModel.getUserPath(userId);
    const userSnapshot = await this.firebaseService.get(userPath);
    
    if (!userSnapshot.exists()) {
      return null;
    }

    const userScore = userSnapshot.val().score;
    const leaderboardPath = LeaderboardModel.getLeaderboardPath();
    
    const higherScoresSnapshot = await this.firebaseService.query(
      leaderboardPath,
      {
        orderBy: 'score',
        startAt: userScore + 1
      }
    );

    let rank = 1;
    if (higherScoresSnapshot.exists()) {
      higherScoresSnapshot.forEach(() => {
        rank++;
      });
    }

    return rank;
  }

  static async getTotalPlayers(): Promise<number> {
    const leaderboardPath = LeaderboardModel.getLeaderboardPath();
    const snapshot = await this.firebaseService.get(leaderboardPath);
    
    if (!snapshot.exists()) {
      return 0;
    }

    return Object.keys(snapshot.val()).length;
  }

  static setupRealtimeListener(
    callback: (entries: LeaderboardEntry[]) => void,
    limit: number = 10
  ): () => void {
    const leaderboardPath = LeaderboardModel.getLeaderboardPath();
    
    return this.firebaseService.onValue(
      leaderboardPath,
      {
        orderBy: 'score',
        limitToLast: limit
      },
      (snapshot) => {
        const entries: LeaderboardEntry[] = [];
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const data = child.val() as LeaderboardEntry;
            entries.unshift(data); // Reverse for descending order
          });
        }
        callback(entries);
      }
    );
  }
}