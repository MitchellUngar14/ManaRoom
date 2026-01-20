'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function Home() {
  const [showRegister, setShowRegister] = useState(false);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">ManaRoom</h1>
          <p className="text-gray-400">Play Commander with friends online</p>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 space-y-6">
          {showRegister ? (
            <>
              <RegisterForm onSuccess={() => setShowRegister(false)} />
              <p className="text-center text-sm text-gray-400">
                Already have an account?{' '}
                <button
                  onClick={() => setShowRegister(false)}
                  className="text-blue-400 hover:underline"
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
                  className="text-blue-400 hover:underline"
                >
                  Register
                </button>
              </p>
            </>
          )}
        </div>

        <div className="text-center">
          <Link
            href="/lobby"
            className="text-sm text-gray-500 hover:text-gray-300"
          >
            Continue as guest (limited features)
          </Link>
        </div>
      </div>
    </main>
  );
}
