// src/client/constants/game-constants.ts
import Phaser from "phaser";

// Central place for all immutable values used across the game

export const GAME_CONFIG = {
    BACKGROUND_COLOR: "#000000",
    GRAVITY_Y: 1,
    DEBUG: false, // should remain false in production
    SCALE_MODE: Phaser.Scale.RESIZE,
    AUTO_CENTER: Phaser.Scale.CENTER_BOTH,
    DEFAULT_LEVEL: "level1",
};

export const ENTITY_CONFIG = {
  PLAYER_RADIUS: 20,
  PLAYER_BOUNCE: 0.2,
  PLAYER_FRICTION: 0.05,
  PLAYER_RESTITUTION: 0.2,
  PLAYER_COLOR_DEFAULT: 0xffffff,

  PLATFORM_WIDTH: 100,
  PLATFORM_HEIGHT: 20,
  PLATFORM_COLOR_DEFAULT: 0x888888,
};


export const CAMERA_SCROLL = {
    VELOCITY: 5,
    FONT_SIZE: "48px",
    COLOR: "#ffffff",
    LEFT_SYMBOL: "<",
    RIGHT_SYMBOL: ">",
    LEFT_X: 50,
    RIGHT_X: 150,
    BUTTON_OFFSET_Y: 50,
};


export const PLAYER_CONFIG = {
    SPEED: 5,
    JUMP_FORCE: 10,
    MAX_VELOCITY: 8,
};

export const CAMERA_CONFIG = {
    ZOOM: 1,
    FOLLOW_LERP: 0.1, // smooth camera follow speed
};

export const SCENE_KEYS = {
    PLAY: "PlayScene",
    HOME: "HomeScene",
};
