import Link from "next/link";
import { SKILL_CATEGORIES } from "@/data/mock";

const categoryIcons: Record<string, string> = {
  "Printer Repair & Maintenance": "🖨️",
  "CCTV / Security Camera Installation & Troubleshooting": "📹",
  "TV & Display Repair": "📺",
  "Laptop & Desktop Hardware Repair": "💻",
  "Networking & Wi-Fi Setup / Troubleshooting": "📶",
  "Smart Home Devices & IoT Setup": "🏠",
  "Mobile Phone Hardware Repair": "📱",
  "Projector & Audio-Visual Equipment": "📽️",
  "POS / Cash Register Systems": "🧾",
  "Basic Electrical & Appliance Repair": "⚡",
};

export default function Home() {
  return (
    <div>
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-sm mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live in Nairobi · Expanding across East Africa
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
              Technical help near you —{" "}
              <span className="text-blue-200">verified & on-demand</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-blue-100 leading-relaxed">
              Broken printer? CCTV offline? TV or laptop issues? Find skilled technicians
              around you, book in minutes, and pay safely into escrow. Money is only
              released when the job is done.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/search" className="inline-flex justify-center items-center px-8 py-4 rounded-xl bg-white text-blue-700 font-semibold text-lg hover:bg-blue-50 transition shadow-lg shadow-blue-950/30">
                Find a technician
              </Link>
              <Link href="/signup" className="inline-flex justify-center items-center px-8 py-4 rounded-xl border-2 border-white/40 text-white font-semibold text-lg hover:bg-white/10 transition">
                Join as skilled person
              </Link>
            </div>
            <p className="mt-5 text-sm text-blue-200/90">
              Free forever for technicians · 10% fee only on completed jobs · M-Pesa ready
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { label: "Verified pros", value: "ID + skills checked" },
            { label: "Escrow payments", value: "Pay only when done" },
            { label: "AI matching", value: "Best nearby match" },
            { label: "Local currency", value: "Prices in KES" },
          ].map((t) => (
            <div key={t.label}>
              <div className="text-sm font-semibold text-gray-900">{t.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{t.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-14 md:py-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">What do you need fixed?</h2>
          <p className="text-gray-600 mt-2 max-w-xl mx-auto">
            Choose a category. We match you with verified technicians near your location.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {SKILL_CATEGORIES.map((cat) => (
            <Link key={cat} href={`/search?category=${encodeURIComponent(cat)}`}
              className="group bg-white border border-gray-200 rounded-2xl p-4 md:p-5 text-center hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{categoryIcons[cat] || "🔧"}</div>
              <div className="text-xs md:text-sm font-medium text-gray-800 group-hover:text-blue-600 leading-snug">{cat}</div>
            </Link>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-white border-y border-gray-200 py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-3">How SkillLink works</h2>
          <p className="text-center text-gray-600 mb-12 max-w-lg mx-auto">Simple for customers. Fair for technicians. Built for East Africa.</p>
          <div className="grid md:grid-cols-3 gap-8 md:gap-10">
            {[
              { step: "1", title: "Search nearby", desc: "Pick a skill and location. Our AI ranks verified technicians by distance, rating, and availability." },
              { step: "2", title: "Book & pay into escrow", desc: "Request the job. Pay in KES via Flutterwave, M-Pesa, or cash. Funds are held until the work is complete." },
              { step: "3", title: "Confirm & review", desc: "Approve the job. The technician gets 90%. You leave a review so the community stays strong." },
            ].map((item) => (
              <div key={item.step} className="text-center md:text-left">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold mx-auto md:mx-0 mb-4">{item.step}</div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-14 md:py-20">
        <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
          <div className="relative max-w-xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Are you a skilled technician?</h2>
            <p className="text-blue-100 mb-6 leading-relaxed">
              Register free. Get verified. Receive nearby job requests. Get paid as you go —
              no salary, no monthly fees. Only a 10% platform fee when you complete a job.
            </p>
            <ul className="space-y-2 text-sm text-blue-100 mb-8">
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Free registration forever</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Training modules & skill badges</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Escrow payouts you can trust</li>
            </ul>
            <Link href="/signup" className="inline-flex px-6 py-3 rounded-xl bg-white text-blue-800 font-semibold hover:bg-blue-50 transition">
              Start earning with SkillLink
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-14 md:pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "10%", label: "Platform fee only" },
            { value: "0", label: "Monthly subscription" },
            { value: "KES", label: "Local pricing" },
            { value: "AI", label: "Smart matching" },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl p-6 border border-gray-200 text-center shadow-sm">
              <div className="text-3xl md:text-4xl font-bold text-blue-600">{item.value}</div>
              <div className="text-sm text-gray-600 mt-2">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Need something fixed today?</h2>
          <p className="text-blue-100 mb-8">Search verified technicians near you in Nairobi and beyond.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/search" className="px-8 py-3.5 rounded-xl bg-white text-blue-700 font-semibold hover:bg-blue-50 transition">Find help now</Link>
            <Link href="/signup" className="px-8 py-3.5 rounded-xl border-2 border-white/40 font-semibold hover:bg-white/10 transition">Become a technician</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
