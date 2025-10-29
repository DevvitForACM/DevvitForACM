import { Router } from 'express';
import { reddit, redis } from '@devvit/web/server';

const router = Router();

// Middleware to log all auth route access
router.use((req, _res, next) => {
  console.log(`🔐 AUTH ROUTES: ${req.method} ${req.path} accessed`);
  console.log(`🔐 AUTH ROUTES: Full URL: ${req.originalUrl}`);
  next(); 
});

/**
 * GET /api/auth/me - Check current authentication status
 */
router.get('/me', async (_req, res) => {
  try {
    console.log('🔐 AUTH: Checking current user authentication...');
    
    // Get current Reddit user from Devvit context
    const currentUsername = await reddit.getCurrentUsername();
    
    if (!currentUsername) {
      console.log('ℹ️  AUTH: No authenticated user found');
      return res.json({
        success: false,
        message: 'Not authenticated'
      });
    }

    console.log('👤 AUTH: Found authenticated user:', currentUsername);
    
    // Create user ID and check if profile exists in Redis
    const uid = `reddit:${currentUsername}`;
    
    let userProfile;
    try {
      // Try to get existing profile from Redis
      console.log('📋 AUTH: Checking for existing profile in Redis...');
      const profileData = await redis.hGetAll(`user:${uid}`);
      
      if (profileData && Object.keys(profileData).length > 0) {
        // Profile exists, update it
        console.log('📋 AUTH: Loading existing profile from Redis...');
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
        console.log('📋 AUTH: Creating new user profile...');
        userProfile = {
          username: currentUsername,
          uid,
          avatar: '',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        
        // Store new profile in Redis
        await redis.hSet(`user:${uid}`, userProfile);
        console.log('✅ AUTH: New user profile created and stored in Redis');
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
    console.log('🔐 AUTH: Login request received...');
    
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

    console.log('👤 AUTH: Authenticating user:', currentUsername);
    
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
    console.log('✅ AUTH: User profile stored in Redis');

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
    console.log('🔐 AUTH: Logout request received...');
    
    const currentUsername = await reddit.getCurrentUsername();
    if (currentUsername) {
      const uid = `reddit:${currentUsername}`;
      // Update last logout time
      await redis.hSet(`user:${uid}`, { lastLogout: new Date().toISOString() });
      console.log('✅ AUTH: User logged out:', currentUsername);
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
    console.log('📋 AUTH: Getting profile for user:', username);
    
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