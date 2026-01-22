'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function Home() {
  const router = useRouter();
  const [showRegister, setShowRegister] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check if already logged in
  useEffect(() => {
    setMounted(true);
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          router.push('/lobby');
        }
      } catch {
        // Not logged in, stay on login page
      }
    };
    checkAuth();
  }, [router]);

  return (
    <main className="login-page">
      {/* Ambient background effects */}
      <div className="login-ambient" />

      {/* Floating particles */}
      <div className="login-particles" />

      {/* Main content */}
      <div className={`login-container ${mounted ? 'mounted' : ''}`}>
        {/* Logo section */}
        <div className="login-hero">
          <div className="login-logo-wrapper">
            <Image
              src="/manaroom-logo.png"
              alt="ManaRoom"
              width={180}
              height={180}
              priority
              className="login-logo-img"
            />
            <div className="login-logo-glow" />
          </div>

          <div className="login-hero-text">
            <p className="login-tagline">The Summoner&apos;s Sanctum</p>
            <p className="login-description">Play Commander with friends online</p>
          </div>
        </div>

        {/* Auth panel */}
        <div className="login-panel">
          <div className="login-panel-header">
            <button
              onClick={() => setShowRegister(false)}
              className={`login-tab ${!showRegister ? 'active' : ''}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setShowRegister(true)}
              className={`login-tab ${showRegister ? 'active' : ''}`}
            >
              Register
            </button>
          </div>

          <div className="login-panel-content">
            {showRegister ? (
              <RegisterForm onSuccess={() => setShowRegister(false)} />
            ) : (
              <LoginForm />
            )}
          </div>

        </div>
      </div>

      {/* Decorative corner flourishes */}
      <div className="login-flourish login-flourish-tl" />
      <div className="login-flourish login-flourish-br" />
    </main>
  );
}
