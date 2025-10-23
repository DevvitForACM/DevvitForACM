export interface RectDef {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: number;
}

export interface LevelConfig {
  worldWidth: number;
  worldHeight: number;
  gravityY: number;
  moveSpeed: number;
  jumpVelocity: number;
  deadzoneXFrac: number;
  bgColor: string;
  useMapControls: boolean;
  autoRun?: boolean;
  playerStartX?: number;
  playerStartY?: number;
  platforms?: RectDef[];
  hazards?: RectDef[];
}

export const DEFAULT_LEVEL: LevelConfig = {
  worldWidth: 4000,
  worldHeight: 600,
  gravityY: 1000,
  moveSpeed: 240,
  jumpVelocity: 480,
  deadzoneXFrac: 0.35,
  bgColor: 'black',
  useMapControls: true,
  autoRun: false,
  playerStartX: 200,
  playerStartY: 500,
  platforms: [],
  hazards: [],
};