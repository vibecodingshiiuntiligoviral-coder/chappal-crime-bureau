import Link from "next/link";

import { ChappalAvatar } from "@/components/chappal-avatar";
import { StatusBadge, ThreatBadge } from "@/components/status-badge";
import { computeThreatLevel, formatTimeAgo } from "@/lib/case-helpers";
import type { CaseRecord, CaseStatus } from "@/types";

interface CaseCardProps {
  caseRecord: CaseRecord;
  liveStatus: CaseStatus;
  tipCount: number;
  onSendTip: () => void;
  onMarkFound: () => void;
}

export function CaseCard({
  caseRecord,
  liveStatus,
  tipCount,
  onSendTip,
  onMarkFound,
}: CaseCardProps) {
  const threatLevel = computeThreatLevel(caseRecord);

  return (
    <article className="bureau-card group flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <ChappalAvatar
            color={caseRecord.color}
            nickname={caseRecord.nickname}
            type={caseRecord.type}
          />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d55b]">
              Case ID {caseRecord.caseId}
            </p>
            <h3 className="mt-2 font-display text-3xl uppercase leading-none text-[#f8f0dc]">
              {caseRecord.nickname}
            </h3>
            <p className="mt-1 text-sm text-[#cfc7ba]">
              {caseRecord.type} / {caseRecord.color}
            </p>
            <p className="mt-2 text-sm text-[#9fa79c]">
              Filed {formatTimeAgo(caseRecord.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={liveStatus} />
          <ThreatBadge level={threatLevel} />
        </div>
      </div>

      <div className="warning-divider" />

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
          <dt>Last Seen Clue</dt>
          <dd>{caseRecord.lastSeenClue}</dd>
        </div>
        <div className="bureau-field">
          <dt>Reward</dt>
          <dd>{caseRecord.reward}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b7b0a5]">
        <span className="rounded-full border border-white/10 px-3 py-1">
          Tips {tipCount}
        </span>
        {caseRecord.instagramHandle ? (
          <span className="rounded-full border border-white/10 px-3 py-1">
            @{caseRecord.instagramHandle}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link className="primary-button flex-1 text-center" href={`/cases/${caseRecord.caseId}`}>
          View Case
        </Link>
        <button type="button" className="secondary-button flex-1" onClick={onSendTip}>
          Send Tip
        </button>
        <button
          type="button"
          className="secondary-button flex-1"
          onClick={onMarkFound}
          disabled={liveStatus === "Found"}
        >
          {liveStatus === "Found" ? "Already Found" : "Mark Found"}
        </button>
      </div>
    </article>
  );
}
