import PhaserContainer from '@/components/phaser-container';
import { getPhaserConfig} from '@/config/game-config';


export default function Play() {
  return (
    <main className="w-screen h-screen bg-black overflow-hidden">
      <PhaserContainer config={getPhaserConfig()} />
    </main>
  );
}