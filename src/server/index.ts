import express from 'express';
import { InitResponse, IncrementResponse, DecrementResponse } from '../shared/types/api';
import authRoutes from './routes/auth.routes';
import levelRoutes from './routes/level.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import { redis, reddit, context, createServer, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

// Debug middleware to log all requests and current user
app.use(async (req, _res, next) => {
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
      const count = await redis.get('count');
      const username = await reddit.getCurrentUsername() || 'anonymous';

      res.json({
        type: 'init',
        postId: postId,
        count: count ? parseInt(count) : 0,
        username: username,
        postData: (context as any)?.postData ?? null,
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
    const target = context.subredditName || process.env.TARGET_SUBREDDIT || process.env.DEVVIT_SUBREDDIT || 'unknown';
    res.json({
      navigateTo: `https://reddit.com/r/${target}/comments/${(post as any)?.id ?? ''}`,
      postId: (post as any)?.id ?? null,
      targetSubreddit: target,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Debug route: force-create a post for a level by ID
router.post('/internal/debug/post-level/:id', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ status: 'error', message: 'Level ID required' });
      return;
    }
    const { LevelsServiceRedis } = await import('./services/levels.service.redis');
    const db = new LevelsServiceRedis(redis);
    const doc = await db.get(`levels/${id}`);
    if (!doc.exists()) {
      res.status(404).json({ status: 'error', message: 'Level not found' });
      return;
    }
    const level = doc.val();
    const { createLevelPost } = await import('./core/post');
    const post = await createLevelPost(level as any, undefined);
    res.json({ status: 'ok', levelId: id, postId: (post as any)?.id ?? null });
  } catch (error) {
    console.error('Debug post-level failed:', error);
    res.status(400).json({ status: 'error', message: error instanceof Error ? error.message : String(error) });
  }
});

// Use router middleware
app.use(router);

// Auth routes
app.use('/api/auth', authRoutes);

// Level routes
app.use('/api/levels', levelRoutes);

// leaderboard routes
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

// Create and start the server
const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port, () => console.log(`http://localhost:${port}`));
