"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { CaseClosurePanel } from "@/components/case-closure-panel";
import { ChappalAvatar } from "@/components/chappal-avatar";
import { HostageClaimPanel } from "@/components/hostage-claim-panel";
import { ModalShell } from "@/components/modal-shell";
import { ReportPanel } from "@/components/report-panel";
import { TipPanel } from "@/components/tip-panel";
import { useSupabaseSession } from "@/components/providers/supabase-session-provider";
import { StatusBadge, ThreatBadge } from "@/components/status-badge";
import {
  CASE_CLOSED_MESSAGE,
  HOSTAGE_SAFETY_COPY,
  TIP_TYPE_LABELS,
} from "@/lib/constants";
import {
  deriveLiveStatus,
  formatTimeAgo,
  getDisplayHandle,
  getPrimarySuspects,
  getRecoveryAdvice,
} from "@/lib/case-helpers";
import { fetchCaseByCode, fetchTipsForCase } from "@/lib/supabase-data";
import { isSupabaseConfigured } from "@/lib/supabase";
import { downloadPoster } from "@/lib/poster-download";
import type { CaseRecord, TipRecord } from "@/types";

export function CaseDetailScreen({ caseId }: { caseId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSupabaseSession();
  const notice = searchParams.get("notice");
  const [noticeMessage] = useState(() =>
    notice === "media-upload-partial"
      ? "FIR registered, but one or more evidence photos failed to upload. The case is still live."
      : notice === "image-upload-failed"
        ? "FIR registered, but the image upload failed. The case is still live with its avatar fallback."
      : "",
  );
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [tips, setTips] = useState<TipRecord[]>([]);
  const [tipCount, setTipCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [isTipPanelOpen, setIsTipPanelOpen] = useState(false);
  const [isHostagePanelOpen, setIsHostagePanelOpen] = useState(false);
  const [isCaseReportOpen, setIsCaseReportOpen] = useState(false);
  const [reportTip, setReportTip] = useState<TipRecord | null>(null);
  const [isFoundModalOpen, setIsFoundModalOpen] = useState(false);
  const [isDownloadingPoster, setIsDownloadingPoster] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);
  const [failedMainImageUrl, setFailedMainImageUrl] = useState("");
  const [failedSceneImageUrl, setFailedSceneImageUrl] = useState("");

  useEffect(() => {
    if (notice !== "image-upload-failed" && notice !== "media-upload-partial") {
      return;
    }

    router.replace(`/cases/${caseId}`, { scroll: false });
  }, [caseId, notice, router]);

  async function loadTips(caseRowId: string, baseTipCount = 0) {
    try {
      const items = await fetchTipsForCase(caseRowId, 50);
      setTips(items);
      setTipCount(Math.max(baseTipCount, items.length));
      setErrorMessage("");
    } catch (error) {
      setTips([]);
      setTipCount(baseTipCount);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Case file loaded, but the public tip board is having a moment.",
      );
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let active = true;

    async function loadCaseData() {
      try {
        const record = await fetchCaseByCode(caseId);

        if (!active) {
          return;
        }

        setCaseRecord(record);

        if (!record) {
          setTips([]);
          setTipCount(0);
          return;
        }

        await loadTips(record.id, record.tipCount);
      } catch (error) {
        if (!active) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Could not load this case file.");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadCaseData();

    return () => {
      active = false;
    };
  }, [caseId]);

  async function handlePosterDownload() {
    if (!caseRecord) {
      return;
    }

    setIsDownloadingPoster(true);
    setErrorMessage("");

    try {
      await downloadPoster(caseRecord, deriveLiveStatus(caseRecord.status, tipCount), {
        helpfulTipAttribution: rewardWorthyTip?.attributionLabel ?? null,
        helpfulTipLabel: rewardWorthyTip ? TIP_TYPE_LABELS[rewardWorthyTip.type] : null,
        helpfulTipMessage: rewardWorthyTip?.message ?? null,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Poster download failed.");
    } finally {
      setIsDownloadingPoster(false);
    }
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

  if (!isSupabaseConfigured) {
    return (
      <section className="bureau-card p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d55b]">
          Public Registry Offline
        </p>
        <h1 className="mt-3 font-display text-4xl uppercase text-[#f8f0dc]">
          The case bureau is offline
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#d7d0c5]">
          The public case registry is unavailable right now. Reopen this file once the backend paperwork is repaired.
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
  const threatLevel = caseRecord.threatLevel;
  const suspects = getPrimarySuspects(caseRecord.caseId);
  const recoveryAdvice = getRecoveryAdvice(caseRecord.crimeScene);
  const isOwner = session.uid === caseRecord.ownerId;
  const isClosed = caseRecord.status === "found";
  const publicTips = tips.filter((tip) => tip.type !== "hostage-roleplay");
  const hostageClaims = tips.filter((tip) => tip.type === "hostage-roleplay");
  const citizenSuspect = caseRecord.primarySuspect.trim();
  const generatedSuspects = citizenSuspect
    ? suspects.filter((suspect) => suspect.toLowerCase() !== citizenSuspect.toLowerCase())
    : suspects;
  const rewardWorthyTip =
    caseRecord.closureHelpfulTipId
      ? publicTips.find((tip) => tip.id === caseRecord.closureHelpfulTipId) ?? null
      : null;
  const bannerMessage = [noticeMessage, errorMessage].filter(Boolean).join(" ");
  const hasMainEvidence = Boolean(
    caseRecord.imageUrl && failedMainImageUrl !== caseRecord.imageUrl,
  );
  const hasSceneEvidence = caseRecord.sceneImageStatus === "active" && Boolean(caseRecord.sceneImageUrl);
  const canShowSceneEvidence = Boolean(
    caseRecord.sceneImageUrl && failedSceneImageUrl !== caseRecord.sceneImageUrl,
  );
  const rewardDeliveredLabel =
    caseRecord.closureRewardDelivered == null
      ? "Not specified"
      : caseRecord.closureRewardDelivered
        ? "Yes"
        : "No";
  const posterButtonLabel = isClosed ? "Download Case Poster" : "Download Missing Poster";

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
              <div className="grid gap-4">
                <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0f0c0a]">
                  {hasMainEvidence ? (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewImage({
                          src: caseRecord.imageUrl ?? "",
                          title: `${caseRecord.nickname} evidence image`,
                        })
                      }
                      className="group block w-full text-left"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={caseRecord.imageUrl ?? ""}
                        alt={`${caseRecord.nickname} evidence`}
                        className="h-[320px] w-full object-cover transition duration-300 group-hover:scale-[1.01] sm:h-[360px]"
                        onError={() => setFailedMainImageUrl(caseRecord.imageUrl ?? "")}
                      />
                      <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#b7b0a5]">
                        <span>Main Evidence</span>
                        <span className="text-[#f5d55b]">Tap to inspect</span>
                      </div>
                    </button>
                  ) : (
                    <div className="flex min-h-[320px] items-center justify-center px-6 py-8 sm:min-h-[360px]">
                      <div className="flex flex-col items-center gap-4 text-center">
                        <div className="origin-center scale-[1.12] sm:scale-[1.2]">
                          <ChappalAvatar
                            color={caseRecord.color}
                            nickname={caseRecord.nickname}
                            type={caseRecord.type}
                          />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f5d55b]">
                            Bureau Fallback Visual
                          </p>
                          <p className="mt-2 max-w-sm text-sm leading-6 text-[#d7d0c5]">
                            Official footwear evidence is unavailable, so the bureau sketch artist
                            made this highly disputable reconstruction.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

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
                {!isClosed && !isOwner ? (
                  <button
                    type="button"
                    onClick={() => setIsTipPanelOpen(true)}
                    className="primary-button w-full justify-center"
                  >
                    Send Tip
                  </button>
                ) : null}
                {!isClosed && !isOwner ? (
                  <button
                    type="button"
                    onClick={() => setIsHostagePanelOpen(true)}
                    className="secondary-button w-full justify-center"
                  >
                    CHAPPAL TAKEN HOSTAGE
                  </button>
                ) : null}
                {isOwner && !isClosed ? (
                  <button
                    type="button"
                    onClick={() => setIsFoundModalOpen(true)}
                    className="secondary-button w-full justify-center"
                  >
                    Mark As Found
                  </button>
                ) : null}
                {isOwner && isClosed ? (
                  <span className="inline-flex items-center justify-center rounded-full border border-white/10 bg-black/15 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b7b0a5]">
                    Already Found
                  </span>
                ) : null}
                {!isOwner && isClosed ? (
                  <span className="inline-flex items-center justify-center rounded-full border border-[#5f8c69]/35 bg-[#132119] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#cfe3d0]">
                    CASE CLOSED
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={handlePosterDownload}
                  disabled={isDownloadingPoster}
                  className="secondary-button w-full justify-center"
                >
                  {isDownloadingPoster ? "Rendering Poster..." : posterButtonLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCaseReportOpen(true)}
                  className="secondary-button w-full justify-center"
                >
                  Report Case
                </button>
              </div>

              {isClosed ? (
                <p className="mt-3 text-xs leading-5 text-[#b7b0a5]">{CASE_CLOSED_MESSAGE}</p>
              ) : null}
            </div>
          </div>
        </div>

        {bannerMessage ? (
          <div className="rounded-[20px] border border-[#c84333]/45 bg-[#351815] px-4 py-3 text-sm text-[#ffcab7]">
            {bannerMessage}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="bureau-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d55b]">
              Primary Suspects
            </p>
            {citizenSuspect ? (
              <div className="mt-4 rounded-[18px] border border-[#f5d55b]/28 bg-[#221a11] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f5d55b]">
                  Citizen-nominated suspect
                </p>
                <p className="mt-2 text-sm leading-6 text-[#fff1dd]">{citizenSuspect}</p>
              </div>
            ) : null}
            <div className="mt-4 grid gap-3">
              {generatedSuspects.map((suspect) => (
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

        {hasSceneEvidence ? (
          <div className="bureau-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d55b]">
                  SCENE EVIDENCE
                </p>
                <h2 className="mt-3 font-display text-3xl uppercase text-[#f8f0dc]">
                  Rack-side visual record
                </h2>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b7b0a5]">
                Supplementary upload
              </span>
            </div>

            <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-[#0f0c0a]">
              {canShowSceneEvidence ? (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewImage({
                      src: caseRecord.sceneImageUrl ?? "",
                      title: `${caseRecord.nickname} scene evidence`,
                    })
                  }
                  className="group block w-full text-left"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={caseRecord.sceneImageUrl ?? ""}
                    alt={`${caseRecord.nickname} scene evidence`}
                    className="h-[260px] w-full object-cover transition duration-300 group-hover:scale-[1.01] sm:h-[320px]"
                    onError={() => setFailedSceneImageUrl(caseRecord.sceneImageUrl ?? "")}
                  />
                  <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#b7b0a5]">
                    <span>Scene Photo</span>
                    <span className="text-[#f5d55b]">Tap to inspect</span>
                  </div>
                </button>
              ) : (
                <div className="px-4 py-5 text-sm leading-6 text-[#d7d0c5]">
                  Scene evidence was filed, but the image could not be loaded right now. The case
                  file is still live.
                </div>
              )}
            </div>
          </div>
        ) : null}

        {isClosed ? (
          <div className="bureau-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d55b]">
              CASE CLOSURE REPORT
            </p>
            <h2 className="mt-3 font-display text-3xl uppercase text-[#f8f0dc]">
              Recovery debrief
            </h2>

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="bureau-field">
                <dt>Closed</dt>
                <dd>{caseRecord.closedAt ? formatTimeAgo(caseRecord.closedAt) : "Recently"}</dd>
              </div>
              <div className="bureau-field">
                <dt>Where found</dt>
                <dd>{caseRecord.closureFoundLocation || "Not recorded"}</dd>
              </div>
              <div className="bureau-field">
                <dt>Who took it</dt>
                <dd>{caseRecord.closureWhoTookIt || "Unknown"}</dd>
              </div>
              <div className="bureau-field">
                <dt>Public tip helped</dt>
                <dd>{caseRecord.closureTipsHelped ? "Yes" : "No"}</dd>
              </div>
              <div className="bureau-field">
                <dt>Reward delivered</dt>
                <dd>{rewardDeliveredLabel}</dd>
              </div>
              <div className="bureau-field">
                <dt>Status</dt>
                <dd>Found / Case Closed</dd>
              </div>
            </dl>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[18px] border border-white/10 bg-black/15 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f5d55b]">
                  What actually happened
                </p>
                <p className="mt-3 text-sm leading-7 text-[#d7d0c5]">
                  {caseRecord.closureSummary || "No additional closure note was filed."}
                </p>
              </div>

              {rewardWorthyTip ? (
                <div className="rounded-[18px] border border-[#5f8c69]/35 bg-[#15211a] px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#bfe0c3]">
                    Reward-worthy tip
                  </p>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9fd0ad]">
                    {TIP_TYPE_LABELS[rewardWorthyTip.type]}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#f8f0dc]">{rewardWorthyTip.message}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#9fd0ad]">
                    {rewardWorthyTip.attributionLabel}
                  </p>
                </div>
              ) : (
                <div className="rounded-[18px] border border-dashed border-white/12 px-4 py-4 text-sm leading-6 text-[#b7b0a5]">
                  No public tip was marked as reward-worthy in the closure report.
                </div>
              )}
            </div>
          </div>
        ) : null}

        <div className="bureau-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d55b]">
            PUBLIC TIPS
          </p>
          <div className="mt-4 grid gap-3">
            {publicTips.length ? (
              publicTips.map((tip) => (
                <article
                  key={tip.id}
                  className="rounded-[18px] border border-white/10 bg-black/15 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f5d55b]">
                      {TIP_TYPE_LABELS[tip.type]}
                    </span>
                    <span className="text-xs text-[#9fa79c]">
                      {formatTimeAgo(tip.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#f8f0dc]">{tip.message}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#9fa79c]">
                    {tip.attributionLabel}
                  </p>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setReportTip(tip)}
                      className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f5d55b]"
                    >
                      Report Tip
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[18px] border border-dashed border-white/12 px-4 py-5 text-sm leading-6 text-[#b7b0a5]">
                No public tips yet. The nation is watching silently.
              </div>
            )}
          </div>
        </div>

        <div className="bureau-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d55b]">
            HOSTAGE CLAIMS
          </p>
          <p className="mt-3 text-sm leading-7 text-[#d7d0c5]">{HOSTAGE_SAFETY_COPY}</p>
          <div className="mt-4 grid gap-3">
            {hostageClaims.length ? (
              hostageClaims.map((tip) => (
                <article
                  key={tip.id}
                  className="rounded-[18px] border border-[#c84333]/35 bg-[linear-gradient(145deg,rgba(56,24,20,0.9),rgba(18,13,11,0.96))] px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="rounded-full border border-[#f5d55b]/35 bg-[#261c10] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f5d55b]">
                      Hostage Claim
                    </span>
                    <span className="text-xs text-[#d7b7a7]">
                      {formatTimeAgo(tip.createdAt)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[#fff1dd]">{tip.message}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#d7b7a7]">
                    {tip.attributionLabel}
                  </p>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setReportTip(tip)}
                      className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f5d55b]"
                    >
                      Report Tip
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[18px] border border-dashed border-[#c84333]/30 px-4 py-5 text-sm leading-6 text-[#cdb9ae]">
                No ransom notes yet. The chappal mafia is silent.
              </div>
            )}
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
              {isClosed ? "CASE CLOSED - CHAPPAL RECOVERED" : "MISSING CHAPPAL"}
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
            {isDownloadingPoster ? "Rendering Poster..." : posterButtonLabel}
          </button>
        </div>
      </section>

      <TipPanel
        open={isTipPanelOpen}
        caseRecord={caseRecord}
        onClose={() => setIsTipPanelOpen(false)}
        onTipSent={() => {
          if (!caseRecord) {
            return;
          }

          setTipCount((current) => current + 1);
          void loadTips(caseRecord.id);
        }}
      />

      <HostageClaimPanel
        open={isHostagePanelOpen}
        caseRecord={caseRecord}
        onClose={() => setIsHostagePanelOpen(false)}
        onClaimSent={() => {
          if (!caseRecord) {
            return;
          }

          setTipCount((current) => current + 1);
          void loadTips(caseRecord.id);
        }}
      />

      <ReportPanel
        open={isCaseReportOpen || Boolean(reportTip)}
        caseRecord={caseRecord}
        tipRecord={reportTip}
        onClose={() => {
          setIsCaseReportOpen(false);
          setReportTip(null);
        }}
      />

      <CaseClosurePanel
        key={`${caseRecord.id}-${isFoundModalOpen ? "open" : "closed"}`}
        open={isFoundModalOpen && isOwner && !isClosed}
        caseRecord={caseRecord}
        initialTips={publicTips}
        onClose={() => setIsFoundModalOpen(false)}
        onCaseClosed={(updatedCase) => {
          setCaseRecord(updatedCase);
          setIsFoundModalOpen(false);
        }}
      />

      <ModalShell
        open={Boolean(previewImage)}
        title={previewImage?.title ?? "Evidence Preview"}
        description="Public evidence preview only. No exact addresses, private details, or real tracking."
        onClose={() => setPreviewImage(null)}
      >
        {previewImage ? (
          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0f0c0a]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage.src}
              alt={previewImage.title}
              className="max-h-[70vh] w-full object-contain"
            />
          </div>
        ) : null}
      </ModalShell>
    </>
  );
}
