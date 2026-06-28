import React, { useState, useEffect, useRef } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';

interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export const NutritionView: React.FC = () => {
  const { user } = useWorkout();
  const metadata = user?.user_metadata || {};

  // Form states & persistences
  const [fridgeIngredients, setFridgeIngredients] = useState<string>(metadata.fridge_ingredients || '');
  const [workSchedule, setWorkSchedule] = useState<string>(metadata.work_schedule || '');
  const [takesProtein, setTakesProtein] = useState<boolean>(!!metadata.takes_protein);
  const [takesCreatine, setTakesCreatine] = useState<boolean>(!!metadata.takes_creatine);

  // Status variables
  const [isSavingContext, setIsSavingContext] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState<boolean>(false); // Collapsible settings for mobile

  // Chat states
  const [chatInput, setChatInput] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // Today's workouts list
  const [todayWorkouts, setTodayWorkouts] = useState<string[]>([]);
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState<boolean>(false);

  // Chat container reference for auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch API key from Vite environment
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  // Initialize chat messages and load today's workouts
  useEffect(() => {
    if (user?.id) {
      // Load saved chat history
      const saved = localStorage.getItem(`repes_nutrition_chat_${user.id}`);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        setMessages([
          {
            role: 'model',
            content: '¡Hola! Soy tu asistente de nutrición e IA en REPES. Estoy aquí para ayudarte a planificar tus 4 comidas diarias (desayuno, almuerzo, merienda y cena) y sugerirte recetas basadas en lo que tienes en tu heladera, tus suplementos y tu actividad física. ¿En qué te puedo ayudar hoy?',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
      fetchTodayWorkouts();
    }
  }, [user]);

  // Persist messages in localStorage
  useEffect(() => {
    if (user?.id && messages.length > 0) {
      localStorage.setItem(`repes_nutrition_chat_${user.id}`, JSON.stringify(messages));
    }
  }, [messages, user?.id]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiLoading]);

  // Calories Calculation
  const w = parseFloat(metadata.weight || '0');
  const h = parseFloat(metadata.height || '0');
  const a = parseInt(metadata.age || '0');
  const gender = metadata.gender || 'Masculino';
  const activityLevel = metadata.activity_level || 'Moderado';
  const calorieGoal = metadata.calorie_goal || 'Mantenimiento';

  let bmr = 0;
  let tdee = 0;
  let targetCalories = 0;

  if (w > 0 && h > 0 && a > 0) {
    if (gender === 'Masculino') {
      bmr = 10 * w + 6.25 * h - 5 * a + 5;
    } else {
      bmr = 10 * w + 6.25 * h - 5 * a - 161;
    }

    const activityFactors: Record<string, number> = {
      'Sedentario': 1.2,
      'Ligero': 1.375,
      'Moderado': 1.55,
      'Activo': 1.725,
      'Muy Activo': 1.9
    };

    const factor = activityFactors[activityLevel] || 1.55;
    tdee = bmr * factor;

    const goalAdjustments: Record<string, number> = {
      'Deficit fuerte': -500,
      'Deficit': -300,
      'Mantenimiento': 0,
      'Superavit': 300,
      'Superavit fuerte': 500
    };

    const adjustment = goalAdjustments[calorieGoal] || 0;
    targetCalories = tdee + adjustment;
  }

  // Fetch today's workouts from Supabase weight_logs
  const fetchTodayWorkouts = async () => {
    if (!user) return;
    setIsLoadingWorkouts(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      
      const { data: logs, error } = await supabase
        .from('weight_logs')
        .select('exercise_id, set_number, weight_kg, reps_done')
        .eq('user_id', user.id)
        .eq('logged_at', todayStr);

      if (error) throw error;
      if (!logs || logs.length === 0) {
        setTodayWorkouts([]);
        return;
      }

      // Fetch exercises list to map names
      const exerciseIds = Array.from(new Set(logs.map(l => l.exercise_id)));
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select(`
          id,
          exercise_dictionary (
            name
          )
        `)
        .in('id', exerciseIds);

      if (exercisesError) throw exercisesError;

      const nameMap: Record<string, string> = {};
      exercisesData?.forEach((e: any) => {
        nameMap[e.id] = e.exercise_dictionary?.name || 'Ejercicio';
      });

      // Group by exercise name
      const grouped: Record<string, number> = {};
      logs.forEach(log => {
        const name = nameMap[log.exercise_id] || 'Ejercicio';
        grouped[name] = (grouped[name] || 0) + 1;
      });

      const formatted = Object.entries(grouped).map(([name, sets]) => {
        return `${name} (${sets} ${sets === 1 ? 'serie' : 'series'})`;
      });

      setTodayWorkouts(formatted);
    } catch (err) {
      console.error('Error fetching today workouts:', err);
    } finally {
      setIsLoadingWorkouts(false);
    }
  };

  // Save manual context changes to Supabase
  const handleSaveContext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingContext(true);
    setSaveMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          fridge_ingredients: fridgeIngredients,
          work_schedule: workSchedule,
          takes_protein: takesProtein,
          takes_creatine: takesCreatine
        }
      });

      if (error) throw error;

      setSaveMessage('¡Contexto guardado con éxito!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setSaveMessage('Error al guardar el contexto.');
    } finally {
      setIsSavingContext(false);
    }
  };

  // Handle direct updates from the AI agent output tags
  const updateFridgeFromAi = async (updatedIngredients: string) => {
    if (!user) return;
    try {
      setFridgeIngredients(updatedIngredients);
      await supabase.auth.updateUser({
        data: {
          fridge_ingredients: updatedIngredients
        }
      });
    } catch (err) {
      console.error('Error auto-updating fridge from AI:', err);
    }
  };

  // Clear Chat history
  const handleClearChat = () => {
    if (window.confirm('¿Seguro que querés vaciar el historial de chat?')) {
      const initialMsg: Message = {
        role: 'model',
        content: '¡Hola! Soy tu asistente de nutrición e IA en REPES. Estoy aquí para ayudarte a planificar tus 4 comidas diarias (desayuno, almuerzo, merienda y cena) y sugerirte recetas basadas en lo que tienes en tu heladera, tus suplementos y tu actividad física. ¿En qué te puedo ayudar hoy?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([initialMsg]);
      if (user?.id) {
        localStorage.setItem(`repes_nutrition_chat_${user.id}`, JSON.stringify([initialMsg]));
      }
    }
  };

  // Send message to Gemini API
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isAiLoading || !user) return;

    // Check if API Key exists
    if (!apiKey) {
      alert('Error: No se ha configurado la API Key de Gemini en el archivo .env. Por favor contacta al administrador.');
      return;
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = { role: 'user', content: textToSend, timestamp };
    
    // Add user message to state
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsAiLoading(true);

    // Prepare system instructions and prompt
    const supplementsText = [
      takesProtein ? 'Proteína en polvo (Whey Protein)' : null,
      takesCreatine ? 'Creatina' : null
    ].filter(Boolean).join(', ') || 'Ninguno';

    const workoutText = todayWorkouts.length > 0 
      ? todayWorkouts.join(', ')
      : 'Ningún ejercicio registrado hoy todavía';

    const systemInstruction = `Eres un asistente de nutrición y salud personal de la aplicación REPES. Tu objetivo principal es ayudar al usuario a planificar sus 4 comidas diarias (Desayuno, Almuerzo, Merienda y Cena) y sugerirle recetas saludables basadas en su contexto físico y diario.

Debes tener en cuenta obligatoriamente los siguientes datos del usuario:
- Sus características físicas (Edad, Peso, Altura, Género).
- Sus calorías y objetivo diario (TDEE).
- Si consume suplementos (Proteína en polvo, Creatina). Si el usuario los consume, inclúyelos adecuadamente en sus planes de alimentación (por ejemplo, el batido de proteína en la merienda o post-entrenamiento).
- Su rutina horaria y laboral (para sugerir preparaciones rápidas o viandas para el trabajo si está en horario laboral).
- Su entrenamiento del día (si hoy entrenó o no). Si entrenó, planifica comidas que favorezcan la recuperación (más carbohidratos y proteínas post-entreno).
- Los ingredientes actuales en su heladera. Prioriza recetas que usen los ingredientes que tiene disponibles en su heladera para evitar desperdicio de comida y gastos adicionales.

Directrices de comportamiento:
1. Sé conciso, directo y motivador. Estructura tus respuestas con viñetas claras y texto en negrita.
2. Si el usuario te indica por chat que compró, gastó, agregó o eliminó ingredientes de su heladera (ej. "Agregá 2 huevos a la heladera" o "Ya no me queda pollo"), debes procesar esa información y, AL FINAL de tu respuesta, incluir OBLIGATORIAMENTE la etiqueta especial con la lista completa y actualizada de ingredientes de esta forma:
<update_fridge>Ingrediente A, Ingrediente B, Ingrediente C</update_fridge>
Por ejemplo, si tenía 'tomates, pollo' y dice que compró lechuga, pon al final:
<update_fridge>tomates, pollo, lechuga</update_fridge>
No incluyas explicaciones dentro de la etiqueta, solo la lista de ingredientes separada por comas.

Responde siempre en español y mantén un tono amigable, profesional y enfocado en el fitness.`;

    const formattedContext = `
[CONTEXTO DEL USUARIO]
- Nombre: ${metadata.first_name || 'Usuario'}
- Edad: ${a > 0 ? `${a} años` : 'No especificada'}
- Peso: ${w > 0 ? `${w} kg` : 'No especificado'}
- Altura: ${h > 0 ? `${h} cm` : 'No especificada'}
- Género: ${gender}
- Nivel de actividad: ${activityLevel}
- Meta de calorías: ${calorieGoal} (${targetCalories > 0 ? `${Math.round(targetCalories)} kcal` : 'No calculado'})
- Horarios y rutina: ${workSchedule || 'No especificado'}
- Suplementos actuales: ${supplementsText}
- Ingredientes actuales en heladera: ${fridgeIngredients || 'Ninguno'}
- Entrenamiento realizado hoy: ${workoutText}

[MENSAJE DEL USUARIO]
${textToSend}
`;

    try {
      // We map the message history for Gemini API.
      // We send the current context ONLY in the user's latest turn to keep it simple,
      // but we maintain the conversation role pattern.
      const historyContents = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      // Append latest user prompt with context
      historyContents.push({
        role: 'user',
        parts: [{ text: formattedContext }]
      });

      // Call Gemini API (gemini-2.5-flash)
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: historyContents,
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      });

      const data = await response.json();
      
      if (response.status !== 200) {
        throw new Error(data.error?.message || 'Error en respuesta de Gemini API.');
      }

      let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude procesar tu solicitud.';

      // Check if the response contains the update_fridge tag
      const match = aiText.match(/<update_fridge>([\s\S]*?)<\/update_fridge>/);
      if (match) {
        const updatedIngredients = match[1].trim();
        await updateFridgeFromAi(updatedIngredients);
        // Strip the tag from the text displayed to the user
        aiText = aiText.replace(/<update_fridge>[\s\S]*?<\/update_fridge>/g, '').trim();
      }

      const aiMsg: Message = {
        role: 'model',
        content: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          content: `Hubo un error de conexión con la IA: ${err.message || 'Error desconocido'}. Asegúrate de tener una conexión a internet activa.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full max-h-full gap-5 p-4 lg:p-6 pb-24 overflow-hidden animate-fade-in relative">
      
      {/* LEFT COLUMN: Context and Settings */}
      <div className={`lg:w-1/3 flex flex-col gap-4 overflow-y-auto lg:overflow-y-visible pr-1 max-h-[40vh] lg:max-h-full ${showConfig ? 'flex' : 'hidden lg:flex'}`}>
        
        {/* Profile and Calories Stats */}
        <div className="bg-[#1E1E1E] border border-white/10 rounded-xl p-4.5 flex flex-col gap-3 shadow-md shrink-0">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[10px] font-black uppercase text-[#A0A0A0] tracking-widest">Mi Perfil Físico</span>
            <span className="text-[9px] font-black uppercase bg-[#A3FF47]/10 text-[#A3FF47] px-2 py-0.5 rounded border border-[#A3FF47]/20">
              Datos
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex flex-col">
              <span className="text-[9px] text-[#A0A0A0] font-bold uppercase">Edad</span>
              <span className="font-bold text-white font-mono">{a > 0 ? `${a} años` : '--'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-[#A0A0A0] font-bold uppercase">Peso / Altura</span>
              <span className="font-bold text-white font-mono">{w > 0 ? `${w} kg` : '--'} / {h > 0 ? `${h} cm` : '--'}</span>
            </div>
            <div className="flex flex-col col-span-2 border-t border-white/5 pt-2">
              <span className="text-[9px] text-[#A3FF47] font-bold uppercase">Objetivo Calórico</span>
              <span className="text-sm font-black text-[#A3FF47] font-mono">
                {targetCalories > 0 ? `${Math.round(targetCalories)} kcal` : 'Faltan datos en Perfil'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Context Form */}
        <form onSubmit={handleSaveContext} className="bg-[#1E1E1E] border border-white/10 rounded-xl p-4.5 flex flex-col gap-4.5 shadow-md flex-1 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 shrink-0">
            <span className="text-[10px] font-black uppercase text-[#A0A0A0] tracking-widest">Mi Heladera y Rutina</span>
            <span className="text-[9px] font-bold text-[#A0A0A0] lowercase font-mono">Supabase</span>
          </div>

          {saveMessage && (
            <div className="p-3 rounded-lg bg-[#A3FF47]/10 border border-[#A3FF47]/20 text-[11px] text-[#A3FF47] font-semibold text-center shrink-0">
              {saveMessage}
            </div>
          )}

          {/* Fridge Ingredients Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-[#A0A0A0] font-black uppercase tracking-widest pl-1">
              Mi Heladera / Alimentos
            </label>
            <textarea
              value={fridgeIngredients}
              onChange={e => setFridgeIngredients(e.target.value)}
              placeholder="Ej: 2 pechugas de pollo, 4 huevos, 1 palta, queso crema, espinaca..."
              className="w-full h-24 bg-[#121212] border border-white/10 focus:border-[#A3FF47] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none transition-all duration-300 font-semibold resize-none"
            />
            <span className="text-[8px] text-[#A0A0A0] italic px-1">
              💡 La IA puede actualizar esta lista automáticamente si le dices qué compraste o comiste.
            </span>
          </div>

          {/* Daily Schedule Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-[#A0A0A0] font-black uppercase tracking-widest pl-1">
              Rutina Horaria y Trabajo
            </label>
            <textarea
              value={workSchedule}
              onChange={e => setWorkSchedule(e.target.value)}
              placeholder="Ej: Trabajo de 8:30 a 17:30. Entreno lunes, miércoles y viernes a las 19:00."
              className="w-full h-20 bg-[#121212] border border-white/10 focus:border-[#A3FF47] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none transition-all duration-300 font-semibold resize-none"
            />
          </div>

          {/* Supplements Toggles (Requested Additions) */}
          <div className="flex flex-col gap-2 border-t border-white/5 pt-3">
            <label className="text-[9px] text-[#A0A0A0] font-black uppercase tracking-widest pl-1">
              Suplementos Diarios
            </label>
            
            <div className="flex flex-col gap-2.5 px-1">
              {/* Protein Toggle */}
              <label className="flex items-center justify-between cursor-pointer select-none">
                <span className="text-xs font-semibold text-slate-300">Proteína en polvo (Whey)</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={takesProtein}
                    onChange={e => setTakesProtein(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#121212] border border-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#A0A0A0] peer-checked:after:bg-[#121212] after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A3FF47] peer-checked:border-[#A3FF47] transition-all"></div>
                </div>
              </label>

              {/* Creatine Toggle */}
              <label className="flex items-center justify-between cursor-pointer select-none">
                <span className="text-xs font-semibold text-slate-300">Creatina</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={takesCreatine}
                    onChange={e => setTakesCreatine(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#121212] border border-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#A0A0A0] peer-checked:after:bg-[#121212] after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A3FF47] peer-checked:border-[#A3FF47] transition-all"></div>
                </div>
              </label>
            </div>
          </div>

          {/* Today's Workout Badge */}
          <div className="border-t border-white/5 pt-3 shrink-0">
            <span className="text-[9px] text-[#A0A0A0] font-black uppercase tracking-widest pl-1 block mb-1">
              Entrenamiento de Hoy
            </span>
            {isLoadingWorkouts ? (
              <span className="text-[10px] text-neutral-500 italic px-1 block">Cargando entrenamiento...</span>
            ) : todayWorkouts.length > 0 ? (
              <div className="flex flex-col gap-1 bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2.5">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">
                  💪 ¡Hoy entrenaste!
                </span>
                <span className="text-[10px] text-slate-300 leading-snug">
                  {todayWorkouts.join(', ')}
                </span>
              </div>
            ) : (
              <span className="text-[10px] text-neutral-500 font-medium italic px-1 block">
                No has completado ejercicios hoy en el gimnasio.
              </span>
            )}
          </div>

          <Button
            variant="primary"
            size="full"
            type="submit"
            disabled={isSavingContext}
            className="py-3 shrink-0"
          >
            {isSavingContext ? 'Guardando...' : 'Guardar Datos en Supabase'}
          </Button>
        </form>
      </div>

      {/* RIGHT COLUMN: AI Agent Chat Interface */}
      <div className="flex-1 flex flex-col bg-[#1E1E1E] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative">
        
        {/* Chat Header */}
        <div className="px-4 py-3 bg-[#181818] border-b border-white/15 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#A3FF47]/10 border border-[#A3FF47]/20 flex items-center justify-center text-sm shadow-md">
              🥗
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-white uppercase tracking-wider font-display">Asistente Nutricional IA</span>
              <span className="text-[9px] text-[#A3FF47] font-bold tracking-wide flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#A3FF47] animate-pulse"></span>
                Gemini 2.5 Flash Activo
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Toggle Config on Mobile */}
            <button 
              onClick={() => setShowConfig(!showConfig)}
              className="lg:hidden bg-white/5 border border-white/10 hover:border-white/20 active:scale-95 text-[10px] font-black uppercase text-slate-300 px-3 py-1.5 rounded-lg transition-all"
            >
              {showConfig ? 'Ver Chat' : 'Ajustar Heladera'}
            </button>
            
            {/* Clear Chat Button */}
            <button 
              onClick={handleClearChat}
              title="Borrar historial de chat"
              className="bg-white/5 border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/20 active:scale-95 text-slate-400 hover:text-rose-400 p-1.5 rounded-lg transition-all"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4 min-h-0">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div 
                key={index}
                className={`flex flex-col max-w-[85%] ${isUser ? 'self-end items-end' : 'self-start items-start'}`}
              >
                <div 
                  className={`px-4 py-3 rounded-2xl text-xs font-medium leading-relaxed whitespace-pre-wrap ${
                    isUser 
                      ? 'bg-[#A3FF47] text-[#121212] rounded-tr-none font-bold shadow-md shadow-[#A3FF47]/5' 
                      : 'bg-[#121212] border border-white/5 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[8px] text-neutral-500 mt-1 font-mono font-medium px-1">
                  {msg.timestamp}
                </span>
              </div>
            );
          })}

          {/* AI Typing Indicator */}
          {isAiLoading && (
            <div className="flex flex-col max-w-[85%] self-start items-start">
              <div className="bg-[#121212] border border-white/5 text-slate-200 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Prompts */}
        <div className="px-4 py-2 border-t border-white/5 flex gap-2 overflow-x-auto shrink-0 select-none no-scrollbar">
          <button 
            onClick={() => handleSendMessage('Generar mis 4 comidas de hoy')}
            disabled={isAiLoading}
            className="shrink-0 bg-white/5 border border-white/10 hover:border-[#A3FF47]/30 hover:bg-[#A3FF47]/5 text-[10px] font-black uppercase text-slate-300 hover:text-[#A3FF47] px-3 py-1.5 rounded-full transition-all disabled:opacity-40"
          >
            📋 4 comidas de hoy
          </button>
          <button 
            onClick={() => handleSendMessage('Sugerir receta rápida con lo que tengo en mi heladera')}
            disabled={isAiLoading}
            className="shrink-0 bg-white/5 border border-white/10 hover:border-[#A3FF47]/30 hover:bg-[#A3FF47]/5 text-[10px] font-black uppercase text-slate-300 hover:text-[#A3FF47] px-3 py-1.5 rounded-full transition-all disabled:opacity-40"
          >
            🍳 Receta con mi heladera
          </button>
          <button 
            onClick={() => handleSendMessage('¿Cómo debería consumir mis suplementos hoy según mis horarios y entrenamiento?')}
            disabled={isAiLoading}
            className="shrink-0 bg-white/5 border border-white/10 hover:border-[#A3FF47]/30 hover:bg-[#A3FF47]/5 text-[10px] font-black uppercase text-slate-300 hover:text-[#A3FF47] px-3 py-1.5 rounded-full transition-all disabled:opacity-40"
          >
            🥤 Mis Suplementos
          </button>
        </div>

        {/* Chat Input Area */}
        <div className="p-3 bg-[#181818] border-t border-white/15 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSendMessage(chatInput);
            }}
            placeholder={apiKey ? "Escribe un mensaje al asistente nutricional..." : "Por favor configura la API Key en tu .env"}
            disabled={isAiLoading || !apiKey}
            className="flex-1 bg-[#121212] border border-white/10 focus:border-[#A3FF47] rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-600 focus:outline-none transition-all duration-300 font-semibold"
          />
          <button
            onClick={() => handleSendMessage(chatInput)}
            disabled={isAiLoading || !chatInput.trim() || !apiKey}
            className="bg-[#A3FF47] hover:bg-[#b5ff62] text-[#121212] font-black text-xs px-5 py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-[#A3FF47]/10 disabled:opacity-40 disabled:hover:shadow-none active:scale-[0.97]"
          >
            Enviar
          </button>
        </div>

      </div>

    </div>
  );
};

export default NutritionView;
