/**
 * Toolbar displayed during play mode
 */

interface PlayToolbarProps {
  onReturnToEditor: () => void;
}

export function PlayToolbar({ onReturnToEditor }: PlayToolbarProps) {
  return (
    <div
      className="absolute top-0 left-0 right-0 z-50 bg-gray-900 shadow-lg"
      style={{
        borderBottom: '4px solid #000',
        fontFamily: '"Courier New", monospace',
        imageRendering: 'pixelated',
      }}
    >
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3">
        {/* Play Mode Indicator */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2"
            style={{
              background: '#8b5cf6',
              border: 'none',
              boxShadow: 'inset 3px 3px 0 #a78bfa, inset -3px -3px 0 #6d28d9, 3px 3px 0 #5b21b6',
            }}
          >
            <span className="text-white text-lg animate-pulse">▶</span>
            <span
              className="text-xs sm:text-base font-bold text-white uppercase tracking-wider"
              style={{ textShadow: '2px 2px 0 #000' }}
            >
              PLAY MODE
            </span>
          </div>
          
          {/* Instructions */}
          <div className="hidden md:flex items-center gap-2">
            <div
              className="flex items-center gap-2 px-3 py-1.5"
              style={{
                background: '#2563eb',
                border: 'none',
                boxShadow: 'inset 2px 2px 0 #3b82f6, inset -2px -2px 0 #1e40af, 2px 2px 0 #1e3a8a',
              }}
            >
              <span className="text-white text-xs font-bold uppercase" style={{ textShadow: '1px 1px 0 #000' }}>
                ⚡ TEST LEVEL
              </span>
            </div>
          </div>
        </div>

        {/* Return to Editor Button */}
        <button
          onClick={onReturnToEditor}
          className="flex items-center gap-2 px-3 sm:px-5 py-1.5 sm:py-2 hover:brightness-110 transition-all active:translate-y-0.5"
          style={{
            background: '#4b5563',
            border: 'none',
            boxShadow: 'inset 3px 3px 0 #6b7280, inset -3px -3px 0 #374151, 3px 3px 0 #1f2937',
          }}
        >
          <span className="text-white text-lg">←</span>
          <span
            className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide whitespace-nowrap"
            style={{ textShadow: '1px 1px 0 #000' }}
          >
            <span className="hidden sm:inline">BACK TO EDITOR</span>
            <span className="sm:hidden">EDITOR</span>
          </span>
        </button>
      </div>
    </div>
  );
}

