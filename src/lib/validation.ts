import { CHAPPAL_TYPES, CRIME_SCENES } from "@/lib/constants";
import type { CaseFieldErrors, CaseFormValues, ReportPayload } from "@/types";

const handlePattern = /^[a-zA-Z0-9._]{1,30}$/;
const phonePattern = /(?:\+?\d[\d\s-]{6,}\d)/;
const preciseAddressPattern =
  /\b(?:house|flat|room|plot|gate|apartment|building)\b[\s#:,-]*\d+/i;

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function containsUnsafePublicInfo(value: string) {
  return phonePattern.test(value) || preciseAddressPattern.test(value);
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
    instagramHandle: normalizeText(values.instagramHandle).replace(/^@+/, ""),
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
    errors.area = "Use a broad area only. No exact addresses or phone numbers.";
  }

  if (!CRIME_SCENES.includes(normalized.crimeScene)) {
    errors.crimeScene = "Choose a valid crime scene.";
  }

  if (!normalized.lastSeenClue) {
    errors.lastSeenClue = "Add one last clue for the public case file.";
  } else if (normalized.lastSeenClue.length > 100) {
    errors.lastSeenClue = "Keep the clue under 100 characters.";
  } else if (containsUnsafePublicInfo(normalized.lastSeenClue)) {
    errors.lastSeenClue = "Clues cannot include exact addresses or phone numbers.";
  }

  if (!normalized.reward) {
    errors.reward = "Pick a reward, even if it is just emotional collapse.";
  } else if (normalized.reward.length > 40) {
    errors.reward = "Keep the reward text under 40 characters.";
  }

  if (normalized.instagramHandle) {
    if (!handlePattern.test(normalized.instagramHandle)) {
      errors.instagramHandle = "Use only Instagram username characters: letters, numbers, . and _.";
    } else if (/\d{7,}/.test(normalized.instagramHandle)) {
      errors.instagramHandle = "Phone-number style handles are not allowed here.";
    }
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
  const message = normalizeText(rawTip);

  if (!message) {
    return { error: "Add a short tip before sending." };
  }

  if (message.length > 120) {
    return { error: "Custom tips must stay under 120 characters." };
  }

  if (containsUnsafePublicInfo(message)) {
    return { error: "Tips cannot include phone numbers or exact address details." };
  }

  return { message };
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
  return normalizeText(rawValue).slice(0, 40);
}
