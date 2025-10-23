import { Request, Response } from 'express';
import { AdminFirebaseService } from '../services/admin-firebase.service';

const adminService = new AdminFirebaseService();

export interface DeleteUserRequest {
  reason: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

/**
 * Get all users
 */
export const getAllUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await adminService.getAllUsers();
    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve users'
    });
  }
};

/**
 * Get user by Firebase UID
 */
export const getUserByUsername = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params; // This is actually the Firebase UID (e.g., reddit:12345)
    
    if (!username) {
      res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
      return;
    }

    const user = await adminService.getUserByUsername(username);
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve user'
    });
  }
};

/**
 * Delete user
 */
export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { username } = req.params; // This is actually the Firebase UID (e.g., reddit:12345)
    const { reason } = req.body as DeleteUserRequest;
    
    if (!username) {
      res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
      return;
    }

    if (!reason || reason.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Deletion reason is required'
      });
      return;
    }

    // Get the admin username from the authenticated request
    const deletedBy = req.user?.username || 'unknown-admin';

    await adminService.deleteUser(username, deletedBy, reason.trim());

    res.json({
      success: true,
      message: `User has been deleted successfully`,
      deletedBy,
      reason: reason.trim()
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user'
    });
  }
};

/**
 * Update user role
 */
export const updateUserRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { username } = req.params; // This is actually the Firebase UID (e.g., reddit:12345)
    const { role } = req.body;
    
    if (!username) {
      res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
      return;
    }

    if (!role || !['admin', 'user'].includes(role)) {
      res.status(400).json({
        success: false,
        error: 'Valid role (admin or user) is required'
      });
      return;
    }

    const updatedUser = await adminService.updateUserRole(username, role);

    res.json({
      success: true,
      message: `User role updated successfully`,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user role'
    });
  }
};