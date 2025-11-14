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
          <div className="grid grid-cols-1 md:.grid-cols-2 gap-6 pt-6 border-t border-gray-200">
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