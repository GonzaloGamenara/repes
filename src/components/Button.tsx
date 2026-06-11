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
    primary: 'bg-[#A3FF47] hover:bg-[#b5ff66] text-[#121212] font-black uppercase tracking-wider shadow-lg shadow-[#A3FF47]/10 active:scale-[0.96] border border-[#A3FF47]/20',
    secondary: 'bg-[#1E1E1E] border border-white/10 hover:bg-[#2A2A2A] text-white hover:text-white active:bg-white/10',
    outline: 'border border-white/10 hover:border-[#A3FF47]/40 hover:text-[#A3FF47] text-[#A0A0A0] bg-transparent',
    danger: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 active:bg-rose-500/30',
    ghost: 'text-[#A0A0A0] hover:text-slate-200 hover:bg-white/5 bg-transparent'
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
