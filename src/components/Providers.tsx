"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { app } from "@/lib/firebase";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Ensure Firebase client services are loaded
    if (app) {
      // Firebase client initialized
    }
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
