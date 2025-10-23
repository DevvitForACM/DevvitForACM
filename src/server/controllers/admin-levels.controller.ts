import { Request, Response } from 'express';
import { AdminLevelService, LevelFilters, BulkOperationResult } from '../services/admin-levels.service';
import { AdminRequest } from '../middlewares/admin';

const adminLevelService = new AdminLevelService();

export interface AdminLevelController {
  getLevelById(req: AdminRequest, res: Response): Promise<void>;
  getAllLevelsByUser(req: AdminRequest, res: Response): Promise<void>;
  getAllPublicLevels(req: AdminRequest, res: Response): Promise<void>;
  updateLevel(req: AdminRequest, res: Response): Promise<void>;
  deleteLevel(req: AdminRequest, res: Response): Promise<void>;
  bulkDeleteLevels(req: AdminRequest, res: Response): Promise<void>;
  bulkUpdateVisibility(req: AdminRequest, res: Response): Promise<void>;
  getLevelStatistics(req: AdminRequest, res: Response): Promise<void>;
}

/**
 * Get level by ID with admin privileges (bypasses privacy restrictions)
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
export const getLevelById = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Level ID is required',
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }

    const level = await adminLevelService.getLevelById(id);

    if (!level) {
      res.status(404).json({
        success: false,
        error: 'Level not found',
        details: `No level found with ID: ${id}`,
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }

    res.json({
      success: true,
      data: level,
      message: `Level retrieved successfully (${level.isPublic ? 'public' : 'private'})`
    });
  } catch (error) {
    console.error('Error in getLevelById:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve level',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
};

/**
 * Get all levels created by a specific user (including private levels for admin)
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export const getAllLevelsByUser = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'User ID is required',
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }

    const levels = await adminLevelService.getAllLevelsByUser(userId);

    res.json({
      success: true,
      data: levels,
      count: levels.length,
      userId,
      message: `Retrieved ${levels.length} levels for user ${userId}`
    });
  } catch (error) {
    console.error('Error in getAllLevelsByUser:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user levels',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
};

/**
 * Get all public levels with advanced filtering and sorting options
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export const getAllPublicLevels = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    // Parse query parameters for filtering and sorting
    const {
      difficulty,
      tags,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filters object
    const filters: LevelFilters = {
      sortBy: sortBy as LevelFilters['sortBy'],
      sortOrder: sortOrder as LevelFilters['sortOrder']
    };

    // Add difficulty filter if provided
    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty as string)) {
      filters.difficulty = difficulty as 'easy' | 'medium' | 'hard';
    }

    // Add tags filter if provided
    if (tags) {
      if (typeof tags === 'string') {
        filters.tags = tags.split(',').map(tag => tag.trim());
      } else if (Array.isArray(tags)) {
        filters.tags = tags.map(tag => String(tag).trim());
      }
    }

    // Add date range filters if provided
    if (dateFrom && typeof dateFrom === 'string') {
      filters.dateFrom = dateFrom;
    }
    if (dateTo && typeof dateTo === 'string') {
      filters.dateTo = dateTo;
    }

    const levels = await adminLevelService.getAllPublicLevels(filters);

    res.json({
      success: true,
      data: levels,
      count: levels.length,
      filters,
      message: `Retrieved ${levels.length} public levels with applied filters`
    });
  } catch (error) {
    console.error('Error in getAllPublicLevels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve public levels',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
};/**

 * Update any level with admin privileges (bypasses ownership restrictions)
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export const updateLevel = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Level ID is required',
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }

    if (!updates || Object.keys(updates).length === 0) {
      res.status(400).json({
        success: false,
        error: 'No update data provided',
        details: 'Request body must contain fields to update',
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }

    // Validate update data structure (partial validation)
    // Remove protected fields that should not be updated
    const { id: levelId, plays, likes, ...allowedUpdates } = updates;

    if (Object.keys(allowedUpdates).length === 0) {
      res.status(400).json({
        success: false,
        error: 'No valid fields to update',
        details: 'Protected fields (id, plays, likes) cannot be updated',
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }

    await adminLevelService.updateLevel(id, allowedUpdates);

    res.json({
      success: true,
      message: 'Level updated successfully',
      levelId: id,
      updatedFields: Object.keys(allowedUpdates),
      updatedBy: req.user?.username || 'unknown-admin'
    });
  } catch (error) {
    console.error('Error in updateLevel:', error);
    
    if (error instanceof Error && error.message === 'Level not found') {
      res.status(404).json({
        success: false,
        error: 'Level not found',
        details: `No level found with ID: ${req.params.id}`,
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update level',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
};

/**
 * Delete any level with admin privileges (bypasses ownership restrictions)
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export const deleteLevel = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Level ID is required',
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }

    await adminLevelService.deleteLevel(id);

    res.json({
      success: true,
      message: 'Level deleted successfully',
      levelId: id,
      deletedBy: req.user?.username || 'unknown-admin'
    });
  } catch (error) {
    console.error('Error in deleteLevel:', error);
    
    if (error instanceof Error && error.message === 'Level not found') {
      res.status(404).json({
        success: false,
        error: 'Level not found',
        details: `No level found with ID: ${req.params.id}`,
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete level',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
};/**

 * Delete multiple levels in a single operation with transaction support
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export const bulkDeleteLevels = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
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

    const result: BulkOperationResult = await adminLevelService.bulkDeleteLevels(levelIds);

    res.json({
      success: true,
      message: `Bulk delete operation completed`,
      data: result,
      summary: {
        totalRequested: levelIds.length,
        successful: result.successful.length,
        failed: result.failed.length
      },
      deletedBy: req.user?.username || 'unknown-admin'
    });
  } catch (error) {
    console.error('Error in bulkDeleteLevels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk delete operation',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
};

/**
 * Update visibility (public/private) for multiple levels
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export const bulkUpdateVisibility = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
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

    const result: BulkOperationResult = await adminLevelService.bulkUpdateVisibility(levelIds, isPublic);

    res.json({
      success: true,
      message: `Bulk visibility update operation completed`,
      data: result,
      summary: {
        totalRequested: levelIds.length,
        successful: result.successful.length,
        failed: result.failed.length,
        newVisibility: isPublic ? 'public' : 'private'
      },
      updatedBy: req.user?.username || 'unknown-admin'
    });
  } catch (error) {
    console.error('Error in bulkUpdateVisibility:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk visibility update operation',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
};

/**
 * Get comprehensive level statistics with aggregation logic
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
export const getLevelStatistics = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    // Parse query parameters for date range filtering
    const { dateFrom, dateTo } = req.query;

    let dateRange: { from?: string; to?: string } | undefined;

    if (dateFrom || dateTo) {
      dateRange = {};
      
      if (dateFrom && typeof dateFrom === 'string') {
        // Validate date format
        const fromDate = new Date(dateFrom);
        if (isNaN(fromDate.getTime())) {
          res.status(400).json({
            success: false,
            error: 'Invalid dateFrom format',
            details: 'dateFrom must be a valid ISO date string',
            timestamp: new Date().toISOString(),
            path: req.path
          });
          return;
        }
        dateRange.from = dateFrom;
      }

      if (dateTo && typeof dateTo === 'string') {
        // Validate date format
        const toDate = new Date(dateTo);
        if (isNaN(toDate.getTime())) {
          res.status(400).json({
            success: false,
            error: 'Invalid dateTo format',
            details: 'dateTo must be a valid ISO date string',
            timestamp: new Date().toISOString(),
            path: req.path
          });
          return;
        }
        dateRange.to = dateTo;
      }
    }

    const statistics = await adminLevelService.getLevelStatistics(dateRange);

    res.json({
      success: true,
      data: statistics,
      dateRange,
      message: 'Level statistics retrieved successfully',
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in getLevelStatistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve level statistics',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
};