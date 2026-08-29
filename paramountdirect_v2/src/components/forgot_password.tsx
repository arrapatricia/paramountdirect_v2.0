import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, ArrowLeft, Sun, Moon } from 'lucide-react';

import pdLogoFullColor from '../assets/PD Logo_full color.png';
import pdLogoWhite from '../assets/PD Logo_white.png';

const APP_VERSION = 'v2025.1';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
  darkMode: boolean;
  setDarkMode: (mode: boolean) => void;
}

export default function ForgotPassword({ onBackToLogin, darkMode, setDarkMode }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubmitted(true);
    }
  };

  return (
    <div className={`relative w-screen h-screen min-h-screen flex items-center justify-center p-4 overflow-hidden font-sans transition-colors duration-300 ${
      darkMode ? 'bg-slate-950 text-white' : 'bg-slate-100 text-gray-900'
    }`}>

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

      {/* Card Container */}
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
              className="h-20 w-auto object-contain filter drop-shadow-sm"
            />
          </div>
        </div>

        {!isSubmitted ? (
          /* STATE 1: Request Password Reset Form */
          <div className="space-y-6">
            <div className="text-center space-y-1.5">
              <h2 className="text-lg font-black text-[#d0112b] font-['Montserrat'] tracking-tight">
                Forgot your Password?
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Enter your email and we'll send you a link to reset your password
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`block w-full pl-10 pr-4 py-3 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-[#d0112b] focus:border-transparent ${
                      darkMode
                        ? 'bg-slate-800/80 border border-slate-700 text-white placeholder-gray-500 focus:bg-slate-800'
                        : 'bg-slate-100 border border-slate-200 text-gray-900 placeholder-gray-400 focus:bg-white'
                    }`}
                    placeholder="Email Address*"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider text-white bg-[#b0b3b8] hover:bg-[#d0112b] focus:outline-none focus:ring-2 focus:ring-[#d0112b] shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>SEND EMAIL</span>
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                onClick={onBackToLogin}
                className="text-xs font-semibold text-slate-500 hover:text-[#d0112b] inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login</span>
              </button>
            </div>
          </div>
        ) : (
          /* STATE 2: Confirmation Screen */
          <div className="text-center space-y-6 animate-fadeIn py-2">
            <div className="flex justify-center">
              <div className="p-4 bg-sky-50 dark:bg-sky-950/40 rounded-3xl border border-sky-200 dark:border-sky-800">
                <Mail className="w-12 h-12 text-[#008cb4]" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-[#008cb4] tracking-tight">
                Check your inbox!
              </h2>
              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                Follow the instructions sent to your email address to reset your password
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={onBackToLogin}
                className="w-full py-3 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider text-white bg-[#008cb4] hover:bg-[#007396] shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Login</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Footer Details */}
      <footer className={`absolute bottom-6 left-6 text-xs z-20 font-medium ${
        darkMode ? 'text-gray-500' : 'text-gray-600'
      }`}>
        ©2025 All rights reserved. ParamountDirect Webservice | {APP_VERSION}
      </footer>
    </div>
  );
}