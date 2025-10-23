import { Router, Request, Response, NextFunction } from 'express';
import { requireAdminAuth } from '../middlewares/admin';
import { 
  getAllUsers, 
  getUserByUsername, 
  deleteUser, 
  updateUserRole 
} from '../controllers/admin.controller';

const router = Router();

// Route parameter validation middleware
const validateUsername = (req: Request, res: Response, next: NextFunction): void => {
  const { username } = req.params;
  
  if (username && (username.length < 1 || username.length > 50)) {
    res.status(400).json({
      error: {
        code: 'INVALID_USERNAME',
        message: 'Username must be between 1 and 50 characters',
        details: 'Username parameter validation failed'
      },
      timestamp: new Date().toISOString(),
      path: req.path
    });
    return;
  }
  
  next();
};

// Apply admin authentication middleware to all routes in this router
router.use(requireAdminAuth);

// User management routes with parameter validation
router.get('/users', getAllUsers);
router.get('/users/:username', validateUsername, getUserByUsername);
router.delete('/users/:username', validateUsername, deleteUser);
router.put('/users/:username/role', validateUsername, updateUserRole);

export default router;