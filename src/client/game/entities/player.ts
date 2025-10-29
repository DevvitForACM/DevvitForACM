import Phaser from 'phaser';
import { BaseEntity } from './base-entity';
import { Spike } from './spike';
import { Coin } from './coin';
import { Enemy } from './enemy';
import { Spring } from './spring';
import { PLAYER, COLLISION } from '@/constants/game-constants';

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

    this.width = 60;
    this.height = 100;
    this.health = PLAYER.HEALTH.DEFAULT;
    this.maxHealth = PLAYER.HEALTH.MAX;
    this.isDead = false;

    this.createAnimations();
  }

  private createAnimations(): void {
    // Check if idle textures exist
    const idleFrames = [0, 1, 2, 3, 4]
      .filter((i) => this.scene.textures.exists(`player-idle-${i}`))
      .map((i) => ({ key: `player-idle-${i}` }));
    
    if (!this.scene.anims.exists('player-idle') && idleFrames.length > 0) {
      this.scene.anims.create({
        key: 'player-idle',
        frames: idleFrames,
        frameRate: 8,
        repeat: -1,
      });
    }

    // Check if jump textures exist, fallback to idle if not
    const jumpFrames = [0, 1, 2, 3, 4]
      .filter((i) => this.scene.textures.exists(`player-jump-${i}`))
      .map((i) => ({ key: `player-jump-${i}` }));
    
    if (!this.scene.anims.exists('player-jump-sequence')) {
      // If no jump frames, use idle frames as fallback
      const frames = jumpFrames.length > 0 ? jumpFrames : idleFrames;
      if (frames.length > 0) {
        this.scene.anims.create({
          key: 'player-jump-sequence',
          frames: frames,
          frameRate: 12,
          repeat: 0,
        });
      }
    }
  }

  public playIdleAnimation(): void {
    if (this.sprite && this.sprite.anims) {
      this.sprite.play('player-idle', true);
    }
  }

  public playJumpSequence(): void {
    if (this.sprite && this.sprite.anims) {
      this.sprite.play('player-jump-sequence', true);
    }
  }

  public override update(delta: number): void {
    void delta;
    this.sprite.setPosition(this.x, this.y);

    if (this.health <= 0 && !this.isDead) {
      this.die();
    }
  }

  public override onCollision(other: BaseEntity): void {
    if (this.isDead) return;

    if (other instanceof Spike) {
      this.takeDamage(other.damage);

      this.knockback(other);
    } else if (other instanceof Coin && !other.isCollected) {
      other.collect();
    } else if (other instanceof Enemy && !other.isDead) {
      this.takeDamage(other.damage);
      this.knockback(other);
    } else if (other instanceof Spring) {
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
