"use client";

import { use } from "react";
import Link from "next/link";

export default function PaymentSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl mx-auto mb-4">
          ✓
        </div>
        <h1 className="text-2xl font-bold mb-2">Payment received</h1>
        <p className="text-gray-600 mb-6">
          Your payment is held in escrow. The technician will be paid only after the job is completed and confirmed.
        </p>
        <p className="text-sm text-gray-500 mb-6">Job ID: {id}</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
