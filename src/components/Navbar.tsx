"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
            S
          </div>
          <span className="font-bold text-xl text-gray-900 hidden sm:block">
            SkillLink
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/search" className="hover:text-blue-600 transition">
            Find Help
          </Link>
          <Link href="/provider" className="hover:text-blue-600 transition">
            For Technicians
          </Link>
          {role === "admin" && (
            <Link href="/admin/verification" className="hover:text-blue-600 transition">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="text-sm text-gray-600 hidden sm:inline">
                {session.user?.name || session.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
