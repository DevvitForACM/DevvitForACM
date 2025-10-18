import Phaser from 'phaser';
import { BaseEntity } from './base-entity';

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
  }

  public override update(delta: number): void {
    if (this.isCollected) return;

    // Add floating animation
    // Math.sin() creates smooth up-down motion
    // Date.now() / 500 makes it oscillate every 500ms
    // * 5 = 5 pixels up and down
    const floatOffset = Math.sin(Date.now() / 500) * 5;
    this.sprite.setY(this.y + floatOffset);

    // Add spinning animation
    // sprite.angle is rotation in degrees
    // Increase by delta to rotate smoothly
    this.sprite.angle += delta * 0.2;
  }

  public override onCollision(other: BaseEntity): void {}

  public collect(): void {
    if (this.isCollected) return;

    this.isCollected = true;
    this.active = false;

    // Play collect animation
    // setScale() makes it grow then shrink
    // You could use scene.tweens.add() for smooth animation
    this.sprite.setScale(1.5);

    // Fade out
    this.sprite.setAlpha(0);

    // Destroy after animation (in a real game, use tweens)
    setTimeout(() => {
      this.destroy();
    }, 200);
  }
}
