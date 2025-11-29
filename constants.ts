import { LevelConfig } from './types';

export const COLORS = {
  primary: '#0ea5e9', // Sky 500
  accent: '#d946ef', // Fuchsia 500
  success: '#84cc16', // Lime 500
  danger: '#ef4444', // Red 500
  background: '#0f172a', // Slate 900
};

export const GAME_CONSTANTS = {
  MAX_POWER: 25,
  MIN_POWER: 8,
  GRAVITY: 0.5,
  DRAG_SENSITIVITY: 0.15,
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 800,
  TARGET_Y: 150,
  SPAWN_Y: 650, // Moved up slightly to give room for pull back
  RING_RADIUS: 10, // Smaller hit radius for dart tip
};

// 15 Progressive Levels
export const LEVELS: LevelConfig[] = [
  // Phase 1: Basics - Stationary Target
  { id: 1, ringsToWin: 3, targetSpeed: 0, targetMoveRange: 0, obstacleSpeed: 0, scaleSpeed: 0, targetRadius: 45 },
  { id: 2, ringsToWin: 4, targetSpeed: 0, targetMoveRange: 0, obstacleSpeed: 0, scaleSpeed: 0, targetRadius: 40 },
  { id: 3, ringsToWin: 5, targetSpeed: 0, targetMoveRange: 0, obstacleSpeed: 0, scaleSpeed: 0, targetRadius: 35 },
  
  // Phase 2: Movement - Moving Horizontal
  { id: 4, ringsToWin: 3, targetSpeed: 0.02, targetMoveRange: 60, obstacleSpeed: 0, scaleSpeed: 0, targetRadius: 45 },
  { id: 5, ringsToWin: 4, targetSpeed: 0.03, targetMoveRange: 90, obstacleSpeed: 0, scaleSpeed: 0, targetRadius: 40 },
  { id: 6, ringsToWin: 5, targetSpeed: 0.04, targetMoveRange: 120, obstacleSpeed: 0, scaleSpeed: 0, targetRadius: 35 },
  
  // Phase 3: Pulsing Size & Movement
  { id: 7, ringsToWin: 3, targetSpeed: 0.02, targetMoveRange: 40, obstacleSpeed: 0, scaleSpeed: 0.03, targetRadius: 45 },
  { id: 8, ringsToWin: 4, targetSpeed: 0.03, targetMoveRange: 60, obstacleSpeed: 0, scaleSpeed: 0.05, targetRadius: 40 },
  { id: 9, ringsToWin: 5, targetSpeed: 0.04, targetMoveRange: 80, obstacleSpeed: 0, scaleSpeed: 0.08, targetRadius: 35 },

  // Phase 4: Obstacles (Orbiting Red Dot)
  { id: 10, ringsToWin: 3, targetSpeed: 0, targetMoveRange: 0, obstacleSpeed: 0.05, scaleSpeed: 0, targetRadius: 50 },
  { id: 11, ringsToWin: 4, targetSpeed: 0.02, targetMoveRange: 40, obstacleSpeed: 0.07, scaleSpeed: 0, targetRadius: 45 },
  { id: 12, ringsToWin: 5, targetSpeed: 0.03, targetMoveRange: 60, obstacleSpeed: 0.09, scaleSpeed: 0, targetRadius: 40 },

  // Phase 5: Chaos (High Speed Movement & Obstacles)
  { id: 13, ringsToWin: 5, targetSpeed: 0.06, targetMoveRange: 100, obstacleSpeed: 0.06, scaleSpeed: 0.02, targetRadius: 45 },
  { id: 14, ringsToWin: 6, targetSpeed: 0.08, targetMoveRange: 130, obstacleSpeed: 0.08, scaleSpeed: 0.03, targetRadius: 40 },
  { id: 15, ringsToWin: 8, targetSpeed: 0.1, targetMoveRange: 150, obstacleSpeed: 0.12, scaleSpeed: 0.05, targetRadius: 35 },
];