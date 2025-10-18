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
    console.log(`Door ${this.id} unlocked!`);
  }

  public lock(): void {
    this.isLocked = true;
    console.log(`Door ${this.id} locked!`);
  }

  public open(): void {
    if (this.isLocked) {
      console.log(`Door ${this.id} is locked!`);
      return;
    }
    this.isOpen = true;
    console.log(`Door ${this.id} opened!`);
  }

  public close(): void {
    this.isOpen = false;
    console.log(`Door ${this.id} closed!`);
  }

  public enter(): void {
    if (!this.isOpen) {
      console.log(`Door ${this.id} is not open!`);
      return;
    }

    console.log(`Entering door ${this.id}, target level: ${this.targetLevel}`);
    // collision and next level handled here
  }
}
