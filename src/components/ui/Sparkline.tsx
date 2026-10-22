import React from 'react';

export interface SparklineProps {
  data: number[];
  width?: number | string;
  height?: number;
  color?: string;
  fillColor?: string;
  showPoints?: boolean;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = '100%',
  height = 42,
  color = 'var(--primary)',
  fillColor = 'var(--primary-soft)',
  showPoints = true,
  className = ''
}) => {
  if (!data || data.length < 2) {
    return <div className="h-10 text-xs font-mono text-muted flex items-center">No trend data</div>;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 4;
  const svgHeight = height;
  const svgWidth = 200; // viewBox width

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * (svgWidth - padding * 2);
    const y = svgHeight - padding - ((val - min) / range) * (svgHeight - padding * 2);
    return { x, y };
  });

  const pathD = points.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${svgHeight} L ${points[0].x.toFixed(1)} ${svgHeight} Z`;

  return (
    <div className={`overflow-hidden ${className}`} style={{ width, height }}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="none"
        className="w-full h-full overflow-visible"
      >
        <path d={areaD} fill={fillColor} />
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {showPoints && (
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="3"
            fill={color}
            stroke="var(--surface)"
            strokeWidth="1.5"
          />
        )}
      </svg>
    </div>
  );
};
