import Phaser from 'phaser';
import { loadLevel } from '@/game/level/json-conversion';
import type { LevelData } from '@/game/level/level-schema';
import type { LevelConfig } from '@/game/level/level-types';
import {
  CAMERA_CONFIG,
  GAME_CONFIG,
  SCENE_KEYS,
  ENTITY_CONFIG,
  SPRING,
} from '@/constants/game-constants';
import { DEFAULT_LEVEL } from '@/game/level/level-types';

async function fetchLevelData(levelName: string): Promise<LevelData | null> {
  try {
    // First try to load from API by ID
    const apiUrl = `/api/levels/${levelName}`;
    console.log('[fetchLevelData] Trying API:', apiUrl);
    let response = await fetch(apiUrl);
    if (response.ok) {
      const data = (await response.json()) as LevelData;
      if (!data || typeof data !== 'object') throw new Error('Invalid structure');
      console.log('[fetchLevelData] Level loaded from API:', (data as any).id || data.name);
      return data;
    }

    // Fallback to static JSON file by name
    const url = `/levels/${levelName}.json`;
    console.log('[fetchLevelData] Fallback to static:', url);
    response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as LevelData;
    if (!data || typeof data !== 'object') throw new Error('Invalid structure');
    console.log('[fetchLevelData] Level loaded from static JSON:', data.name);
    return data;
  } catch (err) {
    console.warn(`[PlayScene] Failed to fetch level '${levelName}':`, err);
    return null;
  }
}

export class PlayScene extends Phaser.Scene {
  public cameraScrollSpeed = 0;
  private fromEditor = false;
  private editorLevelData: LevelData | null = null;
  private levelName?: string;

  private levelConfig: LevelConfig;
  // private dbg?: Phaser.GameObjects.Text;
  // private maxXAllowed: number = Infinity;
  // private worldHeight: number = 0;
  // private platformRects: Array<{ l: number; r: number; t: number; b: number }> = [];
  private lastSafePos: { x: number; y: number } | null = null;
  private platformCount: number = 0;
  // private coinSprites: Phaser.GameObjects.Sprite[] = [];
  // Grid-step debounce
  // private stepCooldownMs = 220;
  // private lastStepAt = 0;
  // private isStepping = false;
  // private lastDir: -1 | 1 = 1;
  // Spring overlap cooldown
  private springCooldownMs = 250;
  private springCooldownUntil = 0;

  constructor(level?: LevelConfig, levelName?: string) {
    super({ key: SCENE_KEYS.PLAY });
    this.levelConfig = level ?? DEFAULT_LEVEL;
    if (levelName !== undefined) {
      this.levelName = levelName;
    }
  }

