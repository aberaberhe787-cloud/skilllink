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
  createdAt: string;
  provider?: { user?: { name?: string | null } } | null;
};

export default function MyJobsPage() {
  const { data: session, status } = useSession();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/jobs/mine")
      .then((r) => r.json())
      .then((d) => setJobs(Array.isArray(d) ? d : d.jobs || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return <div className="max-w-2xl mx-auto px-4 py-12 text-gray-500">Loading your jobs…</div>;
  }
  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <p className="text-gray-600">
          <Link href="/login" className="text-blue-600 font-medium">Sign in</Link> to see your jobs.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My jobs</h1>
          <p className="text-sm text-gray-500">Track requests, quotes, and payments (ETB · Telebirr / M-Pesa)</p>
        </div>
        <Link href="/search" className="text-sm font-medium text-blue-600 hover:underline">
          Find technician →
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
          No jobs yet. Search for a technician and request help.
        </div>
      ) : (
        <ul className="space-y-3">
          {jobs.map((j) => (
            <li key={j.id}>
              <Link
                href={`/jobs/${j.id}`}
                className="block rounded-2xl border border-gray-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm transition"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{j.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {j.category}
                      {j.provider?.user?.name ? ` · ${j.provider.user.name}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                      {j.status.replace("_", " ")}
                    </span>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      ETB {(j.quotedPrice ?? j.price).toLocaleString()}
                    </p>
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
