'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getDrugById, getExplanation } from '@/lib/api';
import { Drug, Explanation } from '@/lib/types';
import Link from 'next/link';


export default function LandingPage() {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const buttons = [
    { id: 'interaction', label: 'DRUG INTERACTION', href: '/interactions' },
    { id: 'tracker', label: 'DRUG TRACKER', href: '/tracker' }, // <-- This will link to your new tracker page eventually
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
        {/* Main Content */}
        <div className="flex-1 flex flex-col items-start justify-center px-10 md:px-20 lg:px-28 py-16">
          {/* Logo & Title Section */}
          <div className="mb-20">
            <div className="flex items-center gap-5 mb-3">
              {/* PHAIRM Logo */}
              <img 
                src="/phairm-logo.png" 
                alt="PHAIRM Logo"
                className="w-[120px] h-[120px] object-contain"
              />
              
              <h1 className="text-[6.5rem] leading-none font-bold text-white tracking-[0.02em] -ml-1">
                PHAIRM
              </h1>
            </div>
            
            <p className="text-[#A0E7DD] text-[15px] tracking-[0.25em] uppercase font-light pl-1">
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
                    <span className="text-[#C5F5ED] text-[17px] font-normal tracking-[0.15em] uppercase">
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

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-gray-100 border border-gray-300 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            ⚕️ <span className="font-semibold">Medical Disclaimer:</span> This information is for educational purposes only. 
            Always consult with a healthcare professional before starting or changing any medication.
          </p>
        </div>

        
        {/* Footer */}
        <footer className="pb-10 px-10 md:px-20 lg:px-28">
          <a 
            href="https://instagram.com/phairm_maia_biotech" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-[#4DD4C0]/70 hover:text-[#4DD4C0] transition-colors group"
          >
            <svg 
              className="w-[22px] h-[22px]" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 2.163c..."/>
            </svg>
            <span className="text-[15px] group-hover:underline">
              phairm_maia_biotech
            </span>
          </a>
        </footer>
      </div>
    </main>
  );
}