import Phaser from 'phaser';
import { BaseEntity } from './base-entity';

export class Spike extends BaseEntity {
  public damage: number;

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
    this.damage = 25;
  }

  public override update(delta: number): void {}

  public override onCollision(other: BaseEntity): void {}
}
