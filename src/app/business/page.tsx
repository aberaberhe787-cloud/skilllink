"use client";

import { useState } from "react";
import Link from "next/link";

export default function BusinessPage() {
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">SkillLink for businesses</h1>
      <p className="text-gray-600 mb-8">
        Offices, shops, schools, and estates—book verified technicians, recurring maintenance, and priority support. Plans start free.
      </p>
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {[
          { plan: "Free", price: "KES 0", items: ["Post jobs", "Escrow payments", "Basic support"] },
          { plan: "Pro", price: "KES 2,500/mo", items: ["Priority matching", "Recurring jobs", "Invoices", "Multi-user"] },
          { plan: "Enterprise", price: "Custom", items: ["Dedicated manager", "SLA", "Bulk installs", "API access"] },
        ].map((p) => (
          <div key={p.plan} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-gray-900">{p.plan}</h2>
            <p className="text-blue-600 font-semibold mt-1">{p.price}</p>
            <ul className="mt-3 space-y-1.5 text-sm text-gray-600">{p.items.map((i) => (<li key={i}>✓ {i}</li>))}</ul>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Register your business</h2>
        {submitted ? (
          <div className="text-green-700 bg-green-50 rounded-xl p-4 text-sm">
            Thanks! We&apos;ll follow up. Meanwhile <Link href="/signup" className="underline font-medium">create an account</Link> and post jobs.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company name</label>
              <input value={company} onChange={(e) => setCompany(e.target.value)} required className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm" placeholder="e.g. Acme Retail Ltd" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm" placeholder="e.g. Westlands, Nairobi" />
            </div>
            <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700">Request business access</button>
          </form>
        )}
      </div>
    </div>
  );
}
