# Entity System Documentation

## Overview

The entity system provides a flexible architecture for managing game objects with inheritance-based design and centralized management.

## Architecture

### BaseEntity

All game entities inherit from `BaseEntity`:

```typescript
export class BaseEntity {
  public id: string;
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public sprite: Phaser.GameObjects.Sprite;
  public active: boolean;
  public canCollide: boolean;
}
```

### Entity Types

#### Player
- **Health System**: Damage, healing, death states
- **Movement**: Physics-based movement with collision
- **Respawn**: Position reset and state restoration
- **Size**: 32x48 pixels

#### Enemy
- **AI Behavior**: Basic attack patterns
- **Health**: 50 HP with damage dealing
- **Visual Feedback**: Attack animations

#### Coin
- **Collection**: Automatic collection on contact
- **Animation**: Floating and spinning effects
- **Value**: Configurable point values

#### Spike
- **Damage**: Static hazard with collision damage
- **Visual**: Red flash on contact
- **Behavior**: Passive damage source

#### Spring
- **Bounce**: Upward force application
- **Cooldown**: 0.3-second activation limit
- **Visual**: Compression effect during cooldown

#### Tile
- **Ground/Lava**: Configurable tile types
- **Collision**: Solid platform behavior
- **Visual**: Color-coded tile types

#### Door
- **States**: Open, closed, locked
- **Visual**: Color-coded state indicators
- **Interaction**: Level transition triggers

## Collision System

### Detection
- **AABB**: Axis-aligned bounding box collision
- **Performance**: Optimized for large entity counts
- **Events**: Collision event propagation

### Response Types
- **Damage**: Health reduction with visual effects
- **Collect**: Item pickup with animations
- **Bounce**: Spring platform interactions
- **Block**: Solid object separation
- **Trigger**: Custom event handling

### Event Handling
```typescript
public override onCollision(other: BaseEntity): void {
  if (other instanceof Player && !other.isDead) {
    this.takeDamage(other.damage);
  }
}
```

## Entity Controller

Centralized management system:

### Core Methods
- `add(entity)`: Register entity for management
- `remove(id)`: Remove and destroy entity
- `get(id)`: Retrieve entity by ID
- `getAll()`: Return all entities
- `update(delta)`: Update all active entities
- `clear()`: Remove all entities

### Usage
```typescript
const entityController = new EntityController(scene);
entityController.add(player);
entityController.update(delta);
```

## Performance Considerations

### Optimization
- **Active Filtering**: Only update active entities
- **Collision Culling**: Skip inactive entities
- **Memory Management**: Proper cleanup on destroy

### Best Practices
- Use entity IDs for efficient lookups
- Destroy entities when no longer needed
- Batch operations for scene transitions
- Monitor entity count for performance

## Visual Effects

### State Communication
- **Tinting**: Color changes for states
- **Scaling**: Size changes for effects
- **Alpha**: Transparency for death states
- **Animations**: Sprite-based visual feedback

### Effect Types
- **Impact**: Red flash on damage
- **Collection**: Scale up and fade
- **Bounce**: Compression effect
- **Death**: Alpha reduction

## Future Enhancements

### Planned Features
- Component-based architecture
- Event system for communication
- Serialization for save/load
- Animation system integration
- Performance profiling tools

### Extensibility
- Easy addition of new entity types
- Custom collision responses
- Behavior modification
- Visual effect customization
