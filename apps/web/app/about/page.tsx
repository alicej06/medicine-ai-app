import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AboutPage() {
  return (
    // Full screen dark gradient background
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center p-4">
      
      {/* Glassmorphism Card */}
      <div className="max-w-3xl w-full bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
        
        {/* Header */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
          About Medicine Explainer
        </h1>
        
        <div className="space-y-6 text-lg text-slate-300 leading-relaxed">
          <p>
            Medicine labels are often confusing, filled with complex jargon that is hard to understand. 
            <strong className="text-cyan-400"> PHAIRM </strong> is here to change that.
          </p>
          
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">What we do</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 mt-1">●</span>
                <span>Translate complex drug info into simple language.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 mt-1">●</span>
                <span>Check for dangerous interactions between your meds.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 mt-1">●</span>
                <span>Provide AI explanations backed by verified data.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-10 pt-6 border-t border-white/10">
          <Link 
            href="/" 
            className="inline-flex items-center text-cyan-400 hover:text-cyan-300 font-medium transition-colors group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
        </div>

      </div>
    </main>
  );
}