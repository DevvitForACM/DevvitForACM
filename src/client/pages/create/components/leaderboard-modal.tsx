/**
 * Modal for displaying level leaderboard
 */

import { useState, useEffect } from 'react';
import type { LeaderboardEntry } from '../types';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  levelName: string;
  entries: LeaderboardEntry[];
  isLoading?: boolean;
  currentUserId?: string;
}

export function LeaderboardModal({
  isOpen,
  onClose,
  levelName,
  entries,
  isLoading = false,
  currentUserId,
}: LeaderboardModalProps) {
  const [displayEntries, setDisplayEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Sort entries by score (lower time is better for platformers)
      const sorted = [...entries].sort((a, b) => a.score - b.score);
      setDisplayEntries(sorted.slice(0, 5));
    }
  }, [isOpen, entries]);

  if (!isOpen) return null;

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const ms = milliseconds % 1000;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (minutes > 0) {
      return `${minutes}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }
    return `${secs}.${ms.toString().padStart(3, '0')}s`;
  };

  const getMedalIcon = (rank: number): string => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '🏅';
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ fontFamily: '"Courier New", monospace' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 animate-in fade-in duration-200"
        onClick={onClose}
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Modal */}
      <div
        className="relative max-w-lg w-full animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden flex flex-col"
        style={{
          background: '#1f2937',
          border: '4px solid #000',
          boxShadow: 'inset 4px 4px 0 #374151, inset -4px -4px 0 #111827, 8px 8px 0 #000',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 sm:p-6 border-b-4 border-black"
          style={{
            background: '#f59e0b',
            boxShadow: 'inset 3px 3px 0 #fbbf24, inset -3px -3px 0 #d97706',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center"
              style={{
                background: '#fff',
                boxShadow: 'inset 2px 2px 0 #fef3c7, 2px 2px 0 #b45309',
              }}
            >
              <span className="text-2xl sm:text-3xl">🏆</span>
            </div>
            <div>
              <h2
                className="text-lg sm:text-xl font-bold text-white uppercase tracking-wider"
                style={{ textShadow: '2px 2px 0 #000' }}
              >
                LEADERBOARD
              </h2>
              <p
                className="text-xs sm:text-sm text-white uppercase font-bold"
                style={{ textShadow: '1px 1px 0 #000' }}
              >
                {levelName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:brightness-110 transition-all active:translate-y-0.5"
            style={{
              background: '#dc2626',
              boxShadow: 'inset 2px 2px 0 #ef4444, inset -2px -2px 0 #991b1b, 2px 2px 0 #7f1d1d',
            }}
          >
            <span className="text-white font-bold">✕</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ background: '#111827' }}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-5xl sm:text-6xl animate-pulse mb-4">⏳</div>
              <p
                className="text-white font-bold uppercase"
                style={{ textShadow: '2px 2px 0 #000' }}
              >
                LOADING...
              </p>
            </div>
          ) : displayEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-4"
                style={{
                  background: '#374151',
                  boxShadow: 'inset 2px 2px 0 #4b5563, 2px 2px 0 #1f2937',
                }}
              >
                <span className="text-4xl sm:text-5xl">📋</span>
              </div>
              <p
                className="text-base sm:text-lg font-bold text-yellow-300 mb-2 uppercase"
                style={{ textShadow: '2px 2px 0 #000' }}
              >
                NO SCORES YET
              </p>
              <p
                className="text-xs sm:text-sm text-white max-w-xs uppercase font-bold"
                style={{ textShadow: '1px 1px 0 #000' }}
              >
                BE FIRST TO COMPLETE THIS LEVEL!
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {displayEntries.map((entry, index) => {
                const rank = index + 1;
                const isCurrentUser = entry.userId === currentUserId;

                return (
                  <div
                    key={entry.userId}
                    className="relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4"
                    style={{
                      background: isCurrentUser ? '#1e40af' : '#374151',
                      border: isCurrentUser ? '3px solid #3b82f6' : '2px solid #1f2937',
                      boxShadow: isCurrentUser
                        ? 'inset 2px 2px 0 #3b82f6, 3px 3px 0 #1e3a8a'
                        : 'inset 2px 2px 0 #4b5563, 2px 2px 0 #1f2937',
                    }}
                  >
                    {/* Rank Badge */}
                    <div
                      className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center"
                      style={{
                        background:
                          rank === 1
                            ? '#fbbf24'
                            : rank === 2
                              ? '#9ca3af'
                              : rank === 3
                                ? '#f97316'
                                : '#4b5563',
                        boxShadow:
                          rank === 1
                            ? 'inset 2px 2px 0 #fcd34d, 2px 2px 0 #d97706'
                            : rank === 2
                              ? 'inset 2px 2px 0 #d1d5db, 2px 2px 0 #6b7280'
                              : rank === 3
                                ? 'inset 2px 2px 0 #fb923c, 2px 2px 0 #ea580c'
                                : 'inset 2px 2px 0 #6b7280, 2px 2px 0 #374151',
                      }}
                    >
                      <span className="text-xl sm:text-2xl">{getMedalIcon(rank)}</span>
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                        <p
                          className={`font-bold text-xs sm:text-sm truncate uppercase ${
                            isCurrentUser ? 'text-yellow-300' : 'text-white'
                          }`}
                          style={{ textShadow: '1px 1px 0 #000' }}
                        >
                          {entry.username}
                        </p>
                        {isCurrentUser && (
                          <span
                            className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-white uppercase"
                            style={{
                              background: '#10b981',
                              boxShadow: 'inset 1px 1px 0 #34d399, 1px 1px 0 #059669',
                              textShadow: '1px 1px 0 #000',
                            }}
                          >
                            YOU
                          </span>
                        )}
                      </div>
                      <div
                        className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-400 font-bold uppercase"
                        style={{ textShadow: '1px 1px 0 #000' }}
                      >
                        <span>📅</span>
                        <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div
                        className={`text-base sm:text-xl font-bold ${
                          isCurrentUser ? 'text-yellow-300' : 'text-white'
                        }`}
                        style={{ textShadow: '2px 2px 0 #000' }}
                      >
                        {formatTime(entry.score)}
                      </div>
                      <div
                        className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase"
                        style={{ textShadow: '1px 1px 0 #000' }}
                      >
                        #{rank}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="p-3 sm:p-4 border-t-4 border-black"
          style={{ background: '#1f2937' }}
        >
          <button
            onClick={onClose}
            className="w-full px-4 py-3 text-sm font-bold text-white uppercase hover:brightness-110 transition-all active:translate-y-0.5"
            style={{
              background: '#8b5cf6',
              boxShadow: 'inset 3px 3px 0 #a78bfa, inset -3px -3px 0 #6d28d9, 3px 3px 0 #5b21b6',
              textShadow: '2px 2px 0 #000',
            }}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

