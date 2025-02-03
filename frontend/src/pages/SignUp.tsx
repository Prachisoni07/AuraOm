import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Briefcase, Phone, FileText, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export default function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    age: '',
    profession: '',
    phonenumber: '',
    description: '',
    profile_picture: null as File | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) {
          formDataObj.append(key, value);
        }
      });

      await api.post('/signup', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Welcome aboard! Please sign in.');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to create account');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-xl w-full max-w-2xl p-8 border border-purple-100 my-8">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform rotate-12 hover:rotate-0 transition-all duration-300">
            <Sparkles className="w-10 h-10 text-white transform -rotate-12 hover:rotate-0 transition-all duration-300" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">Join Our Community</h2>
          <p className="text-gray-600">Begin your magical journey with us</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form fields */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail className="w-4 h-4 text-indigo-500" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-white/50 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="w-4 h-4 text-indigo-500" />
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 bg-white/50 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Lock className="w-4 h-4 text-indigo-500" />
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-white/50 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="w-4 h-4 text-indigo-500" />
                Age
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-4 py-3 bg-white/50 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Briefcase className="w-4 h-4 text-indigo-500" />
                Profession
              </label>
              <input
                type="text"
                value={formData.profession}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                className="w-full px-4 py-3 bg-white/50 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Phone className="w-4 h-4 text-indigo-500" />
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phonenumber}
                onChange={(e) => setFormData({ ...formData, phonenumber: e.target.value })}
                className="w-full px-4 py-3 bg-white/50 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="w-4 h-4 text-indigo-500" />
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-white/50 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="w-4 h-4 text-indigo-500" />
              Profile Picture
            </label>
            <input
              type="file"
              onChange={(e) => setFormData({ ...formData, profile_picture: e.target.files?.[0] || null })}
              className="w-full px-4 py-3 bg-white/50 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 file:bg-indigo-500 file:border-0 file:text-white file:px-4 file:py-2 file:rounded-lg file:mr-4 file:hover:bg-indigo-600 cursor-pointer"
              accept="image/*"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Create Account
          </button>
        </form>

        <p className="text-center mt-8 text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-500 hover:text-indigo-600 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}