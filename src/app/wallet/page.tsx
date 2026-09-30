"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Tx {
  id: string;
  type: string;
  amountKes: number;
  description: string | null;
  createdAt: string;
}

export default function WalletPage() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState(0);
  const [pending, setPending] = useState(0);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/wallet");
        if (res.ok) {
          const data = await res.json();
          setBalance(data.balanceKes || 0);
          setPending(data.pendingKes || 0);
          setTxs(data.transactions || []);
        } else {
          setBalance(4500);
          setPending(1200);
          setTxs([
            { id: "1", type: "credit", amountKes: 2700, description: "Job payout (after 10% fee)", createdAt: new Date().toISOString() },
            { id: "2", type: "tip", amountKes: 300, description: "Tip from customer", createdAt: new Date(Date.now() - 86400000).toISOString() },
            { id: "3", type: "referral", amountKes: 200, description: "Referral reward", createdAt: new Date(Date.now() - 172800000).toISOString() },
          ]);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Wallet</h1>
      <p className="text-gray-600 text-sm mb-6">Earnings, tips, and referral credits · Payouts via M-Pesa</p>
      <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl p-6 text-white mb-6">
        <p className="text-sm text-blue-200">Available balance</p>
        <p className="text-3xl font-bold mt-1">{loading ? "…" : `KES ${balance.toLocaleString()}`}</p>
        <p className="text-sm text-blue-200 mt-3">Pending (in escrow): KES {pending.toLocaleString()}</p>
        <button className="mt-5 w-full py-3 rounded-xl bg-white text-blue-800 font-semibold hover:bg-blue-50 transition">Withdraw to M-Pesa</button>
      </div>
      <h2 className="font-semibold text-gray-900 mb-3">Recent activity</h2>
      <div className="space-y-2">
        {txs.map((tx) => (
          <div key={tx.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-900">{tx.description || tx.type}</p>
              <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString("en-KE")}</p>
            </div>
            <span className={`font-semibold text-sm ${tx.amountKes >= 0 ? "text-green-600" : "text-red-600"}`}>
              {tx.amountKes >= 0 ? "+" : ""}{tx.amountKes.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      {!session && (
        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/login" className="text-blue-600 font-medium">Sign in</Link> to see your real balance.
        </p>
      )}
    </div>
  );
}
