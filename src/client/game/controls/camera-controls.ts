import Phaser from "phaser";
import { CAMERA_SCROLL } from "../../constants/game-constants";

interface ControllableScene extends Phaser.Scene {
  cameraScrollSpeed: number;
}

export function createScrollControls(scene: ControllableScene): void {
  scene.cameraScrollSpeed = 0;

  const leftArrow = scene.add
    .text(0, 0, CAMERA_SCROLL.LEFT_SYMBOL, {
      fontSize: CAMERA_SCROLL.FONT_SIZE,
      color: CAMERA_SCROLL.COLOR,
    })
    .setOrigin(0.5);

  const rightArrow = scene.add
    .text(0, 0, CAMERA_SCROLL.RIGHT_SYMBOL, {
      fontSize: CAMERA_SCROLL.FONT_SIZE,
      color: CAMERA_SCROLL.COLOR,
    })
    .setOrigin(0.5);

  const positionControls = () => {
    const { height } = scene.scale;
    leftArrow.setPosition(
      CAMERA_SCROLL.LEFT_X,
      height - CAMERA_SCROLL.BUTTON_OFFSET_Y
    );
    rightArrow.setPosition(
      CAMERA_SCROLL.RIGHT_X,
      height - CAMERA_SCROLL.BUTTON_OFFSET_Y
    );
  };

  positionControls();

  leftArrow.setInteractive().setScrollFactor(0);
  rightArrow.setInteractive().setScrollFactor(0);

  leftArrow.on(Phaser.Input.Events.POINTER_DOWN, () => {
    scene.cameraScrollSpeed = -CAMERA_SCROLL.VELOCITY;
  });

  rightArrow.on(Phaser.Input.Events.POINTER_DOWN, () => {
    scene.cameraScrollSpeed = CAMERA_SCROLL.VELOCITY;
  });

  const stopScrolling = () => {
    scene.cameraScrollSpeed = 0;
  };

  scene.input.on(Phaser.Input.Events.POINTER_UP, stopScrolling);
  scene.input.on(Phaser.Input.Events.POINTER_OUT, stopScrolling);
  scene.scale.on(Phaser.Scale.Events.RESIZE, positionControls);
}
