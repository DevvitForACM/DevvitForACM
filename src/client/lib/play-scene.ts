import Phaser from 'phaser';
import { createScrollControls } from './temp-controls';

const WORLD_WIDTH = 1920;
const WORLD_HEIGHT = 600;

export class PlayScene extends Phaser.Scene {
  public cameraScrollSpeed = 0;
  private useMapControls = true;

  public init(data: { useMapControls?: boolean }): void {
    this.useMapControls = data.useMapControls ?? true;
  }

  public create(): void {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    const ground = this.add.rectangle(
      WORLD_WIDTH / 2,
      WORLD_HEIGHT - 20,
      WORLD_WIDTH,
      40,
      0x4a8f38
    );
    const island1 = this.add.rectangle(400, 450, 250, 30, 0x956338);
    const island2 = this.add.rectangle(950, 350, 400, 30, 0x956338);
    const island3 = this.add.rectangle(1600, 450, 250, 30, 0x956338);

    this.physics.add.staticGroup([ground, island1, island2, island3]);

    const player = this.add.circle(200, WORLD_HEIGHT - 100, 20, 0xff0000);
    this.physics.add.existing(player);

    if (this.useMapControls) {
      createScrollControls(this);
    }
  }

  public override update(_time: number, delta: number): void {
    this.cameras.main.scrollX += this.cameraScrollSpeed * (delta / 16);
  }
}