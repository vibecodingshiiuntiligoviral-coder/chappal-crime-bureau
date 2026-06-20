"use client";

import { useSyncExternalStore } from "react";

const PLACEHOLDER_SEED_KEY = "ccb-placeholder-seed";

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function getSessionPlaceholderSeed() {
  if (typeof window === "undefined") {
    return "server-seed";
  }

  const existingSeed = window.sessionStorage.getItem(PLACEHOLDER_SEED_KEY);
  if (existingSeed) {
    return existingSeed;
  }

  const nextSeed =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  window.sessionStorage.setItem(PLACEHOLDER_SEED_KEY, nextSeed);
  return nextSeed;
}

export function pickStablePlaceholder(fieldKey: string, options: string[]) {
  if (!options.length) {
    return "";
  }

  const sessionSeed = getSessionPlaceholderSeed();
  const index = hashString(`${sessionSeed}:${fieldKey}`) % options.length;
  return options[index] ?? options[0] ?? "";
}

export function useStablePlaceholder(fieldKey: string, options: string[]) {
  const subscribe = () => () => undefined;
  const getServerSnapshot = () => options[0] ?? "";
  const getClientSnapshot = () => pickStablePlaceholder(fieldKey, options);

  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
