import Link from "next/link";
import type { ReactNode } from "react";

import { BureauTicker } from "@/components/layout/bureau-ticker";
import { SessionStatusBanner } from "@/components/session-status-banner";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--app-bg)] text-[var(--paper)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(235,222,192,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(235,222,192,0.018)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(180deg,transparent,rgba(0,0,0,0.08)_42%,transparent_100%)]" />
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-36 bg-[linear-gradient(180deg,rgba(245,213,91,0.06),transparent)]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-3 pb-8 pt-4 sm:px-5 lg:px-6">
        <header className="bureau-card sticky top-3 z-30 mb-4 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#d6b146]">
                Department of Unclaimed Sole Affairs // Public Access Record
              </p>
              <h1 className="mt-2 font-display text-3xl uppercase leading-none text-[#f8f0dc] sm:text-4xl">
                Chappal Crime Bureau
              </h1>
              <p className="mt-2 text-sm text-[#d7d0c5]">
                India&apos;s second most useless emergency service.
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-[#9e978b]">
                Record Desk Beta // Public Portal // Non-Emergency Use Only
              </p>
            </div>

            <nav className="flex flex-wrap gap-2 text-sm font-semibold uppercase tracking-[0.16em]">
              <Link className="nav-pill" href="/">
                Home
              </Link>
              <Link className="nav-pill" href="/file-fir">
                FILE FOOTWEAR F.I.R
              </Link>
              <Link className="nav-pill" href="/cases">
                View Live Cases
              </Link>
            </nav>
          </div>
        </header>

        <div className="mb-4">
          <BureauTicker />
        </div>

        <div className="mb-4">
          <SessionStatusBanner />
        </div>

        <main className="flex-1">{children}</main>

        <footer className="mt-10 border-t border-white/8 pt-6 text-sm text-[#b7b0a5]">
          <p>
            No phone numbers. No exact addresses. No real tracking. Your chappal trauma is public only if you file an FIR.
          </p>
          <p className="mt-2 uppercase tracking-[0.18em] text-[#f5d55b]">
            Vibe coded weird stuff until viral - Day 1.
          </p>
        </footer>
      </div>
    </div>
  );
}
