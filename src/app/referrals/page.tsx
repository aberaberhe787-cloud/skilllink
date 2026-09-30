"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ReferralsPage() {
  const { data: session } = useSession();
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ pending: 0, completed: 0, earnedKes: 0 });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/referrals");
        if (res.ok) {
          const data = await res.json();
          setCode(data.code || "");
          setStats(data.stats || stats);
        } else if (session?.user) {
          const email = session.user.email || "user";
          setCode("SL-" + email.slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, "X"));
        }
      } catch {
        if (session?.user?.email) {
          setCode("SL-" + session.user.email.slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, "X"));
        }
      }
    }
    load();
  }, [session]);

  function copyLink() {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/signup?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Invite friends</h1>
      <p className="text-gray-600 text-sm mb-8">
        Share SkillLink. When someone signs up with your code and completes their first job, you both earn <strong>KES 200</strong> wallet credit.
      </p>
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white mb-6">
        <p className="text-sm text-blue-100 mb-2">Your referral code</p>
        <div className="text-3xl font-bold tracking-wider mb-4">{code || "— — —"}</div>
        <button onClick={copyLink} disabled={!code} className="w-full py-3 rounded-xl bg-white text-blue-700 font-semibold hover:bg-blue-50 transition disabled:opacity-50">
          {copied ? "Link copied!" : "Copy invite link"}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Pending", value: stats.pending },
          { label: "Joined", value: stats.completed },
          { label: "Earned", value: `KES ${stats.earnedKes}` },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className="text-lg font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-5 text-sm text-gray-600 space-y-2">
        <h2 className="font-semibold text-gray-900">How it works</h2>
        <p>1. Share your link or code with friends and technicians.</p>
        <p>2. They sign up free on SkillLink.</p>
        <p>3. After their first completed job, both wallets get KES 200.</p>
      </div>
      {!session && (
        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link> to get your personal code.
        </p>
      )}
    </div>
  );
}
