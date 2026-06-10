import React, { useState, useEffect } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { ExerciseCard } from '../../components/ExerciseCard';
import Button from '../../components/Button';

export const WorkoutView: React.FC = () => {
  const { 
    activeSession, 
    finishWorkout, 
    cancelWorkout, 
    isLoading,
    totalRestTime,
    setTotalRestTime 
  } = useWorkout();
  const [elapsedTime, setElapsedTime] = useState('00:00');

  useEffect(() => {
    if (!activeSession) return;

    const startTime = new Date(activeSession.startTime).getTime();

    const updateTimer = () => {
      const diff = Date.now() - startTime;
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsedTime(
        `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    };

    updateTimer(); // initial call
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-20">
        <svg className="animate-spin h-10 w-10 text-emerald-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-xs text-slate-400 font-bold mt-4 tracking-wider uppercase">Cargando entrenamiento...</span>
      </div>
    );
  }

  if (!activeSession) return null;

  // Calculate workout completion progress
  const totalSets = activeSession.exercises.reduce((acc, curr) => acc + curr.sets.length, 0);
  const completedSets = activeSession.exercises.reduce(
    (acc, curr) => acc + curr.sets.filter(s => s.isCompleted).length,
    0
  );
  const progressPercent = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <div className="flex-1 flex flex-col gap-6 px-4 py-6 max-w-lg mx-auto w-full pb-36 relative animate-fade-in">
      
      {/* Active Workout Header */}
      <div className="flex flex-col gap-2.5 bg-[#070b08]/85 border border-emerald-500/10 rounded-[32px] p-5 backdrop-blur-md shadow-lg shadow-emerald-950/5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest pl-0.5 animate-pulse">
            • Entrenamiento Activo
          </span>
          <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg">
            ⏱ {elapsedTime}
          </span>
        </div>
        
        <h1 className="text-base font-black text-white leading-tight">
          {activeSession.routineName}
        </h1>

        {/* Progress Bar */}
        <div className="mt-2.5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Progreso</span>
            <span>{completedSets} / {totalSets} series ({Math.round(progressPercent)}%)</span>
          </div>
          <div className="h-1.5 w-full bg-[#030604] border border-white/[0.03] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Rest Duration Selector */}
        <div className="mt-4 pt-3.5 border-t border-white/[0.04] flex flex-col gap-2">
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Tiempo de Descanso</span>
            <span className="font-mono text-emerald-400 font-extrabold">{totalRestTime}s</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[60, 90, 120, 180].map((time) => (
              <button
                key={time}
                onClick={() => setTotalRestTime(time)}
                className={`py-1.5 rounded-xl border text-[10px] font-extrabold tracking-wide transition-all duration-300 ${
                  totalRestTime === time
                    ? 'bg-gradient-to-r from-emerald-500/10 to-teal-400/10 border-emerald-500/35 text-emerald-400 shadow-md shadow-emerald-500/5'
                    : 'bg-[#030604] border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-300 active:scale-95'
                }`}
                style={{ touchAction: 'manipulation' }}
              >
                {time}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Exercises list */}
      <div className="flex flex-col gap-4">
        {activeSession.exercises.map((exercise) => (
          <ExerciseCard key={exercise.id} exercise={exercise} />
        ))}
      </div>

      {/* Session Controls */}
      <div className="flex flex-col gap-2 mt-4">
        <Button
          variant="primary"
          size="full"
          onClick={finishWorkout}
          className="shadow-xl"
        >
          Finalizar Entrenamiento
        </Button>
        <Button
          variant="danger"
          size="full"
          onClick={cancelWorkout}
        >
          Cancelar
        </Button>
      </div>

    </div>
  );
};
export default WorkoutView;
