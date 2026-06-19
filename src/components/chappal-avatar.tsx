import { pickChappalPalette } from "@/lib/case-helpers";

interface ChappalAvatarProps {
  color: string;
  nickname: string;
  type: string;
}

export function ChappalAvatar({ color, nickname, type }: ChappalAvatarProps) {
  const palette = pickChappalPalette(color);
  const monogram = nickname.slice(0, 2).toUpperCase();

  return (
    <div className="relative h-28 w-24 shrink-0 rounded-[26px] border border-white/10 bg-[#120f0d] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div
        className="absolute left-4 top-5 h-16 w-7 rounded-[999px] border border-black/30"
        style={{
          background: `linear-gradient(180deg, ${palette.secondary}, ${palette.primary})`,
          transform: "rotate(-12deg)",
        }}
      />
      <div
        className="absolute right-4 top-7 h-16 w-7 rounded-[999px] border border-black/30"
        style={{
          background: `linear-gradient(180deg, ${palette.secondary}, ${palette.primary})`,
          transform: "rotate(12deg)",
        }}
      />
      <div
        className="absolute left-3 top-7 h-1.5 w-12 rounded-full"
        style={{ backgroundColor: palette.accent, transform: "rotate(-12deg)" }}
      />
      <div
        className="absolute right-3 top-9 h-1.5 w-12 rounded-full"
        style={{ backgroundColor: palette.accent, transform: "rotate(12deg)" }}
      />
      <div className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-1">
        <span className="rounded-full bg-black/35 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f8f0dc]">
          {monogram || "CC"}
        </span>
        <span className="max-w-[80%] truncate text-[10px] uppercase tracking-[0.16em] text-[#b7b0a5]">
          {type}
        </span>
      </div>
    </div>
  );
}
