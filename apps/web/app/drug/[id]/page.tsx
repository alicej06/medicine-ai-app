// app/drug/[id]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getDrugById, getExplanation } from '@/lib/api';
import { Drug, Explanation } from '@/lib/types';

export default function DrugDetailPage() {
  const params = useParams();
  const router = useRouter();
  const drugId = params.id as string;

  const [drug, setDrug] = useState<Drug | null>(null);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [isLoadingDrug, setIsLoadingDrug] = useState(true);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDrug() {
      try {
        const drugData = await getDrugById(drugId);
        setDrug(drugData);
      } catch (err) {
        setError('Drug not found');
        console.error('Drug fetch error:', err);
      } finally {
        setIsLoadingDrug(false);
      }
    }

    async function loadExplanation() {
      try {
        const explainData = await getExplanation(drugId);
        setExplanation(explainData);
      } catch (err) {
        console.error('Explanation error:', err);
        // Don't set error - explanation is optional
      } finally {
        setIsLoadingExplanation(false);
      }
    }

    loadDrug();
    loadExplanation();
  }, [drugId]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Drug Not Found</h1>
          <p className="text-gray-600 mb-6">
            We couldn't find information for this drug. It may not be in our database yet.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Search
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingDrug) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading drug information...</p>
        </div>
      </div>
    );
  }

  if (!drug) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2 font-medium transition-colors"
        >
          <span>←</span> Back to Search
        </button>

        {/* Drug Header Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border border-gray-100">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-5xl">💊</div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2 capitalize">
                {drug.generic_name}
              </h1>
              <p className="text-gray-500">RX CUI: {drug.rx_cui}</p>
            </div>
          </div>

          {/* Brand Names */}
          {drug.brand_names && drug.brand_names.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Brand Names
              </h2>
              <div className="flex flex-wrap gap-2">
                {drug.brand_names.map((brand, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-blue-50 text-blue-800 rounded-full text-sm font-medium border border-blue-200"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Synonyms */}
          {drug.synonyms && drug.synonyms.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Also Known As
              </h2>
              <div className="flex flex-wrap gap-2">
                {drug.synonyms.slice(0, 10).map((synonym, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                  >
                    {synonym}
                  </span>
                ))}
                {drug.synonyms.length > 10 && (
                  <span className="px-3 py-1 text-sm text-gray-500">
                    +{drug.synonyms.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
            {drug.drug_class && (
              <div>
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide block mb-1">
                  Drug Class
                </span>
                <p className="text-gray-900 text-lg">{drug.drug_class}</p>
              </div>
            )}
            {drug.atc_code && (
              <div>
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide block mb-1">
                  ATC Code
                </span>
                <p className="text-gray-900 text-lg font-mono">{drug.atc_code}</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Explanation Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🤖</span>
            <h2 className="text-3xl font-bold text-gray-900">
              Simple Explanation
            </h2>
          </div>

          {isLoadingExplanation ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
              </div>
              <div className="space-y-3">
                <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              </div>
            </div>
          ) : explanation ? (
            <div className="space-y-8">
              {/* Purpose */}
              {explanation.purpose && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    What it's used for
                  </h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {explanation.purpose}
                  </p>
                </div>
              )}

              {/* Mechanism */}
              {explanation.mechanism && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">⚙️</span>
                    How it works
                  </h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {explanation.mechanism}
                  </p>
                </div>
              )}

              {/* Warnings */}
              {explanation.warnings && explanation.warnings.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
                  <h3 className="text-xl font-semibold text-red-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">⚠️</span>
                    Important Warnings
                  </h3>
                  <ul className="space-y-2">
                    {explanation.warnings.map((warning, idx) => (
                      <li key={idx} className="text-gray-800 flex items-start gap-2">
                        <span className="text-red-600 mt-1">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Side Effects */}
              {explanation.side_effects && explanation.side_effects.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-lg">
                  <h3 className="text-xl font-semibold text-yellow-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">🩹</span>
                    Common Side Effects
                  </h3>
                  <ul className="space-y-2">
                    {explanation.side_effects.map((effect, idx) => (
                      <li key={idx} className="text-gray-800 flex items-start gap-2">
                        <span className="text-yellow-600 mt-1">•</span>
                        <span>{effect}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sources */}
              {explanation.sources && explanation.sources.length > 0 && (
                <div className="pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Sources:</span>{' '}
                    {explanation.sources.join(', ')}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📚</div>
              <p className="text-gray-500 text-lg">
                AI explanation not available for this drug yet.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Check back later as we continue to expand our database.
              </p>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-gray-100 border border-gray-300 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            ⚕️ <span className="font-semibold">Medical Disclaimer:</span> This information is for educational purposes only. 
            Always consult with a healthcare professional before starting or changing any medication.
          </p>
        </div>
      </div>
    </main>
  );
}

'use client'; // This page must be a Client Component to use hooks

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';


interface Citation {
  section: string;
  snippet: string;
}

interface ExplanationData {
  drugName: string;
  drugId: string;
  summaryBullets: string[];
  citations: Citation[];
}

export default function ExplainPage() {
  const params = useParams();
  const drugId = params.drugId as string; // Get drugId from the URL


  const [data, setData] = useState<ExplanationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (!drugId) return;

    const fetchExplanation = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('http://localhost:8000/explain', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ drugId: drugId }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const result: ExplanationData = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExplanation();
  }, [drugId]); 

 
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <Link
          href="/"
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Search
        </Link>
      </div>
    );
  }

  
  if (!data) {
    return null; 
  }

  return (
    <main className="max-w-3xl mx-auto p-4 md:p-8">
      {/* Drug Name & ID */}
      <h1 className="text-3xl font-bold mb-2">{data.drugName}</h1>
      <p className="text-sm text-gray-500 mb-6">Drug ID (RxCUI): {data.drugId}</p>

      {/* AI Summary Bullets */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Summary</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-800">
          {data.summaryBullets.map((bullet, index) => (
            <li key={index}>{bullet}</li>
          ))}
        </ul>
      </div>

      <hr className="my-8" />

      {/* Sources / Citations */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Sources</h2>
        <div className="space-y-6">
          {data.citations.map((citation, index) => (
            <div
              key={index}
              className="bg-gray-50 border border-gray-200 p-4 rounded-lg"
            >
              <h3 className="font-semibold text-gray-800 mb-1">
                From: {citation.section}
              </h3>
              <blockquote className="border-l-4 border-gray-400 pl-4 text-gray-600 italic">
                "{citation.snippet}"
              </blockquote>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-sm italic text-gray-500 mt-12 text-center">
        **Disclaimer:** This tool is for informational purposes only and is not
        a substitute for professional medical advice, diagnosis, or treatment.
        Always consult your healthcare provider.
      </p>
    </main>
  );
}

'use client'; 

import { useState } from 'react';
import Link from 'next/link'; 


interface DrugSearchResult {
  rx_cui: string;
  generic_name: string;
  brand_names: string[];
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DrugSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);


  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setResults([
      {
        rx_cui: '5468',
        generic_name: 'Ibuprofen',
        brand_names: ['Advil', 'Motrin'],
      },
      {
        rx_cui: '11529',
        generic_name: 'Warfarin',
        brand_names: ['Coumadin', 'Jantoven'],
      },
    ]);
    setIsLoading(false);
  };

  return (
    <main className="max-w-xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-center mb-6">
        Medicine Explainer
      </h1>
      
      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a drug (e.g., 'ibuprofen')"
          className="flex-grow p-2 border border-gray-300 rounded-md"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* --- This is the new part: Linking to the explain page --- */}
      <div className="space-y-3">
        {results.map((drug) => (
          <Link
            key={drug.rx_cui}
            href={`/explain/${drug.rx_cui}`}
            className="block p-4 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold text-lg text-blue-700">
              {drug.generic_name}
            </h3>
            <p className="text-sm text-gray-600">
              {drug.brand_names?.join(', ')}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}