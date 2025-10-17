export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  timestamp: number;
}

export interface LeaderboardResponse {
  type: 'leaderboard';
  entries: LeaderboardEntry[];
  userRank?: number | undefined;
  totalPlayers: number;
}

export interface UpdateScoreRequest {
  userId: string;
  username: string;
  score: number;
}

export interface UpdateScoreResponse {
  type: 'score-update';
  success: boolean;
  newRank?: number | undefined;
  message?: string;
}