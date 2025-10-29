export type InitResponse = {
  type: 'init';
  postId: string;
  count: number;
  username: string;
  postData?: Record<string, unknown> | null;
};

export type IncrementResponse = {
  type: 'increment';
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: 'decrement';
  postId: string;
  count: number;
};

export * from './leaderboard';
