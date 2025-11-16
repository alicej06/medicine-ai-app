// app/page.tsx

'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function LandingPage() {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const buttons = [
    { id: 'interaction', label: 'DRUG INTERACTION', href: '/interactions' },
    { id: 'tracker', label: 'DRUG TRACKER', href: '/tracker' },
    { id: 'info', label: 'DRUG INFO', href: '/search' },
    { id: 'signup', label: 'SIGN UP', href: '/signup' }
  ];

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Exact Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1127] via-[#164357] via-[#1E5A6B] to-[#2E8080] to-[#5AAF9E]">
        <div className="absolute inset-0 bg-gradient-to-tl from-[#5AAF9E]/40 via-transparent to-transparent"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* User Profile Button */}
        <div className="absolute top-8 right-8 md:top-12 md:right-16 lg:right-24 z-20">
          <Link
            href="/profile"
            className="flex items-center gap-2 px-4 py-2 bg-[#0B1127]/60 backdrop-blur-sm border border-cyan-400/30 rounded-full hover:border-cyan-400/60 hover:bg-cyan-900/20 transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-400 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-cyan-200 text-sm font-medium group-hover:text-cyan-100 transition-colors hidden md:inline">
              Profile
            </span>
          </Link>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-start justify-center px-10 md:px-20 lg:px-28 py-16">
          {/* Logo & Title Section */}
          <div className="mb-20">
            <div className="flex items-center gap-5 mb-3">
              {/* PHAIRM Logo */}
              <img 
                src="/phairm-logo.png" 
                alt="PHAIRM Logo"
                className="w-[72px] h-[72px] object-contain"
              />
              
              <h1 className="text-[6.5rem] leading-none font-bold text-white tracking-[0.02em] -ml-1 font-[family-name:var(--font-space-grotesk)]">
                PHAIRM
              </h1>
            </div>
            
            <p className="text-[#A0E7DD] text-[15px] tracking-[0.25em] uppercase font-light pl-1 font-[family-name:var(--font-ibm-plex-mono)]">
              MEDICINE INTERACTION CHECKER
            </p>
          </div>

          {/* Button Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-[620px]">
            {buttons.map((button) => (
              <Link
                key={button.id}
                href={button.href}
                onMouseEnter={() => setHoveredButton(button.id)}
                onMouseLeave={() => setHoveredButton(null)}
                className="group relative"
              >
                <div className={`
                  border border-[#4DD4C0]/50
                  bg-transparent
                  px-7 py-[22px]
                  rounded-md
                  transition-all duration-200
                  hover:border-[#4DD4C0]/80
                  hover:bg-[#1E5A6B]/20
                  hover:shadow-[0_0_20px_rgba(77,212,192,0.15)]
                  hover:translate-x-[2px]
                  ${hoveredButton === button.id ? 'border-[#4DD4C0]/80 bg-[#1E5A6B]/20' : ''}
                `}>
                  <div className="flex items-center justify-between">
                    <span className="text-[#C5F5ED] text-[17px] font-normal tracking-[0.15em] uppercase font-[family-name:var(--font-ibm-plex-mono)]">
                      {button.label}
                    </span>
                    <svg 
                      className={`
                        w-[18px] h-[18px] text-[#4DD4C0]
                        transition-transform duration-200
                        ${hoveredButton === button.id ? 'translate-x-[3px]' : ''}
                      `}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      strokeWidth="2.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="pb-10 px-10 md:px-20 lg:px-28">
          <a 
            href="https://instagram.com/maia_biotech.phairm" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-[#4DD4C0]/70 hover:text-[#4DD4C0] transition-colors group"
          >
            <svg 
              className="w-[22px] h-[22px]" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <span className="text-[15px] group-hover:underline font-[family-name:var(--font-ibm-plex-mono)]">
              maia_biotech.phairm
            </span>
          </a>
        </footer>
      </div>
    </main>
  );
}