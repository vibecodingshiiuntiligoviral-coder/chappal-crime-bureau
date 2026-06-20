"use client";

import { useEffect, useState } from "react";

import { DarkSelect } from "@/components/dark-select";
import { ModalShell } from "@/components/modal-shell";
import { useSupabaseSession } from "@/components/providers/supabase-session-provider";
import { CLOSURE_SUMMARY_MAX_LENGTH, TIP_TYPE_LABELS } from "@/lib/constants";
import { fetchTipsForCase, submitCaseClosure } from "@/lib/supabase-data";
import { validateClosureInput } from "@/lib/validation";
import type {
  CaseClosureFormValues,
  CaseRecord,
  ClosureFieldErrors,
  TipRecord,
} from "@/types";

interface CaseClosurePanelProps {
  open: boolean;
  caseRecord: CaseRecord | null;
  initialTips?: TipRecord[];
  onClose: () => void;
  onCaseClosed: (updatedCase: CaseRecord) => void;
}

function buildInitialValues(): CaseClosureFormValues {
  return {
    whoTookIt: "",
    foundLocation: "",
    tipsHelped: "no",
    helpfulTipId: "",
    rewardDelivered: "skip",
    summary: "",
  };
}

function buildTipOptionLabel(tip: TipRecord) {
  const snippet =
    tip.message.length > 56 ? `${tip.message.slice(0, 56).trimEnd()}...` : tip.message;
  return `${TIP_TYPE_LABELS[tip.type]} - ${snippet}`;
}

