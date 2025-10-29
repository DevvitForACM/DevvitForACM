export interface EntityTypeData {
  name: string;
  icon: string;
  color: string;
}

export interface EntityType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const ENTITY_TYPES_DATA: Record<string, EntityTypeData> = {
  player: { name: 'Player', icon: '🧍', color: '#22c55e' },
  enemy: { name: 'Enemy', icon: '👾', color: '#ef4444' },
  spike: { name: 'Spike', icon: '🔺', color: '#ff4500' },
  spring: { name: 'Spring', icon: '🟢', color: '#00ff00' },
  ground: { name: 'Grass', icon: '🌿', color: '#4ade80' },
  dirt: { name: 'Dirt', icon: '🟫', color: '#a16207' },
  lava: { name: 'Lava', icon: '🔥', color: '#f97316' },
  coin: { name: 'Coin', icon: '💰', color: '#eab308' },
  door: { name: 'Door', icon: '🚪', color: '#8b5cf6' },
};

export const ENTITY_TYPES: EntityType[] = [
  { id: 'player', name: 'Player', icon: '🧍', color: '#22c55e' },
  { id: 'enemy', name: 'Enemy', icon: '👾', color: '#ef4444' },
  { id: 'spike', name: 'Spike', icon: '🔺', color: '#ff4500' },
  { id: 'spring', name: 'Spring', icon: '🟢', color: '#00ff00' },
  { id: 'ground', name: 'Grass', icon: '🌿', color: '#4ade80' },
  { id: 'dirt', name: 'Dirt', icon: '🟫', color: '#a16207' },
  { id: 'lava', name: 'Lava', icon: '🔥', color: '#f97316' },
  { id: 'coin', name: 'Coin', icon: '💰', color: '#eab308' },
  { id: 'door', name: 'Door', icon: '🚪', color: '#8b5cf6' },
];

