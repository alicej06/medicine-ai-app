// app/search/page.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { searchDrugs } from '@/lib/api';
import { Drug } from '@/lib/types';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const result = await searchDrugs(searchQuery, 50);
      setDrugs(result.drugs || []);
      
      // Add to recent searches
      if (!recentSearches.includes(searchQuery)) {
        setRecentSearches(prev => [searchQuery, ...prev.slice(0, 4)]);
      }

      if (!result.drugs || result.drugs.length === 0) {
        setError(`No results found for "${searchQuery}". Try a different search term.`);
      }
    } catch (err) {
      setError('Failed to search drugs. Please check your backend connection.');
      console.error('Search error:', err);
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
  };

  const handleRecentSearch = (search: string) => {
    setQuery(search);
    handleSearch(search);
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1127] via-[#164357] via-[#1E5A6B] to-[#2E8080] to-[#5AAF9E]">
        <div className="absolute inset-0 bg-gradient-to-tl from-[#5AAF9E]/40 via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="px-8 md:px-16 lg:px-24 py-15">
          {/* <Link 
            href="/"
            className="inline-flex items-center gap-2 text-cyan-300/80 hover:text-cyan-200 transition-colors group"
          >
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-[family-name:var(--font-ibm-plex-mono)]">Back to Home</span>
          </Link> */}
        </header>

        {/* Main Content */}
        <div className="px-8 md:px-16 lg:px-24 pb-20">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 font-[family-name:var(--font-space-grotesk)]">
              Drug Information
            </h1>
            <p className="text-cyan-200/80 text-lg font-[family-name:var(--font-ibm-plex-mono)]">
              Search for medication information and explanations
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
                    placeholder="Search for a drug (e.g., ibuprofen, lisinopril, metformin)..."
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
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      SEARCHING
                    </div>
                  ) : (
                    'SEARCH'
                  )}
                </button>
              </div>
            </form>

            {/* Recent Searches */}
            {recentSearches.length > 0 && !hasSearched && (
              <div className="mt-4">
                <p className="text-cyan-300/60 text-sm mb-2 font-[family-name:var(--font-ibm-plex-mono)]">
                  Recent Searches:
                </p>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleRecentSearch(search)}
                      className="px-3 py-1 bg-cyan-900/30 border border-cyan-400/30 rounded-full text-cyan-200 text-sm hover:bg-cyan-900/50 hover:border-cyan-400/50 transition-all"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Search Examples */}
          {!hasSearched && (
            <div className="max-w-3xl mx-auto">
              <p className="text-cyan-300/60 text-sm mb-4 text-center font-[family-name:var(--font-ibm-plex-mono)]">
                Try searching for:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Ibuprofen', 'Lisinopril', 'Metformin', 'Aspirin'].map((example) => (
                  <button
                    key={example}
                    onClick={() => {
                      setQuery(example);
                      handleSearch(example);
                    }}
                    className="p-4 bg-[#0B1127]/60 backdrop-blur-sm border border-cyan-400/30 rounded-lg hover:border-cyan-400/50 hover:bg-cyan-900/20 transition-all group"
                  >
                    <div className="text-2xl mb-2">💊</div>
                    <div className="text-cyan-100 font-medium">{example}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="max-w-5xl mx-auto mt-12">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="p-6 bg-[#0B1127]/60 backdrop-blur-sm border border-cyan-400/30 rounded-lg animate-pulse"
                  >
                    <div className="h-6 bg-cyan-400/20 rounded w-3/4 mb-3"></div>
                    <div className="flex gap-2 mb-3">
                      <div className="h-6 bg-cyan-400/20 rounded w-20"></div>
                      <div className="h-6 bg-cyan-400/20 rounded w-24"></div>
                    </div>
                    <div className="h-4 bg-cyan-400/20 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="max-w-3xl mx-auto mt-12">
              <div className="p-6 bg-red-900/20 border border-red-500/50 rounded-lg text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <p className="text-red-200 text-lg mb-2">{error}</p>
                <p className="text-red-300/60 text-sm">
                  Try a different search term or check your spelling
                </p>
              </div>
            </div>
          )}

          {/* Results */}
          {!isLoading && hasSearched && drugs.length > 0 && (
            <div className="max-w-5xl mx-auto mt-12">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-cyan-200 font-[family-name:var(--font-ibm-plex-mono)]">
                  Found <span className="font-semibold text-cyan-100">{drugs.length}</span> result{drugs.length !== 1 ? 's' : ''} for "{query}"
                </p>
                <button
                  onClick={clearSearch}
                  className="text-cyan-300/70 hover:text-cyan-300 text-sm font-[family-name:var(--font-ibm-plex-mono)] underline"
                >
                  Clear Search
                </button>
              </div>

              {/* Drug Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drugs.map((drug) => (
                  <Link
                    key={drug.rx_cui}
                    href={`/drug/${drug.rx_cui}`}
                    className="block group"
                  >
                    <div className="p-6 bg-[#0B1127]/80 backdrop-blur-sm border border-cyan-400/30 rounded-lg hover:border-cyan-400/60 hover:bg-cyan-900/20 transition-all duration-200 h-full">
                      {/* Drug Name */}
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-100 transition-colors font-[family-name:var(--font-space-grotesk)] capitalize">
                        {drug.generic_name}
                      </h3>

                      {/* Brand Names */}
                      {drug.brand_names && drug.brand_names.length > 0 && (
                        <div className="mb-3">
                          <span className="text-cyan-300/60 text-xs uppercase tracking-wider">Also known as:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {drug.brand_names.slice(0, 3).map((brand, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-cyan-900/30 border border-cyan-400/30 rounded text-cyan-100 text-sm"
                              >
                                {brand}
                              </span>
                            ))}
                            {drug.brand_names.length > 3 && (
                              <span className="px-2 py-1 text-cyan-300/60 text-sm">
                                +{drug.brand_names.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Drug Class */}
                      {drug.drug_class && (
                        <div className="mb-3">
                          <span className="text-cyan-300/60 text-xs uppercase tracking-wider">Class:</span>
                          <p className="text-cyan-200 text-sm mt-1">{drug.drug_class}</p>
                        </div>
                      )}

                      {/* RX CUI */}
                      <div className="pt-3 border-t border-cyan-400/20">
                        <p className="text-cyan-300/40 text-xs font-mono">
                          RxCUI: {drug.rx_cui}
                        </p>
                      </div>

                      {/* View Details Link */}
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-cyan-400 text-sm font-medium group-hover:underline font-[family-name:var(--font-ibm-plex-mono)]">
                          View Details
                        </span>
                        <svg 
                          className="w-5 h-5 text-cyan-400 transition-transform group-hover:translate-x-1"
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* No Results but No Error */}
          {!isLoading && hasSearched && drugs.length === 0 && !error && (
            <div className="max-w-3xl mx-auto mt-12 text-center">
              <div className="text-6xl mb-6">🔍</div>
              <h3 className="text-2xl text-cyan-100 mb-4 font-[family-name:var(--font-space-grotesk)]">
                No results found
              </h3>
              <p className="text-cyan-300/60 mb-6">
                Try searching with a different term or spelling
              </p>
              <button
                onClick={clearSearch}
                className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Try Another Search
              </button>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        {drugs.length > 0 && (
          <div className="px-8 md:px-16 lg:px-24 pb-8">
            <div className="max-w-5xl mx-auto p-4 bg-cyan-900/20 border border-cyan-400/30 rounded-lg">
              <p className="text-sm text-cyan-200/70 text-center font-[family-name:var(--font-ibm-plex-mono)]">
                ⚕️ This information is for educational purposes only. Always consult healthcare professionals about medications.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}