"use client";

import { useState } from "react";
import { MatchResult } from "@/types";
import Link from "next/link";
import RequestJobModal from "./RequestJobModal";

interface Props {
  match: MatchResult;
}

export default function ProviderCard({ match }: Props) {
  const { provider, score, reasons } = match;
  const [showModal, setShowModal] = useState(false);

  const defaultPrice = Object.values(provider.fixedRates || {})[0] || 2500;
  const firstSkill = provider.skills[0] || "General";

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <img
            src={provider.avatar || "https://i.pravatar.cc/150"}
            alt={provider.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-blue-100"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg text-gray-900 truncate">{provider.name}</h3>
              {provider.isVerified && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ Verified</span>
              )}
              {provider.badges.includes("Certified") && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Certified</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
              <span className="font-medium text-amber-600">★ {provider.rating.toFixed(1)}</span>
              <span>({provider.reviewCount} reviews)</span>
              <span>•</span>
              <span>{provider.experienceYears} yrs exp</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{score}%</div>
            <div className="text-xs text-gray-500">AI Match</div>
          </div>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2">{provider.bio}</p>

        <div className="flex flex-wrap gap-1.5">
          {provider.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg">
              {skill.split(" ")[0]}…
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-500">
            {provider.location?.address} • {provider.serviceRadiusKm} km radius
          </div>
          <div className="font-semibold text-gray-900">
            From KES {defaultPrice.toLocaleString()}
          </div>
        </div>

        <div className="flex flex-wrap gap-1 text-xs text-gray-500">
          {reasons.slice(0, 3).map((r) => (
            <span key={r} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{r}</span>
          ))}
        </div>

        <div className="flex gap-2 mt-1">
          <Link
            href={`/provider/${provider.id}`}
            className="flex-1 text-center py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            View Profile
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            Request Job
          </button>
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
    </>
  );
}
