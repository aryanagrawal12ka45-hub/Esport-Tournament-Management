import React from 'react';

export interface RadialGaugeProps {
  value: number; // 0 to 100
  label: string;
  sublabel?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}

export const RadialGauge: React.FC<RadialGaugeProps> = ({
  value,
  label,
  sublabel,
  size = 110,
  strokeWidth = 9,
  color = 'var(--primary)',
  className = ''
}) => {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--border)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-heading text-lg font-bold text-token leading-tight">
            {Math.round(clamped)}%
          </span>
          <span className="text-xs font-mono text-muted uppercase tracking-wider">
            {sublabel || 'RATE'}
          </span>
        </div>
      </div>
      <span className="mt-2 text-xs font-mono font-medium text-muted uppercase tracking-wider text-center">
        {label}
      </span>
    </div>
  );
};
