import { BaseEntity } from './base-entity';
import { CollisionResponse } from './collision-response';

export interface CollisionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class CollisionManager {
  /**
   * Check if two axis-aligned bounding boxes (AABB) are colliding
   */
  public static checkAABB(boundsA: CollisionBounds, boundsB: CollisionBounds): boolean {
    return (
      boundsA.x < boundsB.x + boundsB.width &&
      boundsA.x + boundsA.width > boundsB.x &&
      boundsA.y < boundsB.y + boundsB.height &&
      boundsA.y + boundsA.height > boundsB.y
    );
  }

  /**
   * Check collisions between all entities
   */
  public static checkCollisions(entities: BaseEntity[]): void {
    // Only check active entities
    const activeEntities = entities.filter(entity => entity.active && entity.canCollide);

    for (let i = 0; i < activeEntities.length; i++) {
      for (let j = i + 1; j < activeEntities.length; j++) {
        const entityA = activeEntities[i];
        const entityB = activeEntities[j];

        if (entityA && entityB && this.checkAABB(entityA.getBounds(), entityB.getBounds())) {
          // Trigger collision events for both entities
          entityA.onCollision(entityB);
          entityB.onCollision(entityA);
          
          // Handle collision response
          CollisionResponse.handleCollision(entityA, entityB);
        }
      }
    }
  }

  /**
   * Check collision between a specific entity and all others
   */
  public static checkEntityCollisions(entity: BaseEntity, others: BaseEntity[]): BaseEntity[] {
    if (!entity.active || !entity.canCollide) {
      return [];
    }

    const collisions: BaseEntity[] = [];
    const entityBounds = entity.getBounds();

    for (const other of others) {
      if (other === entity || !other.active || !other.canCollide) {
        continue;
      }

      if (this.checkAABB(entityBounds, other.getBounds())) {
        collisions.push(other);
        // Trigger collision events
        entity.onCollision(other);
        other.onCollision(entity);
        
        // Handle collision response
        CollisionResponse.handleCollision(entity, other);
      }
    }

    return collisions;
  }

  /**
   * Get the collision side between two entities
   */
  public static getCollisionSide(entityA: BaseEntity, entityB: BaseEntity): 'top' | 'bottom' | 'left' | 'right' {
    const boundsA = entityA.getBounds();
    const boundsB = entityB.getBounds();
    
    const centerAX = boundsA.x + boundsA.width / 2;
    const centerAY = boundsA.y + boundsA.height / 2;
    const centerBX = boundsB.x + boundsB.width / 2;
    const centerBY = boundsB.y + boundsB.height / 2;
    
    const deltaX = centerBX - centerAX;
    const deltaY = centerBY - centerAY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'bottom' : 'top';
    }
  }
}