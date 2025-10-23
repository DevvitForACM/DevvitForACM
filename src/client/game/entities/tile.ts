import Phaser from 'phaser';
import { BaseEntity } from './base-entity';

export class Tile extends BaseEntity {
  public isGround: boolean;

  constructor(
    scene: Phaser.Scene,
    id: string,
    x: number,
    y: number,
    texture: string,
    isGround: boolean = true
  ) {
    super(scene, id, x, y, texture);

    this.width = 32;
    this.height = 32;
    this.isGround = isGround;
  }

  public override update(delta: number): void { void delta; }

  public override onCollision(other: BaseEntity): void { void other; }

  public isLava(): boolean {
    return !this.isGround;
  }
}