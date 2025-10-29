import {
  LEVEL_SCHEMA_VERSION,
  LevelObjectType,
  PhysicsType,
  type LevelData,
  type LevelObject,
} from '@/game/level/level-schema';
import { GRID, ENTITY_CONFIG } from '@/constants/game-constants';
import { convertEditorGridToNewSystem } from './utils';

interface EntityData {
  type: string;
  gridX: number;
  gridY: number;
  [key: string]: any;
}

export function buildLevelData(
  entities: EntityData[],
  options: {
    name?: string;
    isPublic?: boolean;
    useGridPositions?: boolean;
  } = {}
): LevelData {
  const groundOrDirt = entities.filter((e: any) => {
    const t = String(e.type).toLowerCase().trim();
    return t === 'ground' || t === 'grass' || t === 'tile' || t === 'dirt';
  });

  const maxGridY = Math.max(
    0,
    ...groundOrDirt.map((g: any) => g.gridY),
    ...entities.map((e: any) => e.gridY)
  );

  const width = Math.max(
    1000,
    ...groundOrDirt.map((g: any) => (g.gridX + 2) * GRID.SIZE)
  );
  const height = Math.max(600, (maxGridY + 3) * GRID.SIZE);

  const toY = (gridY: number) => height - gridY * GRID.SIZE - GRID.SIZE / 2;

  const objects: LevelObject[] = [];

  const playerEnt = entities.find(
    (e: any) => String(e.type).toLowerCase().trim() === 'player'
  );
  const playerX = playerEnt ? playerEnt.gridX * GRID.SIZE + GRID.SIZE / 2 : 200;
  // Player is 100px tall (vs 60px for tiles), so adjust Y by (100/2 - 60/2) = 20px
  const playerY = playerEnt
    ? toY(playerEnt.gridY) - 20
    : Math.max(200, height - 100);

  objects.push({
    id: 'player_1',
    type: LevelObjectType.Player,
    position: { x: playerX, y: playerY },
    physics: { type: PhysicsType.Dynamic },
  });

  entities.forEach((e: any, idx: number) => {
    const t = String(e.type).toLowerCase().trim();
    if (
      t === 'spring' ||
      t === 'spike' ||
      t === 'coin' ||
      t === 'enemy' ||
      t === 'lava'
    ) {
      const x = e.gridX * GRID.SIZE + GRID.SIZE / 2;
      const y = toY(e.gridY);
      let levelType: LevelObjectType = LevelObjectType.Spring;
      let scale = undefined;
      let visual = undefined;

      if (t === 'spike') levelType = LevelObjectType.Spike;
      else if (t === 'coin') levelType = LevelObjectType.Coin;
      else if (t === 'enemy') levelType = LevelObjectType.Enemy;
      else if (t === 'lava') {
        levelType = LevelObjectType.Obstacle;
        scale = {
          x: GRID.SIZE / ENTITY_CONFIG.PLATFORM_WIDTH,
          y: GRID.SIZE / ENTITY_CONFIG.PLATFORM_HEIGHT,
        };
        visual = { texture: 'lava' };
      }

      const obj: any = {
        id: `${t}_${idx + 1}`,
        type: levelType,
        position: { x, y },
      };
      if (scale) obj.scale = scale;
      if (visual) obj.visual = visual;
      objects.push(obj);
    }
  });

  const doorEnt = entities.find(
    (e: any) => String(e.type).toLowerCase().trim() === 'door'
  );
  if (doorEnt) {
    if (options.useGridPositions) {
      const doorGridX = doorEnt.gridX;
      const doorGridY = convertEditorGridToNewSystem(doorEnt.gridY, height);
      objects.push({
        id: 'goal_1',
        type: LevelObjectType.Goal,
        position: { x: 0, y: 0 },
        gridPosition: { x: doorGridX, y: doorGridY },
        visual: { texture: 'door' },
      });
    } else {
      // Door is 100px tall (vs 60px for tiles), so adjust Y by (100/2 - 60/2) = 20px
      objects.push({
        id: 'goal_1',
        type: LevelObjectType.Goal,
        position: {
          x: doorEnt.gridX * GRID.SIZE + GRID.SIZE / 2,
          y: toY(doorEnt.gridY) - 20,
        },
        visual: { texture: 'door' },
      });
    }
  }

  groundOrDirt.forEach((g: any, i: number) => {
    const t = String(g.type).toLowerCase().trim();
    const texture = t === 'dirt' ? 'ground' : 'grass';

    if (options.useGridPositions) {
      const newGridX = g.gridX;
      const newGridY = convertEditorGridToNewSystem(g.gridY, height);
      objects.push({
        id: `platform_${i + 1}`,
        type: LevelObjectType.Platform,
        position: { x: 0, y: 0 },
        gridPosition: { x: newGridX, y: newGridY },
        scale: {
          x: GRID.SIZE / ENTITY_CONFIG.PLATFORM_WIDTH,
          y: GRID.SIZE / ENTITY_CONFIG.PLATFORM_HEIGHT,
        },
        physics: { type: PhysicsType.Static, isCollidable: true },
        visual: { texture },
      });
    } else {
      objects.push({
        id: `platform_${i + 1}`,
        type: LevelObjectType.Platform,
        position: {
          x: g.gridX * GRID.SIZE + GRID.SIZE / 2,
          y: toY(g.gridY),
        },
        scale: {
          x: GRID.SIZE / ENTITY_CONFIG.PLATFORM_WIDTH,
          y: GRID.SIZE / ENTITY_CONFIG.PLATFORM_HEIGHT,
        },
        physics: { type: PhysicsType.Static, isCollidable: true },
        visual: { texture },
      });
    }
  });

  return {
    version: LEVEL_SCHEMA_VERSION,
    name: options.name || 'Editor Level',
    settings: {
      gravity: { x: 0, y: 1 },
      backgroundColor: '#87CEEB',
      bounds: { width, height },
    },
    objects,
  };
}
