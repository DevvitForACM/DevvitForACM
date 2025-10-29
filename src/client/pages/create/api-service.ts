/**
 * API service for level management
 */

import { authService } from '@/services/auth.service';
import type { LevelData } from '@/game/level/level-schema';
import type { LevelListItem } from './types';

export interface FetchLevelsResult {
  publicLevels: LevelListItem[];
  userLevels: LevelListItem[];
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
      userLevels = uList.map((l: any) => ({ id: l.id, name: l.name }));
    } else {
      console.warn('[API] user levels request failed:', userRes.status);
    }
  }

  return {
    publicLevels: publicLevels.map((l: any) => ({ id: l.id, name: l.name })),
    userLevels,
  };
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

