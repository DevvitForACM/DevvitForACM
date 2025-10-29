/**
 * Toolbar displayed during play mode
 */

interface PlayToolbarProps {
  onReturnToEditor: () => void;
}

export function PlayToolbar({ onReturnToEditor }: PlayToolbarProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="flex items-center justify-between p-3 sm:p-4">
        <div className="text-sm sm:text-lg font-semibold text-gray-800">
          Play Mode
        </div>
        <button
          onClick={onReturnToEditor}
          className="px-3 py-2 sm:px-5 sm:py-2 bg-zinc-900 text-sm sm:text-base text-white rounded font-medium hover:bg-zinc-800 transition"
        >
          ← Return to Editor
        </button>
      </div>
    </div>
  );
}

