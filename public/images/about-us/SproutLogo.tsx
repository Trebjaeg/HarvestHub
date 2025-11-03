import React from 'react';

interface SproutLogoProps {
  className?: string;
}

const SproutLogo: React.FC<SproutLogoProps> = ({ className = "" }) => {
  return (
    <svg 
      viewBox="0 0 120 120" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradient for the sprout */}
        <radialGradient id="sproutGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22C55E" />
          <stop offset="50%" stopColor="#16A34A" />
          <stop offset="100%" stopColor="#15803D" />
        </radialGradient>

        {/* Glow gradient for the pulsing effect */}
        <radialGradient id="sproutGlow" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#22C55E" stopOpacity="0.8" />
          <stop offset="30%" stopColor="#10B981" stopOpacity="0.6" />
          <stop offset="60%" stopColor="#14B8A6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#22C55E" stopOpacity="0.2" />
        </radialGradient>

        {/* Filter for the pulsing glow */}
        <filter id="pulseGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Filter for outer halo */}
        <filter id="halo" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="8" result="glowBlur"/>
          <feMerge> 
            <feMergeNode in="glowBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Outer pulsing glow halo */}
      <circle 
        cx="60" 
        cy="60" 
        r="45" 
        fill="url(#sproutGlow)" 
        opacity="0.3"
        filter="url(#halo)"
        className="sprout-halo"
      >
        <animate attributeName="r" values="40;50;40" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.2;0.4;0.2" dur="3s" repeatCount="indefinite" />
      </circle>

      {/* Background circle for the logo */}
      <circle 
        cx="60" 
        cy="60" 
        r="35" 
        fill="rgba(16, 185, 129, 0.1)" 
        stroke="url(#sproutGradient)" 
        strokeWidth="2"
        filter="url(#pulseGlow)"
        className="sprout-bg"
      >
        <animate attributeName="r" values="33;37;33" dur="4s" repeatCount="indefinite" />
      </circle>

      {/* Stem */}
      <path 
        d="M 60 85 Q 58 70 60 55"
        stroke="url(#sproutGradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      {/* Left leaf */}
      <path 
        d="M 60 65 Q 45 60 42 45 Q 44 40 50 42 Q 58 48 60 65"
        fill="url(#sproutGradient)"
        className="sprout-leaf-left"
      >
        <animateTransform 
          attributeName="transform" 
          type="rotate"
          values="0 60 65; -2 60 65; 0 60 65"
          dur="5s" 
          repeatCount="indefinite"
        />
      </path>

      {/* Right leaf */}
      <path 
        d="M 60 55 Q 75 50 78 35 Q 76 30 70 32 Q 62 38 60 55"
        fill="url(#sproutGradient)"
        className="sprout-leaf-right"
      >
        <animateTransform 
          attributeName="transform" 
          type="rotate"
          values="0 60 55; 2 60 55; 0 60 55"
          dur="4s" 
          repeatCount="indefinite"
        />
      </path>

      {/* Central growing tip */}
      <ellipse 
        cx="60" 
        cy="45" 
        rx="4" 
        ry="6" 
        fill="url(#sproutGradient)"
        className="sprout-tip"
      >
        <animate attributeName="ry" values="6;8;6" dur="3s" repeatCount="indefinite" />
        <animate attributeName="rx" values="4;5;4" dur="3s" repeatCount="indefinite" />
      </ellipse>

      {/* Small particles around the sprout */}
      <circle cx="45" cy="40" r="1" fill="#22C55E" opacity="0.6" className="particle-1">
        <animate attributeName="cy" values="40;35;40" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;1;0.6" dur="4s" repeatCount="indefinite" />
      </circle>
      
      <circle cx="75" cy="48" r="1.5" fill="#10B981" opacity="0.5" className="particle-2">
        <animate attributeName="cy" values="48;43;48" dur="5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0.9;0.5" dur="5s" repeatCount="indefinite" />
      </circle>

      <circle cx="58" cy="35" r="1" fill="#14B8A6" opacity="0.7" className="particle-3">
        <animate attributeName="cy" values="35;30;35" dur="3.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;1;0.7" dur="3.5s" repeatCount="indefinite" />
      </circle>

      {/* HarvestHub text below (optional) */}
      <text 
        x="60" 
        y="105" 
        textAnchor="middle" 
        className="text-xs font-semibold fill-green-400" 
        style={{ fontFamily: 'Poppins, sans-serif' }}
        opacity="0.8"
      >
        HarvestHub
      </text>
    </svg>
  );
};

export default SproutLogo;