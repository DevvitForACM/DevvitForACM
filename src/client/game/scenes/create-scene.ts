import Phaser from 'phaser';
import { createScrollControls } from '../controls/camera-controls';

const GRID_SIZE = 32;

export class CreateScene extends Phaser.Scene {
  public cameraScrollSpeed: number = 0;
  private placedEntities: Map<string, Phaser.GameObjects.Container>;
  private occupiedCells: Set<string>;
  private selectedEntityType: string | null;
  private gridGraphics?: Phaser.GameObjects.Graphics | undefined;
  private currentWidth: number = 0;
  private currentHeight: number = 0;
  private lastGridOffsetX: number = -1;
  private lastGridOffsetY: number = -1;

  constructor() {
    super({ key: 'CreateScene' });
    this.placedEntities = new Map();
    this.occupiedCells = new Set();
    this.selectedEntityType = null;
  }

  public create(): void {
    this.drawGrid();

    // Prevent browser context menu so right-click can be used by editor
    this.input.mouse?.disableContextMenu();

    // Resize: redraw grid
    this.scale.on('resize', this.handleResize, this);

    // Map/camera scroll controls (integrated in Create page)
    createScrollControls(this);

    // Placement
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const wx = pointer.worldX;
      const wy = pointer.worldY;
      const gridX = Math.floor(wx / GRID_SIZE);
      const gridY = Math.floor(wy / GRID_SIZE);
      this.placeAtGrid(gridX, gridY, 0);
    });
  }

  private drawGrid(): void {
    if (!this.cameras?.main) return;
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    if (!width || !height || width <= 0 || height <= 0) return;

    if (!this.gridGraphics || !this.gridGraphics.active) {
      this.gridGraphics = this.add.graphics();
      if (!this.gridGraphics) return;
      this.gridGraphics.setScrollFactor(0); // screen-space grid
      this.gridGraphics.setDepth(-1);
    }

    this.gridGraphics.clear();
    this.gridGraphics.lineStyle(1, 0xe5e7eb, 0.5);

    // Offset grid lines by camera scroll to align with world coordinates
    const cam = this.cameras.main;
    const scrollX = cam.scrollX;
    const scrollY = cam.scrollY;
    const offX = ((-scrollX % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
    const offY = ((-scrollY % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
    for (let x = offX; x <= width + GRID_SIZE; x += GRID_SIZE) {
      this.gridGraphics.lineBetween(x, 0, x, height);
    }
    for (let y = offY; y <= height + GRID_SIZE; y += GRID_SIZE) {
      this.gridGraphics.lineBetween(0, y, width, y);
    }

    this.currentWidth = width;
    this.currentHeight = height;
    this.lastGridOffsetX = offX;
    this.lastGridOffsetY = offY;
  }

  private handleResize(): void {
    if (!this.cameras?.main) return;
    const newWidth = this.cameras.main.width;
    const newHeight = this.cameras.main.height;
    if (!newWidth || !newHeight || newWidth <= 0 || newHeight <= 0) return;
    if (newWidth === this.currentWidth && newHeight === this.currentHeight) return;
    this.drawGrid();
  }

  private placeEntity(data: any): void {
    const pixelX = data.gridX * GRID_SIZE + GRID_SIZE / 2;
    const pixelY = data.gridY * GRID_SIZE + GRID_SIZE / 2;

    const container = this.add.container(pixelX, pixelY);
    const colorValue = parseInt(String(data.color).replace('#', ''), 16);
    const rect = this.add.rectangle(0, 0, GRID_SIZE - 4, GRID_SIZE - 4, colorValue);
    const text = this.add.text(0, 0, String(data.icon), { fontSize: '20px', color: '#fff' });
    text.setOrigin(0.5, 0.5);

    container.add([rect, text]);
    container.setSize(GRID_SIZE, GRID_SIZE);
    container.setInteractive();

    container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Ensure we catch right-click reliably and prevent browser menu
      const isRight = pointer.rightButtonDown() || (pointer.button === 2);
      if (!isRight) return;
      (pointer.event as MouseEvent)?.preventDefault?.();
      const entityId = container.getData('entityId') as string;
      const gridX = container.getData('gridX') as number;
      const gridY = container.getData('gridY') as number;
      const sel = (this.registry.get('selectedEntityType') as string | null) ?? null;
      const entityTypes = this.registry.get('entityTypes') as
        | Record<string, { name: string; color: string; icon: string }>
        | undefined;

      if (sel && entityTypes && (entityTypes[sel] || Object.keys(entityTypes).some(k => k.toLowerCase().trim() === sel.toLowerCase().trim()))) {
        // Normalize selection key
        let key = sel;
        if (!entityTypes[key]) {
          const match = Object.keys(entityTypes).find(
            (k) => k.toLowerCase().trim() === key.toLowerCase().trim()
          );
          if (match) key = match;
        }
        // Replace existing entity with selected type at same grid
        this.removeEntity(entityId);
        this.placeEntity({ type: key, gridX, gridY, name: entityTypes[key].name, color: entityTypes[key].color, icon: entityTypes[key].icon });
      } else {
        // No selection -> simple remove
        this.removeEntity(entityId);
      }
    });

    const entityId = `${data.type}-${Date.now()}`;
    container.setData('entityId', entityId);
    container.setData('gridX', data.gridX);
    container.setData('gridY', data.gridY);
    container.setData('entityType', data.type);

    this.placedEntities.set(entityId, container);
    this.occupiedCells.add(`${data.gridX},${data.gridY}`);
    this.events.emit('entity-placed');
  }

  private removeEntity(entityId: string): void {
    const container = this.placedEntities.get(entityId);
    if (!container) return;
    const gridX = container.getData('gridX');
    const gridY = container.getData('gridY');
    this.occupiedCells.delete(`${gridX},${gridY}`);
    this.placedEntities.delete(entityId);
    container.destroy();
    this.events.emit('entity-removed');
  }

  // External API: called from Selection-Box
  public setSelectedEntityType(type: string | null): void {
    this.selectedEntityType = type;
    const cur = this.registry.get('selectedEntityType') as string | null;
    if (cur !== type) this.registry.set('selectedEntityType', type);
  }

  public clearAllEntities(): void {
    // Destroy all tracked containers safely
    this.placedEntities.forEach((c) => {
      if (c && c.active) c.destroy();
    });
    // Extra safety: destroy any orphan containers that were not tracked but have an entityId
    this.children.list.forEach((child) => {
      const c = child as Phaser.GameObjects.Container;
      if (c?.getData && c.getData('entityId')) {
        if (c.active) c.destroy();
      }
    });
    this.placedEntities.clear();
    this.occupiedCells.clear();
    this.events.emit('entities-cleared');
  }

  public getAllEntities(): any[] {
    const entities: any[] = [];
    this.placedEntities.forEach((c) => {
      entities.push({
        type: c.getData('entityType'),
        gridX: c.getData('gridX'),
        gridY: c.getData('gridY'),
      });
    });
    return entities;
  }

  public override update(_time: number, delta: number): void {
    if (this.cameras?.main) {
      this.cameras.main.scrollX += this.cameraScrollSpeed * (delta / 16);
      // Redraw grid when camera scroll changes to keep world-aligned grid
      const cam = this.cameras.main;
      const offX = ((-cam.scrollX % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
      const offY = ((-cam.scrollY % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
      if (offX !== this.lastGridOffsetX || offY !== this.lastGridOffsetY) {
        this.drawGrid();
      }
    }
  }

  // Placement using registry as source of truth
  private placeAtGrid(gridX: number, gridY: number, _attempt: number): void {
    const cellKey = `${gridX},${gridY}`;
    if (this.occupiedCells.has(cellKey)) return;

    const entityTypes = this.registry.get('entityTypes') as
      | Record<string, { name: string; color: string; icon: string }>
      | undefined;
    const sel = (this.registry.get('selectedEntityType') as string | null) ?? null;
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

    this.placeEntity({ type: key, gridX, gridY, name: info.name, color: info.color, icon: info.icon });
  }

  public destroy(): void {
    this.scale.off('resize', this.handleResize, this);
    if (this.gridGraphics && this.gridGraphics.active) this.gridGraphics.destroy();
    this.gridGraphics = undefined;
    this.placedEntities.forEach((container) => container.destroy());
    this.placedEntities.clear();
    this.occupiedCells.clear();
  }
}
