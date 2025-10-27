import Phaser from 'phaser';
import { loadLevel } from '@/game/level/json-conversion';
import type { LevelData } from '@/game/level/level-schema';
import type { LevelConfig } from '@/game/level/level-types';
import {
  CAMERA_CONFIG,
  GAME_CONFIG,
  SCENE_KEYS,
} from '@/constants/game-constants';
import { DEFAULT_LEVEL } from '@/game/level/level-types';

async function fetchLevelData(levelName: string): Promise<LevelData | null> {
  try {
    const url = `/levels/${levelName}.json`;
    console.log('[fetchLevelData] Fetching:', url);
    const response = await fetch(url);
    console.log('[fetchLevelData] Response status:', response.status);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as LevelData;
    if (!data || typeof data !== 'object') throw new Error('Invalid structure');
    console.log('[fetchLevelData] Level loaded successfully:', data.name);
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
  private levelName?: string;

  private levelConfig: LevelConfig;

  constructor(level?: LevelConfig, levelName?: string) {
    super({ key: SCENE_KEYS.PLAY });
    this.levelConfig = level ?? DEFAULT_LEVEL;
    if (levelName !== undefined) {
      this.levelName = levelName;
    }
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

    this.load.image('spring', `${base}Spring.png`);
    this.load.image('spike', `${base}Spikes.png`);
    this.load.image('grass', `${base}Grass.png`);

    for (let i = 0; i <= 4; i++) {
      this.load.image(`player-idle-${i}`, `${base}Animations/Idle/${i}.png`);
    }

    for (let i = 0; i <= 4; i++) {
      this.load.image(`player-jump-${i}`, `${base}Animations/Jump/${i}.png`);
    }

    for (let i = 0; i <= 4; i++) {
      this.load.image(`coin-${i}`, `${base}Animations/Coin/${i}.png`);
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

      if ((this.physics as any)?.world) {
        this.physics.world.gravity.y = this.levelConfig.gravityY;
      }

      if (this.editorLevelData) {
        loadLevel(this, this.editorLevelData);
        const b = this.editorLevelData.settings?.bounds;
        if (b) this.cameras.main.setBounds(0, 0, b.width, b.height);
      } else if (jsonData) {
        loadLevel(this, jsonData);
        const b = jsonData.settings?.bounds;
        if (b) this.cameras.main.setBounds(0, 0, b.width, b.height);
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
          player,
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

    this.input.on(Phaser.Input.Events.POINTER_DOWN, () => {
      if (this.playerBody?.blocked.down) {
        this.playerBody.setVelocityY(-this.levelConfig.jumpVelocity);
      }
    });
  }

  private setupCollisions(): void {
    const platforms = this.children.list.filter(
      (child) => child.name && child.name.startsWith('platform_')
    ) as Phaser.GameObjects.GameObject[];

    if (platforms.length > 0) {
      this.physics.add.collider(this.player, platforms);
    }
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
      if (this.player.anims.currentAnim?.key !== 'player-jump-sequence') {
        this.player.play('player-jump-sequence', true);
      }
    } else {
      if (this.player.anims.currentAnim?.key !== 'player-idle') {
        this.player.play('player-idle', true);
      }
    }
  }
}
