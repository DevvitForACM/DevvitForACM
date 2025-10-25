import { Request, Response } from 'express';
import { LeaderboardService } from '../services/leaderboard.service';
import { 
  LeaderboardResponse, 
  UpdateScoreRequest, 
  UpdateScoreResponse 
} from '../../shared/types/leaderboard';

export class LeaderboardController {
  static async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const userId = req.query.userId as string;

      const [entries, totalPlayers, userRank] = await Promise.all([
        LeaderboardService.getTopUsers(limit),
        LeaderboardService.getTotalPlayers(),
        userId ? LeaderboardService.getUserRank(userId) : Promise.resolve(undefined)
      ]);

      const response: LeaderboardResponse = {
        type: 'leaderboard',
        entries,
        ...(userRank !== null && userRank !== undefined && { userRank }),
        totalPlayers
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch leaderboard'
      });
    }
  }

  static async updateScore(req: Request, res: Response): Promise<void> {
    try {
      const { userId, username, score } = req.body as UpdateScoreRequest;

      if (!userId || !username || typeof score !== 'number') {
        res.status(400).json({
          status: 'error',
          message: 'Missing required fields: userId, username, score'
        });
        return;
      }

      if (score < 0) {
        res.status(400).json({
          status: 'error',
          message: 'Score must be non-negative'
        });
        return;
      }

      await LeaderboardService.updateScore({ userId, username, score });
      const newRank = await LeaderboardService.getUserRank(userId);

      const response: UpdateScoreResponse = {
        type: 'score-update',
        success: true,
        ...(newRank !== null && newRank !== undefined && { newRank }),
        message: 'Score updated successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Error updating score:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update score'
      });
    }
  }

  static async getUserRank(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          status: 'error',
          message: 'User ID is required'
        });
        return;
      }

      const rank = await LeaderboardService.getUserRank(userId);

      if (rank === null) {
        res.status(404).json({
          status: 'error',
          message: 'User not found in leaderboard'
        });
        return;
      }

      res.json({
        userId,
        rank,
        type: 'user-rank'
      });
    } catch (error) {
      console.error('Error fetching user rank:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch user rank'
      });
    }
  }
}