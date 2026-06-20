import {
  CRIME_SCENE_RECOVERY_GUIDE,
  SEARCH_FILLER_WORDS,
  SUSPECT_POOL,
  THREAT_COPY,
  TIP_AUTHOR_FALLBACK,
} from "@/lib/constants";
import type { CaseRecord, CaseStatus, CrimeScene, StoredCaseStatus, ThreatLevel } from "@/types";

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateCaseId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
  return `CHPL-${suffix}`;
}

export function computeThreatLevel(caseRecord: Pick<CaseRecord, "crimeScene" | "reward" | "type">): ThreatLevel {
  let score = 0;

  if (
    caseRecord.crimeScene === "Temple" ||
    caseRecord.crimeScene === "Mosque" ||
    caseRecord.crimeScene === "Wedding" ||
    caseRecord.crimeScene === "House Party"
  ) {
    score += 2;
  } else if (
    caseRecord.crimeScene === "Hostel" ||
    caseRecord.crimeScene === "Friend's House"
  ) {
    score += 1;
  }

  if (caseRecord.reward === "Samosa" || caseRecord.reward === "Cutting Chai") {
    score += 1;
  }

  if (caseRecord.type === "Unknown Species" || caseRecord.type === "Crocs") {
    score += 1;
  }

  if (score >= 4) {
    return "High";
  }

  if (score >= 2) {
    return "Medium";
  }

  return "Low";
}

export function getThreatCopy(level: ThreatLevel) {
  return THREAT_COPY[level];
}

export function toDbThreatLevel(level: ThreatLevel) {
  return level.toLowerCase();
}

export function fromDbThreatLevel(value: unknown): ThreatLevel {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "high") {
    return "High";
  }

  if (normalized === "medium") {
    return "Medium";
  }

  return "Low";
}

export function fromDbStatus(value: unknown): StoredCaseStatus {
  return String(value ?? "").toLowerCase() === "found" ? "found" : "missing";
}

export function deriveLiveStatus(status: StoredCaseStatus, tipCount: number): CaseStatus {
  if (status === "found") {
    return "Found / Case Closed";
  }

  if (tipCount > 0) {
    return "Under Investigation";
  }

  return "Missing";
}

export function getPrimarySuspects(caseId: string) {
  const suspects: string[] = [];
  const startIndex = hashString(caseId) % SUSPECT_POOL.length;

  for (let offset = 0; offset < 4; offset += 1) {
    suspects.push(SUSPECT_POOL[(startIndex + offset) % SUSPECT_POOL.length]);
  }

  return suspects;
}

export function getRecoveryAdvice(crimeScene: CrimeScene) {
  return CRIME_SCENE_RECOVERY_GUIDE[crimeScene];
}

export function getTipAttributionLabel(alias: string, instagramHandle: string) {
  const normalizedAlias = alias.trim();
  const normalizedHandle = instagramHandle.replace(/^@+/, "").trim();

  if (normalizedAlias && normalizedHandle) {
    return `Tip by: ${normalizedAlias} (@${normalizedHandle})`;
  }

  if (normalizedAlias) {
    return `Tip by: ${normalizedAlias}`;
  }

  if (normalizedHandle) {
    return `Tip by: @${normalizedHandle}`;
  }

  return `Tip by: ${TIP_AUTHOR_FALLBACK}`;
}

export function formatTimeAgo(timestamp: number) {
  const diff = Date.now() - timestamp;
  const minutes = Math.round(diff / 60000);

  if (minutes < 1) {
    return "just filed";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function getDisplayHandle(handle: string) {
  if (!handle) {
    return "";
  }

  return `@${handle.replace(/^@+/, "")}`;
}

export function normalizeInstagramHandle(handle: string) {
  return handle.replace(/^@+/, "").trim();
}

export function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((token) => token && !SEARCH_FILLER_WORDS.includes(token))
    .join(" ");
}

function normalizeCaseCode(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function scoreSearchField(fieldValue: string, normalizedQuery: string) {
  const normalizedField = normalizeSearchText(fieldValue);
  if (!normalizedField || !normalizedQuery) {
    return 0;
  }

  if (normalizedField === normalizedQuery) {
    return 160;
  }

  if (normalizedField.startsWith(normalizedQuery)) {
    return 130;
  }

  if (normalizedField.includes(normalizedQuery)) {
    return 100;
  }

  const queryTokens = normalizedQuery.split(" ").filter(Boolean);
  const fieldTokens = normalizedField.split(" ").filter(Boolean);
  const allTokensMatch = queryTokens.every((queryToken) =>
    fieldTokens.some((fieldToken) => fieldToken.includes(queryToken)),
  );

  return allTokensMatch ? 85 : 0;
}

export function getCaseSearchScore(caseRecord: CaseRecord, rawQuery: string) {
  const normalizedQuery = normalizeSearchText(rawQuery);
  if (!normalizedQuery) {
    return 0;
  }

  const normalizedCodeQuery = normalizeCaseCode(rawQuery);
  const normalizedCaseCode = normalizeCaseCode(caseRecord.caseId);
  const queryLooksLikeCaseCode = normalizedCodeQuery.includes("chpl");

  if (queryLooksLikeCaseCode) {
    if (normalizedCaseCode === normalizedCodeQuery) {
      return 2000;
    }

    if (normalizedCaseCode.includes(normalizedCodeQuery)) {
      return 1500;
    }
  }

  return Math.max(
    scoreSearchField(caseRecord.caseId, normalizedQuery),
    scoreSearchField(caseRecord.area, normalizedQuery),
    scoreSearchField(caseRecord.nickname, normalizedQuery),
    scoreSearchField(caseRecord.type, normalizedQuery),
    scoreSearchField(caseRecord.lastSeenClue, normalizedQuery),
  );
}

export function pickChappalPalette(color: string) {
  const lowered = color.trim().toLowerCase();
  return (
    Object.entries({
      black: { primary: "#151515", secondary: "#2d2d2d", accent: "#f5d55b" },
      blue: { primary: "#23438a", secondary: "#365cae", accent: "#f6f0d8" },
      brown: { primary: "#6b4423", secondary: "#91613a", accent: "#f8d37a" },
      green: { primary: "#284c3c", secondary: "#477b5f", accent: "#f0f3d8" },
      grey: { primary: "#4d5358", secondary: "#7b838a", accent: "#f7f2e6" },
      maroon: { primary: "#651c28", secondary: "#8b3040", accent: "#f3dfba" },
      mint: { primary: "#275f54", secondary: "#4c9d8e", accent: "#eff8d8" },
      mustard: { primary: "#775208", secondary: "#af7a11", accent: "#fff1ba" },
      navy: { primary: "#17243d", secondary: "#304569", accent: "#ede4be" },
      orange: { primary: "#934418", secondary: "#ce6b2c", accent: "#fff0d3" },
      pink: { primary: "#8d3e64", secondary: "#cb6d97", accent: "#fcedd5" },
      red: { primary: "#802526", secondary: "#bb4345", accent: "#ffe6cc" },
      white: { primary: "#e7dcc3", secondary: "#fff8e8", accent: "#6a130f" },
      yellow: { primary: "#a17a0c", secondary: "#dbb52d", accent: "#1d1610" },
    }).find(([key]) => lowered.includes(key))?.[1] ?? {
      primary: "#2b2a2a",
      secondary: "#494949",
      accent: "#f5d55b",
    }
  );
}

export function formatCrimeSceneLabel(scene: CrimeScene) {
  if (scene === "Friend's House") {
    return "Friend's House";
  }

  return scene;
}
