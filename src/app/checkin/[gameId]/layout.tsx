"use client";

import { AuthProvider } from "@/context/auth";

export default function CheckinLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
