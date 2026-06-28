import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

// Interfaces
export interface WorkoutSet {
  id: string;
  number: number;
  prevWeight: number; // weight in kg from previous session
  prevReps: number;   // reps from previous session
  weight: number | null; // user's input weight for current session
  reps: number | null;   // user's input reps for current session
  isCompleted: boolean;
}

export interface Exercise {
  id: string; // PK in 'exercises' table (UUID)
  exercise_id: string; // FK to 'exercise_dictionary' (text)
  name: string; // from exercise_dictionary
  image_url?: string; // from exercise_dictionary
  primary_muscles?: string; // from exercise_dictionary
  sets: WorkoutSet[];
  notes?: string;
  target_sets: number;
  target_reps: string;
}

export interface Routine {
  id: string;
  name: string;
  exercises: Exercise[];
}

export interface WorkoutSession {
  routineId: string;
  routineName: string;
  exercises: Exercise[];
  startTime: string; // ISO String
  endTime?: string;
  isFinished: boolean;
}

type ActiveView = 'auth' | 'planner' | 'workout' | 'routines' | 'profile' | 'nutrition';

interface WorkoutContextType {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  user: User | null;
  logout: () => void;
  routines: Routine[];
  weeklyPlanner: Record<string, string[]>; // day -> array of routineIds
  assignRoutineToDay: (day: string, routineIds: string[]) => Promise<void>;
  isLoading: boolean;
  refetchData: () => Promise<void>;
  streakDays: number;
  
  // Active Workout Session
  activeSession: WorkoutSession | null;
  startWorkout: (routineIds: string | string[]) => Promise<void>;
  finishWorkout: () => void;
  cancelWorkout: () => void;
  updateSet: (exerciseId: string, setIndex: number, weight: number, reps: number, isCompleted: boolean) => Promise<void>;
  toggleSetCompleted: (exerciseId: string, setIndex: number) => Promise<void>;
  
  // Bottom Sheet Selection State
  activeExerciseId: string | null;
  activeSetIndex: number | null;
  openBottomSheet: (exerciseId: string, setIndex: number) => void;
  closeBottomSheet: () => void;
  
  // Rest Timer State
  restTimeRemaining: number;
  isTimerActive: boolean;
  totalRestTime: number;
  setTotalRestTime: (seconds: number) => void;
  startRestTimer: (seconds?: number) => void;
  stopRestTimer: () => void;
  addRestTime: (seconds: number) => void;

  // Custom Routine Actions
  createRoutine: (name: string) => Promise<Routine | null>;
  deleteRoutine: (routineId: string) => Promise<void>;
  addExerciseToRoutine: (routineId: string, exerciseDictId: string, targetSets: number, targetReps: string) => Promise<void>;
  removeExerciseFromRoutine: (exerciseId: string) => Promise<void>;
  reorderExercise: (routineId: string, exerciseId: string, direction: 'up' | 'down') => Promise<void>;

  // Global Exercise Focus Viewer Modal
  focusedExercise: any | null;
  openExerciseFocus: (exerciseDictId: string) => Promise<void>;
  closeExerciseFocus: () => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ActiveView>('auth');
  const [user, setUser] = useState<User | null>(null);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [streakDays, setStreakDays] = useState<number>(0);
  
  // Weekly routine planner (Monday to Sunday)
  const [weeklyPlanner, setWeeklyPlanner] = useState<Record<string, string[]>>({
    'Lunes': [],
    'Martes': [],
    'Miércoles': [],
    'Jueves': [],
    'Viernes': [],
    'Sábado': [],
    'Domingo': [],
  });

