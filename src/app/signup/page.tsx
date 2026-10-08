"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  signInWithFirebaseGoogle,
  signUpWithFirebaseEmail,
} from "@/lib/firebase-auth";
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  Briefcase,
  Wrench,
} from "lucide-react";

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

  // One-click Firebase Google Sign-Up
  async function handleGoogleSignup() {
    setLoading(true);
    setError("");
    try {
      const fbUser = await signInWithFirebaseGoogle();
      if (!fbUser?.email) {
        setError("Could not retrieve email from Google.");
        setLoading(false);
        return;
      }

      // Sync user with database
      const syncRes = await fetch("/api/auth/firebase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fbUser.email,
          name: fbUser.displayName || name,
          photoUrl: fbUser.photoURL,
          firebaseUid: fbUser.uid,
          role,
        }),
      });

      if (!syncRes.ok) {
        const errData = await syncRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to register account on server.");
      }

      // Sign into session
      await signIn("credentials", {
        email: fbUser.email,
        isFirebase: "true",
        redirect: false,
      });

      setSuccess(true);
      router.push(role === "provider" ? "/provider" : "/search");
      router.refresh();
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      if (fbErr.code === "auth/popup-closed-by-user") {
        setLoading(false);
        return;
      }
      if (fbErr.code === "auth/unauthorized-domain") {
        setError("Firebase domain is not authorized. Add this domain in Firebase Console > Authentication > Settings.");
      } else {
        setError(fbErr.message || "Google signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Email / Password Sign-Up with Firebase Auth
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
      // 1. Create user in Firebase Authentication
      try {
        await signUpWithFirebaseEmail(email, password, name);
      } catch (fbErr: unknown) {
        const fbError = fbErr as { code?: string; message?: string };
        if (fbError.code === "auth/email-already-in-use") {
          setError("This email is already in use. Please sign in instead.");
          setLoading(false);
          return;
        }
        if (fbError.code === "auth/weak-password") {
          setError("Password is too weak. Please use a stronger password.");
          setLoading(false);
          return;
        }
        // If Firebase signup failed due to domain/network, log and proceed with app registration
        console.warn("Firebase email auth warning:", fbError.message);
      }

      // 2. Register user in database
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

      // 3. Establish app session
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
            <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-[11px] font-medium text-amber-800">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Firebase Authentication</span>
            </div>
          </div>

          {error && (
            <div role="alert" className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {success && !error && (
            <div className="mb-5 p-3.5 rounded-xl bg-green-50 border border-green-100 text-green-800 text-sm">
              Account created — signing you in…
            </div>
          )}

          {/* Quick Sign-Up with Firebase Google */}
          <div className="space-y-2.5 mb-5">
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading || success}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition font-medium text-sm text-gray-800 shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Sign up with Google (Firebase)</span>
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wide">
              <span className="px-3 bg-white text-gray-400">or with email</span>
            </div>
          </div>

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
                  <Wrench className="w-5 h-5 text-blue-600 mb-1" />
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
                  <Briefcase className="w-5 h-5 text-blue-600 mb-1" />
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
              <div className="relative">
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. James Otieno"
                  required
                  minLength={2}
                  className="w-full rounded-xl border border-gray-300 pl-10 pr-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-gray-300 pl-10 pr-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone <span className="text-gray-400 font-normal">(optional, for M-Pesa)</span>
              </label>
              <div className="relative">
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 7XX XXX XXX"
                  className="w-full rounded-xl border border-gray-300 pl-10 pr-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
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
                  className="w-full rounded-xl border border-gray-300 pl-10 pr-11 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-blue-600/20"
            >
              {loading ? "Creating account…" : success ? "Success!" : "Create free account"}
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
