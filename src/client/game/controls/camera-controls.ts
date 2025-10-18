import Phaser from 'phaser';

interface ControllableScene extends Phaser.Scene {
  cameraScrollSpeed: number;
}

export function createScrollControls(scene: ControllableScene): void {
  scene.cameraScrollSpeed = 0;
  const SCROLL_VELOCITY = 5;

  const leftArrow = scene.add
    .text(0, 0, '<', { fontSize: '48px', color: '#ffffff' })
    .setOrigin(0.5);
  const rightArrow = scene.add
    .text(0, 0, '>', { fontSize: '48px', color: '#ffffff' })
    .setOrigin(0.5);

  const positionControls = () => {
    const { height } = scene.scale;
    leftArrow.setPosition(50, height - 50);
    rightArrow.setPosition(150, height - 50);
  };

  positionControls();

  leftArrow.setInteractive().setScrollFactor(0);
  rightArrow.setInteractive().setScrollFactor(0);

  leftArrow.on(Phaser.Input.Events.POINTER_DOWN, () => {
    scene.cameraScrollSpeed = -SCROLL_VELOCITY;
  });

  rightArrow.on(Phaser.Input.Events.POINTER_DOWN, () => {
    scene.cameraScrollSpeed = SCROLL_VELOCITY;
  });

  const stopScrolling = () => {
    scene.cameraScrollSpeed = 0;
  };

  scene.input.on(Phaser.Input.Events.POINTER_UP, stopScrolling);
  scene.input.on(Phaser.Input.Events.POINTER_OUT, stopScrolling);
  scene.scale.on(Phaser.Scale.Events.RESIZE, positionControls);
}