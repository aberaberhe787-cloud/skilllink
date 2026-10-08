"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"seeker" | "provider">("seeker");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, phone: phone || undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setError("Account created. Please sign in manually.");
        setLoading(false);
        setTimeout(() => router.push("/login"), 1500);
        return;
      }

      router.push(role === "provider" ? "/provider" : "/search");
      router.refresh();
    } catch {
      setError("Something went wrong. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-10 bg-gradient-to-b from-blue-50/80 to-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
          <div className="text-center mb-7">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-3 shadow-md shadow-blue-600/20">
              S
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
            <p className="text-gray-500 text-sm mt-1.5">
              Free forever · Built for Kenya & East Africa
            </p>
          </div>

          {error && (
            <div role="alert" className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex gap-2">
              <span className="shrink-0">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {success && !error && (
            <div className="mb-5 p-3.5 rounded-xl bg-green-50 border border-green-100 text-green-800 text-sm">
              Account created — signing you in…
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">I want to</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRole("seeker")}
                  className={`text-left p-3.5 rounded-xl border-2 transition ${
                    role === "seeker"
                      ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600/20"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="text-lg mb-0.5">🔧</div>
                  <div className="text-sm font-semibold text-gray-900">Find help</div>
                  <div className="text-xs text-gray-500 mt-0.5">Hire technicians near me</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("provider")}
                  className={`text-left p-3.5 rounded-xl border-2 transition ${
                    role === "provider"
                      ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600/20"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="text-lg mb-0.5">💼</div>
                  <div className="text-sm font-semibold text-gray-900">Offer skills</div>
                  <div className="text-xs text-gray-500 mt-0.5">Get paid per job · No fees</div>
                </button>
              </div>
              {role === "provider" && (
                <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  Technicians are verified before appearing in search. You can complete your profile after signup.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. James Otieno"
                required
                minLength={2}
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone <span className="text-gray-400 font-normal">(optional, for M-Pesa)</span>
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 pr-11 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-800"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-blue-600/20"
            >
              {loading ? "Creating account…" : "Create free account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4 px-4">
          By signing up you agree to fair use of SkillLink. No monthly fees for technicians.
        </p>
      </div>
    </div>
  );
}
