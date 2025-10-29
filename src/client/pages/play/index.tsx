import { useEffect, useState } from 'react';
import PhaserContainer from '@/components/phaser-container';
import { getPhaserConfigWithLevelName } from '@/config/game-config';
import { useRouting } from '@/components/routing';

interface PublicLevelItem {
  id: string;
  name?: string;
  metadata?: { createdBy?: string; createdAt?: string };
  creatorUsername?: string;
  topScore?: number;
}

export default function Play() {
  const { navigate, location } = useRouting();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [levels, setLevels] = useState<PublicLevelItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-select level from query param
  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    const level = params.get('level');
    if (level) setSelectedLevel(level);
  }, [location.search]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [pubRes, locRes] = await Promise.all([
          fetch('/api/levels/public'),
          fetch('/api/levels/local'),
        ]);
        if (!pubRes.ok) throw new Error(`HTTP ${pubRes.status}`);
        if (!locRes.ok) throw new Error(`HTTP ${locRes.status}`);
        const pub = await pubRes.json();
        const loc = await locRes.json();
        const pubLevels = (pub.levels || []) as PublicLevelItem[];
        const locLevels = (loc.levels || []) as PublicLevelItem[];
        // Merge and de-duplicate by id (prefer public over local when same id)
        const map = new Map<string, PublicLevelItem>();
        for (const l of locLevels) map.set(l.id, l);
        for (const l of pubLevels) map.set(l.id, l);
        setLevels(Array.from(map.values()));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (selectedLevel) {
    const config = getPhaserConfigWithLevelName(selectedLevel);
    return (
      <main className="w-screen h-screen overflow-hidden">
        {/* Top nav bar with Back to Levels */}
        <div className="w-full flex items-center justify-between px-4 py-2 bg-black/60 text-white">
          <button
            onClick={() => {
              setSelectedLevel(null);
              // clear ?level param by navigating to /play
              navigate('/play');
            }}
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
          >
            ← Back to Levels
          </button>
          <div className="font-bold tracking-widest opacity-80">PLAYING: {selectedLevel}</div>
          <div />
        </div>
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

        <button
          onClick={() => navigate('/')}
          className="relative group transform transition-transform hover:scale-105 w-80 active:translate-y-1"
          style={{
            background: '#757575',
            border: 'none',
            boxShadow:
              'inset 4px 4px 0 #9E9E9E, inset -4px -4px 0 #424242, 4px 4px 0 #212121',
            fontFamily: '"Courier New", monospace',
            imageRendering: 'pixelated',
          }}
        >
          <div
            className="px-6 py-3 text-white font-bold text-lg tracking-widest"
            style={{
              textShadow: '2px 2px 0 #212121',
              filter: 'contrast(1.2)',
            }}
          >
            ← BACK TO HOME
          </div>
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-100"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-white opacity-30" style={{ imageRendering: 'pixelated' }}></div>
          <div className="absolute top-0 left-0 w-1 h-full bg-white opacity-30" style={{ imageRendering: 'pixelated' }}></div>
        </button>

        {loading && <div className="text-white">Loading…</div>}
        {error && <div className="text-red-300">{error}</div>}

        <div className="flex flex-col gap-4 max-h-[70vh] overflow-auto px-4">
          {levels.map((level) => (
            <button
              key={level.id}
              onClick={() => setSelectedLevel(level.id)}
              className="relative group transform transition-transform hover:scale-105 w-80 text-left active:translate-y-1"
              style={{
                background: '#4CAF50',
                border: 'none',
                boxShadow:
                  'inset 4px 4px 0 #66BB6A, inset -4px -4px 0 #2E7D32, 4px 4px 0 #1B5E20',
                fontFamily: '"Courier New", monospace',
                imageRendering: 'pixelated',
              }}
            >
              <div className="px-6 py-4 text-white">
                <div className="font-bold text-lg tracking-widest" style={{ textShadow: '2px 2px 0 #1B5E20' }}>
                  {(level.name || 'Untitled').toUpperCase()}
                </div>
                <div className="text-sm opacity-90">By: {level.creatorUsername || level.metadata?.createdBy || 'unknown'}</div>
                <div className="text-sm opacity-90">Top score: {level.topScore ?? 0}</div>
              </div>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-100"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-white opacity-30" style={{ imageRendering: 'pixelated' }}></div>
              <div className="absolute top-0 left-0 w-1 h-full bg-white opacity-30" style={{ imageRendering: 'pixelated' }}></div>
            </button>
          ))}
          {!loading && levels.length === 0 && (
            <div className="text-white opacity-80">No public levels yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
