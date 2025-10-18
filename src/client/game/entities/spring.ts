import Phaser from 'phaser';
import { BaseEntity } from './base-entity';

export class Spring extends BaseEntity {
  public bounceForce: number;
  public cooldownTimer: number;

  constructor(
    scene: Phaser.Scene,
    id: string,
    x: number,
    y: number,
    texture: string
  ) {
    super(scene, id, x, y, texture);

    this.width = 32;
    this.height = 24;
    this.bounceForce = 600;
    this.cooldownTimer = 0;
  }

  public override update(delta: number): void {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= delta / 1000;

      if (this.cooldownTimer <= 0) {
        this.cooldownTimer = 0;

        this.sprite.setScale(1, 1);
      }
    }
  }

  public override onCollision(other: BaseEntity): void {}

  public activate(): void {
    if (this.cooldownTimer > 0) return;

    this.cooldownTimer = 0.3;

    this.sprite.setScale(1, 0.7);
  }

  public isReady(): boolean {
    return this.cooldownTimer <= 0;
  }
}
