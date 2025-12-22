import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'compact';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ variant = 'default', className = '', ...props }, ref) => {
    const baseStyles = 'bg-white border border-slate-200 rounded-lg text-sm focus:border-slate-400 outline-none transition-colors';
    const variantStyles = {
      default: 'px-3 py-2',
      compact: 'px-2 py-1.5',
    };

    return (
      <input
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
