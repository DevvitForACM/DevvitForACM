import Phaser from 'phaser';
import { createScrollControls } from '@/game/controls/camera-controls';
import { GRID } from '@/constants/game-constants';

import { createGrid, drawGrid } from './create-scene/grid';
import { createAnimations } from './create-scene/animations';
import {
  setupKeyboardControls,
  setupTouchControls,
  handleKeyboardScroll,
  calculateResponsiveZoom,
  type CameraControls,
} from './create-scene/controls';
import {
  placeEntity,
  removeEntity,
  clearAllEntities,
  getAllEntities,
  type EntityData,
} from './create-scene/entities';

const GRID_SIZE = GRID.SIZE;

export class CreateScene extends Phaser.Scene {
  public cameraScrollSpeed: number = 0;
  public cameraScrollSpeedY: number = 0;
  private placedEntities: Map<string, Phaser.GameObjects.Container>;
  private occupiedCells: Set<string>;
  private gridGraphics?: Phaser.GameObjects.Graphics | undefined;
  private currentWidth: number = 0;
  private currentHeight: number = 0;
  private lastGridOffsetX: number = -1;
  private lastGridOffsetY: number = -1;
  private coordinateText?: Phaser.GameObjects.Text | undefined;
  private controls!: CameraControls;
  private isMobile: boolean = false;
  private isDragging: boolean = false;
  private lastDragGridX: number = -999;
  private lastDragGridY: number = -999;

  constructor() {
    super({ key: 'CreateScene' });
    this.placedEntities = new Map();
    this.occupiedCells = new Set();
  }

  preload(): void {
    const base = '/';
    this.load.image('spring', `${base}spring.png`);
    this.load.image('spike', `${base}spikes.png`);
    this.load.image('grass', `${base}grass.png`);
    this.load.image('ground', `${base}ground.png`);
    this.load.image('grass-filler', `${base}grass-filler.png`);
    this.load.image('lava', `${base}lava.png`);
    this.load.image('door', `${base}door.png`);

    for (let i = 0; i <= 4; i++) {
      this.load.image(`player-idle-${i}`, `${base}idle/${i}.png`);
      this.load.image(`player-jump-${i}`, `${base}jump/${i}.png`);
      this.load.image(`coin-${i}`, `${base}coin/${i}.png`);
      this.load.image(`enemy-${i}`, `${base}enemy/${i}.png`);
    }

    for (let i = 0; i <= 2; i++) {
      this.load.image(`player-run-${i}`, `${base}run/${i}.png`);
    }
  }

  public create(): void {
    this.gridGraphics = createGrid(this);
    this.drawGridInternal();

    // Position camera at origin
    this.cameras.main.scrollX = 0;
    this.cameras.main.scrollY = 0;
    
    const zoom = calculateResponsiveZoom(this.cameras.main);
    this.cameras.main.setZoom(zoom);
    this.cameras.main.roundPixels = true;

    // Set camera bounds: limited editing area
    const maxWorldWidth = 3000; // Allow scrolling right
    const maxWorldHeight = 2000; // Allow scrolling up
    // Bounds: left edge at x=0, top edge at y=-maxWorldHeight, width and height define the area
    this.cameras.main.setBounds(0, -maxWorldHeight, maxWorldWidth, maxWorldHeight);

    this.input.mouse?.disableContextMenu();
    this.scale.on('resize', this.handleResize, this);

    this.isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) ||
      ('ontouchstart' in window && navigator.maxTouchPoints > 0);

    if (!this.isMobile) {
      this.controls = setupKeyboardControls(this);
    } else {
      this.controls = {
        touchStartX: 0,
        touchStartY: 0,
        isSwiping: false,
        initialPinchDistance: 0,
        initialZoom: 1,
      };
      setupTouchControls(this, this.controls);
    }

    createScrollControls(this);
    createAnimations(this);

