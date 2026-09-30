"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

type Props = {
  jobId: string;
  category: string;
  maxKes: number;
  minKes?: number;
  currentPrice?: number;
  quotedPrice?: number | null;
  isProvider?: boolean;
  isSeeker?: boolean;
  hasProvider?: boolean;
  onDone?: () => void;
};

export default function QuoteBonusPanel({
  jobId,
  category,
  maxKes,
  minKes = 500,
  currentPrice,
  quotedPrice,
  isProvider,
  isSeeker,
  hasProvider,
  onDone,
}: Props) {
  const { data: session } = useSession();
  const [quote, setQuote] = useState(String(quotedPrice || currentPrice || minKes));
  const [note, setNote] = useState("");
  const [bonus, setBonus] = useState("200");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitQuote(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/jobs/${jobId}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotedPrice: Number(quote), quoteNote: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error || "Quote failed");
      else {
        setMsg(
          `Quote saved: KES ${data.job.quotedPrice.toLocaleString()} (max ${maxKes.toLocaleString()}). You receive ~KES ${data.fees.providerPayout.toLocaleString()} after 10%.`
        );
        onDone?.();
      }
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function submitBonus(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/jobs/${jobId}/bonus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountKes: Number(bonus) }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error || "Bonus failed");
      else {
        setMsg(
          `Bonus sent: KES ${data.fees.amountKes}. Technician gets KES ${data.fees.providerAmount} (5% platform fee KES ${data.fees.platformFeeKes}).`
        );
        onDone?.();
      }
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!session) {
    return <p className="text-sm text-gray-500">Sign in to quote or send a bonus.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600">
        <strong>{category}</strong> · SkillLink max{" "}
        <span className="font-semibold text-slate-900">KES {maxKes.toLocaleString()}</span>
        {minKes > 0 && <> · min KES {minKes.toLocaleString()}</>}
      </div>

      {isProvider && (
        <form onSubmit={submitQuote} className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
          <h3 className="font-semibold text-gray-900">Your quote</h3>
          <p className="text-xs text-gray-600">
            Set your price at or below the SkillLink threshold. Platform takes 10% of the job fee.
          </p>
          <div>
            <label className="text-sm font-medium text-gray-700">Price (KES)</label>
            <input type="number" min={minKes} max={maxKes} value={quote} onChange={(e) => setQuote(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Note (optional)</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Includes parts / travel…" className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Saving…" : "Submit quote"}
          </button>
        </form>
      )}

      {isSeeker && hasProvider && (
        <form onSubmit={submitBonus} className="space-y-3 rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
          <h3 className="font-semibold text-gray-900">Customer bonus</h3>
          <p className="text-xs text-gray-600">
            Optional thank-you. SkillLink takes <strong>5%</strong>; the rest goes to your technician.
          </p>
          <div>
            <label className="text-sm font-medium text-gray-700">Bonus (KES)</label>
            <input type="number" min={50} max={100000} value={bonus} onChange={(e) => setBonus(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" required />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50">
            {loading ? "Sending…" : "Send bonus"}
          </button>
        </form>
      )}

      {msg && <p className="rounded-xl bg-white border border-gray-200 px-3 py-2 text-sm text-gray-800">{msg}</p>}
    </div>
  );
}
