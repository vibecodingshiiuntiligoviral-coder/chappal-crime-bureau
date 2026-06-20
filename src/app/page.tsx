import Link from "next/link";

import { DepartmentCirculars } from "@/components/department-circulars";
import { LiveCasesPreview } from "@/components/live-cases-preview";

export default function Home() {
  const supportLink = process.env.NEXT_PUBLIC_SUPPORT_LINK?.trim();

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="bureau-card overflow-hidden p-5 sm:p-6">
        <div className="bureau-stamp">
          Department of Unclaimed Sole Affairs // Public Filing Portal
        </div>

        <h1 className="mt-5 max-w-3xl font-display text-[4.4rem] uppercase leading-[0.9] text-[#f8f0dc] sm:text-[5.8rem]">
          Chappal Crime Bureau
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[#d7d0c5]">
          India&apos;s second most useless emergency service.
        </p>

        <div className="warning-divider my-6" />

        <p className="max-w-2xl text-sm leading-7 text-[#d7d0c5] sm:text-base">
          File a public footwear complaint, inspect the live case register, send citizen tips, file roleplay hostage claims, and download paperwork dramatic enough to disturb a family WhatsApp group.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/file-fir" className="primary-button justify-center">
            File Footwear F.I.R
          </Link>
          <Link href="/cases" className="secondary-button justify-center">
            View Live Cases
          </Link>
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="bureau-field">
            <dt>No police powers</dt>
            <dd>Pure meme lost-and-found. No real enforcement. No GPS drama.</dd>
          </div>
          <div className="bureau-field">
            <dt>Public safe only</dt>
            <dd>No phone numbers, no exact addresses, no real-person accusations.</dd>
          </div>
          <div className="bureau-field">
            <dt>Public filing window</dt>
            <dd>Open 24/7. Accountability not guaranteed.</dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-4">
        <div className="bureau-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d55b]">
            Live District Feed
          </p>
          <h2 className="mt-3 font-display text-3xl uppercase text-[#f8f0dc]">
            Current public cases
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#d7d0c5]">
            These are the newest open tragedies reported to the bureau.
          </p>
          <div className="mt-4">
            <LiveCasesPreview />
          </div>
        </div>

        <div className="bureau-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d55b]">
            Department Circulars
          </p>
          <h2 className="mt-3 font-display text-3xl uppercase text-[#f8f0dc]">
            Bureau notices
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#d7d0c5]">
            Circulars rotate automatically. Calm reading is optional.
          </p>
          <div className="mt-4">
            <DepartmentCirculars />
          </div>
        </div>

        <div className="bureau-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d55b]">
            Safety Note
          </p>
          <h2 className="mt-3 font-display text-3xl uppercase text-[#f8f0dc]">
            Public chappal trauma only
          </h2>
          <p className="mt-3 text-sm leading-7 text-[#d7d0c5]">
            No phone numbers. No exact addresses. No real tracking. Your chappal trauma is public only if you file an FIR.
          </p>
        </div>

        <div className="bureau-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d55b]">
            Support Desk
          </p>
          <h2 className="mt-3 font-display text-3xl uppercase text-[#f8f0dc]">
            Fund Bureau Chai Budget
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#d7d0c5]">
            For servers, fake paperwork, and emotional damage.
          </p>
          <p className="mt-3 text-xs leading-6 text-[#b7b0a5]">
            Support is optional. Case rewards are not processed by this app.
          </p>
          {supportLink ? (
            <a
              href={supportLink}
              target="_blank"
              rel="noopener noreferrer"
              className="secondary-button mt-4 inline-flex justify-center"
            >
              Fund Bureau Chai Budget
            </a>
          ) : (
            <div className="mt-4 inline-flex rounded-[12px] border border-white/10 bg-black/15 px-4 py-3 text-sm text-[#9e978b]">
              Support desk not open yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
