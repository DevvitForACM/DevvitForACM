import { Router, Request, Response, NextFunction } from 'express';
import { requireAdminAuth } from '../middlewares/admin';
import {
    getLevelById,
    getAllLevelsByUser,
    getAllPublicLevels,
    updateLevel,
    deleteLevel,
    bulkDeleteLevels,
    bulkUpdateVisibility,
    getLevelStatistics
} from '../controllers/admin-levels.controller';

const router = Router();

// Parameter validation middleware for level ID
const validateLevelId = (req: Request, res: Response, next: NextFunction): void => {
    const { id } = req.params;

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
        res.status(400).json({
            success: false,
            error: 'Valid level ID is required',
            details: 'Level ID parameter must be a non-empty string',
            timestamp: new Date().toISOString(),
            path: req.path
        });
        return;
    }

    next();
};

// Parameter validation middleware for user ID
const validateUserId = (req: Request, res: Response, next: NextFunction): void => {
    const { userId } = req.params;

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        res.status(400).json({
            success: false,
            error: 'Valid user ID is required',
            details: 'User ID parameter must be a non-empty string',
            timestamp: new Date().toISOString(),
            path: req.path
        });
        return;
    }

    next();
};

// Request body validation middleware for bulk operations
const validateBulkDeleteRequest = (req: Request, res: Response, next: NextFunction): void => {
    const { levelIds } = req.body;

    if (!levelIds || !Array.isArray(levelIds)) {
        res.status(400).json({
            success: false,
            error: 'Level IDs array is required',
            details: 'Request body must contain a levelIds array',
            timestamp: new Date().toISOString(),
            path: req.path
        });
        return;
    }

    if (levelIds.length === 0) {
        res.status(400).json({
            success: false,
            error: 'At least one level ID is required',
            details: 'levelIds array cannot be empty',
            timestamp: new Date().toISOString(),
            path: req.path
        });
        return;
    }

    // Validate that all items are strings
    const invalidIds = levelIds.filter(id => typeof id !== 'string' || id.trim().length === 0);
    if (invalidIds.length > 0) {
        res.status(400).json({
            success: false,
            error: 'Invalid level IDs provided',
            details: 'All level IDs must be non-empty strings',
            timestamp: new Date().toISOString(),
            path: req.path
        });
        return;
    }

    next();
};

const validateBulkVisibilityRequest = (req: Request, res: Response, next: NextFunction): void => {
    const { levelIds, isPublic } = req.body;

    if (!levelIds || !Array.isArray(levelIds)) {
        res.status(400).json({
            success: false,
            error: 'Level IDs array is required',
            details: 'Request body must contain a levelIds array',
            timestamp: new Date().toISOString(),
            path: req.path
        });
        return;
    }

    if (typeof isPublic !== 'boolean') {
        res.status(400).json({
            success: false,
            error: 'isPublic boolean value is required',
            details: 'Request body must contain isPublic as true or false',
            timestamp: new Date().toISOString(),
            path: req.path
        });
        return;
    }

    if (levelIds.length === 0) {
        res.status(400).json({
            success: false,
            error: 'At least one level ID is required',
            details: 'levelIds array cannot be empty',
            timestamp: new Date().toISOString(),
            path: req.path
        });
        return;
    }

    // Validate that all items are strings
    const invalidIds = levelIds.filter(id => typeof id !== 'string' || id.trim().length === 0);
    if (invalidIds.length > 0) {
        res.status(400).json({
            success: false,
            error: 'Invalid level IDs provided',
            details: 'All level IDs must be non-empty strings',
            timestamp: new Date().toISOString(),
            path: req.path
        });
        return;
    }

    next();
};

// Apply admin authentication middleware to all routes in this router
router.use(requireAdminAuth);

// Static routes must come before parameterized routes to avoid conflicts
// GET route for level statistics with query parameter support
router.get('/statistics', getLevelStatistics);

// GET route for all public levels
router.get('/public', getAllPublicLevels);

// POST routes for bulk operations
router.post('/bulk-delete', validateBulkDeleteRequest, bulkDeleteLevels);
router.post('/bulk-visibility', validateBulkVisibilityRequest, bulkUpdateVisibility);

// Parameterized routes (must come after static routes)
// GET routes for level retrieval (by ID, by user)
router.get('/user/:userId', validateUserId, getAllLevelsByUser);
router.get('/:id', validateLevelId, getLevelById);

// PATCH route for level updates with parameter validation
router.patch('/:id', validateLevelId, updateLevel);

// DELETE route for single level deletion
router.delete('/:id', validateLevelId, deleteLevel);

export default router;