import Phaser from 'phaser';
import { GAMEPLAY, ENTITY_CONFIG } from '@/constants/game-constants';
import { audioManager } from '@/services/audio-manager';

export interface PlayerControls {
  cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd?: {
    up: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  mobileJoystickX: number;
  mobileJoystickY: number;
  mobileJumpPressed: boolean;
}

export function setupPlayerControls(scene: Phaser.Scene): PlayerControls {
  const controls: PlayerControls = {
    mobileJoystickX: 0,
    mobileJoystickY: 0,
    mobileJumpPressed: false,
  };

  if (scene.input.keyboard) {
    controls.cursors = scene.input.keyboard.createCursorKeys();
    controls.wasd = {
      up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    scene.input.keyboard.addCapture([Phaser.Input.Keyboard.KeyCodes.SPACE]);
  }

  return controls;
}

export interface PlayerInput {
  left: boolean;
  right: boolean;
  up: boolean;
  velocityX: number;
}

export function getPlayerInput(
  controls: PlayerControls,
  isMobile: boolean
): PlayerInput {
  let left = false;
  let right = false;
  let up = false;
  let velocityX = 0;

  if (isMobile) {
    if (Math.abs(controls.mobileJoystickX) > 0.2) {
      if (controls.mobileJoystickX < 0) left = true;
      if (controls.mobileJoystickX > 0) right = true;

      velocityX = controls.mobileJoystickX * GAMEPLAY.MOVE_SPEED;
    }
    up = controls.mobileJumpPressed;
  } else if (controls.cursors && controls.wasd) {
    left = controls.cursors.left.isDown || controls.wasd.left.isDown;
    right = controls.cursors.right.isDown || controls.wasd.right.isDown;
    up =
      controls.cursors.up.isDown ||
      controls.wasd.up.isDown ||
      controls.cursors.space.isDown;

    if (left) velocityX = -GAMEPLAY.MOVE_SPEED;
    if (right) velocityX = GAMEPLAY.MOVE_SPEED;
  }

  return { left, right, up, velocityX };
}

export function getOneBlockJumpVelocity(): number {
  const g = GAMEPLAY.GRAVITY;
  const h = ENTITY_CONFIG.PLATFORM_HEIGHT;

  return Math.sqrt(2 * g * h * 1.8);
}

export function handlePlayerMovement(
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  playerBody: Phaser.Physics.Arcade.Body,
  input: PlayerInput,
  anims: Phaser.Animations.AnimationManager
): void {
  playerBody.setVelocityX(input.velocityX);

  const onFloor = playerBody.blocked.down;

  if (input.up && onFloor) {
    if (anims.exists('player-jump-launch')) {
      player.play('player-jump-launch', true);
    }

    const oneBlockV = getOneBlockJumpVelocity();
    const jump = Math.min(GAMEPLAY.JUMP_VELOCITY, oneBlockV);
    playerBody.setVelocityY(-jump);

    audioManager.playJump();
  }

  if (input.velocityX < 0) player.setFlipX(true);
  else if (input.velocityX > 0) player.setFlipX(false);

  handlePlayerAnimations(player, playerBody, input.velocityX, onFloor, anims);
}

function handlePlayerAnimations(
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  playerBody: Phaser.Physics.Arcade.Body,
  velocityX: number,
  onFloor: boolean,
  anims: Phaser.Animations.AnimationManager
): void {
  if (!onFloor) {
    const velocityY = playerBody.velocity.y;
    const currentAnim = player.anims.currentAnim?.key;

    if (
      velocityY < -50 &&
      currentAnim !== 'player-jump-launch' &&
      currentAnim !== 'player-jump-air'
    ) {
      if (anims.exists('player-jump-air')) {
        player.play('player-jump-air', true);
      }
    } else if (velocityY > 50 && currentAnim !== 'player-jump-air') {
      if (anims.exists('player-jump-air')) {
        player.play('player-jump-air', true);
      }
    }
  } else {
    const currentAnim = player.anims.currentAnim?.key;
    const isMoving = Math.abs(velocityX) > 10;

    if (currentAnim?.startsWith('player-jump-')) {
      if (anims.exists('player-jump-land')) {
        player.play('player-jump-land', true);

        player.once('animationcomplete', () => {
          if (isMoving && anims.exists('player-run')) {
            player.play('player-run', true);
          } else if (anims.exists('player-idle')) {
            player.play('player-idle', true);
          }
        });
      } else if (isMoving && anims.exists('player-run')) {
        player.play('player-run', true);
      } else if (anims.exists('player-idle')) {
        player.play('player-idle', true);
      }
    } else if (isMoving) {
      if (anims.exists('player-run') && currentAnim !== 'player-run') {
        player.play('player-run', true);
      }
    } else {
      if (anims.exists('player-idle') && currentAnim !== 'player-idle') {
        player.play('player-idle', true);
      }
    }
  }
}
