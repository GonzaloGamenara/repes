import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';

export const LoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
          options: {
            emailRedirectTo: window.location.origin,
          },
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
    <div className="flex-1 flex flex-col justify-center px-4 py-4 sm:py-10 relative">
      
      {/* Background Decorative Glowing Elements */}
      <div className="absolute top-[15%] left-[-15%] w-[350px] h-[350px] rounded-full bg-[#A3FF47]/5 blur-[100px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[15%] right-[-15%] w-[350px] h-[350px] rounded-full bg-[#A3FF47]/2 blur-[100px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '-4s' }}></div>
 
      <div className="max-w-md w-full mx-auto relative z-10 flex flex-col gap-4 sm:gap-6 animate-scale-in">
        
        {/* App Logo & Title */}
        <div className="text-center flex flex-col items-center gap-3 sm:gap-4">
          <div className="relative flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-xl bg-[#A3FF47] p-[1.5px] shadow-2xl shadow-[#A3FF47]/5">
            <div className="w-full h-full rounded-[10px] bg-[#121212] flex items-center justify-center z-10 text-2xl sm:text-3xl font-black text-[#A3FF47] font-mono tracking-tighter">
              RP
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl sm:text-4xl font-black tracking-widest text-white uppercase font-display">
              REPES
            </h1>
            <p className="text-[10px] sm:text-xs text-[#A0A0A0] font-black uppercase tracking-widest">
              SOBRECARGA PROGRESIVA ÁGIL
            </p>
          </div>
          <p className="text-[11px] sm:text-xs text-[#A0A0A0] font-medium max-w-xs leading-relaxed mt-0.5">
            Reemplazá las notas de WhatsApp al entrenar y trackeá tus pesos en tiempo real con Supabase.
          </p>
        </div>
 
        {/* Login Card */}
        <div className="bg-[#1E1E1E] border border-white/10 rounded-xl p-5 sm:p-7 shadow-2xl flex flex-col gap-4 sm:gap-6">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
              {isSignUp ? 'Crear cuenta nueva' : 'Comenzar a entrenar'}
            </h2>
            <p className="text-[11px] sm:text-xs text-[#A0A0A0] mt-0.5 font-medium leading-normal">
              {isSignUp ? 'Registrate con tu email para persistir tus datos.' : 'Ingresá con tus credenciales de Supabase.'}
            </p>
          </div>
 
          {/* Feedback alerts */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] sm:text-xs font-semibold text-rose-400 text-center leading-relaxed animate-shake">
              ⚠️ {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-[#A3FF47]/10 border border-[#A3FF47]/20 text-[11px] sm:text-xs font-semibold text-[#A3FF47] text-center leading-relaxed">
              ✅ {successMsg}
            </div>
          )}
 
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 sm:gap-4.5">
            {/* Email field */}
            <div className="flex flex-col gap-1">
              <label htmlFor="email-input" className="text-[9px] sm:text-[10px] font-black text-[#A0A0A0] uppercase tracking-widest pl-1">
                Correo Electrónico
              </label>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@gimnasio.com"
                className="w-full bg-transparent border-b border-white/10 focus:border-[#A3FF47] px-2 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder-neutral-700 focus:outline-none transition-all duration-300 font-semibold rounded-none"
                required
                style={{ touchAction: 'manipulation' }}
              />
            </div>
 
            {/* Password field */}
            <div className="flex flex-col gap-1">
              <label htmlFor="password-input" className="text-[9px] sm:text-[10px] font-black text-[#A0A0A0] uppercase tracking-widest pl-1">
                Contraseña
              </label>
              <div className="relative w-full">
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent border-b border-white/10 focus:border-[#A3FF47] pl-2 pr-12 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder-neutral-700 focus:outline-none transition-all duration-300 font-semibold rounded-none"
                  required
                  style={{ touchAction: 'manipulation' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-white transition-colors duration-200 p-1"
                  style={{ touchAction: 'manipulation' }}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
 
            <Button
              type="submit"
              variant="primary"
              size="full"
              disabled={loading}
              className="mt-2 sm:mt-3.5 py-3.5 sm:py-4"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-[#121212]" viewBox="0 0 24 24" fill="none">
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
          <div className="text-center mt-1 sm:mt-2">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-[11px] sm:text-xs font-black text-[#A3FF47] hover:text-[#b5ff66] underline underline-offset-4 decoration-[#A3FF47]/30 decoration-2 transition-colors duration-200 uppercase tracking-wider"
              style={{ touchAction: 'manipulation' }}
            >
              {isSignUp ? '¿Ya tenés cuenta? Iniciar Sesión' : '¿No tenés cuenta? Registrarse'}
            </button>
          </div>
        </div>
 
        {/* Benefits banner */}
        <div className="hidden sm:grid grid-cols-3 gap-3 text-center text-[10px] font-black uppercase tracking-wider text-[#A0A0A0] mt-2 select-none">
          <div className="flex flex-col gap-1.5 bg-[#1E1E1E] border border-white/5 rounded-xl p-3 shadow-md hover:border-[#A3FF47]/20 transition-all duration-300">
            <span className="text-[#A3FF47] text-lg">⚡</span>
            <span>Ágil y Rápido</span>
          </div>
          <div className="flex flex-col gap-1.5 bg-[#1E1E1E] border border-white/5 rounded-xl p-3 shadow-md hover:border-[#A3FF47]/20 transition-all duration-300">
            <span className="text-[#A3FF47] text-lg">📈</span>
            <span>Sobrecarga</span>
          </div>
          <div className="flex flex-col gap-1.5 bg-[#1E1E1E] border border-white/5 rounded-xl p-3 shadow-md hover:border-[#A3FF47]/20 transition-all duration-300">
            <span className="text-[#A3FF47] text-lg">🔒</span>
            <span>PostgreSQL</span>
          </div>
        </div>
 
      </div>
    </div>
  );
};
export default LoginView;
