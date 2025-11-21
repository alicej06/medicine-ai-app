// apps/web/src/components/Navbar.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, LogOut, Info, Pill } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Logic to close the menu if you click outside of it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Left Side: Logo */}
          <Link href="/" className="flex items-center gap-2 text-blue-900 hover:opacity-80 transition">
            <Pill className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-xl tracking-tight">MedExplainer</span>
          </Link>

          {/* Right Side: Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 p-2 rounded-full hover:bg-slate-100 transition-all outline-none focus:ring-2 focus:ring-blue-100"
            >
              <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <User size={20} />
              </div>
            </button>

            {/* The Dropdown Menu */}
            {isOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                
                {/* Header inside menu */}
                <div className="px-4 py-2 border-b border-slate-50 mb-1">
                  <p className="text-xs text-slate-400 uppercase font-semibold">My Account</p>
                </div>

                {/* About Us Link */}
                <Link 
                  href="/about" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                >
                  <Info size={16} className="mr-3" />
                  About Us
                </Link>

                {/* Log Out Button */}
                <button
                  onClick={() => {
                    alert('Logged out successfully!'); // Placeholder for real auth later
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} className="mr-3" />
                  Log Out
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}