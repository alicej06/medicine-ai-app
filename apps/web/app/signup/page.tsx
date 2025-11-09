// app/signup/page.tsx

'use client';

import Link from 'next/link';

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a4b5c] to-[#2d7a7a]">
      <div className="container mx-auto px-4 py-12">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-200 mb-8"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        <div className="text-center py-20">
          <h1 className="text-5xl font-bold text-white mb-4">
            Sign Up
          </h1>
          <p className="text-cyan-200 text-xl mb-8">
            Coming Soon
          </p>
          <p className="text-cyan-300/70">
            Create an account to save your medication history
          </p>
        </div>
      </div>
    </main>
  );
}