  // Active workout
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);

  // Bottom Sheet UI Selection
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [activeSetIndex, setActiveSetIndex] = useState<number | null>(null);

  // Rest Timer
  const [restTimeRemaining, setRestTimeRemaining] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [totalRestTime, setTotalRestTime] = useState<number>(90); // default 90s

  // Global Focus Exercise Viewer Modal
  const [focusedExercise, setFocusedExercise] = useState<any | null>(null);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load user session from Supabase on init
  useEffect(() => {
    setIsLoading(true);
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchRoutinesAndPlanner(session.user.id);
        setActiveView('planner');
      } else {
        setUser(null);
        setActiveView('auth');
        setIsLoading(false);
      }
    });

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchRoutinesAndPlanner(session.user.id);
        setActiveView('planner');
      } else {
        setUser(null);
        setRoutines([]);
        setStreakDays(0);
        setWeeklyPlanner({
          'Lunes': [],
          'Martes': [],
          'Miércoles': [],
          'Jueves': [],
          'Viernes': [],
          'Sábado': [],
          'Domingo': [],
        });
        setActiveView('auth');
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch all routines, exercises and planner days for the current user
  const fetchRoutinesAndPlanner = async (userId: string) => {
    try {
      setIsLoading(true);

      // Fetch routines and nested exercises joined with their dictionary entries
      const { data: routinesData, error: routinesError } = await supabase
        .from('routines')
        .select(`
          id,
          name,
          exercises (
            id,
            target_sets,
            target_reps,
            order_index,
            exercise_id,
            exercise_dictionary (
              name,
              category,
              primary_muscles,
              image_url
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (routinesError) throw routinesError;

      const mappedRoutines: Routine[] = (routinesData || []).map((r: any) => {
        const sortedExercises = (r.exercises || []).sort((a: any, b: any) => a.order_index - b.order_index);
        
        return {
          id: r.id,
          name: r.name,
          exercises: sortedExercises.map((e: any) => ({
            id: e.id,
            exercise_id: e.exercise_id,
            name: e.exercise_dictionary?.name || 'Ejercicio Desconocido',
            image_url: e.exercise_dictionary?.image_url,
            primary_muscles: e.exercise_dictionary?.primary_muscles,
            target_sets: e.target_sets || 3,
            target_reps: e.target_reps || '8-12',
            sets: []
          }))
        };
      });

      setRoutines(mappedRoutines);

      // Fetch weekly planner days
      const { data: daysData, error: daysError } = await supabase
        .from('routine_days')
        .select('routine_id, day_of_week');

      if (daysError) throw daysError;

      const daysOfWeekList = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      const defaultPlanner: Record<string, string[]> = {
        'Lunes': [],
        'Martes': [],
        'Miércoles': [],
        'Jueves': [],
        'Viernes': [],
        'Sábado': [],
        'Domingo': [],
      };

      const userRoutineIds = mappedRoutines.map(r => r.id);

      (daysData || []).forEach((item: any) => {
        if (userRoutineIds.includes(item.routine_id)) {
          const idx = item.day_of_week - 1;
          if (idx >= 0 && idx < 7) {
            const dayName = daysOfWeekList[idx];
            if (!defaultPlanner[dayName].includes(item.routine_id)) {
              defaultPlanner[dayName].push(item.routine_id);
            }
          }
        }
      });

      setWeeklyPlanner(defaultPlanner);

      // Fetch dynamic streak
      await refetchStreak(userId);

    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refetchData = async () => {
    if (user) {
      await fetchRoutinesAndPlanner(user.id);
    }
  };

  // Streak calculation dynamic algorithm
  const refetchStreak = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('weight_logs')
        .select('logged_at')
        .eq('user_id', userId)
        .order('logged_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const datesList = data.map((log) => log.logged_at);
        const calculated = calculateStreak(datesList);
        setStreakDays(calculated);
      } else {
        setStreakDays(0);
      }
    } catch (err) {
      console.error('Error calculating streak:', err);
    }
  };

  const calculateStreak = (dates: string[]): number => {
    if (!dates || dates.length === 0) return 0;
    
    // Deduplicate dates and parse with local midnight to avoid offset issues
    const uniqueDates = Array.from(new Set(dates)).map(d => new Date(d + 'T00:00:00'));
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0,0,0,0);
    
    // Sort unique dates descending
    uniqueDates.sort((a, b) => b.getTime() - a.getTime());
    
    const latestWorkout = uniqueDates[0];
    latestWorkout.setHours(0,0,0,0);
    
    // If the latest workout is not today and not yesterday, streak is broken
    if (latestWorkout.getTime() !== today.getTime() && latestWorkout.getTime() !== yesterday.getTime()) {
      return 0;
    }
    
    let streak = 1;
    let currentDate = latestWorkout;
    
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = uniqueDates[i];
      prevDate.setHours(0,0,0,0);
      
      const diffTime = currentDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
        currentDate = prevDate;
      } else if (diffDays > 1) {
        break; // gap found
      }
    }
    
    return streak;
  };

  // Timer interval handling
  useEffect(() => {
    if (isTimerActive && restTimeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setRestTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerActive(false);
            if (timerRef.current) clearInterval(timerRef.current);
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerActive, restTimeRemaining]);

  const logout = async () => {
    await supabase.auth.signOut();
    setActiveSession(null);
    stopRestTimer();
  };

  const assignRoutineToDay = async (day: string, routineIds: string[]) => {
    if (!user) return;
    const daysOfWeekList = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const dayIndex = daysOfWeekList.indexOf(day) + 1; // 1-indexed

    // Delete existing assignments for this day that belong to the user's routines (protecting other users)
    const userRoutineIds = routines.map(r => r.id);
    if (userRoutineIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('routine_days')
        .delete()
        .eq('day_of_week', dayIndex)
        .in('routine_id', userRoutineIds);

      if (deleteError) {
        console.error('Error removing routine day assignment:', deleteError);
        return;
      }
    }

    if (routineIds.length > 0) {
      const { error: insertError } = await supabase
        .from('routine_days')
        .insert(
          routineIds.map(rId => ({
            routine_id: rId,
            day_of_week: dayIndex
          }))
        );

      if (insertError) {
        console.error('Error inserting routine day assignment:', insertError);
        return;
      }
    }

    // Update local state
    setWeeklyPlanner((prev) => ({
      ...prev,
      [day]: routineIds
    }));
  };

  // Rule 1: Fetch historical logs for progressive overload mapping
  const fetchPreviousLogs = async (exerciseId: string) => {
    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('exercise_id', exerciseId)
      .order('logged_at', { ascending: false });

    if (error || !data || data.length === 0) return {};

    const mostRecentDate = data[0].logged_at;
    const recentLogs = data.filter((log) => log.logged_at === mostRecentDate);

    const logsMap: Record<number, { weight: number; reps: number }> = {};
    recentLogs.forEach((log) => {
      logsMap[log.set_number] = {
        weight: Number(log.weight_kg),
        reps: log.reps_done || 0
      };
    });

    return logsMap;
  };

  const startWorkout = async (routineIds: string | string[]) => {
    const ids = Array.isArray(routineIds) ? routineIds : [routineIds];
    const selectedRoutines = routines.filter((r) => ids.includes(r.id));
    if (selectedRoutines.length === 0) return;

    setIsLoading(true);
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      // Merge all exercises from all selected routines
      const allExercises = selectedRoutines.flatMap(r => r.exercises);

      const clonedExercises = await Promise.all(
        allExercises.map(async (exercise) => {
          // Fetch previous logs (Rule 1)
          const prevLogs = await fetchPreviousLogs(exercise.id);

          // Fetch logs already entered today (resume support)
          const { data: todayLogsData } = await supabase
            .from('weight_logs')
            .select('*')
            .eq('exercise_id', exercise.id)
            .eq('logged_at', todayStr);

          const todayLogsMap: Record<number, { weight: number; reps: number }> = {};
          if (todayLogsData) {
            todayLogsData.forEach((log) => {
              todayLogsMap[log.set_number] = {
                weight: Number(log.weight_kg),
                reps: log.reps_done || 0
              };
            });
          }

          // Build sets
          const setsCount = exercise.target_sets || 3;
          const sets = Array.from({ length: setsCount }, (_, i) => {
            const setNumber = i + 1;
            const prevLog = prevLogs[setNumber] || { weight: 0, reps: 0 };
            const todayLog = todayLogsMap[setNumber];

            return {
              id: `${exercise.id}-set-${setNumber}`,
              number: setNumber,
              prevWeight: prevLog.weight,
              prevReps: prevLog.reps,
              weight: todayLog ? todayLog.weight : null,
              reps: todayLog ? todayLog.reps : null,
              isCompleted: todayLog ? true : false
            };
          });

          return {
            ...exercise,
            sets
          };
        })
      );

      setActiveSession({
        routineId: ids.join(','),
        routineName: selectedRoutines.map(r => r.name).join(' + '),
        exercises: clonedExercises,
        startTime: new Date().toISOString(),
        isFinished: false
      });
      setActiveView('workout');
    } catch (err) {
      console.error('Error starting workout session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const finishWorkout = async () => {
    if (!activeSession || !user) return;
    setActiveSession(null);
    setActiveView('planner');
    stopRestTimer();
    await refetchStreak(user.id);
  };

  const cancelWorkout = () => {
    if (window.confirm('¿Seguro que querés cancelar el entrenamiento actual? Los datos ingresados se perderán.')) {
      setActiveSession(null);
      setActiveView('planner');
      stopRestTimer();
    }
  };

  // Rule 2: Insert individual rows dynamically on set confirmation
  const updateSet = async (
    exerciseId: string,
    setIndex: number,
    weight: number,
    reps: number,
    isCompleted: boolean
  ) => {
    if (!activeSession || !user) return;

    // 1. Update local state
    const updatedExercises = activeSession.exercises.map((exercise) => {
      if (exercise.id === exerciseId) {
        const updatedSets = exercise.sets.map((set, idx) => {
          if (idx === setIndex) {
            return {
              ...set,
              weight,
              reps,
              isCompleted
            };
          }
          return set;
        });
        return { ...exercise, sets: updatedSets };
      }
      return exercise;
    });

    setActiveSession({
      ...activeSession,
      exercises: updatedExercises
    });

    // 2. Update Supabase
    const setNumber = setIndex + 1;
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      // Prevent duplicates: Delete existing log for today
      await supabase
        .from('weight_logs')
        .delete()
        .eq('exercise_id', exerciseId)
        .eq('set_number', setNumber)
        .eq('logged_at', todayStr);

      if (isCompleted) {
        // Insert new log row
        const { error } = await supabase
          .from('weight_logs')
          .insert({
            user_id: user.id,
            exercise_id: exerciseId,
            set_number: setNumber,
            weight_kg: weight,
            reps_done: reps,
            logged_at: todayStr
          });

        if (error) throw error;
      }
      
      // Update streak dynamically
      await refetchStreak(user.id);
    } catch (err) {
      console.error('Error saving set log to database:', err);
    }

    if (isCompleted) {
      startRestTimer(totalRestTime);
    }
  };

  const toggleSetCompleted = async (exerciseId: string, setIndex: number) => {
    if (!activeSession || !user) return;

    let triggerTimer = false;
    let targetSet: any = null;

    // 1. Update local state
    const updatedExercises = activeSession.exercises.map((exercise) => {
      if (exercise.id === exerciseId) {
        const updatedSets = exercise.sets.map((set, idx) => {
          if (idx === setIndex) {
            const nextCompletedState = !set.isCompleted;
            targetSet = {
              ...set,
              weight: set.weight !== null ? set.weight : set.prevWeight,
              reps: set.reps !== null ? set.reps : set.prevReps,
              isCompleted: nextCompletedState
            };
            if (nextCompletedState) {
              triggerTimer = true;
            }
            return targetSet;
          }
          return set;
        });
        return { ...exercise, sets: updatedSets };
      }
      return exercise;
    });

    setActiveSession({
      ...activeSession,
      exercises: updatedExercises
    });

    // 2. Update Supabase
    if (targetSet) {
      const setNumber = setIndex + 1;
      const todayStr = new Date().toISOString().split('T')[0];

      try {
        await supabase
          .from('weight_logs')
          .delete()
          .eq('exercise_id', exerciseId)
          .eq('set_number', setNumber)
          .eq('logged_at', todayStr);

        if (targetSet.isCompleted) {
          const { error } = await supabase
            .from('weight_logs')
            .insert({
              user_id: user.id,
              exercise_id: exerciseId,
              set_number: setNumber,
              weight_kg: targetSet.weight || 0,
              reps_done: targetSet.reps || 0,
              logged_at: todayStr
            });

          if (error) throw error;
        }
        
        await refetchStreak(user.id);
      } catch (err) {
        console.error('Error toggling set log in database:', err);
      }
    }

    if (triggerTimer) {
      startRestTimer(totalRestTime);
    }
  };

  // Custom Routine Management Operations
  const createRoutine = async (name: string): Promise<Routine | null> => {
    if (!user) return null;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('routines')
        .insert({ user_id: user.id, name })
        .select()
        .single();

      if (error) throw error;

      await fetchRoutinesAndPlanner(user.id);
      return {
        id: data.id,
        name: data.name,
        exercises: []
      };
    } catch (err) {
      console.error('Error creating custom routine:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRoutine = async (routineId: string) => {
    if (!user) return;
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('routines')
        .delete()
        .eq('id', routineId);

      if (error) throw error;
      await fetchRoutinesAndPlanner(user.id);
    } catch (err) {
      console.error('Error deleting routine:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addExerciseToRoutine = async (
    routineId: string,
    exerciseDictId: string,
    targetSets: number,
    targetReps: string
  ) => {
    if (!user) return;
    try {
      setIsLoading(true);

      const { data: currentExercises, error: fetchErr } = await supabase
        .from('exercises')
        .select('order_index')
        .eq('routine_id', routineId);

      if (fetchErr) throw fetchErr;

      const maxOrderIndex = (currentExercises || []).reduce(
        (max, item) => (item.order_index > max ? item.order_index : max),
        0
      );

      const { error: insertErr } = await supabase
        .from('exercises')
        .insert({
          routine_id: routineId,
          exercise_id: exerciseDictId,
          target_sets: targetSets,
          target_reps: targetReps,
          order_index: maxOrderIndex + 1
        });

      if (insertErr) throw insertErr;

      await fetchRoutinesAndPlanner(user.id);
    } catch (err) {
      console.error('Error adding exercise to routine:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const removeExerciseFromRoutine = async (exerciseId: string) => {
    if (!user) return;
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exerciseId);

      if (error) throw error;

      await fetchRoutinesAndPlanner(user.id);
    } catch (err) {
      console.error('Error removing exercise:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const reorderExercise = async (routineId: string, exerciseId: string, direction: 'up' | 'down') => {
    if (!user) return;
    const routine = routines.find((r) => r.id === routineId);
    if (!routine || routine.exercises.length <= 1) return;

    try {
      setIsLoading(true);
      
      const currentIdx = routine.exercises.findIndex((e) => e.id === exerciseId);
      if (currentIdx === -1) return;
      if (direction === 'up' && currentIdx === 0) return;
      if (direction === 'down' && currentIdx === routine.exercises.length - 1) return;

      const targetIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
      const currentExercise = routine.exercises[currentIdx];
      const targetExercise = routine.exercises[targetIdx];

      const { error: err1 } = await supabase
        .from('exercises')
        .update({ order_index: targetIdx + 1 })
        .eq('id', currentExercise.id);

      if (err1) throw err1;

      const { error: err2 } = await supabase
        .from('exercises')
        .update({ order_index: currentIdx + 1 })
        .eq('id', targetExercise.id);

      if (err2) throw err2;

      await fetchRoutinesAndPlanner(user.id);
    } catch (err) {
      console.error('Error reordering exercises:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Exercise Focus Modal Actions
  const openExerciseFocus = async (exerciseDictId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('exercise_dictionary')
        .select('*')
        .eq('id', exerciseDictId)
        .single();
      
      if (!error && data) {
        setFocusedExercise(data);
      }
    } catch (err) {
      console.error('Error fetching focused exercise details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const closeExerciseFocus = () => {
    setFocusedExercise(null);
  };

  // Bottom Sheet Actions
  const openBottomSheet = (exerciseId: string, setIndex: number) => {
    setActiveExerciseId(exerciseId);
    setActiveSetIndex(setIndex);
  };

  const closeBottomSheet = () => {
    setActiveExerciseId(null);
    setActiveSetIndex(null);
  };

  // Rest Timer Actions
  const startRestTimer = (seconds = 90) => {
    setRestTimeRemaining(seconds);
    setIsTimerActive(true);
  };

  const stopRestTimer = () => {
    setIsTimerActive(false);
    setRestTimeRemaining(0);
  };

  const addRestTime = (seconds: number) => {
    setRestTimeRemaining((prev) => Math.max(0, prev + seconds));
  };

  return (
    <WorkoutContext.Provider value={{
      activeView,
      setActiveView,
      user,
      logout,
      routines,
      weeklyPlanner,
      assignRoutineToDay,
      isLoading,
      refetchData,
      streakDays,
      activeSession,
      startWorkout,
      finishWorkout,
      cancelWorkout,
      updateSet,
      toggleSetCompleted,
      activeExerciseId,
      activeSetIndex,
      openBottomSheet,
      closeBottomSheet,
      restTimeRemaining,
      isTimerActive,
      totalRestTime,
      setTotalRestTime,
      startRestTimer,
      stopRestTimer,
      addRestTime,
      createRoutine,
      deleteRoutine,
      addExerciseToRoutine,
      removeExerciseFromRoutine,
      reorderExercise,
      focusedExercise,
      openExerciseFocus,
      closeExerciseFocus
    }}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};
