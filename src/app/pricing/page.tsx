"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PricingPage() {
  const [caps, setCaps] = useState<Record<string, { maxKes: number; minKes: number }>>({});

  useEffect(() => {
    fetch("/api/categories/caps")
      .then((r) => r.json())
      .then(setCaps)
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">How pricing works</h1>
      <p className="text-gray-600 text-sm mb-6">
        Technicians set their own quote per job, but never above the SkillLink threshold for that skill.
        Customers can add an optional bonus; SkillLink takes <strong>10%</strong> on the job fee and{" "}
        <strong>5%</strong> on bonuses.
      </p>

      <div className="rounded-2xl border border-gray-200 overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Skill</th>
              <th className="px-4 py-3 font-semibold">Min</th>
              <th className="px-4 py-3 font-semibold">Max (threshold)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(caps).map(([cat, v]) => (
              <tr key={cat} className="border-t border-gray-100">
                <td className="px-4 py-2.5 text-gray-800">{cat}</td>
                <td className="px-4 py-2.5">KES {v.minKes.toLocaleString()}</td>
                <td className="px-4 py-2.5 font-medium">KES {v.maxKes.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link href="/search" className="text-blue-600 font-medium text-sm hover:underline">
        Find a technician →
      </Link>
    </div>
  );
}
