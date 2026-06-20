"use client";

import { useEffect, useMemo, useState } from "react";

import { DEPARTMENT_CIRCULARS } from "@/lib/constants";

const NOTICE_WINDOW = 4;
const ROTATION_INTERVAL_MS = 11_000;
const FADE_DURATION_MS = 240;

function getVisibleCirculars(startIndex: number) {
  return Array.from({ length: NOTICE_WINDOW }, (_, offset) => {
    const index = (startIndex + offset) % DEPARTMENT_CIRCULARS.length;
    return DEPARTMENT_CIRCULARS[index];
  });
}

export function DepartmentCirculars() {
  const [startIndex, setStartIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let timeoutId: number | null = null;
    const interval = window.setInterval(() => {
      setIsVisible(false);

      timeoutId = window.setTimeout(() => {
        setStartIndex((current) => (current + NOTICE_WINDOW) % DEPARTMENT_CIRCULARS.length);
        setIsVisible(true);
      }, FADE_DURATION_MS);
    }, ROTATION_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  const visibleCirculars = useMemo(() => getVisibleCirculars(startIndex), [startIndex]);

  return (
    <div
      className={`grid gap-3 text-sm leading-6 text-[#d7d0c5] transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {visibleCirculars.map((notice, index) => (
        <div key={`${startIndex}-${notice}`} className="bureau-circular">
          <span className="bureau-circular-index">Circular {String(startIndex + index + 1).padStart(2, "0")}</span>
          <p className="mt-2">{notice}</p>
        </div>
      ))}
    </div>
  );
}
