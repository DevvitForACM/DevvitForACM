# Phaser Canvas System Documentation

This document outlines the architecture of the responsive Phaser.js canvas implementation within the Devvit React application. The system is designed to be modular, responsive, and scalable for future game development.

## Core Architecture

The system is composed of three main parts: the React container, the Phaser configuration, and the game scenes.

1.  **React Integration (`PhaserContainer.tsx`)**: A reusable React component responsible for mounting and unmounting the Phaser game instance. It uses `useEffect` to manage the game's lifecycle, preventing memory leaks.

2.  **Phaser Configuration (`game-config.ts`)**: This file contains the global configuration for the Phaser game. The `Phaser.Scale.RESIZE` mode is the key to making the canvas responsive across mobile, desktop, and fullscreen views by automatically filling its parent container.

3.  **Game Scenes (`play-scene.ts`)**: Each scene represents a distinct part of the game (e.g., a level, a menu). The current `PlayScene` demonstrates a scrollable platformer level with a fixed `WORLD_WIDTH` that is larger than the screen. Phaser's camera system is used to view a portion of this world.

## How It Works

### Responsiveness

The system achieves responsiveness without reloading or changing the game's world scale.

*   The `Play` page uses Tailwind CSS (`w-screen h-screen`) to create a main container that always fills the viewport.
*   The `PhaserContainer` component fills this main container, and Phaser's `RESIZE` scale mode automatically adjusts the canvas dimensions to match.
*   UI elements, like the scroll controls, listen to the `Phaser.Scale.Events.RESIZE` event to reposition themselves correctly when the screen size changes.

### Level Scrolling & Optional Controls

The map scrolling controls are modular and can be enabled or disabled on a per-scene basis.

*   The `temp-controls.ts` module creates UI buttons that are fixed to the camera's viewport (`setScrollFactor(0)`).
*   When a button is pressed, it modifies a public `cameraScrollSpeed` property on the active scene. The scene's `update` loop reads this property to move the camera.
*   The `PlayScene` has an `init(data)` method that checks for a `useMapControls` boolean. This allows developers to choose whether to instantiate the controls when the scene is launched.

## How to Use and Extend

### Modifying the Level

To change the level layout, edit the `create()` method in `src/lib/play-scene.ts`. You can add, remove, or reposition game objects within the defined `WORLD_WIDTH` and `WORLD_HEIGHT`.

```typescript
// Example: Adding a new platform in play-scene.ts
const newIsland = this.add.rectangle(1200, 200, 150, 30, 0x956338);
this.physics.add.existing(newIsland, true); // The 'true' makes it a static body```

### Starting a Scene With or Without Controls

To control whether the scroll buttons appear, pass a data object when starting the scene. If no data is passed, the controls will be enabled by default.

```typescript
// In another scene, to start the PlayScene:

// Start the level WITH scroll controls
this.scene.start('PlayScene', { useMapControls: true });

// Start the level WITHOUT scroll controls
this.scene.start('PlayScene', { useMapControls: false });
```

### Adding a New Scene

1.  Create a new scene file (e.g., `src/lib/menu-scene.ts`) that extends `Phaser.Scene`.
2.  Implement the `create()` method and any other required lifecycle methods.
3.  Add the new scene to the `scene` array in `src/lib/game-config.ts`.
4.  Use `this.scene.start('YourSceneKey', { ...data })` to transition to it.