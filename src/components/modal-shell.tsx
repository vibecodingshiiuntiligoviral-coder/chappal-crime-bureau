"use client";

import { useEffect, type ReactNode } from "react";

interface ModalShellProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

export function ModalShell({
  open,
  title,
  description,
  onClose,
  children,
}: ModalShellProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/72 px-3 py-4 backdrop-blur-[1px] md:items-center"
      onMouseDown={onClose}
    >
      <div
        className="bureau-card flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden p-5 md:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex flex-shrink-0 items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#f5d55b]">
              Action Desk
            </p>
            <h2 className="mt-2 font-display text-3xl uppercase leading-none text-[#f8f0dc]">
              {title}
            </h2>
            {description ? (
              <p className="mt-2 max-w-lg text-sm leading-6 text-[#d7d0c5]">
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-[12px] border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f8f0dc] transition hover:border-[#f5d55b]/60 hover:text-[#f5d55b]"
          >
            Close
          </button>
        </div>

        <div className="warning-divider my-5 flex-shrink-0" />
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  );
}
