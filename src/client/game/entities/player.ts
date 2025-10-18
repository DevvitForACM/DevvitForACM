import Phaser from 'phaser';
import { BaseEntity } from './base-entity';

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

    this.width = 32;
    this.height = 48;
    this.health = 100;
    this.maxHealth = 100;
    this.isDead = false;
  }

  public override update(delta: number): void {
    this.sprite.setPosition(this.x, this.y);

    if (this.health <= 0 && !this.isDead) {
      this.die();
    }
  }

  public override onCollision(other: BaseEntity): void {}

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
}
