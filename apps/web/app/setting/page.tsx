'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to send email would go here
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1127] via-[#164357] via-[#1E5A6B] to-[#2E8080] to-[#5AAF9E] z-0">
        <div className="absolute inset-0 bg-gradient-to-tl from-[#5AAF9E]/40 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        
        {/* Back to Sign In Link */}
        <div className="mb-8">
          <Link href="/signin" className="flex items-center text-cyan-200 hover:text-white transition-colors group">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Sign In
          </Link>
        </div>

        <div className="bg-[#0B1127]/60 backdrop-blur-md border border-cyan-400/20 rounded-2xl p-8 shadow-2xl">
          
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-400/30">
              <Mail className="text-cyan-400" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 font-[family-name:var(--font-space-grotesk)]">
              Reset Password
            </h1>
            <p className="text-slate-300 text-sm">
              Enter the email address associated with your account and we'll send you a link to reset your password.
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-cyan-200 tracking-wider uppercase font-[family-name:var(--font-ibm-plex-mono)]">
                  Email Address
                </label>
                <input 
                  type="email" 
                  required
                  placeholder="john.doe@example.com"
                  className="w-full bg-[#16203A]/80 border border-cyan-400/30 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-cyan-900/20 transition-all uppercase tracking-wide"
              >
                Send Reset Link
              </button>
            </form>
          ) : (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
              <p className="text-green-200 font-medium mb-2">Check your email</p>
              <p className="text-sm text-green-200/80">
                If an account exists for that email, we have sent password reset instructions.
              </p>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}