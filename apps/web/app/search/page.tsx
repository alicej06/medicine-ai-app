// app/search/page.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { searchDrugs, getExplanation } from '@/lib/api';
import type { Drug, Explanation } from '@/lib/types';

type AnyDrug = Drug & {
  id?: number | string;
  genericName?: string;
  brandNames?: string[];
  display_name?: string;
  name?: string;
  rxCui?: string;
  rxcui?: string;
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [drugs, setDrugs] = useState<AnyDrug[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const [selectedDrug, setSelectedDrug] = useState<AnyDrug | null>(null);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [isLoadingExplain, setIsLoadingExplain] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  const getDisplayFields = (drug: AnyDrug) => {
  const raw = drug as any;

  const rxCui =
    raw.rx_cui ||
    raw.rxCui ||
    raw.rxcui ||
    (typeof raw.id === "string" ? raw.id.replace("rxn:", "") : null);

  let genericName =
    raw.generic_name ||
    raw.genericName ||
    raw.name ||
    raw.display_name ||
    null;

  const brandNames =
    raw.brand_names ||
    raw.brandNames ||
    [];

  // If no generic name, fallback sensibly
  if (!genericName) {
    if (brandNames.length > 0) genericName = brandNames[0];
    else if (rxCui) genericName = `Drug ${rxCui}`;
  }

  return {
    rxCui,
    genericName,
    brandNames,
    drugClass: raw.drug_class || raw.drugClass || null,
  };
};


  const loadExplanation = async (drug: AnyDrug) => {
    setSelectedDrug(drug);
    setExplanation(null);
    setExplainError(null);

    const { rxCui, genericName } = getDisplayFields(drug);

    const drugIdForExplain =
      genericName !== 'Unknown drug'
        ? genericName
        : rxCui || genericName;

    if (!drugIdForExplain) {
      setExplainError('No identifier available to explain this drug.');
      return;
    }

    setIsLoadingExplain(true);
    try {
      const exp = await getExplanation(drugIdForExplain);
      setExplanation(exp);
    } catch (e) {
      console.error('Explain error:', e);
      setExplainError('Could not generate an explanation for this drug.');
    } finally {
      setIsLoadingExplain(false);
    }
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setSelectedDrug(null);
    setExplanation(null);
    setExplainError(null);

    try {
      const result = await searchDrugs(searchQuery, 50);
      const list = (result.drugs || result || []) as AnyDrug[];
      setDrugs(list);

      if (!recentSearches.includes(searchQuery)) {
        setRecentSearches(prev => [searchQuery, ...prev.slice(0, 4)]);
      }

      if (!list || list.length === 0) {
        setError(`No results found for "${searchQuery}". Try a different search term.`);
      } else {
        await loadExplanation(list[0]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search drugs. Please check your backend connection.');
      setDrugs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const clearSearch = () => {
    setQuery('');
    setDrugs([]);
    setHasSearched(false);
    setError(null);
    setSelectedDrug(null);
    setExplanation(null);
    setExplainError(null);
  };

  const handleRecentSearch = (search: string) => {
    setQuery(search);
    handleSearch(search);
  };

  const selectedDisplay = selectedDrug ? getDisplayFields(selectedDrug) : null;

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1127] via-[#164357] via-[#1E5A6B] to-[#2E8080] to-[#5AAF9E]">
        <div className="absolute inset-0 bg-gradient-to-tl from-[#5AAF9E]/40 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="px-8 md:px-16 lg:px-24 py-12 flex items-center justify-between">
          {/* <Link
            href="/"
            className="inline-flex items-center gap-2 text-cyan-300/80 hover:text-cyan-200 transition-colors group"
          >
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-[family-name:var(--font-ibm-plex-mono)]">Home</span>
          </Link> */}
        </header>

        {/* Main content */}
        <div className="px-8 md:px-16 lg:px-24 pb-20">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 font-[family-name:var(--font-space-grotesk)]">
              Drug Information
            </h1>
            <p className="text-cyan-200/80 text-lg font-[family-name:var(--font-ibm-plex-mono)]">
              Search for medication information and AI explanations
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto mb-8">
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for a drug (e.g., sertraline, ibuprofen, metformin)..."
                    className="w-full bg-[#0B1127]/80 backdrop-blur-sm border-2 border-cyan-400/40 rounded-lg px-6 py-4 pr-12 text-white placeholder-cyan-300/40 focus:outline-none focus:border-cyan-400 transition-colors text-lg"
                    autoFocus
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-300/60 hover:text-cyan-300 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold px-8 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-cyan-500/50 font-[family-name:var(--font-ibm-plex-mono)] tracking-wider"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      SEARCHING
                    </div>
                  ) : (
                    'SEARCH'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Error */}
          {error && !isLoading && (
            <div className="max-w-3xl mx-auto mt-8">
              <div className="p-6 bg-red-900/20 border border-red-500/50 rounded-lg text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <p className="text-red-200 text-lg mb-2">{error}</p>
                <p className="text-red-300/60 text-sm">
                  Try a different search term or check your spelling.
                </p>
              </div>
            </div>
          )}

          {/* Explainer Panel */}
          {!isLoading && selectedDrug && (
            <div className="max-w-5xl mx-auto mt-10">
              <div className="p-8 bg-[#0B1127]/90 backdrop-blur-sm border border-cyan-400/40 rounded-2xl shadow-xl">
                <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
                      {selectedDisplay?.genericName}
                    </h2>
                    {selectedDisplay?.rxCui && (
                      <p className="text-cyan-300/70 text-sm mt-1 font-mono">
                        RxCUI: {selectedDisplay.rxCui}
                      </p>
                    )}
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs uppercase tracking-wider bg-cyan-900/40 border border-cyan-400/40 text-cyan-200 font-[family-name:var(--font-ibm-plex-mono)]">
                    AI Explanation
                  </span>
                </div>

                {isLoadingExplain && (
                  <p className="text-cyan-200/80 text-sm">
                    Generating explanation…
                  </p>
                )}

                {explainError && !isLoadingExplain && (
                  <p className="text-red-300 text-sm">
                    {explainError}
                  </p>
                )}

                {/* 👇 THIS PART CHANGED: treat explanation as any so TS stops complaining */}
                {explanation && !isLoadingExplain && !explainError && (() => {
                  const exp: any = explanation;
                  const bullets: string[] = exp.summary ?? exp.bullets ?? [];
                  const citations: any[] = exp.citations ?? [];
                  const disclaimer: string =
                    exp.disclaimer ??
                    'Educational use only. Not medical advice.';

                  return (
                    <>
                      <ul className="space-y-2 mb-6">
                        {bullets.map((bullet, idx) => (
                          <li
                            key={idx}
                            className="flex gap-2 text-cyan-100 text-sm leading-relaxed"
                          >
                            <span className="text-cyan-400 mt-0.5">•</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>

                      {citations.length > 0 && (
                        <div className="mt-4">
                          <h3 className="text-sm font-semibold text-cyan-200 mb-2 font-[family-name:var(--font-ibm-plex-mono)]">
                            Sources used
                          </h3>
                          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                            {citations.map((c) => (
                              <div
                                key={c.id}
                                className="p-3 bg-cyan-900/20 border border-cyan-400/30 rounded-lg"
                              >
                                <p className="text-xs text-cyan-300/70 mb-1">
                                  [{c.section || 'Label information'}]
                                </p>
                                <p className="text-xs text-cyan-100/90">
                                  {c.snippet}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {disclaimer && (
                        <p className="mt-4 text-xs text-cyan-300/60 text-center font-[family-name:var(--font-ibm-plex-mono)]">
                          {disclaimer}
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Result list */}
          {!isLoading && hasSearched && drugs.length > 0 && (
            <div className="max-w-5xl mx-auto mt-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-cyan-200 font-[family-name:var(--font-ibm-plex-mono)]">
                  Found <span className="font-semibold text-cyan-100">{drugs.length}</span>{' '}
                  result{drugs.length !== 1 ? 's' : ''} for "{query}"
                </p>
                <button
                  onClick={clearSearch}
                  className="text-cyan-300/70 hover:text-cyan-300 text-sm font-[family-name:var(--font-ibm-plex-mono)] underline"
                >
                  Clear Search
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drugs.map((d) => {
                  const { rxCui, genericName, brandNames } = getDisplayFields(d);
                  const isSelected =
                    selectedDrug &&
                    (selectedDrug === d ||
                      getDisplayFields(selectedDrug).rxCui === rxCui);

                  return (
                    <button
                      key={rxCui || (d.id ?? genericName)}
                      type="button"
                      onClick={() => loadExplanation(d)}
                      className={`text-left group p-6 bg-[#0B1127]/80 backdrop-blur-sm border rounded-lg transition-all duration-200 h-full ${
                        isSelected
                          ? 'border-cyan-400/80 bg-cyan-900/30'
                          : 'border-cyan-400/30 hover:border-cyan-400/60 hover:bg-cyan-900/20'
                      }`}
                    >
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-100 transition-colors font-[family-name:var(--font-space-grotesk)]">
                        {genericName}
                      </h3>
                      {brandNames && brandNames.length > 0 && (
                        <p className="text-xs text-cyan-300/70 mb-1">
                          Also known as: {brandNames.slice(0, 3).join(', ')}
                          {brandNames.length > 3 && ` +${brandNames.length - 3} more`}
                        </p>
                      )}
                      {rxCui && (
                        <p className="text-xs text-cyan-300/40 font-mono">
                          RxCUI: {rxCui}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between text-sm text-cyan-400">
                        <span className="font-[family-name:var(--font-ibm-plex-mono)]">
                          {isSelected ? 'Showing explanation' : 'Explain this drug'}
                        </span>
                        <svg
                          className="w-4 h-4 text-cyan-400 transition-transform group-hover:translate-x-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {explanation && (
            <div className="mt-10 max-w-5xl mx-auto p-4 bg-cyan-900/20 border border-cyan-400/30 rounded-lg">
              <p className="text-sm text-cyan-200/70 text-center font-[family-name:var(--font-ibm-plex-mono)]">
                ⚕️ This information is for educational purposes only and is not a substitute for professional medical advice.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
