import React from 'react';

export interface StatusChipProps {
  label: React.ReactNode;
  variant?: 'live' | 'cyan' | 'magenta' | 'amber' | 'emerald' | 'danger' | 'dim';
  size?: 'sm' | 'md';
  pulse?: boolean;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  label,
  variant = 'cyan',
  size = 'md',
  pulse = false,
  icon,
  className = '',
  onClick
}) => {
  const variantStyles = {
    live: 'bg-danger-soft text-live-token border-[color:color-mix(in_srgb,var(--live)_40%,transparent)]',
    danger: 'bg-danger-soft text-danger-token border-[color:color-mix(in_srgb,var(--danger)_40%,transparent)]',
    cyan: 'bg-primary-soft text-primary-token border-[color:color-mix(in_srgb,var(--primary)_40%,transparent)]',
    magenta: 'bg-secondary-soft text-secondary-token border-[color:color-mix(in_srgb,var(--secondary)_40%,transparent)]',
    amber: 'bg-warning-soft text-warning-token border-[color:color-mix(in_srgb,var(--warning)_40%,transparent)]',
    emerald: 'bg-success-soft text-success-token border-[color:color-mix(in_srgb,var(--success)_40%,transparent)]',
    dim: 'bg-surface-3 text-token border-strong'
  };

  const dotColors = {
    live: 'bg-live',
    danger: 'bg-danger',
    cyan: 'bg-primary',
    magenta: 'bg-secondary',
    amber: 'bg-warning',
    emerald: 'bg-success',
    dim: 'bg-text-faint'
  };

  const sizeStyles =
    size === 'sm'
      ? 'text-xs py-0.5 px-2 tracking-wider'
      : 'text-xs py-1 px-2.5 tracking-wide';

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 font-mono uppercase font-semibold border rounded-sm transition-colors ${
        variantStyles[variant]
      } ${sizeStyles} ${className} ${onClick ? 'cursor-pointer hover:brightness-110' : ''}`}
    >
      {pulse ? (
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors[variant]}`}
          />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColors[variant]}`} />
        </span>
      ) : icon ? (
        <span className="flex-shrink-0 text-xs">{icon}</span>
      ) : null}
      <span className="truncate">{label}</span>
    </span>
  );
};
