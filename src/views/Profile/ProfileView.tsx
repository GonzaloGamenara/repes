import React, { useState } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';

export const ProfileView: React.FC = () => {
  const { user, logout } = useWorkout();
  const metadata = user?.user_metadata || {};

  const [firstName, setFirstName] = useState(metadata.first_name || '');
  const [lastName, setLastName] = useState(metadata.last_name || '');
  const [phone, setPhone] = useState(metadata.phone || '');
  const [age, setAge] = useState(metadata.age || '');
  const [weight, setWeight] = useState(metadata.weight || '');
  const [height, setHeight] = useState(metadata.height || '');
  const [gender, setGender] = useState(metadata.gender || 'Masculino');
  const [activityLevel, setActivityLevel] = useState(metadata.activity_level || 'Moderado');
  const [calorieGoal, setCalorieGoal] = useState(metadata.calorie_goal || 'Mantenimiento');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Dynamic calories calculation
  const w = parseFloat(weight);
  const h = parseFloat(height);
  const a = parseInt(age);

  let bmr = 0;
  let tdee = 0;
  let targetCalories = 0;

  if (!isNaN(w) && !isNaN(h) && !isNaN(a) && w > 0 && h > 0 && a > 0) {
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const updates: any = {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone,
          age: parseInt(age) || null,
          weight: parseFloat(weight) || null,
          height: parseFloat(height) || null,
          gender,
          activity_level: activityLevel,
          calorie_goal: calorieGoal
        }
      };

      if (password.trim().length > 0) {
        updates.password = password;
      }

      if (email.trim().toLowerCase() !== (user?.email || '').toLowerCase()) {
        updates.email = email.trim();
      }

      const { error } = await supabase.auth.updateUser(updates);

      if (error) throw error;

      setMessage({
        text: '¡Perfil actualizado con éxito! ' + 
              (updates.email ? 'Se envió un correo de confirmación a tu nuevo email.' : ''),
        type: 'success'
      });
      setPassword('');
    } catch (err: any) {
      console.error(err);
      setMessage({
        text: err.message || 'Error al guardar los datos.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 px-4 py-6 max-w-lg mx-auto w-full pb-36 relative animate-fade-in">
      
      {/* Title */}
      <div className="flex flex-col">
        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest pl-0.5">Configuración</span>
        <h1 className="text-xl font-black text-white leading-tight">Mi Perfil</h1>
      </div>

      {/* Calorías Card Display */}
      <div className="bg-gradient-to-r from-emerald-950/20 to-slate-900/10 border border-white/5 rounded-3xl p-5 backdrop-blur-md flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <span className="text-xs font-bold text-slate-400">Metabolismo y Energía</span>
          <span className="text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">
            Calculadora
          </span>
        </div>

        {targetCalories > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Gasto Diario (TDEE)</span>
              <span className="text-lg font-black text-slate-200 font-mono">{Math.round(tdee)} kcal</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Objetivo Diario</span>
              <span className="text-xl font-black text-emerald-400 font-mono">{Math.round(targetCalories)} kcal</span>
            </div>
            <div className="col-span-2 text-[10px] text-slate-400 leading-relaxed pt-1">
              Consumo diario recomendado para <span className="text-emerald-400 font-bold">{calorieGoal}</span> en base a tu peso ({weight} kg), altura ({height} cm) y actividad ({activityLevel}).
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 leading-relaxed py-2 text-center font-medium">
            Completá tu **Edad**, **Peso** y **Altura** para calcular automáticamente tus necesidades calóricas diarias.
          </div>
        )}
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="flex flex-col gap-4.5 bg-[#0b100c]/60 border border-white/5 rounded-[32px] p-6.5 shadow-xl backdrop-blur-md">
        
        {message && (
          <div className={`p-4 rounded-xl border text-xs font-semibold leading-relaxed ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3.5">
          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-slate-400 font-black uppercase tracking-widest pl-1">Nombre</label>
            <input 
              type="text" 
              value={firstName} 
              onChange={e => setFirstName(e.target.value)} 
              className="w-full bg-[#030603] border border-white/5 focus:border-emerald-500/50 rounded-xl px-3.5 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-all duration-300 font-semibold shadow-inner"
              placeholder="Ej: Juan"
            />
          </div>

          {/* Apellido */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-slate-400 font-black uppercase tracking-widest pl-1">Apellido</label>
            <input 
              type="text" 
              value={lastName} 
              onChange={e => setLastName(e.target.value)} 
              className="w-full bg-[#030603] border border-white/5 focus:border-emerald-500/50 rounded-xl px-3.5 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-all duration-300 font-semibold shadow-inner"
              placeholder="Ej: Pérez"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {/* Número */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-slate-400 font-black uppercase tracking-widest pl-1">Número de Teléfono</label>
            <input 
              type="tel" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              className="w-full bg-[#030603] border border-white/5 focus:border-emerald-500/50 rounded-xl px-3.5 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-all duration-300 font-semibold shadow-inner"
              placeholder="Ej: +54911223344"
            />
          </div>

          {/* Edad */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-slate-400 font-black uppercase tracking-widest pl-1">Edad (Años)</label>
            <input 
              type="number" 
              value={age} 
              onChange={e => setAge(e.target.value)} 
              className="w-full bg-[#030603] border border-white/5 focus:border-emerald-500/50 rounded-xl px-3.5 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-all duration-300 font-bold shadow-inner font-mono"
              placeholder="Ej: 28"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {/* Peso */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-slate-400 font-black uppercase tracking-widest pl-1">Peso (kg)</label>
            <input 
              type="number" 
              step="0.1"
              value={weight} 
              onChange={e => setWeight(e.target.value)} 
              className="w-full bg-[#030603] border border-white/5 focus:border-emerald-500/50 rounded-xl px-3.5 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-all duration-300 font-bold shadow-inner font-mono"
              placeholder="Ej: 75.5"
            />
          </div>

          {/* Altura */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-slate-400 font-black uppercase tracking-widest pl-1">Altura (cm)</label>
            <input 
              type="number" 
              value={height} 
              onChange={e => setHeight(e.target.value)} 
              className="w-full bg-[#030603] border border-white/5 focus:border-emerald-500/50 rounded-xl px-3.5 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-all duration-300 font-bold shadow-inner font-mono"
              placeholder="Ej: 178"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {/* Sexo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-slate-400 font-black uppercase tracking-widest pl-1">Sexo</label>
            <select
              value={gender}
              onChange={e => setGender(e.target.value)}
              className="w-full bg-[#030603] border border-white/5 focus:border-emerald-500/50 rounded-xl px-3.5 py-3 text-xs text-slate-200 font-semibold focus:outline-none transition-all duration-300"
            >
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </select>
          </div>

          {/* Nivel de Actividad */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-slate-400 font-black uppercase tracking-widest pl-1">Actividad Física</label>
            <select
              value={activityLevel}
              onChange={e => setActivityLevel(e.target.value)}
              className="w-full bg-[#030603] border border-white/5 focus:border-emerald-500/50 rounded-xl px-3.5 py-3 text-xs text-slate-200 font-semibold focus:outline-none transition-all duration-300"
            >
              <option value="Sedentario">Sedentario (Poco/Sin gym)</option>
              <option value="Ligero">Ligero (1-3 d/semana)</option>
              <option value="Moderado">Moderado (gym 4-5 d/semana)</option>
              <option value="Activo">Activo (Intenso diario)</option>
              <option value="Muy Activo">Muy Activo (Trabajo físico/Doble turno)</option>
            </select>
          </div>
        </div>

        {/* Objetivo Calórico */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] text-slate-400 font-black uppercase tracking-widest pl-1">Objetivo Nutricional</label>
          <select
            value={calorieGoal}
            onChange={e => setCalorieGoal(e.target.value)}
            className="w-full bg-[#030603] border border-white/5 focus:border-emerald-500/50 rounded-xl px-3.5 py-3 text-xs text-slate-200 font-semibold focus:outline-none transition-all duration-300"
          >
            <option value="Deficit fuerte">Déficit Fuerte (Pérdida rápida)</option>
            <option value="Deficit">Déficit Moderado (Pérdida de grasa)</option>
            <option value="Mantenimiento">Mantenimiento (Recomposición)</option>
            <option value="Superavit">Superávit Moderado (Volumen limpio)</option>
            <option value="Superavit fuerte">Superávit Fuerte (Volumen agresivo)</option>
          </select>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5 border-t border-white/5 pt-4.5 mt-1.5">
          <label className="text-[9px] text-slate-400 font-black uppercase tracking-widest pl-1">Email de la cuenta</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="w-full bg-[#030603] border border-white/5 focus:border-emerald-500/50 rounded-xl px-3.5 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-all duration-300 font-semibold shadow-inner"
            required
          />
        </div>

        {/* Contraseña */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] text-slate-400 font-black uppercase tracking-widest pl-1">Nueva Contraseña (Dejar vacío para no cambiar)</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            className="w-full bg-[#030603] border border-white/5 focus:border-emerald-500/50 rounded-xl px-3.5 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-all duration-300 font-semibold shadow-inner"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <Button
          variant="primary"
          size="full"
          type="submit"
          disabled={isSaving}
          className="mt-3.5 py-4"
        >
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </form>

      {/* Danger Zone / Sign Out */}
      <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
        <Button
          variant="danger"
          size="full"
          onClick={logout}
          className="bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 active:scale-95"
        >
          Cerrar sesión
        </Button>
      </div>

    </div>
  );
};

export default ProfileView;
