import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { MainScene } from '../game/MainScene';

/****
 * Responsive Phaser canvas that stretches to its parent container.
 * - Uses Scale.RESIZE so the game always matches the container size
 * - Auto-centers the camera
 */
export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const parent = containerRef.current;
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent,
      backgroundColor: '#0f172a',
      // Width/height are ignored in RESIZE mode; set initial fallback
      width: parent.clientWidth || 360,
      height: parent.clientHeight || 640,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 900 },
          debug: false,
        },
      },
      scene: [MainScene],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}