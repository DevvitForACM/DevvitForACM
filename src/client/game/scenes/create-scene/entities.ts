import Phaser from 'phaser';
import { GRID } from '@/constants/game-constants';

const GRID_SIZE = GRID.SIZE;

export interface EntityData {
  type: string;
  gridX: number;
  gridY: number;
  name?: string;
  color?: string;
  icon?: string;
  isBaseline?: boolean;
}

export function placeEntity(
  scene: Phaser.Scene,
  data: EntityData,
  placedEntities: Map<string, Phaser.GameObjects.Container>,
  occupiedCells: Set<string>,
  onEntityPlaced: () => void,
  onRemoveEntity: (entityId: string) => void,
  onReplaceEntity: (gridX: number, gridY: number, newType: string) => void
): void {
  const pixelX = Math.round(data.gridX * GRID_SIZE + GRID_SIZE / 2);
  const pixelY = Math.round(-(data.gridY + 1) * GRID_SIZE + GRID_SIZE / 2);

  const container = scene.add.container(pixelX, pixelY);
  const t = String(data.type).toLowerCase().trim();

  createEntityVisual(scene, container, t, pixelY);

  container.setSize(GRID_SIZE, GRID_SIZE);
  container.setInteractive();
  container.setData('isBaseline', !!data.isBaseline);

  container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    handleEntityClick(
      pointer,
      container,
      scene,
      onRemoveEntity,
      onReplaceEntity
    );
  });

  const entityId = `${data.type}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  container.setData('entityId', entityId);
  container.setData('gridX', data.gridX);
  container.setData('gridY', data.gridY);
  container.setData('entityType', data.type);

  placedEntities.set(entityId, container);
  occupiedCells.add(`${data.gridX},${data.gridY}`);
  
  // Player and door occupy 2 cells vertically (current cell and the one above)
  if (t === 'player' || t === 'door') {
    occupiedCells.add(`${data.gridX},${data.gridY + 1}`);
    container.setData('occupiesExtraCell', `${data.gridX},${data.gridY + 1}`);
  }
  
  onEntityPlaced();
}

function createEntityVisual(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  type: string,
  pixelY: number
): void {
  if (type === 'spike' && scene.textures.exists('spike')) {
    const sprite = scene.add.image(0, 0, 'spike');
    sprite.setDisplaySize(GRID_SIZE - 4, GRID_SIZE - 4);
    container.add(sprite);
  } else if (type === 'coin' && scene.textures.exists('coin-0')) {
    const sprite = scene.add.sprite(0, 0, 'coin-0');
    sprite.setDisplaySize(GRID_SIZE - 4, GRID_SIZE - 4);
    try {
      sprite.play('coin-spin');
    } catch {}
    container.add(sprite);

    scene.tweens.add({
      targets: container,
      y: pixelY - 3,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  } else if (type === 'spring' && scene.textures.exists('spring')) {
    const sprite = scene.add.image(0, 0, 'spring');
    sprite.setDisplaySize(GRID_SIZE - 4, GRID_SIZE - 4);
    container.add(sprite);
  } else if (type === 'player' && scene.textures.exists('player-idle-0')) {
    const sprite = scene.add.sprite(0, 0, 'player-idle-0');
    // Player is 60x100 (occupies 2 cells vertically)
    sprite.setDisplaySize(GRID_SIZE - 4, 100 - 4);
    // Shift sprite down by half a cell to center it across 2 cells
    sprite.setY(GRID_SIZE / 4);
    try {
      sprite.play('player-idle');
    } catch {}
    container.add(sprite);
  } else if (
    type === 'enemy' &&
    (scene.textures.exists('enemy-1') || scene.textures.exists('enemy-0'))
  ) {
    const startKey = scene.textures.exists('enemy-1') ? 'enemy-1' : 'enemy-0';
    const sprite = scene.add.sprite(0, 0, startKey);
    sprite.setDisplaySize(GRID_SIZE - 4, GRID_SIZE - 4);
    try {
      sprite.play('enemy-walk');
    } catch {}
    container.add(sprite);
  } else if (
    (type === 'ground' || type === 'grass' || type === 'tile') &&
    scene.textures.exists('grass')
  ) {
    const sprite = scene.add.image(-GRID_SIZE / 2, -GRID_SIZE / 2, 'grass');
    sprite.setOrigin(0, 0);
    sprite.setDisplaySize(GRID_SIZE, GRID_SIZE);
    container.add(sprite);
  } else if (
    type === 'dirt' &&
    (scene.textures.exists('ground') || scene.textures.exists('grass-filler'))
  ) {
    const key = scene.textures.exists('ground') ? 'ground' : 'grass-filler';
    const dirt = scene.add.image(-GRID_SIZE / 2, -GRID_SIZE / 2, key);
    dirt.setOrigin(0, 0);
    dirt.setDisplaySize(GRID_SIZE, GRID_SIZE);
    container.add(dirt);
  } else if (type === 'lava' && scene.textures.exists('lava')) {
    const sprite = scene.add.image(-GRID_SIZE / 2, -GRID_SIZE / 2, 'lava');
    sprite.setOrigin(0, 0);
    sprite.setDisplaySize(GRID_SIZE, GRID_SIZE);
    container.add(sprite);
  } else if (type === 'door' && scene.textures.exists('door')) {
    const sprite = scene.add.image(0, 0, 'door');
    sprite.setOrigin(0.5, 0.5);
    // Door is 60x100 (occupies 2 cells vertically)
    sprite.setDisplaySize(GRID_SIZE - 4, 100 - 4);
    // Shift sprite down by half a cell to center it across 2 cells
    sprite.setY(GRID_SIZE / 4);
    container.add(sprite);
  }
}

function handleEntityClick(
  pointer: Phaser.Input.Pointer,
  container: Phaser.GameObjects.Container,
  scene: Phaser.Scene,
  onRemove: (entityId: string) => void,
  onReplace: (gridX: number, gridY: number, newType: string) => void
): void {
  pointer.event?.preventDefault();
  pointer.event?.stopPropagation();

  // Check if entity is baseline (irremovable)
  const isBaseline = container.getData('isBaseline');
  if (isBaseline) {
    // Baseline entities cannot be removed or replaced
    return;
  }

  const entityId = container.getData('entityId') as string;
  const gridX = container.getData('gridX') as number;
  const gridY = container.getData('gridY') as number;
  const currentEntityType = container.getData('entityType') as string;

  const sel =
    (scene.registry.get('selectedEntityType') as string | null) ?? null;

  const isRightClick = pointer.rightButtonDown() || pointer.button === 2;

  // Right-click always deletes
  if (isRightClick) {
    onRemove(entityId);
    return;
  }

  // Left-click with eraser selected deletes
  if (sel === 'eraser') {
    onRemove(entityId);
    return;
  }

  // Left-click with different entity selected replaces
  if (!sel) {
    onRemove(entityId);
  } else {
    const entityTypes = scene.registry.get('entityTypes') as
      | Record<string, { name: string; color: string; icon: string }>
      | undefined;
    
    if (entityTypes) {
      let key = sel;
      if (!entityTypes[key]) {
        const match = Object.keys(entityTypes).find(
          (k) => k.toLowerCase().trim() === key.toLowerCase().trim()
        );
        if (match) key = match;
      }

      const info = entityTypes[key];
      if (info && key.toLowerCase() !== currentEntityType.toLowerCase()) {
        onRemove(entityId);
        onReplace(gridX, gridY, key);
      }
    }
  }
}

export function removeEntity(
  entityId: string,
  placedEntities: Map<string, Phaser.GameObjects.Container>,
  occupiedCells: Set<string>,
  onEntityRemoved: () => void
): void {
  const container = placedEntities.get(entityId);
  if (!container) return;
  const gridX = container.getData('gridX');
  const gridY = container.getData('gridY');
  occupiedCells.delete(`${gridX},${gridY}`);
  
  // Remove extra cell if this entity occupied one (e.g., player)
  const extraCell = container.getData('occupiesExtraCell');
  if (extraCell) {
    occupiedCells.delete(extraCell);
  }
  
  placedEntities.delete(entityId);
  container.destroy();
  onEntityRemoved();
}

export function clearAllEntities(
  scene: Phaser.Scene,
  placedEntities: Map<string, Phaser.GameObjects.Container>,
  occupiedCells: Set<string>,
  onEntitiesCleared: () => void
): void {
  // Remove all non-baseline entities
  const toRemove: string[] = [];
  placedEntities.forEach((c, entityId) => {
    const isBaseline = c.getData('isBaseline');
    if (!isBaseline && c && c.active) {
      c.destroy();
      toRemove.push(entityId);
    }
  });

  toRemove.forEach(id => placedEntities.delete(id));

  scene.children.list.forEach((child) => {
    const c = child as Phaser.GameObjects.Container;
    if (c?.getData && c.getData('entityId') && !c.getData('isBaseline')) {
      if (c.active) c.destroy();
    }
  });

  // Clear occupied cells but preserve baseline cells
  const baselineCells = new Set<string>();
  placedEntities.forEach(c => {
    if (c.getData('isBaseline')) {
      const gridX = c.getData('gridX');
      const gridY = c.getData('gridY');
      baselineCells.add(`${gridX},${gridY}`);
    }
  });

  occupiedCells.clear();
  baselineCells.forEach(cell => occupiedCells.add(cell));
  
  onEntitiesCleared();
}

export function getAllEntities(
  placedEntities: Map<string, Phaser.GameObjects.Container>
): EntityData[] {
  const entities: EntityData[] = [];
  placedEntities.forEach((c) => {
    // Exclude baseline entities from export (they're auto-generated)
    if (!c.getData('isBaseline')) {
      entities.push({
        type: c.getData('entityType'),
        gridX: c.getData('gridX'),
        gridY: c.getData('gridY'),
      });
    }
  });
  return entities;
}

export function createBaselineGrassRow(
  scene: Phaser.Scene,
  placedEntities: Map<string, Phaser.GameObjects.Container>,
  occupiedCells: Set<string>,
  onRemoveEntity: (entityId: string) => void,
  onReplaceEntity: (gridX: number, gridY: number, newType: string) => void,
  numberOfTiles: number = 50 // Default: 50 tiles wide (50 * 60 = 3000px)
): void {
  console.log(`[CreateScene] Creating baseline grass row with ${numberOfTiles} tiles`);
  
  // Create grass platforms at gridY = 0 across the entire width
  for (let gridX = 0; gridX < numberOfTiles; gridX++) {
    const cellKey = `${gridX},0`;
    
    // Skip if already occupied (shouldn't happen but safety check)
    if (occupiedCells.has(cellKey)) {
      continue;
    }

    placeEntity(
      scene,
      {
        type: 'grass',
        gridX: gridX,
        gridY: 0,
        name: 'Grass',
        color: '#22c55e',
        icon: '🟩',
        isBaseline: true, // Mark as irremovable
      },
      placedEntities,
      occupiedCells,
      () => {}, // Don't increment entity count for baseline
      onRemoveEntity,
      onReplaceEntity
    );
  }
  
  console.log('[CreateScene] Baseline grass row created');
}
