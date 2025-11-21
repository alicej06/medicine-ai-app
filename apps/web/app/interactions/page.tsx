// app/interactions/page.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { searchDrugs } from '@/lib/api';
import { Drug } from '@/lib/types';

export default function InteractionsPage() {
  const [drug1Query, setDrug1Query] = useState('');
  const [drug2Query, setDrug2Query] = useState('');
  const [drug1Results, setDrug1Results] = useState<Drug[]>([]);
  const [drug2Results, setDrug2Results] = useState<Drug[]>([]);
  const [selectedDrug1, setSelectedDrug1] = useState<Drug | null>(null);
  const [selectedDrug2, setSelectedDrug2] = useState<Drug | null>(null);
  const [showDrug1Dropdown, setShowDrug1Dropdown] = useState(false);
  const [showDrug2Dropdown, setShowDrug2Dropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [interactionResult, setInteractionResult] = useState<string | null>(null);
  const [isCheckingInteraction, setIsCheckingInteraction] = useState(false);

  // Search for Drug 1
  const handleDrug1Search = async (query: string) => {
    setDrug1Query(query);
    if (query.length < 2) {
      setDrug1Results([]);
      setShowDrug1Dropdown(false);
      return;
    }

    try {
      const result = await searchDrugs(query, 5);
      setDrug1Results(result.drugs || []);
      setShowDrug1Dropdown(true);
    } catch (error) {
      console.error('Drug 1 search error:', error);
      setDrug1Results([]);
    }
  };

  // Search for Drug 2
  const handleDrug2Search = async (query: string) => {
    setDrug2Query(query);
    if (query.length < 2) {
      setDrug2Results([]);
      setShowDrug2Dropdown(false);
      return;
    }

    try {
      const result = await searchDrugs(query, 5);
      setDrug2Results(result.drugs || []);
      setShowDrug2Dropdown(true);
    } catch (error) {
      console.error('Drug 2 search error:', error);
      setDrug2Results([]);
    }
  };

  // Select Drug 1
  const selectDrug1 = (drug: Drug) => {
    setSelectedDrug1(drug);
    setDrug1Query(drug.generic_name);
    setShowDrug1Dropdown(false);
    setInteractionResult(null);
  };

  // Select Drug 2
  const selectDrug2 = (drug: Drug) => {
    setSelectedDrug2(drug);
    setDrug2Query(drug.generic_name);
    setShowDrug2Dropdown(false);
    setInteractionResult(null);
  };

  // Check interaction
  const checkInteraction = async () => {
    if (!selectedDrug1 || !selectedDrug2) return;

    setIsCheckingInteraction(true);
    
    // TODO: Replace with actual API call when backend is ready
    // For now, simulate the check
    setTimeout(() => {
      setInteractionResult('moderate'); // or 'severe', 'minor', 'none'
      setIsCheckingInteraction(false);
    }, 1000);

    /* When backend is ready, use:
    try {
      const response = await fetch(`/api/interactions?drug1=${selectedDrug1.rx_cui}&drug2=${selectedDrug2.rx_cui}`);
      const data = await response.json();
      setInteractionResult(data.severity);
    } catch (error) {
      console.error('Interaction check error:', error);
    } finally {
      setIsCheckingInteraction(false);
    }
    */
  };

  // Clear all
  const clearAll = () => {
    setDrug1Query('');
    setDrug2Query('');
    setSelectedDrug1(null);
    setSelectedDrug2(null);
    setDrug1Results([]);
    setDrug2Results([]);
    setInteractionResult(null);
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1127] via-[#164357] via-[#1E5A6B] to-[#2E8080] to-[#5AAF9E]">
        <div className="absolute inset-0 bg-gradient-to-tl from-[#5AAF9E]/40 via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-8 md:px-16 lg:px-24 py-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-cyan-300/80 hover:text-cyan-200 transition-colors group"
          >
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-[family-name:var(--font-ibm-plex-mono)]">Back to Home</span>
          </Link>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 md:px-16 lg:px-24 pb-20">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 font-[family-name:var(--font-space-grotesk)]">
              Interaction Checker
            </h1>
            <p className="text-cyan-200/80 text-lg font-[family-name:var(--font-ibm-plex-mono)]">
              Check for potential interactions between medications
            </p>
          </div>

          {/* Drug Input Cards */}
          <div className="w-full max-w-4xl mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Drug 1 Input */}
              <div className="relative">
                <div className="bg-[#0B1127]/60 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-6">
                  <label className="block text-cyan-300 text-sm font-medium mb-3 tracking-wider uppercase font-[family-name:var(--font-ibm-plex-mono)]">
                    Drug 1
                  </label>
                  <input
                    type="text"
                    value={drug1Query}
                    onChange={(e) => handleDrug1Search(e.target.value)}
                    onFocus={() => drug1Results.length > 0 && setShowDrug1Dropdown(true)}
                    placeholder="Enter drug name..."
                    className="w-full bg-[#1E5A6B]/30 border border-cyan-400/40 rounded-md px-4 py-3 text-white placeholder-cyan-300/40 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  
                  {/* Dropdown Results */}
                  {showDrug1Dropdown && drug1Results.length > 0 && (
                    <div className="absolute z-20 w-full mt-2 bg-[#0B1127] border border-cyan-400/50 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {drug1Results.map((drug) => (
                        <button
                          key={drug.rx_cui}
                          onClick={() => selectDrug1(drug)}
                          className="w-full text-left px-4 py-3 hover:bg-cyan-900/30 transition-colors border-b border-cyan-400/20 last:border-b-0"
                        >
                          <div className="text-cyan-100 font-medium">{drug.generic_name}</div>
                          {drug.brand_names && drug.brand_names.length > 0 && (
                            <div className="text-cyan-300/60 text-sm mt-1">
                              {drug.brand_names.slice(0, 2).join(', ')}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Selected Drug Info */}
                  {selectedDrug1 && (
                    <div className="mt-3 p-3 bg-cyan-900/20 rounded border border-cyan-400/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-cyan-100 text-sm font-medium">{selectedDrug1.generic_name}</div>
                          {selectedDrug1.drug_class && (
                            <div className="text-cyan-300/60 text-xs mt-1">{selectedDrug1.drug_class}</div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedDrug1(null);
                            setDrug1Query('');
                            setInteractionResult(null);
                          }}
                          className="text-cyan-300/60 hover:text-cyan-300 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Drug 2 Input */}
              <div className="relative">
                <div className="bg-[#0B1127]/60 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-6">
                  <label className="block text-cyan-300 text-sm font-medium mb-3 tracking-wider uppercase font-[family-name:var(--font-ibm-plex-mono)]">
                    Drug 2
                  </label>
                  <input
                    type="text"
                    value={drug2Query}
                    onChange={(e) => handleDrug2Search(e.target.value)}
                    onFocus={() => drug2Results.length > 0 && setShowDrug2Dropdown(true)}
                    placeholder="Enter drug name..."
                    className="w-full bg-[#1E5A6B]/30 border border-cyan-400/40 rounded-md px-4 py-3 text-white placeholder-cyan-300/40 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  
                  {/* Dropdown Results */}
                  {showDrug2Dropdown && drug2Results.length > 0 && (
                    <div className="absolute z-20 w-full mt-2 bg-[#0B1127] border border-cyan-400/50 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {drug2Results.map((drug) => (
                        <button
                          key={drug.rx_cui}
                          onClick={() => selectDrug2(drug)}
                          className="w-full text-left px-4 py-3 hover:bg-cyan-900/30 transition-colors border-b border-cyan-400/20 last:border-b-0"
                        >
                          <div className="text-cyan-100 font-medium">{drug.generic_name}</div>
                          {drug.brand_names && drug.brand_names.length > 0 && (
                            <div className="text-cyan-300/60 text-sm mt-1">
                              {drug.brand_names.slice(0, 2).join(', ')}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Selected Drug Info */}
                  {selectedDrug2 && (
                    <div className="mt-3 p-3 bg-cyan-900/20 rounded border border-cyan-400/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-cyan-100 text-sm font-medium">{selectedDrug2.generic_name}</div>
                          {selectedDrug2.drug_class && (
                            <div className="text-cyan-300/60 text-xs mt-1">{selectedDrug2.drug_class}</div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedDrug2(null);
                            setDrug2Query('');
                            setInteractionResult(null);
                          }}
                          className="text-cyan-300/60 hover:text-cyan-300 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Check Interaction Button */}
          <div className="w-full max-w-4xl mb-8">
            <button
              onClick={checkInteraction}
              disabled={!selectedDrug1 || !selectedDrug2 || isCheckingInteraction}
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-cyan-500/50 font-[family-name:var(--font-ibm-plex-mono)] tracking-wider"
            >
              {isCheckingInteraction ? 'CHECKING...' : 'CHECK INTERACTION'}
            </button>
          </div>

          {/* Interaction Result */}
          {interactionResult && (
            <div className="w-full max-w-4xl">
              <div className={`
                border-2 rounded-lg p-8
                ${interactionResult === 'severe' ? 'bg-red-900/20 border-red-500/50' : ''}
                ${interactionResult === 'moderate' ? 'bg-yellow-900/20 border-yellow-500/50' : ''}
                ${interactionResult === 'minor' ? 'bg-blue-900/20 border-blue-500/50' : ''}
                ${interactionResult === 'none' ? 'bg-green-900/20 border-green-500/50' : ''}
              `}>
                <div className="flex items-start gap-4">
                  <div className="text-4xl">
                    {interactionResult === 'severe' && '⚠️'}
                    {interactionResult === 'moderate' && '⚡'}
                    {interactionResult === 'minor' && 'ℹ️'}
                    {interactionResult === 'none' && '✅'}
                  </div>
                  <div className="flex-1">
                    <h3 className={`
                      text-2xl font-bold mb-3 font-[family-name:var(--font-space-grotesk)]
                      ${interactionResult === 'severe' ? 'text-red-300' : ''}
                      ${interactionResult === 'moderate' ? 'text-yellow-300' : ''}
                      ${interactionResult === 'minor' ? 'text-blue-300' : ''}
                      ${interactionResult === 'none' ? 'text-green-300' : ''}
                    `}>
                      {interactionResult === 'severe' && 'Severe Interaction'}
                      {interactionResult === 'moderate' && 'Moderate Interaction'}
                      {interactionResult === 'minor' && 'Minor Interaction'}
                      {interactionResult === 'none' && 'No Known Interaction'}
                    </h3>
                    <p className="text-cyan-100 mb-4">
                      {interactionResult === 'severe' && 'These medications may have a serious interaction. Consult your doctor immediately.'}
                      {interactionResult === 'moderate' && 'These medications may interact. Monitor for side effects and consult your pharmacist.'}
                      {interactionResult === 'minor' && 'There is a minor interaction risk. Generally safe but be aware of potential effects.'}
                      {interactionResult === 'none' && 'No known interactions between these medications.'}
                    </p>
                    <div className="text-cyan-300/70 text-sm font-[family-name:var(--font-ibm-plex-mono)]">
                      This is for informational purposes only. Always consult healthcare professionals.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clear Button */}
          {(selectedDrug1 || selectedDrug2) && (
            <button
              onClick={clearAll}
              className="mt-6 text-cyan-300/70 hover:text-cyan-300 transition-colors text-sm font-[family-name:var(--font-ibm-plex-mono)] underline"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
    </main>
  );
}