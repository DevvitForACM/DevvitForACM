import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

interface PhaserContainerProps {
  config: Phaser.Types.Core.GameConfig;
  className?: string;
}

/**
 * Mounts a Phaser game instance safely inside a React component.
 * Cleans up on unmount and prevents duplicate game creation.
 */
export default function PhaserContainer({ config, className }: PhaserContainerProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerId = (config.parent as string) || 'phaser-game-container';

  useEffect(() => {
    const container = document.getElementById(containerId);

    if (!container) {
      console.error(`[PhaserContainer] No container found with ID '${containerId}'`);
      return;
    }

    if (!gameRef.current) {
      try {
        gameRef.current = new Phaser.Game(config);
        console.log('[PhaserContainer] Game initialized.');
      } catch (error) {
        console.error('[PhaserContainer] Failed to initialize game:', error);
      }
    }

    return () => {
      if (gameRef.current) {
        console.log('[PhaserContainer] Cleaning up Phaser instance.');
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [config, containerId]);

  return (
    <div
      id={containerId}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
      }}
    />
  );
}
