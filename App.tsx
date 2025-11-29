import React, { useState, useEffect } from 'react';
import { GameState, LevelConfig, LevelProgress } from './types';
import { LEVELS } from './constants';
import { getProgress, saveLevelComplete } from './services/storageService';
import { Menu } from './components/Menu';
import { LevelSelect } from './components/LevelSelect';
import { GameCanvas } from './components/GameCanvas';
import { Button } from './components/Button';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [progress, setProgress] = useState<Record<number, LevelProgress>>(getProgress());
  const [sessionScore, setSessionScore] = useState({ success: false, stars: 0 });
  const [streak, setStreak] = useState(0);

  // Refresh progress on mount
  useEffect(() => {
    setProgress(getProgress());
  }, [gameState]);

  const totalStars = Object.values(progress).reduce((acc, curr) => acc + (curr as LevelProgress).stars, 0);

  const startLevel = (id: number) => {
    setCurrentLevelId(id);
    setGameState(GameState.PLAYING);
  };

  const handleGameOver = (success: boolean, stars: number) => {
    if (success) {
      saveLevelComplete(currentLevelId, stars);
      setSessionScore({ success: true, stars });
      setStreak(prev => prev + 1); // Increment streak on win
      setGameState(GameState.LEVEL_COMPLETE);
    } else {
      setSessionScore({ success: false, stars: 0 });
      setStreak(0); // Reset streak on fail
      setGameState(GameState.GAME_OVER);
    }
  };

  const nextLevel = () => {
    const nextId = currentLevelId + 1;
    if (nextId <= LEVELS.length) {
      startLevel(nextId);
    } else {
      setGameState(GameState.LEVEL_SELECT);
    }
  };

  const retryLevel = () => {
    setGameState(GameState.PLAYING);
  };

  // Streak bonus: 20% bigger rings if streak >= 2
  const bonusRingScale = streak >= 2 ? 1.2 : 1.0;

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center overflow-hidden">
      {gameState === GameState.MENU && (
        <Menu 
          onPlay={() => setGameState(GameState.LEVEL_SELECT)} 
          totalStars={totalStars}
        />
      )}

      {gameState === GameState.LEVEL_SELECT && (
        <LevelSelect 
          progress={progress} 
          onSelectLevel={startLevel} 
          onBack={() => setGameState(GameState.MENU)}
        />
      )}

      {gameState === GameState.PLAYING && (
        <GameCanvas 
          key={currentLevelId} // Force remount on restart
          level={LEVELS.find(l => l.id === currentLevelId)!} 
          streak={streak}
          bonusScale={bonusRingScale}
          onGameOver={handleGameOver}
          onExit={() => setGameState(GameState.LEVEL_SELECT)}
        />
      )}

      {/* Overlays for Win/Loss */}
      {(gameState === GameState.GAME_OVER || gameState === GameState.LEVEL_COMPLETE) && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
             
             {/* Decor */}
             <div className={`absolute top-0 left-0 w-full h-2 ${gameState === GameState.LEVEL_COMPLETE ? 'bg-gradient-to-r from-lime-500 to-green-500' : 'bg-gradient-to-r from-red-500 to-orange-500'}`}></div>

             <h2 className={`text-3xl font-black italic uppercase mb-2 ${gameState === GameState.LEVEL_COMPLETE ? 'text-lime-400' : 'text-red-500'}`}>
               {gameState === GameState.LEVEL_COMPLETE ? 'Sector Clear' : 'Mission Failed'}
             </h2>
             
             <p className="text-slate-400 mb-8">
               {gameState === GameState.LEVEL_COMPLETE ? (streak > 1 ? `Excellent! Streak: ${streak}` : 'Excellent shooting.') : 'Target missed. Sequence reset.'}
             </p>

             {gameState === GameState.LEVEL_COMPLETE && (
               <div className="flex gap-2 mb-8">
                 {[1, 2, 3].map(i => (
                   <div key={i} className={`transform transition-all duration-500 ${i <= sessionScore.stars ? 'scale-100' : 'scale-75 opacity-30 grayscale'}`}>
                     <svg 
                        className="w-10 h-10 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                   </div>
                 ))}
               </div>
             )}

             <div className="flex flex-col w-full gap-3">
               {gameState === GameState.LEVEL_COMPLETE ? (
                 <>
                   <Button onClick={nextLevel} className="w-full">Next Sector</Button>
                   <Button variant="secondary" onClick={retryLevel} className="w-full">Replay</Button>
                 </>
               ) : (
                 <Button variant="danger" onClick={retryLevel} className="w-full">Retry</Button>
               )}
               <Button variant="secondary" onClick={() => setGameState(GameState.LEVEL_SELECT)} className="w-full">Menu</Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}