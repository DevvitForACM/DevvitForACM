import { useRouting } from '@/components/routing';
import { useState, useEffect } from 'react';
import { SettingsModal } from '@/components/settings-modal';

export default function Home() {
  const { navigate, location } = useRouting();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {}, [location]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        backgroundImage: 'url(/backgrounds/home-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Settings Button */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="absolute top-4 right-4 transform transition-transform hover:scale-110 active:scale-95"
        style={{
          background: '#6C63FF',
          border: 'none',
          boxShadow:
            'inset 3px 3px 0 #8B88FF, inset -3px -3px 0 #5A52CC, 3px 3px 0 #4A43AA',
          fontFamily: '"Courier New", monospace',
          imageRendering: 'pixelated',
        }}
      >
        <div
          className="px-6 py-3 text-white font-bold text-lg tracking-wider"
          style={{
            textShadow: '2px 2px 0 #4A43AA',
            filter: 'contrast(1.2)',
          }}
        >
          ⚙️ SETTINGS
        </div>
        <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-100"></div>
        <div
          className="absolute top-0 left-0 w-full h-1 bg-white opacity-30"
          style={{ imageRendering: 'pixelated' }}
        ></div>
        <div
          className="absolute top-0 left-0 w-1 h-full bg-white opacity-30"
          style={{ imageRendering: 'pixelated' }}
        ></div>
      </button>

      <div className="flex flex-col items-center gap-8">
        {/* Game Title */}
        <div className="text-center mb-4">
          <h1
            className="text-7xl font-bold text-white mb-2 transform hover:scale-105 transition-transform duration-300"
            style={{
              fontFamily: '"Courier New", monospace',
              textShadow: '6px 6px 0 #333, 12px 12px 0 #666, 18px 18px 0 #999',
              letterSpacing: '8px',
              imageRendering: 'pixelated',
              filter: 'contrast(1.3) brightness(1.1)',
            }}
          >
            SNOOVENTURE
          </h1>
          <div
            className="text-2xl font-bold text-yellow-300 tracking-wider animate-pulse"
            style={{
              fontFamily: '"Courier New", monospace',
              textShadow: '3px 3px 0 #B8860B, 6px 6px 0 #8B6914',
              letterSpacing: '4px',
            }}
          >
            ADVENTURE AWAITS
          </div>
        </div>
        <button
          onClick={() => navigate('/play')}
          className="relative group transform transition-transform hover:scale-105 w-80 active:translate-y-1"
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
            className="px-8 py-6 text-white font-bold text-2xl tracking-widest"
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
          className="relative group transform transition-transform hover:scale-105 w-80 active:translate-y-1"
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
            className="px-8 py-6 text-white font-bold text-2xl tracking-widest"
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

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}