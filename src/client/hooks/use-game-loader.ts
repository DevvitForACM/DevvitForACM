/**
 * use-game-loader.ts
 * ------------------------------------------------
 * React hook to initialize and manage a Phaser Game.
 * Loads levels dynamically from backend API and converts
 * them using json-conversion.ts.
 * ------------------------------------------------
 */

import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { getPhaserConfig } from "../config/game-config";
import { loadLevel } from "../game/level/json-conversion";
import { LevelData } from "../game/level/level-schema";
import { PlayScene } from "../game/scenes/play-scene";

export function useGameLoader(levelId: string) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [levelData, setLevelData] = useState<LevelData | null>(null);

  // 🔹 Fetch level data (with simple caching)
  useEffect(() => {
    let isMounted = true;

    async function fetchLevel() {
      try {
        console.log(`[Loader] Fetching level: ${levelId}`);
        setLoading(true);
        setError(null);

        const cacheKey = `level_${levelId}`;
        const cached = sessionStorage.getItem(cacheKey);

        if (cached) {
          console.log(`[Loader] Loaded level '${levelId}' from cache`);
          const cachedData = JSON.parse(cached) as LevelData;
          if (isMounted) setLevelData(cachedData);
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/levels/${levelId}`);
        if (!res.ok) throw new Error(`Failed to load level ${levelId}`);

        const data: LevelData = await res.json();
        console.log(`[Loader] Level data fetched:`, data);

        if (!data.objects || !Array.isArray(data.objects)) {
          console.error(`[Loader] Invalid level data structure for '${levelId}'`);
          throw new Error("Invalid level data format");
        }

        sessionStorage.setItem(cacheKey, JSON.stringify(data));
        if (isMounted) setLevelData(data);
      } catch (err: any) {
        console.error(`[Loader] Error loading level '${levelId}':`, err);
        if (isMounted) setError(err.message || "Failed to load level");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchLevel();
    return () => {
      console.log(`[Loader] Cleanup fetch effect for level '${levelId}'`);
      isMounted = false;
    };
  }, [levelId]);

  // 🔹 Initialize Phaser once data is ready
  useEffect(() => {
    if (!containerRef.current || !levelData || error) return;

    // Destroy previous instance if any
    if (gameRef.current) {
      console.log("[Phaser] Destroying old game instance...");
      gameRef.current.destroy(true);
      gameRef.current = null;
    }

    console.log("[Phaser] Initializing new game with Matter.js for level:", levelId);

    // Pass Matter config explicitly, no inline scene override
    const config = getPhaserConfig({
      bgColor: "#1d1d1d",
      gravityY: 1,
      worldWidth: 4000,
      worldHeight: 2000,
      moveSpeed: 220,
      jumpVelocity: -420,
      deadzoneXFrac: 0.25,
      useMapControls: false,
    });

    // Make sure PlayScene loads the fetched JSON
    // Make sure PlayScene loads the fetched JSON
    const game = new Phaser.Game({
      ...config,
      parent: containerRef.current,
      scene: class extends PlayScene {
        override async create() {
          console.log(`[CustomScene] Loading level '${levelId}'`);
          await super.create();
          loadLevel(this, levelData);
        }
      },
    });
    gameRef.current = game;

    return () => {
      console.log("[Phaser] Destroying game instance on cleanup");
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [levelData, error]);

  return { containerRef, loading, error };
}
