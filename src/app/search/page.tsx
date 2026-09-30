"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SKILL_CATEGORIES } from "@/data/mock";
import { getAIMatches } from "@/lib/ai-matching";
import { SkillCategory, ProviderProfile } from "@/types";
import ProviderCard from "@/components/ProviderCard";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialCategory =
    (searchParams.get("category") as SkillCategory) || SKILL_CATEGORIES[0];

  const [category, setCategory] = useState<SkillCategory>(initialCategory);
  const [topOnly, setTopOnly] = useState(true);
  const [query, setQuery] = useState("");
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const seekerLat = -1.286389;
  const seekerLng = 36.817223;

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/providers?category=${encodeURIComponent(category)}&available=true`
        );
        if (!res.ok) throw new Error("Failed to load technicians");
        const data = await res.json();
        setProviders(data);
      } catch (err: any) {
        setError(err.message || "Could not load data");
        setProviders([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [category]);

  const matches = useMemo(() => {
    return getAIMatches(providers, {
      category,
      seekerLat,
      seekerLng,
      preferTopOnly: topOnly,
    });
  }, [providers, category, topOnly]);

  const filtered = query
    ? matches.filter(
        (m) =>
          m.provider.name.toLowerCase().includes(query.toLowerCase()) ||
          m.provider.bio.toLowerCase().includes(query.toLowerCase())
      )
    : matches;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Find skilled help near you
        </h1>
        <p className="text-gray-600 mt-1">
          AI matches the best verified technicians around your location
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8 shadow-sm">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Skill category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SkillCategory)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {SKILL_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Search by name</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. James, Amina…"
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2.5 cursor-pointer select-none py-2.5">
              <input
                type="checkbox"
                checked={topOnly}
                onChange={(e) => setTopOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Top AI matches only (≥75%)</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          {loading ? "Loading…" : `${filtered.length} technician${filtered.length !== 1 ? "s" : ""} found • Sorted by AI Match`}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 text-amber-800 text-sm">
          {error}. Run <code className="bg-amber-100 px-1 rounded">npm run db:seed</code>.
        </div>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 h-64 animate-pulse">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-600 font-medium">No matching technicians found</p>
          <p className="text-sm text-gray-500 mt-1">Try a different category or turn off "Top only"</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {filtered.map((match) => (
            <ProviderCard key={match.provider.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-16 text-center text-gray-500">Loading search…</div>}>
      <SearchContent />
    </Suspense>
  );
}
