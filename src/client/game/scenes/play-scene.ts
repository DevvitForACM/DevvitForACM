import Phaser from 'phaser';
import { createScrollControls } from '../controls/camera-controls';
import type { LevelConfig, RectDef } from '../level/level-types';
import { DEFAULT_LEVEL } from '../level/level-types';


export class PlayScene extends Phaser.Scene {
  public cameraScrollSpeed = 0;
  constructor(private level: LevelConfig = DEFAULT_LEVEL) {
    super({ key: 'PlayScene' });
  }

  preload() {
    // Load spike texture from assets (served via Vite publicDir)
    this.load.image('spike', '/Spikes.png');

    // Load player animations from individual frames
    for (let i = 1; i <= 4; i++) {
      this.load.image(`player-idle-${i}`, `/Animations/Idle/${i}.png`);
    }
    for (let i = 1; i <= 5; i++) {
      this.load.image(`player-jump-${i}`, `/Animations/Jump/${i}.png`);
    }
  }

  // New: keyboard + player refs
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private playerBody!: Phaser.Physics.Arcade.Body;

  // Collision groups & debug
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private blocks!: Phaser.Physics.Arcade.StaticGroup;
  private placedBlocks = new Map<string, Phaser.GameObjects.Rectangle>();
  private readonly TILE = 32;

  public create(): void {
    const W = this.level.worldWidth;
    const H = this.level.worldHeight;
    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.setBackgroundColor(this.level.bgColor);
    this.physics.world.setBounds(0, 0, W, H);

    // Ensure gravity for jumping
    this.physics.world.gravity.y = this.level.gravityY;

    // Platforms
    this.platforms = this.physics.add.staticGroup();

    const addPlatform = (r: RectDef) => {
      const rect = this.add.rectangle(r.x, r.y, r.width, r.height, r.color ?? 0x4a8f38);
      this.physics.add.existing(rect, true);
      this.platforms.add(rect as Phaser.GameObjects.GameObject);
    };

    if (this.level.platforms && this.level.platforms.length > 0) {
      this.level.platforms.forEach(addPlatform);
    } else {
      addPlatform({ x: W / 2, y: H - 20, width: W, height: 40, color: 0x4a8f38 });
      addPlatform({ x: 400, y: H - 150, width: 250, height: 30, color: 0x956338 });
      addPlatform({ x: 950, y: H - 250, width: 400, height: 30, color: 0x956338 });
      addPlatform({ x: 1600, y: H - 150, width: 250, height: 30, color: 0x956338 });
    }

    // Placeable Blocks (Minecraft-like)
    this.blocks = this.physics.add.staticGroup();
    this.input.mouse?.disableContextMenu();
    if (this.level.allowBlockPlacement) {
      this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
        const x = pointer.worldX;
        const y = pointer.worldY;
        if (pointer.leftButtonDown()) {
          this.placeBlockAt(x, y);
        } else if (pointer.rightButtonDown()) {
          this.removeBlockAt(x, y);
        }
      });
    }

    // Animations
    this.anims.create({
      key: 'player-idle',
      frames: [1, 2, 3, 4].map((i) => ({ key: `player-idle-${i}` })),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'player-jump',
      frames: [1, 2, 3, 4, 5].map((i) => ({ key: `player-jump-${i}` })),
      frameRate: 10,
      repeat: -1,
    });

    // Player sprite
    const startX = this.level.playerStartX ?? 200;
    const startY = this.level.playerStartY ?? Math.max(0, H - 100);
    this.player = this.physics.add.sprite(startX, startY, 'player-idle-1');
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(true);
    this.playerBody.setBounce(0.1, 0);
    this.playerBody.setDragX(600);
    this.player.play('player-idle');

    // Colliders / overlaps
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.blocks);

    // Camera follow (Chrome Dino-style)
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(this.scale.width * this.level.deadzoneXFrac, this.scale.height * 0.8);

    // Input: arrows + WASD
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.input.keyboard!.addCapture([Phaser.Input.Keyboard.KeyCodes.SPACE]);

    // Tap to jump on mobile/touch
    this.input.on(Phaser.Input.Events.POINTER_DOWN, () => {
      if (this.playerBody?.blocked.down) {
        this.playerBody.setVelocityY(-this.level.jumpVelocity);
      }
    });

    // Optional on-screen map controls
    if (this.level.useMapControls) {
      createScrollControls(this);
    }
  }

  public override update(_time: number, delta: number): void {
    // Camera scroll via UI controls
    this.cameras.main.scrollX += this.cameraScrollSpeed * (delta / 16);

    // Player movement (desktop keyboard)
    const speed = this.level.moveSpeed;
    const jump = this.level.jumpVelocity;

    let vx = 0;
    const left = this.wasd.left.isDown || !!this.cursors.left?.isDown;
    const right = this.wasd.right.isDown || !!this.cursors.right?.isDown;
    const up = this.wasd.up.isDown || !!this.cursors.up?.isDown || !!this.cursors.space?.isDown;

    if (this.level.autoRun) {
      vx = speed;
      if (left) vx = 0;
    } else {
      if (left) vx = -speed;
      else if (right) vx = speed;
    }
    this.playerBody.setVelocityX(vx);

    const onFloor = this.playerBody.blocked.down;
    if (up && onFloor) {
      this.playerBody.setVelocityY(-jump);
    }

    // Flip sprite based on movement direction
    if (vx < 0) this.player.setFlipX(true);
    else if (vx > 0) this.player.setFlipX(false);

    // Play animations based on state
    if (!onFloor) {
      if (this.player.anims.currentAnim?.key !== 'player-jump') {
        this.player.play('player-jump', true);
      }
    } else {
      if (vx === 0 && this.player.anims.currentAnim?.key !== 'player-idle') {
        this.player.play('player-idle', true);
      }
    }
  }

  private keyForCell(cx: number, cy: number) {
    return `${cx},${cy}`;
  }

  private worldToCell(x: number, y: number) {
    return {
      cx: Math.floor(x / this.TILE),
      cy: Math.floor(y / this.TILE),
    };
  }

  private placeBlockAt(x: number, y: number) {
    const { cx, cy } = this.worldToCell(x, y);
    const key = this.keyForCell(cx, cy);
    if (this.placedBlocks.has(key)) return;

    const bx = cx * this.TILE + this.TILE / 2;
    const by = cy * this.TILE + this.TILE / 2;
    const rect = this.add.rectangle(bx, by, this.TILE, this.TILE, 0x956338);
    this.physics.add.existing(rect, true);
    this.blocks.add(rect as unknown as Phaser.GameObjects.GameObject);
    (rect.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    this.placedBlocks.set(key, rect);
  }

  private removeBlockAt(x: number, y: number) {
    const { cx, cy } = this.worldToCell(x, y);
    const key = this.keyForCell(cx, cy);
    const rect = this.placedBlocks.get(key);
    if (!rect) return;

    this.blocks.remove(rect, true, true);
    this.placedBlocks.delete(key);
  }
}
