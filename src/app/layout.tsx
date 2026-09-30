import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkillLink – On-demand Technical Skills Near You",
  description:
    "Find verified technicians for printer, CCTV, TV, laptop and more repairs. Book, pay safely, and get the job done.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-gray-200 bg-white py-8">
            <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
              © 2026 SkillLink. Connecting skilled technicians with people who need help.
              <br />
              10% platform fee • Escrow payments • AI matching • Verified professionals
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
