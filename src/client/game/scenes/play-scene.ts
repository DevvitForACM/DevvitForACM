import Phaser from 'phaser';
import { loadLevel } from '../level/json-conversion';
import type { LevelData } from '../level/level-schema';
import type { LevelConfig } from '../level/level-types';
import {
  CAMERA_CONFIG,
  GAME_CONFIG,
  SCENE_KEYS,
  PHYSICS,
  COLORS,
} from '../../constants/game-constants';
import { DEFAULT_LEVEL } from '../level/level-types';
async function fetchLevelData(levelName: string): Promise<LevelData | null> {
  try {
    const response = await fetch(`/assets/levels/${levelName}.json`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as LevelData;
    if (!data || typeof data !== 'object') throw new Error('Invalid structure');
    return data;
  } catch (err) {
    console.warn(`[PlayScene] Failed to fetch level '${levelName}':`, err);
    return null;
  }
}

export class PlayScene extends Phaser.Scene {
  public cameraScrollSpeed = 0;
  private fromEditor = false;
  private editorLevelData?: LevelData;

  private levelConfig: LevelConfig;

  constructor(level?: LevelConfig) {
    super({ key: SCENE_KEYS.PLAY });
    this.levelConfig = level ?? DEFAULT_LEVEL;
  }

  preload() {
    const base =
      (import.meta as unknown as { env?: { BASE_URL?: string } }).env
        ?.BASE_URL ?? '/';

    this.load.on(
      Phaser.Loader.Events.FILE_LOAD_ERROR,
      (file: Phaser.Loader.File) => {
        const msg = `Load error: ${file?.key ?? ''} -> ${file?.src ?? ''}`;
        console.warn(msg);
      }
    );

    for (let i = 1; i <= 4; i++) {
      this.load.image(`upvote${i}`, `${base}upvote${i}.png`);
      this.load.image(`downvote${i}`, `${base}downvote${i}.png`);
    }
    this.load.image('grass', `${base}Grass.png`);

    for (let i = 1; i <= 4; i++) {
      this.load.image(`player-idle-${i}`, `${base}Animations/Idle/${i}.png`);
    }
    for (let i = 1; i <= 5; i++) {
      this.load.image(`player-jump-${i}`, `${base}Animations/Jump/${i}.png`);
    }

    for (let i = 1; i <= 4; i++) {
      this.load.image(`coin-${i}`, `${base}Animations/Coin/coin_2_${i}.png`);
    }
  }

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private playerBody!: Phaser.Physics.Arcade.Body;

  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  public init(data: {
    useMapControls?: boolean;
    level?: LevelConfig;
    levelData?: LevelData;
  }): void {
    if (data.levelData) {
      this.editorLevelData = data.levelData;
      this.fromEditor = true;
    } else if (data.level) {
      this.levelConfig = data.level;
      this.fromEditor = true;
    } else {
      this.fromEditor = false;
    }
  }

  public async create(): Promise<void> {
    try {
      await new Promise((resolve) => this.time.delayedCall(0, resolve));

      let jsonData: LevelData | null = null;
      if (!this.fromEditor) {
        const levelName = GAME_CONFIG.DEFAULT_LEVEL;
        jsonData = await fetchLevelData(levelName);
      }

      const keys = [
        'player-idle-1',
        'player-idle-2',
        'player-idle-3',
        'player-idle-4',
        'player-jump-1',
      ];
      const missing = keys.filter((k) => !this.textures.exists(k));
      const dbg = this.add.text(
        8,
        8,
        missing.length ? `Missing: ${missing.join(', ')}` : 'Player frames OK',
        { color: '#111', fontSize: '12px' }
      );
      dbg.setScrollFactor(0);

      if ((this.physics as any)?.world) {
        this.physics.world.gravity.y = this.levelConfig.gravityY;
      } else if ((this.matter as any)?.world) {
        const gy = Math.max(0, this.levelConfig.gravityY) / 1000;
        this.matter.world.setGravity(0, gy || 1);
      }

      if (this.editorLevelData && (this.matter as any)?.world) {
        loadLevel(this, this.editorLevelData);
        const b = this.editorLevelData.settings?.bounds;
        if (b) this.cameras.main.setBounds(0, 0, b.width, b.height);
      } else if (jsonData && (this.matter as any)?.world) {
        loadLevel(this, jsonData);
        const b = jsonData.settings?.bounds;
        if (b) this.cameras.main.setBounds(0, 0, b.width, b.height);
      } else if ((this.physics as any)?.world) {
        this.setupArcadeFallback();
      } else if ((this.matter as any)?.world) {
        this.setupMatterFallback();
      } else {
        this.add
          .text(20, 20, 'No physics plugins available', { color: '#f33' })
          .setScrollFactor(0);
      }

      const player = this.children.getByName('player_1') as
        | Phaser.Physics.Matter.Image
        | Phaser.GameObjects.Sprite
        | undefined;

      if (player) {
        this.cameras.main.startFollow(
          player,
          true,
          CAMERA_CONFIG.FOLLOW_LERP,
          CAMERA_CONFIG.FOLLOW_LERP
        );
        this.cameras.main.setZoom(this.fromEditor ? 2 : CAMERA_CONFIG.ZOOM);
        this.cameras.main.roundPixels = true;
      }
    } catch (err) {
      console.error('[PlayScene] Error creating scene:', err);
      this.add
        .text(50, 50, 'Error loading level', {
          color: '#ff3333',
          fontSize: '18px',
        })
        .setScrollFactor(0);
    }
  }

  private setupMatterFallback(): void {
    const level = this.levelConfig;
    const W = level.worldWidth;
    const H = level.worldHeight;

    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.setBackgroundColor(level.bgColor);
    this.matter.world.setBounds(0, 0, W, H);

    if (level.platforms && level.platforms.length > 0) {
      level.platforms.forEach((r) => {
        this.matter.add.rectangle(r.x, r.y, r.width, r.height, {
          isStatic: true,
          label: 'platform',
        });
        this.add
          .rectangle(
            r.x,
            r.y,
            r.width,
            r.height,
            r.color ?? COLORS.PLATFORM_ALT
          )
          .setDepth(-1);
      });
    } else {
      this.matter.add.rectangle(W / 2, H - 20, W, 40, { isStatic: true });
      this.add
        .rectangle(W / 2, H - 20, W, 40, COLORS.PLATFORM_ALT)
        .setDepth(-1);
    }

    const startX = level.playerStartX ?? 200;
    const startY = level.playerStartY ?? Math.max(0, H - 100);
    const player = this.matter.add.image(startX, startY, 'player-idle-1');
    player.setCircle(20);
    player.setBounce(0.1);
    player.setFriction(0.05);
    player.setFixedRotation();
    player.setName('player_1');

    this.cameras.main.startFollow(player, true, 0.08, 0.08);
  }

  private setupArcadeFallback(): void {
    const level = this.levelConfig;
    const W = level.worldWidth;
    const H = level.worldHeight;

    this.physics.world.setBounds(0, 0, W, H);
    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.setBackgroundColor(level.bgColor);

    this.platforms = this.physics.add.staticGroup();

    const addPlatform = (r: {
      x: number;
      y: number;
      width: number;
      height: number;
      color?: number;
    }) => {
      const rect = this.add.rectangle(
        r.x,
        r.y,
        r.width,
        r.height,
        r.color ?? COLORS.PLATFORM_ALT
      );
      this.physics.add.existing(rect, true);
      this.platforms.add(rect as Phaser.GameObjects.GameObject);
    };

    if (level.platforms && level.platforms.length > 0) {
      level.platforms.forEach(addPlatform);
    } else {
      addPlatform({
        x: W / 2,
        y: H - 20,
        width: W,
        height: 40,
        color: COLORS.PLATFORM_ALT,
      });
      addPlatform({
        x: 400,
        y: H - 150,
        width: 250,
        height: 30,
        color: COLORS.PLATFORM,
      });
      addPlatform({
        x: 950,
        y: H - 250,
        width: 400,
        height: 30,
        color: COLORS.PLATFORM,
      });
      addPlatform({
        x: 1600,
        y: H - 150,
        width: 250,
        height: 30,
        color: COLORS.PLATFORM,
      });
    }

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

    if (!this.anims.exists('coin-spin')) {
      this.anims.create({
        key: 'coin-spin',
        frames: [1, 2, 3, 4].map((i) => ({ key: `coin-${i}` })),
        frameRate: 4,
        repeat: -1,
      });
    }

    const startX = level.playerStartX ?? 200;
    const startY = level.playerStartY ?? Math.max(0, H - 100);
    this.player = this.physics.add.sprite(startX, startY, 'player-idle-1');
    this.player.clearTint();
    this.player.setDisplaySize(48, 48);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(true);
    this.playerBody.setBounce(PHYSICS.PLAYER_BOUNCE_X, PHYSICS.PLAYER_BOUNCE_Y);
    this.playerBody.setDragX(PHYSICS.PLAYER_DRAG_X);
    this.player.play('player-idle');

    this.physics.add.collider(this.player, this.platforms);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(
      this.scale.width * level.deadzoneXFrac,
      this.scale.height * 0.8
    );

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.input.keyboard!.addCapture([Phaser.Input.Keyboard.KeyCodes.SPACE]);

    this.input.on(Phaser.Input.Events.POINTER_DOWN, () => {
      if (this.playerBody?.blocked.down) {
        this.playerBody.setVelocityY(-level.jumpVelocity);
      }
    });
  }

  public override update(_time: number, delta: number): void {
    if (this.cameras?.main) {
      this.cameras.main.scrollX += this.cameraScrollSpeed * (delta / 16);
    }

    if (!this.player || !this.playerBody || !this.cursors) return;

    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up =
      this.cursors.up.isDown ||
      this.wasd.up.isDown ||
      this.cursors.space.isDown;

    let vx = 0;
    if (left) vx = -this.levelConfig.moveSpeed;
    if (right) vx = this.levelConfig.moveSpeed;

    this.playerBody.setVelocityX(vx);

    const onFloor = this.playerBody.blocked.down;
    if (up && onFloor) {
      this.playerBody.setVelocityY(-this.levelConfig.jumpVelocity);
    }

    if (vx < 0) this.player.setFlipX(true);
    else if (vx > 0) this.player.setFlipX(false);

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