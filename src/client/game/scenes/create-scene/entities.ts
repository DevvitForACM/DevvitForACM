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
    sprite.setDisplaySize(GRID_SIZE - 4, GRID_SIZE - 4);
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
    const sprite = scene.add.image(-GRID_SIZE / 2, -GRID_SIZE / 2, 'door');
    sprite.setOrigin(0, 0);
    sprite.setDisplaySize(GRID_SIZE, GRID_SIZE);
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

  const entityId = container.getData('entityId') as string;
  const gridX = container.getData('gridX') as number;
  const gridY = container.getData('gridY') as number;
  const currentEntityType = container.getData('entityType') as string;

  const sel =
    (scene.registry.get('selectedEntityType') as string | null) ?? null;
  const entityTypes = scene.registry.get('entityTypes') as
    | Record<string, { name: string; color: string; icon: string }>
    | undefined;

  const isRightClick = pointer.rightButtonDown() || pointer.button === 2;

  if (isRightClick) {
    if (sel && entityTypes) {
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
    } else {
      onRemove(entityId);
    }
    return;
  }

  if (!sel) {
    onRemove(entityId);
  } else if (entityTypes) {
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
  placedEntities.forEach((c) => {
    if (c && c.active) c.destroy();
  });

  scene.children.list.forEach((child) => {
    const c = child as Phaser.GameObjects.Container;
    if (c?.getData && c.getData('entityId')) {
      if (c.active) c.destroy();
    }
  });

  placedEntities.clear();
  occupiedCells.clear();
  onEntitiesCleared();
}

export function getAllEntities(
  placedEntities: Map<string, Phaser.GameObjects.Container>
): EntityData[] {
  const entities: EntityData[] = [];
  placedEntities.forEach((c) => {
    entities.push({
      type: c.getData('entityType'),
      gridX: c.getData('gridX'),
      gridY: c.getData('gridY'),
    });
  });
  return entities;
}
