'use client';

import { useState } from 'react';

interface RegisterFormProps {
  onSuccess: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      onSuccess();
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}

      <div className="auth-field">
        <label htmlFor="displayName" className="auth-label">
          Planeswalker Name
        </label>
        <input
          type="text"
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="auth-input"
          placeholder="Your summoner name"
          required
          maxLength={50}
        />
      </div>

      <div className="auth-field">
        <label htmlFor="regEmail" className="auth-label">
          Email
        </label>
        <input
          type="email"
          id="regEmail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
          placeholder="summoner@manaroom.gg"
          required
        />
      </div>

      <div className="auth-field">
        <label htmlFor="regPassword" className="auth-label">
          Password
        </label>
        <input
          type="password"
          id="regPassword"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input"
          placeholder="••••••••"
          required
          minLength={6}
        />
      </div>

      <div className="auth-field">
        <label htmlFor="confirmPassword" className="auth-label">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="auth-input"
          placeholder="••••••••"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="auth-submit auth-submit-register"
      >
        {loading ? (
          <span className="auth-submit-loading">
            <span className="auth-spinner" />
            Igniting...
          </span>
        ) : (
          'Ignite Your Spark'
        )}
      </button>
    </form>
  );
}
