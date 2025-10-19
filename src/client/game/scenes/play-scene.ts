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
    const base = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';

    // Debug listeners to surface load failures
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      const msg = `Load error: ${file?.key ?? ''} -> ${file?.src ?? ''}`;
      // eslint-disable-next-line no-console
      console.warn(msg);
    });

    // Load spike texture and player frames from publicDir (vite.config.ts -> ../../assets)
    this.load.image('spike', `${base}Spikes.png`);

    // Load player animations from individual frames
    for (let i = 1; i <= 4; i++) {
      this.load.image(`player-idle-${i}`, `${base}Animations/Idle/${i}.png`);
    }
    for (let i = 1; i <= 5; i++) {
      this.load.image(`player-jump-${i}`, `${base}Animations/Jump/${i}.png`);
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

  public create(): void {
    const W = this.level.worldWidth;
    const H = this.level.worldHeight;
    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.setBackgroundColor(this.level.bgColor);
    this.physics.world.setBounds(0, 0, W, H);

    // Debug: surface whether textures actually loaded
    const keys = ['player-idle-1','player-idle-2','player-idle-3','player-idle-4','player-jump-1'];
    const missing = keys.filter((k) => !this.textures.exists(k));
    const dbg = this.add.text(8, 8, missing.length ? `Missing: ${missing.join(', ')}` : 'Player frames OK', { color: '#111', fontSize: '12px' });
    dbg.setScrollFactor(0);

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
    this.player.clearTint();
    this.player.setDisplaySize(48, 48);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(true);
    this.playerBody.setBounce(0.1, 0);
    this.playerBody.setDragX(600);
    this.player.play('player-idle');

    // Colliders / overlaps
    this.physics.add.collider(this.player, this.platforms);

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

}
