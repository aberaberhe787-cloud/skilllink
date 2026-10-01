"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

type JobRow = {
  id: string;
  title: string;
  category: string;
  status: string;
  price: number;
  quotedPrice?: number | null;
  address?: string | null;
  seeker?: { name?: string | null } | null;
};

export default function ProviderInboxPage() {
  const { data: session, status } = useSession();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/jobs/inbox")
      .then((r) => r.json())
      .then((d) => setJobs(Array.isArray(d) ? d : d.jobs || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return <div className="max-w-2xl mx-auto px-4 py-12 text-gray-500">Loading inbox…</div>;
  }
  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/login" className="text-blue-600 font-medium">Sign in</Link> as a technician.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Job inbox</h1>
      <p className="text-sm text-gray-500 mb-6">Quote in ETB at or below SkillLink max.</p>
      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
          No assigned jobs yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {jobs.map((j) => (
            <li key={j.id}>
              <Link href={`/jobs/${j.id}`} className="block rounded-2xl border border-gray-200 bg-white p-4 hover:border-emerald-300">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-semibold">{j.title}</p>
                    <p className="text-xs text-gray-500">{j.category}{j.seeker?.name ? ` · ${j.seeker.name}` : ""}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs rounded-full bg-emerald-50 text-emerald-800 px-2 py-0.5">{j.status}</span>
                    <p className="text-sm font-medium mt-1">ETB {(j.quotedPrice ?? j.price).toLocaleString()}</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
