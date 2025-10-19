import Phaser from 'phaser';

const GRID_SIZE = 32;

export class CreateScene extends Phaser.Scene {
  private placedEntities: Map<string, Phaser.GameObjects.Container>;
  private occupiedCells: Set<string>;
  private selectedEntityType: string | null;
  private gridGraphics?: Phaser.GameObjects.Graphics;
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

    // Listen for resize events to redraw grid
    this.scale.on('resize', this.handleResize, this);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.selectedEntityType) return;

      const gridX = Math.floor(pointer.x / GRID_SIZE);
      const gridY = Math.floor(pointer.y / GRID_SIZE);
      const cellKey = `${gridX},${gridY}`;

      if (this.occupiedCells.has(cellKey)) return;

      const entityInfo =
        this.registry.get('entityTypes')[this.selectedEntityType];
      if (!entityInfo) return;

      this.placeEntity({
        type: this.selectedEntityType,
        gridX,
        gridY,
        name: entityInfo.name,
        color: entityInfo.color,
        icon: entityInfo.icon,
      });
    });
  }

  private drawGrid(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Only redraw if dimensions have changed
    if (
      width === this.currentWidth &&
      height === this.currentHeight &&
      this.gridGraphics
    ) {
      return;
    }

    // Clear existing grid
    if (this.gridGraphics) {
      this.gridGraphics.destroy();
    }

    // Create new grid
    this.gridGraphics = this.add.graphics();
    this.gridGraphics.lineStyle(1, 0xe5e7eb, 0.5);

    // Draw vertical lines
    for (let x = 0; x <= width; x += GRID_SIZE) {
      this.gridGraphics.lineBetween(x, 0, x, height);
    }

    // Draw horizontal lines
    for (let y = 0; y <= height; y += GRID_SIZE) {
      this.gridGraphics.lineBetween(0, y, width, y);
    }

    this.gridGraphics.setDepth(-1);

    // Update current dimensions
    this.currentWidth = width;
    this.currentHeight = height;
  }

  private handleResize(): void {
    // Redraw grid when window is resized
    this.drawGrid();
  }

  private placeEntity(data: any): void {
    const pixelX = data.gridX * GRID_SIZE + GRID_SIZE / 2;
    const pixelY = data.gridY * GRID_SIZE + GRID_SIZE / 2;

    const container = this.add.container(pixelX, pixelY);
    const colorValue = parseInt(data.color.replace('#', ''), 16);
    const rect = this.add.rectangle(
      0,
      0,
      GRID_SIZE - 4,
      GRID_SIZE - 4,
      colorValue
    );
    const text = this.add.text(0, 0, data.icon, {
      fontSize: '20px',
      color: '#fff',
    });
    text.setOrigin(0.5, 0.5);

    container.add([rect, text]);
    container.setSize(GRID_SIZE, GRID_SIZE);
    container.setInteractive();

    container.on('pointerover', () => container.setScale(1.1));
    container.on('pointerout', () => container.setScale(1));
    container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.removeEntity(container.getData('entityId'));
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

  public setSelectedEntityType(type: string | null): void {
    this.selectedEntityType = type;
    // Grid should remain stable when selecting entities
    // No need to redraw grid here
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

  public override update(): void {
    // Check if camera dimensions have changed and redraw grid if needed
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    if (width !== this.currentWidth || height !== this.currentHeight) {
      this.drawGrid();
    }
  }

  public destroy(): void {
    // Clean up event listeners
    this.scale.off('resize', this.handleResize, this);

    // Clean up graphics
    if (this.gridGraphics) {
      this.gridGraphics.destroy();
    }

    // Clean up entities
    this.placedEntities.forEach((container) => container.destroy());
    this.placedEntities.clear();
    this.occupiedCells.clear();
  }
}
