import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, AlertCircle } from 'lucide-react';

export default function RegisterPage({ onSwitchToLogin }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-lg bg-brand-primary flex items-center justify-center text-white mx-auto shadow-sm">
          <Activity className="w-7 h-7 stroke-[2.2]" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-brand-dark">
          Sweety
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Create your account to start tracking blood glucose
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-gray-200 rounded-lg sm:px-10">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            Register new patient account
          </h2>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-brand-soft rounded-md flex items-start space-x-2.5 text-sm text-brand-crimson">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-brand-primary" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
              />
              <span className="text-xs text-gray-400 mt-1 block">Passwords are securely hashed with bcrypt</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-brand-primary text-white rounded-md text-sm font-semibold hover:bg-brand-crimson transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="font-semibold text-brand-primary hover:text-brand-crimson transition-colors"
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
