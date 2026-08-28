import React, { useState } from 'react';
import { Lock, Mail, Sun, Moon, AlertCircle } from 'lucide-react';

// Import light, dark logos, and the login background asset
import pdLogoFullColor from '../assets/PD Logo_full color.png';
import pdLogoWhite from '../assets/PD Logo_white.png';
import loginBg from '../assets/PD Revamp_LoginPage_BG.png';

// App deployment versioning
const APP_VERSION = 'v2.1.0-build.84';

interface LoginProps {
  onLoginSuccess: () => void;
  darkMode: boolean;
  setDarkMode: (mode: boolean) => void;
}

export default function Login({ onLoginSuccess, darkMode, setDarkMode }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null); // Clear previous errors

    // --- Interactive Login Logic (Mock) ---
    if (email !== 'admin@paramount.com.ph' && email !== 'noaccess@paramount.com.ph') {
      setErrorMessage('Error: Invalid username or account does not exist.');
      return;
    }

    if (email === 'noaccess@paramount.com.ph') {
      setErrorMessage('Error: Access denied. Your account lacks system authorization.');
      return;
    }

    if (password !== 'admin123') {
      setErrorMessage('Error: Incorrect password. Please try again.');
      return;
    }

    onLoginSuccess();
  };

  return (
    <div 
      className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden transition-colors duration-500 font-sans bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url("${loginBg}")` }}
    >
      {/* Background Overlay for Enhanced Contrast */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${
        darkMode ? 'bg-slate-950/80' : 'bg-slate-900/40'
      }`} />

      {/* Theme Toggle Button (Light/Dark) */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`absolute top-6 right-6 p-3 rounded-2xl backdrop-blur-md border transition-all duration-300 cursor-pointer shadow-md z-20 ${
          darkMode
            ? 'bg-white/10 border-white/20 text-yellow-400 hover:bg-white/20'
            : 'bg-white/70 border-white/90 text-gray-700 hover:bg-white'
        }`}
        aria-label="Toggle Theme"
      >
        {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      {/* Main Login Card */}
      <div className={`relative z-20 w-full max-w-md p-8 md:p-10 rounded-3xl backdrop-blur-2xl border transition-all duration-500 ${
        darkMode
          ? 'bg-gray-900/50 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)]'
          : 'bg-white/80 border-white/90 shadow-[0_20px_50px_rgba(208,17,43,0.2)]'
      }`}>
        
        {/* Header Section (Branded Dual Logo) */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className={`p-4 rounded-2xl backdrop-blur-md border transition-all duration-500 ${
              darkMode
                ? 'bg-white/10 border-white/20 shadow-[inset_0_2px_4px_rgba(255,255,255,0.15),0_10px_20px_rgba(0,0,0,0.4)]'
                : 'bg-white/50 border-white/90 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),0_10px_20px_rgba(0,0,0,0.08)]'
            }`}>
              <img 
                src={darkMode ? pdLogoWhite : pdLogoFullColor} 
                alt="Paramount Direct Logo" 
                className="h-20 w-auto object-contain filter drop-shadow-[1px_2px_2px_rgba(0,0,0,0.25)] transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Login Error Banner */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-600 dark:text-red-300 flex items-center space-x-2.5 text-xs font-medium animate-fadeIn backdrop-blur-md">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-[#d0112b]" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Email Address Input Field */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 transition-colors duration-500 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className={`h-4 w-4 transition-colors duration-500 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`block w-full pl-10 pr-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d0112b] focus:border-transparent backdrop-blur-md transition-all ${
                  darkMode
                    ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:bg-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]'
                    : 'bg-white/80 border border-white/90 text-gray-900 placeholder-gray-400 focus:bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]'
                }`}
                placeholder="admin@paramount.com.ph"
              />
            </div>
          </div>

          {/* Password Input Field */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 transition-colors duration-500 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className={`h-4 w-4 transition-colors duration-500 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`block w-full pl-10 pr-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d0112b] focus:border-transparent backdrop-blur-md transition-all ${
                  darkMode
                    ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:bg-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]'
                    : 'bg-white/80 border border-white/90 text-gray-900 placeholder-gray-400 focus:bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]'
                }`}
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Remember Me & Forgot Password Links */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className={`flex items-center cursor-pointer transition-colors duration-500 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <input
                type="checkbox"
                className="h-4 w-4 rounded-md border-gray-300 text-[#d0112b] focus:ring-[#d0112b] focus:ring-offset-0 transition-all"
              />
              <span className="ml-2 font-medium">Remember me</span>
            </label>

            <a href="#" className="font-semibold text-[#d0112b] hover:text-[#b00e24] transition-colors">
              Forgot password?
            </a>
          </div>

          {/* Branded Action Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-2xl font-semibold text-sm text-white bg-[#d0112b] hover:bg-[#b00e24] focus:outline-none focus:ring-2 focus:ring-[#d0112b] focus:ring-offset-2 shadow-[0_8px_20px_rgba(208,17,43,0.35)] hover:shadow-[0_10px_25px_rgba(208,17,43,0.5)] transition-all transform active:scale-[0.98] cursor-pointer"
          >
            Sign In
          </button>
        </form>
      </div>

      {/* Global Footer Details */}
      <footer className="absolute bottom-6 left-6 text-xs text-white/80 z-20 font-medium drop-shadow-sm">
        © 2026 Paramount Life & General Insurance Corporation. All rights reserved.
      </footer>

      {/* Monospace Version Tag */}
      <div className="absolute bottom-6 right-6 text-xs font-mono px-2.5 py-1 rounded-lg border backdrop-blur-md bg-white/10 border-white/20 text-white z-20 shadow-sm">
        {APP_VERSION}
      </div>
    </div>
  );
}