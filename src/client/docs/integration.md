# Integration Notes

This document captures all changes implemented during the chat—from first iteration to the latest fix—and how they fit together.

## Overview
- Project: Devvit-based level editor + play mode (Phaser)
- Goal: Robust editor grid with entity placement, seamless transition to PlayScene, and return to Editor without leaking objects.

## Major Changes by Topic

### 1) Replace Upvote/Downvote with Spring/Spike
- Replaced 8 directional up/downvote variants with two entities: `spring` and `spike`.
- Schema: `level-schema.ts` enum updated to include `Spring = "spring"`, `Spike = "spike"` and remove Up/Downvote variants.
- Editor palette in Create page updated to use spring (🟢) and spike (🔺).
- Assets loaded in both `create-scene.ts` and `play-scene.ts`.
- JSON conversion helpers include `createSpring()` and `createSpike()` with sizes:
  - Spring: 32x24
  - Spike: 32x32
- Asset files: `assets/Spring.png`, `assets/Spikes.png`.

### 2) Editor Grid Coordinate System
- Implemented bottom-left origin for the editor grid; positive Y goes upward.
- Display formula (Phaser Y → grid Y): `gridY = -Math.floor(wy / GRID) - 1`.
- Placement formula (grid Y → Phaser Y): `pixelY = -(gridY + 1) * GRID + GRID / 2`.
- Camera initially scrolled so Y=0 is visible at bottom: `this.cameras.main.scrollY = -this.cameras.main.height`.
- Hover coordinate HUD added with scroll factor 0.

### 3) 4‑Direction Camera Scroll Controls
- Replaced 2‑direction controls with 4‑direction arrows (↑ ↓ ← →) in top-right.
- Responsive layout; marked with `isScrollControl` so clicks don’t place entities.
- `CreateScene` now supports `cameraScrollSpeedY` and handles both axes in `update()`.

### 4) Play Mode Rendering and Camera
- Fixed background color and ensured camera bounds support negative Y ranges.
- Platforms render using grass texture when available.
- Player display size corrected; platform scales normalized to grid.
- Conditional padding in React to remove bottom whitespace when playing.

### 5) Scene Transition: Prevent Play→Editor Leakage and Restore Editor State
Problem: Snoo/Play objects leaked into editor on return; editor entities sometimes disappeared or doubled counts.

Fixes implemented:
- On return, we explicitly destroy PlayScene objects and stop the scene.
- We restart the CreateScene to guarantee a clean grid and rebind listeners.
- Added a safe restoration pipeline for editor entities:
  - `CreateScene.restoreSnapshot(snapshot)` to rebuild entities from a captured list (`getAllEntities()` output), using registry metadata for icons/colors.
  - `placeEntity` is public for programmatic restoration.
- After restarting, the React layer:
  - Grabs the new CreateScene instance from the Phaser game,
  - Removes any lingering listeners (`events.removeAllListeners()`),
  - Reattaches listeners and registry data,
  - Restores the saved entities snapshot,
  - Syncs the currently selected entity type.

Result: Returning from Play shows a clean editor grid with the exact entities you placed; no PlayScene sprites remain.

## Files Touched (high level)
- `src/client/pages/create/index.tsx` — start/stop flow, restart CreateScene, rebind listeners, restore snapshot.
- `src/client/game/scenes/create-scene.ts` — grid, placement math, public `placeEntity`, new `restoreSnapshot`, cleanup.
- `src/client/game/scenes/play-scene.ts` — preload, gravity, camera bounds, and a fixed conditional (`else if (jsonData && matter)`), general rendering tweaks.
- `src/client/game/controls/camera-controls.ts` — 4‑way controls and input guards.
- `src/client/game/level/json-conversion.ts` — platform/asset helpers; grass usage.
- `src/client/game/level/level-schema.ts` — enum updates for Spring/Spike.
- `src/client/constants/game-constants.ts` — camera constants, sizes, etc.
- `assets` — added Spring/Spikes; removed upvote/downvote variants.

Note: Some asset additions (e.g., Ground/Lava, grass textures) support improved visuals in both editor and play.

## Behavior Contract
- Editor grid origin: bottom-left; positive Y upward.
- Entities placed on grid snap to 32x32 cells.
- PlayScene is started with a JSON level built from current editor entities.
- On return:
  1) Destroy all PlayScene objects and stop it.
  2) Start CreateScene fresh and acquire its new instance.
  3) Reattach listeners/registry and call `restoreSnapshot(savedEntities)`.

## Testing
- Place Player, Spike, Spring, and multiple Ground tiles.
- Click Play, verify player/objects render; camera follows player if present.
- Click Return to Editor:
  - No Snoo or Play objects should be visible.
  - Grid appears immediately.
  - Entity count matches and each entity is visible at the same coordinates.
- Repeated Play/Return cycles should not duplicate listeners or entities.

## Known considerations
- If additional scene plugins are introduced, ensure their objects are cleaned up on stop.
- When adding new editor entity types, extend `restoreSnapshot` mapping via registry metadata.

---
Last updated: automated from chat integration.