    this.coordinateText = this.add.text(10, 70, '', {
      fontSize: '14px',
      color: '#333',
      backgroundColor: '#fff',
      padding: { x: 8, y: 4 },
    });
    this.coordinateText.setScrollFactor(0);
    this.coordinateText.setDepth(1000);
    this.coordinateText.setVisible(false);
    this.coordinateText.setData('isUIElement', true);

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.handlePointerMove(pointer);
    });

    this.input.on('pointerout', () => {
      if (this.coordinateText) {
        this.coordinateText.setVisible(false);
      }
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handlePointerDown(pointer);
    });

    // Handle scene wake event (when resumed from pause)
    this.events.on('wake', () => {
      console.log('[CreateScene] Scene woke up (resumed)');
      
      // Reset camera scroll speeds that might have been set by controls
      this.cameraScrollSpeed = 0;
      this.cameraScrollSpeedY = 0;
      
      // Re-enable input
      if (this.input) {
        this.input.enabled = true;
      }
      
      // Re-attach pointer event listeners (they might have been lost)
      this.input.off('pointermove');
      this.input.off('pointerout');
      this.input.off('pointerdown');
      
      this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        this.handlePointerMove(pointer);
      });
      
      this.input.on('pointerout', () => {
        if (this.coordinateText) {
          this.coordinateText.setVisible(false);
        }
      });
      
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        this.handlePointerDown(pointer);
      });
      
      // Emit custom event so React hooks can respond
      this.events.emit('scene-resumed');
    });

    // Handle scene pause event
    this.events.on('pause', () => {
      console.log('[CreateScene] Scene paused');
      // Reset any ongoing interactions
      this.isDragging = false;
      this.lastDragGridX = -999;
      this.lastDragGridY = -999;
    });
  }

  private drawGridInternal(): void {
    if (!this.gridGraphics || !this.cameras?.main) return;
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    if (!width || !height || width <= 0 || height <= 0) return;

    const result = drawGrid(this.gridGraphics, this.cameras.main);
    this.currentWidth = width;
    this.currentHeight = height;
    this.lastGridOffsetX = result.offsetX;
    this.lastGridOffsetY = result.offsetY;
  }

  private handleResize(): void {
    if (!this.cameras?.main) return;
    const newWidth = this.cameras.main.width;
    const newHeight = this.cameras.main.height;
    if (!newWidth || !newHeight || newWidth <= 0 || newHeight <= 0) return;
    if (newWidth === this.currentWidth && newHeight === this.currentHeight)
      return;
    this.drawGridInternal();
    const zoom = calculateResponsiveZoom(this.cameras.main);
    this.cameras.main.setZoom(zoom);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    const wx = pointer.worldX;
    const wy = pointer.worldY;
    const gridX = Math.floor(wx / GRID_SIZE);
    const gridY = -Math.floor(wy / GRID_SIZE) - 1;

    if (this.coordinateText) {
      this.coordinateText.setText(`Grid: (${gridX}, ${gridY})`);
      this.coordinateText.setVisible(true);
    }

    // Handle drag-to-place/delete
    if (this.isDragging && pointer.isDown) {
      if (gridX !== this.lastDragGridX || gridY !== this.lastDragGridY) {
        this.lastDragGridX = gridX;
        this.lastDragGridY = gridY;
        this.placeAtGrid(gridX, gridY);
      }
    }
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const hitObjects = this.input.hitTestPointer(pointer);
    const hitUI = hitObjects.some(
      (obj: any) =>
        obj.getData &&
        (obj.getData('isScrollControl') || obj.getData('isUIElement'))
    );
    const hitEntity = hitObjects.some(
      (obj: any) => obj.getData && obj.getData('entityId')
    );

    if (hitUI || this.controls.isSwiping || hitEntity) return;

    const wx = pointer.worldX;
    const wy = pointer.worldY;
    const gridX = Math.floor(wx / GRID_SIZE);
    const gridY = -Math.floor(wy / GRID_SIZE) - 1;
    this.placeAtGrid(gridX, gridY);
  }

  public placeEntity(data: EntityData): void {
    placeEntity(
      this,
      data,
      this.placedEntities,
      this.occupiedCells,
      () => this.events.emit('entity-placed'),
      (entityId) => this.removeEntity(entityId),
      (gridX, gridY, newType) => this.replaceEntity(gridX, gridY, newType)
    );
  }

  private removeEntity(entityId: string): void {
    removeEntity(entityId, this.placedEntities, this.occupiedCells, () =>
      this.events.emit('entity-removed')
    );
  }

  private replaceEntity(gridX: number, gridY: number, newType: string): void {
    const entityTypes = this.registry.get('entityTypes') as
      | Record<string, { name: string; color: string; icon: string }>
      | undefined;

    if (!entityTypes) return;

    let key = newType;
    if (!entityTypes[key]) {
      const match = Object.keys(entityTypes).find(
        (k) => k.toLowerCase().trim() === key.toLowerCase().trim()
      );
      if (match) key = match;
    }

    const info = entityTypes[key];
    if (info) {
      this.placeEntity({
        type: key,
        gridX,
        gridY,
        name: info.name,
        color: info.color,
        icon: info.icon,
      });
    }
  }

  public setSelectedEntityType(type: string | null): void {
    const cur = this.registry.get('selectedEntityType') as string | null;
    if (cur !== type) this.registry.set('selectedEntityType', type);
  }

  public clearAllEntities(): void {
    clearAllEntities(this, this.placedEntities, this.occupiedCells, () =>
      this.events.emit('entities-cleared')
    );
  }

  public getAllEntities(): EntityData[] {
    return getAllEntities(this.placedEntities);
  }

  public restoreSnapshot(snapshot: EntityData[]): void {
    if (!Array.isArray(snapshot)) return;

    this.clearAllEntities();

    const entityTypes = this.registry.get('entityTypes') as
      | Record<string, { name: string; color: string; icon: string }>
      | undefined;

    for (const e of snapshot) {
      const keyLow = String(e.type ?? '')
        .toLowerCase()
        .trim();
      let matchedKey = keyLow;
      if (entityTypes) {
        const match = Object.keys(entityTypes).find(
          (k) => k.toLowerCase().trim() === keyLow
        );
        if (match) matchedKey = match;
      }
      const info = entityTypes ? entityTypes[matchedKey] : undefined;
      const entityData: EntityData = {
        type: matchedKey,
        gridX: e.gridX,
        gridY: e.gridY,
      };
      if (info?.name) entityData.name = info.name;
      if (info?.color) entityData.color = info.color;
      if (info?.icon) entityData.icon = info.icon;
      this.placeEntity(entityData);
    }
  }

  private hasType(type: string): boolean {
    const t = type.toLowerCase().trim();
    for (const [, c] of this.placedEntities) {
      const ct = String(c.getData('entityType') ?? '')
        .toLowerCase()
        .trim();
      if (ct === t) return true;
    }
    return false;
  }

  public override update(_time: number, delta: number): void {
    if (this.cameras?.main) {
      if (!this.isMobile) {
        handleKeyboardScroll(this.cameras.main, this.controls, delta);
      }

      this.cameras.main.scrollX += this.cameraScrollSpeed * (delta / 16);
      this.cameras.main.scrollY += this.cameraScrollSpeedY * (delta / 16);

      // Camera bounds are enforced by Phaser via setBounds()
      // Left edge (x=0) and bottom edge (y=0) act as walls

      const cam = this.cameras.main;
      const offX = ((-cam.scrollX % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
      const offY = ((-cam.scrollY % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
      if (offX !== this.lastGridOffsetX || offY !== this.lastGridOffsetY) {
        this.drawGridInternal();
      }
    }
  }

  /**
   * Find the entity that occupies a given cell.
   * Handles both regular entities and 2-cell entities (player/door).
   * Returns the entity ID if found, null otherwise.
   */
  private findEntityAtCell(gridX: number, gridY: number): string | null {
    for (const [entityId, container] of this.placedEntities) {
      const entityGridX = container.getData('gridX');
      const entityGridY = container.getData('gridY');
      
      // Check if this cell matches the entity's primary cell
      if (entityGridX === gridX && entityGridY === gridY) {
        return entityId;
      }
      
      // Check if this cell matches the entity's extra cell (for 2-cell entities like player/door)
      const extraCell = container.getData('occupiesExtraCell');
      if (extraCell === `${gridX},${gridY}`) {
        return entityId;
      }
    }
    return null;
  }

  private placeAtGrid(gridX: number, gridY: number): void {
    if (gridX < 0) return;

    const entityTypes = this.registry.get('entityTypes') as
      | Record<string, { name: string; color: string; icon: string }>
      | undefined;
    const sel =
      (this.registry.get('selectedEntityType') as string | null) ?? null;
    if (!entityTypes || !sel) return;

    let key = sel;
    if (!entityTypes[key]) {
      const match = Object.keys(entityTypes).find(
        (k) => k.toLowerCase().trim() === key.toLowerCase().trim()
      );
      if (match) key = match;
    }
    const info = entityTypes[key];
    if (!info) return;

    const low = key.toLowerCase().trim();
    
    // Check if we're trying to place a player or door when one already exists
    if ((low === 'player' || low === 'door') && this.hasType(low)) return;

    // Remove any existing entity at the target cell (handles both 1-cell and 2-cell entities)
    // If a 2-cell entity (player/door) is found, the entire entity will be removed
    const cellKey = `${gridX},${gridY}`;
    if (this.occupiedCells.has(cellKey)) {
      const existingEntityId = this.findEntityAtCell(gridX, gridY);
      if (existingEntityId) {
        this.removeEntity(existingEntityId);
      }
    }

    // For 2-cell entities (player/door), also check and clear the cell above
    // This ensures the entire area is clear before placing the new entity
    if (low === 'player' || low === 'door') {
      const cellAbove = `${gridX},${gridY + 1}`;
      if (this.occupiedCells.has(cellAbove)) {
        const existingEntityId = this.findEntityAtCell(gridX, gridY + 1);
        if (existingEntityId) {
          this.removeEntity(existingEntityId);
        }
      }
    }

    this.placeEntity({
      type: key,
      gridX,
      gridY,
      name: info.name,
      color: info.color,
      icon: info.icon,
    });
  }

  public shutdown(): void {
    console.log('[CreateScene] shutdown() called');
    
    // Only clean up scale and input listeners
    // Keep custom events (entity-placed, entity-removed, etc.) for React hooks
    this.scale.off('resize', this.handleResize, this);
    this.input.off('pointermove');
    this.input.off('pointerout');
    this.input.off('pointerdown');
    this.input.off('pointerup');
    
    // Remove specific events, not all
    this.events.off('wake');
    this.events.off('pause');
    
    // Kill all tweens
    this.tweens.killAll();
  }

  public destroy(): void {
    this.shutdown();
    
    if (this.gridGraphics && this.gridGraphics.active)
      this.gridGraphics.destroy();
    this.gridGraphics = undefined;
    if (this.coordinateText && this.coordinateText.active)
      this.coordinateText.destroy();
    this.coordinateText = undefined;
    this.placedEntities.forEach((container) => {
      if (container && container.active) container.destroy();
    });
    this.placedEntities.clear();
    this.occupiedCells.clear();
  }
}
