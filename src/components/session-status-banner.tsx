"use client";

import { useSupabaseSession } from "@/components/providers/supabase-session-provider";

export function SessionStatusBanner() {
  const session = useSupabaseSession();

  if (session.status === "ready") {
    return null;
  }

  const tone =
    session.status === "error" || session.status === "disabled"
      ? "border-[#c84333]/60 bg-[#3b1715] text-[#ffe8d0]"
      : "border-[#f5d55b]/45 bg-[#2a2418] text-[#f7efd8]";

  return (
    <div
      className={`rounded-[22px] border px-4 py-3 text-sm leading-6 shadow-[0_20px_40px_rgba(0,0,0,0.2)] ${tone}`}
    >
      <p className="font-semibold uppercase tracking-[0.22em]">
        {session.status === "loading" ? "Public filing window opening" : "Citizen desk offline"}
      </p>
      <p className="mt-1 text-sm text-inherit/90">
        {session.errorMessage ??
          "Opening the filing window. Public cases and tip entry unlock as soon as the desk is ready."}
      </p>
    </div>
  );
}
