import Link from "next/link";

import { ChappalAvatar } from "@/components/chappal-avatar";
import { StatusBadge, ThreatBadge } from "@/components/status-badge";
import { CASE_CLOSED_MESSAGE } from "@/lib/constants";
import { formatTimeAgo } from "@/lib/case-helpers";
import type { CaseRecord, CaseStatus } from "@/types";

interface CaseCardProps {
  caseRecord: CaseRecord;
  liveStatus: CaseStatus;
  tipCount: number;
  isOwner: boolean;
  onSendTip: () => void;
  onMarkFound: () => void;
}

export function CaseCard({
  caseRecord,
  liveStatus,
  tipCount,
  isOwner,
  onSendTip,
  onMarkFound,
}: CaseCardProps) {
  const isClosed = caseRecord.status === "found";

  return (
    <article className="bureau-card group flex min-w-0 max-w-full flex-col gap-4 overflow-hidden p-4 sm:p-5">
      <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-4">
        <div className="flex min-w-0 gap-3 sm:gap-4">
          <ChappalAvatar
            color={caseRecord.color}
            nickname={caseRecord.nickname}
            type={caseRecord.type}
            imageUrl={caseRecord.imageUrl}
          />
          <div className="min-w-0 flex-1">
            <p className="break-all text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f5d55b]">
              Case ID {caseRecord.caseId}
            </p>
            <h3 className="mt-2 break-words font-display text-[2.25rem] uppercase leading-none text-[#f8f0dc] sm:text-3xl">
              {caseRecord.nickname}
            </h3>
            <p className="mt-1 break-words text-sm leading-6 text-[#cfc7ba]">
              {caseRecord.type} / {caseRecord.color}
            </p>
            <p className="mt-2 break-words text-sm text-[#9fa79c]">
              Filed {formatTimeAgo(caseRecord.createdAt)}
            </p>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-2 min-[360px]:grid-cols-2 md:flex md:w-[12.5rem] md:flex-col md:items-end">
          <StatusBadge status={liveStatus} />
          <ThreatBadge level={caseRecord.threatLevel} />
        </div>
      </div>

      <div className="warning-divider" />

      <dl className="grid min-w-0 gap-3 text-sm sm:grid-cols-2">
        <div className="bureau-field min-w-0">
          <dt>Area</dt>
          <dd className="break-words">{caseRecord.area}</dd>
        </div>
        <div className="bureau-field min-w-0">
          <dt>Crime Scene</dt>
          <dd className="break-words">{caseRecord.crimeScene}</dd>
        </div>
        <div className="bureau-field min-w-0">
          <dt>Last Seen Clue</dt>
          <dd className="break-words">{caseRecord.lastSeenClue}</dd>
        </div>
        <div className="bureau-field min-w-0">
          <dt>Reward</dt>
          <dd className="break-words">{caseRecord.reward}</dd>
        </div>
      </dl>

      <div className="flex min-w-0 flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b7b0a5]">
        <span className="max-w-full rounded-[10px] border border-white/10 px-3 py-1 break-words">
          Tips {tipCount}
        </span>
        {caseRecord.instagramHandle ? (
          <span className="max-w-full rounded-[10px] border border-white/10 px-3 py-1 break-all">
            @{caseRecord.instagramHandle}
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          className="primary-button w-full min-w-0 flex-1 justify-center text-center"
          href={`/cases/${caseRecord.caseId}`}
        >
          View Case
        </Link>
        {!isClosed && !isOwner ? (
          <button
            type="button"
            className="secondary-button w-full min-w-0 flex-1 justify-center text-center"
            onClick={onSendTip}
          >
            Send Tip
          </button>
        ) : null}
        {isOwner && !isClosed ? (
          <button
            type="button"
            className="secondary-button w-full min-w-0 flex-1 justify-center text-center"
            onClick={onMarkFound}
          >
            Mark Found
          </button>
        ) : null}
        {isOwner && isClosed ? (
          <span className="inline-flex w-full min-w-0 flex-1 items-center justify-center rounded-full border border-white/10 bg-black/15 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b7b0a5]">
            Already Found
          </span>
        ) : null}
        {!isOwner && isClosed ? (
          <span className="inline-flex w-full min-w-0 flex-1 items-center justify-center rounded-full border border-[#5f8c69]/35 bg-[#132119] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#cfe3d0]">
            CASE CLOSED
          </span>
        ) : null}
      </div>

      {isClosed ? (
        <p className="text-xs leading-5 text-[#b7b0a5]">{CASE_CLOSED_MESSAGE}</p>
      ) : null}
    </article>
  );
}
