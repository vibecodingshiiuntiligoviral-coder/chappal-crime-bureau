import {
  DAILY_FIR_LIMIT,
  DAILY_FIR_QUOTA_MESSAGE,
  DAILY_FIR_WINDOW_MS,
} from "@/lib/constants";

type CooldownAction = "fir" | "tip" | "image-upload";

const COOLDOWN_MS: Record<CooldownAction, number> = {
  fir: 2 * 60 * 1000,
  tip: 20 * 1000,
  "image-upload": 2 * 60 * 1000,
};

const COOLDOWN_COPY: Record<CooldownAction, string> = {
  fir: "another footwear FIR",
  tip: "another tip",
  "image-upload": "another image upload",
};

function getStorageKey(userId: string, action: CooldownAction) {
  return `ccb:cooldown:${userId}:${action}`;
}

function getFirHistoryKey(userId: string) {
  return `ccb:fir-history:${userId}`;
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(1, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  if (seconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${seconds}s`;
}

export function getCooldownError(userId: string, action: CooldownAction) {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(getStorageKey(userId, action));
  if (!rawValue) {
    return null;
  }

  const expiresAt = Number(rawValue);
  if (!Number.isFinite(expiresAt)) {
    window.localStorage.removeItem(getStorageKey(userId, action));
    return null;
  }

  const remaining = expiresAt - Date.now();
  if (remaining <= 0) {
    window.localStorage.removeItem(getStorageKey(userId, action));
    return null;
  }

  return `Please wait ${formatRemaining(remaining)} before filing ${COOLDOWN_COPY[action]}.`;
}

export function stampCooldown(userId: string, action: CooldownAction) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getStorageKey(userId, action),
    String(Date.now() + COOLDOWN_MS[action]),
  );
}

function readFirHistory(userId: string) {
  if (typeof window === "undefined") {
    return [];
  }

  const rawValue = window.localStorage.getItem(getFirHistoryKey(userId));
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      window.localStorage.removeItem(getFirHistoryKey(userId));
      return [];
    }

    const cutoff = Date.now() - DAILY_FIR_WINDOW_MS;
    const cleaned = parsed.filter(
      (value): value is number => typeof value === "number" && Number.isFinite(value) && value > cutoff,
    );

    if (cleaned.length !== parsed.length) {
      window.localStorage.setItem(getFirHistoryKey(userId), JSON.stringify(cleaned));
    }

    return cleaned;
  } catch {
    window.localStorage.removeItem(getFirHistoryKey(userId));
    return [];
  }
}

export function getFirQuotaError(userId: string) {
  const recentFirHistory = readFirHistory(userId);

  if (recentFirHistory.length >= DAILY_FIR_LIMIT) {
    return DAILY_FIR_QUOTA_MESSAGE;
  }

  return null;
}

export function stampFirQuota(userId: string) {
  if (typeof window === "undefined") {
    return;
  }

  const recentFirHistory = readFirHistory(userId);
  recentFirHistory.push(Date.now());
  window.localStorage.setItem(getFirHistoryKey(userId), JSON.stringify(recentFirHistory));
}
