import { Request, Response } from 'express';
import { reddit } from '@devvit/web/server';
import { LeaderboardService } from '../services/leaderboard.service';
import {
  LeaderboardResponse,
  UpdateScoreRequest,
  UpdateScoreResponse
} from '../../shared/types/leaderboard';

export class LeaderboardController {
  static async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      console.log('📊 LEADERBOARD: Get leaderboard request received');

      const limit = parseInt(req.query.limit as string) || 10;
      const level = req.query.level as string;

      // Get current Reddit user for their rank
      const currentUsername = await reddit.getCurrentUsername();
      const userId = currentUsername ? `reddit:${currentUsername}` : null;

      console.log('👤 LEADERBOARD: Current user:', currentUsername);
      console.log('📊 LEADERBOARD: Fetching top', limit, 'entries for level:', level || 'all');

      const [entries, totalPlayers, userRank] = await Promise.all([
        LeaderboardService.getTopUsers(limit, level),
        LeaderboardService.getTotalPlayers(level),
        userId ? LeaderboardService.getUserRank(userId) : Promise.resolve(undefined)
      ]);

      console.log('✅ LEADERBOARD: Found', entries.length, 'entries, total players:', totalPlayers);

      const response: LeaderboardResponse = {
        type: 'leaderboard',
        entries,
        ...(userRank !== null && userRank !== undefined && { userRank }),
        totalPlayers,
        ...(currentUsername && { currentUser: currentUsername })
      };

      res.json(response);
    } catch (error) {
      console.error('❌ LEADERBOARD: Error fetching leaderboard:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch leaderboard'
      });
    }
  }

  static async updateScore(req: Request, res: Response): Promise<void> {
    try {
      console.log('📊 LEADERBOARD: Score update request received');

      // Get current Reddit user from Devvit context
      const currentUsername = await reddit.getCurrentUsername();
      console.log('👤 LEADERBOARD: Current Reddit user:', currentUsername);

      if (!currentUsername) {
        console.error('❌ LEADERBOARD: No authenticated user found');
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated'
        });
        return;
      }

      const { score, level, completionTime, coinsCollected } = req.body;
      console.log('📊 LEADERBOARD: Score data:', { score, level, completionTime, coinsCollected });

      if (typeof score !== 'number') {
        res.status(400).json({
          status: 'error',
          message: 'Score is required and must be a number'
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

      // Use Reddit username as both userId and username
      const userId = `reddit:${currentUsername}`;

      await LeaderboardService.updateScore({
        userId,
        username: currentUsername,
        score,
        level: level || 'default',
        completionTime: completionTime || 0,
        coinsCollected: coinsCollected || 0
      });

      const newRank = await LeaderboardService.getUserRank(userId);
      console.log('✅ LEADERBOARD: Score updated successfully, new rank:', newRank);

      const response: UpdateScoreResponse = {
        type: 'score-update',
        success: true,
        ...(newRank !== null && newRank !== undefined && { newRank }),
        message: 'Score updated successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('❌ LEADERBOARD: Error updating score:', error);
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