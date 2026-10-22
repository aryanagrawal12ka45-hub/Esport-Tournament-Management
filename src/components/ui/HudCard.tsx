import React from 'react';

export interface HudCardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  clipCorner?: 'tl-br' | 'tr-bl' | 'all' | 'none';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'cyan' | 'magenta' | 'amber' | 'emerald';
  indicatorColor?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
  titleClassName?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export const HudCard: React.FC<HudCardProps> = ({
  title,
  subtitle,
  action,
  badge,
  clipCorner = 'none',
  variant = 'default',
  indicatorColor,
  className = '',
  titleClassName = '',
  children,
  onClick
}) => {
  const clipClass =
    clipCorner === 'tl-br'
      ? 'clip-corner-tl-br'
      : clipCorner === 'tr-bl'
      ? 'clip-corner-tr-bl'
      : clipCorner === 'all'
      ? 'clip-corner-all'
      : '';

  let borderVariantClass = 'border-token';
  const effectiveIndicator = indicatorColor || (variant === 'amber' ? 'warning' : variant === 'emerald' ? 'success' : variant === 'magenta' ? 'primary' : variant === 'cyan' ? 'info' : variant !== 'default' ? (variant as any) : undefined);

  if (effectiveIndicator === 'warning') {
    borderVariantClass = 'border-token border-l-4 border-l-[var(--warning)]';
  } else if (effectiveIndicator === 'success') {
    borderVariantClass = 'border-token border-l-4 border-l-[var(--success)]';
  } else if (effectiveIndicator === 'danger') {
    borderVariantClass = 'border-token border-l-4 border-l-[var(--danger)]';
  } else if (effectiveIndicator === 'info') {
    borderVariantClass = 'border-token border-l-4 border-l-[var(--info)]';
  } else if (effectiveIndicator === 'primary') {
    borderVariantClass = 'border-token border-l-4 border-l-[var(--primary)]';
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-lg p-4 md:p-5 transition-all duration-200 bg-surface border shadow-sm ${borderVariantClass} ${clipClass} ${className} ${
        onClick ? 'cursor-pointer hover:border-strong' : ''
      }`}
    >
      {(title || subtitle || action || badge) && (
        <div className="flex items-start justify-between gap-3 mb-3.5 pb-3.5 border-b border-token">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              {title && (
                <h3
                  className={`font-heading text-lg sm:text-xl md:text-2xl font-black tracking-wider uppercase text-token truncate ${titleClassName}`}
                >
                  {title}
                </h3>
              )}
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs sm:text-sm text-muted font-mono mt-1 truncate">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-1.5 flex-shrink-0">{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
