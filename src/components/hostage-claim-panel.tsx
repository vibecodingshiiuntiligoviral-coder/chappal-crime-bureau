"use client";

import { useState } from "react";

import { ModalShell } from "@/components/modal-shell";
import { useSupabaseSession } from "@/components/providers/supabase-session-provider";
import {
  AUTHOR_ALIAS_MAX_LENGTH,
  CASE_CLOSED_MESSAGE,
  HOSTAGE_SAFETY_COPY,
  TIP_MESSAGE_MAX_LENGTH,
} from "@/lib/constants";
import { getCooldownError, stampCooldown } from "@/lib/cooldowns";
import { createHostageTip } from "@/lib/supabase-data";
import { validateHostageClaim, validateTipAttribution } from "@/lib/validation";
import type { CaseRecord } from "@/types";

interface HostageClaimPanelProps {
  open: boolean;
  caseRecord: CaseRecord | null;
  onClose: () => void;
  onClaimSent: () => void;
}

export function HostageClaimPanel({
  open,
  caseRecord,
  onClose,
  onClaimSent,
}: HostageClaimPanelProps) {
  const session = useSupabaseSession();
  const [message, setMessage] = useState("");
  const [authorAlias, setAuthorAlias] = useState("");
  const [authorInstagram, setAuthorInstagram] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!caseRecord) {
    return null;
  }

  const isClosed = caseRecord.status === "found";
  const isOwner = session.uid === caseRecord.ownerId;

  async function handleSubmit() {
    const currentCase = caseRecord;
    if (!currentCase) {
      return;
    }

    if (session.status !== "ready" || !session.uid) {
      setErrorMessage("The desk clerk is not signed in yet.");
      return;
    }

    if (currentCase.status === "found") {
      setErrorMessage(CASE_CLOSED_MESSAGE);
      return;
    }

    if (session.uid === currentCase.ownerId) {
      setErrorMessage("Only other citizens can file a hostage roleplay claim.");
      return;
    }

    const cooldownMessage = getCooldownError(session.uid, "tip");
    if (cooldownMessage) {
      setErrorMessage(cooldownMessage);
      return;
    }

    const validation = validateHostageClaim(message);
    if ("error" in validation) {
      setErrorMessage(validation.error);
      return;
    }

    const attribution = validateTipAttribution(authorAlias, authorInstagram);
    if ("error" in attribution) {
      setErrorMessage(attribution.error);
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await createHostageTip(currentCase, validation.message, session.uid, attribution);
      stampCooldown(session.uid, "tip");
      setMessage("");
      setAuthorAlias("");
      setAuthorInstagram("");
      onClaimSent();
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not send that hostage claim.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalShell
      open={open}
      title="CHAPPAL TAKEN HOSTAGE"
      description={HOSTAGE_SAFETY_COPY}
      onClose={onClose}
    >
      <div className="modal-stack">
        {isClosed ? (
          <p className="rounded-[18px] border border-[#5f8c69]/30 bg-[#132119] px-4 py-3 text-sm text-[#cfe3d0]">
            {CASE_CLOSED_MESSAGE}
          </p>
        ) : null}
        {!isClosed && isOwner ? (
          <p className="rounded-[18px] border border-white/10 bg-black/15 px-4 py-3 text-sm text-[#d7d0c5]">
            Case owners cannot send hostage claims on their own FIR.
          </p>
        ) : null}

        <div className="rounded-[20px] border border-white/10 bg-black/15 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f5d55b]">
            Optional informant attribution
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b7b0a5]">
                Name / alias
              </span>
              <input
                value={authorAlias}
                onChange={(event) => setAuthorAlias(event.target.value)}
                maxLength={AUTHOR_ALIAS_MAX_LENGTH}
                disabled={isSubmitting || isClosed || isOwner}
                placeholder="Concerned rack observer"
                className="bureau-input disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b7b0a5]">
                Instagram handle
              </span>
              <input
                value={authorInstagram}
                onChange={(event) => setAuthorInstagram(event.target.value)}
                maxLength={30}
                disabled={isSubmitting || isClosed || isOwner}
                placeholder="hostage_hotline"
                className="bureau-input disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
          </div>
          <p className="mt-2 text-xs leading-5 text-[#b7b0a5]">
            Handle only. No full URLs, no phone numbers, no exact addresses.
          </p>
        </div>

        <div className="rounded-[20px] border border-white/10 bg-black/15 p-4">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f5d55b]">
            Roleplay ransom note
          </label>
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={TIP_MESSAGE_MAX_LENGTH}
            disabled={isSubmitting || isClosed || isOwner}
            className="mt-3 w-full rounded-[18px] border border-white/10 bg-[#120f0d] px-4 py-3 text-sm text-[#f8f0dc] outline-none transition focus:border-[#f5d55b]/55 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="Example: We have the chappal. Bring 2 samosas to the rack area."
          />
          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[#b7b0a5]">
            <span>Single line only. No real threats, money demands, names, or numbers.</span>
            <span>
              {message.length}/{TIP_MESSAGE_MAX_LENGTH}
            </span>
          </div>
        </div>

        <div className="modal-sticky-footer">
          {errorMessage ? (
            <p className="rounded-[16px] border border-[#c84333]/45 bg-[#351815] px-4 py-3 text-sm text-[#ffcab7]">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isClosed || isOwner}
            className="primary-button w-full justify-center"
          >
            {isSubmitting ? "Submitting Claim..." : "Submit Hostage Claim"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
