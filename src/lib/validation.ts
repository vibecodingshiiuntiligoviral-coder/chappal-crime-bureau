import {
  AUTHOR_ALIAS_MAX_LENGTH,
  CHAPPAL_TYPES,
  CLOSURE_SUMMARY_MAX_LENGTH,
  CRIME_SCENES,
  PRIMARY_SUSPECT_MAX_LENGTH,
  TIP_BANNED_WORDS,
  TIP_MESSAGE_MAX_LENGTH,
} from "@/lib/constants";
import { normalizeInstagramHandle } from "@/lib/case-helpers";
import type {
  CaseClosureFormValues,
  CaseClosurePayload,
  CaseFieldErrors,
  CaseFormValues,
  ReportPayload,
  TipAttributionInput,
} from "@/types";

const handlePattern = /^[a-zA-Z0-9._]{1,30}$/;
const phonePattern = /(?:\+?\d[\d\s-]{6,}\d)/;
const pincodePattern = /\b\d{6}\b/;
const preciseAddressPattern =
  /\b(?:house|flat|room|plot|gate|apartment|building)\b[\s#:,-]*\d+/i;
const urlPattern = /(https?:\/\/|www\.)/i;
const accusationPattern = /\b(stole|thief|chor|chori|culprit|snatched|robbed)\b/i;
const bannedWordPattern = new RegExp(`\\b(${TIP_BANNED_WORDS.join("|")})\\b`, "i");

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function containsUnsafePublicInfo(value: string) {
  return (
    phonePattern.test(value) ||
    preciseAddressPattern.test(value) ||
    pincodePattern.test(value) ||
    urlPattern.test(value)
  );
}

function containsUnsafeModerationText(value: string) {
  return bannedWordPattern.test(value) || accusationPattern.test(value);
}

function validateAlias(rawAlias: string) {
  if (/[\r\n]/.test(rawAlias)) {
    return { error: "Alias must stay on one line." };
  }

  const alias = normalizeText(rawAlias);
  if (!alias) {
    return { alias: "" };
  }

  if (alias.length > AUTHOR_ALIAS_MAX_LENGTH) {
    return { error: `Alias must stay under ${AUTHOR_ALIAS_MAX_LENGTH} characters.` };
  }

  if (containsUnsafePublicInfo(alias) || containsUnsafeModerationText(alias)) {
    return { error: "Alias cannot include private info, threats, abuse, or accusations." };
  }

  return { alias };
}

function validateInstagramHandle(rawHandle: string) {
  if (/[\r\n]/.test(rawHandle)) {
    return { error: "Instagram handle must stay on one line." };
  }

  const instagramHandle = normalizeInstagramHandle(normalizeText(rawHandle));
  if (!instagramHandle) {
    return { instagramHandle: "" };
  }

  if (!handlePattern.test(instagramHandle)) {
    return {
      error: "Use only Instagram username characters: letters, numbers, . and _.",
    };
  }

  if (/\d{7,}/.test(instagramHandle)) {
    return { error: "Phone-number style handles are not allowed here." };
  }

  return { instagramHandle };
}

function validatePublicSingleLineText(
  rawValue: string,
  {
    emptyMessage,
    tooLongMessage,
    maxLength,
    allowEmpty,
  }: {
    emptyMessage?: string;
    tooLongMessage: string;
    maxLength: number;
    allowEmpty?: boolean;
  },
) {
  if (/[\r\n]/.test(rawValue)) {
    return { error: "This field must stay on a single line." };
  }

  const value = normalizeText(rawValue);
  if (!value) {
    if (allowEmpty) {
      return { value: "" };
    }

    return { error: emptyMessage ?? "This field is required." };
  }

  if (value.length > maxLength) {
    return { error: tooLongMessage };
  }

  if (containsUnsafePublicInfo(value) || containsUnsafeModerationText(value)) {
    return { error: "Remove private info, threats, abuse, or direct accusations." };
  }

  return { value };
}

function validateTipMessage(rawTip: string, emptyMessage: string) {
  if (/[\r\n]/.test(rawTip)) {
    return { error: "Tips must stay on a single line." };
  }

  const message = normalizeText(rawTip);

  if (!message) {
    return { error: emptyMessage };
  }

  if (message.length > TIP_MESSAGE_MAX_LENGTH) {
    return { error: `Tips must stay under ${TIP_MESSAGE_MAX_LENGTH} characters.` };
  }

  if (containsUnsafePublicInfo(message)) {
    return {
      error: "Tips cannot include phone numbers, exact addresses, or 6-digit pincodes.",
    };
  }

  if (containsUnsafeModerationText(message)) {
    return {
      error: "That tip crosses the content rules. Keep it playful, non-accusatory, and public-safe.",
    };
  }

  return { message };
}

export function validateCaseInput(values: CaseFormValues) {
  const normalized: CaseFormValues = {
    nickname: normalizeText(values.nickname),
    type: values.type,
    color: normalizeText(values.color),
    area: normalizeText(values.area),
    crimeScene: values.crimeScene,
    lastSeenClue: normalizeText(values.lastSeenClue),
    reward: normalizeText(values.reward),
    instagramHandle: normalizeInstagramHandle(normalizeText(values.instagramHandle)),
    primarySuspect: normalizeText(values.primarySuspect),
  };

  const errors: CaseFieldErrors = {};

  if (!normalized.nickname) {
    errors.nickname = "Give the chappal a nickname so the bureau can pretend to care.";
  } else if (normalized.nickname.length > 40) {
    errors.nickname = "Keep the nickname under 40 characters.";
  }

  if (!CHAPPAL_TYPES.includes(normalized.type)) {
    errors.type = "Choose a valid footwear type.";
  }

  if (!normalized.color) {
    errors.color = "Add a color or visual clue.";
  } else if (normalized.color.length > 40) {
    errors.color = "Keep the color note under 40 characters.";
  }

  if (!normalized.area) {
    errors.area = "Area is required.";
  } else if (normalized.area.length > 40) {
    errors.area = "Area must stay under 40 characters.";
  } else if (containsUnsafePublicInfo(normalized.area)) {
    errors.area = "Use a broad area only. No exact addresses, phone numbers, or pincodes.";
  }

  if (!CRIME_SCENES.includes(normalized.crimeScene)) {
    errors.crimeScene = "Choose a valid crime scene.";
  }

  if (!normalized.lastSeenClue) {
    errors.lastSeenClue = "Add one last clue for the public case file.";
  } else if (normalized.lastSeenClue.length > 100) {
    errors.lastSeenClue = "Keep the clue under 100 characters.";
  } else if (containsUnsafePublicInfo(normalized.lastSeenClue)) {
    errors.lastSeenClue =
      "Clues cannot include exact addresses, phone numbers, or pincode-level details.";
  }

  if (!normalized.reward) {
    errors.reward = "Pick a reward, even if it is just emotional collapse.";
  } else if (normalized.reward.length > 40) {
    errors.reward = "Keep the reward text under 40 characters.";
  }

  if (normalized.instagramHandle) {
    const handleValidation = validateInstagramHandle(normalized.instagramHandle);
    if ("error" in handleValidation) {
      errors.instagramHandle = handleValidation.error;
    }
  }

  if (normalized.primarySuspect.length > PRIMARY_SUSPECT_MAX_LENGTH) {
    errors.primarySuspect = `Keep the suspect note under ${PRIMARY_SUSPECT_MAX_LENGTH} characters.`;
  } else if (
    normalized.primarySuspect &&
    (containsUnsafePublicInfo(normalized.primarySuspect) ||
      bannedWordPattern.test(normalized.primarySuspect))
  ) {
    errors.primarySuspect =
      "Keep the suspect note broad and playful. No private info, abuse, or doxxing.";
  }

  return {
    normalized,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

export function validateCustomTip(
  rawTip: string,
): { message: string } | { error: string } {
  return validateTipMessage(rawTip, "Add a short tip before sending.");
}

export function validateHostageClaim(
  rawTip: string,
): { message: string } | { error: string } {
  return validateTipMessage(rawTip, "Write a short hostage claim before sending.");
}

export function validateTipAttribution(
  rawAlias: string,
  rawInstagramHandle: string,
): TipAttributionInput | { error: string } {
  const aliasValidation = validateAlias(rawAlias);
  if ("error" in aliasValidation) {
    return { error: aliasValidation.error ?? "Alias is not allowed here." };
  }

  const handleValidation = validateInstagramHandle(rawInstagramHandle);
  if ("error" in handleValidation) {
    return { error: handleValidation.error ?? "Instagram handle is not allowed here." };
  }

  return {
    alias: aliasValidation.alias,
    instagramHandle: handleValidation.instagramHandle,
  };
}

export function validateClosureInput(
  values: CaseClosureFormValues,
  availableHelpfulTipIds: string[],
): { normalized: CaseClosurePayload } | { error: string; field?: keyof CaseClosureFormValues } {
  const whoValidation = validatePublicSingleLineText(values.whoTookIt, {
    allowEmpty: true,
    maxLength: PRIMARY_SUSPECT_MAX_LENGTH,
    tooLongMessage: `Keep the "who took it" note under ${PRIMARY_SUSPECT_MAX_LENGTH} characters.`,
  });
  if ("error" in whoValidation) {
    return { error: whoValidation.error ?? "Check the recovery note.", field: "whoTookIt" };
  }

  const foundLocationValidation = validatePublicSingleLineText(values.foundLocation, {
    emptyMessage: "Add where the chappal was found.",
    maxLength: 100,
    tooLongMessage: "Keep the found location under 100 characters.",
  });
  if ("error" in foundLocationValidation) {
    return {
      error: foundLocationValidation.error ?? "Add where the chappal was found.",
      field: "foundLocation",
    };
  }

  const normalizedSummary = normalizeText(values.summary);
  if (normalizedSummary.length > CLOSURE_SUMMARY_MAX_LENGTH) {
    return {
      error: `Keep the closure summary under ${CLOSURE_SUMMARY_MAX_LENGTH} characters.`,
      field: "summary",
    };
  }

  if (
    normalizedSummary &&
    (containsUnsafePublicInfo(normalizedSummary) || containsUnsafeModerationText(normalizedSummary))
  ) {
    return {
      error: "Closure summary cannot include private info, threats, abuse, or accusations.",
      field: "summary",
    };
  }

  if (values.tipsHelped === "yes" && !availableHelpfulTipIds.includes(values.helpfulTipId)) {
    return {
      error: "Choose which public tip helped before closing the case.",
      field: "helpfulTipId",
    };
  }

  return {
    normalized: {
      whoTookIt: whoValidation.value || null,
      foundLocation: foundLocationValidation.value,
      tipsHelped: values.tipsHelped === "yes",
      helpfulTipId: values.tipsHelped === "yes" ? values.helpfulTipId : null,
      rewardDelivered:
        values.rewardDelivered === "yes"
          ? true
          : values.rewardDelivered === "no"
            ? false
            : null,
      summary: normalizedSummary || null,
    },
  };
}

export function validateReport(
  payload: ReportPayload,
): { payload: ReportPayload } | { error: string } {
  const note = normalizeText(payload.note);

  if (note.length > 80) {
    return { error: "Keep report notes under 80 characters." };
  }

  if (containsUnsafePublicInfo(note)) {
    return { error: "Report notes cannot include private info either." };
  }

  return {
    payload: {
      ...payload,
      note,
    },
  };
}

export function sanitizeSearchInput(rawValue: string) {
  return rawValue.replace(/[\r\n\t]+/g, " ").slice(0, 40);
}