export function CaseClosurePanel({
  open,
  caseRecord,
  initialTips = [],
  onClose,
  onCaseClosed,
}: CaseClosurePanelProps) {
  const session = useSupabaseSession();
  const [values, setValues] = useState<CaseClosureFormValues>(() => buildInitialValues());
  const [fieldErrors, setFieldErrors] = useState<ClosureFieldErrors>({});
  const [loadedTips, setLoadedTips] = useState<TipRecord[]>(initialTips);
  const [isLoadingTips, setIsLoadingTips] = useState(
    () => open && Boolean(caseRecord) && initialTips.length === 0,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !caseRecord) {
      return;
    }

    let active = true;

    if (initialTips.length) {
      return () => {
        active = false;
      };
    }

    fetchTipsForCase(caseRecord.id, 50)
      .then((items) => {
        if (!active) {
          return;
        }

        setLoadedTips(items);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setFieldErrors((current) => ({
          ...current,
          form: error instanceof Error ? error.message : "Could not load the tip list for closure.",
        }));
      })
      .finally(() => {
        if (active) {
          setIsLoadingTips(false);
        }
      });

    return () => {
      active = false;
    };
  }, [caseRecord, initialTips, open]);

  if (!caseRecord) {
    return null;
  }

  const isOwner = session.uid === caseRecord.ownerId;
  const availableHelpfulTips = loadedTips.filter((tip) => tip.type !== "hostage-roleplay");

  function updateValue<Key extends keyof CaseClosureFormValues>(
    field: Key,
    value: CaseClosureFormValues[Key],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
      ...(field === "tipsHelped" && value === "no" ? { helpfulTipId: "" } : {}),
    }));
    setFieldErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }));
  }

  async function handleSubmit() {
    if (session.status !== "ready" || !session.uid) {
      setFieldErrors({
        form: "Anonymous auth is not ready yet. Wait a moment, then close the case again.",
      });
      return;
    }

    if (!caseRecord) {
      setFieldErrors({
        form: "This case file is unavailable right now. Reopen the closure report and try again.",
      });
      return;
    }

    if (!isOwner) {
      setFieldErrors({
        form: "Only the case owner can file the closure report.",
      });
      return;
    }

    const validation = validateClosureInput(
      values,
      availableHelpfulTips.map((tip) => tip.id),
    );

    if ("error" in validation) {
      setFieldErrors({
        [validation.field ?? "form"]: validation.error,
      });
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const updatedCase = await submitCaseClosure(caseRecord, validation.normalized);
      onCaseClosed(updatedCase);
    } catch (error) {
      setFieldErrors({
        form: error instanceof Error ? error.message : "Could not file the closure report.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalShell
      open={open}
      title="Case Closure Report"
      description="Close this FIR with a recovery debrief. The closure report becomes public on the case file."
      onClose={onClose}
    >
      <div className="grid gap-4">
        <label className="grid gap-2">
          <span className="bureau-label">Who took it?</span>
          <input
            value={values.whoTookIt}
            onChange={(event) => updateValue("whoTookIt", event.target.value)}
            maxLength={80}
            placeholder="Unknown / pair swapper / bathroom bandit"
            className="bureau-input"
          />
          <p className="text-xs leading-5 text-[#b7b0a5]">
            Optional. Keep it broad and public-safe.
          </p>
          {fieldErrors.whoTookIt ? <p className="bureau-error">{fieldErrors.whoTookIt}</p> : null}
        </label>

        <label className="grid gap-2">
          <span className="bureau-label">Where was it found?</span>
          <input
            value={values.foundLocation}
            onChange={(event) => updateValue("foundLocation", event.target.value)}
            maxLength={100}
            placeholder="under the rack / hostel bathroom / wedding exit pile"
            className="bureau-input"
          />
          {fieldErrors.foundLocation ? (
            <p className="bureau-error">{fieldErrors.foundLocation}</p>
          ) : null}
        </label>

        <label className="grid gap-2">
          <span className="bureau-label">Did any public tip help?</span>
          <DarkSelect<CaseClosureFormValues["tipsHelped"]>
            value={values.tipsHelped}
            onChange={(nextValue) => updateValue("tipsHelped", nextValue)}
            options={[
              { value: "no", label: "No" },
              { value: "yes", label: "Yes" },
            ]}
          />
        </label>

        {values.tipsHelped === "yes" ? (
          <div className="grid gap-2">
            <span className="bureau-label">Reward-worthy tip</span>
            {isLoadingTips ? (
              <div className="rounded-[18px] border border-white/10 bg-black/15 px-4 py-3 text-sm text-[#d7d0c5]">
                Loading public tips...
              </div>
            ) : availableHelpfulTips.length ? (
              <DarkSelect<string>
                value={values.helpfulTipId}
                onChange={(nextValue) => updateValue("helpfulTipId", nextValue)}
                options={[
                  { value: "", label: "Choose a public tip" },
                  ...availableHelpfulTips.map((tip) => ({
                    value: tip.id,
                    label: buildTipOptionLabel(tip),
                  })),
                ]}
              />
            ) : (
              <div className="rounded-[18px] border border-dashed border-white/10 px-4 py-3 text-sm text-[#b7b0a5]">
                No public tips are available to reward on this case yet.
              </div>
            )}
            {fieldErrors.helpfulTipId ? (
              <p className="bureau-error">{fieldErrors.helpfulTipId}</p>
            ) : null}
          </div>
        ) : null}

        <label className="grid gap-2">
          <span className="bureau-label">Reward delivered?</span>
          <DarkSelect<CaseClosureFormValues["rewardDelivered"]>
            value={values.rewardDelivered}
            onChange={(nextValue) => updateValue("rewardDelivered", nextValue)}
            options={[
              { value: "skip", label: "Not specified" },
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
        </label>

        <label className="grid gap-2">
          <span className="bureau-label">What actually happened?</span>
          <textarea
            value={values.summary}
            onChange={(event) => updateValue("summary", event.target.value)}
            maxLength={CLOSURE_SUMMARY_MAX_LENGTH}
            rows={4}
            placeholder="Example: It was under the rack the whole time and society overreacted."
            className="bureau-input min-h-[120px]"
          />
          <div className="flex items-center justify-between gap-3 text-xs text-[#b7b0a5]">
            <span>Optional closure note for the public case file.</span>
            <span>
              {values.summary.length}/{CLOSURE_SUMMARY_MAX_LENGTH}
            </span>
          </div>
          {fieldErrors.summary ? <p className="bureau-error">{fieldErrors.summary}</p> : null}
        </label>
      </div>

      {fieldErrors.form ? (
        <p className="mt-4 rounded-[16px] border border-[#c84333]/45 bg-[#351815] px-4 py-3 text-sm text-[#ffcab7]">
          {fieldErrors.form}
        </p>
      ) : null}

      <div className="mt-5 flex gap-3">
        <button type="button" onClick={onClose} className="secondary-button flex-1">
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || (values.tipsHelped === "yes" && isLoadingTips)}
          className="primary-button flex-1 justify-center"
        >
          {isSubmitting ? "Filing Closure..." : "Submit Closure"}
        </button>
      </div>
    </ModalShell>
  );
}
