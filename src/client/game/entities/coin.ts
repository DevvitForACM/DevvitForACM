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

    this.width = 60;
    this.height = 60;
    this.value = 1;
    this.isCollected = false;

    this.createAnimations();
    this.startSpinning();
  }

  private createAnimations(): void {
    if (!this.scene.anims.exists('coin-spin')) {
      this.scene.anims.create({
        key: 'coin-spin',
        frames: [0, 1, 2, 3, 4].map((i) => ({ key: `coin-${i}` })),
        frameRate: 4,
        repeat: -1,
      });
    }
  }

  private startSpinning(): void {
    if (
      this.sprite &&
      this.sprite.anims &&
      this.scene.anims.exists('coin-spin')
    ) {
      this.sprite.play('coin-spin');
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
