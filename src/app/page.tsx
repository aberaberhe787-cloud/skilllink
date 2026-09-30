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
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live in Nairobi & expanding
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              Technical help near you,{" "}
              <span className="text-blue-200">verified & on-demand</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-blue-100 leading-relaxed">
              Broken printer? CCTV down? TV not working? Find skilled technicians
              around you, book instantly, pay safely with escrow, and get the job done.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/search"
                className="inline-flex justify-center items-center px-8 py-4 rounded-xl bg-white text-blue-700 font-semibold text-lg hover:bg-blue-50 transition shadow-lg shadow-blue-900/20"
              >
                Find a Technician
              </Link>
              <Link
                href="/signup"
                className="inline-flex justify-center items-center px-8 py-4 rounded-xl border-2 border-white/40 text-white font-semibold text-lg hover:bg-white/10 transition"
              >
                Join as Skilled Person
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-3">
          What do you need fixed?
        </h2>
        <p className="text-center text-gray-600 mb-10">
          Choose a category and get matched with the best nearby technicians
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {SKILL_CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/search?category=${encodeURIComponent(cat)}`}
              className="group bg-white border border-gray-200 rounded-2xl p-5 text-center hover:border-blue-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                {categoryIcons[cat] || "🔧"}
              </div>
              <div className="text-sm font-medium text-gray-800 group-hover:text-blue-600 leading-snug">
                {cat}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-white border-y border-gray-200 py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">
            How SkillLink works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              { step: "1", title: "Search nearby", desc: "Describe the problem. Our AI matches you with the best verified technicians around you." },
              { step: "2", title: "Book & pay safely", desc: "Request the job. Pay into escrow. Money is only released after the work is done." },
              { step: "3", title: "Rate & review", desc: "Leave a review. Help others find the best technicians. Build reputation on both sides." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold mx-auto mb-5">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { value: "10%", label: "Platform fee only" },
            { value: "AI", label: "Smart matching" },
            { value: "✓", label: "Verified professionals" },
            { value: "0", label: "Monthly fees" },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl p-6 border border-gray-200 text-center shadow-sm">
              <div className="text-3xl md:text-4xl font-bold text-blue-600">{item.value}</div>
              <div className="text-sm text-gray-600 mt-2">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-blue-100 mb-8">Join thousands of people fixing technical problems the smart way.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search" className="px-8 py-3.5 rounded-xl bg-white text-blue-700 font-semibold hover:bg-blue-50 transition">
              Find Help Now
            </Link>
            <Link href="/signup" className="px-8 py-3.5 rounded-xl border-2 border-white/50 font-semibold hover:bg-white/10 transition">
              Become a Technician
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
