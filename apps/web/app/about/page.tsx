// apps/web/src/app/about/page.tsx
import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto p-8 text-slate-800">
      <div className="mb-8">
        <Link href="/" className="text-sm text-blue-600 hover:underline font-medium">
          &larr; Back to Search
        </Link>
      </div>

      <h1 className="text-4xl font-bold text-blue-900 mb-6">About Medicine Explainer</h1>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
        <p className="text-lg leading-relaxed text-slate-700">
          We believe that understanding your medication shouldn't require a medical degree.
          Medicine labels are often confusing, filled with complex jargon, and hard to read. 
          Our mission is to change that.
        </p>
        
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">What we do</h2>
          <ul className="space-y-3 text-slate-600">
            <li className="flex gap-3">
              <span className="text-blue-500 font-bold">✓</span>
              Translate complex drug info into simple language.
            </li>
            <li className="flex gap-3">
              <span className="text-blue-500 font-bold">✓</span>
              Check for dangerous interactions between your meds.
            </li>
            <li className="flex gap-3">
              <span className="text-blue-500 font-bold">✓</span>
              Provide citations for every explanation we generate.
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}