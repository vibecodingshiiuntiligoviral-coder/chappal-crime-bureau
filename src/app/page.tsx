import Link from "next/link";

import { LiveCasesPreview } from "@/components/live-cases-preview";

export default function Home() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="bureau-card overflow-hidden p-5 sm:p-6">
        <div className="rounded-full border border-[#f5d55b]/35 bg-[#2a2415] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f5d55b]">
          Ministry of Public Footwear Drama
        </div>

        <h1 className="mt-5 max-w-3xl font-display text-[4.4rem] uppercase leading-[0.9] text-[#f8f0dc] sm:text-[5.8rem]">
          Chappal Crime Bureau
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[#d7d0c5]">
          India&apos;s most useless emergency service.
        </p>

        <div className="warning-divider my-6" />

        <p className="max-w-2xl text-sm leading-7 text-[#d7d0c5] sm:text-base">
          File anonymous public FIRs for missing chappals, browse the local case feed, send playful preset tips, generate obviously fake hostage notes, and download dramatic posters that should absolutely not be treated like official paperwork.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/file-fir" className="primary-button justify-center">
            File Footwear FIR
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
            <dt>Anonymous desk</dt>
            <dd>Firebase Anonymous Auth keeps filing quick without real profile setup.</dd>
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
            Safety Note
          </p>
          <h2 className="mt-3 font-display text-3xl uppercase text-[#f8f0dc]">
            Public chappal trauma only
          </h2>
          <p className="mt-3 text-sm leading-7 text-[#d7d0c5]">
            No phone numbers. No exact addresses. No real tracking. Your chappal trauma is public only if you file an FIR.
          </p>
        </div>
      </div>
    </section>
  );
}
