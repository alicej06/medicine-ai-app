'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

export default function SignInPage() {
  // State to handle password visibility
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1127] via-[#164357] via-[#1E5A6B] to-[#2E8080] to-[#5AAF9E] z-0">
        <div className="absolute inset-0 bg-gradient-to-tl from-[#5AAF9E]/40 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-3 font-[family-name:var(--font-space-grotesk)]">
            Sign In
          </h1>
          <p className="text-cyan-100/80 font-[family-name:var(--font-ibm-plex-mono)]">
            Access your PHAIRM account
          </p>
        </div>

        {/* The Card */}
        <div className="bg-[#0B1127]/60 backdrop-blur-md border border-cyan-400/20 rounded-2xl p-8 shadow-2xl">
          <form className="space-y-6">
            
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-cyan-200 tracking-wider uppercase font-[family-name:var(--font-ibm-plex-mono)]">
                Email Address *
              </label>
              <input 
                type="email" 
                placeholder="john.doe@example.com"
                className="w-full bg-[#16203A]/80 border border-cyan-400/30 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-cyan-200 tracking-wider uppercase font-[family-name:var(--font-ibm-plex-mono)]">
                Password *
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  className="w-full bg-[#16203A]/80 border border-cyan-400/30 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all pr-10"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Footer Links - UPDATED HERE */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Your credentials are encrypted in transit</span>
              <Link 
                href="/forgot-password" 
                className="text-cyan-400 underline decoration-cyan-400/50 hover:text-cyan-100 hover:decoration-cyan-100 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-cyan-900/20 transition-all uppercase tracking-wide"
            >
              Sign In
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center text-sm text-slate-300">
            Don't have an account?{' '}
            <Link href="/signup" className="text-cyan-400 hover:text-cyan-300 underline font-medium">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}