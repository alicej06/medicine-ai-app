'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, LogOut, LogIn, Settings } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  
  // I set this to TRUE so you can see the Red Logout button immediately.
  // Change this back to 'false' when you are done testing the look!
  const [isLoggedIn, setIsLoggedIn] = useState(true); 
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAuthPage = pathname === '/signin' || pathname === '/signup';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsOpen(false);
    alert("You have been logged out.");
  };

  return (
    <nav className="absolute top-0 w-full z-50 bg-transparent px-6 py-8">
      <div className="max-w-[1400px] mx-auto flex justify-between items-center px-4 md:px-12">
        
        {/* Left: Home Icon */}
        <Link 
          href="/" 
          className="p-3 bg-[#0B1127]/60 hover:bg-[#164357] backdrop-blur-md rounded-full text-cyan-400 transition-all border border-cyan-400/30 hover:border-cyan-400"
          aria-label="Home"
        >
          <Home size={22} />
        </Link>

        {/* Right Section */}
        {!isAuthPage && (
          <div className="flex items-center gap-6">
            
            <Link 
              href="/about" 
              className="text-cyan-200/80 hover:text-cyan-100 font-medium transition-colors font-[family-name:var(--font-ibm-plex-mono)] tracking-wide text-sm"
            >
              ABOUT US
            </Link>

            {/* PROFILE DROPDOWN */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 bg-[#0B1127]/60 hover:bg-[#164357] backdrop-blur-md border border-cyan-400/30 px-4 py-2 rounded-full transition-all group"
              >
                <div className="bg-gradient-to-br from-cyan-400 to-teal-400 rounded-full p-1">
                  <User size={16} className="text-[#0B1127]" />
                </div>
                <span className="text-cyan-100 text-sm font-medium group-hover:text-white transition-colors">
                  Profile
                </span>
              </button>

              {/* The Dropdown Menu */}
              {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#0B1127] border border-cyan-400/30 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                  
                  {!isLoggedIn ? (
                    // OPTION A: If Logged OUT -> Show "Log In"
                    <Link
                      href="/signin"
                      onClick={() => setIsOpen(false)}
                      className="w-full flex items-center px-5 py-4 text-sm text-cyan-100 hover:bg-cyan-900/30 transition-colors"
                    >
                      <LogIn size={18} className="mr-3 text-cyan-400" />
                      LOG IN
                    </Link>
                  ) : (
                    // OPTION B: If Logged IN -> Show Settings + Red Log Out
                    <div className="flex flex-col">
                      
                      {/* --- THIS IS THE UPDATED PART --- */}
                      {/* REAL Settings Link */}
                      <Link 
                        href="/settings"
                        onClick={() => setIsOpen(false)} // Closes menu when clicked
                        className="w-full flex items-center px-5 py-3 text-sm text-cyan-100/70 hover:text-cyan-100 hover:bg-[#164357]/50 transition-colors border-b border-white/5"
                      >
                        <Settings size={18} className="mr-3 text-cyan-400" />
                        Account Settings
                      </Link>
                      {/* -------------------------------- */}

                      {/* THE RED LOGOUT BUTTON */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-5 py-4 text-sm text-red-500 hover:bg-red-950/30 hover:text-red-400 transition-colors font-bold tracking-wide"
                      >
                        <LogOut size={18} className="mr-3" />
                        LOG OUT
                      </button>
                    </div>
                  )}
                  
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </nav>
  );
}