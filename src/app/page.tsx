'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';

// Floating mana symbols for background ambiance
function FloatingManaSymbols() {
  const symbols = ['W', 'U', 'B', 'R', 'G'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {symbols.map((symbol, i) => (
        <div
          key={i}
          className="absolute text-4xl opacity-5 mana-float"
          style={{
            left: `${15 + i * 18}%`,
            top: `${20 + (i % 3) * 25}%`,
            animationDelay: `${i * 1.5}s`,
            color: symbol === 'W' ? '#f9fafb' :
                   symbol === 'U' ? '#3b82f6' :
                   symbol === 'B' ? '#6b7280' :
                   symbol === 'R' ? '#ef4444' : '#22c55e',
          }}
        >
          {symbol === 'W' ? '☀' :
           symbol === 'U' ? '💧' :
           symbol === 'B' ? '💀' :
           symbol === 'R' ? '🔥' : '🌲'}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [showRegister, setShowRegister] = useState(false);

  return (
    <main className="planeswalker-gate min-h-screen flex flex-col items-center justify-center p-8">
      <FloatingManaSymbols />

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Title with magical glow */}
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent drop-shadow-lg">
            ManaRoom
          </h1>
          <p className="text-gray-400 text-lg">Enter the Multiverse</p>
          <p className="text-gray-500 text-sm mt-1">Play Commander with friends online</p>
        </div>

        {/* Portal frame container */}
        <div className="portal-frame rounded-xl p-8 space-y-6">
          {showRegister ? (
            <>
              <RegisterForm onSuccess={() => setShowRegister(false)} />
              <p className="text-center text-sm text-gray-400">
                Already have an account?{' '}
                <button
                  onClick={() => setShowRegister(false)}
                  className="text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Sign in
                </button>
              </p>
            </>
          ) : (
            <>
              <LoginForm />
              <p className="text-center text-sm text-gray-400">
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => setShowRegister(true)}
                  className="text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Register
                </button>
              </p>
            </>
          )}
        </div>

        {/* Guest link */}
        <div className="text-center">
          <Link
            href="/lobby"
            className="text-sm text-gray-500 hover:text-purple-400 transition-colors"
          >
            Continue as guest (limited features)
          </Link>
        </div>
      </div>
    </main>
  );
}
