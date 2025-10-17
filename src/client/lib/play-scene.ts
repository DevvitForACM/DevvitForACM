import Phaser from "phaser"; import { createScrollControls } from "./temp-controls"; import { loadLevel } from "./json-conversion"; import type { LevelData } from "./level-schema"; /** * Helper to fetch a level JSON file asynchronously. * Throws descriptive errors for easier debugging. */ async function fetchLevelData(levelName: string): Promise<LevelData> { try { const response = await fetch(/assets/levels/${levelName}.json); if (!response.ok) { throw new Error( [PlayScene] Failed to fetch level file '${levelName}.json' — HTTP ${response.status} ); } const data = (await response.json()) as LevelData; if (!data || typeof data !== "object") { throw new Error([PlayScene] Invalid level JSON structure for '${levelName}'); } return data; } catch (err) { console.error("[PlayScene] Error loading level data:", err); throw err; } } export class PlayScene extends Phaser.Scene { public cameraScrollSpeed = 0; private useMapControls = true; constructor() { super({ key: "PlayScene" }); } public init(data: { useMapControls?: boolean }): void { this.useMapControls = data.useMapControls ?? true; } public async create(): Promise<void> { try { // Wait one frame to ensure all systems (Matter, Camera) are initialized await new Promise((resolve) => this.time.delayedCall(0, resolve)); // ✅ Verify Matter Physics system if (!this.matter || !this.matter.world) { console.warn( "[PlayScene] Matter physics not initialized — falling back to non-physics mode." ); } // 🔹 Load the level JSON (e.g. level1.json) const levelName = "level1"; const levelData = await fetchLevelData(levelName); // 🔹 Convert JSON → Scene objects (platforms, player, etc.) const createdObjects = loadLevel(this, levelData); console.log( [PlayScene] Level '${levelName}' loaded successfully with ${createdObjects.length ?? 0} objects. ); // 🔹 Enable optional scroll/map controls if (this.useMapControls && this.scene.isActive()) { createScrollControls(this); } // 🔹 Camera follow logic const player = this.children.getByName("player_1") as | Phaser.Physics.Matter.Image | Phaser.GameObjects.Sprite | undefined; if (player) { this.cameras.main.startFollow(player, true, 0.08, 0.08); this.cameras.main.setZoom(1.1); } else { console.warn("[PlayScene] Player not found — camera follow disabled."); } // === Debug overlay for all named objects === const debugText = this.add.text(10, 10, "", { fontSize: "14px", color: "#00ff88", backgroundColor: "rgba(0,0,0,0.45)", padding: { x: 6, y: 4 }, }); debugText.setScrollFactor(0); // Update debug overlay every half-second this.time.addEvent({ delay: 500, loop: true, callback: () => { const list = this.children.list .filter((obj: any) => obj.name) .map( (obj: any) => ${obj.name} (${Math.round(obj.x)}, ${Math.round(obj.y)}) ) .join("\n"); debugText.setText(list || "No named objects in scene"); }, }); console.log("%c[PlayScene] Scene fully initialized ✅", "color: limegreen"); } catch (err) { console.error("[PlayScene] Scene creation failed:", err); this.add .text(50, 50, "Error loading level", { color: "#ff3333", fontSize: "18px" }) .setScrollFactor(0); } } // === Called every frame === public override update(_time: number, delta: number): void { if (this.cameras?.main) { this.cameras.main.scrollX += this.cameraScrollSpeed * (delta / 16); } } }import Phaser from "phaser"; import { createScrollControls } from "./temp-controls"; import { loadLevel } from "./json-conversion"; import type { LevelData } from "./level-schema"; /** * Helper to fetch a level JSON file asynchronously. * Throws descriptive errors for easier debugging. */ async function fetchLevelData(levelName: string): Promise<LevelData> { try { const response = await fetch(/assets/levels/${levelName}.json); if (!response.ok) { throw new Error( [PlayScene] Failed to fetch level file '${levelName}.json' — HTTP ${response.status} ); } const data = (await response.json()) as LevelData; if (!data || typeof data !== "object") { throw new Error([PlayScene] Invalid level JSON structure for '${levelName}'); } return data; } catch (err) { console.error("[PlayScene] Error loading level data:", err); throw err; } } export class PlayScene extends Phaser.Scene { public cameraScrollSpeed = 0; private useMapControls = true; constructor() { super({ key: "PlayScene" }); } public init(data: { useMapControls?: boolean }): void { this.useMapControls = data.useMapControls ?? true; } public async create(): Promise<void> { try { // Wait one frame to ensure all systems (Matter, Camera) are initialized await new Promise((resolve) => this.time.delayedCall(0, resolve)); // ✅ Verify Matter Physics system if (!this.matter || !this.matter.world) { console.warn( "[PlayScene] Matter physics not initialized — falling back to non-physics mode." ); } // 🔹 Load the level JSON (e.g. level1.json) const levelName = "level1"; const levelData = await fetchLevelData(levelName); // 🔹 Convert JSON → Scene objects (platforms, player, etc.) const createdObjects = loadLevel(this, levelData); console.log( [PlayScene] Level '${levelName}' loaded successfully with ${createdObjects.length ?? 0} objects. ); // 🔹 Enable optional scroll/map controls if (this.useMapControls && this.scene.isActive()) { createScrollControls(this); } // 🔹 Camera follow logic const player = this.children.getByName("player_1") as | Phaser.Physics.Matter.Image | Phaser.GameObjects.Sprite | undefined; if (player) { this.cameras.main.startFollow(player, true, 0.08, 0.08); this.cameras.main.setZoom(1.1); } else { console.warn("[PlayScene] Player not found — camera follow disabled."); } // === Debug overlay for all named objects === const debugText = this.add.text(10, 10, "", { fontSize: "14px", color: "#00ff88", backgroundColor: "rgba(0,0,0,0.45)", padding: { x: 6, y: 4 }, }); debugText.setScrollFactor(0); // Update debug overlay every half-second this.time.addEvent({ delay: 500, loop: true, callback: () => { const list = this.children.list .filter((obj: any) => obj.name) .map( (obj: any) => ${obj.name} (${Math.round(obj.x)}, ${Math.round(obj.y)}) ) .join("\n"); debugText.setText(list || "No named objects in scene"); }, }); console.log("%c[PlayScene] Scene fully initialized ✅", "color: limegreen"); } catch (err) { console.error("[PlayScene] Scene creation failed:", err); this.add .text(50, 50, "Error loading level", { color: "#ff3333", fontSize: "18px" }) .setScrollFactor(0); } } // === Called every frame === public override update(_time: number, delta: number): void { if (this.cameras?.main) { this.cameras.main.scrollX += this.cameraScrollSpeed * (delta / 16); } } }import Phaser from "phaser";
import { createScrollControls } from "./temp-controls";
import { loadLevel } from "./json-conversion";
import type { LevelData } from "./level-schema";

/**
 * Helper to fetch a level JSON file asynchronously.
 * Throws descriptive errors for easier debugging.
 */
async function fetchLevelData(levelName: string): Promise<LevelData> {
  try {
    const response = await fetch(`/assets/levels/${levelName}.json`);
    if (!response.ok) {
      throw new Error(
        `[PlayScene] Failed to fetch level file '${levelName}.json' — HTTP ${response.status}`
      );
    }
    const data = (await response.json()) as LevelData;
    if (!data || typeof data !== "object") {
      throw new Error(`[PlayScene] Invalid level JSON structure for '${levelName}'`);
    }
    return data;
  } catch (err) {
    console.error("[PlayScene] Error loading level data:", err);
    throw err;
  }
}

export class PlayScene extends Phaser.Scene {
  public cameraScrollSpeed = 0;
  private useMapControls = true;

  constructor() {
    super({ key: "PlayScene" });
  }

  public init(data: { useMapControls?: boolean }): void {
    this.useMapControls = data.useMapControls ?? true;
  }

  public async create(): Promise<void> {
    try {
      // Wait one frame to ensure all systems (Matter, Camera) are initialized
      await new Promise((resolve) => this.time.delayedCall(0, resolve));

      // ✅ Verify Matter Physics system
      if (!this.matter || !this.matter.world) {
        console.warn(
          "[PlayScene] Matter physics not initialized — falling back to non-physics mode."
        );
      }

      // 🔹 Load the level JSON (e.g. level1.json)
      const levelName = "level1";
      const levelData = await fetchLevelData(levelName);

      // 🔹 Convert JSON → Scene objects (platforms, player, etc.)
      const createdObjects = loadLevel(this, levelData);
      console.log(
        `[PlayScene] Level '${levelName}' loaded successfully with ${createdObjects.length ?? 0} objects.`
      );

      // 🔹 Enable optional scroll/map controls
      if (this.useMapControls && this.scene.isActive()) {
        createScrollControls(this);
      }

      // 🔹 Camera follow logic
      const player = this.children.getByName("player_1") as
        | Phaser.Physics.Matter.Image
        | Phaser.GameObjects.Sprite
        | undefined;

      if (player) {
        this.cameras.main.startFollow(player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.1);
      } else {
        console.warn("[PlayScene] Player not found — camera follow disabled.");
      }

      // === Debug overlay for all named objects ===
      const debugText = this.add.text(10, 10, "", {
        fontSize: "14px",
        color: "#00ff88",
        backgroundColor: "rgba(0,0,0,0.45)",
        padding: { x: 6, y: 4 },
      });
      debugText.setScrollFactor(0);

      // Update debug overlay every half-second
      this.time.addEvent({
        delay: 500,
        loop: true,
        callback: () => {
          const list = this.children.list
            .filter((obj: any) => obj.name)
            .map(
              (obj: any) =>
                `${obj.name} (${Math.round(obj.x)}, ${Math.round(obj.y)})`
            )
            .join("\n");
          debugText.setText(list || "No named objects in scene");
        },
      });

      console.log("%c[PlayScene] Scene fully initialized ✅", "color: limegreen");
    } catch (err) {
      console.error("[PlayScene] Scene creation failed:", err);
      this.add
        .text(50, 50, "Error loading level", { color: "#ff3333", fontSize: "18px" })
        .setScrollFactor(0);
    }
  }

  // === Called every frame ===
  public override update(_time: number, delta: number): void {
    if (this.cameras?.main) {
      this.cameras.main.scrollX += this.cameraScrollSpeed * (delta / 16);
    }
  }
}
