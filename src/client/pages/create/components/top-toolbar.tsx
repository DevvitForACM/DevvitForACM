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
  onViewLeaderboard?: () => void;
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
  onViewLeaderboard,
}: TopToolbarProps) {
  const canPlay = entityCount > 0;

  return (
    <div
      className="absolute top-0 left-0 right-0 z-50 bg-gray-900 shadow-lg"
      style={{
        borderBottom: '4px solid #000',
        fontFamily: '"Courier New", monospace',
        imageRendering: 'pixelated',
      }}
    >
      <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3">
        {/* Left Section - Stats */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink">
          {/* Entity Count */}
          <div
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5"
            style={{
              background: '#2563eb',
              border: 'none',
              boxShadow: 'inset 2px 2px 0 #3b82f6, inset -2px -2px 0 #1e40af, 2px 2px 0 #1e3a8a',
            }}
          >
            <span className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider" style={{ textShadow: '1px 1px 0 #000' }}>
              <span className="hidden sm:inline">ENT</span>
              <span className="sm:hidden">E</span>
            </span>
            <span className="text-base sm:text-xl font-bold text-white" style={{ textShadow: '2px 2px 0 #000' }}>
              {entityCount}
            </span>
          </div>

          {/* DB Status & Levels */}
          <div className="hidden md:flex items-center gap-2 text-xs font-bold uppercase">
            <div
              className="flex items-center gap-1.5 px-2 py-1"
              style={{
                background: dbStatus === 'ok' ? '#10b981' : dbStatus === 'error' ? '#ef4444' : '#6b7280',
                boxShadow: dbStatus === 'ok' 
                  ? 'inset 2px 2px 0 #34d399, inset -2px -2px 0 #059669, 2px 2px 0 #047857'
                  : dbStatus === 'error'
                    ? 'inset 2px 2px 0 #f87171, inset -2px -2px 0 #dc2626, 2px 2px 0 #991b1b'
                    : 'inset 2px 2px 0 #9ca3af, inset -2px -2px 0 #4b5563, 2px 2px 0 #374151',
              }}
            >
              <span className="text-white" style={{ textShadow: '1px 1px 0 #000' }}>
                {dbStatus === 'ok' ? '✓ OK' : dbStatus === 'error' ? '✗ ERR' : '⋯'}
              </span>
            </div>
            
            <div
              className="flex items-center gap-2 px-2 py-1"
              style={{
                background: '#4b5563',
                boxShadow: 'inset 2px 2px 0 #6b7280, inset -2px -2px 0 #374151, 2px 2px 0 #1f2937',
              }}
            >
              <span className="text-white" style={{ textShadow: '1px 1px 0 #000' }}>
                {publicLevels.length}P
              </span>
              {userLevels.length > 0 && (
                <>
                  <span className="text-gray-400">|</span>
                  <span className="text-yellow-300" style={{ textShadow: '1px 1px 0 #000' }}>
                    {userLevels.length}Y
                  </span>
                </>
              )}
              <button
                onClick={onRefreshLevels}
                className="ml-1 px-1 hover:brightness-110 transition-all active:translate-y-0.5"
                title="Refresh"
                style={{
                  background: '#374151',
                  boxShadow: 'inset 1px 1px 0 #4b5563, 1px 1px 0 #1f2937',
                }}
              >
                <span className="text-white text-xs">↻</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* Home Button */}
          <button
            onClick={onHome}
            className="px-2 sm:px-2.5 py-1 sm:py-1.5 hover:brightness-110 transition-all active:translate-y-0.5"
            title="HOME"
            style={{
              background: '#6b7280',
              border: 'none',
              boxShadow: 'inset 2px 2px 0 #9ca3af, inset -2px -2px 0 #4b5563, 2px 2px 0 #374151',
            }}
          >
            <span className="text-white font-bold text-xs sm:text-sm" style={{ textShadow: '1px 1px 0 #000' }}>
              🏠
            </span>
          </button>

          {/* Clear Button */}
          <button
            onClick={onClear}
            className="hidden sm:flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 hover:brightness-110 transition-all active:translate-y-0.5"
            style={{
              background: '#dc2626',
              border: 'none',
              boxShadow: 'inset 2px 2px 0 #ef4444, inset -2px -2px 0 #991b1b, 2px 2px 0 #7f1d1d',
            }}
          >
            <span className="text-white font-bold text-xs uppercase tracking-wide" style={{ textShadow: '1px 1px 0 #000' }}>
              CLEAR
            </span>
          </button>

          {/* Save Button */}
          <button
            onClick={onSave}
            className="hidden sm:flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 hover:brightness-110 transition-all active:translate-y-0.5"
            style={{
              background: '#2563eb',
              border: 'none',
              boxShadow: 'inset 2px 2px 0 #3b82f6, inset -2px -2px 0 #1e40af, 2px 2px 0 #1e3a8a',
            }}
          >
            <span className="text-white font-bold text-xs uppercase tracking-wide" style={{ textShadow: '1px 1px 0 #000' }}>
              SAVE
            </span>
          </button>

          {/* Publish Button */}
          <button
            onClick={onPublish}
            disabled={isPublishing}
            className="hidden md:flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 hover:brightness-110 transition-all active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: isPublishing ? '#6b7280' : '#10b981',
              border: 'none',
              boxShadow: isPublishing 
                ? 'inset 2px 2px 0 #9ca3af, inset -2px -2px 0 #4b5563, 2px 2px 0 #374151'
                : 'inset 2px 2px 0 #34d399, inset -2px -2px 0 #059669, 2px 2px 0 #047857',
            }}
          >
            <span className="text-white font-bold text-xs uppercase tracking-wide whitespace-nowrap" style={{ textShadow: '1px 1px 0 #000' }}>
              {isPublishing ? 'WAIT...' : 'PUBLISH'}
            </span>
          </button>

          {/* Leaderboard Button */}
          {onViewLeaderboard && (
            <button
              onClick={onViewLeaderboard}
              className="hidden lg:flex items-center gap-1 px-2 py-1 sm:py-1.5 hover:brightness-110 transition-all active:translate-y-0.5"
              title="LEADERBOARD"
              style={{
                background: '#f59e0b',
                border: 'none',
                boxShadow: 'inset 2px 2px 0 #fbbf24, inset -2px -2px 0 #d97706, 2px 2px 0 #b45309',
              }}
            >
              <span className="text-white font-bold text-xs uppercase tracking-wide whitespace-nowrap" style={{ textShadow: '1px 1px 0 #000' }}>
                🏆
              </span>
            </button>
          )}

          {/* Play Button */}
          <button
            onClick={onPlay}
            disabled={!canPlay}
            className="flex items-center gap-1 px-2 sm:px-4 py-1 sm:py-1.5 hover:brightness-110 transition-all active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: canPlay ? '#8b5cf6' : '#6b7280',
              border: 'none',
              boxShadow: canPlay
                ? 'inset 2px 2px 0 #a78bfa, inset -2px -2px 0 #6d28d9, 2px 2px 0 #5b21b6'
                : 'inset 2px 2px 0 #9ca3af, inset -2px -2px 0 #4b5563, 2px 2px 0 #374151',
            }}
          >
            <span className="text-white font-bold text-xs sm:text-sm uppercase tracking-wider" style={{ textShadow: '1px 1px 0 #000' }}>
              <span className="hidden sm:inline">▶ PLAY</span>
              <span className="sm:hidden">▶</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

