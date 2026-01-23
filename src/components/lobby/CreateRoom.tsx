'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface CreateRoomProps {
  selectedDeckId: string | null;
  onRoomCreated: (roomKey: string) => void;
  disabled: boolean;
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

export function CreateRoom({ selectedDeckId, onRoomCreated, disabled }: CreateRoomProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const sparklesRef = useRef<Sparkle[]>([]);

  const logoSize = 200;
  const canvasSize = 320;

  // Sparkle animation when active (grimoire selected)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Only animate when active
    if (disabled) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
      return;
    }

    // Initialize sparkles
    const createSparkle = (): Sparkle => {
      const angle = Math.random() * Math.PI * 2;
      const startDistance = logoSize * 0.4 + Math.random() * logoSize * 0.3;
      return {
        x: 0,
        y: 0,
        size: 1.5 + Math.random() * 3,
        opacity: 0.4 + Math.random() * 0.6,
        speed: 0.3 + Math.random() * 0.5,
        angle,
        distance: startDistance,
        startDistance,
      };
    };

    // Create sparkles
    sparklesRef.current = Array.from({ length: 32 }, createSparkle);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      sparklesRef.current.forEach((sparkle, index) => {
        // Update position - sparkles orbit around the logo
        sparkle.angle += sparkle.speed * 0.018;

        // Pulsating distance
        const pulseFactor = Math.sin(Date.now() * 0.002 + index) * 0.12 + 1;
        const currentDistance = sparkle.startDistance * pulseFactor;

        sparkle.x = centerX + Math.cos(sparkle.angle) * currentDistance;
        sparkle.y = centerY + Math.sin(sparkle.angle) * currentDistance;

        // Pulsating opacity
        const opacityPulse = Math.sin(Date.now() * 0.003 + index * 0.5) * 0.3 + 0.7;
        const finalOpacity = sparkle.opacity * opacityPulse;

        // Draw sparkle with glow
        ctx.save();

        // Outer glow - blue/cyan magical color
        const gradient = ctx.createRadialGradient(
          sparkle.x, sparkle.y, 0,
          sparkle.x, sparkle.y, sparkle.size * 4
        );
        gradient.addColorStop(0, `rgba(100, 200, 255, ${finalOpacity * 0.9})`);
        gradient.addColorStop(0.3, `rgba(80, 160, 255, ${finalOpacity * 0.5})`);
        gradient.addColorStop(1, 'rgba(80, 160, 255, 0)');

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
        if (sparkle.size > 1.8) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${finalOpacity * 0.5})`;
          ctx.lineWidth = 0.8;
          const flareSize = sparkle.size * 2.5;

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
  }, [disabled, logoSize]);

  const handleCreate = async () => {
    if (!selectedDeckId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckId: selectedDeckId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room');
      }

      // Store selected deck and creator flag for the room page
      sessionStorage.setItem('selectedDeckId', selectedDeckId);
      sessionStorage.setItem('isRoomCreator', 'true');

      // Get display name from auth
      const authRes = await fetch('/api/auth/me');
      if (authRes.ok) {
        const authData = await authRes.json();
        sessionStorage.setItem('displayName', authData.user?.displayName || 'Player');
      }

      onRoomCreated(data.roomKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portal-logo-container">
      {/* Clickable logo button with sparkle canvas */}
      <button
        onClick={handleCreate}
        disabled={disabled || loading}
        className={`portal-logo-button ${disabled ? 'portal-dormant' : 'portal-active'} ${loading ? 'portal-loading' : ''}`}
      >
        {/* Sparkle animation canvas */}
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          className="portal-sparkle-canvas"
        />

        {/* Logo image */}
        <div className="portal-logo-wrapper" style={{ width: logoSize, height: logoSize }}>
          <Image
            src="/manaroom-logo.png"
            alt="Create Room"
            width={logoSize}
            height={logoSize}
            priority
            className="portal-logo-img"
          />
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="portal-loading-overlay">
            <div className="portal-loading-spinner" />
          </div>
        )}
      </button>

      {/* Label - only show status messages */}
      {(loading || disabled) && (
        <div className="portal-label">
          <p className="portal-label-main">
            {loading ? 'Opening Portal...' : 'Select a Grimoire'}
          </p>
          {disabled && (
            <p className="portal-label-sub">
              Choose your deck to activate
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="portal-error">
          {error}
        </div>
      )}
    </div>
  );
}
