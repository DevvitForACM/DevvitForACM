// Import all assets as URL modules so Vite bundles them
export const ASSETS = {
  // Base assets
  Spring: new URL('../../assets/Spring.png', import.meta.url).href,
  Spikes: new URL('../../assets/Spikes.png', import.meta.url).href,
  Grass: new URL('../../assets/Grass.png', import.meta.url).href,
  Ground: new URL('../../assets/Ground.png', import.meta.url).href,
  'Grass-filler': new URL('../../assets/Grass-filler.png', import.meta.url).href,
  Lava: new URL('../../assets/Lava.png', import.meta.url).href,
  'Lava-filler': new URL('../../assets/Lava-filler.png', import.meta.url).href,
  Door: new URL('../../assets/Door.png', import.meta.url).href,

  // Player Idle
  'Idle/0': new URL('../../assets/Idle/0.png', import.meta.url).href,
  'Idle/1': new URL('../../assets/Idle/1.png', import.meta.url).href,
  'Idle/2': new URL('../../assets/Idle/2.png', import.meta.url).href,
  'Idle/3': new URL('../../assets/Idle/3.png', import.meta.url).href,
  'Idle/4': new URL('../../assets/Idle/4.png', import.meta.url).href,

  // Player Jump
  'Jump/0': new URL('../../assets/Jump/0.png', import.meta.url).href,
  'Jump/1': new URL('../../assets/Jump/1.png', import.meta.url).href,
  'Jump/2': new URL('../../assets/Jump/2.png', import.meta.url).href,
  'Jump/3': new URL('../../assets/Jump/3.png', import.meta.url).href,
  'Jump/4': new URL('../../assets/Jump/4.png', import.meta.url).href,

  // Coins
  'Coin/0': new URL('../../assets/Coin/0.png', import.meta.url).href,
  'Coin/1': new URL('../../assets/Coin/1.png', import.meta.url).href,
  'Coin/2': new URL('../../assets/Coin/2.png', import.meta.url).href,
  'Coin/3': new URL('../../assets/Coin/3.png', import.meta.url).href,
  'Coin/4': new URL('../../assets/Coin/4.png', import.meta.url).href,
} as const;
