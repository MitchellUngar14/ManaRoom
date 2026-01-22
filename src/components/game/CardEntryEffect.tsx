'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CardEntryEffectProps {
  x: number; // percentage 0-1
  y: number; // percentage 0-1
  onComplete: () => void;
}

// Generate random particles
function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (Math.random() * 360) * (Math.PI / 180),
    distance: 50 + Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 0.4 + Math.random() * 0.4,
    delay: Math.random() * 0.15,
  }));
}

export function CardEntryEffect({ x, y, onComplete }: CardEntryEffectProps) {
  const [particles] = useState(() => generateParticles(24));
  const [sparks] = useState(() => generateParticles(12));

  useEffect(() => {
    const timer = setTimeout(onComplete, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 100,
      }}
    >
      {/* Central flash */}
      <motion.div
        key="flash"
        className="absolute rounded-full"
        style={{
          width: 80,
          height: 80,
          left: -40,
          top: -40,
          background: `radial-gradient(circle, var(--theme-accent-bright) 0%, var(--theme-accent) 30%, transparent 70%)`,
        }}
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />

      {/* Magic ring */}
      <motion.div
        key="ring"
        className="absolute rounded-full"
        style={{
          width: 60,
          height: 60,
          left: -30,
          top: -30,
          border: '2px solid var(--theme-accent)',
          boxShadow: '0 0 20px var(--theme-accent), inset 0 0 20px var(--theme-accent-glow)',
        }}
        initial={{ scale: 0.5, opacity: 1 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />

        {/* Particles bursting outward */}
        {particles.map((particle) => (
          <motion.div
            key={`particle-${particle.id}`}
            className="absolute rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              left: -particle.size / 2,
              top: -particle.size / 2,
              backgroundColor: 'var(--theme-accent-bright)',
              boxShadow: `0 0 ${particle.size * 2}px var(--theme-accent)`,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(particle.angle) * particle.distance,
              y: Math.sin(particle.angle) * particle.distance,
              opacity: 0,
              scale: 0,
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              ease: 'easeOut',
            }}
          />
        ))}

        {/* Sparks - smaller, faster */}
        {sparks.map((spark) => (
          <motion.div
            key={`spark-${spark.id}`}
            className="absolute"
            style={{
              width: 1,
              height: spark.size * 3,
              left: 0,
              top: -spark.size * 1.5,
              backgroundColor: 'var(--theme-accent-bright)',
              boxShadow: `0 0 4px var(--theme-accent)`,
              transformOrigin: 'center center',
              rotate: `${spark.angle * (180 / Math.PI)}deg`,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scaleY: 1 }}
            animate={{
              x: Math.cos(spark.angle) * spark.distance * 1.5,
              y: Math.sin(spark.angle) * spark.distance * 1.5,
              opacity: 0,
              scaleY: 0.3,
            }}
            transition={{
              duration: spark.duration * 0.7,
              delay: spark.delay * 0.5,
              ease: 'easeOut',
            }}
          />
        ))}

        {/* Arcane symbols floating up */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`symbol-${i}`}
            className="absolute text-xs font-bold"
            style={{
              left: -20 + i * 20,
              top: 0,
              color: 'var(--theme-accent)',
              textShadow: '0 0 8px var(--theme-accent)',
              fontFamily: 'serif',
            }}
            initial={{ y: 0, opacity: 0.8, scale: 1 }}
            animate={{ y: -60 - i * 10, opacity: 0, scale: 0.5 }}
            transition={{
              duration: 0.8,
              delay: 0.1 + i * 0.1,
              ease: 'easeOut',
            }}
          >
            ✦
          </motion.div>
        ))}
    </div>
  );
}
