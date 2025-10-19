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
    // Ensure camera is available before proceeding
    if (!this.cameras?.main) {
      console.warn('CreateScene: Camera not available for grid drawing');
      return;
    }

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Validate dimensions are positive numbers
    if (!width || !height || width <= 0 || height <= 0) {
      console.warn('CreateScene: Invalid dimensions for grid drawing', {
        width,
        height,
      });
      return;
    }

    // Properly destroy existing grid graphics before creating new ones
    if (this.gridGraphics) {
      if (this.gridGraphics.active) {
        this.gridGraphics.destroy();
      }
      this.gridGraphics = undefined;
    }

    // Create new grid graphics object
    try {
      this.gridGraphics = this.add.graphics();

      // Verify graphics object was created successfully
      if (!this.gridGraphics) {
        console.error('CreateScene: Failed to create grid graphics object');
        return;
      }

      // Configure grid line style
      this.gridGraphics.lineStyle(1, 0xe5e7eb, 0.5);

      // Draw vertical lines
      for (let x = 0; x <= width; x += GRID_SIZE) {
        this.gridGraphics.lineBetween(x, 0, x, height);
      }

      // Draw horizontal lines
      for (let y = 0; y <= height; y += GRID_SIZE) {
        this.gridGraphics.lineBetween(0, y, width, y);
      }

      // Set grid to render behind other objects
      this.gridGraphics.setDepth(-1);

      // Update cached dimensions only after successful grid creation
      this.currentWidth = width;
      this.currentHeight = height;
    } catch (error) {
      console.error('CreateScene: Error creating grid graphics', error);
      // Clean up partial state on error
      if (this.gridGraphics && this.gridGraphics.active) {
        this.gridGraphics.destroy();
      }
      this.gridGraphics = undefined;
    }
  }

  private handleResize(): void {
    // Primary trigger for grid updates - ensure this is the main entry point
    // for grid redraws when dimensions change

    // Get current camera dimensions
    if (!this.cameras?.main) {
      console.warn('CreateScene: Camera not available during resize');
      return;
    }

    const newWidth = this.cameras.main.width;
    const newHeight = this.cameras.main.height;

    // Validate dimensions before proceeding
    if (!newWidth || !newHeight || newWidth <= 0 || newHeight <= 0) {
      console.warn('CreateScene: Invalid dimensions during resize', {
        newWidth,
        newHeight,
      });
      return;
    }

    // Use dimension caching to prevent unnecessary operations
    // Only proceed if dimensions have actually changed
    if (newWidth === this.currentWidth && newHeight === this.currentHeight) {
      // Dimensions haven't changed, no grid update needed
      return;
    }

    // Dimensions have changed, trigger grid redraw
    this.drawGrid();
  }

  private placeEntity(data: any): void {
    // NOTE: This method places entities but should NOT trigger grid redraws
    // Grid remains stable during entity placement - Requirements: 1.1, 2.1
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
    // NOTE: This method removes entities but should NOT trigger grid redraws
    // Grid remains stable during entity removal - Requirements: 1.1, 2.1
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

    // IMPORTANT: Grid should remain stable when selecting entities
    // DO NOT add grid redraw logic here - this would cause unnecessary
    // visual flickering and performance issues during entity selection
    // Grid updates should ONLY happen in handleResize() method
    // Requirements: 1.1, 2.1 - Grid must not redraw during entity selection
  }

  public clearAllEntities(): void {
    // NOTE: This method clears all entities but should NOT trigger grid redraws
    // Grid remains stable during entity clearing - Requirements: 1.1, 2.1
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
    // Update method kept for future use but grid operations removed
    // Grid updates are now handled exclusively by resize events
  }

  public destroy(): void {
    // Clean up event listeners
    this.scale.off('resize', this.handleResize, this);

    // Clean up graphics with proper null checking
    if (this.gridGraphics && this.gridGraphics.active) {
      this.gridGraphics.destroy();
    }
    this.gridGraphics = undefined;

    // Clean up entities
    this.placedEntities.forEach((container) => container.destroy());
    this.placedEntities.clear();
    this.occupiedCells.clear();
  }
}
