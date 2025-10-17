import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

interface PhaserContainerProps {
  config: Phaser.Types.Core.GameConfig;
  className?: string;
}

export default function PhaserContainer({ config, className }: PhaserContainerProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerId = config.parent as string;

  useEffect(() => {
    if (!gameRef.current && document.getElementById(containerId)) {
      gameRef.current = new Phaser.Game(config);
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [config, containerId]);

  return (
    <div
      id={containerId}
      className={className}
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
    />
  );
}