import Phaser from 'phaser';
import { BaseEntity } from './base-entity';

export class Door extends BaseEntity {
  public isOpen: boolean;
  public isLocked: boolean;
  public targetLevel?: string; // Level to load when entering

  constructor(
    scene: Phaser.Scene,
    id: string,
    x: number,
    y: number,
    texture: string
  ) {
    super(scene, id, x, y, texture);

    this.width = 48;
    this.height = 64;
    this.isOpen = false;
    this.isLocked = false;
  }

  public override update(delta: number): void {
    this.sprite.setPosition(this.x, this.y);

    if (this.isLocked) {
      this.sprite.setTint(0xff0000);
    } else if (this.isOpen) {
      this.sprite.setTint(0x00ff00);
    } else {
      this.sprite.clearTint();
    }
  }

  public override onCollision(other: BaseEntity): void {}

  public unlock(): void {
    this.isLocked = false;
  }

  public lock(): void {
    this.isLocked = true;
  }

  public open(): void {
    if (this.isLocked) {
      return;
    }
    this.isOpen = true;
  }

  public close(): void {
    this.isOpen = false;
  }

  public enter(): void {
    if (!this.isOpen) {
      return;
    }

    // collision and next level handled here
  }
}
