'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

export default function SignupForm() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirm_password: '',
    age: '',
    profession: '',
    email: '',
    phonenumber: '',
    description: '',
  });
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value);
      });

      if (fileInputRef.current?.files?.[0]) {
        submitData.append('profile_picture', fileInputRef.current.files[0]);
      }

      const response = await fetch('http://localhost:8000/signup/', {
        method: 'POST',
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Signup failed');
      }

      login(data.token);
      router.push('/chat');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Signup failed');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 py-12">
      <div className="glass-morphism p-8 rounded-2xl w-full max-w-2xl transform hover:scale-[1.01] transition-all duration-300 my-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            Create Your Account
          </h2>
          <p className="text-gray-600 mt-2">Join our AI chat community</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 border border-red-100 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Username
              <span className="text-gray-500 text-xs ml-1">(required)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full p-4 rounded-xl bg-white/95 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 pl-12"
                placeholder="Choose a unique username"
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                👤
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Email
              <span className="text-gray-500 text-xs ml-1">(required)</span>
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-4 rounded-xl bg-white/95 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 pl-12"
                placeholder="your.email@example.com"
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                ✉️
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
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-4 rounded-xl bg-white/95 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 pl-12"
                placeholder="Create a strong password"
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                🔒
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Confirm Password
              <span className="text-gray-500 text-xs ml-1">(required)</span>
            </label>
            <div className="relative">
              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                className="w-full p-4 rounded-xl bg-white/95 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 pl-12"
                placeholder="Confirm your password"
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                🔒
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Age
              <span className="text-gray-500 text-xs ml-1">(required)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="13"
                max="120"
                className="w-full p-4 rounded-xl bg-white/95 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 pl-12"
                placeholder="Your age"
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                📅
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Phone Number
              <span className="text-gray-500 text-xs ml-1">(required)</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                name="phonenumber"
                value={formData.phonenumber}
                onChange={handleChange}
                className="w-full p-4 rounded-xl bg-white/95 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 pl-12"
                placeholder="+1 (123) 456-7890"
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                📱
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Profession
              <span className="text-gray-500 text-xs ml-1">(required)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="profession"
                value={formData.profession}
                onChange={handleChange}
                className="w-full p-4 rounded-xl bg-white/95 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 pl-12"
                placeholder="Your profession"
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                💼
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Profile Picture
              <span className="text-gray-500 text-xs ml-1">(optional)</span>
            </label>
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="w-full p-4 rounded-xl bg-white/95 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 pl-12"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                📷
              </span>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Description
              <span className="text-gray-500 text-xs ml-1">(optional)</span>
            </label>
            <div className="relative">
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-4 rounded-xl bg-white/95 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 pl-12"
                rows={3}
                placeholder="Tell us a bit about yourself..."
              />
              <span className="absolute left-4 top-8 text-gray-400">
                ✍️
              </span>
            </div>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl hover:opacity-90 transition-all duration-200 font-medium text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Create Account
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-blue-500 hover:text-blue-600 font-medium hover:underline transition-colors"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}