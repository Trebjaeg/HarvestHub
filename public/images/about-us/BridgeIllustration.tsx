import React from 'react';

interface BridgeIllustrationProps {
  className?: string;
}

const BridgeIllustration: React.FC<BridgeIllustrationProps> = ({ className = "" }) => {
  return (
    <svg 
      viewBox="0 0 800 200" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradient for the bridge */}
        <linearGradient id="bridgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        
        {/* Gradient for the bridge glow */}
        <linearGradient id="bridgeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
          <stop offset="25%" stopColor="#14B8A6" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.7" />
          <stop offset="75%" stopColor="#14B8A6" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
        </linearGradient>

        {/* Filter for glow effect */}
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Filter for soft shadow */}
        <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#10B981" floodOpacity="0.3"/>
        </filter>
      </defs>

      {/* Water/River underneath */}
      <path 
        d="M 0 140 Q 200 130 400 140 T 800 140 L 800 200 L 0 200 Z"
        fill="url(#bridgeGlow)"
        opacity="0.2"
      />

      {/* Bridge foundation pillars */}
      <rect x="150" y="120" width="8" height="80" fill="url(#bridgeGradient)" />
      <rect x="320" y="110" width="10" height="90" fill="url(#bridgeGradient)" />
      <rect x="470" y="110" width="10" height="90" fill="url(#bridgeGradient)" />
      <rect x="640" y="120" width="8" height="80" fill="url(#bridgeGradient)" />

      {/* Main bridge arch */}
      <path 
        d="M 50 150 Q 154 120 158 150 Q 324 100 328 150 Q 474 100 478 150 Q 644 120 750 150"
        stroke="url(#bridgeGradient)"
        strokeWidth="6"
        fill="none"
        filter="url(#glow)"
      />

      {/* Bridge deck */}
      <path 
        d="M 30 150 L 770 150"
        stroke="url(#bridgeGradient)"
        strokeWidth="4"
        filter="url(#softShadow)"
      />

      {/* Decorative cable lines */}
      <path d="M 158 150 L 200 100 L 240 150" stroke="url(#bridgeGradient)" strokeWidth="1.5" opacity="0.7" />
      <path d="M 328 150 L 370 90 L 410 150" stroke="url(#bridgeGradient)" strokeWidth="1.5" opacity="0.7" />
      <path d="M 478 150 L 520 90 L 560 150" stroke="url(#bridgeGradient)" strokeWidth="1.5" opacity="0.7" />

      {/* Farmers side (left) */}
      <g id="farmers-side">
        <circle cx="80" cy="135" r="6" fill="#10B981" opacity="0.8" />
        <circle cx="100" cy="140" r="4" fill="#059669" opacity="0.7" />
        <circle cx="120" cy="138" r="5" fill="#047857" opacity="0.6" />
        <text x="100" y="170" textAnchor="middle" className="text-xs fill-green-400" opacity="0.8">
          Farmers
        </text>
      </g>

      {/* Buyers side (right) */}
      <g id="buyers-side">
        <circle cx="680" cy="135" r="6" fill="#10B981" opacity="0.8" />
        <circle cx="700" cy="140" r="4" fill="#059669" opacity="0.7" />
        <circle cx="720" cy="138" r="5" fill="#047857" opacity="0.6" />
        <text x="700" y="170" textAnchor="middle" className="text-xs fill-green-400" opacity="0.8">
          Buyers
        </text>
      </g>

      {/* Connection flow particles */}
      <circle className="bridge-particle-1" cx="200" cy="150" r="2" fill="#10B981" opacity="0.6">
        <animate attributeName="cx" values="200;600;200" dur="6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;1;0.6" dur="6s" repeatCount="indefinite" />
      </circle>
      
      <circle className="bridge-particle-2" cx="600" cy="150" r="2" fill="#14B8A6" opacity="0.5">
        <animate attributeName="cx" values="600;200;600" dur="8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0.9;0.5" dur="8s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
};

export default BridgeIllustration;