import { useRouting } from '@/components/routing';
import { useEffect } from 'react';

export default function Home() {
  const { navigate, location } = useRouting();

  useEffect(() => {
    // Page loaded
  }, [location]);

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
      <div className="flex flex-col items-center gap-6">
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
            🎮 PLAY GAME
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
            🔨 CREATE WORLD
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
