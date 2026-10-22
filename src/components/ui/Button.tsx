import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'warning' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ComponentType<{ className?: string }>;
  iconRight?: React.ComponentType<{ className?: string }>;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3.5 py-1.5 text-xs gap-2',
    lg: 'px-4 py-2 text-sm gap-2.5'
  }[size];

  const variantClasses = {
    primary:
      'bg-primary text-on-primary font-bold hover:brightness-110 active:scale-[0.98] border border-transparent shadow-sm',
    secondary:
      'bg-surface-3 text-token font-medium hover:bg-surface-2 hover:border-strong border-token shadow-sm',
    ghost:
      'bg-transparent text-muted hover:text-token hover:bg-surface-3 border border-transparent',
    success:
      'bg-success-soft text-success-token font-bold border-[color:color-mix(in_srgb,var(--success)_40%,transparent)] hover:bg-success hover:text-white active:scale-[0.98] shadow-sm',
    warning:
      'bg-warning-soft text-warning-token font-bold border-[color:color-mix(in_srgb,var(--warning)_40%,transparent)] hover:bg-warning hover:text-white active:scale-[0.98] shadow-sm',
    danger:
      'bg-danger-soft text-danger-token font-bold border-[color:color-mix(in_srgb,var(--danger)_40%,transparent)] hover:bg-danger hover:text-white active:scale-[0.98] shadow-sm'
  }[variant];

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center font-mono rounded transition-all cursor-pointer select-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2 ${
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
      } ${sizeClasses} ${variantClasses} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
      {children && <span>{children}</span>}
      {IconRight && <IconRight className="w-4 h-4 flex-shrink-0" />}
    </button>
  );
};
