"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { TelemetryProvider } from "@/context/telemetry-context";
import { AuthProvider } from "@/context/auth-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <AuthProvider>
      <TelemetryProvider>
        <div className="min-h-screen bg-[#f8f9ff]">
          <Sidebar
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
          />
          {mobileMenuOpen && (
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] lg:hidden"
            />
          )}
          <div className="pl-0 lg:pl-64">
            <Header onMenuToggle={() => setMobileMenuOpen((open) => !open)} />
            <main className="w-full pt-16 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-4rem)] pb-12">
              {children}
            </main>
          </div>
        </div>
      </TelemetryProvider>
    </AuthProvider>
  );
}
