// src/client/constants/game-constants.ts
import Phaser from "phaser";

/* ----------------------------------------------
   GAME CONFIGURATION
   ---------------------------------------------- */
export const GAME_CONFIG = {
  BACKGROUND_COLOR: "#000000",
  GRAVITY_Y: 1,
  DEBUG: false, // should remain false in production
  SCALE_MODE: Phaser.Scale.RESIZE,
  AUTO_CENTER: Phaser.Scale.CENTER_BOTH,
  DEFAULT_LEVEL: "level",
};

/* ----------------------------------------------
   ENTITY CONFIGURATION
   ---------------------------------------------- */
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

/* ----------------------------------------------
   CAMERA & PLAYER CONFIGURATION
   ---------------------------------------------- */
export const CAMERA_SCROLL = {
  VELOCITY: 5,
  FONT_SIZE: "48px",
  COLOR: "#111111", // dark for light canvas visibility
  LEFT_SYMBOL: "<",
  RIGHT_SYMBOL: ">",
  LEFT_X: 50,
  RIGHT_X: 150,
  BUTTON_OFFSET_Y: 120, // move above bottom toolbar
};

export const PLAYER_CONFIG = {
  SPEED: 5,
  JUMP_FORCE: 10,
  MAX_VELOCITY: 8,
};

export const CAMERA_CONFIG = {
  ZOOM: 1,
  FOLLOW_LERP: 0.1,
};

export const SCENE_KEYS = {
  PLAY: "PlayScene",
  HOME: "HomeScene",
  CREATE: "CreateScene",
};

/* ----------------------------------------------
   ADVANCED PHYSICS CONSTANTS (From main)
   ---------------------------------------------- */
export const PHYSICS = {
  GRAVITY_Y: 800,
  JUMP_VELOCITY: 600,
  MOVE_SPEED: 220,
  PLAYER_DRAG_X: 600,
  PLAYER_BOUNCE_X: 0.1,
  PLAYER_BOUNCE_Y: 0,
} as const;

/* ----------------------------------------------
   PLAYER DETAILS
   ---------------------------------------------- */
export const PLAYER = {
  SIZE: {
    WIDTH: 32,
    HEIGHT: 48,
  },
  HEALTH: {
    MAX: 100,
    DEFAULT: 100,
  },
  VISUAL: {
    RADIUS: 20,
    COLOR: 0xff0000,
  },
} as const;

/* ----------------------------------------------
   ENTITY SIZES
   ---------------------------------------------- */
export const ENTITY_SIZES = {
  BASE: {
    WIDTH: 32,
    HEIGHT: 32,
  },
  DOOR: {
    WIDTH: 48,
    HEIGHT: 64,
  },
  COIN: {
    WIDTH: 24,
    HEIGHT: 24,
  },
  SPRING: {
    WIDTH: 32,
    HEIGHT: 24,
  },
} as const;

/* ----------------------------------------------
   DAMAGE & HEALTH
   ---------------------------------------------- */
export const DAMAGE = {
  SPIKE: 25,
  ENEMY: 20,
} as const;

export const ENEMY = {
  HEALTH: {
    MAX: 50,
    DEFAULT: 50,
  },
} as const;

/* ----------------------------------------------
   SPRING CONSTANTS
   ---------------------------------------------- */
export const SPRING = {
  BOUNCE_FORCE: 600,
  COOLDOWN_TIME: 0.3,
  COMPRESSION_SCALE: 0.7,
} as const;

/* ----------------------------------------------
   COIN CONSTANTS
   ---------------------------------------------- */
export const COIN = {
  VALUE: 1,
  FLOAT_AMPLITUDE: 5,
  FLOAT_SPEED: 500,
  SPIN_SPEED: 0.2,
} as const;

/* ----------------------------------------------
   COLLISION CONSTANTS
   ---------------------------------------------- */
export const COLLISION = {
  HISTORY_LIMIT: 100,
  KNOCKBACK_FORCE: 50,
  VISUAL_EFFECTS: {
    FLASH_DURATION: 100,
    SCALE_DURATION: 150,
    BOUNCE_DURATION: 200,
  },
} as const;

/* ----------------------------------------------
   CAMERA CONSTANTS
   ---------------------------------------------- */
export const CAMERA = {
  FOLLOW_LERP_X: 0.08,
  FOLLOW_LERP_Y: 0.08,
  DEADZONE_X_FRAC: 0.3,
  DEADZONE_Y_FRAC: 0.8,
  SHAKE_DURATION: 150,
  SHAKE_INTENSITY: 0.003,
} as const;

/* ----------------------------------------------
   WORLD SETTINGS
   ---------------------------------------------- */
export const WORLD = {
  DEFAULT_WIDTH: 2000,
  DEFAULT_HEIGHT: 600,
  GROUND_HEIGHT: 40,
  PLATFORM_HEIGHT: 30,
} as const;

/* ----------------------------------------------
   COLORS
   ---------------------------------------------- */
export const COLORS = {
  BACKGROUND: "#0f172a",
  GROUND: 0x334155,
  PLATFORM: 0x956338,
  PLATFORM_ALT: 0x4a8f38,
  HAZARD: 0x2dd4bf,
  DAMAGE_FLASH: 0xff0000,
  ATTACK_FLASH: 0xff4444,
  BOUNCE_FLASH: 0x00ff00,
  DOOR_LOCKED: 0xff0000,
  DOOR_OPEN: 0x00ff00,
} as const;

/* ----------------------------------------------
   ANIMATIONS
   ---------------------------------------------- */
export const ANIMATIONS = {
  TIMEOUT: {
    DAMAGE_EFFECT: 100,
    ATTACK_EFFECT: 150,
    BOUNCE_EFFECT: 200,
    COIN_COLLECT: 200,
  },
  SCALES: {
    COLLECT_SCALE: 1.5,
    BOUNCE_COMPRESS: 0.8,
    NORMAL: 1.0,
  },
} as const;
