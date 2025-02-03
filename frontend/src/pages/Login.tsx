import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formBody = new URLSearchParams();
      formBody.append('username', formData.username);
      formBody.append('password', formData.password);

      const { data } = await api.post('/login', formBody.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      localStorage.setItem('token', data.access_token);
      toast.success('Welcome back!');
      navigate('/chat');
    } catch (error) {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-xl w-full max-w-md p-8 border border-purple-100">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform rotate-12 hover:rotate-0 transition-all duration-300">
            <Sparkles className="w-10 h-10 text-white transform -rotate-12 hover:rotate-0 transition-all duration-300" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">Welcome Back</h2>
          <p className="text-gray-600">Let's continue your journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Mail className="w-4 h-4 text-indigo-500" />
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-3 bg-white/50 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400"
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Lock className="w-4 h-4 text-indigo-500" />
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 bg-white/50 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Sign In
          </button>
        </form>

        <p className="text-center mt-8 text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="text-indigo-500 hover:text-indigo-600 font-medium">
            Create one now
          </Link>
        </p>
      </div>
    </div>
  );
}