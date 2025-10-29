export interface SaveBanner {
  status: 'success' | 'error';
  message: string;
}

export interface LevelListItem {
  id: string;
  name?: string;
  description?: string;
  author?: string;
  createdAt?: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  timestamp: string;
  rank?: number;
}

export interface SavedLevel {
  id: string;
  name: string;
  description?: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  playCount: number;
  leaderboard: LeaderboardEntry[];
}

export type DbStatus = 'idle' | 'ok' | 'error' | 'loading';

