"use client";

import { useState } from "react";

import { pickChappalPalette } from "@/lib/case-helpers";

interface ChappalAvatarProps {
  color: string;
  nickname: string;
  type: string;
  imageUrl?: string | null;
}

export function ChappalAvatar({
  color,
  nickname,
  type,
  imageUrl = null,
}: ChappalAvatarProps) {
  const palette = pickChappalPalette(color);
  const monogram = nickname.slice(0, 2).toUpperCase();
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const showImage = Boolean(imageUrl && failedImageUrl !== imageUrl);

  return (
    <div className="relative h-[8.5rem] w-28 shrink-0 overflow-hidden rounded-[14px] border border-[#e6bf47]/16 bg-[#120f0d] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      {showImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl ?? ""}
            alt={`${nickname} case image`}
            className="absolute inset-[7px] h-[calc(100%-14px)] w-[calc(100%-14px)] rounded-[10px] object-cover"
            loading="lazy"
            onError={() => setFailedImageUrl(imageUrl ?? "")}
          />
        </>
      ) : (
        <>
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
        </>
      )}
      <div className="absolute inset-x-0 bottom-2 flex flex-col items-center gap-1 px-2">
        <span className="rounded-[8px] border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f8f0dc]">
          {monogram || "CC"}
        </span>
        <span className="max-w-[80%] truncate text-[10px] uppercase tracking-[0.16em] text-[#b7b0a5]">
          {type}
        </span>
      </div>
    </div>
  );
}
