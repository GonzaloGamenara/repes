import React, { useState, useEffect } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';
import { translateMuscleToSpanish } from '../../utils/muscleTranslations';

// Spanish to English primary muscles mapping
const MUSCLE_MAP: Record<string, string | string[]> = {
  'Todos': 'all',
  'Abdominales': 'Abdominals',
  'Pecho': 'Chest',
  'Hombros': 'Shoulders',
  'Bíceps': 'Biceps',
  'Tríceps': 'Triceps',
  'Espalda': ['Lats', 'Middle Back', 'Lower Back'],
  'Cuádriceps': 'Quadriceps',
  'Femorales': 'Hamstrings',
  'Glúteos': 'Glutes',
  'Gemelos': 'Calves',
  'Antebrazos': 'Forearms',
  'Trapecio': 'Traps',
  'Cuello': 'Neck'
};



export const RoutinesView: React.FC = () => {
  const {
    routines,
    createRoutine,
    deleteRoutine,
    addExerciseToRoutine,
    removeExerciseFromRoutine,
    reorderExercise,
    openExerciseFocus
  } = useWorkout();

  // Active view inside routines tab
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');

  // Dictionary search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState('Todos');
  
  // Selected exercise to add configs
  const [selectedDictExercise, setSelectedDictExercise] = useState<any | null>(null);
  const [targetSets, setTargetSets] = useState<number>(3);
  const [targetReps, setTargetReps] = useState<string>('8-12');

  const activeRoutine = routines.find(r => r.id === editingRoutineId);

  // Debounce search in exercise dictionary with muscle filter
  useEffect(() => {
    const triggerSearch = searchQuery.trim().length >= 2 || selectedMuscle !== 'Todos';

    if (!triggerSearch) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        let q = supabase
          .from('exercise_dictionary')
          .select('id, name, category, primary_muscles, image_url, steps, difficulty');

        // Apply muscle filter if selected
        if (selectedMuscle !== 'Todos') {
          const englishVal = MUSCLE_MAP[selectedMuscle];
          if (Array.isArray(englishVal)) {
            q = q.in('primary_muscles', englishVal);
          } else {
            q = q.eq('primary_muscles', englishVal);
          }
        }

        // Apply text query filter if typed
        if (searchQuery.trim().length >= 2) {
          q = q.ilike('name', `%${searchQuery.trim()}%`);
        }

        const { data, error } = await q.limit(15);
        
        if (!error && data) {
          setSearchResults(data);
        }
      } catch (err) {
        console.error('Error searching dictionary:', err);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedMuscle]);

  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineName.trim()) return;
    const created = await createRoutine(newRoutineName.trim());
    setNewRoutineName('');
    setShowCreateModal(false);
    if (created) {
      setEditingRoutineId(created.id);
    }
  };

  const handleAddExercise = async () => {
    if (!editingRoutineId || !selectedDictExercise) return;
    await addExerciseToRoutine(
      editingRoutineId,
      selectedDictExercise.id,
      targetSets,
      targetReps
    );
    setSelectedDictExercise(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleDeleteRoutine = (id: string, name: string) => {
    if (window.confirm(`¿Seguro que querés borrar la rutina "${name}"? Se perderán todas sus asignaciones.`)) {
      deleteRoutine(id);
      if (editingRoutineId === id) {
        setEditingRoutineId(null);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col px-4 py-6 max-w-lg mx-auto w-full pb-safe animate-fade-in">
      
      {/* 1. ROUTINE EDITOR VIEW */}
      {editingRoutineId && activeRoutine ? (
        <div className="flex flex-col gap-6 w-full">
          {/* Editor Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <button
              onClick={() => {
                setEditingRoutineId(null);
                setSelectedDictExercise(null);
                setSearchQuery('');
                setSelectedMuscle('Todos');
              }}
              className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 font-semibold text-xs transition-colors"
            >
              ← Volver
            </button>
            <h1 className="text-sm font-black text-white truncate max-w-[180px]">
              {activeRoutine.name}
            </h1>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDeleteRoutine(activeRoutine.id, activeRoutine.name)}
              className="text-xs py-1.5 px-2.5"
            >
              Borrar
            </Button>
          </div>

          {/* Added Exercises List */}
          <div className="flex flex-col gap-3">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
              Ejercicios agregados ({activeRoutine.exercises.length})
            </h2>

            {activeRoutine.exercises.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-white/5 rounded-2xl bg-[#0b0f0b]/20">
                <p className="text-xs text-slate-500">Esta rutina no tiene ejercicios. Buscalos y agregalos abajo.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {activeRoutine.exercises.map((exercise, idx) => (
                  <div 
                    key={exercise.id}
                    className="p-3 bg-[#0b0f0b]/40 border border-white/5 rounded-2xl flex items-center justify-between gap-3"
                  >
                    {/* Exercise info with mini thumb */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {exercise.image_url ? (
                        <img 
                          src={exercise.image_url} 
                          alt={exercise.name} 
                          onClick={() => openExerciseFocus(exercise.exercise_id)}
                          className="w-10 h-10 rounded-lg object-cover border border-white/5 bg-slate-900 cursor-pointer hover:border-emerald-500/50 active:scale-95 transition-all"
                        />
                      ) : (
                        <div 
                          onClick={() => openExerciseFocus(exercise.exercise_id)}
                          className="w-10 h-10 rounded-lg bg-emerald-950/20 border border-white/5 flex items-center justify-center text-xs font-black text-emerald-400 cursor-pointer"
                        >
                          rp
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span 
                          onClick={() => openExerciseFocus(exercise.exercise_id)}
                          className="text-xs font-bold text-white truncate leading-tight cursor-pointer hover:text-emerald-400"
                        >
                          {exercise.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {exercise.target_sets} series × {exercise.target_reps} reps
                        </span>
                      </div>
                    </div>

                    {/* Controls (Order and delete) */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => reorderExercise(activeRoutine.id, exercise.id, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 disabled:opacity-30 disabled:pointer-events-none active:scale-90 transition-all"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => reorderExercise(activeRoutine.id, exercise.id, 'down')}
                        disabled={idx === activeRoutine.exercises.length - 1}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 disabled:opacity-30 disabled:pointer-events-none active:scale-90 transition-all"
                      >
                        ▼
                      </button>
                      <button
                        onClick={() => removeExerciseFromRoutine(exercise.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 ml-1 active:scale-90 transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Exercise Search Interface */}
          <div className="flex flex-col gap-3 mt-4 border-t border-white/5 pt-5">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
              Buscar ejercicio en diccionario
            </h2>

            {/* Config Box if exercise is selected */}
            {selectedDictExercise ? (
              <div className="p-4 bg-emerald-950/10 border border-emerald-500/30 rounded-2xl flex flex-col gap-4 animate-fade-in">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-emerald-400 font-bold">Configurar Ejercicio</span>
                    <span className="text-sm font-black text-white truncate mt-0.5">{selectedDictExercise.name}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedDictExercise(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase pl-0.5">Series objetivo</label>
                    <input 
                      type="number"
                      value={targetSets}
                      onChange={(e) => setTargetSets(parseInt(e.target.value) || 1)}
                      className="bg-[#030704] border border-slate-900 focus:border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-white text-center font-bold focus:outline-none"
                      min={1}
                      max={10}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase pl-0.5">Repeticiones</label>
                    <input 
                      type="text"
                      value={targetReps}
                      onChange={(e) => setTargetReps(e.target.value)}
                      placeholder="ej: 8-12 o 10"
                      className="bg-[#030704] border border-slate-900 focus:border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-white text-center font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={handleAddExercise}
                  className="py-2.5 text-xs font-bold"
                >
                  Agregar a la Rutina
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 relative">
                
                {/* Horizontal scrolling Spanish muscle filters */}
                <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin select-none touch-pan-x">
                  {Object.keys(MUSCLE_MAP).map((muscle) => (
                    <button
                      key={muscle}
                      onClick={() => {
                        setSelectedMuscle(muscle);
                        // Reset search if changing muscles to keep it clean, or search within muscle
                      }}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shrink-0 transition-all active:scale-95 ${
                        selectedMuscle === muscle
                          ? 'bg-emerald-500 text-[#030704] border-emerald-400'
                          : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                      }`}
                      style={{ touchAction: 'manipulation' }}
                    >
                      {muscle}
                    </button>
                  ))}
                </div>

                {/* Text input */}
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    selectedMuscle === 'Todos' 
                      ? 'Escribe para buscar (ej: Bench Press)...' 
                      : `Buscar en ${selectedMuscle}...`
                  }
                  className="w-full bg-[#0b0f0b]/60 border border-white/5 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-all font-semibold"
                />

                {/* Search dropdown overlay */}
                {(searching || searchResults.length > 0) && (
                  <div className="absolute top-24 left-0 right-0 max-h-60 overflow-y-auto bg-[#0b0f0b] border border-white/10 rounded-xl shadow-2xl z-20 flex flex-col divide-y divide-white/5">
                    {searching && (
                      <div className="p-3 text-center text-xs text-slate-400 font-bold">
                        Buscando en el diccionario...
                      </div>
                    )}
                    {!searching && searchResults.map((ex) => (
                      <div
                        key={ex.id}
                        className="p-3 hover:bg-emerald-950/10 cursor-pointer flex items-center justify-between gap-3 transition-colors"
                        onClick={() => {
                          setSelectedDictExercise(ex);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {ex.image_url ? (
                            <img 
                              src={ex.image_url} 
                              alt={ex.name} 
                              onClick={(e) => {
                                e.stopPropagation();
                                openExerciseFocus(ex.id);
                              }}
                              className="w-8 h-8 rounded-md object-cover bg-slate-950 border border-white/5 hover:border-emerald-500/50 active:scale-90 transition-all" 
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-emerald-950/10 flex items-center justify-center text-[10px] font-black text-emerald-400 border border-white/5">
                              rp
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-white truncate">{ex.name}</span>
                            <span className="text-[9px] text-slate-400 uppercase font-bold">
                              {translateMuscleToSpanish(ex.primary_muscles)} • {ex.category}
                            </span>
                          </div>
                        </div>

                        {/* View in large focus trigger */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openExerciseFocus(ex.id);
                          }}
                          className="px-2 py-1 bg-white/5 hover:bg-emerald-500/20 text-[9px] font-bold text-emerald-400 rounded-lg shrink-0 border border-emerald-500/10"
                        >
                          Ver 🔍
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 2. ROUTINES LIST VIEW */
        <div className="flex flex-col gap-6 w-full">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-0.5">Mis Plantillas</span>
              <h1 className="text-xl font-black text-white">Mis Rutinas</h1>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="text-xs font-bold py-2 px-3"
            >
              + Nueva Rutina
            </Button>
          </div>

          {/* Empty state or list */}
          {routines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-white/[0.01] border border-white/[0.02] rounded-3xl p-6">
              <span className="text-4xl">💪</span>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-white">No tenés rutinas creadas</h3>
                <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed">
                  Crea tu primera rutina de entrenamiento para empezar a trackear tu sobrecarga.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="mt-2 text-xs font-bold"
              >
                Crear primera rutina
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {routines.map((routine) => (
                <div
                  key={routine.id}
                  className="p-4 bg-[#0b0f0b]/60 border border-white/5 rounded-2xl flex items-center justify-between gap-4 hover:border-emerald-500/20 transition-all cursor-pointer"
                  onClick={() => setEditingRoutineId(routine.id)}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-black text-white truncate group-hover:text-emerald-400 transition-colors">
                      {routine.name}
                    </span>
                    <span className="text-xs text-slate-400 mt-0.5">
                      {routine.exercises.length === 0 
                        ? 'Sin ejercicios' 
                        : `${routine.exercises.length} ejercicio${routine.exercises.length > 1 ? 's' : ''}`
                      }
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingRoutineId(routine.id);
                      }}
                      className="text-[10px] py-1.5 px-3"
                    >
                      Editar
                    </Button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoutine(routine.id, routine.name);
                      }}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 active:scale-95 transition-all"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE ROUTINE DIALOG MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-xl animate-fade-in">
          <div className="absolute inset-0" onClick={() => { setShowCreateModal(false); setNewRoutineName(''); }}></div>
          <div className="relative bg-[#070b08]/95 border border-emerald-500/10 rounded-[32px] p-6 max-w-sm w-full shadow-2xl shadow-emerald-950/20 flex flex-col gap-4 animate-scale-in">
            <div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest pl-0.5">Nueva Plantilla</span>
              <h3 className="text-sm font-black text-white mt-0.5">Crear Nueva Rutina</h3>
              <p className="text-xs text-slate-400 mt-1">Escribe el nombre de tu rutina de entrenamiento.</p>
            </div>

            <form onSubmit={handleCreateRoutine} className="flex flex-col gap-4">
              <input
                type="text"
                value={newRoutineName}
                onChange={(e) => setNewRoutineName(e.target.value)}
                placeholder="Ej. Pecho y Tríceps, Piernas, etc."
                className="w-full bg-[#030604] border border-white/5 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-all font-semibold"
                maxLength={30}
                required
                autoFocus
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 text-xs py-2.5 font-bold uppercase tracking-wider text-slate-400 hover:text-white"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewRoutineName('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 text-xs py-2.5 font-bold uppercase tracking-wider"
                  disabled={!newRoutineName.trim()}
                >
                  Crear
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}



    </div>
  );
};
export default RoutinesView;
