import type { CaseStatus, ThreatLevel } from "@/types";

export function StatusBadge({ status }: { status: CaseStatus }) {
  const styles =
    status === "Found / Case Closed"
      ? "border-[#5f8c69]/45 bg-[#173126] text-[#bfe0c3]"
      : status === "Under Investigation"
        ? "border-[#f5d55b]/45 bg-[#2f2914] text-[#f7e39c]"
        : "border-[#c84333]/45 bg-[#351815] text-[#ffb9aa]";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${styles}`}
    >
      {status}
    </span>
  );
}

export function ThreatBadge({ level }: { level: ThreatLevel }) {
  const styles =
    level === "High"
      ? "border-[#c84333]/55 bg-[#371817] text-[#ffb8ae]"
      : level === "Medium"
        ? "border-[#f5d55b]/45 bg-[#2f2914] text-[#f7e39c]"
        : "border-[#5f8c69]/45 bg-[#173126] text-[#bfe0c3]";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${styles}`}
    >
      Threat {level}
    </span>
  );
}
