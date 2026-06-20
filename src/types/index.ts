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

export type StoredCaseStatus = "missing" | "found";
export type CaseStatus = "Missing" | "Found / Case Closed" | "Under Investigation";
export type ThreatLevel = "Low" | "Medium" | "High";
export type ImageStatus = "none" | "active" | "removed" | string;
export type ReportTargetType = "case" | "tip";

export type TipType =
  | "sighting"
  | "rack-check"
  | "uncle-suspected"
  | "friend-prank"
  | "emotionally-moved-on"
  | "hostage-roleplay"
  | "custom";

export type TipPresetType = Exclude<TipType, "hostage-roleplay" | "custom">;

export type ReportReason =
  | "phone-number"
  | "real-person-accusation"
  | "abuse"
  | "exact-address"
  | "spam"
  | "adult-content"
  | "wrong-image"
  | "face-person-shown"
  | "other";

export interface CaseFormValues {
  nickname: string;
  type: ChappalType;
  color: string;
  area: string;
  crimeScene: CrimeScene;
  lastSeenClue: string;
  reward: string;
  instagramHandle: string;
  primarySuspect: string;
}

export interface CaseRecord extends CaseFormValues {
  id: string;
  caseId: string;
  ownerId: string;
  status: StoredCaseStatus;
  threatLevel: ThreatLevel;
  tipCount: number;
  imagePath: string | null;
  imageStatus: ImageStatus;
  imageUrl: string | null;
  sceneImagePath: string | null;
  sceneImageStatus: ImageStatus;
  sceneImageUrl: string | null;
  closureWhoTookIt: string;
  closureFoundLocation: string;
  closureTipsHelped: boolean;
  closureHelpfulTipId: string | null;
  closureRewardDelivered: boolean | null;
  closureSummary: string;
  closedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface TipRecord {
  id: string;
  caseId: string;
  authorId: string;
  type: TipType;
  message: string;
  authorAlias: string;
  authorInstagram: string;
  attributionLabel: string;
  createdAt: number;
}

export interface TipAttributionInput {
  alias: string;
  instagramHandle: string;
}

export interface CaseClosureFormValues {
  whoTookIt: string;
  foundLocation: string;
  tipsHelped: "yes" | "no";
  helpfulTipId: string;
  rewardDelivered: "yes" | "no" | "skip";
  summary: string;
}

export interface CaseClosurePayload {
  whoTookIt: string | null;
  foundLocation: string;
  tipsHelped: boolean;
  helpfulTipId: string | null;
  rewardDelivered: boolean | null;
  summary: string | null;
}

export interface ReportPayload {
  reason: ReportReason;
  note: string;
  targetType: ReportTargetType;
  caseId: string;
  tipId?: string | null;
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
  primarySuspect?: string;
  image?: string;
  sceneImage?: string;
  form?: string;
}

export interface ClosureFieldErrors {
  whoTookIt?: string;
  foundLocation?: string;
  helpfulTipId?: string;
  summary?: string;
  form?: string;
}

export interface PreviewCaseCard extends CaseRecord {
  liveStatus: CaseStatus;
}

export interface PreparedCaseImage {
  blob: Blob;
  previewUrl: string;
}
