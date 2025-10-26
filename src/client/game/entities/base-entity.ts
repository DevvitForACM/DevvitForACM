import Phaser from 'phaser';
import { CollisionBounds } from './collision-manager';

export class BaseEntity {
  public id: string;
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public sprite: Phaser.GameObjects.Sprite;
  public active: boolean;
  public canCollide: boolean;
  public collisionOffsetX: number;
  public collisionOffsetY: number;
  protected scene: Phaser.Scene;

  constructor(
    scene: Phaser.Scene,
    id: string,
    x: number,
    y: number,
    texture: string
  ) {
    this.scene = scene;
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = 32;
    this.height = 32;
    this.active = true;
    this.canCollide = true;
    this.collisionOffsetX = 0;
    this.collisionOffsetY = 0;

    this.sprite = scene.add.sprite(x, y, texture);

    this.sprite.setOrigin(0.5, 0.5);
  }

  public update(delta: number): void {
    void delta;
  }

  public onCollision(other: BaseEntity): void {
    void other;
  }

  /**
   * Get collision bounds for this entity
   */
  public getBounds(): CollisionBounds {
    return {
      x: this.x - this.width / 2 + this.collisionOffsetX,
      y: this.y - this.height / 2 + this.collisionOffsetY,
      width: this.width,
      height: this.height,
    };
  }

  /**
   * Set collision bounds offset from center
   */
  public setCollisionOffset(x: number, y: number): void {
    this.collisionOffsetX = x;
    this.collisionOffsetY = y;
  }

  public destroy(): void {
    this.active = false;

    this.sprite.destroy();
  }
}
