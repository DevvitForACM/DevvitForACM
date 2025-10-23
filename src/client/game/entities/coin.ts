import Phaser from 'phaser';
import { BaseEntity } from './base-entity';
import { Player } from './player';

export class Coin extends BaseEntity {
  public value: number;
  public isCollected: boolean;

  constructor(
    scene: Phaser.Scene,
    id: string,
    x: number,
    y: number,
    texture: string
  ) {
    super(scene, id, x, y, texture);

    this.width = 24;
    this.height = 24;
    this.value = 1;
    this.isCollected = false;

    if (this.sprite && this.sprite.anims) {
      try { this.sprite.play('coin-spin'); } catch { }
    }
  }

  public override update(delta: number): void {
    void delta;
    if (this.isCollected) return;

    const floatOffset = Math.sin(Date.now() / 1000) * 5;
    this.sprite.setY(this.y + floatOffset);
  }

  public override onCollision(other: BaseEntity): void {
    if (other instanceof Player && !this.isCollected) {
      this.collect();
    }
  }

  public collect(): void {
    if (this.isCollected) return;

    this.isCollected = true;
    this.active = false;

    this.sprite.scene.tweens.add({
      targets: this.sprite,
      scale: 1.5,
      alpha: 0,
      duration: 200,
      onComplete: () => this.destroy(),
    });
  }
}