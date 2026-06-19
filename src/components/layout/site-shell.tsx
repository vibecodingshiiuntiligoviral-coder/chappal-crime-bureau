import Link from "next/link";
import type { ReactNode } from "react";

import { FirebaseStatusBanner } from "@/components/firebase-status-banner";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--app-bg)] text-[var(--paper)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,213,91,0.12),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(95,140,105,0.12),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:100%_44px]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-3 pb-8 pt-4 sm:px-5 lg:px-6">
        <header className="bureau-card sticky top-3 z-30 mb-4 px-4 py-4 backdrop-blur-xl sm:px-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f5d55b]">
                Chappal Crime Bureau
              </p>
              <p className="mt-1 text-sm text-[#d7d0c5]">
                India&apos;s most useless emergency service.
              </p>
            </div>

            <nav className="flex flex-wrap gap-2 text-sm font-semibold uppercase tracking-[0.16em]">
              <Link className="nav-pill" href="/">
                Home
              </Link>
              <Link className="nav-pill" href="/file-fir">
                File Footwear FIR
              </Link>
              <Link className="nav-pill" href="/cases">
                View Live Cases
              </Link>
            </nav>
          </div>
        </header>

        <div className="mb-4">
          <FirebaseStatusBanner />
        </div>

        <main className="flex-1">{children}</main>

        <footer className="mt-10 border-t border-white/8 pt-6 text-sm text-[#b7b0a5]">
          <p>No phone numbers. No exact addresses. No real tracking. Your chappal trauma is public only if you file an FIR.</p>
          <p className="mt-2 uppercase tracking-[0.18em] text-[#f5d55b]">
            Vibe coded weird stuff until viral — Day 1.
          </p>
        </footer>
      </div>
    </div>
  );
}
