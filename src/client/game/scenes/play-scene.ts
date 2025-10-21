// src/client/game/scenes/play-scene.ts
import Phaser from "phaser";
import { loadLevel } from "../level/json-conversion";
import type { LevelData } from "../level/level-schema";
import type { LevelConfig } from "../level/level-types";
import { CAMERA_CONFIG, GAME_CONFIG, SCENE_KEYS, PHYSICS, WORLD, COLORS } from "../../constants/game-constants";
import { DEFAULT_LEVEL } from "../level/level-types";

/**
 * Fetches and validates a JSON level file.
 * Falls back gracefully if missing or invalid.
 */
async function fetchLevelData(levelName: string): Promise<LevelData | null> {
  try {
    const response = await fetch(`/assets/levels/${levelName}.json`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as LevelData;
    if (!data || typeof data !== "object") throw new Error("Invalid structure");
    return data;
  } catch (err) {
    console.warn(`[PlayScene] Failed to fetch level '${levelName}':`, err);
    return null;
  }
}

export class PlayScene extends Phaser.Scene {
  public cameraScrollSpeed = 0;
  private useMapControls = true;

  private levelConfig: LevelConfig;

  constructor(level?: LevelConfig) {
    super({ key: SCENE_KEYS.PLAY });
    this.levelConfig = level ?? DEFAULT_LEVEL;
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
  public init(data: { useMapControls?: boolean; level?: LevelConfig }): void {
    this.useMapControls = data.useMapControls ?? true;
    if (data.level) this.levelConfig = data.level;
  }

  public async create(): Promise<void> {
    try {
      // Wait a tick to ensure systems are initialized
      await new Promise((resolve) => this.time.delayedCall(0, resolve));

      const levelName = GAME_CONFIG.DEFAULT_LEVEL;
      const jsonData = await fetchLevelData(levelName);

    // Debug: surface whether textures actually loaded
    const keys = ['player-idle-1','player-idle-2','player-idle-3','player-idle-4','player-jump-1'];
    const missing = keys.filter((k) => !this.textures.exists(k));
    const dbg = this.add.text(8, 8, missing.length ? `Missing: ${missing.join(', ')}` : 'Player frames OK', { color: '#111', fontSize: '12px' });
    dbg.setScrollFactor(0);

    // Ensure gravity for jumping
    this.physics.world.gravity.y = this.levelConfig.gravityY;
      if (jsonData && this.matter && this.matter.world) {
        // JSON → Matter.js scene
        loadLevel(this, jsonData);
      } else {
        // Fallback → manual Arcade-based layout from LevelConfig
        this.setupArcadeFallback();
      }


      // Camera follow
      const player = this.children.getByName("player_1") as
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
        this.cameras.main.setZoom(CAMERA_CONFIG.ZOOM);
      }
    } catch (err) {
      console.error("[PlayScene] Error creating scene:", err);
      this.add
        .text(50, 50, "Error loading level", {
          color: "#ff3333",
          fontSize: "18px",
        })
        .setScrollFactor(0);
    }
  }

  /** Fallback: builds a simple Arcade-physics level using LevelConfig */
  private setupArcadeFallback(): void {
    const level = this.levelConfig;
    const W = level.worldWidth;
    const H = level.worldHeight;
    
    this.physics.world.setBounds(0, 0, W, H);
    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.setBackgroundColor(level.bgColor);

    this.platforms = this.physics.add.staticGroup();
    
    const addPlatform = (r: { x: number; y: number; width: number; height: number; color?: number }) => {
      const rect = this.add.rectangle(r.x, r.y, r.width, r.height, r.color ?? COLORS.PLATFORM_ALT);
      this.physics.add.existing(rect, true);
      this.platforms.add(rect as Phaser.GameObjects.GameObject);
    };

    if (level.platforms && level.platforms.length > 0) {
      level.platforms.forEach(addPlatform);
    } else {
      addPlatform({ x: W / 2, y: H - 20, width: W, height: 40, color: COLORS.PLATFORM_ALT });
      addPlatform({ x: 400, y: H - 150, width: 250, height: 30, color: COLORS.PLATFORM });
      addPlatform({ x: 950, y: H - 250, width: 400, height: 30, color: COLORS.PLATFORM });
      addPlatform({ x: 1600, y: H - 150, width: 250, height: 30, color: COLORS.PLATFORM });
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

    // Colliders / overlaps
    this.physics.add.collider(this.player, this.platforms);

    // Camera follow (Chrome Dino-style)
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(this.scale.width * level.deadzoneXFrac, this.scale.height * 0.8);

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
        this.playerBody.setVelocityY(-level.jumpVelocity);
      }
    });
  }

  public override update(_time: number, delta: number): void {
    // Scroll controls
    if (this.cameras?.main) {
      this.cameras.main.scrollX += this.cameraScrollSpeed * (delta / 16);
    }
    
    // Only update player if we have proper refs
    if (!this.player || !this.playerBody || !this.cursors) return;
    
    // Input handling
    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up = this.cursors.up.isDown || this.wasd.up.isDown || this.cursors.space.isDown;
    
    let vx = 0;
    if (left) vx = -this.levelConfig.moveSpeed;
    if (right) vx = this.levelConfig.moveSpeed;
    
    this.playerBody.setVelocityX(vx);

    const onFloor = this.playerBody.blocked.down;
    if (up && onFloor) {
      this.playerBody.setVelocityY(-this.levelConfig.jumpVelocity);
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
