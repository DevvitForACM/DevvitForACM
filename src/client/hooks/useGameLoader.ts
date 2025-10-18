import { useState, useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from '../config/game-config';
import type { LevelConfig } from '../game/level/level-types';

export interface GameLoaderState {
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  game: Phaser.Game | null;
}

export interface GameLoaderActions {
  loadGame: (level: LevelConfig) => Promise<void>;
  destroyGame: () => void;
  restartGame: () => Promise<void>;
}

export function useGameLoader(): GameLoaderState & GameLoaderActions {
  const [state, setState] = useState<GameLoaderState>({
    isLoading: false,
    isLoaded: false,
    error: null,
    game: null,
  });

  const gameRef = useRef<Phaser.Game | null>(null);
  const currentLevelRef = useRef<LevelConfig | null>(null);

  const loadGame = async (level: LevelConfig): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Destroy existing game if it exists
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }

      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create new game
      const gameConfig = createGameConfig(level);
      const game = new Phaser.Game(gameConfig);
      
      gameRef.current = game;
      currentLevelRef.current = level;

      setState(prev => ({
        ...prev,
        isLoading: false,
        isLoaded: true,
        game: game,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load game';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  };

  const destroyGame = (): void => {
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
      currentLevelRef.current = null;
    }

    setState({
      isLoading: false,
      isLoaded: false,
      error: null,
      game: null,
    });
  };

  const restartGame = async (): Promise<void> => {
    if (currentLevelRef.current) {
      await loadGame(currentLevelRef.current);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      destroyGame();
    };
  }, []);

  return {
    ...state,
    loadGame,
    destroyGame,
    restartGame,
  };
}