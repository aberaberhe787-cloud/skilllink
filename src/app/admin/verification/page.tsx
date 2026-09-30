"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PendingProvider {
  id: string;
  verificationStatus: string;
  bio: string | null;
  experienceYears: number;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    createdAt: string;
  };
  skills: { category: string }[];
}

export default function AdminVerificationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [providers, setProviders] = useState<PendingProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || (session.user as any)?.role !== "admin") {
      router.push("/login");
      return;
    }
    fetchProviders();
  }, [session, status]);

  async function fetchProviders() {
    setLoading(true);
    const res = await fetch("/api/admin/verification");
    if (res.ok) setProviders(await res.json());
    setLoading(false);
  }

  async function handleAction(id: string, action: "approve" | "reject" | "needs_info") {
    setActionLoading(id);
    const res = await fetch("/api/admin/verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerProfileId: id, action }),
    });
    if (res.ok) await fetchProviders();
    else alert("Action failed");
    setActionLoading(null);
  }

  if (status === "loading" || loading) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-500">Loading…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Verification Queue</h1>
          <p className="text-sm text-gray-600 mt-1">Review and approve skilled person documents</p>
        </div>
        <Link href="/" className="text-sm text-blue-600 hover:underline">← Back to site</Link>
      </div>

      {providers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500">
          No pending verifications 🎉
        </div>
      ) : (
        <div className="space-y-4">
          {providers.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold text-lg">{p.user.name || "Unnamed"}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.verificationStatus === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-orange-100 text-orange-800"
                    }`}>{p.verificationStatus}</span>
                  </div>
                  <p className="text-sm text-gray-600">{p.user.email} {p.user.phone && `• ${p.user.phone}`}</p>
                  <p className="text-sm text-gray-500 mt-1">Experience: {p.experienceYears} years</p>
                  {p.bio && <p className="text-sm text-gray-700 mt-2">{p.bio}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {p.skills.map((s) => (
                      <span key={s.category} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">{s.category}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => handleAction(p.id, "approve")} disabled={actionLoading === p.id}
                    className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50">Approve</button>
                  <button onClick={() => handleAction(p.id, "needs_info")} disabled={actionLoading === p.id}
                    className="px-4 py-2 rounded-xl border border-orange-300 text-orange-700 text-sm font-medium hover:bg-orange-50 disabled:opacity-50">Needs info</button>
                  <button onClick={() => handleAction(p.id, "reject")} disabled={actionLoading === p.id}
                    className="px-4 py-2 rounded-xl border border-red-300 text-red-700 text-sm font-medium hover:bg-red-50 disabled:opacity-50">Reject</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
