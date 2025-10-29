// Import all assets as URL modules so Vite bundles them
export const ASSETS = {
  // Base assets
  spring: new URL('../../assets/spring.png', import.meta.url).href,
  spikes: new URL('../../assets/spikes.png', import.meta.url).href,
  grass: new URL('../../assets/grass.png', import.meta.url).href,
  ground: new URL('../../assets/ground.png', import.meta.url).href,
  lava: new URL('../../assets/lava.png', import.meta.url).href,
  door: new URL('../../assets/door.png', import.meta.url).href,

  // Player Idle
  'idle-0': new URL('../../assets/idle/0.png', import.meta.url).href,
  'idle-1': new URL('../../assets/idle/1.png', import.meta.url).href,
  'idle-2': new URL('../../assets/idle/2.png', import.meta.url).href,
  'idle-3': new URL('../../assets/idle/3.png', import.meta.url).href,
  'idle-4': new URL('../../assets/idle/4.png', import.meta.url).href,

  // Player Jump
  'jump-0': new URL('../../assets/jump/0.png', import.meta.url).href,
  'jump-1': new URL('../../assets/jump/1.png', import.meta.url).href,
  'jump-2': new URL('../../assets/jump/2.png', import.meta.url).href,
  'jump-3': new URL('../../assets/jump/3.png', import.meta.url).href,
  'jump-4': new URL('../../assets/jump/4.png', import.meta.url).href,

  // Player Run
  'run-0': new URL('../../assets/run/0.png', import.meta.url).href,
  'run-1': new URL('../../assets/run/1.png', import.meta.url).href,
  'run-2': new URL('../../assets/run/2.png', import.meta.url).href,

  // Coins
  'coin-0': new URL('../../assets/coin/0.png', import.meta.url).href,
  'coin-1': new URL('../../assets/coin/1.png', import.meta.url).href,
  'coin-2': new URL('../../assets/coin/2.png', import.meta.url).href,
  'coin-3': new URL('../../assets/coin/3.png', import.meta.url).href,
  'coin-4': new URL('../../assets/coin/4.png', import.meta.url).href,

  // Enemy
  'enemy-0': new URL('../../assets/enemy/0.png', import.meta.url).href,
  'enemy-1': new URL('../../assets/enemy/1.png', import.meta.url).href,
  'enemy-2': new URL('../../assets/enemy/2.png', import.meta.url).href,
  'enemy-3': new URL('../../assets/enemy/3.png', import.meta.url).href,
} as const;
