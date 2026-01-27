'use client';

import { useMemo } from 'react';

interface ZoneGlowEffectProps {
  particleCount?: number;
  intensity?: 'subtle' | 'medium' | 'strong';
}

interface ParticleStyle {
  left: string;
  animationDelay: string;
  animationDuration: string;
  size: number;
  opacity: number;
}

export function ZoneGlowEffect({
  particleCount = 12,
  intensity = 'subtle'
}: ZoneGlowEffectProps) {
  // Generate random but stable particle configurations
  const particles = useMemo<ParticleStyle[]>(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      left: `${5 + (i * (90 / particleCount)) + Math.random() * (80 / particleCount)}%`,
      animationDelay: `${Math.random() * 4}s`,
      animationDuration: `${3 + Math.random() * 3}s`,
      size: 2 + Math.random() * 3,
      opacity: 0.3 + Math.random() * 0.5,
    }));
  }, [particleCount]);

  const glowOpacity = intensity === 'subtle' ? 0.3 : intensity === 'medium' ? 0.5 : 0.7;
  const glowHeight = intensity === 'subtle' ? '60px' : intensity === 'medium' ? '80px' : '100px';

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Bottom glow effect */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: glowHeight,
          background: `linear-gradient(to top, var(--theme-accent-glow), transparent)`,
          opacity: glowOpacity,
        }}
      />

      {/* Subtle pulsing glow layer */}
      <div
        className="absolute bottom-0 left-0 right-0 animate-pulse"
        style={{
          height: '40px',
          background: `linear-gradient(to top, var(--theme-accent), transparent)`,
          opacity: glowOpacity * 0.3,
          filter: 'blur(8px)',
        }}
      />

      {/* Rising particles */}
      {particles.map((particle, i) => (
        <div
          key={i}
          className="zone-glow-particle"
          style={{
            left: particle.left,
            animationDelay: particle.animationDelay,
            animationDuration: particle.animationDuration,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            '--particle-opacity': particle.opacity,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
