import React from 'react';
import { getConnectionColor } from '../../services/connectionStrength';

const CircleVisualization = ({ slots, connectionStrengths, loadingConnections }) => {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0, overflow: 'visible' }}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Define gradients and filters for all lines */}
        {slots.map((bestie, index) => {
          if (!bestie) return null;

          const connectionStrength = connectionStrengths[bestie.id];
          const strengthScore = connectionStrength?.total || 0;
          const connectionColor = getConnectionColor(strengthScore);
          const opacity = 0.2 + (strengthScore / 100) * 0.6;

          return (
            <React.Fragment key={`defs-${index}`}>
              <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={connectionColor} stopOpacity={opacity} />
                <stop offset="50%" stopColor={connectionColor} stopOpacity={opacity * 1.5} />
                <stop offset="100%" stopColor={connectionColor} stopOpacity={opacity} />
              </linearGradient>
              <filter id={`glow-${index}`}>
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </React.Fragment>
          );
        })}
      </defs>

      {/* Connection Lines with Dynamic Strength */}
      {slots.map((bestie, index) => {
        if (!bestie) return null;
        const angle = ((index * 72) - 90) * (Math.PI / 180);
        const radius = 45; // Viewbox units
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);

        const connectionStrength = connectionStrengths[bestie.id];
        const strengthScore = connectionStrength?.total || 0;

        // Line opacity and animation based on strength
        const strokeWidth = 1 + (strengthScore / 100) * 2;

        return (
          <React.Fragment key={`line-${index}`}>
            <line
              x1="50"
              y1="50"
              x2={x}
              y2={y}
              stroke={`url(#gradient-${index})`}
              strokeWidth={strokeWidth}
              strokeDasharray="4 2"
              filter={`url(#glow-${index})`}
              className="animate-pulse-connection"
            />

            {/* Flowing particles - always visible, more for stronger connections */}
            {/* Primary particle - always flows */}
            <circle
              cx="50"
              cy="50"
              r={strengthScore >= 50 ? "4" : "3"}
              fill="#10b981"
              opacity={0.4 + (strengthScore / 100) * 0.6}
              className="animate-particle"
              style={{
                '--target-x': `${x}`,
                '--target-y': `${y}`,
                animationDelay: `${index * 0.5}s`,
                animationDuration: strengthScore >= 70 ? '2s' : '3s',
              }}
            />
            {/* Secondary particle for strong connections */}
            {strengthScore >= 50 && (
              <circle
                cx="50"
                cy="50"
                r="3"
                fill="#34d399"
                opacity={0.5}
                className="animate-particle"
                style={{
                  '--target-x': `${x}`,
                  '--target-y': `${y}`,
                  animationDelay: `${index * 0.5 + 1}s`,
                  animationDuration: '2.5s',
                }}
              />
            )}
            {/* Third particle for unbreakable connections */}
            {strengthScore >= 90 && (
              <circle
                cx="50"
                cy="50"
                r="4"
                fill="#10b981"
                opacity={0.7}
                className="animate-particle"
                style={{
                  '--target-x': `${x}`,
                  '--target-y': `${y}`,
                  animationDelay: `${index * 0.5 + 0.5}s`,
                  animationDuration: '1.8s',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </svg>
  );
};

export default CircleVisualization;
