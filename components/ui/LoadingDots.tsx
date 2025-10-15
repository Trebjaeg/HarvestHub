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
    sm: { r: 6, positions: [20, 40, 60], cy: 10, bounce: 6 },
    md: { r: 8, positions: [30, 60, 90], cy: 15, bounce: 8 },
    lg: { r: 10, positions: [40, 80, 120], cy: 20, bounce: 10 }
  };

  const { r, positions, cy, bounce } = circleData[size];
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
            dur="0.8s"
            begin={`${index * 0.15}s`}
            repeatCount="indefinite"
            values={`${cy};${cy - bounce};${cy}`}
            keyTimes="0;0.5;1"
          />
          <animate
            attributeName="opacity"
            dur="0.8s"
            begin={`${index * 0.15}s`}
            repeatCount="indefinite"
            values="0.4;1;0.4"
            keyTimes="0;0.5;1"
          />
        </circle>
      ))}
    </svg>
  );
};

export default LoadingDots;