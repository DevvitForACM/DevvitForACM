// src/client/game/scenes/play-scene.ts
import Phaser from "phaser";
import { createScrollControls } from "../controls/camera-controls";
import { loadLevel } from "../level/json-conversion";
import type { LevelData } from "../level/level-schema";
import type { LevelConfig } from "../level/level-types";
import { CAMERA_CONFIG, GAME_CONFIG, SCENE_KEYS } from "../../constants/game-constants";
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

      if (jsonData && this.matter && this.matter.world) {
        // JSON → Matter.js scene
        loadLevel(this, jsonData);
      } else {
        // Fallback → manual Arcade-based layout from LevelConfig
        this.setupArcadeFallback();
      }

      // Scroll/map controls
      if (this.useMapControls && this.scene.isActive()) {
        createScrollControls(this);
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
    this.physics.world.setBounds(0, 0, level.worldWidth, level.worldHeight);
    this.cameras.main.setBounds(0, 0, level.worldWidth, level.worldHeight);
    this.cameras.main.setBackgroundColor(level.bgColor);

    const platforms = this.physics.add.staticGroup();
    level.platforms?.forEach((r) => {
      const rect = this.add.rectangle(r.x, r.y, r.width, r.height, r.color ?? 0x4a8f38);
      this.physics.add.existing(rect, true);
      platforms.add(rect as Phaser.GameObjects.GameObject);
    });

    const playerCircle = this.add.circle(level.playerStartX ?? 200, level.playerStartY ?? 300, 20, 0xff0000);
    const player = this.physics.add.existing(playerCircle, false) as unknown as Phaser.GameObjects.Arc;
    const body = player.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    this.physics.add.collider(player, platforms);

    this.cameras.main.startFollow(player, true, 0.08, 0.08);
  }

  public override update(_time: number, delta: number): void {
    // Scroll controls
    if (this.cameras?.main) {
      this.cameras.main.scrollX += this.cameraScrollSpeed * (delta / 16);
    }
  }
}
