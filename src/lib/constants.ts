import type {
  CaseStatus,
  ChappalType,
  CrimeScene,
  ReportReason,
  ThreatLevel,
  TipPresetType,
  TipType,
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
  "Found / Case Closed",
];

export const COLOR_OPTIONS = [
  { value: "", label: "Select color clue" },
  { value: "Blue", label: "Neela (Blue)" },
  { value: "Red", label: "Mirchi Laal (Red)" },
  { value: "Yellow", label: "Haldi Peela (Yellow)" },
  { value: "Black", label: "Kaala Dhan Black (Black)" },
  { value: "Orange", label: "Cosmic Orange (Orange)" },
  { value: "White", label: "Safed Sarkari (White)" },
  { value: "Grey", label: "Slipper Grey (Grey)" },
  { value: "Gold", label: "Mehenga Golden (Gold)" },
  { value: "Brown", label: "Dusty Brown (Brown)" },
  { value: "Green", label: "Neem Green (Green)" },
  { value: "Maroon", label: "Shaadi Maroon (Maroon)" },
  { value: "Mint", label: "Minty Recovery (Mint)" },
  { value: "Mustard", label: "Mustard Mayhem (Mustard)" },
  { value: "Navy", label: "Navy Notice (Navy)" },
  { value: "Pink", label: "Dignified Pink (Pink)" },
  { value: "Mystery Color", label: "Mystery Color" },
] as const;

export const REWARD_OPTIONS = [
  "Cutting Chai",
  "Samosa",
  "Rs 20 Emotional Support",
  "Respect",
  "No Reward Only Pain",
];

export const NICKNAME_PLACEHOLDERS = [
  "Penaldo",
  "Lefty Legend",
  "Bathroom Survivor",
  "Chappal No. 7",
];

export const AREA_PLACEHOLDERS = [
  "my bathroom",
  "hostel corridor",
  "mandir rack left side",
  "model society gate",
];

export const LAST_SEEN_PLACEHOLDERS = [
  "bas yahin rakha tha, phir society ne dhoka de diya",
  "seen near hostel corridor, then emotionally unavailable",
  "kept beside expensive shoes, rookie mistake",
  "aarti ke time uncle traffic high tha",
];

export const REWARD_PLACEHOLDERS = [
  "Cutting chai",
  "one samosa and public respect",
  "Maggi + blessings",
  "Rs 0 but emotional closure",
];

export const PRIMARY_SUSPECT_PLACEHOLDERS = [
  "nobody, but vibes illegal thi",
  "same-size uncle",
  "friend who said 'main dekh raha hu'",
  "person wearing suspiciously similar footwear",
];

export const BUREAU_TICKER_BULLETINS = [
  "PUBLIC ALERT: Jo banda '2 minute mein aata hu' bolta hai, uske paas apni chappal mat chhodna.",
  "BUREAU BULLETIN: Left chappal recovered. Right chappal ne independent life choose kar li.",
  "HIGH RISK ZONE: Temple rack ke paas uncle activity suspicious level par.",
  "NOTICE: Chai reward emotionally binding hai, legally nahi.",
  "BREAKING: Hostel corridor mein footwear migration fir se shuru.",
  "JANHIT MEIN JAARI: Same-size chappal wale logon se satark rahein.",
  "URGENT: Bathroom slippers ko public area mein akela na chhodein.",
  "BUREAU UPDATE: Crocs recovery requires written shame certificate.",
  "CAUTION: Wedding exit par pair-swapper gang active ho sakti hai.",
  "NATIONAL CONCERN: Ek aur chappal 'bas yahin rakha tha' zone se gayab.",
  "PUBLIC NOTICE: Chappal hostage claims are roleplay only. Do not ask for real money.",
  "RECORD DESK: Bureau staff currently processing panic in approximate order received.",
];

export const DEPARTMENT_CIRCULARS = [
  "Jisne chappal ulta pehna hai, uski investigation priority low rahegi.",
  "Duplicate Hawai chappal disputes mein DNA test available nahi hai.",
  "Jo log rack ke side mein chappal rakhte hain, woh apni kismat khud likhte hain.",
  "Free prasad rush ke dauraan footwear protection weak ho sakti hai.",
  "Bathroom chappal ko emotional support footwear maana jayega.",
  "Same-size uncle remains person of interest.",
  "Agar chappal mehengi thi, toh rack pe kyun chhodi?",
  "Lost Crocs cases may be transferred to Fashion Crimes Division.",
  "Reward in biscuit/chai is emotionally binding only.",
  "Hostel corridor footwear disputes may take 3-5 business overreactions.",
  "Mandir rack zone mein confidence se rakhi chappal bhi safe nahi hoti.",
  "Jo banda 'bas 2 minute' bolta hai, usko evidence ke paas mat chhodo.",
  "Public filing desk accepts panic, confusion, and loosely verified eyewitness energy.",
  "Pair-swap victims are advised to remain dramatic but legally calm.",
];

