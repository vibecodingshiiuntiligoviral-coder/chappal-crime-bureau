"use client";

import { useDeferredValue, useEffect, useState } from "react";

import { CaseClosurePanel } from "@/components/case-closure-panel";
import { CaseCard } from "@/components/case-card";
import { DarkSelect } from "@/components/dark-select";
import { TipPanel } from "@/components/tip-panel";
import { useSupabaseSession } from "@/components/providers/supabase-session-provider";
import { CRIME_SCENES, STATUS_OPTIONS } from "@/lib/constants";
import { deriveLiveStatus, getCaseSearchScore } from "@/lib/case-helpers";
import { fetchCases } from "@/lib/supabase-data";
import { isSupabaseConfigured } from "@/lib/supabase";
import { sanitizeSearchInput } from "@/lib/validation";
import type { CaseRecord, CaseStatus, CrimeScene } from "@/types";

type FeedStatusFilter = "All" | CaseStatus;
type FeedSceneFilter = "All" | CrimeScene;

export function CasesFeedScreen() {
  const session = useSupabaseSession();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [areaFilter, setAreaFilter] = useState("");
  const [sceneFilter, setSceneFilter] = useState<FeedSceneFilter>("All");
  const [statusFilter, setStatusFilter] = useState<FeedStatusFilter>("All");
  const [tipCase, setTipCase] = useState<CaseRecord | null>(null);
  const [foundCase, setFoundCase] = useState<CaseRecord | null>(null);
  const deferredAreaFilter = useDeferredValue(areaFilter);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let active = true;

    async function loadCases() {
      try {
        const records = await fetchCases(30);

        if (!active) {
          return;
        }

        setCases(records);
      } catch (error) {
        if (!active) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Could not load the live bureau feed.",
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadCases();

    return () => {
      active = false;
    };
  }, []);

  const filteredCases = cases
    .map((caseRecord) => {
      const liveStatus = deriveLiveStatus(caseRecord.status, caseRecord.tipCount);
      const searchScore = deferredAreaFilter ? getCaseSearchScore(caseRecord, deferredAreaFilter) : 1;

      return {
        caseRecord,
        liveStatus,
        searchScore,
      };
    })
    .filter(({ caseRecord, liveStatus, searchScore }) => {
      const searchMatches = !deferredAreaFilter || searchScore > 0;
      const sceneMatches = sceneFilter === "All" || caseRecord.crimeScene === sceneFilter;
      const statusMatches = statusFilter === "All" || liveStatus === statusFilter;

      return searchMatches && sceneMatches && statusMatches;
    })
    .sort((left, right) => {
      if (!deferredAreaFilter) {
        return right.caseRecord.createdAt - left.caseRecord.createdAt;
      }

      if (right.searchScore !== left.searchScore) {
        return right.searchScore - left.searchScore;
      }

      return right.caseRecord.createdAt - left.caseRecord.createdAt;
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
                Browse missing chappal reports, search by area or CHPL code, and witness the country&apos;s least important emergency dashboard.
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
                Area / Case Search
              </span>
              <input
                value={areaFilter}
                onChange={(event) => setAreaFilter(sanitizeSearchInput(event.target.value))}
                maxLength={40}
                placeholder="Search area or CHPL case code"
                className="bureau-input"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f5d55b]">
                Crime Scene
              </span>
              <DarkSelect<FeedSceneFilter>
                value={sceneFilter}
                onChange={(nextValue) => setSceneFilter(nextValue)}
                options={[
                  { value: "All", label: "All scenes" },
                  ...CRIME_SCENES.map((scene) => ({
                    value: scene,
                    label: scene,
                  })),
                ]}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f5d55b]">
                Status
              </span>
              <DarkSelect<FeedStatusFilter>
                value={statusFilter}
                onChange={(nextValue) => setStatusFilter(nextValue)}
                options={[
                  { value: "All", label: "All statuses" },
                  ...STATUS_OPTIONS.map((status) => ({
                    value: status,
                    label: status,
                  })),
                ]}
              />
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
            {filteredCases.map(({ caseRecord, liveStatus }) => (
              <CaseCard
                key={caseRecord.caseId}
                caseRecord={caseRecord}
                tipCount={caseRecord.tipCount}
                isOwner={session.uid === caseRecord.ownerId}
                liveStatus={liveStatus}
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

          setCases((current) =>
            current.map((caseRecord) =>
              caseRecord.id === tipCase.id
                ? {
                    ...caseRecord,
                    tipCount: caseRecord.tipCount + 1,
                  }
                : caseRecord,
            ),
          );
        }}
      />

      <CaseClosurePanel
        key={foundCase?.id ?? "feed-closure-panel"}
        open={Boolean(foundCase)}
        caseRecord={foundCase}
        onClose={() => setFoundCase(null)}
        onCaseClosed={(updatedCase) => {
          setCases((current) =>
            current.map((caseRecord) =>
              caseRecord.id === updatedCase.id ? updatedCase : caseRecord,
            ),
          );
          setFoundCase(null);
        }}
      />
    </>
  );
}
