import { BaseEntity } from './base-entity';
import { Player } from './player';
import { CollisionManager } from './collision-manager';

export enum CollisionType {
  DAMAGE = 'damage',
  COLLECT = 'collect',
  BOUNCE = 'bounce',
  BLOCK = 'block',
  TRIGGER = 'trigger',
}

export interface CollisionEvent {
  entityA: BaseEntity;
  entityB: BaseEntity;
  type: CollisionType;
  side: 'top' | 'bottom' | 'left' | 'right';
  timestamp: number;
}

export class CollisionResponse {
  private static collisionHistory: CollisionEvent[] = [];
  private static readonly HISTORY_LIMIT = 100;

  /**
   * Handle collision response between two entities
   */
  public static handleCollision(
    entityA: BaseEntity,
    entityB: BaseEntity
  ): void {
    const collisionSide = CollisionManager.getCollisionSide(entityA, entityB);

    const event: CollisionEvent = {
      entityA,
      entityB,
      type: this.determineCollisionType(entityA, entityB),
      side: collisionSide,
      timestamp: Date.now(),
    };

    this.addToHistory(event);

    this.applyCollisionResponse(event);
  }

  /**
   * Determine the type of collision based on entity types
   */
  private static determineCollisionType(
    entityA: BaseEntity,
    entityB: BaseEntity
  ): CollisionType {
    if (entityA instanceof Player || entityB instanceof Player) {
      const other = entityA instanceof Player ? entityB : entityA;

      if (
        other.constructor.name === 'Spike' ||
        other.constructor.name === 'Enemy'
      ) {
        return CollisionType.DAMAGE;
      } else if (other.constructor.name === 'Coin') {
        return CollisionType.COLLECT;
      } else if (other.constructor.name === 'Spring') {
        return CollisionType.BOUNCE;
      } else if (
        other.constructor.name === 'Tile' ||
        other.constructor.name === 'Door'
      ) {
        return CollisionType.BLOCK;
      }
    }

    return CollisionType.TRIGGER;
  }

  /**
   * Apply the appropriate collision response
   */
  private static applyCollisionResponse(event: CollisionEvent): void {
    switch (event.type) {
      case CollisionType.DAMAGE:
        this.handleDamageCollision(event);
        break;
      case CollisionType.COLLECT:
        this.handleCollectCollision(event);
        break;
      case CollisionType.BOUNCE:
        this.handleBounceCollision(event);
        break;
      case CollisionType.BLOCK:
        this.handleBlockCollision(event);
        break;
      case CollisionType.TRIGGER:
        this.handleTriggerCollision(event);
        break;
    }
  }

  /**
   * Handle damage-dealing collisions
   */
  private static handleDamageCollision(event: CollisionEvent): void {
    this.createImpactEffect(event.entityA, event.entityB);

    this.createScreenShake();
  }

  /**
   * Handle collection collisions
   */
  private static handleCollectCollision(event: CollisionEvent): void {
    this.createCollectEffect(event.entityA, event.entityB);
  }

  /**
   * Handle bounce collisions
   */
  private static handleBounceCollision(event: CollisionEvent): void {
    this.createBounceEffect(event.entityA, event.entityB);
  }

  /**
   * Handle blocking collisions (solid objects)
   */
  private static handleBlockCollision(event: CollisionEvent): void {
    this.separateEntities(event.entityA, event.entityB, event.side);
  }

  /**
   * Handle trigger collisions (switches, doors, etc.)
   */
  private static handleTriggerCollision(event: CollisionEvent): void {
    void event;
  }

  /**
   * Create impact visual effect
   */
  private static createImpactEffect(
    entityA: BaseEntity,
    entityB: BaseEntity
  ): void {
    entityA.sprite.setTint(0xff0000);
    entityB.sprite.setTint(0xff0000);

    setTimeout(() => {
      entityA.sprite.clearTint();
      entityB.sprite.clearTint();
    }, 100);
  }

  /**
   * Create collection visual effect
   */
  private static createCollectEffect(
    entityA: BaseEntity,
    entityB: BaseEntity
  ): void {
    const collector = entityA instanceof Player ? entityA : entityB;
    const collected = entityA instanceof Player ? entityB : entityA;
    void collector;

    collected.sprite.setScale(1.2);
    setTimeout(() => {
      collected.sprite.setScale(1.0);
    }, 150);
  }

  /**
   * Create bounce visual effect
   */
  private static createBounceEffect(
    entityA: BaseEntity,
    entityB: BaseEntity
  ): void {
    const bouncer = entityA instanceof Player ? entityB : entityA;

    bouncer.sprite.setScale(1.0, 0.8);
    setTimeout(() => {
      bouncer.sprite.setScale(1.0, 1.0);
    }, 200);
  }

  /**
   * Separate overlapping entities
   */
  private static separateEntities(
    entityA: BaseEntity,
    entityB: BaseEntity,
    side: string
  ): void {
    const boundsA = entityA.getBounds();
    const boundsB = entityB.getBounds();

    const overlapX =
      Math.min(boundsA.x + boundsA.width, boundsB.x + boundsB.width) -
      Math.max(boundsA.x, boundsB.x);
    const overlapY =
      Math.min(boundsA.y + boundsA.height, boundsB.y + boundsB.height) -
      Math.max(boundsA.y, boundsB.y);

    if (side === 'left' || side === 'right') {
      const pushX = overlapX / 2;
      if (side === 'left') {
        entityA.x -= pushX;
        entityB.x += pushX;
      } else {
        entityA.x += pushX;
        entityB.x -= pushX;
      }
    } else {
      const pushY = overlapY / 2;
      if (side === 'top') {
        entityA.y -= pushY;
        entityB.y += pushY;
      } else {
        entityA.y += pushY;
        entityB.y -= pushY;
      }
    }
  }

  /**
   * Create screen shake effect
   */
  private static createScreenShake(): void {}

  /**
   * Add collision event to history
   */
  private static addToHistory(event: CollisionEvent): void {
    this.collisionHistory.push(event);

    if (this.collisionHistory.length > this.HISTORY_LIMIT) {
      this.collisionHistory.shift();
    }
  }

  /**
   * Get recent collision events
   */
  public static getCollisionHistory(limit: number = 10): CollisionEvent[] {
    return this.collisionHistory.slice(-limit);
  }

  /**
   * Clear collision history
   */
  public static clearHistory(): void {
    this.collisionHistory = [];
  }
}
