import { WorkoutProvider, useWorkout } from './context/WorkoutContext';
import LoginView from './views/Auth/LoginView';
import PlannerView from './views/Planner/PlannerView';
import WorkoutView from './views/Workout/WorkoutView';
import RoutinesView from './views/Routines/RoutinesView';
import ProfileView from './views/Profile/ProfileView';
import RestTimer from './components/RestTimer';
import SetBottomSheet from './views/Tracking/SetBottomSheet';
import ExerciseFocusModal from './components/ExerciseFocusModal';

function AppContent() {
  const { activeView, setActiveView, activeSession, streakDays, user } = useWorkout();

  return (
    <div className="relative h-dvh max-h-dvh bg-[#121212] text-slate-100 flex flex-col font-sans selection:bg-[#A3FF47]/30 selection:text-white overflow-hidden">
      
      {/* Background Decorator Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[30%] rounded-full bg-[#A3FF47]/5 blur-[100px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[30%] rounded-full bg-[#A3FF47]/2 blur-[100px] animate-pulse-slow" style={{ animationDelay: '-4s' }}></div>
      </div>

      {/* Sticky iOS Header with Safe Area Space */}
      {activeView !== 'auth' && (
        <header className="sticky top-0 z-30 w-full border-b border-white/5 backdrop-blur-md bg-[#121212]/50 pt-safe px-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 mt-2">
            <div className="relative w-8 h-8 rounded-lg bg-[#A3FF47] p-[1px] flex items-center justify-center shadow-lg shadow-[#A3FF47]/10">
              <span className="font-mono font-black text-xs text-[#121212]">RP</span>
            </div>
            <span className="font-display font-black text-sm tracking-widest text-white uppercase">
              REPES
            </span>
          </div>
          
          {/* Streak Flame Counter */}
          {user && (
            <div className="mt-2">
              <div 
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all duration-300 ${
                  streakDays > 0 
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 font-extrabold' 
                    : 'bg-white/5 border-white/5 text-slate-500 font-medium'
                }`}
              >
                <span className={`text-xs ${streakDays > 0 ? 'animate-bounce' : 'grayscale filter'}`} style={{ animationDuration: '2.5s' }}>🔥</span>
                <span className="text-xs font-black font-mono">{streakDays}</span>
              </div>
            </div>
          )}
        </header>
      )}

      {/* Main View Router */}
      <main className={`flex-1 overflow-y-auto min-h-0 relative z-10 w-full overflow-x-hidden animate-slide-up-fade ${
        activeView === 'auth' ? 'flex flex-col justify-center' : 'pb-28'
      }`}>
        {activeView === 'auth' && <LoginView />}
        {activeView === 'planner' && <PlannerView />}
        {activeView === 'routines' && <RoutinesView />}
        {activeView === 'workout' && <WorkoutView />}
        {activeView === 'profile' && <ProfileView />}
      </main>

      {/* Frosted iOS Bottom Tab Bar (Suspended Glass Design) */}
      {activeView !== 'auth' && (
        <nav className="fixed bottom-[calc(env(safe-area-inset-bottom)+12px)] left-4 right-4 z-40 bg-[#1E1E1E]/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl px-2 py-2 flex items-center justify-around select-none">
          {/* Tab 1: Planner */}
          <button
            onClick={() => setActiveView('planner')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-300 active:scale-95 ${
              activeView === 'planner' 
                ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/15' 
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            <span className="text-base leading-none">📅</span>
            <span className="text-[9px] uppercase tracking-wider font-black">Calendario</span>
          </button>

          {/* Tab 2: Custom Routines Manager */}
          <button
            onClick={() => setActiveView('routines')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-300 active:scale-95 ${
              activeView === 'routines' 
                ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/15' 
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            <span className="text-base leading-none">💪</span>
            <span className="text-[9px] uppercase tracking-wider font-black">Rutinas</span>
          </button>

          {/* Tab 3: Active Workout (Enabled only if active session exists) */}
          <button
            onClick={() => {
              if (activeSession) {
                setActiveView('workout');
              } else {
                alert('No hay un entrenamiento activo. Iniciá uno desde el Calendario.');
              }
            }}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-300 active:scale-95 relative ${
              activeSession 
                ? activeView === 'workout' 
                  ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/15' 
                  : 'text-slate-200 font-semibold border border-transparent'
                : 'text-slate-600 opacity-40 cursor-not-allowed border border-transparent'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            {activeSession && (
              <span className="absolute top-1 right-2.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
            <span className="text-base leading-none">⚡</span>
            <span className="text-[9px] uppercase tracking-wider font-black">Gimnasio</span>
          </button>

          {/* Tab 4: Profile */}
          <button
            onClick={() => setActiveView('profile')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-300 active:scale-95 ${
              activeView === 'profile' 
                ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/15' 
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            <span className="text-base leading-none">👤</span>
            <span className="text-[9px] uppercase tracking-wider font-black">Perfil</span>
          </button>
        </nav>
      )}

      {/* Global Overlays */}
      <RestTimer />
      <SetBottomSheet />
      <ExerciseFocusModal />
    </div>
  );
}

export default function App() {
  return (
    <WorkoutProvider>
      <AppContent />
    </WorkoutProvider>
  );
}
