import React, { useState, useEffect } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';

const SPANISH_MUSCLES = [
  'Todos',
  'Abdominales',
  'Pecho',
  'Hombros',
  'Bíceps',
  'Tríceps',
  'Espalda',
  'Cuádriceps',
  'Femorales',
  'Glúteos',
  'Gemelos',
  'Antebrazos',
  'Trapecio',
  'Aductores',
  'Abductores',
  'Cuello'
];

const CATEGORY_OPTIONS = [
  'Todos',
  'Mancuerna',
  'Barra',
  'Polea',
  'Máquina',
  'Peso Corporal',
  'Banda',
  'Fitball',
  'Balón Medicinal',
  'Kettlebell',
  'Barra W',
  'Otros'
];



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
  const [exerciseDict, setExerciseDict] = useState<any[]>([]);
  const [loadingDict, setLoadingDict] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState('Todos');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  
  // Selected exercise to add configs
  const [selectedDictExercise, setSelectedDictExercise] = useState<any | null>(null);
  const [targetSets, setTargetSets] = useState<number>(3);
  const [targetReps, setTargetReps] = useState<string>('8-12');

  const activeRoutine = routines.find(r => r.id === editingRoutineId);

  // Fetch the entire exercise dictionary once when the routine editor is open
  useEffect(() => {
    const fetchDictionary = async () => {
      setLoadingDict(true);
      try {
        const { data, error } = await supabase
          .from('exercise_dictionary')
          .select('id, name, category, primary_muscles, image_url, difficulty');
        
        if (!error && data) {
          setExerciseDict(data);
        }
      } catch (err) {
        console.error('Error fetching exercise dictionary:', err);
      } finally {
        setLoadingDict(false);
      }
    };

    if (editingRoutineId) {
      fetchDictionary();
    }
  }, [editingRoutineId]);

  // Filter exercises in memory
  const filteredExercises = exerciseDict.filter((ex) => {
    // 1. Muscle Filter
    if (selectedMuscle !== 'Todos') {
      if (selectedMuscle === 'Espalda') {
        const isEspalda = ['Espalda Media', 'Espalda Baja', 'Dorsales'].includes(ex.primary_muscles);
        if (!isEspalda) return false;
      } else {
        if (ex.primary_muscles !== selectedMuscle) return false;
      }
    }

    // 2. Category/Equipment Filter
    if (selectedCategory !== 'Todos') {
      if (selectedCategory === 'Otros') {
        const specificCategories = [
          'Mancuerna',
          'Barra',
          'Polea',
          'Máquina',
          'Peso Corporal',
          'Banda',
          'Fitball',
          'Balón Medicinal',
          'Kettlebell',
          'Barra W'
        ];
        if (specificCategories.includes(ex.category)) return false;
      } else {
        if (ex.category !== selectedCategory) return false;
      }
    }

    // 3. Text Search Query (intelligent accent-insensitive & bilingual search)
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.trim().toLowerCase();
      
      const normalizeText = (text: string) => {
        return text 
          ? text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() 
          : '';
      };
      
      const normQuery = normalizeText(query);
      const normName = normalizeText(ex.name);
      
      // Also match original English ID name (replacing underscores with spaces)
      const normId = normalizeText(ex.id ? ex.id.replace(/_/g, ' ') : '');
      
      const matchesName = normName.includes(normQuery);
      const matchesId = normId.includes(normQuery);
      
      // Only match muscle and category if they are not already actively filtered to 'Todos'
      const matchesMuscle = (selectedMuscle === 'Todos') && normalizeText(ex.primary_muscles).includes(normQuery);
      const matchesCat = (selectedCategory === 'Todos') && normalizeText(ex.category).includes(normQuery);
      
      if (!matchesName && !matchesId && !matchesMuscle && !matchesCat) {
        return false;
      }
    }

    return true;
  });

  const visibleExercises = filteredExercises.slice(0, 40);

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
              className="flex items-center gap-1 text-[#A0A0A0] hover:text-[#A3FF47] font-black uppercase text-[10px] tracking-widest transition-colors"
            >
              ← Volver
            </button>
            <h1 className="text-sm font-black text-white uppercase tracking-wider truncate max-w-[180px]">
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
            <h2 className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-widest pl-1">
              EJERCICIOS AGREGADOS ({activeRoutine.exercises.length})
            </h2>

            {activeRoutine.exercises.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-white/5 rounded-xl bg-[#1E1E1E]">
                <p className="text-xs text-[#A0A0A0] font-medium">Esta rutina no tiene ejercicios. Buscalos y agregalos abajo.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {activeRoutine.exercises.map((exercise, idx) => (
                  <div 
                    key={exercise.id}
                    className="p-3 bg-[#1E1E1E] border border-white/5 rounded-xl flex items-center justify-between gap-3 shadow-md"
                  >
                    {/* Exercise info with mini thumb */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {exercise.image_url ? (
                        <img 
                          src={exercise.image_url} 
                          alt={exercise.name} 
                          onClick={() => openExerciseFocus(exercise.exercise_id)}
                          className="w-10 h-10 rounded-lg object-cover border border-white/5 bg-slate-950 cursor-pointer hover:border-[#A3FF47] hover:scale-105 active:scale-95 transition-all"
                        />
                      ) : (
                        <div 
                          onClick={() => openExerciseFocus(exercise.exercise_id)}
                          className="w-10 h-10 rounded-lg bg-[#A3FF47]/10 border border-white/5 flex items-center justify-center text-xs font-black text-[#A3FF47] cursor-pointer"
                        >
                          rp
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span 
                          onClick={() => openExerciseFocus(exercise.exercise_id)}
                          className="text-xs font-bold text-white truncate leading-tight cursor-pointer hover:text-[#A3FF47]"
                        >
                          {exercise.name}
                        </span>
                        <span className="text-[10px] text-[#A0A0A0] font-medium">
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
            <h2 className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-widest pl-1">
              BUSCAR EJERCICIO EN DICCIONARIO
            </h2>

            {/* Config Box if exercise is selected */}
            {selectedDictExercise ? (
              <div className="p-4 bg-[#1E1E1E] border border-[#A3FF47]/30 rounded-xl flex flex-col gap-4 animate-fade-in shadow-xl">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-[#A3FF47] font-black uppercase tracking-wider">CONFIGURAR EJERCICIO</span>
                    <span className="text-sm font-black text-white truncate mt-0.5">{selectedDictExercise.name}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedDictExercise(null)}
                    className="text-xs text-[#A0A0A0] hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-[#A0A0A0] uppercase tracking-wider pl-0.5">Series objetivo</label>
                    <input 
                      type="number"
                      value={targetSets}
                      onChange={(e) => setTargetSets(parseInt(e.target.value) || 1)}
                      className="bg-[#121212] border border-white/5 focus:border-[#A3FF47] rounded-xl px-3 py-2 text-xs text-white text-center font-bold focus:outline-none font-mono"
                      min={1}
                      max={10}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-[#A0A0A0] uppercase tracking-wider pl-0.5">Repeticiones</label>
                    <input 
                      type="text"
                      value={targetReps}
                      onChange={(e) => setTargetReps(e.target.value)}
                      placeholder="ej: 8-12 o 10"
                      className="bg-[#121212] border border-white/5 focus:border-[#A3FF47] rounded-xl px-3 py-2 text-xs text-white text-center font-bold focus:outline-none"
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
              <div className="flex flex-col gap-3 relative w-full max-w-full overflow-hidden">
                
                {/* Horizontal scrolling Spanish muscle filters */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-[#A0A0A0] uppercase tracking-widest pl-1">Filtrar por Músculo</span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin select-none touch-pan-x">
                    {SPANISH_MUSCLES.map((muscle) => (
                      <button
                        key={muscle}
                        type="button"
                        onClick={() => setSelectedMuscle(muscle)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shrink-0 transition-all active:scale-95 ${
                          selectedMuscle === muscle
                            ? 'bg-[#A3FF47] text-[#121212] border-transparent font-black'
                            : 'bg-[#121212] text-[#A0A0A0] border-white/5 hover:text-white'
                        }`}
                        style={{ touchAction: 'manipulation' }}
                      >
                        {muscle}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Horizontal scrolling Equipment/Category filters */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-[#A0A0A0] uppercase tracking-widest pl-1">Filtrar por Equipamiento</span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin select-none touch-pan-x">
                    {CATEGORY_OPTIONS.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shrink-0 transition-all active:scale-95 ${
                          selectedCategory === cat
                            ? 'bg-[#A3FF47] text-[#121212] border-transparent font-black'
                            : 'bg-[#121212] text-[#A0A0A0] border-white/5 hover:text-white'
                        }`}
                        style={{ touchAction: 'manipulation' }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text input */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-[#A0A0A0] uppercase tracking-widest pl-1">Búsqueda Inteligente</span>
                  <div className="relative">
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Escribe el nombre del ejercicio (Español o Inglés)..."
                      className="w-full bg-[#121212] border border-white/5 focus:border-[#A3FF47] rounded-xl pl-4 pr-10 py-3 text-xs text-white placeholder-neutral-700 focus:outline-none transition-all font-semibold"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-white text-xs font-bold p-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Search Results (Not absolute overlay so it does not block navigation) */}
                <div className="mt-2 bg-[#121212] border border-white/5 rounded-xl p-2 max-h-72 overflow-y-auto flex flex-col gap-1.5 divide-y divide-white/5 scrollbar-thin">
                  {loadingDict ? (
                    <div className="p-4 text-center text-xs text-[#A0A0A0] font-bold flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-[#A3FF47]" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Cargando ejercicios...
                    </div>
                  ) : visibleExercises.length > 0 ? (
                    <>
                      {visibleExercises.map((ex) => (
                        <div
                          key={ex.id}
                          className="pt-2 pb-2 px-2 hover:bg-[#A3FF47]/5 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-colors"
                          onClick={() => {
                            setSelectedDictExercise(ex);
                            setSearchQuery('');
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
                                className="w-9 h-9 rounded-lg object-cover bg-slate-950 border border-white/5 hover:border-[#A3FF47] hover:scale-90 transition-all shrink-0" 
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-[#A3FF47]/10 flex items-center justify-center text-[10px] font-black text-[#A3FF47] border border-white/5 shrink-0">
                                rp
                              </div>
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-white truncate">{ex.name}</span>
                              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                <span className="text-[8px] bg-[#A3FF47]/10 text-[#A3FF47] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                  {ex.primary_muscles}
                                </span>
                                <span className="text-[8px] bg-white/5 text-[#A0A0A0] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                  {ex.category}
                                </span>
                                <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                                  ex.difficulty === 'Principiante' ? 'bg-blue-950/30 text-blue-400' :
                                  ex.difficulty === 'Intermedio' ? 'bg-amber-950/30 text-amber-400' :
                                  'bg-rose-950/30 text-rose-400'
                                }`}>
                                  {ex.difficulty}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* View in large focus trigger */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openExerciseFocus(ex.id);
                            }}
                            className="px-2 py-1.5 bg-[#1E1E1E] hover:bg-[#A3FF47]/20 text-[9px] font-extrabold text-[#A3FF47] rounded-lg shrink-0 border border-white/5 transition-colors"
                          >
                            Detalle 🔍
                          </button>
                        </div>
                      ))}
                      {filteredExercises.length > 40 && (
                        <div className="pt-2 text-center">
                          <p className="text-[9px] text-[#A0A0A0] font-semibold">
                            Mostrando primeros 40 de {filteredExercises.length} ejercicios. Filtra para acotar.
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-6 text-center text-xs text-[#A0A0A0] font-medium">
                      No se encontraron ejercicios. Intenta con otros filtros.
                    </div>
                  )}
                </div>
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
              <span className="text-[10px] text-[#A0A0A0] font-black uppercase tracking-widest pl-0.5">MIS PLANTILLAS</span>
              <h1 className="text-xl font-black text-white uppercase tracking-wider font-display">Mis Rutinas</h1>
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
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-[#1E1E1E] border border-white/5 rounded-xl p-6">
              <span className="text-4xl">💪</span>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">No tenés rutinas creadas</h3>
                <p className="text-xs text-[#A0A0A0] max-w-[240px] leading-relaxed">
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
                  className="p-4 bg-[#1E1E1E] border border-white/5 rounded-xl flex items-center justify-between gap-4 hover:border-[#A3FF47]/20 transition-all cursor-pointer shadow-md"
                  onClick={() => setEditingRoutineId(routine.id)}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-black text-white truncate group-hover:text-[#A3FF47] transition-colors">
                      {routine.name}
                    </span>
                    <span className="text-xs text-[#A0A0A0] mt-0.5">
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
          <div className="relative bg-[#1E1E1E] border border-white/10 rounded-xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-scale-in">
            <div>
              <span className="text-[10px] text-[#A3FF47] font-black uppercase tracking-widest pl-0.5">NUEVA PLANTILLA</span>
              <h3 className="text-sm font-black text-white uppercase tracking-wider mt-0.5">Crear Nueva Rutina</h3>
              <p className="text-xs text-[#A0A0A0] mt-1">Escribe el nombre de tu rutina de entrenamiento.</p>
            </div>

            <form onSubmit={handleCreateRoutine} className="flex flex-col gap-4">
              <input
                type="text"
                value={newRoutineName}
                onChange={(e) => setNewRoutineName(e.target.value)}
                placeholder="Ej. Pecho y Tríceps, Piernas, etc."
                className="w-full bg-[#121212] border border-white/5 focus:border-[#A3FF47] rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-700 focus:outline-none transition-all font-semibold"
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
