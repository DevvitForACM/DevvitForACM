import { useRouting } from '@/components/routing';
import { useEffect } from 'react';
import Settings from './settings';
import { audioManager } from '@/services/audio-manager';

export default function Home() {
  const { navigate } = useRouting();

  useEffect(() => {
    // Try to start BGM immediately
    audioManager.playBGM();
    
    // Also ensure it plays on any user interaction
    const handleInteraction = () => {
      audioManager.playBGM();
    };
    
    // Add listeners for various interaction types
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });
    
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);
  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-8 overflow-hidden"
      style={{
        backgroundImage: 'url(/backgrounds/home-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/50 pointer-events-none"></div>

      {/* Settings - clicking the inner SETTINGS div opens the panel */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50">
        <Settings />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-8 w-full max-w-lg">
        {/* Game Title */}
        <div className="text-center mb-4">
          <div className="mb-6">
            <h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-4 tracking-widest leading-none uppercase"
              style={{
                fontFamily: '"Courier New", monospace',
                textShadow: '4px 4px 0 #333, 8px 8px 0 #666, 12px 12px 0 #999',
                imageRendering: 'pixelated',
                filter: 'contrast(1.3) brightness(1.1)',
              }}
            >
              SNOOVENTURE
            </h1>
          </div>
          <p
            className="text-xl sm:text-2xl text-yellow-300 font-bold tracking-wider uppercase animate-pulse"
            style={{
              fontFamily: '"Courier New", monospace',
              textShadow: '2px 2px 0 #000, 4px 4px 0 #b45309',
            }}
          >
            🎮 ADVENTURE AWAITS
          </p>
        </div>

        {/* Main Menu Buttons */}
        <div className="w-full space-y-4">
          <button
            onClick={() => navigate('/play')}
            className="group relative w-full hover:brightness-110 transition-all active:translate-y-1"
            style={{
              background: '#10b981',
              border: 'none',
              boxShadow:
                'inset 4px 4px 0 #34d399, inset -4px -4px 0 #059669, 4px 4px 0 #047857',
              fontFamily: '"Courier New", monospace',
              imageRendering: 'pixelated',
            }}
          >
            <div className="px-4 py-4 sm:px-8 sm:py-6">
              <div
                className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 tracking-widest uppercase"
                style={{ textShadow: '3px 3px 0 #000' }}
              >
                ▶ PLAY GAME
              </div>
              <div
                className="text-xs sm:text-sm text-white font-bold uppercase tracking-wide"
                style={{ textShadow: '2px 2px 0 #000' }}
              >
                START YOUR ADVENTURE
              </div>
            </div>
            <div
              className="absolute top-0 left-0 w-full h-2 bg-white opacity-30"
              style={{ imageRendering: 'pixelated' }}
            ></div>
            <div
              className="absolute top-0 left-0 w-2 h-full bg-white opacity-30"
              style={{ imageRendering: 'pixelated' }}
            ></div>
          </button>

          <button
            onClick={() => navigate('/create')}
            className="group relative w-full hover:brightness-110 transition-all active:translate-y-1"
            style={{
              background: '#f59e0b',
              border: 'none',
              boxShadow:
                'inset 4px 4px 0 #fbbf24, inset -4px -4px 0 #d97706, 4px 4px 0 #b45309',
              fontFamily: '"Courier New", monospace',
              imageRendering: 'pixelated',
            }}
          >
            <div className="px-4 py-4 sm:px-8 sm:py-6">
              <div
                className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 tracking-widest uppercase"
                style={{ textShadow: '3px 3px 0 #000' }}
              >
                🔨 CREATE LEVEL
              </div>
              <div
                className="text-xs sm:text-sm text-white font-bold uppercase tracking-wide"
                style={{ textShadow: '2px 2px 0 #000' }}
              >
                BUILD YOUR CHALLENGE
              </div>
            </div>
            <div
              className="absolute top-0 left-0 w-full h-2 bg-white opacity-30"
              style={{ imageRendering: 'pixelated' }}
            ></div>
            <div
              className="absolute top-0 left-0 w-2 h-full bg-white opacity-30"
              style={{ imageRendering: 'pixelated' }}
            ></div>
          </button>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p
            className="text-gray-400 text-xs sm:text-sm font-bold uppercase tracking-wider"
            style={{
              fontFamily: '"Courier New", monospace',
              textShadow: '1px 1px 0 #000',
            }}
          >
            BUILT WITH DEVVIT • POWERED BY PHASER
          </p>
        </div>
      </div>
    </div>
  );
}