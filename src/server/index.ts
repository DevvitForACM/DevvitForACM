import express from 'express';
import { InitResponse, IncrementResponse, DecrementResponse } from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';
import leaderboardRoutes from './routes/leaderboard.routes';
import authRoutes from './routes/auth.routes';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

// Debug middleware to log all requests and current user
app.use(async (req, res, next) => {
  console.log(`🔍 SERVER: ${req.method} ${req.path} - ${new Date().toISOString()}`);
  
  // Get current Reddit user from Devvit context
  try {
    const currentUser = await reddit.getCurrentUsername();
    console.log(`👤 SERVER: Current Reddit user: ${currentUser || 'anonymous'}`);
  } catch (error) {
    console.log(`👤 SERVER: Could not get current user: ${error}`);
  }
  
  console.log(`🔍 SERVER: Query params:`, req.query);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 SERVER: Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

const router = express.Router();

router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const [count, username] = await Promise.all([
        redis.get('count'),
        reddit.getCurrentUsername(),
      ]);

      res.json({
        type: 'init',
        postId: postId,
        count: count ? parseInt(count) : 0,
        username: username ?? 'anonymous',
      });
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

router.post<{ postId: string }, IncrementResponse | { status: string; message: string }, unknown>(
  '/api/increment',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', 1),
      postId,
      type: 'increment',
    });
  }
);

router.post<{ postId: string }, DecrementResponse | { status: string; message: string }, unknown>(
  '/api/decrement',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', -1),
      postId,
      type: 'decrement',
    });
  }
);

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Use router middleware
app.use(router);

// Auth routes
app.use('/api/auth', authRoutes);

// Leaderboard routes
app.use('/api/leaderboard', leaderboardRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
  console.log('🏥 SERVER: Health check endpoint accessed');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: 'Redis-powered Devvit Game Server',
    version: '0.0.4.11'
  });
});

// Catch-all route for debugging
app.use((req, res) => {
  console.log(`❓ SERVER: Unhandled route accessed: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    availableRoutes: [
      'GET /health',
      'GET /api/auth/me',
      'POST /api/auth/login',
      'POST /api/auth/logout',
      'GET /api/auth/profile/:username',
      'GET /api/init',
      'POST /api/increment',
      'POST /api/decrement',
      'GET /api/leaderboard',
      'POST /api/leaderboard/score'
    ]
  });
});

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);