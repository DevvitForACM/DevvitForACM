// src/client/game/scenes/play-scene.ts
import Phaser from "phaser";
import { createScrollControls } from "../controls/camera-controls";
import { loadLevel } from "../level/json-conversion";
import type { LevelData } from "../level/level-schema";
import { CAMERA_CONFIG, GAME_CONFIG, SCENE_KEYS } from "../../constants/game-constants";

/**
 * Helper to fetch a level JSON file asynchronously.
 * Throws descriptive errors for easier debugging.
 */
async function fetchLevelData(levelName: string): Promise<LevelData> {
  const response = await fetch(`/assets/levels/${levelName}.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch level file '${levelName}.json' — HTTP ${response.status}`);
  }

  const data = (await response.json()) as LevelData;
  if (!data || typeof data !== "object") {
    throw new Error(`Invalid level JSON structure for '${levelName}'`);
  }

  return data;
}

export class PlayScene extends Phaser.Scene {
  public cameraScrollSpeed = 0;
  private useMapControls = true;

  constructor() {
    super({ key: SCENE_KEYS.PLAY });
  }

  public init(data: { useMapControls?: boolean }): void {
    this.useMapControls = data.useMapControls ?? true;
  }

  public async create(): Promise<void> {
    try {
      // Wait one frame to ensure all systems (Matter, Camera) are initialized
      await new Promise((resolve) => this.time.delayedCall(0, resolve));

      // Verify Matter Physics system
      if (!this.matter || !this.matter.world) {
        return; // graceful fallback
      }

      // Load the level JSON
      const levelName = GAME_CONFIG.DEFAULT_LEVEL;
      const levelData = await fetchLevelData(levelName);

      // Convert JSON → Scene objects (platforms, player, etc.)
      loadLevel(this, levelData);

      // Enable optional scroll/map controls
      if (this.useMapControls && this.scene.isActive()) {
        createScrollControls(this);
      }

      // Camera follow logic
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

      // Debug overlays removed for production
    } catch {
      // Silent fail-safe UI feedback
      this.add
        .text(50, 50, "Error loading level", {
          color: "#ff3333",
          fontSize: "18px",
        })
        .setScrollFactor(0);
    }
  }

  // Called every frame
  public override update(_time: number, delta: number): void {
    if (this.cameras?.main) {
      this.cameras.main.scrollX += this.cameraScrollSpeed * (delta / 16);
    }
  }
}
