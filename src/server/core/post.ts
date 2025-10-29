import { context, reddit } from '@devvit/web/server';
import type { LevelData } from '../models/level';

function getTargetSubreddit(): string | undefined {
  // Prefer in-context subreddit (when invoked from subreddit surface)
  if (context?.subredditName) return context.subredditName;
  // Fallback to env-configured subreddit
  return process.env.TARGET_SUBREDDIT || process.env.DEVVIT_SUBREDDIT;
}

export const createPost = async () => {
  const target = getTargetSubreddit();
  if (!target) {
    throw new Error('subredditName is required (context.subredditName or TARGET_SUBREDDIT env)');
  }

  try {
    return await reddit.submitCustomPost({
      splash: {
        // Splash Screen Configuration
        appDisplayName: 'acmdevvit-redis',
        backgroundUri: 'default-splash.png',
        buttonLabel: 'Tap to Start',
        description: 'An exciting interactive experience with Redis backend',
        heading: 'Welcome to the Redis Game!',
        appIconUri: 'default-icon.png',
      },
      postData: {
        gameState: 'initial',
        score: 0,
      },
      subredditName: target,
      title: 'acmdevvit-redis',
    });
  } catch (e) {
    // Fallback to a simple text post for easier diagnostics
    return await (reddit as any).submitTextPost?.({
      subredditName: target,
      title: 'acmdevvit-redis (fallback)',
      text: 'Custom post failed; posting text as fallback.'
    });
  }
};

export const createLevelPost = async (level: LevelData, creatorUsername?: string) => {
  const target = getTargetSubreddit();
  if (!target) {
    throw new Error('subredditName is required (context.subredditName or TARGET_SUBREDDIT env)');
  }

  const title = `New Level: ${level.name ?? level.id}` + (creatorUsername ? ` by u/${creatorUsername}` : '');

  try {
    return await reddit.submitCustomPost({
      splash: {
        appDisplayName: 'acmdevvit-redis',
        backgroundUri: 'default-splash.png',
        buttonLabel: 'Play Level',
        description: level.description ?? 'Play this new community level!',
        heading: level.name ?? 'New Level',
        appIconUri: 'default-icon.png',
    },
    postData: {
      levelId: level.id,
      levelName: level.name ?? level.id,
      createdAt: level.metadata?.createdAt ?? new Date().toISOString(),
      difficulty: level.metadata?.difficulty ?? 'unknown',
    },
    subredditName: target,
    title,
  });
  } catch (e) {
    // Fallback to simple text post to ensure something is posted and expose errors
    const text = `A new level has been published.\n\n` +
      `Level ID: ${level.id}\n` +
      (level.name ? `Name: ${level.name}\n` : '') +
      (level.description ? `Description: ${level.description}\n` : '') +
      (level.metadata?.difficulty ? `Difficulty: ${level.metadata.difficulty}\n` : '') +
      (creatorUsername ? `Creator: u/${creatorUsername}\n` : '') +
      `Timestamp: ${new Date().toISOString()}\n` +
      `Note: Custom post failed, so posted as text.\n`;
    return await (reddit as any).submitTextPost?.({ subredditName: target, title, text });
  }
};
