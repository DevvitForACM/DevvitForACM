import Phaser from "phaser";
import { CAMERA_SCROLL } from "@/constants/game-constants";

interface ControllableScene extends Phaser.Scene {
  cameraScrollSpeed: number;
}

export function createScrollControls(scene: ControllableScene): void {
  scene.cameraScrollSpeed = 0;

  const leftArrow = scene.add
    .text(0, 0, CAMERA_SCROLL.LEFT_SYMBOL ?? "<", {
      fontSize: CAMERA_SCROLL.FONT_SIZE ?? "48px",
      color: CAMERA_SCROLL.COLOR ?? "#ffffff",
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(1000);

  const rightArrow = scene.add
    .text(0, 0, CAMERA_SCROLL.RIGHT_SYMBOL ?? ">", {
      fontSize: CAMERA_SCROLL.FONT_SIZE ?? "48px",
      color: CAMERA_SCROLL.COLOR ?? "#ffffff",
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(1000);

  const positionControls = () => {
    const { height } = scene.scale;
    const yPos = height - (CAMERA_SCROLL.BUTTON_OFFSET_Y ?? 50);
    leftArrow.setPosition(
      CAMERA_SCROLL.LEFT_X ?? 50,
      yPos
    );
    rightArrow.setPosition(
      CAMERA_SCROLL.RIGHT_X ?? 150,
      yPos
    );
  };

  positionControls();

  leftArrow.setInteractive();
  rightArrow.setInteractive();

  const scrollVelocity = CAMERA_SCROLL.VELOCITY ?? 5;

  leftArrow.on(Phaser.Input.Events.POINTER_DOWN, () => {
    scene.cameraScrollSpeed = -scrollVelocity;
  });

  rightArrow.on(Phaser.Input.Events.POINTER_DOWN, () => {
    scene.cameraScrollSpeed = scrollVelocity;
  });

  const stopScrolling = () => {
    scene.cameraScrollSpeed = 0;
  };

  scene.input.on(Phaser.Input.Events.POINTER_UP, stopScrolling);
  scene.input.on(Phaser.Input.Events.POINTER_OUT, stopScrolling);
  scene.scale.on(Phaser.Scale.Events.RESIZE, positionControls);
}