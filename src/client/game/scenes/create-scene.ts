import Phaser from 'phaser';

export class CreateScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CreateScene' });
  }

  public create(): void {
    // Completely blank canvas - no game elements, no physics, no player
    // Just a clean Phaser scene ready for creative work
  }

  public override update(): void {
    // No update logic needed for blank canvas
  }
}
