import React from 'react';
import { Button } from './Button';

interface MenuProps {
  onPlay: () => void;
  totalStars: number;
}

export const Menu: React.FC<MenuProps> = ({ onPlay, totalStars }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-md mx-auto p-6 space-y-12 bg-slate-900 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-fuchsia-600/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="z-10 text-center space-y-2">
        <h1 className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-fuchsia-500 neon-text drop-shadow-2xl">
          RING<br/>SHOT
        </h1>
        <p className="text-slate-400 text-sm tracking-[0.3em] uppercase">Hyper Precision</p>
      </div>

      <div className="z-10 flex flex-col w-full gap-4 max-w-xs">
        <Button size="lg" onClick={onPlay} className="w-full animate-bounce">
          Play Game
        </Button>
        
        <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-4 border border-slate-700 flex justify-between items-center">
          <span className="text-slate-300 font-bold uppercase text-sm">Total Stars</span>
          <div className="flex items-center gap-2">
             <span className="text-yellow-400 text-xl">★</span>
             <span className="text-2xl font-mono">{totalStars}</span>
          </div>
        </div>
      </div>
      
      <div className="z-10 text-xs text-slate-600 absolute bottom-6">
        v1.0.0 • Tap to Shoot
      </div>
    </div>
  );
};