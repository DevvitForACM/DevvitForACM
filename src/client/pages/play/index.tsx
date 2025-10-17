import PhaserContainer from '@/components/phaser-container';
import { gameConfig } from '@/lib/game-config';

export default function Play() {
  return (
    <main className="w-screen h-screen bg-black overflow-hidden">
      <PhaserContainer config={gameConfig} />
    </main>
  );
}