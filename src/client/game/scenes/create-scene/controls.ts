import Phaser from 'phaser';
import { CAMERA_CONFIG } from '@/constants/game-constants';

export interface CameraControls {
  cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd?: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  touchStartX: number;
  touchStartY: number;
  isSwiping: boolean;
  initialPinchDistance: number;
  initialZoom: number;
}

export function setupKeyboardControls(scene: Phaser.Scene): CameraControls {
  const controls: CameraControls = {
    touchStartX: 0,
    touchStartY: 0,
    isSwiping: false,
    initialPinchDistance: 0,
    initialZoom: 1,
  };

  if (scene.input.keyboard) {
    controls.cursors = scene.input.keyboard.createCursorKeys();
    controls.wasd = {
      W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  return controls;
}

export function handleKeyboardScroll(
  camera: Phaser.Cameras.Scene2D.Camera,
  controls: CameraControls,
  delta: number
): void {
  const keyboardSpeed = 5;
  if (controls.cursors || controls.wasd) {
    if (controls.cursors?.left.isDown || controls.wasd?.A.isDown) {
      camera.scrollX -= keyboardSpeed * (delta / 16);
    }
    if (controls.cursors?.right.isDown || controls.wasd?.D.isDown) {
      camera.scrollX += keyboardSpeed * (delta / 16);
    }
    if (controls.cursors?.up.isDown || controls.wasd?.W.isDown) {
      camera.scrollY -= keyboardSpeed * (delta / 16);
    }
    if (controls.cursors?.down.isDown || controls.wasd?.S.isDown) {
      camera.scrollY += keyboardSpeed * (delta / 16);
    }
  }
}

export function setupTouchControls(
  scene: Phaser.Scene,
  controls: CameraControls
): void {
  scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    if (!pointer.isDown) return;
    const hitObjects = scene.input.hitTestPointer(pointer);
    const hitUI = hitObjects.some(
      (obj: any) =>
        obj.getData &&
        (obj.getData('isScrollControl') || obj.getData('isUIElement'))
    );
    const hitEntity = hitObjects.some(
      (obj: any) => obj.getData && obj.getData('entityId')
    );

    if (!hitUI && !hitEntity) {
      controls.touchStartX = pointer.x;
      controls.touchStartY = pointer.y;
      controls.isSwiping = true;
    }
  });

  scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
    const pointers = scene.input.manager.pointers;
    const activePointers = pointers.filter((p: any) => p.isDown);

    if (activePointers.length === 2) {
      const p1 = activePointers[0];
      const p2 = activePointers[1];

      if (p1 && p2) {
        const distance = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);

        if (controls.initialPinchDistance === 0) {
          controls.initialPinchDistance = distance;
          controls.initialZoom = scene.cameras.main.zoom;
        } else {
          const scale = distance / controls.initialPinchDistance;
          let newZoom = controls.initialZoom * scale;

          newZoom = Math.max(
            CAMERA_CONFIG.MIN_ZOOM,
            Math.min(CAMERA_CONFIG.MAX_ZOOM, newZoom)
          );
          scene.cameras.main.setZoom(newZoom);
        }
      }

      controls.isSwiping = false;
    } else if (
      controls.isSwiping &&
      pointer.isDown &&
      activePointers.length === 1
    ) {
      const deltaX = pointer.x - controls.touchStartX;
      const deltaY = pointer.y - controls.touchStartY;

      scene.cameras.main.scrollX -= deltaX;
      scene.cameras.main.scrollY -= deltaY;

      controls.touchStartX = pointer.x;
      controls.touchStartY = pointer.y;
    }
  });

  scene.input.on('pointerup', () => {
    const pointers = scene.input.manager.pointers;
    const activePointers = pointers.filter((p: any) => p.isDown);

    if (activePointers.length < 2) {
      controls.initialPinchDistance = 0;
    }
    if (activePointers.length === 0) {
      controls.isSwiping = false;
    }
  });
}

export function calculateResponsiveZoom(
  camera: Phaser.Cameras.Scene2D.Camera
): number {
  const viewportWidth = camera.width;
  const baseZoom = CAMERA_CONFIG.ZOOM;

  if (viewportWidth < 768) {
    return Math.max(CAMERA_CONFIG.MIN_ZOOM, baseZoom * 0.6);
  } else if (viewportWidth < 1024) {
    return Math.max(CAMERA_CONFIG.MIN_ZOOM, baseZoom * 0.8);
  }

  return baseZoom;
}
