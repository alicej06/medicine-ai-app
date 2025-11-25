'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Lock, Bell, Trash2, Save } from 'lucide-react';

export default function SettingsPage() {
  return (
    <main className="min-h-screen relative flex justify-center p-6 md:p-12">
      {/* Background (Same as Home) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1127] via-[#164357] via-[#1E5A6B] to-[#2E8080] to-[#5AAF9E] z-0 fixed">
        <div className="absolute inset-0 bg-gradient-to-tl from-[#5AAF9E]/40 via-transparent to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-4xl mt-16">
        
        {/* Header & Back Link */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link 
              href="/" 
              className="inline-flex items-center text-cyan-200 hover:text-white mb-4 transition-colors group text-sm font-medium"
            >
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
              Account Settings
            </h1>
          </div>
          <button className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white px-6 py-3 rounded-full shadow-lg shadow-cyan-900/20 font-bold tracking-wide transition-all">
            <Save size={18} />
            <span>SAVE CHANGES</span>
          </button>
        </div>

        {/* Main Glass Card */}
        <div className="bg-[#0B1127]/60 backdrop-blur-md border border-cyan-400/20 rounded-2xl overflow-hidden shadow-2xl">
          
          {/* Section 1: Personal Info */}
          <div className="p-8 border-b border-cyan-400/10">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <User className="text-cyan-400" size={20} />
              Personal Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-cyan-200/70 tracking-wider uppercase font-[family-name:var(--font-ibm-plex-mono)]">
                  Full Name
                </label>
                <input 
                  type="text" 
                  defaultValue="John Doe"
                  className="w-full bg-[#16203A]/60 border border-cyan-400/20 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-400 focus:bg-[#16203A] transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-cyan-200/70 tracking-wider uppercase font-[family-name:var(--font-ibm-plex-mono)]">
                  Email Address
                </label>
                <div className="relative">
                  <input 
                    type="email" 
                    defaultValue="john.doe@example.com"
                    className="w-full bg-[#16203A]/60 border border-cyan-400/20 rounded-lg p-3 pl-10 text-white focus:outline-none focus:border-cyan-400 focus:bg-[#16203A] transition-all"
                  />
                  <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Security */}
          <div className="p-8 border-b border-cyan-400/10 bg-white/5">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Lock className="text-cyan-400" size={20} />
              Security
            </h2>
            
            <div className="flex items-center justify-between bg-[#16203A]/60 p-4 rounded-xl border border-cyan-400/10">
              <div>
                <p className="text-white font-medium">Password</p>
                <p className="text-sm text-slate-400">Last changed 3 months ago</p>
              </div>
              <button className="text-cyan-400 hover:text-white text-sm font-medium border border-cyan-400/30 px-4 py-2 rounded-lg hover:bg-cyan-900/30 transition-all">
                Change Password
              </button>
            </div>
          </div>

          {/* Section 3: Preferences */}
          <div className="p-8 border-b border-cyan-400/10">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Bell className="text-cyan-400" size={20} />
              Preferences
            </h2>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-slate-200 group-hover:text-white transition-colors">Email Notifications</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-cyan-500 rounded cursor-pointer" />
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-slate-200 group-hover:text-white transition-colors">Drug Interaction Alerts</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-cyan-500 rounded cursor-pointer" />
              </label>
            </div>
          </div>

          {/* Section 4: Danger Zone */}
          <div className="p-8 bg-red-950/20">
            <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
              <Trash2 className="text-red-400" size={20} />
              Danger Zone
            </h2>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <p className="text-red-200/70 text-sm max-w-md">
                Permanently delete your account and all of your tracked medication data. This action cannot be undone.
              </p>
              <button className="text-red-400 hover:text-white hover:bg-red-600 border border-red-500/30 px-4 py-2 rounded-lg transition-all text-sm font-bold whitespace-nowrap">
                Delete Account
              </button>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}