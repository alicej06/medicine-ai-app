// src/components/CurrentPrescriptions.tsx
'use client';

import {
  ClockIcon,
  NoSymbolIcon,
  CircleStackIcon, // Placeholder for "Total Meds"
} from '@heroicons/react/24/outline';
import { PlayCircleIcon } from '@heroicons/react/24/solid'; // Placeholder for "Active Rx"

export default function CurrentPrescriptions() {
  // --- This is the data you would pass in as props ---
  const prescriptions = [
    {
      name: 'Lisinopril',
      details: '10mg, Once daily',
      icon: <NoSymbolIcon className="h-8 w-8 text-gray-400" />,
    },
    {
      name: 'Metmerin',
      details: '50mg, Twice daily',
      // No icon in the image, so it's null
      icon: null,
    },
    {
      name: 'Atorvasthin',
      details: 'Type 2 Diabetes',
      icon: null,
    },
  ];

  const adherence = 95;
  const totalMeds = 3;
  const activeRx = 2;
  // --- End of data ---

  return (
    // Set your page background to the dark navy color. 
    // This div provides the layout and padding.
    <div className="min-h-screen w-full p-6 md:p-10 bg-[#0A0F2E]"> 
      {/* Page Title */}
      <h1 className="mb-6 text-4xl md:text-5xl font-bold text-white">
        Current Prescriptions
      </h1>

      {/* Main Content Grid: 1 column on mobile, 2 on large screens */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* === LEFT COLUMN: PRESCRIPTION LIST === */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {prescriptions.map((drug) => (
            <div
              key={drug.name}
              // This is the "frosted glass" card style from your theme
              className="flex items-center justify-between rounded-2xl bg-gray-600/10 p-6 backdrop-blur-lg"
            >
              <div>
                <h2 className="text-3xl font-bold text-white">{drug.name}</h2>
                <p className="text-lg text-gray-300">{drug.details}</p>
              </div>
              {drug.icon}
            </div>
          ))}
        </div>

        {/* === RIGHT COLUMN: INFO CARDS === */}
        <div className="flex flex-col gap-6">
          
          {/* --- Upcoming Doses Card --- */}
          <div className="rounded-2xl bg-gray-600/10 p-6 backdrop-blur-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-white">
                Upcoming Doses
              </h3>
              <ClockIcon className="h-8 w-8 text-gray-300" />
            </div>
            
            {/* The Lime Green Box */}
            <div className="mt-4 rounded-lg bg-[#94FF00]/90 p-4 text-gray-900">
              <p className="text-xl font-bold">8:00 A.M.</p>
              <p className="font-medium">Lisinopril, Metamerin</p>
            </div>
          </div>

          {/* --- Medication Analysis Card --- */}
          <div className="rounded-2xl bg-gray-600/10 p-6 backdrop-blur-lg">
            <h3 className="text-2xl font-semibold text-white">
              Medication Analysis
            </h3>
            <p className="text-md text-gray-300">Adherence Rate</p>

            {/* Donut Chart */}
            <div className="my-6 flex items-center justify-center">
              <div className="relative h-40 w-40">
                <svg className="h-full w-full" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="#FFFFFF"
                    strokeOpacity="0.1"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  {/* Progress Circle (Tailwind can't do this easily) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="#00FFFF" // Use your theme's cyan color
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={`${adherence * 2.64} 999`} // 2.64 = (2 * pi * 42) / 100
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                {/* Text Inside Circle */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {adherence}%
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Stats Pills */}
            <div className="flex justify-between gap-4">
              <div className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white/5 p-3 text-white">
                <CircleStackIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Total Meds: {totalMeds}</span>
              </div>
              <div className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white/5 p-3 text-white">
                <PlayCircleIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Active Rx: {activeRx}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}