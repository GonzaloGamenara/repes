import React, { useState, useEffect } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import Button from '../../components/Button';

export const SetBottomSheet: React.FC = () => {
  const {
    activeSession,
    activeExerciseId,
    activeSetIndex,
    closeBottomSheet,
    updateSet
  } = useWorkout();

  // Local state for weight and reps
  const [weight, setWeight] = useState<number>(0);
  const [reps, setReps] = useState<number>(0);

  // Find active exercise and set
  const activeExercise = activeSession?.exercises.find(
    (e) => e.id === activeExerciseId
  );
  
  const activeSet = activeSetIndex !== null && activeExercise
    ? activeExercise.sets[activeSetIndex]
    : null;

  // Initialize local inputs from set values (or previous values if empty)
  useEffect(() => {
    if (activeSet) {
      setWeight(activeSet.weight !== null ? activeSet.weight : activeSet.prevWeight);
      setReps(activeSet.reps !== null ? activeSet.reps : activeSet.prevReps);
    }
  }, [activeSet, activeExerciseId, activeSetIndex]);

  if (!activeSession || !activeExerciseId || activeSetIndex === null || !activeExercise || !activeSet) {
    return null;
  }

  const handleSave = (markCompleted = true) => {
    updateSet(activeExerciseId, activeSetIndex, weight, reps, markCompleted);
    closeBottomSheet();
  };

  // Progressive Overload Comparison
  const getOverloadComparison = () => {
    const wDiff = weight - activeSet.prevWeight;
    const rDiff = reps - activeSet.prevReps;

    if (wDiff > 0) {
      return {
        text: `🟢 ¡Vas ${wDiff}kg arriba en peso! Excelente sobrecarga. 🔥`,
        class: 'text-[#A3FF47] bg-[#A3FF47]/10 border border-[#A3FF47]/20'
      };
    } else if (wDiff === 0 && rDiff > 0) {
      return {
        text: `🟢 ¡Vas ${rDiff} reps arriba! Excelente sobrecarga. 💪`,
        class: 'text-[#A3FF47] bg-[#A3FF47]/10 border border-[#A3FF47]/20'
      };
    } else if (wDiff === 0 && rDiff === 0) {
      return {
        text: `⚪ Igualando el rendimiento anterior. Buen trabajo.`,
        class: 'text-[#A0A0A0] bg-white/5 border border-white/10'
      };
    } else {
      return {
        text: `🟡 Serie de descarga o peso inferior (${wDiff}kg de diferencia).`,
        class: 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
      };
    }
  };

  const comp = getOverloadComparison();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in bg-black/60 backdrop-blur-xs">
      
      {/* Background Tap Handler */}
      <div className="absolute inset-0" onClick={closeBottomSheet}></div>

      {/* Bottom Sheet Drawer */}
      <div 
        className="relative w-full max-w-lg bg-[#1E1E1E] border-t border-white/10 rounded-t-2xl p-6 shadow-2xl z-10 animate-slide-up pb-[calc(env(safe-area-inset-bottom)+24px)] flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS bar handle */}
        <div className="w-12 h-1 bg-white/10 rounded-full mx-auto -mt-2"></div>

        {/* Title / Info */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-[#A3FF47] uppercase tracking-widest pl-0.5">
            {activeExercise.name}
          </span>
          <h2 className="text-lg font-black text-white uppercase tracking-wider">
            Serie #{activeSet.number}
          </h2>
          <span className="text-xs text-[#A0A0A0] mt-1 font-medium">
            Récord anterior: <strong className="text-white font-bold">{activeSet.prevWeight}kg × {activeSet.prevReps} repes</strong>
          </span>
        </div>

        {/* Comparison Alert Banner */}
        <div className={`p-3 rounded-xl border text-xs font-semibold text-center leading-relaxed ${comp.class}`}>
          {comp.text}
        </div>

        {/* Input Interface */}
        <div className="flex flex-col gap-6">
          
          {/* Weight Control */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider">Peso (kg)</span>
              <span className="text-xs font-mono font-bold text-[#A3FF47] bg-[#121212] px-2 py-0.5 rounded-md border border-white/5">
                {weight} kg
              </span>
            </div>
            
            {/* Rapid incrementers grid */}
            <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
              <button 
                onClick={() => setWeight(Math.max(0, weight - 5))}
                className="py-2 px-0.5 text-center rounded-lg bg-[#121212] border border-white/10 hover:bg-[#2A2A2A] text-[10px] sm:text-xs font-bold text-white active:scale-95 transition-all font-mono"
              >
                -5
              </button>
              <button 
                onClick={() => setWeight(Math.max(0, weight - 2.5))}
                className="py-2 px-0.5 text-center rounded-lg bg-[#121212] border border-white/10 hover:bg-[#2A2A2A] text-[10px] sm:text-xs font-bold text-white active:scale-95 transition-all font-mono"
              >
                -2.5
              </button>
              <button 
                onClick={() => setWeight(Math.max(0, weight - 1))}
                className="py-2 px-0.5 text-center rounded-lg bg-[#121212] border border-white/10 hover:bg-[#2A2A2A] text-[10px] sm:text-xs font-bold text-white active:scale-95 transition-all font-mono"
              >
                -1
              </button>
              <button 
                onClick={() => setWeight(weight + 1)}
                className="py-2 px-0.5 text-center rounded-lg bg-[#A3FF47]/10 border border-[#A3FF47]/20 hover:bg-[#A3FF47]/20 text-[10px] sm:text-xs font-bold text-[#A3FF47] active:scale-95 transition-all font-mono"
              >
                +1
              </button>
              <button 
                onClick={() => setWeight(weight + 2.5)}
                className="py-2 px-0.5 text-center rounded-lg bg-[#A3FF47]/10 border border-[#A3FF47]/20 hover:bg-[#A3FF47]/20 text-[10px] sm:text-xs font-bold text-[#A3FF47] active:scale-95 transition-all font-mono"
              >
                +2.5
              </button>
              <button 
                onClick={() => setWeight(weight + 5)}
                className="py-2 px-0.5 text-center rounded-lg bg-[#A3FF47]/10 border border-[#A3FF47]/20 hover:bg-[#A3FF47]/20 text-[10px] sm:text-xs font-bold text-[#A3FF47] active:scale-95 transition-all font-mono"
              >
                +5
              </button>
            </div>

            {/* Direct manual input */}
            <input 
              type="number" 
              pattern="[0-9]*" 
              inputMode="decimal"
              value={weight || ''}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              className="bg-[#121212] border border-white/10 rounded-xl px-4 py-2.5 text-center text-sm font-mono font-bold text-white focus:outline-none focus:border-[#A3FF47] transition-all"
              placeholder="Editar manualmente"
              style={{ touchAction: 'manipulation' }}
            />
          </div>

          {/* Reps Control */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider">Repeticiones</span>
              <span className="text-xs font-mono font-bold text-[#A3FF47] bg-[#121212] px-2 py-0.5 rounded-md border border-white/5">
                {reps} repes
              </span>
            </div>

            {/* Incrementers */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setReps(Math.max(0, reps - 1))}
                className="flex-1 py-3 rounded-xl bg-[#121212] border border-white/10 hover:bg-[#2A2A2A] text-sm font-bold text-white active:scale-95 transition-all"
              >
                -1 Repe
              </button>
              <button 
                onClick={() => setReps(reps + 1)}
                className="flex-1 py-3 rounded-xl bg-[#A3FF47]/10 border border-[#A3FF47]/20 hover:bg-[#A3FF47]/20 text-sm font-bold text-[#A3FF47] active:scale-95 transition-all"
              >
                +1 Repe
              </button>
            </div>

            {/* Direct manual input */}
            <input 
              type="number" 
              pattern="[0-9]*"
              inputMode="numeric"
              value={reps || ''}
              onChange={(e) => setReps(parseInt(e.target.value) || 0)}
              className="bg-[#121212] border border-white/10 rounded-xl px-4 py-2.5 text-center text-sm font-mono font-bold text-white focus:outline-none focus:border-[#A3FF47] transition-all"
              placeholder="Editar manualmente"
              style={{ touchAction: 'manipulation' }}
            />
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <Button
            variant="primary"
            size="full"
            onClick={() => handleSave(true)}
          >
            Guardar y Marcar Listo
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => handleSave(false)}
            >
              Solo Guardar
            </Button>
            <Button
              variant="ghost"
              className="flex-1"
              onClick={closeBottomSheet}
            >
              Cerrar
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SetBottomSheet;
