"use client";

import { useDeferredValue, useEffect, useState } from "react";

import { CaseCard } from "@/components/case-card";
import { ModalShell } from "@/components/modal-shell";
import { TipPanel } from "@/components/tip-panel";
import { useFirebaseSession } from "@/components/providers/firebase-session-provider";
import { CRIME_SCENES, STATUS_OPTIONS } from "@/lib/constants";
import { deriveLiveStatus } from "@/lib/case-helpers";
import { fetchTipCounts, markCaseFound, subscribeToCases } from "@/lib/firestore";
import { isFirebaseConfigured } from "@/lib/firebase";
import { sanitizeSearchInput } from "@/lib/validation";
import type { CaseRecord, CaseStatus, CrimeScene } from "@/types";

type FeedStatusFilter = "All" | CaseStatus;
type FeedSceneFilter = "All" | CrimeScene;

export function CasesFeedScreen() {
  const session = useFirebaseSession();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [tipCounts, setTipCounts] = useState<Record<string, number>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);
  const [areaFilter, setAreaFilter] = useState("");
  const [sceneFilter, setSceneFilter] = useState<FeedSceneFilter>("All");
  const [statusFilter, setStatusFilter] = useState<FeedStatusFilter>("All");
  const [tipCase, setTipCase] = useState<CaseRecord | null>(null);
  const [foundCase, setFoundCase] = useState<CaseRecord | null>(null);
  const [isMarkingFound, setIsMarkingFound] = useState(false);
  const deferredAreaFilter = useDeferredValue(areaFilter);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }

    const unsubscribe = subscribeToCases(
      async (records) => {
        setCases(records);
        setIsLoading(false);

        if (!records.length) {
          setTipCounts({});
          return;
        }

        try {
          const counts = await fetchTipCounts(records.map((record) => record.caseId));
          setTipCounts(counts);
        } catch {
          setErrorMessage("Cases loaded, but tip counts may be slightly stale.");
        }
      },
      (message) => {
        setErrorMessage(message);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  async function handleConfirmFound() {
    if (!foundCase) {
      return;
    }

    if (session.status !== "ready") {
      setErrorMessage("Anonymous sign-in is still loading.");
      return;
    }

    setIsMarkingFound(true);
    setErrorMessage("");

    try {
      await markCaseFound(foundCase.caseId);
      setFoundCase(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not mark this case as found.");
    } finally {
      setIsMarkingFound(false);
    }
  }

  const filteredCases = cases.filter((caseRecord) => {
    const liveStatus = deriveLiveStatus(caseRecord.status, tipCounts[caseRecord.caseId] ?? 0);
    const areaMatches =
      !deferredAreaFilter ||
      caseRecord.area.toLowerCase().includes(deferredAreaFilter.toLowerCase());
    const sceneMatches = sceneFilter === "All" || caseRecord.crimeScene === sceneFilter;
    const statusMatches = statusFilter === "All" || liveStatus === statusFilter;

    return areaMatches && sceneMatches && statusMatches;
  });

  return (
    <>
      <section className="grid gap-6">
        <div className="bureau-card p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f5d55b]">
            Public Bureau Feed
          </p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="font-display text-5xl uppercase leading-none text-[#f8f0dc] sm:text-6xl">
                Live Cases
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#d7d0c5] sm:text-base">
                Browse missing chappal reports, send safe preset tips, and witness the country&apos;s least important emergency dashboard.
              </p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-black/15 px-4 py-3 text-sm text-[#b7b0a5]">
              {filteredCases.length} visible case{filteredCases.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="warning-divider my-5" />

          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f5d55b]">
                Area
              </span>
              <input
                value={areaFilter}
                onChange={(event) => setAreaFilter(sanitizeSearchInput(event.target.value))}
                maxLength={40}
                placeholder="Search area"
                className="bureau-input"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f5d55b]">
                Crime Scene
              </span>
              <select
                value={sceneFilter}
                onChange={(event) => setSceneFilter(event.target.value as FeedSceneFilter)}
                className="bureau-select"
              >
                <option value="All">All scenes</option>
                {CRIME_SCENES.map((scene) => (
                  <option key={scene} value={scene}>
                    {scene}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f5d55b]">
                Status
              </span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as FeedStatusFilter)}
                className="bureau-select"
              >
                <option value="All">All statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-[20px] border border-[#c84333]/45 bg-[#351815] px-4 py-3 text-sm text-[#ffcab7]">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="bureau-card animate-pulse p-5">
                <div className="h-8 w-40 rounded-full bg-white/10" />
                <div className="mt-4 h-32 rounded-[18px] bg-white/5" />
                <div className="mt-4 h-10 rounded-[18px] bg-white/5" />
              </div>
            ))}
          </div>
        ) : filteredCases.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredCases.map((caseRecord) => (
              <CaseCard
                key={caseRecord.caseId}
                caseRecord={caseRecord}
                tipCount={tipCounts[caseRecord.caseId] ?? 0}
                liveStatus={deriveLiveStatus(caseRecord.status, tipCounts[caseRecord.caseId] ?? 0)}
                onSendTip={() => setTipCase(caseRecord)}
                onMarkFound={() => setFoundCase(caseRecord)}
              />
            ))}
          </div>
        ) : (
          <div className="bureau-card p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d55b]">
              Nothing Matches
            </p>
            <h2 className="mt-3 font-display text-3xl uppercase text-[#f8f0dc]">
              No chappal crimes fit these filters
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#d7d0c5]">
              Widen the area or status filters. Either the district is calm or this bureau is still too new to be fully chaotic.
            </p>
          </div>
        )}
      </section>

      <TipPanel
        open={Boolean(tipCase)}
        caseRecord={tipCase}
        onClose={() => setTipCase(null)}
        onTipSent={() => {
          if (!tipCase) {
            return;
          }

          setTipCounts((current) => ({
            ...current,
            [tipCase.caseId]: (current[tipCase.caseId] ?? 0) + 1,
          }));
        }}
      />

      <ModalShell
        open={Boolean(foundCase)}
        title="Mark Case As Found"
        description="This flips the public status to Found. Use it only when the footwear has actually returned from exile."
        onClose={() => setFoundCase(null)}
      >
        <p className="rounded-[18px] border border-white/10 bg-black/15 px-4 py-3 text-sm leading-6 text-[#d7d0c5]">
          Case <span className="font-semibold text-[#f8f0dc]">{foundCase?.caseId}</span> for{" "}
          <span className="font-semibold text-[#f8f0dc]">{foundCase?.nickname}</span> will be marked as found.
        </p>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => setFoundCase(null)}
            className="secondary-button flex-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmFound}
            disabled={isMarkingFound}
            className="primary-button flex-1 justify-center"
          >
            {isMarkingFound ? "Updating..." : "Confirm Found"}
          </button>
        </div>
      </ModalShell>
    </>
  );
}
