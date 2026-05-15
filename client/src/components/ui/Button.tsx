import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}

export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, fullWidth, type = 'button', className = '' }: ButtonProps) {
  const base = 'font-semibold rounded-lg transition-all duration-100 flex items-center justify-center gap-2 active:scale-[0.97]';

  const variants = {
    primary: 'bg-accent text-black hover:bg-accent-warm',
    secondary: 'bg-bg-tertiary text-white border border-bg-tertiary hover:border-zinc-600',
    ghost: 'bg-transparent text-zinc-400 hover:text-white hover:bg-white/5 border border-bg-tertiary',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-3 text-[14px]',
    lg: 'px-6 py-3.5 text-[15px]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
