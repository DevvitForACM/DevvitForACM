import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

interface PhaserContainerProps {
  config: Phaser.Types.Core.GameConfig;
  className?: string;
}

export default function PhaserContainer({
  config,
  className,
}: PhaserContainerProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerId = config.parent as string;

  useEffect(() => {
    const initGame = () => {
      const container = document.getElementById(containerId);
      if (!gameRef.current && container) {
        gameRef.current = new Phaser.Game(config);
        (window as any).game = gameRef.current;
      }
    };

    const timer = setTimeout(initGame, 50);

    return () => {
      clearTimeout(timer);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
        (window as any).game = null;
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