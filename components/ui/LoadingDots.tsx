import React from 'react';

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

const LoadingDots: React.FC<LoadingDotsProps> = ({ 
  size = 'md', 
  color = '#ffffff',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-6',
    md: 'w-12 h-8',
    lg: 'w-16 h-10'
  };

  const viewBoxes = {
    sm: '0 0 80 20',
    md: '0 0 120 30', 
    lg: '0 0 160 40'
  };

  const circleData = {
    sm: { r: 6, positions: [20, 40, 60], cy: 10 },
    md: { r: 8, positions: [30, 60, 90], cy: 15 },
    lg: { r: 10, positions: [40, 80, 120], cy: 20 }
  };

  const { r, positions, cy } = circleData[size];
  const viewBox = viewBoxes[size];

  return (
    <svg
      viewBox={viewBox}
      className={`${sizeClasses[size]} ${className}`}
      role="img"
      aria-label="loading"
      xmlns="http://www.w3.org/2000/svg"
    >
      {positions.map((cx, index) => (
        <circle key={index} cx={cx} cy={cy} r={r} fill={color}>
          <animate
            attributeName="cy"
            from={cy}
            to={cy}
            dur="0.6s"
            begin={`${index * 0.2}s`}
            repeatCount="indefinite"
            values={`${cy};${cy - 5};${cy}`}
            keyTimes="0;0.5;1"
          />
        </circle>
      ))}
    </svg>
  );
};

export default LoadingDots;