  preload() {
    this.load.on(
      Phaser.Loader.Events.FILE_LOAD_ERROR,
      (file: Phaser.Loader.File) => {
        const msg = `Load error: ${file?.key ?? ''} -> ${file?.src ?? ''}`;
        console.warn(msg);
      }
    );

    const base = '/';
    this.load.image('spring', `${base}spring.png`);
    this.load.image('spike', `${base}spikes.png`);
    this.load.image('grass', `${base}grass.png`);
    this.load.image('ground', `${base}ground.png`);
    this.load.image('grass-filler', `${base}grass-filler.png`);
    this.load.image('lava', `${base}lava.png`);
    this.load.image('lava-filler', `${base}lava-filler.png`);
    this.load.image('door', `${base}door.png`);

    for (let i = 0; i <= 4; i++) {
      this.load.image(`player-idle-${i}`, `${base}idle/${i}.png`);
    }

    for (let i = 0; i <= 4; i++) {
      this.load.image(`player-jump-${i}`, `${base}jump/${i}.png`);
    }

    for (let i = 0; i <= 4; i++) {
      this.load.image(`coin-${i}`, `${base}coin/${i}.png`);
    }

    // Enemy frames for play scene
    for (let i = 0; i <= 4; i++) {
      this.load.image(`enemy-${i}`, `${base}enemy/${i}.png`);
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
  public init(data: {
    useMapControls?: boolean;
    level?: LevelConfig;
    levelData?: LevelData;
  }): void {
    // Reset state on init
    this.fromEditor = false;
    this.editorLevelData = undefined as unknown as LevelData;
    this.platformCount = 0;
    this.lastSafePos = undefined as unknown as { x: number; y: number };
    this.springCooldownUntil = 0;
    
    if (data.levelData) {
      this.editorLevelData = data.levelData;
      this.fromEditor = true;
    } else if (data.level) {
      this.levelConfig = data.level;
      this.fromEditor = true;
    } else {
      this.fromEditor = false;
    }
    
    console.log('[PlayScene] Init called with fromEditor:', this.fromEditor);
  }
  
  public shutdown(): void {
    console.log('[PlayScene] Shutdown - cleaning up');
    // Remove all event listeners
    this.events.removeAllListeners();
    // Clean up any tweens
    this.tweens.killAll();
    // Stop animations
    this.anims.pauseAll();
  }

  public async create(): Promise<void> {
    try {
      await new Promise((resolve) => this.time.delayedCall(0, resolve));

      let jsonData: LevelData | null = null;
      if (!this.fromEditor) {
        const levelToLoad = this.levelName || GAME_CONFIG.DEFAULT_LEVEL;
        console.log('[PlayScene] Loading level:', levelToLoad);
        jsonData = await fetchLevelData(levelToLoad);
        console.log(
          '[PlayScene] Level data loaded:',
          jsonData ? 'SUCCESS' : 'FAILED'
        );
      }

      const keys = [
        'player-idle-0',
        'player-idle-1',
        'player-idle-2',
        'player-idle-3',
        'player-jump-0',
      ];
      const missing = keys.filter((k) => !this.textures.exists(k));
      const dbg = this.add.text(
        8,
        8,
        missing.length ? `Missing: ${missing.join(', ')}` : 'Player frames OK',
        { color: '#111', fontSize: '12px' }
      );
      dbg.setScrollFactor(0);

      // Ensure coin animation exists
      const coinFrames = [0, 1, 2, 3, 4]
        .filter((i) => this.textures.exists(`coin-${i}`))
        .map((i) => ({ key: `coin-${i}` }));
      if (!this.anims.exists('coin-spin') && coinFrames.length > 0) {
        this.anims.create({
          key: 'coin-spin',
          frames: coinFrames,
          frameRate: 6,
          repeat: -1,
        });
      }
      
      // Ensure player idle animation exists
      const idleFrames = [0, 1, 2, 3, 4]
        .filter((i) => this.textures.exists(`player-idle-${i}`))
        .map((i) => ({ key: `player-idle-${i}` }));
      if (!this.anims.exists('player-idle') && idleFrames.length > 0) {
        this.anims.create({
          key: 'player-idle',
          frames: idleFrames,
          frameRate: 8,
          repeat: -1,
        });
      }
      
      // Ensure player jump animation exists
      const jumpFrames = [0, 1, 2, 3, 4]
        .filter((i) => this.textures.exists(`player-jump-${i}`))
        .map((i) => ({ key: `player-jump-${i}` }));
      if (!this.anims.exists('player-jump-sequence') && jumpFrames.length > 0) {
        this.anims.create({
          key: 'player-jump-sequence',
          frames: jumpFrames.length > 0 ? jumpFrames : idleFrames,
          frameRate: 12,
          repeat: 0,
        });
      }

      // Ensure enemy walk animation exists
      const enemyFrames = [0, 1, 2, 3, 4]
        .filter((i) => this.textures.exists(`enemy-${i}`))
        .map((i) => ({ key: `enemy-${i}` }));
      if (!this.anims.exists('enemy-walk') && enemyFrames.length > 0) {
        this.anims.create({
          key: 'enemy-walk',
          frames: [0, 1, 2, 3, 4].map((i) => ({ key: `enemy-${i}` })),
          frameRate: 6,
          repeat: -1,
        });
      }

      if ((this.physics as any)?.world) {
        this.physics.world.gravity.y = this.levelConfig.gravityY;
      }

      if (this.editorLevelData) {
        loadLevel(this, this.editorLevelData);
        const b = this.editorLevelData.settings?.bounds;
        if (b) {
          this.cameras.main.setBounds(0, 0, b.width, b.height);
        }
      } else if (jsonData) {
        loadLevel(this, jsonData);
        const b = jsonData.settings?.bounds;
        if (b) {
          this.cameras.main.setBounds(0, 0, b.width, b.height);
        }
      } else {
        this.add
          .text(50, 50, 'No level data found', {
            color: '#ff3333',
            fontSize: '18px',
          })
          .setScrollFactor(0);
        return;
      }

      const player = this.children.getByName('player_1') as
        | Phaser.GameObjects.Sprite
        | undefined;

      if (player) {
        console.log('[PlayScene] Player found at:', player.x, player.y);
        console.log(
          '[PlayScene] Camera bounds:',
          this.cameras.main.getBounds()
        );
        this.cameras.main.startFollow(
          player as any,
          true,
          CAMERA_CONFIG.FOLLOW_LERP,
          CAMERA_CONFIG.FOLLOW_LERP
        );

        this.cameras.main.setZoom(this.fromEditor ? 2 : CAMERA_CONFIG.ZOOM);
        this.cameras.main.roundPixels = true;
        console.log(
          '[PlayScene] Camera zoom:',
          this.cameras.main.zoom,
          'Following player:',
          player.name
        );

        if ((this.physics as any)?.world && player.body) {
          this.player =
            player as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
          this.playerBody = player.body as Phaser.Physics.Arcade.Body;
          this.setupPlayerControls();
          this.setupCollisions();
          // Initialize last safe position (load from storage if available)
          try {
            const saved = localStorage.getItem('lastSafePos');
            if (saved) {
              const pos = JSON.parse(saved);
              if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
                this.lastSafePos = pos;
              }
            }
          } catch { }
          if (!this.lastSafePos) {
            this.lastSafePos = { x: this.player.x, y: this.player.y };
          }
          // Harden player physics
          this.playerBody.setBounce(0, 0);
          this.playerBody.setDragX(900);
          this.playerBody.setMaxVelocity(400, 1200);
        }
      } else {
        console.warn('[PlayScene] Player not found!');
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

  private setupPlayerControls(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.input.keyboard!.addCapture([Phaser.Input.Keyboard.KeyCodes.SPACE]);

    // Remove the click handler - we'll handle jump in update()
  }

  private setupCollisions(): void {
    const platforms = this.children.list.filter((child: any) => {
      const isPlatform = typeof child?.getData === 'function' && child.getData('isPlatform');
      const isHazard = typeof child?.getData === 'function' && (child.getData('isSpike') || child.getData('isSpring') || child.getData('isLava'));
      const hasBody = !!(child as any)?.body;
      return hasBody && isPlatform && !isHazard;
    }) as Phaser.GameObjects.GameObject[];

    console.log(`[setupCollisions] Found ${platforms.length} platforms with physics bodies`);
    platforms.forEach((p: any) => {
      console.log(`[setupCollisions] Platform ${p.name}: x=${p.x}, y=${p.y}, body=${!!p.body}, immovable=${p.body?.immovable}`);
    });

    this.platformCount = platforms.length;
    if (platforms.length > 0) {
      // Add collider for each platform with callback to capture last safe block
      platforms.forEach((platform) => {
        this.physics.add.collider(
          this.player,
          platform,
          // collide callback
          (_p: any, plat: any) => this.onPlayerPlatformCollide(plat as any),
          undefined,
          this
        );
      });
      console.log(`[setupCollisions] Added ${platforms.length} colliders between player and platforms`);
    } else {
      console.warn('[setupCollisions] No platforms found!');
    }

    // Overlaps for spikes and springs (non-blocking hazards)
    const spikes = this.children.list.filter((c: any) => {
      const tagged = typeof c?.getData === 'function' && c.getData('isSpike');
      const tex = (c as any)?.texture?.key;
      const name = (c as any)?.name ?? '';
      return tagged || tex === 'spike' || /spike/i.test(name);
    }) as Phaser.GameObjects.GameObject[];

    const springs = this.children.list.filter((c: any) => {
      const tagged = typeof c?.getData === 'function' && c.getData('isSpring');
      const tex = (c as any)?.texture?.key;
      const name = (c as any)?.name ?? '';
      return tagged || tex === 'spring' || /spring/i.test(name);
    }) as Phaser.GameObjects.GameObject[];

    const lavas = this.children.list.filter((c: any) => {
      const tagged = typeof c?.getData === 'function' && c.getData('isLava');
      const tex = (c as any)?.texture?.key;
      const name = (c as any)?.name ?? '';
      return tagged || tex === 'lava' || /lava/i.test(name);
    }) as Phaser.GameObjects.GameObject[];

    const coins = this.children.list.filter((c: any) => {
      const tagged = typeof c?.getData === 'function' && c.getData('isCoin');
      const tex = (c as any)?.texture?.key;
      const name = (c as any)?.name ?? '';
      return tagged || tex === 'coin' || /coin/i.test(name);
    }) as Phaser.GameObjects.GameObject[];

    const doors = this.children.list.filter((c: any) => {
      const tagged = typeof c?.getData === 'function' && c.getData('isDoor');
      const tex = (c as any)?.texture?.key;
      const name = (c as any)?.name ?? '';
      return tagged || tex === 'door' || /door/i.test(name);
    }) as Phaser.GameObjects.GameObject[];

    console.log(`[setupCollisions] Hazards: spikes=${spikes.length}, springs=${springs.length}, lava=${lavas.length}, coins=${coins.length}, doors=${doors.length}`);

    spikes.forEach((spike) => {
      this.physics.add.overlap(this.player, spike, this.onPlayerSpikeOverlap, undefined, this);
    });
    springs.forEach((spring) => {
      this.physics.add.overlap(this.player, spring, this.onPlayerSpringOverlap, undefined, this);
    });
    lavas.forEach((lava) => {
      this.physics.add.overlap(this.player, lava, this.onPlayerLavaOverlap, undefined, this);
    });
    coins.forEach((coin) => {
      this.physics.add.overlap(this.player, coin, this.onPlayerCoinOverlap, undefined, this);
    });
    doors.forEach((door) => {
      this.physics.add.overlap(this.player, door, this.onPlayerDoorOverlap, undefined, this);
    });
  }

  private getOneBlockJumpVelocity(): number {
    const g = (this.physics as any)?.world?.gravity?.y ?? this.levelConfig.gravityY ?? 800;
    const h = ENTITY_CONFIG.PLATFORM_HEIGHT; // one cell high
    // Slightly higher than one block (~1.8x) per request
    return Math.sqrt(2 * g * h * 1.8);
  }



  private onPlayerPlatformCollide(platform: Phaser.GameObjects.GameObject): void {
    if (!this.player || !this.playerBody) return;
    
    // Only register as safe position if player is landing from above
    const platAny: any = platform as any;
    const body: any = platAny.body;
    
    // Check if player is above the platform (landing on it, not hitting from below)
    const playerBottom = this.playerBody.bottom;
    let platformTop: number;

    if (body && typeof body.top === 'number') {
      platformTop = body.top;
    } else {
      const ph = (platAny.displayHeight ?? platAny.height ?? 0);
      const py = platAny.y ?? this.player.y;
      platformTop = py - ph / 2;
    }

    // Only update safe position if player is on top of platform (not below or inside)
    if (this.playerBody.blocked.down && playerBottom <= platformTop + 5) {
      const playerHalfH = (this.player.displayHeight ?? 32) / 2;
      const safeY = platformTop - playerHalfH - 1;
      this.lastSafePos = { x: this.player.x, y: safeY };
      try {
        localStorage.setItem('lastSafePos', JSON.stringify(this.lastSafePos));
      } catch { }
    }
  }

  private onPlayerSpikeOverlap(): void {
    if (!this.player || !this.playerBody) return;
    // Flash red and respawn at last safe block
    this.player.setTint(0xff0000);
    this.time.delayedCall(120, () => this.player.clearTint());
    const rx = this.lastSafePos?.x ?? this.levelConfig.playerStartX ?? this.player.x;
    const ry = this.lastSafePos?.y ?? this.levelConfig.playerStartY ?? this.player.y;
    this.player.setPosition(rx, ry);
    this.playerBody.setVelocity(0, 0);
  }

  private onPlayerSpringOverlap(_p: any, spring: any): void {
    const now = this.time.now;
    if (now < this.springCooldownUntil) return;
    this.springCooldownUntil = now + this.springCooldownMs;
    // Place player just above spring then apply bounce
    const body: any = spring?.body;
    const top = typeof body?.top === 'number' ? body.top : (spring.y - (spring.displayHeight ?? spring.height ?? 24) / 2);
    const halfH = (this.player.displayHeight ?? 32) / 2;
    this.player.setY(top - halfH - 1);
    // Compute bounce to ~3 tiles height
    const g = (this.physics as any)?.world?.gravity?.y ?? this.levelConfig.gravityY ?? 800;
    const height = ENTITY_CONFIG.PLATFORM_HEIGHT * 3;
    const neededV = Math.sqrt(2 * g * height);
    const v = Math.min(neededV, SPRING.BOUNCE_FORCE * 2); // Allow higher bounce
    this.playerBody.setVelocityY(-v);
    // Save as safe position
    this.lastSafePos = { x: this.player.x, y: this.player.y };
  }

  private onPlayerLavaOverlap(): void {
    // Same behavior as spike
    this.onPlayerSpikeOverlap();
  }

  private onPlayerCoinOverlap(_p: any, coin: any): void {
    if (!coin || !coin.active) return;
    // Destroy the coin with a fade effect
    this.tweens.add({
      targets: coin,
      alpha: 0,
      scale: 1.5,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        coin.destroy();
      }
    });
    console.log('[PlayScene] Coin collected!');
  }

  private onPlayerDoorOverlap(): void {
    if (!this.player) return;
    
    // Freeze player movement
    this.playerBody.setVelocity(0, 0);
    this.playerBody.allowGravity = false;
    
    // Show level complete message
    const centerX = this.cameras.main.worldView.centerX;
    const centerY = this.cameras.main.worldView.centerY;
    
    const bg = this.add.rectangle(centerX, centerY, 400, 200, 0x000000, 0.8);
    bg.setScrollFactor(0);
    bg.setDepth(1000);
    bg.setOrigin(0.5, 0.5);
    
    const text = this.add.text(centerX, centerY, 'Level Finished!', {
      fontSize: '48px',
      color: '#00ff00',
      fontStyle: 'bold',
      align: 'center'
    });
    text.setScrollFactor(0);
    text.setDepth(1001);
    text.setOrigin(0.5, 0.5);
    
    // Pulse animation
    this.tweens.add({
      targets: text,
      scale: 1.1,
      duration: 500,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        // After animation, respawn player to start
        const startX = this.levelConfig.playerStartX ?? 50;
        const startY = this.levelConfig.playerStartY ?? 100;
        this.player.setPosition(startX, startY);
        this.playerBody.setVelocity(0, 0);
        this.playerBody.allowGravity = true;
        
        // Remove message
        bg.destroy();
        text.destroy();
      }
    });
    
    console.log('[PlayScene] Level completed!');
  }

  public override update(_time: number, delta: number): void {
    if (this.cameras?.main) {
      this.cameras.main.scrollX += this.cameraScrollSpeed * (delta / 16);
    }

    if (!this.player || !this.playerBody || !this.cursors) return;

    // If there are no platforms, freeze movement and keep player at last saved grass block
    if (this.platformCount === 0) {
      const targetX = this.lastSafePos?.x ?? this.levelConfig.playerStartX ?? this.player.x;
      const targetY = this.lastSafePos?.y ?? this.levelConfig.playerStartY ?? this.player.y;
      this.player.setPosition(targetX, targetY);
      this.playerBody.setVelocity(0, 0);
      this.playerBody.allowGravity = false;
      return;
    } else {
      this.playerBody.allowGravity = true;
    }

    // Check if player fell off the world - respawn to last safe position if available
    const worldHeight = this.editorLevelData?.settings?.bounds?.height || 600;
    if (this.player.y > worldHeight + 100) {
      console.log('[PlayScene] Player fell off world, respawning');
      const respawnX = this.lastSafePos?.x ?? this.levelConfig.playerStartX ?? 50;
      const respawnY = this.lastSafePos?.y ?? this.levelConfig.playerStartY ?? 100;
      this.player.setPosition(respawnX, respawnY);
      this.playerBody.setVelocity(0, 0);
    }

    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up =
      this.cursors.up.isDown ||
      this.wasd.up.isDown ||
      this.cursors.space.isDown;

    // Horizontal movement
    let vx = 0;
    if (left) vx = -this.levelConfig.moveSpeed;
    if (right) vx = this.levelConfig.moveSpeed;
    this.playerBody.setVelocityX(vx);

    // Check if player is on the ground
    const onFloor = this.playerBody.blocked.down; // use blocked.down for reliable ground check

    // Record last safe (on-floor) position for respawn
    if (onFloor) {
      this.lastSafePos = { x: this.player.x, y: this.player.y };
      // Prevent downward "sinking" when grounded
      if (this.playerBody.velocity.y > 0) {
        this.playerBody.setVelocityY(0);
      }
    }

    // Jump - only when on ground and jump key pressed
    if (up && onFloor) {
      // compute velocity to reach ~1 block height only
      const oneBlockV = this.getOneBlockJumpVelocity();
      const jump = Math.min(this.levelConfig.jumpVelocity, oneBlockV);
      this.playerBody.setVelocityY(-jump);
    }

    // // Debug overlay text
    // if (this.dbg) {
    //   const cam = this.cameras.main;
    //   const px = Math.round(this.player.x);
    //   const py = Math.round(this.player.y);
    //   const vy = Math.round(this.playerBody.velocity.y);
    //   this.dbg.setText(`player=(${px},${py}) vy=${vy} onFloor=${onFloor} objs=${this.children.list.length}`);
    // }

    // Flip sprite based on direction
    if (vx < 0) this.player.setFlipX(true);
    else if (vx > 0) this.player.setFlipX(false);

    // Play animations only if they exist
    if (!onFloor) {
      if (this.anims.exists('player-jump-sequence') && this.player.anims.currentAnim?.key !== 'player-jump-sequence') {
        this.player.play('player-jump-sequence', true);
      }
    } else {
      if (this.anims.exists('player-idle') && this.player.anims.currentAnim?.key !== 'player-idle') {
        this.player.play('player-idle', true);
      }
    }
  }
}
