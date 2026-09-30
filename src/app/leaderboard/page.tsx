"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Row {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  totalJobsCompleted: number;
  badges: string[];
  isVerified: boolean;
}

const DEMO: Row[] = [
  { id: "1", name: "James Otieno", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James", rating: 4.9, totalJobsCompleted: 128, badges: ["Top Rated"], isVerified: true },
  { id: "2", name: "Amina Hassan", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amina", rating: 4.8, totalJobsCompleted: 96, badges: ["Fast Response"], isVerified: true },
  { id: "3", name: "Peter Kamau", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Peter", rating: 4.7, totalJobsCompleted: 84, badges: ["Printer Specialist"], isVerified: true },
];

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>(DEMO);

  useEffect(() => {
    fetch("/api/providers?available=true")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          const mapped = data
            .map((p: any) => ({
              id: p.id,
              name: p.name,
              avatar: p.avatar,
              rating: p.rating,
              totalJobsCompleted: p.totalJobsCompleted,
              badges: p.badges || [],
              isVerified: p.isVerified,
            }))
            .sort((a: Row, b: Row) => b.totalJobsCompleted - a.totalJobsCompleted || b.rating - a.rating);
          if (mapped.length) setRows(mapped);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Top technicians</h1>
      <p className="text-gray-600 text-sm mb-8">Ranked by completed jobs and ratings · Builds community recognition</p>
      <div className="space-y-3">
        {rows.map((row, i) => (
          <Link key={row.id} href={`/provider/${row.id}`} className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-4 hover:border-blue-300 transition shadow-sm">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
              i === 0 ? "bg-amber-100 text-amber-800" : i === 1 ? "bg-gray-200 text-gray-700" : i === 2 ? "bg-orange-100 text-orange-800" : "bg-blue-50 text-blue-700"
            }`}>{i + 1}</div>
            <img src={row.avatar} alt="" className="w-12 h-12 rounded-xl object-cover bg-gray-100" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-gray-900 truncate">{row.name}</span>
                {row.isVerified && <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full font-medium">Verified</span>}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">★ {row.rating.toFixed(1)} · {row.totalJobsCompleted} jobs</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
