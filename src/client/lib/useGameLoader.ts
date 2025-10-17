/**
 * useGameLoader.ts
 * ------------------------------------------------
 * React hook to initialize and manage Phaser Game.
 * Loads levels dynamically from backend API (Option B)
 * and converts them using json-conversion.ts.
 * ------------------------------------------------
 */

import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { loadLevel } from "./json-conversion";
import { LevelData } from "./level-schema";
import { getPhaserConfig } from "./game-config";

export function useGameLoader(levelId: string) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const gameRef = useRef<Phaser.Game | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [levelData, setLevelData] = useState<LevelData | null>(null);

    ////////////////////////////////////
    // 🔹 Fetch Level from Backend
    ////////////////////////////////////
    useEffect(() => {
        let isMounted = true;

        async function fetchLevel() {
            try {
                setLoading(true);
                setError(null);

                // Optionally: cache in sessionStorage for speed
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

                // Validate minimal shape before using
                if (!data.objects || !Array.isArray(data.objects)) {
                    throw new Error("Invalid level data format");
                }

                sessionStorage.setItem(cacheKey, JSON.stringify(data));
                if (isMounted) setLevelData(data);
            } catch (err: any) {
                console.error("Level load error:", err);
                if (isMounted) setError(err.message || "Failed to load level");
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchLevel();
        return () => {
            isMounted = false;
        };
    }, [levelId]);

    ////////////////////////////////////
    // 🔹 Initialize Phaser once data ready
    ////////////////////////////////////
    useEffect(() => {
        if (!containerRef.current || !levelData || error) return;

        // Destroy any old instance first
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
            this.load.image("player", "/assets/player.png");
            this.load.image("platform", "/assets/platform.png");
            this.load.image("goal", "/assets/goal.png");
            this.load.image("enemy", "/assets/enemy.png");
        }

        function createScene(this: Phaser.Scene) {
            if (!levelData) return; // ✅ ensures type-safety
            loadLevel(this, levelData);
        }


        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [levelData, error]);

    ////////////////////////////////////
    // 🔹 Return refs & state
    ////////////////////////////////////
    return {
        containerRef,
        loading,
        error,
    };
}
