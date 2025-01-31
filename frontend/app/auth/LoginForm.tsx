'use client';

import { useState } from 'react';
import { useAuth } from './AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch('http://localhost:8000/login/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      login(data.access_token);
      router.push('/chat');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="glass-morphism p-8 rounded-2xl w-full max-w-md transform hover:scale-[1.01] transition-all duration-300">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            Welcome Back!
          </h2>
          <p className="text-gray-600 mt-2">Sign in to continue your conversation</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 border border-red-100 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Username
              <span className="text-gray-500 text-xs ml-1">(required)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-4 rounded-xl bg-white/95 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 pl-12"
                placeholder="Enter your username"
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                👤
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Password
              <span className="text-gray-500 text-xs ml-1">(required)</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 rounded-xl bg-white/95 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 pl-12"
                placeholder="Enter your password"
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                🔒
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl hover:opacity-90 transition-all duration-200 font-medium text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={() => router.push('/signup')}
              className="text-blue-500 hover:text-blue-600 font-medium hover:underline transition-colors"
            >
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}