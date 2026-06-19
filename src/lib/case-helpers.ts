import { CRIME_SCENE_RECOVERY_GUIDE, SUSPECT_POOL, THREAT_COPY } from "@/lib/constants";
import type { CaseRecord, CaseStatus, CrimeScene, ThreatLevel } from "@/types";

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

export function deriveLiveStatus(status: CaseStatus, tipCount: number): CaseStatus {
  if (status === "Found") {
    return "Found";
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

export function buildRoleplayNote(caseRecord: CaseRecord) {
  const signaturePool = ["Sole Mafia", "National Footwear Cell", "Rack Syndicate", "Left Pair Union"];
  const signature = signaturePool[hashString(caseRecord.caseId) % signaturePool.length];
  const side = hashString(caseRecord.nickname) % 2 === 0 ? "left" : "right";
  const snackDemand =
    caseRecord.reward === "No Reward Only Pain" || caseRecord.reward === "Respect"
      ? "2 samosas"
      : caseRecord.reward;

  return `We have your ${side} chappal. It is safe. Send ${snackDemand} and stop abandoning footwear in high-risk zones. - ${signature}`;
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
