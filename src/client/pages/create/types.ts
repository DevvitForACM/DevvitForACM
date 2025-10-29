export interface SaveBanner {
  status: 'success' | 'error';
  message: string;
}

export interface LevelListItem {
  id: string;
  name?: string;
}

export type DbStatus = 'idle' | 'ok' | 'error' | 'loading';

