import { useState } from 'react';
import PhaserContainer from '@/components/phaser-container';
import { getPhaserConfigWithLevelName } from '@/config/game-config';

const AVAILABLE_LEVELS = [
  { id: 'dummy-level-1', name: 'Level 1' },
  { id: 'grid-demo-level', name: 'Level 2' },
];

export default function Play() {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  if (selectedLevel) {
    const config = getPhaserConfigWithLevelName(selectedLevel);
    return (
      <main className="w-screen h-screen overflow-hidden">
        <PhaserContainer config={config} />
      </main>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        backgroundImage: 'url(/backgrounds/select-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="flex flex-col items-center gap-8">
        <div className="text-center mb-4">
          <h1
            className="text-5xl font-bold text-white mb-2 transform hover:scale-105 transition-transform duration-300"
            style={{
              fontFamily: '"Courier New", monospace',
              textShadow: '6px 6px 0 #333, 12px 12px 0 #666',
              letterSpacing: '8px',
              imageRendering: 'pixelated',
              filter: 'contrast(1.3) brightness(1.1)',
            }}
          >
            SELECT LEVEL
          </h1>
        </div>

        <div className="flex flex-col gap-4">
          {AVAILABLE_LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => setSelectedLevel(level.id)}
              className="relative group transform transition-transform hover:scale-105 w-64 active:translate-y-1"
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
                className="px-6 py-4 text-white font-bold text-lg tracking-widest"
                style={{
                  textShadow: '2px 2px 0 #1B5E20',
                  filter: 'contrast(1.2)',
                }}
              >
                {level.name.toUpperCase()}
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
          ))}
        </div>
      </div>
    </div>
  );
}
