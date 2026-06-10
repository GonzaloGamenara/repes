import React from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { translateMuscleToSpanish } from '../utils/muscleTranslations';

export const ExerciseFocusModal: React.FC = () => {
  const { focusedExercise, closeExerciseFocus } = useWorkout();

  if (!focusedExercise) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 animate-fade-in">
      <div className="absolute inset-0" onClick={closeExerciseFocus}></div>
      <div className="relative bg-[#0b0f0b] border border-white/10 rounded-3xl max-w-md w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl z-10 flex flex-col gap-4">
        {/* Close button */}
        <button 
          onClick={closeExerciseFocus}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 font-bold active:scale-90 transition-all z-20"
          style={{ touchAction: 'manipulation' }}
        >
          ✕
        </button>

        {/* Large image */}
        {focusedExercise.image_url ? (
          <img 
            src={focusedExercise.image_url} 
            alt={focusedExercise.name} 
            className="w-full aspect-square object-cover rounded-2xl border border-white/5 bg-slate-900 shadow-lg"
          />
        ) : (
          <div className="w-full aspect-square rounded-2xl bg-emerald-950/20 border border-white/5 flex items-center justify-center text-3xl font-black text-emerald-400">
            rp
          </div>
        )}

        {/* Title */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest pl-0.5">
            {focusedExercise.category} • {focusedExercise.difficulty}
          </span>
          <h3 className="text-base font-black text-white mt-0.5">
            {focusedExercise.name}
          </h3>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
            Músculo: {translateMuscleToSpanish(focusedExercise.primary_muscles)}
          </span>
        </div>

        {/* Steps / Instructions */}
        {focusedExercise.steps && (
          <div className="flex flex-col gap-1.5 mt-1 border-t border-white/5 pt-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Instrucciones Paso a Paso</span>
            <div className="text-xs text-slate-300 leading-relaxed font-medium space-y-2 whitespace-pre-line pl-1 text-left">
              {focusedExercise.steps}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseFocusModal;
