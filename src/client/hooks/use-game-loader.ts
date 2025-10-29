import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { loadLevel } from '@/game/level/json-conversion';
import { LevelData } from '@/game/level/level-schema';
import { getPhaserConfig } from '@/config/game-config';

export function useGameLoader(levelId: string) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [levelData, setLevelData] = useState<LevelData | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchLevel() {
      try {
        setLoading(true);
        setError(null);

        const cacheKey = `level_${levelId}`;
        const cached = sessionStorage.getItem(cacheKey);

        if (cached) {
          const cachedData = JSON.parse(cached) as LevelData;
          if (isMounted) setLevelData(cachedData);
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/levels/${levelId}`);
        if (!res.ok) throw new Error(`Failed to load level ${levelId}`);

        const data: LevelData = await res.json();
        // runtime-check for legacy payloads that might include an 'objects' array
        // use a cast to any to avoid TypeScript error when checking unknown properties
        if (!('objects' in (data as any)) || !Array.isArray((data as any).objects)) {
          throw new Error('Invalid level data format');
        }

        sessionStorage.setItem(cacheKey, JSON.stringify(data));
        if (isMounted) setLevelData(data);
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load level');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchLevel();
    return () => {
      isMounted = false;
    };
  }, [levelId]);

  useEffect(() => {
    if (!containerRef.current || !levelData || error) return;

    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }

    const config: Phaser.Types.Core.GameConfig = {
      ...getPhaserConfig(),
      parent: containerRef.current,
      scene: {
        preload: preloadScene,
        create: createScene,
      },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    function preloadScene(this: Phaser.Scene) {
      this.load.image('player', '/assets/player.png');
      this.load.image('platform', '/assets/platform.png');
      this.load.image('goal', '/assets/goal.png');
      this.load.image('enemy', '/assets/enemy.png');
    }

    function createScene(this: Phaser.Scene) {
      if (levelData) loadLevel(this, levelData);
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [levelData, error]);

  return {
    containerRef,
    loading,
    error,
  };
}
