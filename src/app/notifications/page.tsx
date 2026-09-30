"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<{ configured: boolean; mode: string; hint: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    fetch("/api/notifications/whatsapp")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  async function sendTest(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setResult("");
    try {
      const res = await fetch("/api/notifications/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, event: "job_requested" }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult(
          data.mode === "dev"
            ? "Dev mode: message logged on server (add API keys for live WhatsApp)."
            : "WhatsApp message sent successfully."
        );
      } else {
        setResult(data.error || "Failed to send");
      }
    } catch {
      setResult("Network error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">WhatsApp notifications</h1>
      <p className="text-gray-600 text-sm mb-6">
        Get job updates on WhatsApp — new requests, acceptances, escrow, and disputes.
      </p>

      <div className={`rounded-2xl border p-4 mb-6 text-sm ${
        status?.configured ? "bg-green-50 border-green-100 text-green-900" : "bg-amber-50 border-amber-100 text-amber-900"
      }`}>
        <strong>Status:</strong> {status?.mode || "…"} mode
        <p className="mt-1 opacity-90">{status?.hint}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-3">When we notify</h2>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>✓ New job request → technician</li>
          <li>✓ Job accepted / in progress / completed → customer</li>
          <li>✓ Payment held in escrow → both</li>
          <li>✓ Dispute opened → both</li>
        </ul>
      </div>

      <form onSubmit={sendTest} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-900">Send test message</h2>
        {!session && (
          <p className="text-sm text-gray-500">
            <Link href="/login" className="text-blue-600 font-medium">Sign in</Link> to send a test.
          </p>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp number</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" required className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm" />
          <p className="text-xs text-gray-400 mt-1">Use international format (+254…)</p>
        </div>
        <button type="submit" disabled={sending || !session} className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50">
          {sending ? "Sending…" : "Send test on WhatsApp"}
        </button>
        {result && <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{result}</p>}
      </form>

      <div className="mt-8 text-xs text-gray-500 space-y-2">
        <p className="font-medium text-gray-700">Admin setup (Vercel env)</p>
        <pre className="bg-gray-900 text-gray-100 rounded-xl p-3 overflow-x-auto text-[11px]">{`WHATSAPP_TOKEN=your_meta_permanent_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_API_VERSION=v21.0`}</pre>
      </div>
    </div>
  );
}
