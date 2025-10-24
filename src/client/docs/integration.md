# Integration Notes

This document captures all changes implemented during the chat—from first iteration to the latest fix—and how they fit together. It includes Play/Editor transitions, grid math, assets, physics, input, and animation.

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

### 6) PlayScene Controls, Camera and Physics Polishing (subsequent changes)
- Camera bounds normalized to 0,0 at top-left; scrollY recalculated to keep ground visible when switching zooms.
- Player now uses Matter sprite in Play so animations work; added simple edge-guard and last-safe-position respawn.
- Implemented grid-step movement for Matter mode: one tile per keypress with debounce and tween for smooth motion; jump is a single-tile hop.
- Reduced movement speed; added deadzone; clamped camera to content; prevented touch jump from firing on desktop clicks.
- Grass platforms render with top-left anchoring and an optional filler layer to eliminate seams; set display depths so player is always above terrain.
- Coins implemented and collected by proximity; run/idle/jump animations wired to assets; animation fps reduced.

## Challenges and Resolutions

1) Play→Editor object leakage (Snoo visible in editor)
- Cause: Scenes sharing a canvas; stopping Play didn’t destroy its display list.
- Resolution: Explicitly remove all PlayScene children and stop scene; restart CreateScene and restore entities via snapshot. Also rebind event listeners and reset camera scroll on wake.

2) Editor entities disappearing or duplicating after return
- Cause: React kept a stale scene reference; event listeners were attached multiple times.
- Resolution: Acquire new CreateScene instance after restart, removeAllListeners, reattach, and restore snapshot.

3) Inverted Y and mismatched coordinates between editor and play
- Cause: Editor used bottom-left origin; Play used top-left; conversion used sign-only.
- Resolution: Convert Y using level height: y = height - (gridY * GRID + GRID/2). Camera bounds normalized and scrolled to bottom.

4) Gaps between ground tiles in Play
- Cause: Center-anchored sprites and transparent edges in art produced seams.
- Resolution: Top-left anchor with filler underlay; roundPixels; display depths set so player renders above terrain.

5) Camera flying into empty space and fast movement
- Cause: No clamp to content; continuous velocity and large speeds.
- Resolution: Clamp to last object extent; add deadzone; reduce speed; switch to grid-step movement with tween and debounce for Matter mode.

6) Player falling into void and not respawning
- Cause: No safety logic when walking off platforms.
- Resolution: Edge guard (support check) and last-safe-position respawn.

7) Touch/mouse input interactions
- Cause: Tap-to-jump handler triggered on desktop clicks; editor used right-click for removal.
- Resolution: Ignore desktop clicks in Play tap handler; in editor, tap with no selection removes; clicks on UI are ignored.

8) Animations too fast / not playing
- Cause: Assets naming mismatch and frame rates high; Matter image can’t animate.
- Resolution: Map to real file names, switched player to Matter sprite, created idle/run/jump animations; reduced fps (idle 4, run 8, jump 6).

## Files Touched (high level)
- `src/client/pages/create/index.tsx` — start/stop flow, restart CreateScene, rebind listeners, restore snapshot; Y-conversion uses level height; includes coins in level JSON; resets camera scroll on wake.
- `src/client/game/scenes/create-scene.ts` — grid, placement math, public `placeEntity`, new `restoreSnapshot`, cleanup.
- `src/client/game/scenes/play-scene.ts` — preload, gravity, camera bounds, fixed conditional, debug overlay, content clamping, Matter grid-step movement, one-tile jump, edge-guard + respawn, touch jump guard, run/idle/jump animations and slower fps.
- `src/client/game/controls/camera-controls.ts` — 4‑way controls and input guards.
- `src/client/game/level/json-conversion.ts` — platform/asset helpers; grass usage; top-left anchoring with filler; display depths; player switched to Matter sprite; coin creation.
- `src/client/game/level/level-schema.ts` — enum updates for Spring/Spike and Coin.
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
