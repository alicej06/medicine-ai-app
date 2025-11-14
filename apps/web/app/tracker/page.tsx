'use client'; // This page uses the client component

import CurrentPrescriptions from '@/components/CurrentPrescriptions';
import Link from 'next/link';

export default function TrackerPage() {
  return (
    <main>
      {/* This is a simple Back button. 
        We can style it better later.
      */}
      <Link 
        href="/"
        className="absolute top-4 left-4 z-50 inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-200"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Home
      </Link>
      
      {/* This is your new UI component. 
        It will fill the page.
      */}
      <CurrentPrescriptions />
    </main>
  );
}