# Features Overview

This document lists client-side features implemented (excludes tooling/PR housekeeping like package.json or lockfile changes, and excludes unimplemented entities).

- Rendering & engine: Phaser 3 with Arcade Physics; responsive canvas sizing.
- Scenes:
  - main-scene: basic platform setup, player movement, camera follow.
  - play-scene and wasd-scene: demo scenes and control variants.
- Input: Arrow keys and WASD; jump via Up/Space; camera utilities.
- Level system: chunk-manager for chunk-based streaming/culling and level-types for structure.
- React integration: phaser-container, routing; pages: home and play.
- Bootstrap: useGameLoader hook to initialize and load assets/config.
- Config & constants: game-config.ts, game-config-wasd.ts, and game-constants for tuning.
