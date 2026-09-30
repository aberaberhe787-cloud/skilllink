import Link from "next/link";

const TIPS = [
  {
    title: "Always pay inside SkillLink",
    body: "Your money is held in escrow and only released when you confirm the job is done. Never send M-Pesa directly to a stranger before work is complete.",
  },
  {
    title: "Check verification badges",
    body: "Verified technicians have had ID and skills reviewed. Prefer verified profiles for home visits.",
  },
  {
    title: "Share job details with someone you trust",
    body: "Tell a friend or family member who is coming, when, and for what job—especially for first-time visits.",
  },
  {
    title: "Request before/after photos",
    body: "Photos protect both sides if there is a disagreement. Use the job completion flow to attach evidence.",
  },
  {
    title: "Use the dispute centre",
    body: "If something goes wrong, open a dispute from the job page. Our team reviews messages and photos within the SLA.",
  },
  {
    title: "Report suspicious behaviour",
    body: "Pressure to pay outside the app, requests for OTP codes, or threats should be reported immediately to admin.",
  },
];

export default function SafetyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Stay safe on SkillLink</h1>
      <p className="text-gray-600 mb-8">
        Community guidelines for customers and technicians across East Africa.
      </p>
      <div className="space-y-4">
        {TIPS.map((tip, i) => (
          <div key={tip.title} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">{i + 1}</span>
              <div>
                <h2 className="font-semibold text-gray-900">{tip.title}</h2>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{tip.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-10 bg-amber-50 border border-amber-100 rounded-2xl p-5 text-sm text-amber-900">
        <strong>Need help now?</strong> Open a dispute from your job page. For emergencies, contact local authorities first.
      </div>
      <p className="text-center mt-8">
        <Link href="/search" className="text-blue-600 font-medium hover:underline">Find a verified technician →</Link>
      </p>
    </div>
  );
}
