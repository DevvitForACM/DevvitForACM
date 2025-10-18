import PhaserContainer from '@/components/phaser-container';
import { createBlankCanvasConfig } from '@/config/game-config';

export default function Create() {
  const config = createBlankCanvasConfig('#f6f7f8');

  return (
    <main className="w-screen h-screen overflow-hidden bg-gray-50">
      <PhaserContainer config={config} />
    </main>
  );
}
