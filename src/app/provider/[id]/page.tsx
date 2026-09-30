"use client";

import { use, useEffect, useMemo, useState } from "react";
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

function portfolioForSkills(skills: string[], providerId: string) {
  const pool = [
    { key: "printer", label: "Printer repair", url: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&h=300&fit=crop" },
    { key: "cctv", label: "CCTV install", url: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&h=300&fit=crop" },
    { key: "tv", label: "TV setup", url: "https://images.unsplash.com/photo-1593359677913-5b55ce0a5f6e?w=400&h=300&fit=crop" },
    { key: "laptop", label: "Laptop service", url: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&h=300&fit=crop" },
    { key: "network", label: "Networking", url: "https://images.unsplash.com/photo-1544197150-b99a580bb7a2?w=400&h=300&fit=crop" },
    { key: "default", label: "On-site work", url: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop" },
  ];
  const joined = skills.join(" ").toLowerCase();
  const picked = pool.filter((item) => item.key !== "default" && (joined.includes(item.key) || skills.some((s) => s.toLowerCase().includes(item.key))));
  if (!picked.length) picked.push(pool[pool.length - 1]);
  while (picked.length < 3) {
    const next = pool[(picked.length + providerId.length) % pool.length];
    if (!picked.find((p) => p.url === next.url)) picked.push(next);
    else break;
  }
  return picked.slice(0, 4);
}

function buildWeekAvailability(isAvailable: boolean) {
  const slotSets = [
    ["09:00", "11:00", "14:00", "16:00"],
    ["10:00", "13:00", "15:30"],
    ["09:30", "12:00", "17:00"],
    ["11:00", "14:30"],
    ["09:00", "10:30", "15:00", "16:30"],
    ["10:00", "13:00"],
    [],
  ];
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const label = d.toLocaleDateString("en-KE", { weekday: "short" });
    const date = d.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
    const slots = isAvailable ? slotSets[i % slotSets.length] : [];
    days.push({ label, date, slots, available: slots.length > 0 });
  }
  return days;
}

export default function ProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

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

  const portfolio = useMemo(() => (provider ? portfolioForSkills(provider.skills, provider.id) : []), [provider]);
  const week = useMemo(() => (provider ? buildWeekAvailability(provider.isAvailable) : []), [provider]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-2xl" />
          <div className="h-6 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-700 font-medium mb-2">{error || "Not found"}</p>
        <Link href="/search" className="text-blue-600 hover:underline text-sm">← Back to search</Link>
      </div>
    );
  }

  const defaultPrice = Object.values(provider.fixedRates)[0] || 2500;
  const firstSkill = provider.skills[0] || "General repair";
  const rates = Object.values(provider.fixedRates);
  const minRate = rates.length ? Math.min(...rates) : defaultPrice;

  return (
    <div className="pb-28 md:pb-10">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        <Link href="/search" className="text-sm text-blue-600 hover:underline mb-5 inline-flex">← Back to search</Link>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-20 md:h-28" />
          <div className="px-5 md:px-8 pb-6 -mt-10 md:-mt-12">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
              <img src={provider.avatar} alt={provider.name} className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-4 border-white shadow-md bg-gray-100" />
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900 truncate">{provider.name}</h1>
                  {provider.isVerified && <span className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">✓ Verified</span>}
                  {provider.isAvailable ? (
                    <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-medium">● Available now</span>
                  ) : (
                    <span className="bg-gray-100 text-gray-500 text-xs px-2.5 py-0.5 rounded-full font-medium">Busy</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-gray-600">
                  <span className="text-amber-600 font-semibold">★ {provider.rating.toFixed(1)}</span>
                  <span>{provider.reviewCount} reviews</span>
                  <span>·</span>
                  <span>{provider.experienceYears} yrs exp</span>
                  <span>·</span>
                  <span>{provider.totalJobsCompleted} jobs done</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {provider.badges.map((b) => (
                    <span key={b} className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full font-medium">{b}</span>
                  ))}
                </div>
              </div>
              <div className="hidden sm:flex flex-col gap-2 shrink-0">
                <button onClick={() => setShowModal(true)} className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-md shadow-blue-600/25">
                  Request job
                </button>
                <p className="text-xs text-center text-gray-500">From <span className="font-semibold text-gray-800">KES {minRate.toLocaleString()}</span></p>
              </div>
            </div>
            {provider.bio && <p className="mt-5 text-gray-700 leading-relaxed text-sm md:text-base">{provider.bio}</p>}
            <p className="mt-2 text-sm text-gray-500">
              📍 {provider.location?.address || "Nairobi area"} · Serves within {provider.serviceRadiusKm} km · Responds in ~{provider.responseTimeMinutes} min
            </p>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Portfolio & past work</h2>
          <p className="text-sm text-gray-500 mb-4">Sample jobs by skill. Real photo uploads come after verification.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {portfolio.map((item) => (
              <button key={item.url} type="button" onClick={() => setLightbox(item.url)} className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                <img src={item.url} alt={item.label} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs font-medium px-2 py-2 text-left">{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Availability this week</h2>
          <p className="text-sm text-gray-500 mb-4">Tap a slot to prefer that time when requesting (demo schedule).</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {week.map((day) => (
              <div key={day.date + day.label} className={`rounded-xl border p-2.5 min-h-[110px] ${day.available ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100"}`}>
                <div className="text-xs font-semibold text-gray-900">{day.label}</div>
                <div className="text-[11px] text-gray-500 mb-2">{day.date}</div>
                {day.slots.length === 0 ? (
                  <p className="text-[11px] text-gray-400">No slots</p>
                ) : (
                  <div className="space-y-1">
                    {day.slots.map((slot) => {
                      const key = `${day.label} ${slot}`;
                      const active = selectedSlot === key;
                      return (
                        <button key={slot} type="button" onClick={() => setSelectedSlot(active ? null : key)}
                          className={`w-full text-[11px] py-1 rounded-lg font-medium transition ${active ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}>
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
          {selectedSlot && (
            <p className="mt-3 text-sm text-blue-700 bg-blue-50 rounded-xl px-3 py-2">
              Preferred time: <strong>{selectedSlot}</strong> — included when you request a job.
            </p>
          )}
        </section>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Skills & rates (KES)</h2>
            <ul className="space-y-2">
              {provider.skills.map((skill) => (
                <li key={skill} className="flex justify-between items-center gap-3 text-sm bg-white border border-gray-200 rounded-xl px-4 py-3">
                  <span className="text-gray-800">{skill}</span>
                  <span className="font-bold text-gray-900 shrink-0">{provider.fixedRates[skill] ? `KES ${provider.fixedRates[skill].toLocaleString()}` : "Ask"}</span>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Reliability</h2>
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
              {[
                { label: "Completion rate", value: `${provider.completionRate}%` },
                { label: "Avg response time", value: `${provider.responseTimeMinutes} min` },
                { label: "Jobs completed", value: String(provider.totalJobsCompleted) },
                { label: "Service radius", value: `${provider.serviceRadiusKm} km` },
              ].map((row) => (
                <div key={row.label} className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-gray-600">{row.label}</span>
                  <span className="font-semibold text-gray-900">{row.value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Reviews ({provider.reviews.length})</h2>
          {provider.reviews.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-500">No reviews yet.</div>
          ) : (
            <div className="space-y-3">
              {provider.reviews.map((review) => (
                <div key={review.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-amber-600 font-semibold text-sm">★ {review.rating}</span>
                    <span className="text-sm font-medium text-gray-800">{review.fromName}</span>
                    <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString("en-KE")}</span>
                  </div>
                  {review.comment && <p className="text-sm text-gray-700">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="hidden md:flex mt-10 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg">Ready to get this fixed?</h3>
            <p className="text-blue-100 text-sm mt-0.5">Pay into escrow in KES. Paid only when you confirm.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="shrink-0 px-8 py-3.5 rounded-xl bg-white text-blue-700 font-semibold hover:bg-blue-50 transition shadow-lg">
            Request job · from KES {minRate.toLocaleString()}
          </button>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur p-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="min-w-0">
            <div className="text-xs text-gray-500">From</div>
            <div className="font-bold text-gray-900">KES {minRate.toLocaleString()}</div>
          </div>
          <button onClick={() => setShowModal(true)} className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">
            Request job
          </button>
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Portfolio" className="max-h-[85vh] max-w-full rounded-lg object-contain" />
          <button type="button" className="absolute top-4 right-4 text-white text-2xl" onClick={() => setLightbox(null)}>×</button>
        </div>
      )}

      {showModal && (
        <RequestJobModal
          providerId={provider.id}
          providerName={provider.name}
          category={firstSkill}
          defaultPrice={defaultPrice}
          preferredTime={selectedSlot || undefined}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
