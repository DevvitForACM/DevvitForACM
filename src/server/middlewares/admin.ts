import { Request, Response, NextFunction } from 'express';
import { verifyServerJwt } from '../services/auth.service';
import { getAdminDatabase } from '../services/firebase-admin.service';

export interface UserPayload {
  uid: string;
  username: string;
}

export interface AdminRequest extends Request {
  user?: UserPayload | undefined;
}

/**
 * Admin authentication middleware that verifies user authentication tokens
 * and validates admin role privileges.
 * 
 * Requirements:
 * - 1.1: Verify user's admin role using Admin_Middleware
 * - 1.2: Return 403 Forbidden for non-admin users
 * - 1.3: Validate authentication token before checking admin privileges
 * - 1.4: Maintain consistent admin role verification across all admin endpoints
 */
export async function requireAdminAuth(req: AdminRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // Step 1: Validate authentication token (Requirement 1.3)
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      res.status(401).json({ 
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization header with Bearer token is required',
          details: 'Missing or invalid authorization header'
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }

    const token = auth.slice('Bearer '.length);
    const payload = await verifyServerJwt(token);
    
    if (!payload) {
      res.status(401).json({ 
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired authentication token',
          details: 'Token verification failed'
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }

    // Validate token payload structure
    if (typeof payload.uid !== 'string' || typeof payload.username !== 'string') {
      res.status(401).json({ 
        error: {
          code: 'INVALID_TOKEN_PAYLOAD',
          message: 'Invalid token payload structure',
          details: 'Token payload missing required fields'
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }

    // Step 2: Verify admin role (Requirements 1.1, 1.2, 1.4)
    try {
      const database = getAdminDatabase();
      const userRef = database.ref(`users/${payload.uid}`);
      const snapshot = await userRef.get();

      if (!snapshot.exists()) {
        res.status(403).json({ 
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found in system',
            details: 'User record does not exist in database'
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }

      const userData = snapshot.val();
      
      // Verify user has admin role (Requirement 1.1)
      if (!userData || userData.role !== 'admin') {
        // Return 403 Forbidden for non-admin users (Requirement 1.2)
        res.status(403).json({ 
          error: {
            code: 'INSUFFICIENT_PRIVILEGES',
            message: 'Admin privileges required to access this resource',
            details: 'User does not have admin role'
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }

      // Set user data for downstream handlers
      req.user = { uid: payload.uid, username: payload.username };
      
      // Continue to next middleware/handler
      next();

    } catch (dbError) {
      console.error('Admin middleware database error:', dbError);
      res.status(500).json({ 
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to verify admin privileges',
          details: 'Database operation failed during role verification'
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }

  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ 
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error during authentication',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString(),
      path: req.path
    });
    return;
  }
}