# Entity System Documentation

The entity system provides a flexible architecture for managing game objects in the Phaser-based game. All entities inherit from a base class and are managed through a centralized controller.

## Architecture Overview

### BaseEntity

The foundation class that all game entities inherit from. Provides core functionality for positioning, rendering, and lifecycle management.

**Properties:**

- `id: string` - Unique identifier for the entity
- `x, y: number` - Position coordinates
- `width, height: number` - Entity dimensions (default: 32x32)
- `sprite: Phaser.GameObjects.Sprite` - Visual representation
- `active: boolean` - Whether the entity is active and should be updated

**Methods:**

- `update(delta: number)` - Called every frame for game logic in ms
- `onCollision(other: BaseEntity)` - Handles collision events
- `destroy()` - Cleans up the entity and removes it from the scene

## Entity Types

### Player

The main character controlled by the player.

**Additional Properties:**

- `health: number` - Current health (default: 100)
- `maxHealth: number` - Maximum health capacity
- `isDead: boolean` - Death state flag

**Key Features:**

- Health management with damage and healing
- Death state handling with visual feedback (alpha transparency)
- Respawn functionality
- Size: 32x48 pixels

**Methods:**

- `takeDamage(amount: number)` - Reduces health
- `heal(amount: number)` - Restores health
- `respawn(x: number, y: number)` - Resets player state at new position

### Door

Interactive portals for level transitions and area access.

**Properties:**

- `isOpen: boolean` - Door state
- `isLocked: boolean` - Lock state
- `requiredKeyId?: string` - Optional key requirement
- `targetLevel?: string` - Destination level identifier

**Visual States:**

- **Locked**: Red tint (0xff0000)
- **Open**: Green tint (0x00ff00)
- **Closed**: No tint

**Methods:**

- `unlock()` / `lock()` - Toggle lock state
- `open()` / `close()` - Toggle door state
- `enter()` - Initiate level transition

### Coin

Collectible items that provide value to the player.

**Properties:**

- `value: number` - Point value (default: 1)
- `isCollected: boolean` - Collection state

**Animations:**

- **Floating**: Sine wave vertical movement (±5 pixels)
- **Spinning**: Continuous rotation
- **Collection**: Scale up and fade out effect

**Methods:**

- `collect()` - Triggers collection sequence and cleanup

### Enemy

Hostile entities that can damage the player.

**Properties:**

- `health: number` - Enemy health (default: 50)
- `maxHealth: number` - Maximum health
- `damage: number` - Damage dealt to player (default: 20)
- `isDead: boolean` - Death state

**Methods:**

- `takeDamage(amount: number)` - Reduces enemy health
- `die()` - Handles death state (reduces alpha to 0.3)

### Spike

Static hazard that damages entities on contact.

**Properties:**

- `damage: number` - Damage dealt (default: 25)

**Behavior:**

- Passive damage source
- No update logic required
- Collision-based interaction

### Spring

Bouncing platform that propels entities upward.

**Properties:**

- `bounceForce: number` - Upward force applied (default: 600)
- `cooldownTimer: number` - Prevents rapid activation

**Features:**

- 0.3-second cooldown between activations
- Visual compression effect during cooldown (scale: 1, 0.7)
- Size: 32x24 pixels

**Methods:**

- `activate()` - Triggers bounce effect
- `isReady()` - Checks if spring can be used

### Tile

Basic building blocks for level geometry.

**Properties:**

- `isGround: boolean` - Determines tile type (default: true)

**Types:**

- **Ground**: Solid platform tiles
- **Lava**: Hazardous tiles (when isGround = false)

**Methods:**

- `isLava()` - Returns true if tile is hazardous

## Entity Controller

Centralized management system for all entities in the game.

**Core Functionality:**

- Entity lifecycle management (add, remove, update)
- Quick player reference for game systems
- Batch operations for scene transitions

**Methods:**

- `add(entity: BaseEntity)` - Registers entity for management
- `remove(id: string)` - Removes and destroys entity by ID
- `get(id: string)` - Retrieves entity by ID
- `getAll()` - Returns all managed entities
- `update(delta: number)` - Updates all active entities
- `clear()` - Removes all entities (scene cleanup)

## Usage Patterns

### Creating Entities

```typescript
const player = new Player(scene, 'player1', 100, 200, 'player-texture');
const coin = new Coin(scene, 'coin1', 150, 180, 'coin-texture');
const door = new Door(scene, 'door1', 300, 200, 'door-texture');

entityController.add(player);
entityController.add(coin);
entityController.add(door);
```

### Game Loop Integration

```typescript
// In your scene's update method
entityController.update(delta);
```

### Collision Handling

```typescript
// Collision detection happens externally
if (collision detected) {
    entity1.onCollision(entity2);
    entity2.onCollision(entity1);
}
```

### Scene Cleanup

```typescript
// When transitioning between levels
entityController.clear();
```

## Design Principles

1. **Inheritance-based Architecture**: All entities extend BaseEntity for consistent interface
2. **Component Separation**: Entity logic is separate from collision detection and physics
3. **Centralized Management**: EntityController handles all entity lifecycle operations
4. **Visual Feedback**: Entities use tinting, scaling, and alpha for state communication
5. **Flexible Properties**: Optional properties allow for specialized entity configurations

## Future Considerations

- Animation system integration for smoother visual effects
- Component-based architecture for more complex entity behaviors
- Event system for entity communication
- Serialization support for save/load functionality
- Performance optimization for large numbers of entities
