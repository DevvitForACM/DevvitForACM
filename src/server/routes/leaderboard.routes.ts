import { Router } from 'express';
import { LeaderboardController } from '../controllers/leaderboard.controller';

const router = Router();

router.get('/', LeaderboardController.getLeaderboard);
router.post('/score', LeaderboardController.updateScore);
router.get('/rank/:userId', LeaderboardController.getUserRank);

export default router;