"use client";

import { useState } from "react";

import { ModalShell } from "@/components/modal-shell";
import { useFirebaseSession } from "@/components/providers/firebase-session-provider";
import { REPORT_REASONS } from "@/lib/constants";
import { submitCaseReport } from "@/lib/firestore";
import { validateReport } from "@/lib/validation";
import type { CaseRecord, ReportReason } from "@/types";

interface ReportPanelProps {
  open: boolean;
  caseRecord: CaseRecord | null;
  onClose: () => void;
}

export function ReportPanel({ open, caseRecord, onClose }: ReportPanelProps) {
  const session = useFirebaseSession();
  const [reason, setReason] = useState<ReportReason>("real-info");
  const [note, setNote] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!caseRecord) {
    return null;
  }

  async function handleSubmit() {
    const currentCase = caseRecord;
    if (!currentCase) {
      return;
    }

    if (session.status !== "ready" || !session.uid) {
      setStatusMessage("Anonymous auth is not ready yet.");
      return;
    }

    const validation = validateReport({ reason, note });
    if ("error" in validation) {
      setStatusMessage(validation.error);
      return;
    }

    setStatusMessage("");
    setIsSubmitting(true);

    try {
      await submitCaseReport(currentCase.caseId, validation.payload, session.uid);
      setStatusMessage("Report filed. This stays out of the public feed.");
      setNote("");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Could not submit the report.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalShell
      open={open}
      title="Report Case"
      description="This is for misuse moderation only. Reports are not public and they do not accuse anyone automatically."
      onClose={onClose}
    >
      <div className="grid gap-3">
        {REPORT_REASONS.map((reportReason) => (
          <button
            key={reportReason.key}
            type="button"
            onClick={() => setReason(reportReason.key)}
            className={`rounded-[18px] border px-4 py-3 text-left transition ${
              reason === reportReason.key
                ? "border-[#f5d55b]/55 bg-[#2b2415]"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
          >
            <p className="text-sm font-semibold text-[#f8f0dc]">{reportReason.label}</p>
            <p className="mt-1 text-xs leading-5 text-[#b7b0a5]">{reportReason.description}</p>
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-[20px] border border-white/10 bg-black/15 p-4">
        <label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f5d55b]">
          Optional moderation note
        </label>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={80}
          rows={3}
          className="mt-3 w-full rounded-[18px] border border-white/10 bg-[#120f0d] px-4 py-3 text-sm text-[#f8f0dc] outline-none transition focus:border-[#f5d55b]/55"
          placeholder="Example: Posted a phone number in the clue."
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="primary-button mt-5 w-full justify-center"
      >
        {isSubmitting ? "Submitting Report..." : "Submit Report"}
      </button>

      {statusMessage ? (
        <p className="mt-4 rounded-[16px] border border-white/10 bg-[#181512] px-4 py-3 text-sm text-[#f8f0dc]">
          {statusMessage}
        </p>
      ) : null}
    </ModalShell>
  );
}
