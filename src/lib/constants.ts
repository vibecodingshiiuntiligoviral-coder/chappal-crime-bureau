import type {
  CaseStatus,
  ChappalType,
  CrimeScene,
  ReportReason,
  ThreatLevel,
  TipPresetKey,
} from "@/types";

export const CHAPPAL_TYPES: ChappalType[] = [
  "Hawai Chappal",
  "Bathroom Slipper",
  "Crocs",
  "Sandal",
  "Sports Shoes",
  "School Shoes",
  "Unknown Species",
];

export const CRIME_SCENES: CrimeScene[] = [
  "Temple",
  "Mosque",
  "Wedding",
  "Hostel",
  "Tuition",
  "Friend's House",
  "House Party",
  "Other",
];

export const STATUS_OPTIONS: CaseStatus[] = [
  "Missing",
  "Under Investigation",
  "Found",
];

export const COLOR_SUGGESTIONS = [
  "Black",
  "Blue",
  "Brown",
  "Green",
  "Grey",
  "Maroon",
  "Mint",
  "Mustard",
  "Navy",
  "Orange",
  "Pink",
  "Red",
  "White",
  "Yellow",
];

export const REWARD_OPTIONS = [
  "Cutting Chai",
  "Samosa",
  "₹20 Emotional Support",
  "Respect",
  "No Reward Only Pain",
];

export const TIP_PRESETS: Array<{
  key: TipPresetKey;
  label: string;
  message: string;
}> = [
  {
    key: "saw-nearby",
    label: "Saw similar chappal nearby",
    message: "Saw similar chappal nearby.",
  },
  {
    key: "check-rack",
    label: "Check under the rack",
    message: "Check under the rack.",
  },
  {
    key: "uncle-involvement",
    label: "Possible uncle involvement",
    message: "Possible uncle involvement.",
  },
  {
    key: "friend-prank",
    label: "Friend prank suspected",
    message: "Friend prank suspected.",
  },
  {
    key: "emotionally-moved-on",
    label: "This chappal has emotionally moved on",
    message: "This chappal has emotionally moved on.",
  },
];

export const REPORT_REASONS: Array<{
  key: ReportReason;
  label: string;
  description: string;
}> = [
  {
    key: "real-info",
    label: "Contains real private info",
    description: "Use this when someone posted a number, exact address, or other sensitive detail.",
  },
  {
    key: "real-person",
    label: "Names a real person",
    description: "Use this when the FIR or tip targets an actual person by name.",
  },
  {
    key: "harassment",
    label: "Threatening or hostile",
    description: "Use this when the joke crosses into threats or abuse.",
  },
  {
    key: "spam",
    label: "Spam or nonsense",
    description: "Use this when the case is obvious junk, duplicate, or low-effort spam.",
  },
];

export const THREAT_COPY: Record<ThreatLevel, string> = {
  Low: "Low panic. This looks like a classic moment of negligence.",
  Medium: "Medium chaos. The footwear situation has witnesses and confusion.",
  High: "High alert. Crowd density and snack economics suggest serious slipper instability.",
};

export const CRIME_SCENE_RECOVERY_GUIDE: Record<CrimeScene, string> = {
  Temple:
    "Check the outer rack first, then the suspiciously expensive pair sitting alone. Temple exits breed accidental upgrades.",
  Mosque:
    "Start near the entry flow and scan for swapped pairs. Calm exits create very confident wrong-foot choices.",
  Wedding:
    "Inspect the pile near the photo corner. Weddings produce glitter, panic, and deeply unserious footwear discipline.",
  Hostel:
    "Check corridor corners, borrowed bathroom runs, and every room that says 'I only took it for two minutes'.",
  Tuition:
    "Look near the door and any desk row where everyone left in a hurry because class ended late.",
  "Friend's House":
    "Search the balcony, the snack zone, and the place where someone said 'leave it there, it is safe'.",
  "House Party":
    "Look under sofas and near the speaker. House parties encourage optimistic shoe placement and poor memory.",
  Other:
    "Start with the nearest rack, the nearest liar, and the nearest person wearing an expression that looks too relaxed.",
};

export const SUSPECT_POOL = [
  "Same-size uncle",
  "Random kid",
  "Footwear exchange mafia",
  "Friend who said 'wait here'",
  "The person with suspicious confidence",
  "Someone who upgraded by mistake",
  "The chappal rack shadow council",
  "A person who said 'all black slippers look same'",
];

export const CHAPPAL_SWATCHES: Record<
  string,
  { primary: string; secondary: string; accent: string }
> = {
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
};
