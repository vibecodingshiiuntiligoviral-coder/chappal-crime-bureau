export type ChappalType =
  | "Hawai Chappal"
  | "Bathroom Slipper"
  | "Crocs"
  | "Sandal"
  | "Sports Shoes"
  | "School Shoes"
  | "Unknown Species";

export type CrimeScene =
  | "Temple"
  | "Mosque"
  | "Wedding"
  | "Hostel"
  | "Tuition"
  | "Friend's House"
  | "House Party"
  | "Other";

export type StoredCaseStatus = "Missing" | "Found";
export type CaseStatus = StoredCaseStatus | "Under Investigation";
export type ThreatLevel = "Low" | "Medium" | "High";

export type TipPresetKey =
  | "saw-nearby"
  | "check-rack"
  | "uncle-involvement"
  | "friend-prank"
  | "emotionally-moved-on";

export type ReportReason =
  | "real-info"
  | "real-person"
  | "harassment"
  | "spam";

export interface CaseFormValues {
  nickname: string;
  type: ChappalType;
  color: string;
  area: string;
  crimeScene: CrimeScene;
  lastSeenClue: string;
  reward: string;
  instagramHandle: string;
}

export interface CaseRecord extends CaseFormValues {
  caseId: string;
  createdAt: number;
  updatedAt: number;
  createdByUid: string;
  status: StoredCaseStatus;
}

export interface TipRecord {
  id: string;
  caseId: string;
  kind: "preset" | "custom";
  presetKey: string;
  message: string;
  createdAt: number;
  createdByUid: string;
}

export interface ReportPayload {
  reason: ReportReason;
  note: string;
}

export interface SessionState {
  status: "loading" | "ready" | "disabled" | "error";
  uid: string | null;
  errorMessage?: string;
}

export interface CaseFieldErrors {
  nickname?: string;
  type?: string;
  color?: string;
  area?: string;
  crimeScene?: string;
  lastSeenClue?: string;
  reward?: string;
  instagramHandle?: string;
  form?: string;
}

export interface PreviewCaseCard extends CaseRecord {
  tipCount: number;
  liveStatus: CaseStatus;
  threatLevel: ThreatLevel;
}
