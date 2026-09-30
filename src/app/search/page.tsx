"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SKILL_CATEGORIES } from "@/data/mock";
import { getAIMatches } from "@/lib/ai-matching";
import { SkillCategory, ProviderProfile } from "@/types";
import ProviderCard from "@/components/ProviderCard";

const CITIES = [
  { name: "Nairobi CBD", lat: -1.286389, lng: 36.817223 },
  { name: "Westlands", lat: -1.267, lng: 36.811 },
  { name: "Karen", lat: -1.319, lng: 36.708 },
  { name: "Eastleigh", lat: -1.27, lng: 36.85 },
  { name: "Mombasa", lat: -4.0435, lng: 39.6682 },
  { name: "Kisumu", lat: -0.0917, lng: 34.768 },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const initialCategory =
    (searchParams.get("category") as SkillCategory) || SKILL_CATEGORIES[0];

  const [category, setCategory] = useState<SkillCategory>(initialCategory);
  const [topOnly, setTopOnly] = useState(true);
  const [query, setQuery] = useState("");
  const [cityIdx, setCityIdx] = useState(0);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const city = CITIES[cityIdx];

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
        setProviders(Array.isArray(data) ? data : []);
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
      seekerLat: city.lat,
      seekerLng: city.lng,
      preferTopOnly: topOnly,
    });
  }, [providers, category, topOnly, city]);

  const filtered = query
    ? matches.filter(
        (m) =>
          m.provider.name.toLowerCase().includes(query.toLowerCase()) ||
          m.provider.bio.toLowerCase().includes(query.toLowerCase())
      )
    : matches;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Find skilled help near you</h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          AI ranks verified technicians by skill, distance, rating and availability · Prices in KES
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 mb-6 shadow-sm">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Skill</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as SkillCategory)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
              {SKILL_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Area</label>
            <select value={cityIdx} onChange={(e) => setCityIdx(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
              {CITIES.map((c, i) => (
                <option key={c.name} value={i}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Search name</label>
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. James, Amina…"
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2.5 cursor-pointer select-none py-2.5 w-full rounded-xl border border-gray-200 px-3 hover:bg-gray-50">
              <input type="checkbox" checked={topOnly} onChange={(e) => setTopOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm font-medium text-gray-700">Top matches only (≥75%)</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <p className="text-sm text-gray-600">
          {loading ? "Loading technicians…" : `${filtered.length} result${filtered.length !== 1 ? "s" : ""} near ${city.name}`}
        </p>
        <p className="text-xs text-gray-400">Sorted by AI Match score</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-900 text-sm">
          <strong>Could not load live data.</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 h-56 animate-pulse">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-800 font-medium">No matching technicians found</p>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            Try another skill, area, or turn off Top matches only.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
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
