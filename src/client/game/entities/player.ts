import Phaser from 'phaser';
import { BaseEntity } from './base-entity';
import { Spike } from './spike';
import { Coin } from './coin';
import { Enemy } from './enemy';
import { Spring } from './spring';
import { PLAYER, COLLISION } from '../../constants/game-constants';

export class Player extends BaseEntity {
  public health: number;
  public maxHealth: number;
  public isDead: boolean;

  constructor(
    scene: Phaser.Scene,
    id: string,
    x: number,
    y: number,
    texture: string
  ) {
    super(scene, id, x, y, texture);

    this.width = PLAYER.SIZE.WIDTH;
    this.height = PLAYER.SIZE.HEIGHT;
    this.health = PLAYER.HEALTH.DEFAULT;
    this.maxHealth = PLAYER.HEALTH.MAX;
    this.isDead = false;
  }

  public override update(_delta: number): void {
    this.sprite.setPosition(this.x, this.y);

    if (this.health <= 0 && !this.isDead) {
      this.die();
    }
  }

  public override onCollision(other: BaseEntity): void {
    if (this.isDead) return;

    if (other instanceof Spike) {
      this.takeDamage(other.damage);
      // Add knockback effect
      this.knockback(other);
    } else if (other instanceof Coin && !other.isCollected) {
      other.collect();
      // Could trigger score increase here
    } else if (other instanceof Enemy && !other.isDead) {
      this.takeDamage(other.damage);
      this.knockback(other);
    } else if (other instanceof Spring) {
      // Spring bounce effect will be handled by Spring entity
    }
  }

  private die(): void {
    this.isDead = true;
    this.sprite.setAlpha(0.5);
  }

  public takeDamage(amount: number): void {
    if (this.isDead) return;

    this.health -= amount;
    if (this.health < 0) {
      this.health = 0;
    }
  }

  public heal(amount: number): void {
    if (this.isDead) return;

    this.health += amount;
    if (this.health > this.maxHealth) {
      this.health = this.maxHealth;
    }
  }

  public respawn(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.health = this.maxHealth;
    this.isDead = false;
    this.sprite.setPosition(x, y);
    this.sprite.setAlpha(1);
  }

  private knockback(other: BaseEntity): void {
    // Simple knockback effect - push player away from the entity that hit them
    const pushForce = COLLISION.KNOCKBACK_FORCE;
    const deltaX = this.x - other.x;
    const deltaY = this.y - other.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > 0) {
      const normalX = deltaX / distance;
      const normalY = deltaY / distance;
      
      this.x += normalX * pushForce;
      this.y += normalY * pushForce;
    }
  }
}
