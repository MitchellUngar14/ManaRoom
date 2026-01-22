'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      router.push('/lobby');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-2xl font-semibold text-center bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent">
        Enter the Battlefield
      </h2>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm text-gray-400 mb-1.5">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm text-gray-400 mb-1.5">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-magical w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-purple-800 disabled:to-purple-900 disabled:cursor-not-allowed rounded-lg font-medium text-white shadow-lg shadow-purple-900/30 transition-all"
      >
        {loading ? 'Planeswalking...' : 'Enter'}
      </button>
    </form>
  );
}
