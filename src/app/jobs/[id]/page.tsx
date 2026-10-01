"use client";

import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import QuoteBonusPanel from "@/components/QuoteBonusPanel";

type Job = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  price: number;
  quotedPrice?: number | null;
  quoteNote?: string | null;
  platformFee: number;
  providerPayout: number;
  address?: string | null;
  seekerId: string;
  seeker?: { id: string; name?: string | null };
  provider?: { id: string; userId: string; user?: { id: string; name?: string | null } } | null;
  payment?: { id: string; status: string; amount: number; provider?: string | null } | null;
  photos?: { id: string; url: string; kind: string }[];
  reviews?: { id: string; rating: number; comment?: string | null }[];
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [job, setJob] = useState<Job | null>(null);
  const [caps, setCaps] = useState({ maxKes: 6000, minKes: 200 });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [payMethod, setPayMethod] = useState<"telebirr" | "mpesa">("telebirr");
  const [phone, setPhone] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const load = useCallback(() => {
    if (!id) return;
    fetch(`/api/jobs/${id}`)
      .then((r) => r.json())
      .then((d) => (d.error ? setMsg(d.error) : setJob(d)))
      .catch(() => setMsg("Failed to load job"));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!job?.category) return;
    fetch("/api/categories/caps")
      .then((r) => r.json())
      .then((m) => {
        if (m[job.category]) setCaps(m[job.category]);
      })
      .catch(() => {});
  }, [job?.category]);

  const userId = (session?.user as { id?: string } | undefined)?.id;
  const isSeeker = !!job && userId === job.seekerId;
  const isProvider = !!job && userId === job.provider?.userId;
  const price = job ? job.quotedPrice ?? job.price : 0;

  async function acceptPay() {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/jobs/${id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: payMethod, phone: phone || undefined }),
      });
      const data = await res.json();
      setMsg(
        res.ok
          ? data.payment?.instructions || "Accepted. Complete Telebirr/M-Pesa on your phone."
          : data.error || "Accept failed"
      );
      load();
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function complete(as: "provider" | "seeker") {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/jobs/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ as, markHeldFirst: true }),
      });
      const data = await res.json();
      setMsg(
        res.ok
          ? as === "seeker"
            ? data.paymentReleased
              ? "Confirmed. 90% released to technician wallet (ETB)."
              : data.warning || "Completed."
            : data.message || "Marked complete."
          : data.error || "Failed"
      );
      load();
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: reviewComment || undefined }),
      });
      const data = await res.json();
      setMsg(res.ok ? "Review saved." : data.error || "Review failed");
      load();
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function addPhoto(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${id}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: photoUrl, kind: "after" }),
      });
      const data = await res.json();
      setMsg(res.ok ? "Photo linked." : data.error || "Photo failed");
      setPhotoUrl("");
      load();
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!job) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-gray-500">
        {msg || "Loading job…"}
        <div className="mt-4">
          <Link href="/jobs" className="text-blue-600 text-sm">← My jobs</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div>
        <Link href={isProvider ? "/inbox" : "/jobs"} className="text-sm text-blue-600">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{job.title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {job.category} · <span className="capitalize">{job.status.replace("_", " ")}</span>
        </p>
        <p className="text-gray-700 mt-3 text-sm whitespace-pre-wrap">{job.description}</p>
        {job.address && <p className="text-xs text-gray-500 mt-2">📍 {job.address}</p>}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-500">Price</span>
          <span className="font-semibold">ETB {price.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Platform 10%</span>
          <span>ETB {job.platformFee.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Tech receives</span>
          <span>ETB {job.providerPayout.toLocaleString()}</span>
        </div>
        {job.payment && (
          <div className="flex justify-between pt-1 border-t border-gray-100">
            <span className="text-gray-500">Payment</span>
            <span className="capitalize">{job.payment.status} · {job.payment.provider || "—"}</span>
          </div>
        )}
      </div>

      {(isProvider || isSeeker) && (
        <QuoteBonusPanel
          jobId={job.id}
          category={job.category}
          maxKes={caps.maxKes}
          minKes={caps.minKes}
          currentPrice={job.price}
          quotedPrice={job.quotedPrice}
          isProvider={isProvider}
          isSeeker={isSeeker}
          hasProvider={!!job.provider}
          onDone={load}
        />
      )}

      {isSeeker && ["quoted", "requested", "open"].includes(job.status) && job.quotedPrice && (
        <div className="rounded-2xl border border-green-100 bg-green-50/60 p-4 space-y-3">
          <h3 className="font-semibold text-gray-900">Accept & pay</h3>
          <p className="text-xs text-gray-600">Ethiopia only: <strong>Telebirr</strong> or <strong>M-Pesa</strong>.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPayMethod("telebirr")} className={`flex-1 py-2 rounded-xl text-sm font-medium border ${
              payMethod === "telebirr" ? "bg-green-600 text-white border-green-600" : "bg-white border-gray-300"
            }`}>Telebirr</button>
            <button type="button" onClick={() => setPayMethod("mpesa")} className={`flex-1 py-2 rounded-xl text-sm font-medium border ${
              payMethod === "mpesa" ? "bg-green-600 text-white border-green-600" : "bg-white border-gray-300"
            }`}>M-Pesa</button>
          </div>
          <input type="tel" placeholder="+251 9…" value={phone} onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" />
          <button type="button" disabled={loading} onClick={acceptPay}
            className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold disabled:opacity-50">
            {loading ? "Processing…" : `Accept & pay ETB ${price.toLocaleString()}`}
          </button>
        </div>
      )}

      {isProvider && ["accepted", "in_progress", "quoted"].includes(job.status) && (
        <button type="button" disabled={loading} onClick={() => complete("provider")}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50">
          Mark job complete
        </button>
      )}

      {isSeeker && (job.status === "completed" || job.status === "accepted" || job.payment?.status === "held") && (
        <button type="button" disabled={loading} onClick={() => complete("seeker")}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-50">
          Confirm complete & release 90%
        </button>
      )}

      {(isSeeker || isProvider) && (
        <form onSubmit={addPhoto} className="rounded-2xl border border-gray-200 p-4 space-y-2">
          <h3 className="font-semibold text-sm">Before / after photo</h3>
          <input type="url" required placeholder="https://… image URL" value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm" />
          <button type="submit" disabled={loading} className="text-sm text-blue-600 font-medium">Add photo</button>
          {job.photos && job.photos.length > 0 && (
            <ul className="text-xs text-gray-500 space-y-1">
              {job.photos.map((p) => (
                <li key={p.id}><a href={p.url} className="underline" target="_blank" rel="noreferrer">{p.kind}: {p.url.slice(0, 40)}…</a></li>
              ))}
            </ul>
          )}
        </form>
      )}

      {isSeeker && job.status === "completed" && (
        <form onSubmit={submitReview} className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4 space-y-2">
          <h3 className="font-semibold text-sm">Rate your technician</h3>
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full rounded-xl border px-3 py-2 text-sm">
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} stars</option>
            ))}
          </select>
          <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Optional comment" className="w-full rounded-xl border px-3 py-2 text-sm" rows={2} />
          <button type="submit" disabled={loading} className="w-full py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold">
            Submit review
          </button>
        </form>
      )}

      {msg && <p className="text-sm rounded-xl bg-slate-50 border px-3 py-2 text-gray-800">{msg}</p>}
    </div>
  );
}
