import Phaser from 'phaser';
import { BaseEntity } from './base-entity';
import { Player } from './player';

export class Enemy extends BaseEntity {
  public health: number;
  public maxHealth: number;
  public damage: number;
  public isDead: boolean;

  constructor(
    scene: Phaser.Scene,
    id: string,
    x: number,
    y: number,
    texture: string
  ) {
    super(scene, id, x, y, texture);

    this.width = 32;
    this.height = 32;
    this.health = 50;
    this.maxHealth = 50;
    this.damage = 20;
    this.isDead = false;
  }

  public override update(delta: number): void {
    void delta;
    this.sprite.setPosition(this.x, this.y);

    if (this.health <= 0 && !this.isDead) {
      this.die();
    }
  }

  public override onCollision(other: BaseEntity): void {
    if (other instanceof Player && !this.isDead && !other.isDead) {
      this.performAttack();
    }
  }

  private performAttack(): void {
    this.sprite.setTint(0xff4444);
    setTimeout(() => {
      this.sprite.clearTint();
    }, 150);
  }

  public takeDamage(amount: number): void {
    if (this.isDead) return;

    this.health -= amount;
    if (this.health < 0) {
      this.health = 0;
    }
  }

  public die(): void {
    this.isDead = true;

    this.sprite.setAlpha(0.3);
  }
}
