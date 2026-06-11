import React, { useState } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import Button from '../../components/Button';

export const PlannerView: React.FC = () => {
  const {
    user,
    routines,
    weeklyPlanner,
    assignRoutineToDay,
    startWorkout,
    isLoading
  } = useWorkout();

  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [tempSelectedRoutines, setTempSelectedRoutines] = useState<string[]>([]);

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  // Highlight today
  const getTodayName = () => {
    const systemDay = new Date().getDay(); // 0 is Sunday, 1 is Monday...
    const adjustedIndex = systemDay === 0 ? 6 : systemDay - 1; // Map Sunday to 6, Monday to 0...
    return daysOfWeek[adjustedIndex];
  };

  const todayName = getTodayName();

  const handleToggleRoutine = (routineId: string) => {
    setTempSelectedRoutines((prev) =>
      prev.includes(routineId)
        ? prev.filter((id) => id !== routineId)
        : [...prev, routineId]
    );
  };

  const handleSaveAssignments = () => {
    if (editingDay) {
      assignRoutineToDay(editingDay, tempSelectedRoutines);
      setEditingDay(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-20">
        <svg className="animate-spin h-10 w-10 text-emerald-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-xs text-slate-400 font-bold mt-4 tracking-wider uppercase">Cargando rutinas...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 px-4 py-6 max-w-lg mx-auto w-full pb-safe animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-[#A0A0A0] font-black uppercase tracking-widest pl-0.5">ATLETA</span>
          <span className="text-sm font-bold text-white uppercase tracking-wider font-display">
            {user?.user_metadata?.first_name 
              ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`
              : user?.email?.split('@')[0]}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {user?.user_metadata?.calorie_goal && (
            <span className="text-[9px] bg-[#A3FF47]/10 border border-[#A3FF47]/20 text-[#A3FF47] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
              🎯 {user.user_metadata.calorie_goal}
            </span>
          )}
        </div>
      </div>

      {/* Hero Overview */}
      <div className="bg-[#1E1E1E] border border-white/5 rounded-xl p-5 flex flex-col gap-2 shadow-lg">
        <h2 className="text-base font-black text-white uppercase tracking-wider font-display">CRONOGRAMA SEMANAL</h2>
        <p className="text-xs text-[#A0A0A0] leading-relaxed font-medium">
          Planificá tus días. Podés asignar <span className="text-[#A3FF47] font-bold">múltiples rutinas</span> al mismo día (ej: Pecho + Bíceps + Cardio) para realizarlas juntas.
        </p>
      </div>

      {/* Week Days List */}
      <div className="flex flex-col gap-3">
        {daysOfWeek.map((day) => {
          const assignedRoutineIds = weeklyPlanner[day] || [];
          const isToday = day === todayName;

          return (
            <div
              key={day}
              className={`p-4.5 rounded-xl border transition-all duration-300 flex flex-col gap-3.5 relative overflow-hidden ${
                isToday
                  ? 'bg-[#1E1E1E] border-[#A3FF47]/40 shadow-lg shadow-[#A3FF47]/5'
                  : 'bg-[#1E1E1E] border-white/5 hover:border-white/10'
              }`}
            >
              {/* Today Badge Indicator */}
              {isToday && (
                <div className="absolute top-0 right-0 bg-[#A3FF47] text-[#121212] text-[9px] font-black uppercase px-3 py-0.5 rounded-bl-lg tracking-widest">
                  Hoy
                </div>
              )}

              {/* Day info and configuration */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <span className={`text-sm font-black tracking-widest uppercase ${isToday ? 'text-[#A3FF47]' : 'text-slate-200'}`}>
                    {day}
                  </span>
                  
                  {/* List of routine badges */}
                  <div className="flex flex-wrap gap-1.5 mt-0.5">
                    {assignedRoutineIds.length > 0 ? (
                      assignedRoutineIds.map((rId) => {
                        const routine = routines.find(r => r.id === rId);
                        if (!routine) return null;
                        return (
                          <span 
                            key={rId}
                            className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-[#A3FF47]/10 border border-[#A3FF47]/20 text-[#A3FF47] px-2 py-0.5 rounded-md shadow-sm"
                          >
                            💪 {routine.name.split(' (')[0]}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-[10px] text-[#A0A0A0] font-black uppercase tracking-widest pl-0.5 mt-0.5">
                        💤 Descanso
                      </span>
                    )}
                  </div>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => {
                    setEditingDay(day);
                    setTempSelectedRoutines(assignedRoutineIds);
                  }}
                  className="bg-[#121212] hover:bg-[#A3FF47]/10 border border-white/5 hover:border-[#A3FF47]/15 text-[9.5px] font-black uppercase tracking-widest text-[#A0A0A0] hover:text-[#A3FF47] rounded-xl px-3.5 py-2 active:scale-95 transition-all duration-300 flex-shrink-0 touch-none"
                  style={{ touchAction: 'manipulation' }}
                >
                  Configurar
                </button>
              </div>

              {/* Action Button if routine is assigned */}
              {assignedRoutineIds.length > 0 && (
                <div className="flex justify-end pt-2 border-t border-white/[0.03]">
                  <Button
                    variant={isToday ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => startWorkout(assignedRoutineIds)}
                    className="flex items-center gap-1.5 py-2 px-3.5 text-[10px] font-black uppercase tracking-wider"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>Iniciar Entrenamiento ({assignedRoutineIds.length})</span>
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MULTI-ROUTINE SELECTOR MODAL / BOTTOM SHEET */}
      {editingDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xl px-4 animate-fade-in">
          <div className="absolute inset-0" onClick={() => setEditingDay(null)}></div>
          <div className="relative bg-[#1E1E1E] border border-white/10 rounded-xl max-w-sm w-full p-6 shadow-2xl z-10 flex flex-col gap-4 animate-scale-in">
            
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
              <div className="flex flex-col">
                <span className="text-[10px] text-[#A3FF47] font-black uppercase tracking-widest">PLANIFICAR</span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Rutinas del {editingDay}</h3>
              </div>
              <button 
                onClick={() => setEditingDay(null)}
                className="text-[#A0A0A0] hover:text-white text-xs font-bold bg-[#121212] hover:bg-white/10 rounded-full w-7 h-7 flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            {routines.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
                {routines.map((routine) => {
                  const isChecked = tempSelectedRoutines.includes(routine.id);
                  return (
                    <div 
                      key={routine.id}
                      onClick={() => handleToggleRoutine(routine.id)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 cursor-pointer select-none ${
                        isChecked 
                          ? 'bg-[#A3FF47]/10 border-[#A3FF47]/30 text-[#A3FF47]' 
                          : 'bg-[#121212] border-white/5 text-[#A0A0A0] hover:border-white/10 hover:bg-[#121212]/80'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 text-left">
                        <span className="text-xs font-black tracking-tight leading-snug">{routine.name}</span>
                        <span className="text-[9px] text-[#A0A0A0] font-bold uppercase tracking-wider">
                          {routine.exercises.length} {routine.exercises.length === 1 ? 'Ejercicio' : 'Ejercicios'}
                        </span>
                      </div>
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-300 ${
                        isChecked 
                          ? 'bg-[#A3FF47] border-transparent text-[#121212] scale-105 shadow-sm shadow-[#A3FF47]/10' 
                          : 'border-white/20 bg-transparent'
                      }`}>
                        {isChecked && (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-[#A0A0A0] leading-relaxed text-center py-8 font-medium">
                No tenés rutinas creadas. Creá una plantilla en la pestaña **"Mis Rutinas"** para asignarla.
              </div>
            )}

            <div className="flex flex-col gap-2 border-t border-white/[0.04] pt-3">
              <Button
                variant="primary"
                size="full"
                onClick={handleSaveAssignments}
                className="py-2.5 text-xs font-black uppercase tracking-wider"
              >
                Guardar Cambios
              </Button>
              <Button
                variant="secondary"
                size="full"
                onClick={() => setEditingDay(null)}
                className="py-2.5 text-xs font-black uppercase tracking-wider text-[#A0A0A0] hover:text-white"
              >
                Cancelar
              </Button>
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
};

export default PlannerView;
