"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { ChappalAvatar } from "@/components/chappal-avatar";
import { useFirebaseSession } from "@/components/providers/firebase-session-provider";
import {
  CHAPPAL_TYPES,
  COLOR_SUGGESTIONS,
  CRIME_SCENES,
  REWARD_OPTIONS,
} from "@/lib/constants";
import { computeThreatLevel, generateCaseId, getDisplayHandle } from "@/lib/case-helpers";
import { createCaseRecord } from "@/lib/firestore";
import { validateCaseInput } from "@/lib/validation";
import type { CaseFieldErrors, CaseFormValues } from "@/types";

const inputBaseClass = "bureau-input";
const selectBaseClass = "bureau-select";

const INITIAL_VALUES: CaseFormValues = {
  nickname: "",
  type: "Hawai Chappal",
  color: "",
  area: "",
  crimeScene: "Temple",
  lastSeenClue: "",
  reward: "Cutting Chai",
  instagramHandle: "",
};

export function FileFirScreen() {
  const router = useRouter();
  const session = useFirebaseSession();
  const [values, setValues] = useState<CaseFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<CaseFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewThreat = computeThreatLevel({
    crimeScene: values.crimeScene,
    reward: values.reward,
    type: values.type,
  });

  function updateValue<Key extends keyof CaseFormValues>(field: Key, value: CaseFormValues[Key]) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (session.status !== "ready" || !session.uid) {
      setErrors({
        form: "Anonymous auth is not ready yet. Wait a moment, then file again.",
      });
      return;
    }

    const validation = validateCaseInput(values);
    setErrors(validation.errors);

    if (!validation.isValid) {
      return;
    }

    setIsSubmitting(true);
    const caseId = generateCaseId();

    try {
      await createCaseRecord(validation.normalized, caseId, session.uid);
      startTransition(() => {
        router.push(`/cases/${caseId}`);
      });
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : "Could not register the FIR.",
      });
      setIsSubmitting(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="bureau-card p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f5d55b]">
          Footwear FIR Desk
        </p>
        <h1 className="mt-4 font-display text-5xl uppercase leading-none text-[#f8f0dc] sm:text-6xl">
          File Footwear FIR
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#d7d0c5] sm:text-base">
          This is a public meme lost-and-found. No phone numbers, no exact addresses, no real accusations, and definitely no actual police powers.
        </p>

        <div className="warning-divider my-5" />

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="bureau-label">Chappal nickname</span>
              <input
                value={values.nickname}
                onChange={(event) => updateValue("nickname", event.target.value)}
                maxLength={40}
                placeholder="Lefty Legend"
                className={inputBaseClass}
              />
              {errors.nickname ? <p className="bureau-error">{errors.nickname}</p> : null}
            </label>

            <label className="grid gap-2">
              <span className="bureau-label">Chappal type</span>
              <select
                value={values.type}
                onChange={(event) => updateValue("type", event.target.value as CaseFormValues["type"])}
                className={selectBaseClass}
              >
                {CHAPPAL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.type ? <p className="bureau-error">{errors.type}</p> : null}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="bureau-label">Color</span>
              <input
                value={values.color}
                onChange={(event) => updateValue("color", event.target.value)}
                maxLength={40}
                list="color-suggestions"
                placeholder="Black with questionable confidence"
                className={inputBaseClass}
              />
              <datalist id="color-suggestions">
                {COLOR_SUGGESTIONS.map((color) => (
                  <option key={color} value={color} />
                ))}
              </datalist>
              {errors.color ? <p className="bureau-error">{errors.color}</p> : null}
            </label>

            <label className="grid gap-2">
              <span className="bureau-label">Area</span>
              <input
                value={values.area}
                onChange={(event) => updateValue("area", event.target.value)}
                maxLength={40}
                placeholder="North Campus"
                className={inputBaseClass}
              />
              {errors.area ? <p className="bureau-error">{errors.area}</p> : null}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="bureau-label">Crime scene</span>
              <select
                value={values.crimeScene}
                onChange={(event) =>
                  updateValue("crimeScene", event.target.value as CaseFormValues["crimeScene"])
                }
                className={selectBaseClass}
              >
                {CRIME_SCENES.map((scene) => (
                  <option key={scene} value={scene}>
                    {scene}
                  </option>
                ))}
              </select>
              {errors.crimeScene ? <p className="bureau-error">{errors.crimeScene}</p> : null}
            </label>

            <label className="grid gap-2">
              <span className="bureau-label">Reward</span>
              <input
                value={values.reward}
                onChange={(event) => updateValue("reward", event.target.value)}
                maxLength={40}
                list="reward-suggestions"
                placeholder="Samosa"
                className={inputBaseClass}
              />
              <datalist id="reward-suggestions">
                {REWARD_OPTIONS.map((reward) => (
                  <option key={reward} value={reward} />
                ))}
              </datalist>
              {errors.reward ? <p className="bureau-error">{errors.reward}</p> : null}
            </label>
          </div>

          <label className="grid gap-2">
            <span className="bureau-label">Last seen clue</span>
            <textarea
              value={values.lastSeenClue}
              onChange={(event) => updateValue("lastSeenClue", event.target.value)}
              maxLength={100}
              rows={4}
              placeholder="Outside the rack near the snack counter. Everyone looked suspicious."
              className="bureau-input min-h-[120px]"
            />
            {errors.lastSeenClue ? <p className="bureau-error">{errors.lastSeenClue}</p> : null}
          </label>

          <label className="grid gap-2">
            <span className="bureau-label">Optional public Instagram handle</span>
            <input
              value={values.instagramHandle}
              onChange={(event) => updateValue("instagramHandle", event.target.value)}
              maxLength={30}
              placeholder="sole_survivor_99"
              className={inputBaseClass}
            />
            <p className="text-xs leading-5 text-[#b7b0a5]">
              Username only. No phone numbers. This stays public on the poster.
            </p>
            {errors.instagramHandle ? <p className="bureau-error">{errors.instagramHandle}</p> : null}
          </label>

          {errors.form ? (
            <p className="rounded-[16px] border border-[#c84333]/45 bg-[#351815] px-4 py-3 text-sm text-[#ffcab7]">
              {errors.form}
            </p>
          ) : null}

          <button type="submit" disabled={isSubmitting} className="primary-button w-full justify-center">
            {isSubmitting ? "Registering FIR..." : "Register FIR"}
          </button>
        </form>
      </div>

      <aside className="grid gap-4">
        <div className="bureau-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d55b]">
            Case Preview
          </p>
          <div className="mt-4 flex items-start gap-4">
            <ChappalAvatar color={values.color || "black"} nickname={values.nickname || "CC"} type={values.type} />
            <div>
              <h2 className="font-display text-3xl uppercase text-[#f8f0dc]">
                {values.nickname || "Unnamed Chappal"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#d7d0c5]">
                {values.type} / {values.color || "Color pending"} / {values.area || "Area pending"}
              </p>
              <p className="mt-2 rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f5d55b]">
                Threat level {previewThreat}
              </p>
            </div>
          </div>

          <div className="warning-divider my-5" />

          <dl className="grid gap-3 text-sm">
            <div className="bureau-field">
              <dt>Crime Scene</dt>
              <dd>{values.crimeScene}</dd>
            </div>
            <div className="bureau-field">
              <dt>Reward</dt>
              <dd>{values.reward || "Pending reward"}</dd>
            </div>
            <div className="bureau-field">
              <dt>Poster handle</dt>
              <dd>{values.instagramHandle ? getDisplayHandle(values.instagramHandle) : "No public handle"}</dd>
            </div>
            <div className="bureau-field">
              <dt>Last clue</dt>
              <dd>{values.lastSeenClue || "No clue yet"}</dd>
            </div>
          </dl>
        </div>

        <div className="bureau-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d55b]">
            Filing Rules
          </p>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-[#d7d0c5]">
            <li>Keep the location broad. Area, not street-level detail.</li>
            <li>Do not post phone numbers or accuse real people by name.</li>
            <li>Tips are public and playful, not private chat.</li>
            <li>The app does not do real police work, GPS tracking, or payments.</li>
          </ul>
        </div>
      </aside>
    </section>
  );
}
