/**
 * Welcome overlay displayed when the editor is empty
 */

interface WelcomeOverlayProps {
  show: boolean;
}

export function WelcomeOverlay({ show }: WelcomeOverlayProps) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
      <div
        className="text-center p-4 sm:p-8 max-w-xs sm:max-w-md mx-4 pointer-events-none"
        style={{
          background: '#1f2937',
          border: '4px solid #000',
          boxShadow: 'inset 4px 4px 0 #374151, inset -4px -4px 0 #111827, 8px 8px 0 #000',
          fontFamily: '"Courier New", monospace',
          imageRendering: 'pixelated',
        }}
      >
        <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎮</div>
        <div
          className="text-base sm:text-2xl font-bold mb-3 sm:mb-4 text-yellow-300 uppercase tracking-wider"
          style={{ textShadow: '2px 2px 0 #000' }}
        >
          START CREATING!
        </div>
        <div className="text-xs sm:text-sm text-white space-y-1.5 font-bold uppercase">
          <div style={{ textShadow: '1px 1px 0 #000' }}>1. CLICK ENTITY BELOW</div>
          <div style={{ textShadow: '1px 1px 0 #000' }}>2. CLICK/DRAG TO PLACE</div>
          <div className="text-gray-400 mt-2" style={{ textShadow: '1px 1px 0 #000' }}>
            R-CLICK TO REMOVE
          </div>
        </div>
      </div>
    </div>
  );
}

