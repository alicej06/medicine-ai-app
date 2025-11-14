// app/signin/page.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SignInPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signInSuccess, setSignInSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // TODO: Replace with real sign-in API call when backend is ready
    setTimeout(() => {
      console.log('Sign in data:', {
        email: formData.email,
      });

      setIsSubmitting(false);
      setSignInSuccess(true);

      // Reset form
      setFormData({
        email: '',
        password: '',
      });
    }, 1500);

    /*
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        setSignInSuccess(true);
        // Redirect to dashboard or home
      } else {
        const error = await response.json();
        setErrors({ general: error.message });
      }
    } catch (error) {
      setErrors({ general: 'Failed to sign in. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
    */
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (signInSuccess) {
    return (
      <main className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1127] via-[#164357] via-[#1E5A6B] to-[#2E8080] to-[#5AAF9E]">
          <div className="absolute inset-0 bg-gradient-to-tl from-[#5AAF9E]/40 via-transparent to-transparent"></div>
        </div>

        {/* Success Message */}
        <div className="relative z-10 text-center px-8">
          <div className="bg-[#0B1127]/80 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-12 max-w-md mx-auto">
            <div className="text-6xl mb-6">🔓</div>
            <h2 className="text-3xl font-bold text-white mb-4 font-[family-name:var(--font-space-grotesk)]">
              Welcome back to PHAIRM
            </h2>
            <p className="text-cyan-200 mb-8">
              You&apos;re signed in (demo state). When authentication is wired up,
              you&apos;ll be redirected to your dashboard.
            </p>
            <Link
              href="/"
              className="inline-block bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 shadow-lg"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1127] via-[#164357] via-[#1E5A6B] to-[#2E8080] to-[#5AAF9E]">
        <div className="absolute inset-0 bg-gradient-to-tl from-[#5AAF9E]/40 via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="px-8 md:px-16 lg:px-24 py-8 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-cyan-300/80 hover:text-cyan-200 transition-colors group"
          >
            <svg
              className="w-5 h-5 transition-transform group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-sm font-[family-name:var(--font-ibm-plex-mono)]">
              Back to Home
            </span>
          </Link>

          {/* Optional link to Sign Up */}
          <div className="text-cyan-200/70 text-sm font-[family-name:var(--font-ibm-plex-mono)]">
            New here?{' '}
            <Link
              href="/signup"
              className="text-cyan-400 hover:text-cyan-300 underline font-medium"
            >
              Create an account
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex items-center justify-center px-8 pb-20">
          <div className="w-full max-w-md">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold text-white mb-4 font-[family-name:var(--font-space-grotesk)]">
                Sign In
              </h1>
              <p className="text-cyan-200/80 font-[family-name:var(--font-ibm-plex-mono)]">
                Access your PHAIRM account
              </p>
            </div>

            {/* Sign In Form */}
            <div className="bg-[#0B1127]/80 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* General error */}
                {errors.general && (
                  <p className="text-red-400 text-sm mb-2">{errors.general}</p>
                )}

                {/* Email */}
                <div>
                  <label className="block text-cyan-300 text-sm font-medium mb-2 tracking-wider uppercase font-[family-name:var(--font-ibm-plex-mono)]">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      handleInputChange('email', e.target.value)
                    }
                    className={`w-full bg-[#1E5A6B]/30 border ${
                      errors.email ? 'border-red-500' : 'border-cyan-400/40'
                    } rounded-md px-4 py-3 text-white placeholder-cyan-300/40 focus:outline-none focus:border-cyan-400 transition-colors`}
                    placeholder="john.doe@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-cyan-300 text-sm font-medium mb-2 tracking-wider uppercase font-[family-name:var(--font-ibm-plex-mono)]">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange('password', e.target.value)
                      }
                      className={`w-full bg-[#1E5A6B]/30 border ${
                        errors.password ? 'border-red-500' : 'border-cyan-400/40'
                      } rounded-md px-4 py-3 pr-12 text-white placeholder-cyan-300/40 focus:outline-none focus:border-cyan-400 transition-colors`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-300/60 hover:text-cyan-300"
                    >
                      {showPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Forgot Password / Remember Me (optional small row) */}
                <div className="flex items-center justify-between text-xs text-cyan-200/70 font-[family-name:var(--font-ibm-plex-mono)]">
                  <span className="opacity-60">
                    {/* Placeholder – you can turn into a checkbox later */}
                    Secure login enabled
                  </span>
                  <button
                    type="button"
                    className="text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-cyan-500/50 font-[family-name:var(--font-ibm-plex-mono)] tracking-wider"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      VERIFYING...
                    </span>
                  ) : (
                    'SIGN IN'
                  )}
                </button>
              </form>

              {/* No account yet */}
              <div className="mt-6 text-center">
                <p className="text-cyan-200/70 text-sm">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/signup"
                    className="text-cyan-400 hover:text-cyan-300 underline font-medium"
                  >
                    Create one
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
