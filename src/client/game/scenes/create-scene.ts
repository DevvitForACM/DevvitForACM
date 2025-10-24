import Phaser from 'phaser';
import { createScrollControls } from '../controls/camera-controls';

const GRID_SIZE = 32;
const BASELINE_Y = 0; // default ground row (y=0)

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
  private coordinateText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'CreateScene' });
    this.placedEntities = new Map();
    this.occupiedCells = new Set();
  }

  preload(): void {
    const base = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
    // Load spring and spike assets
    this.load.image('spring', `${base}Spring.png`);
    this.load.image('spike', `${base}Spikes.png`);
    this.load.image('grass', `${base}Grass.png`);
    this.load.image('grass-filler', `${base}Grass-filler.png`);
    
    // Load player (Snoo) animations from individual frames
    for (let i = 1; i <= 4; i++) {
      this.load.image(`player-idle-${i}`, `${base}Animations/Idle/${i}.png`);
    }
    for (let i = 1; i <= 5; i++) {
      this.load.image(`player-jump-${i}`, `${base}Animations/Jump/${i}.png`);
    }
    
    // Coin frames for editor animation
    for (let i = 1; i <= 4; i++) {
      const key = `coin-${i}`;
      this.load.image(key, `${base}Animations/Coin/coin_2_${i}.png`);
    }
  }

  public create(): void {
    this.drawGrid();
    
    // Set initial camera scroll so (0,0) appears at bottom-left of the visible canvas
    // Camera shows from scrollY to scrollY+height
    // We want to show Y=0 at the bottom, so scroll to negative height
    this.cameras.main.scrollY = -this.cameras.main.height;

    // Render pixels snapped to integers to avoid hairline seams
    this.cameras.main.roundPixels = true;

    // Prevent browser context menu so right-click can be used by editor
    this.input.mouse?.disableContextMenu();

    // Resize: redraw grid
    this.scale.on('resize', this.handleResize, this);

    // Map/camera scroll controls (integrated in Create page)
    createScrollControls(this);

    // Animations (coin spin for editor)
    if (!this.anims.exists('coin-spin')) {
      this.anims.create({
        key: 'coin-spin',
        frames: [1, 2, 3, 4].map((i) => ({ key: `coin-${i}` })),
        frameRate: 4,
        repeat: -1,
      });
    }

    // Snoo player animations
    if (!this.anims.exists('player-idle')) {
      this.anims.create({
        key: 'player-idle',
        frames: [1, 2, 3, 4].map((i) => ({ key: `player-idle-${i}` })),
        frameRate: 8,
        repeat: -1,
      });
    }
    if (!this.anims.exists('player-jump')) {
      this.anims.create({
        key: 'player-jump',
        frames: [1, 2, 3, 4, 5].map((i) => ({ key: `player-jump-${i}` })),
        frameRate: 10,
        repeat: -1,
      });
    }

    // Create coordinate display text
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

    // Show coordinates on hover (Y increases upward from bottom-left)
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const wx = pointer.worldX;
      const wy = pointer.worldY;
      const gridX = Math.floor(wx / GRID_SIZE);
      // Invert Y: convert Phaser Y (down is positive) to grid Y (up is positive)
      const gridY = -Math.floor(wy / GRID_SIZE) - 1;
      if (this.coordinateText) {
        this.coordinateText.setText(`Grid: (${gridX}, ${gridY})`);
        this.coordinateText.setVisible(true);
      }
    });

    // Hide coordinates when pointer leaves
    this.input.on('pointerout', () => {
      if (this.coordinateText) {
        this.coordinateText.setVisible(false);
      }
    });

    // Placement
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Don't place if clicking on UI controls (check if pointer hit any interactive game object)
      const hitObjects = this.input.hitTestPointer(pointer);
      const hitUI = hitObjects.some((obj: any) => 
        obj.getData && (obj.getData('isScrollControl') || obj.getData('isUIElement'))
      );
      if (hitUI) return;

      const wx = pointer.worldX;
      const wy = pointer.worldY;
      const gridX = Math.floor(wx / GRID_SIZE);
      // Invert Y: convert Phaser Y (down is positive) to grid Y (up is positive)
      const gridY = -Math.floor(wy / GRID_SIZE) - 1;
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

  public placeEntity(data: any): void {
    const pixelX = Math.round(data.gridX * GRID_SIZE + GRID_SIZE / 2);
    // Invert Y: convert grid Y (up is positive) to Phaser Y (down is positive)
    const pixelY = Math.round(-(data.gridY + 1) * GRID_SIZE + GRID_SIZE / 2);

    const container = this.add.container(pixelX, pixelY);

    const t = String(data.type).toLowerCase().trim();
    // Handle spike
    if (t === 'spike' && this.textures.exists('spike')) {
      const sprite = this.add.image(0, 0, 'spike');
      sprite.setDisplaySize(GRID_SIZE - 4, GRID_SIZE - 4);
      container.add(sprite);
    } else if (t === 'coin' && this.textures.exists('coin-1')) {
      const sprite = this.add.sprite(0, 0, 'coin-1');
      sprite.setDisplaySize(GRID_SIZE - 4, GRID_SIZE - 4);
      try { sprite.play('coin-spin'); } catch { /* ignore */ }
      container.add(sprite);
      // subtle float
      this.tweens.add({ targets: container, y: pixelY - 3, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else if (t === 'spring' && this.textures.exists('spring')) {
      // Handle spring
      const sprite = this.add.image(0, 0, 'spring');
      sprite.setDisplaySize(GRID_SIZE - 4, GRID_SIZE - 4);
      container.add(sprite);
    } else if (t === 'player' && this.textures.exists('player-idle-1')) {
      // Snoo player with animation
      const sprite = this.add.sprite(0, 0, 'player-idle-1');
      sprite.setDisplaySize(GRID_SIZE - 4, GRID_SIZE - 4);
      try { sprite.play('player-idle'); } catch { /* ignore */ }
      container.add(sprite);
    } else if ((t === 'ground' || t === 'grass' || t === 'tile') && this.textures.exists('grass')) {
      // Filler image to guarantee no background shows between tiles
      const filler = this.add.image(-GRID_SIZE / 2, -GRID_SIZE / 2, 'grass-filler');
      filler.setOrigin(0, 0);
      filler.setDisplaySize(GRID_SIZE, GRID_SIZE);
      container.add(filler);
      // Align grass art to exact grid edges (top-left anchored inside centered container)
      const sprite = this.add.image(-GRID_SIZE / 2, -GRID_SIZE / 2, 'grass');
      sprite.setOrigin(0, 0);
      sprite.setDisplaySize(GRID_SIZE, GRID_SIZE);
      container.add(sprite);
    } else {
      const colorValue = parseInt(String(data.color).replace('#', ''), 16) || 0x64748b;
      const rect = this.add.rectangle(0, 0, GRID_SIZE - 4, GRID_SIZE - 4, colorValue);
      const text = this.add.text(0, 0, String(data.icon ?? '?'), { fontSize: '20px', color: '#fff' });
      text.setOrigin(0.5, 0.5);
      container.add([rect, text]);
    }

    container.setSize(GRID_SIZE, GRID_SIZE);
    container.setInteractive();
    container.setData('isBaseline', !!data.isBaseline);

    container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Support mouse and touch. On mobile, there is no right-click; tapping with no selection removes the entity.
      const evt: any = pointer.event as any;
      const pointerType = evt?.pointerType as string | undefined; // 'mouse' | 'touch' | 'pen'
      const isRight = pointer.rightButtonDown() || (pointer.button === 2);
      const isTouch = Boolean((pointer as any).wasTouch || pointerType === 'touch');
      const isPrimaryLike = isRight || (typeof pointer.leftButtonDown === 'function' && pointer.leftButtonDown()) || isTouch;

      const entityId = container.getData('entityId') as string;
      const gridX = container.getData('gridX') as number;
      const gridY = container.getData('gridY') as number;
      const sel = (this.registry.get('selectedEntityType') as string | null) ?? null;
      const entityTypes = this.registry.get('entityTypes') as
        | Record<string, { name: string; color: string; icon: string }>
        | undefined;

      // If no selection, any tap/click removes the entity (mobile-friendly)
      if (!sel) {
        if (isPrimaryLike) {
          (evt as MouseEvent | PointerEvent | undefined)?.preventDefault?.();
          this.removeEntity(entityId);
        }
        return;
      }

      // With a selection, only right-click (or long-press equivalents) should replace
      if (!(entityTypes && (entityTypes[sel] || Object.keys(entityTypes).some(k => k.toLowerCase().trim() === sel.toLowerCase().trim())))) {
        return;
      }

      if (!isRight && !isTouch) return; // keep replacement as an explicit action

      // Normalize selection key
      let key = sel;
      if (!entityTypes[key]) {
        const match = Object.keys(entityTypes).find(
          (k) => k.toLowerCase().trim() === key.toLowerCase().trim()
        );
        if (match) key = match;
      }
      const info2 = entityTypes[key];
      if (!info2) return;
      (evt as MouseEvent | PointerEvent | undefined)?.preventDefault?.();
      this.removeEntity(entityId);
      this.placeEntity({ type: key, gridX, gridY, name: info2.name, color: info2.color, icon: info2.icon });
    });

    const entityId = `${data.type}-${Date.now()}-${Math.floor(Math.random()*1e6)}`;
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
    const cur = this.registry.get('selectedEntityType') as string | null;
    if (cur !== type) this.registry.set('selectedEntityType', type);
  }

  public clearAllEntities(): void {
    // Destroy all tracked containers safely
    this.placedEntities.forEach((c) => {
      if (c && c.active) c.destroy();
    });
    // Remove all non-persistent children that have an entityId
    this.children.list.forEach((child) => {
      const c = child as Phaser.GameObjects.Container;
      if (c?.getData && c.getData('entityId')) {
        if (c.active) c.destroy();
      }
    });
    // Clear all records
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

  /** Restore a snapshot captured via getAllEntities() */
  public restoreSnapshot(snapshot: Array<{ type: string; gridX: number; gridY: number }>): void {
    if (!Array.isArray(snapshot)) return;
    // Clean slate
    this.clearAllEntities();

    const entityTypes = this.registry.get('entityTypes') as
      | Record<string, { name: string; color: string; icon: string }>
      | undefined;

    for (const e of snapshot) {
      const keyLow = String(e.type ?? '').toLowerCase().trim();
      let matchedKey = keyLow;
      if (entityTypes) {
        const match = Object.keys(entityTypes).find((k) => k.toLowerCase().trim() === keyLow);
        if (match) matchedKey = match;
      }
      const info = entityTypes ? entityTypes[matchedKey] : undefined;
      this.placeEntity({
        type: matchedKey,
        gridX: e.gridX,
        gridY: e.gridY,
        name: info?.name,
        color: info?.color,
        icon: info?.icon,
      });
    }
  }

  private hasType(type: string): boolean {
    const t = type.toLowerCase().trim();
    for (const [, c] of this.placedEntities) {
      const ct = String(c.getData('entityType') ?? '').toLowerCase().trim();
      if (ct === t) return true;
    }
    return false;
  }

  public override update(_time: number, delta: number): void {
    if (this.cameras?.main) {
      this.cameras.main.scrollX += this.cameraScrollSpeed * (delta / 16);
      this.cameras.main.scrollY += this.cameraScrollSpeedY * (delta / 16);
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

    // Singleton enforcement for player and door
    const low = key.toLowerCase().trim();
    if ((low === 'player' || low === 'door') && this.hasType(low)) return;

    this.placeEntity({ type: key, gridX, gridY, name: info.name, color: info.color, icon: info.icon });
  }


  public destroy(): void {
    this.scale.off('resize', this.handleResize, this);
    if (this.gridGraphics && this.gridGraphics.active) this.gridGraphics.destroy();
    this.gridGraphics = undefined;
    if (this.coordinateText && this.coordinateText.active) this.coordinateText.destroy();
    this.coordinateText = undefined;
    this.placedEntities.forEach((container) => container.destroy());
    this.placedEntities.clear();
    this.occupiedCells.clear();
  }
}
