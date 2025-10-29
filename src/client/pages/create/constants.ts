import { ASSETS } from '@/assets-manifest';

export interface EntityTypeData {
  name: string;
  icon?: string;
  color: string;
}

export interface EntityType {
  id: string;
  name: string;
  image: string | null;
  icon?: string;
  color: string;
  bgColor: string;
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
  {
    id: 'eraser',
    name: 'Eraser',
    image: null,
    icon: '🗑️',
    color: '#6b7280',
    bgColor: '#f3f4f6',
  },
  {
    id: 'player',
    name: 'Player',
    image: ASSETS['idle-0'],
    color: '#22c55e',
    bgColor: '#dcfce7',
  },
  {
    id: 'enemy',
    name: 'Enemy',
    image: ASSETS['enemy-1'],
    color: '#ef4444',
    bgColor: '#fee2e2',
  },
  {
    id: 'spike',
    name: 'Spike',
    image: ASSETS.spikes,
    color: '#f97316',
    bgColor: '#ffedd5',
  },
  {
    id: 'spring',
    name: 'Spring',
    image: ASSETS.spring,
    color: '#10b981',
    bgColor: '#d1fae5',
  },
  {
    id: 'ground',
    name: 'Grass',
    image: ASSETS.grass,
    color: '#4ade80',
    bgColor: '#dcfce7',
  },
  {
    id: 'dirt',
    name: 'Dirt',
    image: ASSETS.ground,
    color: '#92400e',
    bgColor: '#fef3c7',
  },
  {
    id: 'lava',
    name: 'Lava',
    image: ASSETS.lava,
    color: '#dc2626',
    bgColor: '#fee2e2',
  },
  {
    id: 'coin',
    name: 'Coin',
    image: ASSETS['coin-0'],
    color: '#eab308',
    bgColor: '#fef9c3',
  },
  {
    id: 'door',
    name: 'Door',
    image: ASSETS.door,
    color: '#8b5cf6',
    bgColor: '#ede9fe',
  },
];

