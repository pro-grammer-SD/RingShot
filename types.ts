export enum GameState {
  MENU = 'MENU',
  LEVEL_SELECT = 'LEVEL_SELECT',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
}

export interface LevelConfig {
  id: number;
  ringsToWin: number;
  targetSpeed: number; // 0 for static, >0 for moving
  targetMoveRange: number; // Amplitude of horizontal movement
  obstacleSpeed: number; // Speed of orbiting obstacle (0 = none)
  scaleSpeed: number; // Pulsing effect
  targetRadius: number;
}

export interface LevelProgress {
  stars: number; // 0, 1, 2, 3
  unlocked: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface Ring {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number; // Rotation in radians
  active: boolean;
  landed: boolean;
  scale: number;
}