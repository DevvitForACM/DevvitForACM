import Phaser from 'phaser';

const GRID_SIZE = 32;

export class CreateScene extends Phaser.Scene {
  private placedEntities: Map<string, Phaser.GameObjects.Container>;
  private occupiedCells: Set<string>;
  private selectedEntityType: string | null;
  private gridGraphics?: Phaser.GameObjects.Graphics | undefined;
  private currentWidth: number = 0;
  private currentHeight: number = 0;

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

    if (this.gridGraphics) {
      if (this.gridGraphics.active) this.gridGraphics.destroy();
      this.gridGraphics = undefined;
    }

    this.gridGraphics = this.add.graphics();
    if (!this.gridGraphics) return;
    this.gridGraphics.lineStyle(1, 0xe5e7eb, 0.5);

    for (let x = 0; x <= width; x += GRID_SIZE) {
      this.gridGraphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += GRID_SIZE) {
      this.gridGraphics.lineBetween(0, y, width, y);
    }
    this.gridGraphics.setDepth(-1);
    this.currentWidth = width;
    this.currentHeight = height;
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
      if (pointer.rightButtonDown()) this.removeEntity(container.getData('entityId'));
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
    this.placedEntities.forEach((c) => c.destroy());
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

  public override update(): void {}

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
