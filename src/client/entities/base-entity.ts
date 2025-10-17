import Phaser from 'phaser';

export class BaseEntity {
  public id: string;
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public sprite: Phaser.GameObjects.Sprite;
  public active: boolean;

  constructor(
    scene: Phaser.Scene,
    id: string,
    x: number,
    y: number,
    texture: string
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = 32;
    this.height = 32;
    this.active = true;

    this.sprite = scene.add.sprite(x, y, texture);

    this.sprite.setOrigin(0.5, 0.5);
  }

  public update(delta: number): void {}

  public onCollision(other: BaseEntity): void {}

  public destroy(): void {
    this.active = false;

    this.sprite.destroy();
  }
}
