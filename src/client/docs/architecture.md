# Client Architecture Documentation

## Overview

The client is a React-based game platform built with Phaser.js, featuring a modular architecture designed for scalability and maintainability.

## Folder Structure

```
src/client/
├── components/          # React components
├── config/             # Game configuration
├── constants/          # Game constants and settings
├── docs/              # Documentation
├── game/              # Game engine and logic
│   ├── controls/      # Camera and input controls
│   ├── entities/      # Game entities and collision system
│   ├── level/         # Level management and JSON conversion
│   └── scenes/        # Phaser game scenes
├── global/            # Global styles and types
├── hooks/             # React hooks for game management
├── pages/             # Application pages
└── assets/            # Game assets and levels
```

## Core Systems

### 1. React-Phaser Integration

The application uses a custom `PhaserContainer` component that bridges React and Phaser.js:

- **Lifecycle Management**: Automatic game creation and destruction
- **State Synchronization**: React-Phaser communication via window global
- **Memory Safety**: Proper resource cleanup on unmount

### 2. Entity System

Sophisticated entity-component architecture with:

- **BaseEntity**: Abstract base class for all game objects
- **EntityController**: Centralized entity management
- **Collision System**: AABB collision detection with event handling
- **Entity Types**: Player, Enemy, Coin, Spike, Spring, Tile, Door

### 3. Level System

Comprehensive level management:

- **JSON Schema**: Versioned level data format
- **Legacy Support**: Backward compatibility with old formats
- **Chunk Management**: Efficient level streaming
- **Visual Editor**: Grid-based level creation

### 4. Scene System

Multiple game scenes for different purposes:

- **PlayScene**: Main gameplay with physics
- **CreateScene**: Visual level editor
- **MainScene**: Basic platformer mechanics

## Key Features

### Responsive Design
- Canvas automatically resizes to container
- Touch controls for mobile devices
- Grid-based level editor

### Performance Optimization
- Chunk-based level streaming
- Entity culling for large worlds
- Session-based level caching

### Developer Experience
- Comprehensive TypeScript coverage
- Modular architecture
- Extensive documentation

## Usage Patterns

### Creating Entities
```typescript
const player = new Player(scene, 'player1', 100, 200, 'player-texture');
entityController.add(player);
```

### Level Loading
```typescript
const levelData = await loadLevel(scene, jsonData);
```

### Scene Management
```typescript
this.scene.start('PlayScene', { useMapControls: true });
```

## Configuration

All game settings are centralized in `constants/game-constants.ts`:

- Physics constants
- Visual settings
- Camera behavior
- Entity properties

## Asset Management

Assets are loaded dynamically:

- Sprite sheets for animations
- Individual images for entities
- JSON files for levels
- Audio files for sound effects

## Future Enhancements

- Multiplayer support
- Advanced physics
- Audio system
- Analytics integration
- Performance monitoring
