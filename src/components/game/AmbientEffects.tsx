'use client';

import { useEffect, useRef, useMemo } from 'react';
import { BattlefieldTheme } from '@/lib/themes';

interface AmbientEffectsProps {
  theme: BattlefieldTheme;
  disabled?: boolean;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  rotation?: number;
  rotationSpeed?: number;
}

export function AmbientEffects({ theme, disabled = false }: AmbientEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Particle[]>([]);

  const { ambientEnabled, ambientType, ambientColor, ambientOpacity } = theme.effects;

  // Parse hex color to RGB
  const rgbColor = useMemo(() => {
    const hex = ambientColor.replace('#', '');
    return {
      r: parseInt(hex.substring(0, 2), 16) || 255,
      g: parseInt(hex.substring(2, 4), 16) || 255,
      b: parseInt(hex.substring(4, 6), 16) || 255,
    };
  }, [ambientColor]);

  useEffect(() => {
    if (!ambientEnabled || disabled || ambientType === 'none') {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles based on type
    const initParticles = () => {
      const particles: Particle[] = [];
      const count = getParticleCount(ambientType);

      for (let i = 0; i < count; i++) {
        particles.push(createParticle(ambientType, canvas.width, canvas.height));
      }
      particlesRef.current = particles;
    };

    const getParticleCount = (type: string): number => {
      switch (type) {
        case 'stars': return 100;
        case 'rain': return 150;
        case 'embers': return 40;
        case 'fire': return 30;
        case 'petals': return 25;
        case 'particles': return 50;
        default: return 50;
      }
    };

    const createParticle = (type: string, width: number, height: number): Particle => {
      const base: Particle = {
        x: Math.random() * width,
        y: Math.random() * height,
        size: 2 + Math.random() * 3,
        speedX: 0,
        speedY: 0,
        opacity: 0.3 + Math.random() * 0.7,
      };

      switch (type) {
        case 'stars':
          return {
            ...base,
            size: 1 + Math.random() * 2,
            speedX: 0,
            speedY: 0,
            opacity: Math.random(),
          };
        case 'rain':
          return {
            ...base,
            x: Math.random() * width,
            y: Math.random() * height - height,
            size: 1,
            speedX: -0.5,
            speedY: 8 + Math.random() * 4,
            opacity: 0.2 + Math.random() * 0.3,
          };
        case 'embers':
        case 'fire':
          return {
            ...base,
            y: height + Math.random() * 100,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: -1 - Math.random() * 2,
            size: 2 + Math.random() * 4,
          };
        case 'petals':
          return {
            ...base,
            speedX: 0.5 + Math.random() * 1,
            speedY: 0.5 + Math.random() * 1,
            size: 3 + Math.random() * 5,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.05,
          };
        case 'particles':
        default:
          return {
            ...base,
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: -0.2 - Math.random() * 0.5,
            size: 2 + Math.random() * 3,
          };
      }
    };

    const updateParticle = (p: Particle, type: string, width: number, height: number): void => {
      switch (type) {
        case 'stars':
          // Twinkle effect
          p.opacity += (Math.random() - 0.5) * 0.1;
          p.opacity = Math.max(0.1, Math.min(1, p.opacity));
          break;

        case 'rain':
          p.x += p.speedX;
          p.y += p.speedY;
          if (p.y > height) {
            p.y = -10;
            p.x = Math.random() * width;
          }
          break;

        case 'embers':
        case 'fire':
          p.x += p.speedX + Math.sin(Date.now() * 0.001 + p.y * 0.01) * 0.3;
          p.y += p.speedY;
          p.opacity -= 0.003;
          if (p.y < -50 || p.opacity <= 0) {
            p.y = height + Math.random() * 50;
            p.x = Math.random() * width;
            p.opacity = 0.5 + Math.random() * 0.5;
          }
          break;

        case 'petals':
          p.x += p.speedX + Math.sin(Date.now() * 0.001 + p.y * 0.01) * 0.5;
          p.y += p.speedY;
          if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
            p.rotation += p.rotationSpeed;
          }
          if (p.y > height + 20 || p.x > width + 20) {
            p.y = -20;
            p.x = Math.random() * width;
          }
          break;

        case 'particles':
        default:
          p.x += p.speedX;
          p.y += p.speedY;
          p.opacity -= 0.002;
          if (p.y < -50 || p.opacity <= 0) {
            p.y = height + Math.random() * 50;
            p.x = Math.random() * width;
            p.opacity = 0.3 + Math.random() * 0.7;
          }
          break;
      }
    };

    const drawParticle = (ctx: CanvasRenderingContext2D, p: Particle, type: string): void => {
      ctx.save();
      const { r, g, b } = rgbColor;

      switch (type) {
        case 'stars':
          // Draw star with glow
          ctx.globalAlpha = p.opacity * ambientOpacity;
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
          ctx.shadowBlur = 5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'rain':
          ctx.globalAlpha = p.opacity * ambientOpacity;
          ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.lineWidth = p.size;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.speedX * 2, p.y + p.speedY * 2);
          ctx.stroke();
          break;

        case 'embers':
        case 'fire':
          ctx.globalAlpha = p.opacity * ambientOpacity;
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'petals':
          ctx.globalAlpha = p.opacity * ambientOpacity;
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.translate(p.x, p.y);
          if (p.rotation !== undefined) {
            ctx.rotate(p.rotation);
          }
          // Draw simple petal shape
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'particles':
        default:
          ctx.globalAlpha = p.opacity * ambientOpacity;
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
      }

      ctx.restore();
    };

    initParticles();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        updateParticle(p, ambientType, canvas.width, canvas.height);
        drawParticle(ctx, p, ambientType);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [ambientEnabled, ambientType, rgbColor, ambientOpacity, disabled]);

  if (!ambientEnabled || disabled || ambientType === 'none') {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 1 }}
    />
  );
}
