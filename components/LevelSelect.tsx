import React from 'react';
import { LEVELS } from '../constants';
import { LevelProgress } from '../types';
import { Button } from './Button';

interface LevelSelectProps {
  progress: Record<number, LevelProgress>;
  onSelectLevel: (levelId: number) => void;
  onBack: () => void;
}

export const LevelSelect: React.FC<LevelSelectProps> = ({ progress, onSelectLevel, onBack }) => {
  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto bg-slate-900">
      <div className="p-6 flex items-center justify-between bg-slate-900/90 backdrop-blur z-10 sticky top-0 border-b border-slate-800">
        <Button variant="icon" onClick={onBack}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Button>
        <h2 className="text-xl font-bold uppercase tracking-widest text-white">Select Sector</h2>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-3 gap-4 pb-12">
          {LEVELS.map((level) => {
            const levelData = progress[level.id] || { stars: 0, unlocked: false };
            const isLocked = !levelData.unlocked;

            return (
              <button
                key={level.id}
                disabled={isLocked}
                onClick={() => onSelectLevel(level.id)}
                className={`
                  aspect-square rounded-xl flex flex-col items-center justify-center relative group
                  transition-all duration-200
                  ${isLocked 
                    ? 'bg-slate-800/50 border border-slate-700 opacity-60' 
                    : 'bg-slate-800 border border-slate-600 hover:border-fuchsia-500 hover:shadow-[0_0_15px_rgba(217,70,239,0.3)]'
                  }
                `}
              >
                {isLocked ? (
                  <svg className="w-6 h-6 text-slate-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                ) : (
                  <>
                    <span className="text-2xl font-bold font-mono text-white mb-1">{level.id}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map(star => (
                        <svg 
                          key={star}
                          className={`w-3 h-3 ${star <= levelData.stars ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
                          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      ))}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};