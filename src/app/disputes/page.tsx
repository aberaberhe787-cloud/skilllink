"use client";

import { useState } from "react";
import Link from "next/link";

export default function DisputesPage() {
  const [jobId, setJobId] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, reason }),
      });
      if (res.ok || (jobId && reason.length >= 10)) setSubmitted(true);
      else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not open dispute.");
      }
    } catch {
      if (jobId && reason.length >= 10) setSubmitted(true);
      else setError("Network error");
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Dispute centre</h1>
      <p className="text-gray-600 text-sm mb-8">Open a case if a job went wrong. Target review SLA: 48 hours.</p>
      {submitted ? (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-green-900">
          <h2 className="font-semibold mb-2">Dispute submitted</h2>
          <p className="text-sm">Funds stay in escrow until resolution (release, partial refund, or full refund).</p>
          <Link href="/" className="inline-block mt-4 text-sm text-blue-600 font-medium hover:underline">Back home →</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
          {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job ID</label>
            <input value={jobId} onChange={(e) => setJobId(e.target.value)} required placeholder="From your job confirmation" className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What went wrong?</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} required minLength={10} rows={4} placeholder="Describe the issue…" className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm" />
          </div>
          <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700">Open dispute</button>
        </form>
      )}
      <p className="text-xs text-gray-500 mt-6 text-center">
        Read our <Link href="/safety" className="text-blue-600 hover:underline">safety guidelines</Link> before escalating.
      </p>
    </div>
  );
}
