"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DashboardData {
  id: string;
  name: string | null;
  avatar: string;
  isVerified: boolean;
  badges: string[];
  rating: number;
  reviewCount: number;
  completionRate: number;
  responseTimeMinutes: number;
  isAvailable: boolean;
  totalJobsCompleted: number;
  earningsThisMonth: number;
  jobs: {
    id: string;
    title: string;
    description: string;
    status: string;
    providerPayout: number;
    address: string | null;
    seekerName: string | null;
  }[];
  courses: {
    id: string;
    title: string;
    level: string;
    isFree: boolean;
    lessonsCount: number;
    durationMinutes: number;
  }[];
}

export default function ProviderDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    async function load() {
      try {
        const res = await fetch("/api/provider/me");
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || "Failed to load dashboard");
          return;
        }
        setData(await res.json());
      } catch {
        setError("Could not load dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session, status]);

  if (status === "loading" || loading) {
    return <div className="max-w-6xl mx-auto px-4 py-16 text-center text-gray-500">Loading dashboard…</div>;
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 mb-4">{error}</p>
        <p className="text-sm text-gray-500 mb-6">
          Use demo: james@skilllink.local / provider123
        </p>
        <Link href="/signup" className="text-blue-600 hover:underline">Create technician account →</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <img src={data.avatar} alt={data.name || ""} className="w-16 h-16 rounded-full object-cover border-2 border-blue-200" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
              <span className="text-amber-600 font-medium">★ {data.rating.toFixed(1)}</span>
              <span>({data.reviewCount} reviews)</span>
              {data.isVerified && <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium">Verified</span>}
              {data.badges.map((b) => (
                <span key={b} className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">{b}</span>
              ))}
            </div>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-xl text-sm font-medium text-white ${data.isAvailable ? "bg-green-600" : "bg-gray-400"}`}>
          {data.isAvailable ? "Available" : "Unavailable"}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm text-gray-500">Earnings (after 10%)</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">KES {data.earningsThisMonth.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm text-gray-500">Jobs completed</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{data.totalJobsCompleted}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm text-gray-500">Completion rate</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{data.completionRate}%</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm text-gray-500">Avg response</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{data.responseTimeMinutes} min</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Inbox</h2>
          {data.jobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-500 shadow-sm">
              <div className="text-3xl mb-2">📭</div>
              <p>No jobs yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        job.status === "open" || job.status === "requested"
                          ? "bg-blue-100 text-blue-800"
                          : job.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-700"
                      }`}>{job.status}</span>
                      <h3 className="font-semibold text-gray-900 mt-1">{job.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{job.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-gray-900">KES {job.providerPayout.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">after 10% fee</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Training & Badges</h2>
          <div className="space-y-3">
            {data.courses.map((course) => (
              <div key={course.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <div className="text-xs text-blue-600 font-medium">{course.level} • {course.isFree ? "Free" : "Paid"}</div>
                <h3 className="font-medium text-sm mt-1 text-gray-900">{course.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{course.lessonsCount} lessons • {course.durationMinutes} min</p>
                <button className="mt-3 w-full py-2 rounded-xl bg-gray-100 text-sm font-medium hover:bg-gray-200 transition">Start Course</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
