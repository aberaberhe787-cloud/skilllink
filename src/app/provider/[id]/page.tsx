"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import RequestJobModal from "@/components/RequestJobModal";

interface ProviderDetail {
  id: string;
  name: string;
  avatar: string;
  bio: string | null;
  experienceYears: number;
  serviceRadiusKm: number;
  isVerified: boolean;
  badges: string[];
  rating: number;
  reviewCount: number;
  completionRate: number;
  responseTimeMinutes: number;
  isAvailable: boolean;
  totalJobsCompleted: number;
  location: { lat: number; lng: number; address: string } | null;
  skills: string[];
  fixedRates: Record<string, number>;
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    fromName: string;
  }[];
}

export default function ProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/providers/${id}`);
        if (!res.ok) {
          setError("Technician not found");
          return;
        }
        setProvider(await res.json());
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-500">Loading profile…</div>;
  }

  if (error || !provider) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 mb-4">{error || "Not found"}</p>
        <Link href="/search" className="text-blue-600 hover:underline">← Back to search</Link>
      </div>
    );
  }

  const defaultPrice = Object.values(provider.fixedRates)[0] || 2500;
  const firstSkill = provider.skills[0] || "General";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/search" className="text-sm text-blue-600 hover:underline mb-6 inline-flex items-center gap-1">
        ← Back to search
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-6">
            <img src={provider.avatar} alt={provider.name} className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-2 border-blue-100" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{provider.name}</h1>
                {provider.isVerified && (
                  <span className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full font-medium">✓ Verified</span>
                )}
                {provider.badges.map((b) => (
                  <span key={b} className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-medium">{b}</span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                <span className="text-amber-600 font-semibold">★ {provider.rating.toFixed(1)}</span>
                <span>{provider.reviewCount} reviews</span>
                <span className="text-gray-300">•</span>
                <span>{provider.experienceYears} years experience</span>
                <span className="text-gray-300">•</span>
                <span>{provider.totalJobsCompleted} jobs done</span>
              </div>
              {provider.bio && <p className="mt-4 text-gray-700 leading-relaxed">{provider.bio}</p>}
              <p className="mt-2 text-sm text-gray-500">
                {provider.location?.address || "Location not set"} • Serves within {provider.serviceRadiusKm} km
                {provider.isAvailable ? (
                  <span className="ml-2 text-green-600 font-medium">● Available now</span>
                ) : (
                  <span className="ml-2 text-gray-400">● Currently busy</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">Skills & Rates</h2>
            <ul className="space-y-2">
              {provider.skills.map((skill) => (
                <li key={skill} className="flex justify-between items-center text-sm bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-gray-800">{skill}</span>
                  <span className="font-semibold text-gray-900">KES {provider.fixedRates[skill]?.toLocaleString() || "—"}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">Reliability</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Completion rate</span>
                <span className="font-medium">{provider.completionRate}%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Avg response time</span>
                <span className="font-medium">{provider.responseTimeMinutes} min</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Total jobs completed</span>
                <span className="font-medium">{provider.totalJobsCompleted}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <h2 className="font-semibold text-gray-900 mb-4">Reviews ({provider.reviews.length})</h2>
          {provider.reviews.length === 0 ? (
            <p className="text-gray-500 text-sm">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {provider.reviews.map((review) => (
                <div key={review.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-amber-600 font-medium">★ {review.rating}</span>
                    <span className="text-sm text-gray-700 font-medium">{review.fromName}</span>
                    <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  {review.comment && <p className="text-sm text-gray-700">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
          <button onClick={() => setShowModal(true)}
            className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">
            Request Job
          </button>
          <button className="px-8 py-3.5 rounded-xl border border-gray-300 font-medium hover:bg-white transition">Message</button>
        </div>
      </div>

      {showModal && (
        <RequestJobModal
          providerId={provider.id}
          providerName={provider.name}
          category={firstSkill}
          defaultPrice={defaultPrice}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
