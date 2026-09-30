import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkillLink – Technical help near you in Kenya & East Africa",
  description:
    "Find verified technicians for printers, CCTV, TVs, laptops and more. Book nearby, pay safely with escrow (M-Pesa ready). Free for technicians.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-gray-200 bg-white">
            <div className="max-w-6xl mx-auto px-4 py-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                <div className="col-span-2 md:col-span-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">S</div>
                    <span className="font-bold text-lg">SkillLink</span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Connecting skilled technicians with people who need help across Kenya and East Africa.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-900 mb-3">For customers</h4>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li><Link href="/search" className="hover:text-blue-600">Find a technician</Link></li>
                    <li><Link href="/signup" className="hover:text-blue-600">Create account</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-900 mb-3">For technicians</h4>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li><Link href="/signup" className="hover:text-blue-600">Join as skilled person</Link></li>
                    <li><Link href="/provider" className="hover:text-blue-600">Dashboard</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-900 mb-3">Payments</h4>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li>Escrow protection</li>
                    <li>10% platform fee only</li>
                    <li>M-Pesa · Flutterwave · Cash</li>
                  </ul>
                </div>
              </div>
              <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between gap-2 text-xs text-gray-400">
                <span>© 2026 SkillLink · Built for East Africa</span>
                <span>Prices in KES · Serving Nairobi & expanding</span>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
