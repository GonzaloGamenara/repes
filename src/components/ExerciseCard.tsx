import React from 'react';
import { type Exercise, useWorkout } from '../context/WorkoutContext';

interface ExerciseCardProps {
  exercise: Exercise;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise }) => {
  const { toggleSetCompleted, openBottomSheet, openExerciseFocus } = useWorkout();

  // Helper to determine progressive overload status
  const getOverloadStatus = (set: any) => {
    if (!set.isCompleted || set.weight === null || set.reps === null) return null;
    
    const weightDiff = set.weight - set.prevWeight;
    const repsDiff = set.reps - set.prevReps;
    
    if (weightDiff > 0) {
      return {
        text: `+${weightDiff} kg`,
        type: 'weight-up',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      };
    } else if (weightDiff === 0 && repsDiff > 0) {
      return {
        text: `+${repsDiff} reps`,
        type: 'reps-up',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      };
    } else if (weightDiff === 0 && repsDiff === 0) {
      return {
        text: 'Igual',
        type: 'equal',
        color: 'text-slate-400 bg-slate-500/10 border-slate-500/20'
      };
    } else {
      return {
        text: `${weightDiff} kg`,
        type: 'down',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      };
    }
  };

  return (
    <div className="bg-[#1E1E1E] border border-white/5 rounded-xl p-4.5 flex flex-col gap-4 shadow-lg hover:border-[#A3FF47]/10 transition-all duration-300">
      
      {/* Header with image */}
      <div className="flex items-center gap-3">
        {exercise.image_url ? (
          <img 
            src={exercise.image_url} 
            alt={exercise.name} 
            onClick={() => openExerciseFocus(exercise.exercise_id)}
            className="w-12 h-12 rounded-xl object-cover bg-slate-950 border border-white/5 flex-shrink-0 cursor-pointer hover:border-[#A3FF47] hover:scale-105 active:scale-95 transition-all duration-300"
          />
        ) : (
          <div 
            onClick={() => openExerciseFocus(exercise.exercise_id)}
            className="w-12 h-12 rounded-xl bg-[#A3FF47]/10 border border-white/5 flex items-center justify-center text-xs font-black text-[#A3FF47] flex-shrink-0 cursor-pointer hover:scale-105 hover:border-[#A3FF47] active:scale-95 transition-all duration-300"
          >
            rp
          </div>
        )}
        
        <div className="flex flex-col min-w-0">
          <h3 
            onClick={() => openExerciseFocus(exercise.exercise_id)}
            className="text-sm font-black text-white tracking-tight leading-tight truncate cursor-pointer hover:text-[#A3FF47] transition-colors duration-200"
          >
            {exercise.name}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {exercise.primary_muscles && (
              <span className="text-[8px] bg-[#A3FF47]/10 border border-[#A3FF47]/20 text-[#A3FF47] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md">
                {exercise.primary_muscles}
              </span>
            )}
            <span className="text-[8px] text-[#A0A0A0] font-extrabold uppercase tracking-wider">
              Objetivo: {exercise.target_sets}x{exercise.target_reps}
            </span>
          </div>
        </div>
      </div>
 
      {/* Table-like header */}
      <div className="grid grid-cols-12 gap-0.5 text-[9px] font-black text-[#A0A0A0] uppercase tracking-widest px-1">
        <div className="col-span-2 text-center">Serie</div>
        <div className="col-span-4 text-center">Anterior</div>
        <div className="col-span-4 text-center">Actual</div>
        <div className="col-span-2 text-center">Listo</div>
      </div>
 
      {/* Sets list */}
      <div className="flex flex-col gap-2">
        {exercise.sets.map((set, index) => {
          const overload = getOverloadStatus(set);
          return (
            <div 
              key={set.id}
              className={`grid grid-cols-12 gap-0.5 items-center py-2 px-0.5 rounded-xl transition-all duration-300 border ${
                set.isCompleted 
                  ? 'bg-[#A3FF47]/5 border-[#A3FF47]/20 shadow-[0_0_12px_rgba(163,255,71,0.02)]' 
                  : 'bg-white/[0.01] border-white/[0.03] hover:bg-white/[0.03]'
              }`}
            >
              {/* Set Number */}
              <div className="col-span-2 text-center">
                <span className={`inline-flex w-5.5 h-5.5 items-center justify-center rounded-lg text-[11px] font-mono font-bold ${
                  set.isCompleted ? 'bg-[#A3FF47]/20 text-[#A3FF47]' : 'bg-[#121212] text-[#A0A0A0] border border-white/5'
                }`}>
                  {set.number}
                </span>
              </div>
 
              {/* Previous weight & reps */}
              <div className="col-span-4 text-center">
                <span className="text-[11px] font-mono font-semibold text-[#A0A0A0] block truncate">
                  {set.prevWeight}kg x {set.prevReps}
                </span>
              </div>
 
              {/* Current weight & reps (Editable) */}
              <div 
                className="col-span-4 text-center cursor-pointer py-1.5"
                onClick={() => openBottomSheet(exercise.id, index)}
              >
                {set.weight !== null && set.reps !== null ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[11px] font-mono font-bold text-white bg-[#121212] px-1.5 py-0.5 rounded border border-white/5 block truncate max-w-full">
                      {set.weight}kg x {set.reps}
                    </span>
                    {overload && (
                      <span className={`text-[8px] px-1 py-0.2 rounded border font-bold ${overload.color} block truncate max-w-full`}>
                        {overload.text}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-[#A3FF47] hover:text-[#b5ff66] underline decoration-[#A3FF47]/30 underline-offset-4 decoration-2">
                    Registrar
                  </span>
                )}
              </div>
 
              {/* Completed checkmark */}
              <div className="col-span-2 flex justify-center">
                <button
                  onClick={() => toggleSetCompleted(exercise.id, index)}
                  className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center border transition-all duration-300 active:scale-90 ${
                    set.isCompleted
                      ? 'bg-[#A3FF47] border-[#A3FF47] text-[#121212] shadow-md shadow-[#A3FF47]/20'
                      : 'bg-transparent border-white/20 hover:border-[#A3FF47]/40 text-transparent'
                  }`}
                  style={{ touchAction: 'manipulation' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default ExerciseCard;
