"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Props {
  providerId: string;
  providerName: string;
  category: string;
  defaultPrice?: number;
  preferredTime?: string;
  onClose: () => void;
}

export default function RequestJobModal({
  providerId,
  providerName,
  category,
  defaultPrice = 2500,
  preferredTime: initialPreferredTime,
  onClose,
}: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(defaultPrice);
  const [preferredTime, setPreferredTime] = useState(initialPreferredTime || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "payment">("form");
  const [jobId, setJobId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const platformFee = Math.round(price * 0.1);
  const providerGets = price - platformFee;

  async function handleCreateJob(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const jobRes = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId,
          category,
          title: title || `Help with ${category}`,
          description,
          price,
          preferredTime: preferredTime || undefined,
          address: "Nairobi (demo)",
          lat: -1.286389,
          lng: 36.817223,
        }),
      });

      const jobData = await jobRes.json();
      if (!jobRes.ok) {
        setError(jobData.error || "Failed to create job");
        setLoading(false);
        return;
      }

      setJobId(jobData.job.id);

      const payRes = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: jobData.job.id,
          amount: price,
          provider: "flutterwave",
        }),
      });

      const payData = await payRes.json();
      if (!payRes.ok) {
        setError(payData.error || "Payment setup failed");
        setLoading(false);
        return;
      }

      setCheckoutUrl(payData.checkoutUrl);
      setStep("payment");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {step === "form" ? `Request ${providerName}` : "Complete payment"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        {step === "form" ? (
          <form onSubmit={handleCreateJob} className="p-6 space-y-4">
            {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">What do you need?</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder={`e.g. Fix my ${category.split(" ")[0].toLowerCase()}`}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Describe the problem *</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} required minLength={10} rows={3}
                placeholder="Give as much detail as possible…"
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your offer (KES) *</label>
              <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} min={500} required
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm" />
              <p className="text-xs text-gray-500 mt-1">
                Platform fee 10% (KES {platformFee.toLocaleString()}) → Technician receives KES {providerGets.toLocaleString()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred time (optional)</label>
              <input type="text" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)}
                placeholder="e.g. Today after 3pm"
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm" />
            </div>
            <button type="submit" disabled={loading || description.length < 10}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Creating job…" : "Continue to payment"}
            </button>
          </form>
        ) : (
          <div className="p-6 space-y-4">
            <div className="bg-green-50 text-green-800 rounded-xl p-4 text-sm">
              Job created. Pay into escrow to notify the technician.
            </div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span>Job amount</span><span>KES {price.toLocaleString()}</span></div>
              <div className="flex justify-between text-gray-500"><span>Platform fee (10%)</span><span>KES {platformFee.toLocaleString()}</span></div>
              <div className="flex justify-between font-medium border-t pt-2 mt-2">
                <span>Technician receives</span><span>KES {providerGets.toLocaleString()}</span>
              </div>
            </div>
            {checkoutUrl ? (
              <a href={checkoutUrl} className="block w-full text-center py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700">
                Pay with Flutterwave (demo)
              </a>
            ) : null}
            <button
              onClick={() => { onClose(); if (jobId) router.push(`/jobs/${jobId}/payment-success`); }}
              className="w-full py-2.5 rounded-xl border border-gray-300 text-sm font-medium hover:bg-gray-50">
              Skip payment (demo) → Success
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
