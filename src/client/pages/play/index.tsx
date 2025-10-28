import PhaserContainer from '@/components/phaser-container';
import { getPhaserConfigWithLevelName } from '@/config/game-config';

const CURRENT_LEVEL = 'dummy-level-7';

export default function Play() {
  const config = getPhaserConfigWithLevelName(CURRENT_LEVEL);

  return (
    <main className="w-screen h-screen overflow-hidden">
      <PhaserContainer config={config} />
    </main>
  );
}
