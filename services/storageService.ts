import { LevelProgress } from "../types";
import { LEVELS } from "../constants";

const STORAGE_KEY = 'ringshot_progress_v1';

export const getProgress = (): Record<number, LevelProgress> => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  
  // Initial state: Level 1 unlocked, others locked
  const initial: Record<number, LevelProgress> = {};
  LEVELS.forEach(l => {
    initial[l.id] = {
      stars: 0,
      unlocked: l.id === 1
    };
  });
  return initial;
};

export const saveLevelComplete = (levelId: number, stars: number) => {
  const current = getProgress();
  
  // Update stars if better
  if (stars > current[levelId].stars) {
    current[levelId].stars = stars;
  }
  
  // Unlock next level
  const nextLevelId = levelId + 1;
  if (current[nextLevelId]) {
    current[nextLevelId].unlocked = true;
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  return current;
};