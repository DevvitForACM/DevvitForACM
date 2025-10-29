/**
 * API service for level management
 */

import { authService } from '@/services/auth.service';
import type { LevelData } from '@/game/level/level-schema';
import type { LevelListItem, SavedLevel, LeaderboardEntry } from './types';

export interface FetchLevelsResult {
  publicLevels: LevelListItem[];
  userLevels: LevelListItem[];
}

export interface SaveLevelRequest {
  name: string;
  description?: string;
  levelData: LevelData;
  isPublic?: boolean;
}

export interface SubmitScoreRequest {
  levelId: string;
  score: number;
  metadata?: Record<string, any>;
}

/**
 * Fetch all public and user levels
 */
export async function fetchLevels(): Promise<FetchLevelsResult> {
  const pubRes = await fetch('/api/levels/public');
  if (!pubRes.ok) throw new Error(`public: HTTP ${pubRes.status}`);
  const pubJson = await pubRes.json();
  const publicLevels = Array.isArray(pubJson.levels) ? pubJson.levels : [];

  let userLevels: LevelListItem[] = [];
  const user = authService.getCurrentUser();
  if (user?.uid) {
    const userRes = await fetch(`/api/levels/user/${user.uid}`, {
      credentials: 'include',
    });
    if (userRes.ok) {
      const userJson = await userRes.json();
      const uList = Array.isArray(userJson.levels) ? userJson.levels : [];
      userLevels = uList.map((l: any) => ({
        id: l.id,
        name: l.name,
        description: l.description,
        author: l.author,
        createdAt: l.createdAt,
      }));
    } else {
      console.warn('[API] user levels request failed:', userRes.status);
    }
  }

  return {
    publicLevels: publicLevels.map((l: any) => ({
      id: l.id,
      name: l.name,
      description: l.description,
      author: l.author,
      createdAt: l.createdAt,
    })),
    userLevels,
  };
}

/**
 * Save a level with name and description
 */
export async function saveLevel(request: SaveLevelRequest): Promise<SavedLevel> {
  const user = authService.getCurrentUser();
  if (!user?.uid) {
    throw new Error('You must be logged in to save levels');
  }

  const response = await fetch('/api/levels/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      name: request.name,
      description: request.description,
      levelData: request.levelData,
      isPublic: request.isPublic ?? false,
      author: user.username || user.uid,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[API] Save error response:', errorData);
    throw new Error(errorData.error || `Failed to save level: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Publish a level to the server
 */
export async function publishLevel(levelData: LevelData): Promise<{ id: string }> {
  const response = await fetch('/api/levels/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(levelData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[API] Publish error response:', errorData);
    throw new Error(
      `Failed to publish: ${errorData.error || response.statusText}`
    );
  }

  return await response.json();
}

/**
 * Get level details including leaderboard
 */
export async function getLevelDetails(levelId: string): Promise<SavedLevel> {
  const response = await fetch(`/api/levels/${levelId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch level: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get leaderboard for a specific level
 */
export async function getLeaderboard(levelId: string, limit: number = 5): Promise<LeaderboardEntry[]> {
  const response = await fetch(`/api/levels/${levelId}/leaderboard?limit=${limit}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
  }

  const data = await response.json();
  return data.entries || [];
}

/**
 * Submit a score to a level's leaderboard
 */
export async function submitScore(request: SubmitScoreRequest): Promise<LeaderboardEntry> {
  const user = authService.getCurrentUser();
  if (!user?.uid) {
    throw new Error('You must be logged in to submit scores');
  }

  const response = await fetch(`/api/levels/${request.levelId}/score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      score: request.score,
      username: user.username || user.uid,
      metadata: request.metadata,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to submit score: ${response.statusText}`);
  }

  return await response.json();
}

