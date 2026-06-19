"use client";

import { useEffect, useRef, useState } from "react";

import { ChappalAvatar } from "@/components/chappal-avatar";
import { ModalShell } from "@/components/modal-shell";
import { ReportPanel } from "@/components/report-panel";
import { TipPanel } from "@/components/tip-panel";
import { useFirebaseSession } from "@/components/providers/firebase-session-provider";
import { StatusBadge, ThreatBadge } from "@/components/status-badge";
import {
  buildRoleplayNote,
  computeThreatLevel,
  deriveLiveStatus,
  formatTimeAgo,
  getDisplayHandle,
  getPrimarySuspects,
  getRecoveryAdvice,
} from "@/lib/case-helpers";
import { downloadPoster, downloadRoleplayNote } from "@/lib/canvas";
import {
  fetchTipCount,
  markCaseFound,
  subscribeToCase,
  subscribeToTips,
} from "@/lib/firestore";
import { isFirebaseConfigured } from "@/lib/firebase";
import type { CaseRecord, TipRecord } from "@/types";

export function CaseDetailScreen({ caseId }: { caseId: string }) {
  const session = useFirebaseSession();
  const noteSectionRef = useRef<HTMLDivElement | null>(null);
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [tips, setTips] = useState<TipRecord[]>([]);
  const [tipCount, setTipCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);
  const [isTipPanelOpen, setIsTipPanelOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isFoundModalOpen, setIsFoundModalOpen] = useState(false);
  const [isMarkingFound, setIsMarkingFound] = useState(false);
  const [generatedNote, setGeneratedNote] = useState("");
  const [isDownloadingPoster, setIsDownloadingPoster] = useState(false);
  const [isDownloadingNote, setIsDownloadingNote] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }

    const unsubscribeCase = subscribeToCase(
      caseId,
      (record) => {
        setCaseRecord(record);
        setIsLoading(false);
      },
      (message) => {
        setErrorMessage(message);
        setIsLoading(false);
      },
    );

    const unsubscribeTips = subscribeToTips(
      caseId,
      (items) => {
        setTips(items);
        setTipCount((current) => Math.max(current, items.length));
      },
      () => {
        setErrorMessage("Case file loaded, but the public tip board is having a moment.");
      },
    );

    fetchTipCount(caseId)
      .then((count) => setTipCount(count))
      .catch(() => {
        setTipCount(0);
      });

    return () => {
      unsubscribeCase();
      unsubscribeTips();
    };
  }, [caseId]);

  async function handleMarkFound() {
    if (!caseRecord) {
      return;
    }

    if (session.status !== "ready") {
      setErrorMessage("Anonymous auth is still loading.");
      return;
    }

    setIsMarkingFound(true);
    setErrorMessage("");

    try {
      await markCaseFound(caseRecord.caseId);
      setIsFoundModalOpen(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not mark this case as found.");
    } finally {
      setIsMarkingFound(false);
    }
  }

  async function handlePosterDownload() {
    if (!caseRecord) {
      return;
    }

    setIsDownloadingPoster(true);
    setErrorMessage("");

    try {
      await downloadPoster(caseRecord, deriveLiveStatus(caseRecord.status, tipCount));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Poster download failed.");
    } finally {
      setIsDownloadingPoster(false);
    }
  }

  async function handleNoteDownload() {
    if (!caseRecord) {
      return;
    }

    setIsDownloadingNote(true);
    setErrorMessage("");

    try {
      await downloadRoleplayNote(caseRecord);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Roleplay note download failed.");
    } finally {
      setIsDownloadingNote(false);
    }
  }

  function handleGenerateNote() {
    if (!caseRecord) {
      return;
    }

    setGeneratedNote(buildRoleplayNote(caseRecord));
    noteSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  if (isLoading) {
    return (
      <section className="bureau-card animate-pulse p-6">
        <div className="h-4 w-28 rounded-full bg-white/10" />
        <div className="mt-4 h-12 w-64 rounded-full bg-white/10" />
        <div className="mt-5 h-56 rounded-[24px] bg-white/5" />
      </section>
    );
  }

  if (!isFirebaseConfigured) {
    return (
      <section className="bureau-card p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d55b]">
          Firebase Required
        </p>
        <h1 className="mt-3 font-display text-4xl uppercase text-[#f8f0dc]">
          The case bureau is offline
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#d7d0c5]">
          Add Firebase config and enable Anonymous Auth to read live public cases here.
        </p>
      </section>
    );
  }

  if (!caseRecord) {
    return (
      <section className="bureau-card p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d55b]">
          Case Missing
        </p>
        <h1 className="mt-3 font-display text-4xl uppercase text-[#f8f0dc]">
          This chappal file does not exist
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#d7d0c5]">
          Either the FIR never happened or the bureau lost the paperwork, which would be on-brand.
        </p>
      </section>
    );
  }

  const liveStatus = deriveLiveStatus(caseRecord.status, tipCount);
  const threatLevel = computeThreatLevel(caseRecord);
  const suspects = getPrimarySuspects(caseRecord.caseId);
  const recoveryAdvice = getRecoveryAdvice(caseRecord.crimeScene);

  return (
    <>
      <section className="grid gap-6">
        <div className="bureau-card p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f5d55b]">
            FOOTWEAR FIR REGISTERED
          </p>
          <div className="mt-4 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={liveStatus} />
                <ThreatBadge level={threatLevel} />
                <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b7b0a5]">
                  {tipCount} tip{tipCount === 1 ? "" : "s"}
                </span>
              </div>

              <h1 className="mt-4 font-display text-5xl uppercase leading-none text-[#f8f0dc] sm:text-6xl">
                {caseRecord.nickname}
              </h1>
              <p className="mt-3 text-lg text-[#d7d0c5]">
                {caseRecord.type} / {caseRecord.color}
              </p>
              <p className="mt-2 text-sm uppercase tracking-[0.18em] text-[#9fa79c]">
                {caseRecord.caseId} / filed {formatTimeAgo(caseRecord.createdAt)}
              </p>

              <div className="warning-divider my-5" />

              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="bureau-field">
                  <dt>Area</dt>
                  <dd>{caseRecord.area}</dd>
                </div>
                <div className="bureau-field">
                  <dt>Crime Scene</dt>
                  <dd>{caseRecord.crimeScene}</dd>
                </div>
                <div className="bureau-field">
                  <dt>Reward</dt>
                  <dd>{caseRecord.reward}</dd>
                </div>
                <div className="bureau-field">
                  <dt>Public Handle</dt>
                  <dd>
                    {caseRecord.instagramHandle
                      ? getDisplayHandle(caseRecord.instagramHandle)
                      : "No public handle"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/15 p-5">
              <div className="flex items-start gap-4">
                <ChappalAvatar
                  color={caseRecord.color}
                  nickname={caseRecord.nickname}
                  type={caseRecord.type}
                />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f5d55b]">
                    Last Seen Report
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#d7d0c5]">
                    {caseRecord.lastSeenClue}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  onClick={() => setIsTipPanelOpen(true)}
                  className="primary-button w-full justify-center"
                >
                  Send Tip
                </button>
                <button
                  type="button"
                  onClick={handleGenerateNote}
                  className="secondary-button w-full justify-center"
                >
                  Pretend I Have This Chappal
                </button>
                <button
                  type="button"
                  onClick={() => setIsFoundModalOpen(true)}
                  disabled={liveStatus === "Found"}
                  className="secondary-button w-full justify-center"
                >
                  {liveStatus === "Found" ? "Already Found" : "Mark As Found"}
                </button>
                <button
                  type="button"
                  onClick={handlePosterDownload}
                  disabled={isDownloadingPoster}
                  className="secondary-button w-full justify-center"
                >
                  {isDownloadingPoster ? "Rendering Poster..." : "Download Missing Poster"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsReportOpen(true)}
                  className="secondary-button w-full justify-center"
                >
                  Report Case
                </button>
              </div>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-[20px] border border-[#c84333]/45 bg-[#351815] px-4 py-3 text-sm text-[#ffcab7]">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="bureau-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d55b]">
              Primary Suspects
            </p>
            <div className="mt-4 grid gap-3">
              {suspects.map((suspect) => (
                <div
                  key={suspect}
                  className="rounded-[18px] border border-white/10 bg-black/15 px-4 py-3 text-sm text-[#f8f0dc]"
                >
                  {suspect}
                </div>
              ))}
            </div>
          </div>

          <div className="bureau-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d55b]">
              Recovery Advice
            </p>
            <h2 className="mt-3 font-display text-3xl uppercase text-[#f8f0dc]">
              Scene-specific guidance
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#d7d0c5]">{recoveryAdvice}</p>
          </div>
        </div>

        <div className="bureau-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d55b]">
            Public Tips
          </p>
          <div className="mt-4 grid gap-3">
            {tips.length ? (
              tips.map((tip) => (
                <article
                  key={tip.id}
                  className="rounded-[18px] border border-white/10 bg-black/15 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f5d55b]">
                      {tip.kind === "preset" ? "Preset Tip" : "Custom Tip"}
                    </span>
                    <span className="text-xs text-[#9fa79c]">
                      {formatTimeAgo(tip.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#f8f0dc]">{tip.message}</p>
                </article>
              ))
            ) : (
              <div className="rounded-[18px] border border-dashed border-white/12 px-4 py-5 text-sm leading-6 text-[#b7b0a5]">
                No public tips yet. The nation is watching silently.
              </div>
            )}
          </div>
        </div>

        <div ref={noteSectionRef} className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="bureau-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d55b]">
              Hostage Note Lab
            </p>
            <h2 className="mt-3 font-display text-3xl uppercase text-[#f8f0dc]">
              Pretend I Have This Chappal
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#d7d0c5]">
              Roleplay note. Do not claim real theft.
            </p>

            <div className="mt-4 rounded-[22px] border border-white/10 bg-black/15 p-4 text-sm leading-7 text-[#f8f0dc]">
              {generatedNote || buildRoleplayNote(caseRecord)}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleGenerateNote}
                className="secondary-button flex-1 justify-center"
              >
                Generate Again
              </button>
              <button
                type="button"
                onClick={handleNoteDownload}
                disabled={isDownloadingNote}
                className="primary-button flex-1 justify-center"
              >
                {isDownloadingNote ? "Rendering Note..." : "Download Note Image"}
              </button>
            </div>
          </div>

          <div className="bureau-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d55b]">
              Missing Poster
            </p>
            <h2 className="mt-3 font-display text-3xl uppercase text-[#f8f0dc]">
              Shareable case card
            </h2>
            <div className="mt-4 rounded-[24px] border border-dashed border-[#f5d55b]/35 bg-black/15 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d55b]">
                {caseRecord.caseId}
              </p>
              <h3 className="mt-3 font-display text-4xl uppercase leading-none text-[#f8f0dc]">
                Missing Chappal Alert
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#d7d0c5]">
                {caseRecord.nickname} / {caseRecord.area} / {caseRecord.lastSeenClue}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge status={liveStatus} />
                <ThreatBadge level={threatLevel} />
              </div>
            </div>

            <button
              type="button"
              onClick={handlePosterDownload}
              disabled={isDownloadingPoster}
              className="primary-button mt-4 w-full justify-center"
            >
              {isDownloadingPoster ? "Rendering Poster..." : "Download Missing Poster"}
            </button>
          </div>
        </div>
      </section>

      <TipPanel
        open={isTipPanelOpen}
        caseRecord={caseRecord}
        onClose={() => setIsTipPanelOpen(false)}
        onTipSent={() => setTipCount((current) => current + 1)}
      />

      <ReportPanel
        open={isReportOpen}
        caseRecord={caseRecord}
        onClose={() => setIsReportOpen(false)}
      />

      <ModalShell
        open={isFoundModalOpen}
        title="Mark As Found"
        description="This changes the public case status to Found. Use it when the chappal has actually returned home."
        onClose={() => setIsFoundModalOpen(false)}
      >
        <p className="rounded-[18px] border border-white/10 bg-black/15 px-4 py-3 text-sm leading-6 text-[#d7d0c5]">
          Confirm recovery for{" "}
          <span className="font-semibold text-[#f8f0dc]">{caseRecord.nickname}</span>.
        </p>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => setIsFoundModalOpen(false)}
            className="secondary-button flex-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleMarkFound}
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
