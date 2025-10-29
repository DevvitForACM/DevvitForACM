/**
 * Top toolbar for the create page
 */

import type { DbStatus, LevelListItem } from '../types';

interface TopToolbarProps {
  entityCount: number;
  dbStatus: DbStatus;
  publicLevels: LevelListItem[];
  userLevels: LevelListItem[];
  isPublishing: boolean;
  onHome: () => void;
  onClear: () => void;
  onSave: () => void;
  onPublish: () => void;
  onPlay: () => void;
  onRefreshLevels: () => void;
}

export function TopToolbar({
  entityCount,
  dbStatus,
  publicLevels,
  userLevels,
  isPublishing,
  onHome,
  onClear,
  onSave,
  onPublish,
  onPlay,
  onRefreshLevels,
}: TopToolbarProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="flex items-center justify-between p-3 sm:p-4">
        <div className="text-xs sm:text-sm text-gray-600">
          Entities:{' '}
          <span className="font-bold text-base sm:text-lg">{entityCount}</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span
            className={
              dbStatus === 'ok'
                ? 'text-emerald-600'
                : dbStatus === 'error'
                  ? 'text-rose-600'
                  : 'text-gray-500'
            }
          >
            DB: {dbStatus.toUpperCase()}
          </span>
          <span className="text-gray-600">
            public {publicLevels.length}
            {userLevels.length ? ` / yours ${userLevels.length}` : ''}
          </span>
          <button
            onClick={onRefreshLevels}
            className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-800"
          >
            Refresh
          </button>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={onHome}
            className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-gray-200 text-gray-800 rounded font-medium hover:bg-gray-300"
          >
            ← Home
          </button>
          <button
            onClick={onClear}
            className="px-2 py-1 sm:px-4 sm:py-2 text-xs bg-zinc-900 sm:text-sm text-white rounded font-medium"
          >
            Clear
          </button>
          <button
            onClick={onSave}
            className="px-2 py-1 sm:px-4 sm:py-2 bg-zinc-900 text-xs sm:text-sm text-white rounded font-medium"
          >
            Save
          </button>
          <button
            onClick={onPublish}
            disabled={isPublishing}
            className="px-2 py-1 sm:px-4 sm:py-2 bg-green-600 text-xs sm:text-sm text-white rounded font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {isPublishing ? 'Publishing...' : 'Publish Level'}
          </button>
          <button
            onClick={onPlay}
            className="px-2 py-1 sm:px-4 sm:py-2 bg-zinc-900 text-xs sm:text-sm text-white rounded font-medium"
          >
            Play
          </button>
        </div>
      </div>
    </div>
  );
}

