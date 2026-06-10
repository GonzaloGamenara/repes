import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'full';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-300 active:scale-[0.96] select-none touch-none';
  
  const variants = {
    primary: 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 border border-emerald-400/25 tracking-tight font-extrabold',
    secondary: 'bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 hover:text-white backdrop-blur-md active:bg-white/10',
    outline: 'border border-slate-700 hover:border-emerald-500/30 hover:text-emerald-400 text-slate-300 bg-transparent',
    danger: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 active:bg-rose-500/30',
    ghost: 'text-slate-400 hover:text-slate-200 hover:bg-white/5 bg-transparent'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
    full: 'w-full py-3.5 text-base'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} disabled:opacity-40 disabled:pointer-events-none`}
      style={{ touchAction: 'manipulation' }}
      {...props}
    >
      {children}
    </button>
  );
};
export default Button;
