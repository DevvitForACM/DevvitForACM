import Phaser from 'phaser';
import { createScrollControls } from '@/game/controls/camera-controls';

const GRID_SIZE = 32;
const BASELINE_Y = 0;

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
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private isSwiping: boolean = false;
  private isMobile: boolean = false;

  constructor() {
    super({ key: 'CreateScene' });
    this.placedEntities = new Map();
    this.occupiedCells = new Set();
  }

  preload(): void {
    const base = '/';
    this.load.image('spring', `${base}Spring.png`);
    this.load.image('spike', `${base}Spikes.png`);
    this.load.image('grass', `${base}Grass.png`);
    this.load.image('ground', `${base}Ground.png`);
    this.load.image('grass-filler', `${base}Grass-filler.png`);
    this.load.image('lava', `${base}Lava.png`);
    this.load.image('door', `${base}Door.png`);
    for (let i = 0; i <= 4; i++) {
      this.load.image(`player-idle-${i}`, `/Idle/${i}.png`);
    }

    for (let i = 0; i <= 4; i++) {
      this.load.image(`player-jump-${i}`, `/Jump/${i}.png`);
    }

    for (let i = 0; i <= 4; i++) {
      this.load.image(`coin-${i}`, `/Coin/${i}.png`);
    }
  };

  public create(): void {
    this.drawGrid();

    this.cameras.main.scrollY = -this.cameras.main.height;

    this.cameras.main.roundPixels = true;

    this.input.mouse?.disableContextMenu();

    this.scale.on('resize', this.handleResize, this);

    // Detect if device is mobile
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                    ('ontouchstart' in window && navigator.maxTouchPoints > 0);

    // Setup keyboard controls (Desktop only)
    if (!this.isMobile && this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }

    // Setup touch swipe controls (Mobile only)
    if (this.isMobile) {
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (!pointer.isDown) return;
        const hitObjects = this.input.hitTestPointer(pointer);
        const hitUI = hitObjects.some(
          (obj: any) => obj.getData && (obj.getData('isScrollControl') || obj.getData('isUIElement'))
        );
        const hitEntity = hitObjects.some(
          (obj: any) => obj.getData && obj.getData('entityId')
        );
        
        // Only start swipe if not hitting UI or entities
        if (!hitUI && !hitEntity) {
          this.touchStartX = pointer.x;
          this.touchStartY = pointer.y;
          this.isSwiping = true;
        }
      });

      this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (this.isSwiping && pointer.isDown) {
          const deltaX = pointer.x - this.touchStartX;
          const deltaY = pointer.y - this.touchStartY;
          
          // Scroll camera inversely to touch movement
          this.cameras.main.scrollX -= deltaX;
          this.cameras.main.scrollY -= deltaY;
          
          this.touchStartX = pointer.x;
          this.touchStartY = pointer.y;
        }
      });

      this.input.on('pointerup', () => {
        this.isSwiping = false;
      });
    }

    createScrollControls(this);

    // Create animations only if textures are loaded
    const coinFrames = [0, 1, 2, 3, 4]
      .filter((i) => this.textures.exists(`coin-${i}`))
      .map((i) => ({ key: `coin-${i}` }));
    
    if (!this.anims.exists('coin-spin') && coinFrames.length > 0) {
      this.anims.create({
        key: 'coin-spin',
        frames: [0, 1, 2, 3, 4].map((i) => ({ key: `coin-${i}` })),
        frameRate: 4,
        repeat: -1,
      });
    }

    const idleFrames = [0, 1, 2, 3, 4]
      .filter((i) => this.textures.exists(`player-idle-${i}`))
      .map((i) => ({ key: `player-idle-${i}` }));
    
    if (!this.anims.exists('player-idle') && idleFrames.length > 0) {
      this.anims.create({
        key: 'player-idle',
        frames: [0, 1, 2, 3, 4].map((i) => ({ key: `player-idle-${i}` })),
        frameRate: 8,
        repeat: -1,
      });
    }
    
    const jumpFrames = [0, 1, 2, 3, 4]
      .filter((i) => this.textures.exists(`player-jump-${i}`))
      .map((i) => ({ key: `player-jump-${i}` }));
    
    if (!this.anims.exists('player-jump') && jumpFrames.length > 0) {
      this.anims.create({
        key: 'player-jump',
        frames: [0, 1, 2, 3, 4].map((i) => ({ key: `player-jump-${i}` })),
        frameRate: 10,
        repeat: -1,
      });
    }

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
      const wx = pointer.worldX;
      const wy = pointer.worldY;
      const gridX = Math.floor(wx / GRID_SIZE);

      const gridY = -Math.floor(wy / GRID_SIZE) - 1;
      if (this.coordinateText) {
        this.coordinateText.setText(`Grid: (${gridX}, ${gridY})`);
        this.coordinateText.setVisible(true);
      }
    });

    this.input.on('pointerout', () => {
      if (this.coordinateText) {
        this.coordinateText.setVisible(false);
      }
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const hitObjects = this.input.hitTestPointer(pointer);
      const hitUI = hitObjects.some(
        (obj: any) =>
          obj.getData &&
          (obj.getData('isScrollControl') || obj.getData('isUIElement'))
      );
      const hitEntity = hitObjects.some(
        (obj: any) => obj.getData && obj.getData('entityId')
      );
      
      // Only place entity if not hitting UI, not swiping, and not hitting existing entity
      if (hitUI || this.isSwiping || hitEntity) return;

      const wx = pointer.worldX;
      const wy = pointer.worldY;
      const gridX = Math.floor(wx / GRID_SIZE);

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
      this.gridGraphics.setScrollFactor(0);
      this.gridGraphics.setDepth(-1);
    }

    this.gridGraphics.clear();
    this.gridGraphics.lineStyle(1, 0xe5e7eb, 0.5);

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
    if (newWidth === this.currentWidth && newHeight === this.currentHeight)
      return;
    this.drawGrid();
  }

  public placeEntity(data: any): void {
    const pixelX = Math.round(data.gridX * GRID_SIZE + GRID_SIZE / 2);

    const pixelY = Math.round(-(data.gridY + 1) * GRID_SIZE + GRID_SIZE / 2);

    const container = this.add.container(pixelX, pixelY);

    const t = String(data.type).toLowerCase().trim();

    if (t === 'spike' && this.textures.exists('spike')) {
      const sprite = this.add.image(0, 0, 'spike');
      sprite.setDisplaySize(GRID_SIZE - 4, GRID_SIZE - 4);
      container.add(sprite);
    } else if (t === 'coin' && this.textures.exists('coin-1')) {
      const sprite = this.add.sprite(0, 0, 'coin-1');
      sprite.setDisplaySize(GRID_SIZE - 4, GRID_SIZE - 4);
      try {
        sprite.play('coin-spin');
      } catch {}
      container.add(sprite);

      this.tweens.add({
        targets: container,
        y: pixelY - 3,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else if (t === 'spring' && this.textures.exists('spring')) {
      const sprite = this.add.image(0, 0, 'spring');
      sprite.setDisplaySize(GRID_SIZE - 4, GRID_SIZE - 4);
      container.add(sprite);
    } else if (t === 'player' && this.textures.exists('player-idle-1')) {
      const sprite = this.add.sprite(0, 0, 'player-idle-1');
      sprite.setDisplaySize(GRID_SIZE - 4, GRID_SIZE - 4);
      try {
        sprite.play('player-idle');
      } catch {}
      container.add(sprite);
    } else if (
      (t === 'ground' || t === 'grass' || t === 'tile') &&
      this.textures.exists('grass')
    ) {
      const sprite = this.add.image(-GRID_SIZE / 2, -GRID_SIZE / 2, 'grass');
      sprite.setOrigin(0, 0);
      sprite.setDisplaySize(GRID_SIZE, GRID_SIZE);
      container.add(sprite);
    } else if (t === 'dirt' && (this.textures.exists('ground') || this.textures.exists('grass-filler'))) {
      const key = this.textures.exists('ground') ? 'ground' : 'grass-filler';
      const dirt = this.add.image(-GRID_SIZE / 2, -GRID_SIZE / 2, key);
      dirt.setOrigin(0, 0);
      dirt.setDisplaySize(GRID_SIZE, GRID_SIZE);
      container.add(dirt);
    } else if (t === 'lava' && this.textures.exists('lava')) {
      const sprite = this.add.image(-GRID_SIZE / 2, -GRID_SIZE / 2, 'lava');
      sprite.setOrigin(0, 0);
      sprite.setDisplaySize(GRID_SIZE, GRID_SIZE);
      container.add(sprite);
    } else if (t === 'door' && this.textures.exists('door')) {
      const sprite = this.add.image(-GRID_SIZE / 2, -GRID_SIZE / 2, 'door');
      sprite.setOrigin(0, 0);
      sprite.setDisplaySize(GRID_SIZE, GRID_SIZE);
      container.add(sprite);
    } else {
      const colorValue =
        parseInt(String(data.color).replace('#', ''), 16) || 0x64748b;
      const rect = this.add.rectangle(
        0,
        0,
        GRID_SIZE - 4,
        GRID_SIZE - 4,
        colorValue
      );
      const text = this.add.text(0, 0, String(data.icon ?? '?'), {
        fontSize: '20px',
        color: '#fff',
      });
      text.setOrigin(0.5, 0.5);
      container.add([rect, text]);
    }

    container.setSize(GRID_SIZE, GRID_SIZE);
    container.setInteractive();
    container.setData('isBaseline', !!data.isBaseline);

    container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Prevent event bubbling
      pointer.event?.preventDefault();
      pointer.event?.stopPropagation();
      
      const entityId = container.getData('entityId') as string;
      const gridX = container.getData('gridX') as number;
      const gridY = container.getData('gridY') as number;
      const currentEntityType = container.getData('entityType') as string;
      
      const sel = (this.registry.get('selectedEntityType') as string | null) ?? null;
      const entityTypes = this.registry.get('entityTypes') as
        | Record<string, { name: string; color: string; icon: string }>
        | undefined;

      const isRightClick = pointer.rightButtonDown() || pointer.button === 2;
      
      // Desktop: Right-click behavior
      if (isRightClick) {
        // Right-click with a selection: Replace entity
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
            // Replace with different entity
            this.removeEntity(entityId);
            this.placeEntity({
              type: key,
              gridX,
              gridY,
              name: info.name,
              color: info.color,
              icon: info.icon,
            });
          }
        } else {
          // Right-click with no selection: Remove entity
          this.removeEntity(entityId);
        }
        return;
      }
      
      // Mobile/Left-click behavior
      if (!sel) {
        // No entity selected: Remove on click
        this.removeEntity(entityId);
      } else if (entityTypes) {
        // Entity selected
        let key = sel;
        if (!entityTypes[key]) {
          const match = Object.keys(entityTypes).find(
            (k) => k.toLowerCase().trim() === key.toLowerCase().trim()
          );
          if (match) key = match;
        }
        
        const info = entityTypes[key];
        if (info && key.toLowerCase() !== currentEntityType.toLowerCase()) {
          // Replace with different entity
          this.removeEntity(entityId);
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
    });

    const entityId = `${data.type}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
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
    const cur = this.registry.get('selectedEntityType') as string | null;
    if (cur !== type) this.registry.set('selectedEntityType', type);
  }

  public clearAllEntities(): void {
    this.placedEntities.forEach((c) => {
      if (c && c.active) c.destroy();
    });

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

  /** Restore a snapshot captured via getAllEntities() */
  public restoreSnapshot(
    snapshot: Array<{ type: string; gridX: number; gridY: number }>
  ): void {
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
      const ct = String(c.getData('entityType') ?? '')
        .toLowerCase()
        .trim();
      if (ct === t) return true;
    }
    return false;
  }

  public override update(_time: number, delta: number): void {
    if (this.cameras?.main) {
      // Handle keyboard camera controls (WASD + Arrow keys) - Desktop only
      if (!this.isMobile) {
        const keyboardSpeed = 8;
        if (this.cursors || this.wasd) {
          if (this.cursors?.left.isDown || this.wasd?.A.isDown) {
            this.cameras.main.scrollX -= keyboardSpeed * (delta / 16);
          }
          if (this.cursors?.right.isDown || this.wasd?.D.isDown) {
            this.cameras.main.scrollX += keyboardSpeed * (delta / 16);
          }
          if (this.cursors?.up.isDown || this.wasd?.W.isDown) {
            this.cameras.main.scrollY -= keyboardSpeed * (delta / 16);
          }
          if (this.cursors?.down.isDown || this.wasd?.S.isDown) {
            this.cameras.main.scrollY += keyboardSpeed * (delta / 16);
          }
        }
      }
      
      // Handle button-based camera controls
      this.cameras.main.scrollX += this.cameraScrollSpeed * (delta / 16);
      this.cameras.main.scrollY += this.cameraScrollSpeedY * (delta / 16);
      
      const cam = this.cameras.main;
      const offX = ((-cam.scrollX % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
      const offY = ((-cam.scrollY % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
      if (offX !== this.lastGridOffsetX || offY !== this.lastGridOffsetY) {
        this.drawGrid();
      }
    }
  }

  private placeAtGrid(gridX: number, gridY: number, _attempt: number): void {
    // Prevent placement on negative X-axis
    if (gridX < 0) return;

    const cellKey = `${gridX},${gridY}`;
    if (this.occupiedCells.has(cellKey)) return;

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
    if ((low === 'player' || low === 'door') && this.hasType(low)) return;

    this.placeEntity({
      type: key,
      gridX,
      gridY,
      name: info.name,
      color: info.color,
      icon: info.icon,
    });
  }

  public destroy(): void {
    this.scale.off('resize', this.handleResize, this);
    if (this.gridGraphics && this.gridGraphics.active)
      this.gridGraphics.destroy();
    this.gridGraphics = undefined;
    if (this.coordinateText && this.coordinateText.active)
      this.coordinateText.destroy();
    this.coordinateText = undefined;
    this.placedEntities.forEach((container) => container.destroy());
    this.placedEntities.clear();
    this.occupiedCells.clear();
  }
}