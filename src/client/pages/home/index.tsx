import { useRouting } from '@/components/routing';
import { useEffect } from 'react';
import Settings from './settings';
import { audioManager } from '@/services/audio-manager';

export default function Home() {
  const { navigate } = useRouting();

  useEffect(() => {
    // If running inside a Reddit webview, init endpoint will exist.
    (async () => {
      try {
        const res = await fetch('/api/init');
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.type === 'init' && data.postData && data.postData.levelId) {
          const levelId = String(data.postData.levelId);
          navigate(`/play?level=${encodeURIComponent(levelId)}`);
        }
      } catch {}
    })();
  }, [navigate]);

  useEffect(() => {
    console.log('🎵 Home page loaded, playing BGM...');
    audioManager.playBGM();
  }, []);
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{
        backgroundImage: 'url(/backgrounds/home-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Settings - clicking the inner SETTINGS div opens the panel */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50">
        <Settings />
      </div>

      <div className="flex flex-col items-center gap-4 sm:gap-6 md:gap-8 w-full max-w-md">
        {/* Game Title */}
        <div className="text-center mb-2 sm:mb-4">
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-2 transform hover:scale-105 transition-transform duration-300"
            style={{
              fontFamily: '"Courier New", monospace',
              textShadow: '3px 3px 0 #333, 6px 6px 0 #666, 9px 9px 0 #999',
              letterSpacing: '4px',
              imageRendering: 'pixelated',
              filter: 'contrast(1.3) brightness(1.1)',
            }}
          >
            SNOOVENTURE
          </h1>
          <div
            className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-yellow-300 tracking-wider animate-pulse"
            style={{
              fontFamily: '"Courier New", monospace',
              textShadow: '2px 2px 0 #B8860B, 4px 4px 0 #8B6914',
              letterSpacing: '2px',
            }}
          >
            ADVENTURE AWAITS
          </div>
        </div>
        <button
          onClick={() => navigate('/play')}
          className="relative group transform transition-transform hover:scale-105 w-full sm:w-80 active:translate-y-1"
          style={{
            background: '#4CAF50',
            border: 'none',
            boxShadow:
              'inset 4px 4px 0 #66BB6A, inset -4px -4px 0 #2E7D32, 4px 4px 0 #1B5E20',
            fontFamily: '"Courier New", monospace',
            imageRendering: 'pixelated',
          }}
        >
          <div
            className="px-4 py-4 sm:px-8 sm:py-6 text-white font-bold text-lg sm:text-xl md:text-2xl tracking-widest"
            style={{
              textShadow: '2px 2px 0 #1B5E20',
              filter: 'contrast(1.2)',
            }}
          >
            PLAY GAME
          </div>
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-100"></div>
          <div
            className="absolute top-0 left-0 w-full h-1 bg-white opacity-30"
            style={{ imageRendering: 'pixelated' }}
          ></div>
          <div
            className="absolute top-0 left-0 w-1 h-full bg-white opacity-30"
            style={{ imageRendering: 'pixelated' }}
          ></div>
        </button>

        <button
          onClick={() => navigate('/create')}
          className="relative group transform transition-transform hover:scale-105 w-full sm:w-80 active:translate-y-1"
          style={{
            background: '#FF9800',
            border: 'none',
            boxShadow:
              'inset 4px 4px 0 #FFB74D, inset -4px -4px 0 #E65100, 4px 4px 0 #BF360C',
            fontFamily: '"Courier New", monospace',
            imageRendering: 'pixelated',
          }}
        >
          <div
            className="px-4 py-4 sm:px-8 sm:py-6 text-white font-bold text-lg sm:text-xl md:text-2xl tracking-widest"
            style={{
              textShadow: '2px 2px 0 #BF360C',
              filter: 'contrast(1.2)',
            }}
          >
            CREATE LEVEL
          </div>
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-100"></div>
          <div
            className="absolute top-0 left-0 w-full h-1 bg-white opacity-30"
            style={{ imageRendering: 'pixelated' }}
          ></div>
          <div
            className="absolute top-0 left-0 w-1 h-full bg-white opacity-30"
            style={{ imageRendering: 'pixelated' }}
          ></div>
        </button>
      </div>


    </div>
  );
}