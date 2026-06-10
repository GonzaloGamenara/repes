import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';

export const LoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });
        if (error) throw error;
        setSuccessMsg('¡Registro exitoso! Revisa tu email para verificar la cuenta o inicia sesión.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-4 py-12 relative min-h-dvh">
      
      {/* Background Decorative Glowing Elements */}
      <div className="absolute top-[15%] left-[-15%] w-[350px] h-[350px] rounded-full bg-emerald-950/20 blur-[100px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[15%] right-[-15%] w-[350px] h-[350px] rounded-full bg-teal-950/15 blur-[100px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '-4s' }}></div>
 
      <div className="max-w-md w-full mx-auto relative z-10 flex flex-col gap-8 animate-scale-in">
        
        {/* App Logo & Title */}
        <div className="text-center flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1.5px] shadow-2xl shadow-emerald-950/50">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 opacity-40 blur-lg"></div>
            <div className="w-full h-full rounded-[14px] bg-[#020503] flex items-center justify-center z-10 text-3xl font-black text-emerald-400 font-mono tracking-tighter">
              rp
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              repes
            </h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Sobrecarga Progresiva Ágil
            </p>
          </div>
          <p className="text-xs text-slate-400 font-medium max-w-xs leading-relaxed mt-1">
            Reemplazá las notas de WhatsApp al entrenar y trackeá tus pesos en tiempo real con Supabase.
          </p>
        </div>
 
        {/* Login Card */}
        <div className="bg-[#0b100c]/80 border border-white/10 rounded-[32px] p-7 shadow-2xl flex flex-col gap-6 backdrop-blur-md">
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">
              {isSignUp ? 'Crear cuenta nueva' : 'Comenzar a entrenar'}
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-medium leading-normal">
              {isSignUp ? 'Registrate con tu email para persistir tus datos.' : 'Ingresá con tus credenciales de Supabase.'}
            </p>
          </div>
 
          {/* Feedback alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400 text-center leading-relaxed animate-shake">
              ⚠️ {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 text-center leading-relaxed">
              ✅ {successMsg}
            </div>
          )}
 
          <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email-input" className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Correo Electrónico
              </label>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@gimnasio.com"
                className="w-full bg-[#030603] border border-white/5 focus:border-emerald-500/50 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all duration-300 font-semibold shadow-inner"
                required
                style={{ touchAction: 'manipulation' }}
              />
            </div>
 
            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password-input" className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Contraseña
              </label>
              <input
                id="password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#030603] border border-white/5 focus:border-emerald-500/50 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all duration-300 font-semibold shadow-inner"
                required
                style={{ touchAction: 'manipulation' }}
              />
            </div>
 
            <Button
              type="submit"
              variant="primary"
              size="full"
              disabled={loading}
              className="mt-3.5 py-4"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-slate-950" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </span>
              ) : isSignUp ? (
                'Registrarse'
              ) : (
                'Entrar al gimnasio'
              )}
            </Button>
          </form>
 
          {/* Toggle login mode */}
          <div className="text-center mt-2">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-xs font-black text-emerald-400 hover:text-emerald-300 underline underline-offset-4 decoration-emerald-400/30 decoration-2 transition-colors duration-200"
              style={{ touchAction: 'manipulation' }}
            >
              {isSignUp ? '¿Ya tenés cuenta? Iniciar Sesión' : '¿No tenés cuenta? Registrarse'}
            </button>
          </div>
        </div>
 
        {/* Benefits banner */}
        <div className="grid grid-cols-3 gap-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-500 mt-2 select-none">
          <div className="flex flex-col gap-1.5 bg-emerald-950/5 border border-white/5 rounded-2xl p-3 shadow-md hover:border-emerald-500/10 transition-all duration-300">
            <span className="text-emerald-400 text-lg">⚡</span>
            <span>Ágil y Rápido</span>
          </div>
          <div className="flex flex-col gap-1.5 bg-emerald-950/5 border border-white/5 rounded-2xl p-3 shadow-md hover:border-emerald-500/10 transition-all duration-300">
            <span className="text-emerald-400 text-lg">📈</span>
            <span>Sobrecarga</span>
          </div>
          <div className="flex flex-col gap-1.5 bg-emerald-950/5 border border-white/5 rounded-2xl p-3 shadow-md hover:border-emerald-500/10 transition-all duration-300">
            <span className="text-emerald-400 text-lg">🔒</span>
            <span>PostgreSQL</span>
          </div>
        </div>
 
      </div>
    </div>
  );
};
export default LoginView;
