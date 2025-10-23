
import { Router } from 'express';
import { LevelController } from '../controllers/levels.controller';
import { requireAuth } from '../middlewares/auth';

const router = Router();


router.get('/public', LevelController.getAllPublicLevels);
router.get('/user/:userId', LevelController.getAllLevelsByUser);
router.get('/:id', LevelController.getLevelByID);


router.post('/create', requireAuth, LevelController.createLevel);
router.patch('/:id', requireAuth, LevelController.updateLevel);
router.delete('/:id', requireAuth, LevelController.deleteLevel);

export default router;
