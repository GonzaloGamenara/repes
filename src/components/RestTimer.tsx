import React from 'react';
import { useWorkout } from '../context/WorkoutContext';

export const RestTimer: React.FC = () => {
  const {
    restTimeRemaining,
    isTimerActive,
    totalRestTime,
    stopRestTimer,
    addRestTime
  } = useWorkout();

  if (!isTimerActive || restTimeRemaining <= 0) return null;

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Progress percentage
  const progress = (restTimeRemaining / totalRestTime) * 100;
  const isUrgent = restTimeRemaining <= 10;

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+84px)] left-4 right-4 z-40 animate-slide-up">
      {/* Background glow */}
      <div className={`absolute inset-0 rounded-xl blur-lg transition-all duration-300 opacity-40 pointer-events-none ${
        isUrgent ? 'bg-rose-500/10' : 'bg-[#A3FF47]/10'
      }`}></div>

      <div className="relative bg-[#1E1E1E]/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden flex flex-col p-4">
        
        {/* Progress Bar background */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/5">
          <div 
            className={`h-full transition-all duration-1000 ease-linear ${
              isUrgent ? 'bg-rose-500' : 'bg-[#A3FF47]'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Content */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-3">
            {/* Spinning indicator */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              isUrgent ? 'border-rose-500 text-rose-500 animate-pulse' : 'border-[#A3FF47]/40 text-[#A3FF47]'
            }`}>
              <svg className={`w-4 h-4 ${isUrgent ? '' : 'animate-spin'}`} style={{ animationDuration: '4s' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <div className="flex flex-col">
              <span className="text-[10px] text-[#A0A0A0] font-bold uppercase tracking-wider">Descanso</span>
              <span className={`text-xl font-extrabold font-mono leading-none ${
                isUrgent ? 'text-rose-400' : 'text-white'
              }`}>
                {formatTime(restTimeRemaining)}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 overflow-x-auto select-none">
            <button
              onClick={() => addRestTime(-10)}
              className="px-2 py-1.5 rounded-lg bg-[#121212] hover:bg-white/5 border border-white/5 text-[10px] font-bold text-[#A0A0A0] active:scale-95 transition-all touch-none"
              style={{ touchAction: 'manipulation' }}
            >
              -10s
            </button>
            <button
              onClick={() => addRestTime(10)}
              className="px-2 py-1.5 rounded-lg bg-[#121212] hover:bg-white/5 border border-white/5 text-[10px] font-bold text-slate-300 active:scale-95 transition-all touch-none"
              style={{ touchAction: 'manipulation' }}
            >
              +10s
            </button>
            <button
              onClick={() => addRestTime(30)}
              className="px-2.5 py-1.5 rounded-lg bg-[#A3FF47]/10 hover:bg-[#A3FF47]/20 border border-[#A3FF47]/20 text-[10px] font-bold text-[#A3FF47] active:scale-95 transition-all touch-none"
              style={{ touchAction: 'manipulation' }}
            >
              +30s
            </button>
            <button
              onClick={stopRestTimer}
              className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-[10px] font-extrabold text-rose-400 active:scale-95 transition-all touch-none"
              style={{ touchAction: 'manipulation' }}
            >
              Omitir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default RestTimer;
