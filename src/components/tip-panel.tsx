"use client";

import { useState } from "react";

import { ModalShell } from "@/components/modal-shell";
import { useFirebaseSession } from "@/components/providers/firebase-session-provider";
import { TIP_PRESETS } from "@/lib/constants";
import { createCustomTip, createPresetTip } from "@/lib/firestore";
import { validateCustomTip } from "@/lib/validation";
import type { CaseRecord } from "@/types";

interface TipPanelProps {
  open: boolean;
  caseRecord: CaseRecord | null;
  onClose: () => void;
  onTipSent: () => void;
}

export function TipPanel({ open, caseRecord, onClose, onTipSent }: TipPanelProps) {
  const session = useFirebaseSession();
  const [customTip, setCustomTip] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!caseRecord) {
    return null;
  }

  async function handlePresetTip(presetKey: (typeof TIP_PRESETS)[number]["key"]) {
    const currentCase = caseRecord;
    if (!currentCase) {
      return;
    }

    if (session.status !== "ready" || !session.uid) {
      setErrorMessage("The desk clerk is not signed in yet.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await createPresetTip(currentCase.caseId, presetKey, session.uid);
      onTipSent();
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not send that tip.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCustomTip() {
    const currentCase = caseRecord;
    if (!currentCase) {
      return;
    }

    if (session.status !== "ready" || !session.uid) {
      setErrorMessage("The desk clerk is not signed in yet.");
      return;
    }

    const validation = validateCustomTip(customTip);
    if ("error" in validation) {
      setErrorMessage(validation.error);
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await createCustomTip(currentCase.caseId, validation.message, session.uid);
      setCustomTip("");
      onTipSent();
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not send that custom tip.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalShell
      open={open}
      title={`Tip for ${caseRecord.nickname}`}
      description="Preset tips are safer for v1. Custom tips are short, public, and still not allowed to include names, numbers, or threats."
      onClose={onClose}
    >
      <div className="grid gap-3">
        {TIP_PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => handlePresetTip(preset.key)}
            disabled={isSubmitting}
            className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-[#f8f0dc] transition hover:border-[#f5d55b]/50 hover:bg-[#221d16] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-[20px] border border-white/10 bg-black/15 p-4">
        <label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f5d55b]">
          Optional short custom tip
        </label>
        <textarea
          value={customTip}
          onChange={(event) => setCustomTip(event.target.value)}
          maxLength={120}
          rows={4}
          className="mt-3 w-full rounded-[18px] border border-white/10 bg-[#120f0d] px-4 py-3 text-sm text-[#f8f0dc] outline-none transition focus:border-[#f5d55b]/55"
          placeholder="Example: Check the plastic chair pile near the snack table."
        />
        <p className="mt-2 text-xs leading-5 text-[#b7b0a5]">
          No phone numbers, no real names, no threats. Keep it public-safe.
        </p>
        <button
          type="button"
          onClick={handleCustomTip}
          disabled={isSubmitting}
          className="primary-button mt-4 w-full justify-center"
        >
          {isSubmitting ? "Submitting Tip..." : "Send Custom Tip"}
        </button>
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-[16px] border border-[#c84333]/45 bg-[#351815] px-4 py-3 text-sm text-[#ffcab7]">
          {errorMessage}
        </p>
      ) : null}
    </ModalShell>
  );
}
