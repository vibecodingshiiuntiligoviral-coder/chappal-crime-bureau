"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { StatusBadge } from "@/components/status-badge";
import { deriveLiveStatus } from "@/lib/case-helpers";
import { fetchTipCounts, subscribeToCases } from "@/lib/firestore";
import { isFirebaseConfigured } from "@/lib/firebase";
import type { CaseRecord } from "@/types";

export function LiveCasesPreview() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [tipCounts, setTipCounts] = useState<Record<string, number>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }

    const unsubscribe = subscribeToCases(
      async (records) => {
        const previewCases = records.slice(0, 3);
        setCases(previewCases);
        setIsLoading(false);

        if (!previewCases.length) {
          setTipCounts({});
          return;
        }

        try {
          const counts = await fetchTipCounts(previewCases.map((record) => record.caseId));
          setTipCounts(counts);
        } catch {
          setErrorMessage("Live tip counts are resting.");
        }
      },
      (message) => {
        setErrorMessage(message);
        setIsLoading(false);
      },
      3,
    );

    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="bureau-card animate-pulse p-4">
            <div className="h-4 w-24 rounded-full bg-white/10" />
            <div className="mt-4 h-8 w-40 rounded-full bg-white/10" />
            <div className="mt-3 h-20 rounded-[18px] bg-white/5" />
          </div>
        ))}
      </div>
    );
  }

  if (!isFirebaseConfigured) {
    return (
      <div className="bureau-card p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d55b]">
          Live Feed Offline
        </p>
        <p className="mt-3 text-sm leading-6 text-[#d7d0c5]">
          Add Firebase config to activate the public bureau feed, anonymous filing, and tip board.
        </p>
      </div>
    );
  }

  if (!cases.length) {
    return (
      <div className="bureau-card p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d55b]">
          No Active Cases
        </p>
        <p className="mt-3 text-sm leading-6 text-[#d7d0c5]">
          The district is peaceful or nobody has filed yet. Be the first to report public footwear tragedy.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {cases.map((caseRecord) => {
        const liveStatus = deriveLiveStatus(caseRecord.status, tipCounts[caseRecord.caseId] ?? 0);

        return (
          <article
            key={caseRecord.caseId}
            className="bureau-card p-4 transition hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d55b]">
                  {caseRecord.caseId}
                </p>
                <h3 className="mt-2 font-display text-2xl uppercase leading-none text-[#f8f0dc]">
                  {caseRecord.nickname}
                </h3>
                <p className="mt-2 text-sm text-[#d7d0c5]">
                  {caseRecord.area} / {caseRecord.crimeScene}
                </p>
              </div>
              <StatusBadge status={liveStatus} />
            </div>

            <p className="mt-4 text-sm leading-6 text-[#b7b0a5]">{caseRecord.lastSeenClue}</p>

            <div className="mt-4 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b7b0a5]">
              <span>Tips {tipCounts[caseRecord.caseId] ?? 0}</span>
              <Link
                className="text-[#f5d55b] transition hover:text-[#ffe794]"
                href={`/cases/${caseRecord.caseId}`}
              >
                View Case
              </Link>
            </div>
          </article>
        );
      })}

      {errorMessage ? <p className="text-sm text-[#b7b0a5]">{errorMessage}</p> : null}
    </div>
  );
}
