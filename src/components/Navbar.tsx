"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/search", label: "Find help" },
    { href: "/community", label: "Community" },
    { href: "/leaderboard", label: "Top pros" },
    { href: "/business", label: "Business" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-base md:text-lg">S</div>
          <span className="font-bold text-lg md:text-xl text-gray-900">SkillLink</span>
        </Link>

        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-gray-600">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-blue-600 transition">{l.label}</Link>
          ))}
          {role === "provider" && (
            <Link href="/provider" className="hover:text-blue-600 transition">Dashboard</Link>
          )}
          {role === "admin" && (
            <Link href="/admin/verification" className="hover:text-blue-600 transition">Admin</Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <>
              <Link href="/wallet" className="text-sm text-gray-600 hover:text-blue-600">Wallet</Link>
              <Link href="/referrals" className="text-sm text-gray-600 hover:text-blue-600">Invite</Link>
              <span className="text-sm text-gray-500 max-w-[100px] truncate">{session.user?.name || session.user?.email}</span>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="text-sm font-medium text-gray-700 hover:text-blue-600">Sign out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-blue-600">Log in</Link>
              <Link href="/signup" className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition">Get started</Link>
            </>
          )}
        </div>

        <button type="button" className="md:hidden p-2 -mr-2 text-gray-700" onClick={() => setOpen(!open)} aria-label="Menu">{open ? "✕" : "☰"}</button>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {[...links, { href: "/safety", label: "Safety" }, { href: "/wallet", label: "Wallet" }, { href: "/referrals", label: "Invite friends" }].map((l) => (
            <Link key={l.href} href={l.href} className="block py-2 text-sm font-medium text-gray-700" onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
          {role === "admin" && (
            <Link href="/admin/verification" className="block py-2 text-sm font-medium text-gray-700" onClick={() => setOpen(false)}>Admin</Link>
          )}
          <div className="pt-2 border-t border-gray-100 flex gap-2">
            {session ? (
              <button onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }} className="flex-1 py-2.5 text-sm font-medium border border-gray-300 rounded-xl">Sign out</button>
            ) : (
              <>
                <Link href="/login" className="flex-1 text-center py-2.5 text-sm font-medium border border-gray-300 rounded-xl" onClick={() => setOpen(false)}>Log in</Link>
                <Link href="/signup" className="flex-1 text-center py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl" onClick={() => setOpen(false)}>Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
