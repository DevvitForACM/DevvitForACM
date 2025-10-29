import Phaser from 'phaser';
import type { LevelData } from '@/game/level/level-schema';
import type { LevelConfig } from '@/game/level/level-types';
import { GAME_CONFIG, SCENE_KEYS } from '@/constants/game-constants';
import { DEFAULT_LEVEL } from '@/game/level/level-types';
import { audioManager } from '@/services/audio-manager';

import {
  fetchLevelData,
  createAnimations,
  setupPhysics,
  loadLevelData,
} from './play-scene/setup';
import { calculateResponsiveZoom, setupCamera } from './play-scene/camera';
import {
  setupPlayerControls,
  getPlayerInput,
  handlePlayerMovement,
  type PlayerControls,
} from './play-scene/controls';
import {
  setupCollisions,
  handlePlatformCollision,
  handleSpringCollision,
  handleCoinCollision,
} from './play-scene/collisions';
import {
  showGameOver,
  hideGameOver,
  showLevelComplete,
  type GameOverUI,
} from './play-scene/ui';
import { updateEnemyPatrol } from './play-scene/enemies';

export class PlayScene extends Phaser.Scene {
  public cameraScrollSpeed = 0;
  private fromEditor = false;
  private editorLevelData: LevelData | null = null;
  private levelName?: string;
  private levelConfig: LevelConfig;

  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private lastSafePos: { x: number; y: number } | null = null;

  private controls!: PlayerControls;
  private isMobile: boolean = false;

  private platformCount: number = 0;
  private platforms: Phaser.GameObjects.GameObject[] = [];
  private enemies: Phaser.GameObjects.GameObject[] = [];

  private springCooldownMs = 250;
  private springCooldownUntil = 0;

