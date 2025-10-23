import Phaser from 'phaser';
import { BaseEntity } from './base-entity';
import { Player } from './player';

export class Spring extends BaseEntity {
  public bounceForce: number;
  public cooldownTimer: number;

  constructor(
    scene: Phaser.Scene,
    id: string,
    x: number,
    y: number,
    texture: string = 'spring'
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

  public override onCollision(other: BaseEntity): void {
    if (other instanceof Player && this.isReady()) {
      this.bounce(other);
      this.activate();
    }
  }

  private bounce(player: Player): void {
    player.y -= this.bounceForce / 10;
    
    this.sprite.setTint(0x00ff00);
    setTimeout(() => {
      this.sprite.clearTint();
    }, 200);
  }

  public activate(): void {
    if (this.cooldownTimer > 0) return;

    this.cooldownTimer = 0.3;
    this.sprite.setScale(1, 0.7);
  }

  public isReady(): boolean {
    return this.cooldownTimer <= 0;
  }
}