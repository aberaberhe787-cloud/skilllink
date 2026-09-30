"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password. Check your details and try again.");
    } else {
      window.location.href = "/";
    }
  }

  function fillDemo(role: "seeker" | "provider" | "admin") {
    const demos = {
      seeker: { email: "seeker@skilllink.local", password: "seeker123" },
      provider: { email: "james@skilllink.local", password: "provider123" },
      admin: { email: "admin@skilllink.local", password: "admin123" },
    };
    setEmail(demos[role].email);
    setPassword(demos[role].password);
    setError("");
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-10 bg-gradient-to-b from-blue-50/80 to-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
          <div className="text-center mb-7">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-3 shadow-md shadow-blue-600/20">
              S
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1.5">
              Sign in to find help or manage your technician jobs
            </p>
          </div>

          {error && (
            <div role="alert" className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex gap-2">
              <span className="shrink-0">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2.5 mb-5">
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition font-medium text-sm text-gray-800"
            >
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => signIn("linkedin", { callbackUrl: "/" })}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition font-medium text-sm text-gray-800"
            >
              Continue with LinkedIn
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wide">
              <span className="px-3 bg-white text-gray-400">or email</span>
            </div>
          </div>

          <form onSubmit={handleCredentials} className="space-y-4">
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
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
              {loading ? "Signing in…" : "Sign in with email"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-blue-600 font-semibold hover:underline">Sign up free</Link>
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-dashed border-gray-300 bg-white/60 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2.5 text-center">
            Try a demo account
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => fillDemo("seeker")} className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition">
              Customer
            </button>
            <button type="button" onClick={() => fillDemo("provider")} className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 font-medium hover:bg-green-100 transition">
              Technician
            </button>
            <button type="button" onClick={() => fillDemo("admin")} className="text-xs px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 font-medium hover:bg-purple-100 transition">
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
