import express from 'express';
import { InitResponse, IncrementResponse, DecrementResponse } from '../shared/types/api';
import leaderboardRoutes from './routes/leaderboard.routes';
import authRoutes from './routes/auth.routes';
// Ensure firebase-admin is initialized on server start
import './services/firebase-admin.service';

// Detect if running in Devvit context or standalone
const isDevvitContext = process.env.DEVVIT_EXECUTION_ID !== undefined;

// Conditionally import Devvit-specific modules
// Use more specific types where possible. These come from the Devvit runtime and are
// only available when running in Devvit context, so they're typed as unknown here
// and narrowed at runtime.
let redis: { get(key: string): Promise<string | undefined>; incrBy(key: string, by: number): Promise<number> } | undefined;
let reddit: { getCurrentUsername(): Promise<string | undefined> } | undefined;
let createServer: ((app: import('express').Express) => import('http').Server) | undefined;
let context: { postId?: string | undefined; subredditName?: string | undefined } | undefined;
let getServerPort: (() => number) | undefined;
let createPost: (() => Promise<{ id: string }>) | undefined;

async function initializeServer() {
  if (isDevvitContext) {
    const devvitWeb = await import('@devvit/web/server');
    // Assign runtime values - runtime checks below will assume these are defined.
    redis = devvitWeb.redis;
    reddit = devvitWeb.reddit;
    createServer = devvitWeb.createServer;
    context = devvitWeb.context;
    getServerPort = devvitWeb.getServerPort;

    const postModule = await import('./core/post');
    createPost = postModule.createPost;
  }
  
  startServer();
}

function startServer() {
const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

// Devvit-specific routes (only enabled in Devvit context)
  if (isDevvitContext) {
  router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
    '/api/init',
    async (_req, res) => {
    const postId = context?.postId;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    if (!redis || !reddit) {
      console.error('API Init Error: devvit runtime clients are not available');
      res.status(500).json({ status: 'error', message: 'Devvit runtime not available' });
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
  async (_req, res) => {
    const postId = context?.postId;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    if (!redis) {
      return res.status(500).json({ status: 'error', message: 'Redis client unavailable' });
    }

    const newCount = await redis.incrBy('count', 1);
    res.json({
      count: newCount,
      postId,
      type: 'increment',
    });
  }
);

router.post<{ postId: string }, DecrementResponse | { status: string; message: string }, unknown>(
  '/api/decrement',
  async (_req, res) => {
    const postId = context?.postId;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    if (!redis) {
      return res.status(500).json({ status: 'error', message: 'Redis client unavailable' });
    }

    const newCount = await redis.incrBy('count', -1);
    res.json({
      count: newCount,
      postId,
      type: 'decrement',
    });
  }
);

router.post('/internal/on-app-install', async (_req, res) => {
  if (!createPost) {
    return res.status(500).json({ status: 'error', message: 'CreatePost not available' });
  }

  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context?.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res) => {
  if (!createPost) {
    return res.status(500).json({ status: 'error', message: 'CreatePost not available' });
  }

  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context?.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});
} // End of isDevvitContext block for router

// Use router middleware only if Devvit routes exist
if (isDevvitContext) {
  app.use(router);
}

// Leaderboard routes
app.use('/api/leaderboard', leaderboardRoutes);

// Auth routes (Reddit OAuth)
app.use('/auth', authRoutes);

// Health check for standalone mode
if (!isDevvitContext) {
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Standalone server running', port: process.env.PORT || 3000 });
  });
}

// Get port from environment variable with fallback
const port = isDevvitContext ? getServerPort!() : (Number(process.env.PORT) || 3000);
console.log('🚀 Server will listen on port:', port);
console.log('   Mode:', isDevvitContext ? 'Devvit' : 'Standalone');

if (isDevvitContext) {
  const server = createServer!(app);
  server.on('error', (err: Error) => console.error(`server error; ${err.stack}`));
  server.listen(port);
} else {
  // Standalone mode - use regular Express listen
  app.listen(port, () => {
    console.log(`✅ Server is running on http://localhost:${port}`);
    console.log(`   Health check: http://localhost:${port}/health`);
    console.log(`   Auth callback: http://localhost:${port}/auth/reddit/callback`);
    console.log(`   Leaderboard: http://localhost:${port}/api/leaderboard`);
  });
}
} // End of startServer function

// Initialize and start the server
initializeServer().catch(err => {
  console.error('Failed to initialize server:', err);
  process.exit(1);
});
