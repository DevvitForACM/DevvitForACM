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
      <div className="text-center bg-white/90 p-4 sm:p-8 rounded-lg max-w-xs sm:max-w-md mx-4 pointer-events-none">
        <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">🎮</div>
        <div className="text-sm sm:text-lg font-semibold mb-2">
          Start Creating!
        </div>
        <div className="text-xs sm:text-sm text-gray-600 space-y-1">
          <div>1. Click entity below</div>
          <div>2. Click/drag to place</div>
          <div className="text-gray-400 mt-2">Use eraser to remove</div>
        </div>
      </div>
    </div>
  );
}

