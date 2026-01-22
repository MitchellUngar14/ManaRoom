'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

interface LogoLoaderProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

interface Sparkle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  angle: number;
  distance: number;
  startDistance: number;
}

export function LogoLoader({ size = 'medium', showText = true }: LogoLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const sparklesRef = useRef<Sparkle[]>([]);

  const sizeMap = {
    small: { logo: 120, canvas: 180 },
    medium: { logo: 200, canvas: 300 },
    large: { logo: 300, canvas: 450 },
  };

  const dimensions = sizeMap[size];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize sparkles
    const createSparkle = (): Sparkle => {
      const angle = Math.random() * Math.PI * 2;
      const startDistance = dimensions.logo * 0.3 + Math.random() * dimensions.logo * 0.2;
      return {
        x: 0,
        y: 0,
        size: 1 + Math.random() * 3,
        opacity: 0.3 + Math.random() * 0.7,
        speed: 0.3 + Math.random() * 0.5,
        angle,
        distance: startDistance,
        startDistance,
      };
    };

    // Create initial sparkles
    sparklesRef.current = Array.from({ length: 30 }, createSparkle);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      sparklesRef.current.forEach((sparkle, index) => {
        // Update position - sparkles orbit around the logo
        sparkle.angle += sparkle.speed * 0.02;

        // Pulsating distance
        const pulseFactor = Math.sin(Date.now() * 0.002 + index) * 0.1 + 1;
        const currentDistance = sparkle.startDistance * pulseFactor;

        sparkle.x = centerX + Math.cos(sparkle.angle) * currentDistance;
        sparkle.y = centerY + Math.sin(sparkle.angle) * currentDistance;

        // Pulsating opacity
        const opacityPulse = Math.sin(Date.now() * 0.003 + index * 0.5) * 0.3 + 0.7;
        const finalOpacity = sparkle.opacity * opacityPulse;

        // Draw sparkle with glow
        ctx.save();

        // Outer glow
        const gradient = ctx.createRadialGradient(
          sparkle.x, sparkle.y, 0,
          sparkle.x, sparkle.y, sparkle.size * 4
        );
        gradient.addColorStop(0, `rgba(135, 206, 250, ${finalOpacity * 0.8})`);
        gradient.addColorStop(0.3, `rgba(100, 180, 255, ${finalOpacity * 0.4})`);
        gradient.addColorStop(1, 'rgba(100, 180, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(sparkle.x, sparkle.y, sparkle.size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Core sparkle
        ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity})`;
        ctx.beginPath();
        ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
        ctx.fill();

        // Cross flare effect for larger sparkles
        if (sparkle.size > 2) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${finalOpacity * 0.6})`;
          ctx.lineWidth = 1;
          const flareSize = sparkle.size * 3;

          ctx.beginPath();
          ctx.moveTo(sparkle.x - flareSize, sparkle.y);
          ctx.lineTo(sparkle.x + flareSize, sparkle.y);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(sparkle.x, sparkle.y - flareSize);
          ctx.lineTo(sparkle.x, sparkle.y + flareSize);
          ctx.stroke();
        }

        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions]);

  return (
    <div className="logo-loader-container" style={{ width: dimensions.canvas, height: dimensions.canvas + (showText ? 40 : 0) }}>
      <div className="logo-loader-wrapper" style={{ width: dimensions.canvas, height: dimensions.canvas }}>
        <canvas
          ref={canvasRef}
          width={dimensions.canvas}
          height={dimensions.canvas}
          className="logo-loader-canvas"
        />
        <div className="logo-loader-image" style={{ width: dimensions.logo, height: dimensions.logo }}>
          <Image
            src="/manaroom-logo.png"
            alt="ManaRoom"
            width={dimensions.logo}
            height={dimensions.logo}
            priority
            className="logo-loader-img"
          />
        </div>
      </div>
      {showText && (
        <p className="logo-loader-text">Loading...</p>
      )}
    </div>
  );
}
