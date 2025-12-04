// app/interactions/page.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { searchDrugs } from '@/lib/api';
import { Drug } from '@/lib/types';

type InteractionRule = {
  id: number;
  a_rx_cui: string;
  b_rx_cui: string;
  severity: string;
  mechanism: string;
  guidance: string;
};

type DrugMatch = {
  rx_cui: string;
  generic_name: string;
  brand_names?: string[];
};

type DrugSearchResponse = {
  found: boolean;
} & Partial<DrugMatch>;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

export default function InteractionsPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drug, setDrug] = useState<DrugMatch | null>(null);
  const [interactions, setInteractions] = useState<InteractionRule[] | null>(
    null
  );
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setDrug(null);
    setInteractions(null);

    const trimmed = query.trim();
    if (!trimmed) {
      setError('Please enter a drug name.');
      return;
    }

    setLoading(true);
    try {
      // 1) Look up the drug in your DB by name
      //    Backend: GET /drugs/search?name={query}
      const drugRes = await fetch(
        `${API_BASE_URL}/drugs/search?name=${encodeURIComponent(trimmed)}`
      );

      if (!drugRes.ok) {
        throw new Error('Failed to search drug');
      }

      const drugData: DrugSearchResponse = await drugRes.json();

      if (!drugData.found || !drugData.rx_cui || !drugData.generic_name) {
        setInfoMessage('Information not found');
        return;
      }

      const selected: DrugMatch = {
        rx_cui: drugData.rx_cui,
        generic_name: drugData.generic_name,
        brand_names: drugData.brand_names ?? [],
      };

      setDrug(selected);

      // 2) Fetch interaction rules for this drug by RxCUI
      //    Backend: GET /interactions/{rx_cui}
      const interactionsRes = await fetch(
        `${API_BASE_URL}/interactions/${encodeURIComponent(selected.rx_cui)}`
      );

      if (!interactionsRes.ok) {
        throw new Error('Failed to fetch interactions');
      }

      const interactionData: InteractionRule[] = await interactionsRes.json();

      if (!interactionData || interactionData.length === 0) {
        setInfoMessage('Information not found');
        return;
      }

      setInteractions(interactionData);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a4b5c] to-[#2d7a7a]">
      <div className="container mx-auto px-4 py-25">
        {/* <Link
          href="/"
          className="inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-200 mb-8"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Home
        </Link> */}

        <div className="max-w-2xl mx-auto bg-white/5 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">
            Drug Interaction Checker
          </h1>
          <p className="text-cyan-100/80 text-center mb-8">
            Enter a single drug name to see known interaction warnings.
          </p>

          {/* Search form – SINGLE input */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div>
              <label
                htmlFor="drug-name"
                className="block text-sm font-medium text-cyan-100 mb-2"
              >
                Drug name
              </label>
              <input
                id="drug-name"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., sertraline"
                className="w-full rounded-xl px-4 py-3 bg-white/10 border border-cyan-300/40 text-cyan-50 placeholder:text-cyan-200/40 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex justify-center items-center rounded-xl bg-cyan-400/90 text-slate-900 font-semibold py-3 hover:bg-cyan-300 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Checking…' : 'Check Interactions'}
            </button>
          </form>

          {/* Feedback / errors */}
          {error && (
            <div className="mb-4 text-sm text-red-300 bg-red-900/30 border border-red-500/40 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 text-sm text-yellow-200 bg-yellow-900/30 border border-yellow-500/40 rounded-lg px-4 py-3">
              {infoMessage}
            </div>
          )}

          {/* Drug meta */}
          {drug && (
            <div className="mb-6 rounded-xl border border-cyan-300/30 bg-slate-900/40 px-4 py-3 text-sm text-cyan-100">
              <p>
                <span className="font-semibold">Matched drug:</span>{' '}
                {drug.generic_name}
              </p>
              {drug.brand_names && drug.brand_names.length > 0 && (
                <p className="mt-1">
                  <span className="font-semibold">Brand names:</span>{' '}
                  {drug.brand_names.join(', ')}
                </p>
              )}
              <p className="mt-1">
                <span className="font-semibold">RxCUI:</span> {drug.rx_cui}
              </p>
            </div>
          )}

          {/* Interaction results */}
          {interactions && interactions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-cyan-100">
                Interaction warnings
              </h2>
              <div className="space-y-3">
                {interactions.map((interaction) => (
                  <div
                    key={interaction.id}
                    className="rounded-xl bg-slate-900/60 border border-cyan-300/30 px-4 py-3 text-sm text-cyan-50"
                  >
                    <p className="font-semibold mb-1">
                      Interacts with: {interaction.b_rx_cui}
                    </p>
                    <p className="text-cyan-200/90">
                      <span className="font-semibold">Severity:</span>{' '}
                      {interaction.severity || 'Unknown'}
                    </p>
                    <p className="text-cyan-200/80 mt-1">
                      <span className="font-semibold">Mechanism:</span>{' '}
                      {interaction.mechanism || 'No mechanism provided.'}
                    </p>
                    <p className="text-cyan-200/80 mt-1">
                      <span className="font-semibold">Guidance:</span>{' '}
                      {interaction.guidance || 'No guidance provided.'}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-cyan-200/60">
                Educational use only. Not medical advice.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
