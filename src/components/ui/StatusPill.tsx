import React from 'react';

export type StatusPillVariant =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'primary'
  | 'live';

export interface StatusPillProps {
  label?: string | React.ReactNode;
  children?: React.ReactNode;
  variant?: StatusPillVariant;
  size?: 'sm' | 'md';
  icon?: React.ComponentType<{ className?: string }>;
  pulse?: boolean;
  className?: string;
  title?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  label,
  children,
  variant = 'neutral',
  size = 'sm',
  icon: Icon,
  pulse = false,
  className = '',
  title
}) => {
  const sizeClasses = size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-xs';

  let variantClasses = '';
  switch (variant) {
    case 'success':
      variantClasses = 'bg-success-soft text-success-token border-[color:color-mix(in_srgb,var(--success)_40%,transparent)]';
      break;
    case 'warning':
      variantClasses = 'bg-warning-soft text-warning-token border-[color:color-mix(in_srgb,var(--warning)_40%,transparent)]';
      break;
    case 'danger':
      variantClasses = 'bg-danger-soft text-danger-token border-[color:color-mix(in_srgb,var(--danger)_40%,transparent)]';
      break;
    case 'info':
      variantClasses = 'bg-info-soft text-info-token border-[color:color-mix(in_srgb,var(--info)_40%,transparent)]';
      break;
    case 'primary':
      variantClasses = 'bg-primary-soft text-primary-token border-[color:color-mix(in_srgb,var(--primary)_40%,transparent)]';
      break;
    case 'live':
      variantClasses = 'bg-danger-soft text-live-token border-[color:color-mix(in_srgb,var(--live)_40%,transparent)]';
      break;
    case 'neutral':
    default:
      variantClasses = 'bg-surface-3 text-token border-strong';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded font-mono font-semibold border ${sizeClasses} ${variantClasses} ${className}`}
      title={title}
    >
      {pulse || variant === 'live' ? (
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-live" />
        </span>
      ) : null}
      {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      <span className="truncate">{children ?? label}</span>
    </span>
  );
};