  private isGameOver = false;
  private gameOverUI: GameOverUI = {};

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
      this.load.image(`player-jump-${i}`, `${base}jump/${i}.png`);
      this.load.image(`coin-${i}`, `${base}coin/${i}.png`);
      this.load.image(`enemy-${i}`, `${base}enemy/${i}.png`);
    }

    for (let i = 0; i <= 2; i++) {
      this.load.image(`player-run-${i}`, `${base}run/${i}.png`);
    }
  }

  public init(data: {
    useMapControls?: boolean;
    level?: LevelConfig;
    levelData?: LevelData;
  }): void {
    this.fromEditor = false;
    this.editorLevelData = null;
    this.platformCount = 0;
    this.lastSafePos = null;
    this.springCooldownUntil = 0;
    this.isGameOver = false;
    this.gameOverUI = {};

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

  public shutdown(): void {
    this.events.removeAllListeners();
    this.tweens.killAll();
    this.anims.pauseAll();
  }

  public async create(): Promise<void> {
    try {
      await new Promise((resolve) => this.time.delayedCall(0, resolve));

      this.isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) ||
        ('ontouchstart' in window && navigator.maxTouchPoints > 0);

      let jsonData: LevelData | null = null;
      if (!this.fromEditor) {
        const levelToLoad = this.levelName || GAME_CONFIG.DEFAULT_LEVEL;
        jsonData = await fetchLevelData(levelToLoad);
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

      createAnimations(this);

      setupPhysics(this);

      const levelLoaded = loadLevelData(this, this.editorLevelData, jsonData);
      if (!levelLoaded) {
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

      if (player && (this.physics as any)?.world && player.body) {
        this.player =
          player as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
        this.playerBody = player.body as Phaser.Physics.Arcade.Body;

        setupCamera(this.cameras.main, player, this.editorLevelData);

        this.controls = setupPlayerControls(this);

        const collisionResult = setupCollisions(
          this,
          this.player,
          () => this.onPlayerSpikeOverlap(),
          () => this.onPlayerLavaOverlap(),
          () => this.onPlayerEnemyOverlap(),
          (_p, spring) => this.onPlayerSpringOverlap(_p, spring),
          (_p, coin) => this.onPlayerCoinOverlap(_p, coin),
          () => this.onPlayerDoorOverlap(),
          (platform) => this.onPlayerPlatformCollide(platform)
        );

        this.platforms = collisionResult.platforms;
        this.enemies = collisionResult.enemies;
        this.platformCount = this.platforms.length;

        try {
          const saved = localStorage.getItem('lastSafePos');
          if (saved) {
            const pos = JSON.parse(saved);
            if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
              this.lastSafePos = pos;
            }
          }
        } catch {}
        if (!this.lastSafePos) {
          this.lastSafePos = { x: this.player.x, y: this.player.y };
        }

        this.playerBody.setBounce(0, 0);
        this.playerBody.setDragX(900);
        this.playerBody.setMaxVelocity(400, 1200);
        this.playerBody.setSize(60, 100);
        this.playerBody.setOffset(0, 0);
      } else {
        console.warn('[PlayScene] Player not found!');
      }

      this.scale.on('resize', this.handleResize, this);
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

  private handleResize(): void {
    if (!this.cameras?.main) return;
    const zoom = calculateResponsiveZoom(
      this.cameras.main,
      this.editorLevelData
    );
    this.cameras.main.setZoom(zoom);
  }

  public setMobileJoystick(x: number, y: number): void {
    this.controls.mobileJoystickX = x;
  }

  public setMobileJump(pressed: boolean): void {
    this.controls.mobileJumpPressed = pressed;
  }

  private onPlayerPlatformCollide(
    platform: Phaser.GameObjects.GameObject
  ): void {
    if (!this.player || !this.playerBody) return;
    const newSafePos = handlePlatformCollision(
      this.player,
      this.playerBody,
      platform,
      this.lastSafePos
    );
    if (newSafePos) {
      this.lastSafePos = newSafePos;
    }
  }

  private onPlayerSpikeOverlap(): void {
    if (!this.player || !this.playerBody || this.isGameOver) return;
    audioManager.playDeath();
    this.player.setTint(0xff0000);
    this.time.delayedCall(300, () => {
      this.showGameOver();
    });
  }

  private onPlayerSpringOverlap(_p: any, spring: any): void {
    const result = handleSpringCollision(
      this,
      this.player,
      this.playerBody,
      spring,
      this.springCooldownUntil,
      this.springCooldownMs
    );
    this.springCooldownUntil = result.cooldownUntil;
    this.lastSafePos = result.safePos;
  }

  private onPlayerLavaOverlap(): void {
    if (!this.player || !this.playerBody || this.isGameOver) return;
    audioManager.playDeath();
    this.player.setTint(0xff0000);
    this.time.delayedCall(300, () => {
      this.showGameOver();
    });
  }

  private onPlayerEnemyOverlap(): void {
    if (!this.player || !this.playerBody || this.isGameOver) return;
    audioManager.playDeath();
    this.player.setTint(0xff0000);
    this.time.delayedCall(300, () => {
      this.showGameOver();
    });
  }

  private onPlayerCoinOverlap(_p: any, coin: any): void {
    handleCoinCollision(this, coin);
  }

  private onPlayerDoorOverlap(): void {
    if (!this.player) return;
    showLevelComplete(this, this.player, this.playerBody, this.levelConfig);
  }

  private showGameOver(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;

    if (this.player && this.playerBody) {
      this.playerBody.setVelocity(0, 0);
      this.playerBody.allowGravity = false;
    }

    this.gameOverUI = showGameOver(this, () => this.restartLevel());
  }

  private restartLevel(): void {
    hideGameOver(this.gameOverUI);
    this.isGameOver = false;

    if (this.player && this.playerBody) {
      this.playerBody.allowGravity = true;
      const rx =
        this.lastSafePos?.x ?? this.levelConfig.playerStartX ?? this.player.x;
      const ry =
        this.lastSafePos?.y ?? this.levelConfig.playerStartY ?? this.player.y;
      this.player.setPosition(rx, ry);
      this.playerBody.setVelocity(0, 0);
      this.player.clearTint();
    }
  }

  public override update(_time: number, delta: number): void {
    if (this.cameras?.main) {
      this.cameras.main.scrollX += this.cameraScrollSpeed * (delta / 16);
    }

    updateEnemyPatrol(this.enemies, this.platforms);

    if (!this.player || !this.playerBody) return;
    if (this.isGameOver) return;

    if (this.platformCount === 0) {
      const targetX =
        this.lastSafePos?.x ?? this.levelConfig.playerStartX ?? this.player.x;
      const targetY =
        this.lastSafePos?.y ?? this.levelConfig.playerStartY ?? this.player.y;
      this.player.setPosition(targetX, targetY);
      this.playerBody.setVelocity(0, 0);
      this.playerBody.allowGravity = false;
      return;
    } else {
      this.playerBody.allowGravity = true;
    }

    const worldHeight = this.editorLevelData?.settings?.bounds?.height || 600;
    if (this.player.y > worldHeight + 100) {
      const respawnX =
        this.lastSafePos?.x ?? this.levelConfig.playerStartX ?? 50;
      const respawnY =
        this.lastSafePos?.y ?? this.levelConfig.playerStartY ?? 100;
      this.player.setPosition(respawnX, respawnY);
      this.playerBody.setVelocity(0, 0);
    }

    const input = getPlayerInput(this.controls, this.isMobile);

    if (this.isMobile) {
      this.controls.mobileJumpPressed = false;
    }

    handlePlayerMovement(this.player, this.playerBody, input, this.anims);

    if (this.playerBody.blocked.down) {
      this.lastSafePos = { x: this.player.x, y: this.player.y };
      if (this.playerBody.velocity.y > 0) {
        this.playerBody.setVelocityY(0);
      }
    }
  }
}
