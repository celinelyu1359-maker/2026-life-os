import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    const baseStyles = 'rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2';
    
    const variantStyles = {
      primary: 'bg-slate-900 text-white hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed',
      secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300',
      ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
      icon: 'text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md',
    };

    const sizeStyles = {
      sm: variant === 'icon' ? 'p-1' : 'px-2 py-1 text-xs',
      md: variant === 'icon' ? 'p-1.5' : 'px-4 py-2 text-sm',
      lg: variant === 'icon' ? 'p-2' : 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