export const TIP_MESSAGE_MAX_LENGTH = 300;
export const AUTHOR_ALIAS_MAX_LENGTH = 40;
export const PRIMARY_SUSPECT_MAX_LENGTH = 80;
export const CLOSURE_SUMMARY_MAX_LENGTH = 300;
export const CASE_CLOSED_MESSAGE = "CASE CLOSED. NO NEW TIPS ACCEPTED.";
export const HOSTAGE_SAFETY_COPY =
  "Roleplay only. Do not claim real theft, threaten, or ask for real money.";
export const TIP_AUTHOR_FALLBACK = "Anonymous Informant";
export const SEARCH_FILLER_WORDS = ["my", "the", "near", "at", "outside", "inside", "in", "on"];
export const DAILY_FIR_LIMIT = 5;
export const DAILY_FIR_WINDOW_MS = 24 * 60 * 60 * 1000;
export const DAILY_FIR_QUOTA_MESSAGE =
  "Daily F.I.R quota exhausted. Bureau officers are pretending to work. Try again tomorrow.";

export const TIP_PRESETS: Array<{
  type: TipPresetType;
  label: string;
  message: string;
}> = [
  {
    type: "sighting",
    label: "Saw similar chappal nearby",
    message: "Saw similar chappal nearby.",
  },
  {
    type: "rack-check",
    label: "Check under the rack",
    message: "Check under the rack.",
  },
  {
    type: "uncle-suspected",
    label: "Possible uncle involvement",
    message: "Possible uncle involvement.",
  },
  {
    type: "friend-prank",
    label: "Friend prank suspected",
    message: "Friend prank suspected.",
  },
  {
    type: "emotionally-moved-on",
    label: "This chappal has emotionally moved on",
    message: "This chappal has emotionally moved on.",
  },
];

export const TIP_TYPE_LABELS: Record<TipType, string> = {
  sighting: "Sighting Tip",
  "rack-check": "Rack Check",
  "uncle-suspected": "Uncle Suspected",
  "friend-prank": "Friend Prank",
  "emotionally-moved-on": "Emotionally Moved On",
  "hostage-roleplay": "Hostage Claim",
  custom: "Custom Tip",
};

export const REPORT_REASONS: Array<{
  key: ReportReason;
  label: string;
  description: string;
}> = [
  {
    key: "phone-number",
    label: "Phone number shown",
    description: "Use this if someone posted a phone number or contact info.",
  },
  {
    key: "real-person-accusation",
    label: "Real person accusation",
    description: "Use this if the FIR or tip points at a real person by name.",
  },
  {
    key: "abuse",
    label: "Abusive or threatening",
    description: "Use this if the content becomes hostile instead of playful.",
  },
  {
    key: "exact-address",
    label: "Exact address shown",
    description: "Use this if someone shared a precise address or pincode-level detail.",
  },
  {
    key: "spam",
    label: "Spam or junk",
    description: "Use this for obvious nonsense, repeated posts, or low-effort spam.",
  },
  {
    key: "adult-content",
    label: "Adult content",
    description: "Use this if the text or image is sexual or clearly adult.",
  },
  {
    key: "wrong-image",
    label: "Wrong image",
    description: "Use this if the uploaded image does not match the case.",
  },
  {
    key: "face-person-shown",
    label: "Face or person shown",
    description: "Use this if the image exposes a person instead of just the footwear.",
  },
  {
    key: "other",
    label: "Other moderation issue",
    description: "Use this if the content breaks the vibe in some other way.",
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
  "Random kid with no remorse",
  "Footwear exchange mafia",
  "Friend who said 'wait here'",
  "Hostel corridor phantom",
  "Temple rack opportunist",
  "Wedding exit pair-swapper",
  "Bathroom bandit",
  "The person who arrived barefoot but left confident",
];

export const TIP_BANNED_WORDS = [
  "bitch",
  "bastard",
  "bc",
  "mc",
  "slut",
  "whore",
  "porn",
  "nude",
  "rape",
  "kill",
  "murder",
  "threaten",
  "stab",
  "shoot",
  "attack",
  "beat",
  "burn",
  "explode",
  "terrorist",
  "bomb",
];
