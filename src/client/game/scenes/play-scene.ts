// src/client/game/scenes/play-scene.ts
import Phaser from "phaser";
import { loadLevel } from "../level/json-conversion";
import type { LevelData } from "../level/level-schema";
import type { LevelConfig } from "../level/level-types";
import { CAMERA_CONFIG, GAME_CONFIG, SCENE_KEYS, PHYSICS, COLORS } from "../../constants/game-constants";
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
  private fromEditor = false;
  private editorLevelData?: LevelData;

  private levelConfig: LevelConfig;
  private dbg?: Phaser.GameObjects.Text;
  private maxXAllowed: number = Infinity;
  private worldHeight: number = 0;
  private platformRects: Array<{ l: number; r: number; t: number; b: number }> = [];
  private lastSafePos?: { x: number; y: number };
  private coinSprites: Phaser.GameObjects.Sprite[] = [];
  // Grid-step debounce
  private stepCooldownMs = 220;
  private lastStepAt = 0;
  private isStepping = false;

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

    // Load spring and spike assets
    this.load.image('spring', `${base}Spring.png`);
    this.load.image('spike', `${base}Spikes.png`);
    this.load.image('grass', `${base}Grass.png`);

    // Load player animations from individual frames
    for (let i = 1; i <= 4; i++) {
      this.load.image(`player-idle-${i}`, `${base}Animations/Idle/${i}.png`);
    }
    for (let i = 1; i <= 5; i++) {
      this.load.image(`player-jump-${i}`, `${base}Animations/Jump/${i}.png`);
    }
    // Optional run frames if available (note file names)
    this.load.image('player-run-1', `${base}Animations/Run/running 1.png`);
    this.load.image('player-run-2', `${base}Animations/Run/running 2.png`);
    this.load.image('player-run-3', `${base}Animations/Run/running 3.png`);
    this.load.image('player-run-4', `${base}Animations/Run/running inverted.png`);
    this.load.image('player-run-5', `${base}Animations/Run/running 2.png`);
    this.load.image('player-run-6', `${base}Animations/Run/running 3.png`);

    // Load coin animation frames (assets/Animations/Coin/coin_2_1..4.png)
    for (let i = 1; i <= 4; i++) {
      this.load.image(`coin-${i}`, `${base}Animations/Coin/coin_2_${i}.png`);
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

  // Matter-mode player
  private mPlayer?: Phaser.Physics.Matter.Image;
  private groundedContacts = 0;

  // Collision groups & debug
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  public init(data: { useMapControls?: boolean; level?: LevelConfig; levelData?: LevelData }): void {
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
      // Wait a tick to ensure systems are initialized
      await new Promise((resolve) => this.time.delayedCall(0, resolve));

      let jsonData: LevelData | null = null;
      if (!this.fromEditor) {
        const levelName = GAME_CONFIG.DEFAULT_LEVEL;
        jsonData = await fetchLevelData(levelName);
      }

      // Create animations if not already present
      this.ensurePlayerAnimations();

      // Debug: surface whether textures actually loaded
      const keys = ['player-idle-1','player-idle-2','player-idle-3','player-idle-4','player-jump-1'];
      const missing = keys.filter((k) => !this.textures.exists(k));
      const dbg = this.add.text(8, 8, missing.length ? `Missing: ${missing.join(', ')}` : 'Player frames OK', { color: '#111', fontSize: '12px' });
      dbg.setScrollFactor(0);

      // Ensure gravity for jumping (guard for whichever physics is available)
      if ((this.physics as any)?.world) {
        this.physics.world.gravity.y = this.levelConfig.gravityY;
      } else if ((this.matter as any)?.world) {
        // Map Arcade gravity (px/s^2) to Matter's unit (~1 = earth gravity)
        const gy = Math.max(0, this.levelConfig.gravityY) / 1000;
        this.matter.world.setGravity(0, gy || 1);
      }

      if (this.editorLevelData && (this.matter as any)?.world) {
        // Use editor-provided JSON level
        loadLevel(this, this.editorLevelData);
        // Prepare geometry for edge-clamp and coins
        this.prepareGeometry(this.editorLevelData);
        // Set camera to view the level from a suitable position (standard top-left origin)
        const b = this.editorLevelData.settings?.bounds;
        if (b) {
          this.cameras.main.setBounds(0, 0, b.width, b.height);
          this.worldHeight = b.height;
          // Scroll camera to show bottom of the level
          this.cameras.main.scrollY = Math.max(0, b.height - this.cameras.main.height);
          // Deadzone for smoother follow
          this.cameras.main.setDeadzone(this.scale.width * 0.35, this.scale.height * 0.8);
          // Clamp region to content
          this.maxXAllowed = this.computeMaxX(this.editorLevelData) + 32;
        }
      } else if (jsonData && (this.matter as any)?.world) {
        // JSON → Matter.js scene
        loadLevel(this, jsonData);
        this.prepareGeometry(jsonData);
        const b = jsonData.settings?.bounds;
        if (b) {
          this.cameras.main.setBounds(0, 0, b.width, b.height);
          this.worldHeight = b.height;
          this.cameras.main.scrollY = Math.max(0, b.height - this.cameras.main.height);
          this.cameras.main.setDeadzone(this.scale.width * 0.35, this.scale.height * 0.8);
          this.maxXAllowed = this.computeMaxX(jsonData) + 32;
        }
      } else if ((this.physics as any)?.world) {
        // Fallback → manual Arcade-based layout from LevelConfig
        this.setupArcadeFallback();
      } else if ((this.matter as any)?.world) {
        // Fallback → build from LevelConfig using Matter when Arcade isn't available
        this.setupMatterFallback();
      } else {
        // As a last resort, create a bare scene without physics
        this.add.text(20, 20, 'No physics plugins available', { color: '#f33' }).setScrollFactor(0);
      }

      // Camera follow and controls hookup
      const player = this.children.getByName("player_1") as
        | Phaser.Physics.Matter.Image
        | Phaser.GameObjects.Sprite
        | undefined;

      if (player) {
        console.log('[PlayScene] Player found at:', (player as any).x, (player as any).y);
        console.log('[PlayScene] Camera bounds:', this.cameras.main.getBounds());
        this.cameras.main.startFollow(
          player as any,
          true,
          CAMERA_CONFIG.FOLLOW_LERP,
          CAMERA_CONFIG.FOLLOW_LERP
        );
        // Set moderate zoom for readability
        this.cameras.main.setZoom(1.2);
        this.cameras.main.roundPixels = true;
        // After zoom, ensure bottom is still visible
        this.cameras.main.scrollY = Math.max(0, this.worldHeight - this.cameras.main.height);
        console.log('[PlayScene] Camera zoom:', this.cameras.main.zoom, 'Following player:', (player as any).name);

        // Debug overlay
        this.dbg = this.add.text(8, 8, '', { color: '#111', fontSize: '12px' }).setScrollFactor(0);
        // Ensure idle to start
        (player as any).play?.('player-idle');

        // If we are in Matter mode, wire up simple platformer controls
        if ((this.matter as any)?.world && (player as any).body) {
          this.mPlayer = player as Phaser.Physics.Matter.Image;

          // Keyboard
          this.cursors = this.input.keyboard!.createCursorKeys();
          this.wasd = {
            up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
          };
          this.input.keyboard!.addCapture([Phaser.Input.Keyboard.KeyCodes.SPACE]);

          // Touch to jump (ignore desktop left-click to avoid accidental scene interactions)
          this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
            const evt: any = pointer.event as any;
            const pointerType = evt?.pointerType ?? (pointer as any).pointerType;
            const isTouch = pointerType === 'touch' || (pointer as any).wasTouch;
            if (!isTouch) return;
            if (this.groundedContacts > 0) {
              this.mPlayer!.setVelocityY(-this.levelConfig.jumpVelocity);
            }
          });

          // Ground detection via collision count with static bodies
          this.mPlayer.setOnCollide((data: any) => {
            const other: any = data?.bodyB;
            if (other && other.isStatic) {
              // consider ground when the other body is below or level with the player
              if (other.position.y >= this.mPlayer!.body.position.y - 0.5) this.groundedContacts++;
            }
          });
          this.mPlayer.setOnCollideEnd((data: any) => {
            const other: any = data?.bodyB;
            if (other && other.isStatic) {
              this.groundedContacts = Math.max(0, this.groundedContacts - 1);
            }
          });
        }
      } else {
        console.warn('[PlayScene] Player not found!');
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

  /** Fallback: builds a simple Matter-physics level using LevelConfig */
  private setupMatterFallback(): void {
    const level = this.levelConfig;
    const W = level.worldWidth;
    const H = level.worldHeight;

    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.setBackgroundColor(level.bgColor);
    this.matter.world.setBounds(0, 0, W, H);

    // Platforms as static bodies
    if (level.platforms && level.platforms.length > 0) {
      level.platforms.forEach((r) => {
        this.matter.add.rectangle(r.x, r.y, r.width, r.height, { isStatic: true, label: 'platform' });
        // Optional visual
        this.add.rectangle(r.x, r.y, r.width, r.height, r.color ?? COLORS.PLATFORM_ALT).setDepth(-1);
      });
    } else {
      this.matter.add.rectangle(W / 2, H - 20, W, 40, { isStatic: true });
      this.add.rectangle(W / 2, H - 20, W, 40, COLORS.PLATFORM_ALT).setDepth(-1);
    }

    // Player as Matter body
    const startX = level.playerStartX ?? 200;
    const startY = level.playerStartY ?? Math.max(0, H - 100);
    const player = this.matter.add.image(startX, startY, 'player-idle-1');
    player.setCircle(20);
    player.setBounce(0.1);
    player.setFriction(0.05);
    player.setFixedRotation();
    player.setName('player_1');

    // Camera follow
    this.cameras.main.startFollow(player, true, 0.08, 0.08);
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

    // Coin spin animation (loops)
    if (!this.anims.exists('coin-spin')) {
      this.anims.create({
        key: 'coin-spin',
        frames: [1, 2, 3, 4].map((i) => ({ key: `coin-${i}` })),
        frameRate: 4,
        repeat: -1,
      });
    }

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

  private ensurePlayerAnimations(): void {
    // Idle (gentle)
    if (!this.anims.exists('player-idle')) {
      this.anims.create({ key: 'player-idle', frames: [1,2,3,4].map(i=>({key:`player-idle-${i}`})), frameRate: 4, repeat: -1 });
    }
    // Jump (slower)
    if (!this.anims.exists('player-jump')) {
      this.anims.create({ key: 'player-jump', frames: [1,2,3,4,5].map(i=>({key:`player-jump-${i}`})), frameRate: 6, repeat: -1 });
    }
    // Run (calm pace, fallback to idle frames if run not present)
    if (!this.anims.exists('player-run')) {
      const hasRun = this.textures.exists('player-run-1');
      this.anims.create({
        key: 'player-run',
        frames: (hasRun ? [1,2,3,4,5,6].map(i=>({key:`player-run-${i}`})) : [1,2,3,4].map(i=>({key:`player-idle-${i}`}))),
        frameRate: hasRun ? 8 : 6,
        repeat: -1,
      });
    }
  }

  private prepareGeometry(level: LevelData): void {
    this.platformRects = [];
    this.coinSprites = [];
    for (const obj of level.objects) {
      if (obj.type === 'platform') {
        const w = (obj.scale?.x ?? 1) * 100;
        const h = (obj.scale?.y ?? 1) * 20;
        this.platformRects.push({ l: obj.position.x - w / 2, r: obj.position.x + w / 2, t: obj.position.y - h / 2, b: obj.position.y + h / 2 });
      } else if ((obj as any).type === 'coin') {
        // find the GameObject by id after load
        const go = this.children.getByName(obj.id) as Phaser.GameObjects.Sprite | undefined;
        if (go) this.coinSprites.push(go);
      }
    }
  }

  private computeMaxX(level: LevelData): number {
    let maxX = 0;
    for (const obj of level.objects) {
      const w = (obj.scale?.x ?? 1) * (obj.type === 'platform' ? 100 : 32);
      maxX = Math.max(maxX, obj.position.x + w / 2);
    }
    return maxX;
  }

  private hasSupportAt(x: number, y: number): boolean {
    for (const r of this.platformRects) {
      if (x >= r.l && x <= r.r && y >= r.t - 2 && y <= r.b + 2) return true;
    }
    return false;
  }

  public override update(_time: number, delta: number): void {
    // Scroll controls
    if (this.cameras?.main) {
      this.cameras.main.scrollX += this.cameraScrollSpeed * (delta / 16);
    }

    // Debug overlay text
    if (this.dbg) {
      const cam = this.cameras.main;
      const px = this.mPlayer ? Math.round(this.mPlayer.x) : (this.player ? Math.round(this.player.x) : 0);
      const py = this.mPlayer ? Math.round(this.mPlayer.y) : (this.player ? Math.round(this.player.y) : 0);
      this.dbg.setText(`cam=(${Math.round(cam.scrollX)},${Math.round(cam.scrollY)}) zoom=${cam.zoom} player=(${px},${py}) objs=${this.children.list.length}`);
    }

    // Arcade-mode controls
    if (this.player && this.playerBody && this.cursors) {
      const left = this.cursors.left.isDown || this.wasd.left.isDown;
      const right = this.cursors.right.isDown || this.wasd.right.isDown;
      const up = this.cursors.up.isDown || this.wasd.up.isDown || this.cursors.space.isDown;

      let vx = 0;
      const speed = 50; // slower walking speed
      if (left) vx = -speed;
      if (right) vx = speed;
      this.playerBody.setVelocityX(vx);
      // Clamp to content extent
      if (this.player.x > this.maxXAllowed) {
        this.player.x = this.maxXAllowed;
        if (this.playerBody.velocity.x > 0) this.playerBody.setVelocityX(0);
      }

      const onFloor = this.playerBody.blocked.down;
      if (up && onFloor) this.playerBody.setVelocityY(-this.levelConfig.jumpVelocity);

      if (vx < 0) this.player.setFlipX(true);
      else if (vx > 0) this.player.setFlipX(false);

      if (!onFloor) {
        if (this.player.anims.currentAnim?.key !== 'player-jump') this.player.play('player-jump', true);
      } else {
        if (vx === 0 && this.player.anims.currentAnim?.key !== 'player-idle') this.player.play('player-idle', true);
        if (vx !== 0 && this.player.anims.currentAnim?.key !== 'player-run') this.player.play('player-run', true);
      }
    }

    // Matter-mode controls (grid stepping)
    if (this.mPlayer && this.cursors) {
      const now = this.time.now;
      if (this.isStepping) return;
      const justLeft = Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.wasd.left);
      const justRight = Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.wasd.right);
      const up = this.cursors.up.isDown || this.wasd.up.isDown || this.cursors.space.isDown;

      const GRID = 32;
      let moved = false;

      if ((justLeft || justRight) && now - this.lastStepAt >= this.stepCooldownMs) {
        const dir = justRight ? 1 : -1;
        const targetX = this.mPlayer.x + dir * GRID;
        const footY = this.mPlayer.y + 24;
        // Only step if there is support under the destination
        if (this.hasSupportAt(targetX, footY)) {
          this.mPlayer.setVelocity(0, 0);
          this.isStepping = true;
          // Smooth tween one tile
          this.tweens.add({
            targets: this.mPlayer,
            x: targetX,
            duration: 180,
            ease: 'Sine.easeInOut',
            onComplete: () => {
              this.isStepping = false;
              this.lastStepAt = this.time.now;
            },
          });
          moved = true;
          if (dir < 0) (this.mPlayer as any).setFlipX?.(true); else (this.mPlayer as any).setFlipX?.(false);
        }
      }

      // Clamp to content extent
      if (this.mPlayer.x > this.maxXAllowed) {
        this.mPlayer.setPosition(this.maxXAllowed, this.mPlayer.y);
      }

      // Jump exactly one tile up (32px) using a short tween and velocity
      if (up && this.groundedContacts > 0 && !this.isStepping) {
        this.mPlayer.setVelocity(0, 0);
        const targetY = this.mPlayer.y - 32;
        this.isStepping = true;
        this.tweens.add({
          targets: this.mPlayer,
          y: targetY,
          duration: 150,
          ease: 'Sine.easeOut',
          onComplete: () => {
            this.isStepping = false;
          },
        });
      }

      // Track last safe position when grounded
      if (this.groundedContacts > 0) this.lastSafePos = { x: this.mPlayer.x, y: this.mPlayer.y };
      // Respawn to last safe if we fall below screen
      const camBounds = this.cameras.main.getBounds();
      if (this.mPlayer.y > camBounds.bottom + 200 && this.lastSafePos) {
        this.mPlayer.setPosition(this.lastSafePos.x, this.lastSafePos.y);
        this.mPlayer.setVelocity(0, 0);
      }

      // Coin collection by proximity
      if (this.coinSprites.length) {
        for (const c of [...this.coinSprites]) {
          if (!c.active || !c.visible) continue;
          const dx = c.x - this.mPlayer.x;
          const dy = c.y - this.mPlayer.y;
          if (dx * dx + dy * dy < 26 * 26) {
            c.destroy();
            this.coinSprites = this.coinSprites.filter((s) => s !== c);
          }
        }
      }
    }
  }

}
