// src/client/game/scenes/play-scene.ts
console.log("[DEBUG] Loaded PlayScene.ts from updated source");

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
  private useMapControls = true;
  private levelConfig: LevelConfig;
  public cameraScrollSpeed = 0;

  constructor(level?: LevelConfig) {
    super({ key: SCENE_KEYS.PLAY });
    this.levelConfig = level ?? DEFAULT_LEVEL;
  }

  public init(data: { useMapControls?: boolean; level?: LevelConfig }): void {
    this.useMapControls = data.useMapControls ?? true;
    if (data.level) this.levelConfig = data.level;
  }

  public async create(): Promise<void> {
    const log = (msg: string) => {
      console.log(`[TEST] ${msg}`);
      const y = 20 + this.children.list.length * 18;
      this.add.text(20, y, msg, { color: "#00ff00", fontSize: "14px" }).setScrollFactor(0);
    };

    try {
      log("✅ PlayScene.create() started");
      await new Promise((resolve) => this.time.delayedCall(0, resolve));

      const levelName = GAME_CONFIG.DEFAULT_LEVEL;
      log(`📄 Attempting to load JSON: ${levelName}.json`);

      const jsonData = await fetchLevelData(levelName);

      // --- Matter vs Arcade Path ---
      // ✅ Added: Explicit Matter world verification and fallback safety
      const matterReady = !!(this.matter && this.matter.world && !this.physics);

      if (jsonData && matterReady) {
        log("⚙️ Matter world detected — loading JSON level");
        loadLevel(this, jsonData);
        log("🏗️ Level objects created from JSON");
      } else if (jsonData && !matterReady) {
        log("⚠️ Matter not initialized — using Arcade fallback");
        this.setupArcadeFallback();
      } else if (!jsonData) {
        log("❌ JSON load failed — using fallback level");
        this.setupArcadeFallback();
      }

      // Scroll/map controls
      if (this.useMapControls && this.scene.isActive()) {
        createScrollControls(this);
        log("🧭 Scroll controls initialized");
      }

      // Camera follow setup
      const player = this.children.getByName("player_1") as
        | Phaser.Physics.Matter.Image
        | Phaser.GameObjects.Sprite
        | undefined;

      if (player) {
        log("🎯 Player found — enabling camera follow");
        this.cameras.main.startFollow(
          player,
          true,
          CAMERA_CONFIG.FOLLOW_LERP,
          CAMERA_CONFIG.FOLLOW_LERP
        );
        this.cameras.main.setZoom(CAMERA_CONFIG.ZOOM);
      } else {
        log("🚫 No player found — camera follow skipped");
      }

      log("✅ PlayScene.create() completed successfully");
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
    const physics = this.physics;

    physics.world.setBounds(0, 0, level.worldWidth, level.worldHeight);
    this.cameras.main.setBounds(0, 0, level.worldWidth, level.worldHeight);
    this.cameras.main.setBackgroundColor(level.bgColor);

    const platforms = physics.add.staticGroup();
    level.platforms?.forEach((r) => {
      const rect = this.add.rectangle(r.x, r.y, r.width, r.height, r.color ?? 0x4a8f38);
      physics.add.existing(rect, true);
      platforms.add(rect as Phaser.GameObjects.GameObject);
    });

    // Simple red circle player
    const playerCircle = this.add.circle(
      level.playerStartX ?? 200,
      level.playerStartY ?? 300,
      20,
      0xff0000
    );
    const player = physics.add.existing(playerCircle, false) as unknown as Phaser.GameObjects.Arc;
    const body = player.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    physics.add.collider(player, platforms);

    this.cameras.main.startFollow(player, true, 0.08, 0.08);
  }

  public override update(_time: number, delta: number): void {
    // Scroll controls
    if (this.cameras?.main) {
      this.cameras.main.scrollX += this.cameraScrollSpeed * (delta / 16);
    }
  }
}
