import Phaser from 'phaser';
import { CAMERA_SCROLL } from '../../constants/game-constants';

interface ControllableScene extends Phaser.Scene {
  cameraScrollSpeed: number;
  cameraScrollSpeedY: number;
}

export function createScrollControls(scene: ControllableScene): void {
  scene.cameraScrollSpeed = 0;
  scene.cameraScrollSpeedY = 0;

  const buttonStyle = {
    fontSize: '32px',
    color: '#333',
    backgroundColor: '#fff',
    padding: { x: 12, y: 8 },
  };

  const upArrow = scene.add
    .text(0, 0, '↑', buttonStyle)
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(1000)
    .setData('isScrollControl', true);

  const downArrow = scene.add
    .text(0, 0, '↓', buttonStyle)
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(1000)
    .setData('isScrollControl', true);

  const leftArrow = scene.add
    .text(0, 0, '←', buttonStyle)
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(1000)
    .setData('isScrollControl', true);

  const rightArrow = scene.add
    .text(0, 0, '→', buttonStyle)
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(1000)
    .setData('isScrollControl', true);

  const positionControls = () => {
    const { width } = scene.scale;

    const margin = Math.min(width * 0.08, 60);
    const spacing = Math.min(width * 0.06, 45);
    const topOffset = 80;

    const centerX = width - margin;
    const centerY = topOffset;

    upArrow.setPosition(centerX, centerY - spacing);
    downArrow.setPosition(centerX, centerY + spacing);
    leftArrow.setPosition(centerX - spacing, centerY);
    rightArrow.setPosition(centerX + spacing, centerY);
  };

  positionControls();

  upArrow.setInteractive();
  downArrow.setInteractive();
  leftArrow.setInteractive();
  rightArrow.setInteractive();

  const scrollVelocity = CAMERA_SCROLL.VELOCITY ?? 5;

  upArrow.on(
    Phaser.Input.Events.POINTER_DOWN,
    (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      scene.cameraScrollSpeedY = -scrollVelocity;
    }
  );

  downArrow.on(
    Phaser.Input.Events.POINTER_DOWN,
    (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      scene.cameraScrollSpeedY = scrollVelocity;
    }
  );

  leftArrow.on(
    Phaser.Input.Events.POINTER_DOWN,
    (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      scene.cameraScrollSpeed = -scrollVelocity;
    }
  );

  rightArrow.on(
    Phaser.Input.Events.POINTER_DOWN,
    (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      scene.cameraScrollSpeed = scrollVelocity;
    }
  );

  const stopScrolling = () => {
    scene.cameraScrollSpeed = 0;
    scene.cameraScrollSpeedY = 0;
  };

  scene.input.on(Phaser.Input.Events.POINTER_UP, stopScrolling);
  scene.input.on(Phaser.Input.Events.POINTER_OUT, stopScrolling);
  scene.scale.on(Phaser.Scale.Events.RESIZE, positionControls);
}
