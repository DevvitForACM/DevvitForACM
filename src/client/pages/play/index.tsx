import { useEffect, useState } from 'react';
import PhaserContainer from '@/components/phaser-container';
import { getPhaserConfigWithLevelName } from '@/config/game-config';
import { useRouting } from '@/components/routing';
import { VirtualJoystick } from '@/components/virtual-joystick';
import { SCENE_KEYS } from '@/constants/game-constants';

interface PublicLevelItem {
  id: string;
  name?: string;
  metadata?: { createdBy?: string; createdAt?: string };
  creatorUsername?: string;
  topScore?: number;
}

// Loading skeleton component
const LevelCardSkeleton = () => (
  <div className="animate-pulse bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-xl">
    <div className="h-6 bg-white/20 rounded w-3/4 mb-3"></div>
    <div className="h-4 bg-white/15 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-white/15 rounded w-1/3"></div>
  </div>
);

export default function Play() {
  const { navigate } = useRouting();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [levels, setLevels] = useState<PublicLevelItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Detect mobile
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
      setIsMobile(mobile);
    };
    checkMobile();

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
    
    const handleJoystickMove = (x: number, y: number) => {
      const game = (window as any).game;
      if (game) {
        const scene = game.scene.getScene(SCENE_KEYS.PLAY);
        if (scene && typeof scene.setMobileJoystick === 'function') {
          scene.setMobileJoystick(x, y);
        }
      }
    };

    const handleJump = () => {
      const game = (window as any).game;
      if (game) {
        const scene = game.scene.getScene(SCENE_KEYS.PLAY);
        if (scene && typeof scene.setMobileJump === 'function') {
          scene.setMobileJump(true);
        }
      }
    };

    return (
      <main className="w-screen h-screen overflow-hidden relative">
        <PhaserContainer config={config} />
        {isMobile && (
          <VirtualJoystick 
            onMove={handleJoystickMove} 
            onJump={handleJump}
            size={120}
          />
        )}
      </main>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center relative overflow-hidden"
      style={{
        backgroundImage: 'url(/backgrounds/select-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Gradient overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none"></div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-block mb-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-2 tracking-tight">
              Choose Your Adventure
            </h1>
            <div className="h-1.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full"></div>
          </div>
          <p className="text-white/80 text-lg sm:text-xl max-w-2xl mx-auto">
            Select a level to start your platforming journey
          </p>
        </div>

        {/* Back Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="group relative px-6 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <span className="flex items-center gap-2 text-white font-medium">
              <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </span>
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-500/20 backdrop-blur-md border border-red-500/50 rounded-2xl p-6 text-center">
              <div className="text-red-100 text-lg font-medium mb-2">⚠️ Error Loading Levels</div>
              <div className="text-red-200/80">{error}</div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[...Array(6)].map((_, i) => (
              <LevelCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Levels Grid */}
        {!loading && levels.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {levels.map((level, index) => (
              <button
                key={level.id}
                onClick={() => setSelectedLevel(level.id)}
                className="group relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:border-white/40 p-6 text-left transition-all duration-300 hover:bg-white/15 hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
                style={{
                  animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                }}
              >
                {/* Gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Level Name */}
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-blue-200 transition-colors line-clamp-2">
                    {level.name || 'Untitled Level'}
                  </h3>

                  {/* Meta Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-white/70">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <span className="truncate">{level.creatorUsername || level.metadata?.createdBy || 'Anonymous'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-white/70">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>Best: {level.topScore ?? 0} points</span>
                    </div>
                  </div>
                </div>

                {/* Play Icon */}
                <div className="absolute bottom-4 right-4 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 shadow-lg">
                  <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && levels.length === 0 && !error && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No Levels Yet</h3>
              <p className="text-white/70 mb-6">Be the first to create an amazing level!</p>
              <button
                onClick={() => navigate('/create')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Level
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
