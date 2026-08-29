import React, { useState } from 'react';
import { Lock, Mail, Sun, Moon, AlertCircle } from 'lucide-react';
import ForgotPassword from './forgot_password';

// Import light and dark logos
import pdLogoFullColor from '../assets/PD Logo_full color.png';
import pdLogoWhite from '../assets/PD Logo_white.png';
// import loginBgPng from '../assets/PD Revamp_LoginPage_BG.png'; // Commented out to prevent performance lag

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
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

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

  // Render Forgot Password component when triggered
  if (isForgotPassword) {
    return (
      <ForgotPassword 
        onBackToLogin={() => setIsForgotPassword(false)} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
      />
    );
  }

  return (
    <div className={`relative w-screen h-screen min-h-screen flex items-center justify-center p-4 overflow-hidden font-sans transition-colors duration-300 ${
      darkMode ? 'bg-slate-950 text-white' : 'bg-slate-100 text-gray-900'
    }`}>

      {/* Background Image commented out due to file size performance lag
      <img 
        src={loginBgPng} 
        alt="Paramount Direct Login Background" 
        className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0 transition-opacity duration-500 ${
          darkMode ? 'opacity-20 mix-blend-overlay' : 'opacity-100'
        }`}
      />
      */}

      {/* Theme Toggle Button */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`absolute top-6 right-6 p-3 rounded-2xl border cursor-pointer shadow-md z-30 transition-all ${
          darkMode
            ? 'bg-slate-900/80 border-slate-700 text-yellow-400 hover:bg-slate-800'
            : 'bg-white/90 border-slate-200 text-gray-700 hover:bg-white'
        }`}
        aria-label="Toggle Theme"
      >
        {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      {/* Login Card */}
      <div className={`relative z-20 w-full max-w-md p-8 md:p-10 rounded-3xl border transition-all ${
        darkMode
          ? 'bg-slate-900/90 border-slate-800 shadow-2xl'
          : 'bg-white border-slate-200/80 shadow-2xl'
      }`}>
        
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <img 
              src={darkMode ? pdLogoWhite : pdLogoFullColor} 
              alt="Paramount Direct Logo" 
              className="h-24 w-auto object-contain filter drop-shadow-sm"
            />
          </div>
        </div>

        {/* Dynamic Error Banner */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 flex items-center space-x-2.5 text-xs font-medium">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-[#d0112b]" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`block w-full pl-10 pr-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d0112b] focus:border-transparent ${
                  darkMode
                    ? 'bg-slate-800/80 border border-slate-700 text-white placeholder-gray-500 focus:bg-slate-800'
                    : 'bg-slate-50 border border-slate-200 text-gray-900 placeholder-gray-400 focus:bg-white'
                }`}
                placeholder="admin@paramount.com.ph"
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`block w-full pl-10 pr-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d0112b] focus:border-transparent ${
                  darkMode
                    ? 'bg-slate-800/80 border border-slate-700 text-white placeholder-gray-500 focus:bg-slate-800'
                    : 'bg-slate-50 border border-slate-200 text-gray-900 placeholder-gray-400 focus:bg-white'
                }`}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className={`flex items-center cursor-pointer ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <input
                type="checkbox"
                className="h-4 w-4 rounded-md border-gray-300 text-[#d0112b] focus:ring-[#d0112b]"
              />
              <span className="ml-2 font-medium">Remember me</span>
            </label>

            <button
              type="button"
              onClick={() => setIsForgotPassword(true)}
              className="font-semibold text-[#d0112b] hover:text-[#b00e24] cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-2xl font-semibold text-sm text-white bg-[#d0112b] hover:bg-[#b00e24] focus:outline-none focus:ring-2 focus:ring-[#d0112b] focus:ring-offset-2 shadow-lg shadow-[#d0112b]/30 cursor-pointer transition-all"
          >
            Sign In
          </button>
        </form>
      </div>

      {/* Footer */}
      <footer className={`absolute bottom-6 left-6 text-xs z-20 font-medium ${
        darkMode ? 'text-gray-500' : 'text-gray-600'
      }`}>
        © 2026 Paramount Life & General Insurance Corporation. All rights reserved.
      </footer>

      {/* Version Tag */}
      <div className={`absolute bottom-6 right-6 text-xs font-mono px-2.5 py-1 rounded-lg border z-20 shadow-sm ${
        darkMode 
          ? 'bg-slate-900/80 border-slate-800 text-gray-400' 
          : 'bg-white/80 border-slate-200 text-gray-600'
      }`}>
        {APP_VERSION}
      </div>
    </div>
  );
}