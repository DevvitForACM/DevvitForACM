import { Router } from 'express';
import { reddit, redis } from '@devvit/web/server';

const router = Router();

/**
 * GET /api/auth/me - Check current authentication status
 */
router.get('/me', async (_req, res) => {
  try {
    // Get current Reddit user from Devvit context
    const currentUsername = await reddit.getCurrentUsername();
    
    if (!currentUsername) {
      return res.json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    // Create user ID and check if profile exists in Redis
    const uid = `reddit:${currentUsername}`;
    
    let userProfile;
    try {
      // Try to get existing profile from Redis
      const profileData = await redis.hGetAll(`user:${uid}`);
      
      if (profileData && Object.keys(profileData).length > 0) {
        // Profile exists, update it
        userProfile = {
          username: profileData.username || currentUsername,
          uid,
          avatar: profileData.avatar || '',
          createdAt: profileData.createdAt || new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        
        // Update last login time
        await redis.hSet(`user:${uid}`, { lastLogin: userProfile.lastLogin });
      } else {
        // Create new profile
        userProfile = {
          username: currentUsername,
          uid,
          avatar: '',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        
        // Store new profile in Redis
        await redis.hSet(`user:${uid}`, userProfile);
      }
    } catch (error) {
      console.warn('⚠️  AUTH: Error accessing Redis, creating temporary profile:', error);
      // Fallback to temporary profile if Redis fails
      userProfile = {
        username: currentUsername,
        uid,
        avatar: '',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
    }

    return res.json({
      success: true,
      user: userProfile,
      message: 'User authenticated'
    });

  } catch (error) {
    console.error('❌ AUTH: Error checking authentication:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication check failed'
    });
  }
});

/**
 * POST /api/auth/login - Authenticate user (in Devvit, user is already authenticated)
 */
router.post('/login', async (_req, res) => {
  try {
    // In Devvit, the user is already authenticated through Reddit
    // We just need to create/update their profile
    const currentUsername = await reddit.getCurrentUsername();
    
    if (!currentUsername) {
      console.error('❌ AUTH: No Reddit user found in Devvit context');
      return res.status(401).json({
        success: false,
        message: 'Reddit authentication required'
      });
    }
    
    // Create user ID and profile
    const uid = `reddit:${currentUsername}`;
    const userProfile = {
      username: currentUsername,
      uid,
      avatar: '', // Could fetch from Reddit API if needed
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    // Store/update profile in Redis
    await redis.hSet(`user:${uid}`, userProfile);

    return res.json({
      success: true,
      user: userProfile,
      message: 'Authentication successful'
    });

  } catch (error) {
    console.error('❌ AUTH: Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

/**
 * POST /api/auth/logout - Logout user
 */
router.post('/logout', async (_req, res) => {
  try {
    const currentUsername = await reddit.getCurrentUsername();
    if (currentUsername) {
      const uid = `reddit:${currentUsername}`;
      // Update last logout time
      await redis.hSet(`user:${uid}`, { lastLogout: new Date().toISOString() });
    }

    return res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('❌ AUTH: Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

/**
 * GET /api/auth/profile/:username - Get user profile
 */
router.get('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const uid = `reddit:${username}`;
    const profileData = await redis.hGetAll(`user:${uid}`);
    
    if (!profileData || Object.keys(profileData).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    return res.json({
      success: true,
      profile: profileData
    });

  } catch (error) {
    console.error('❌ AUTH: Error getting profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

export default router;