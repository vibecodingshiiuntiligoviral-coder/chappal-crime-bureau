"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

import { ChappalAvatar } from "@/components/chappal-avatar";
import { DarkSelect } from "@/components/dark-select";
import { useSupabaseSession } from "@/components/providers/supabase-session-provider";
import {
  AREA_PLACEHOLDERS,
  CHAPPAL_TYPES,
  COLOR_OPTIONS,
  CRIME_SCENES,
  LAST_SEEN_PLACEHOLDERS,
  NICKNAME_PLACEHOLDERS,
  PRIMARY_SUSPECT_PLACEHOLDERS,
  REWARD_OPTIONS,
  REWARD_PLACEHOLDERS,
} from "@/lib/constants";
import { computeThreatLevel, generateCaseId, getDisplayHandle } from "@/lib/case-helpers";
import {
  getCooldownError,
  getFirQuotaError,
  stampCooldown,
  stampFirQuota,
} from "@/lib/cooldowns";
import { prepareCaseImage, releasePreparedImage } from "@/lib/image-upload";
import { useStablePlaceholder } from "@/lib/placeholders";
import { createCaseRecord, uploadCaseImage, uploadSceneImage } from "@/lib/supabase-data";
import { validateCaseInput } from "@/lib/validation";
import type { CaseFieldErrors, CaseFormValues, PreparedCaseImage } from "@/types";

const inputBaseClass = "bureau-input";

const INITIAL_VALUES: CaseFormValues = {
  nickname: "",
  type: "Hawai Chappal",
  color: "",
  area: "",
  crimeScene: "Temple",
  lastSeenClue: "",
  reward: "Cutting Chai",
  instagramHandle: "",
  primarySuspect: "",
};

export function FileFirScreen() {
  const router = useRouter();
  const session = useSupabaseSession();
  const [values, setValues] = useState<CaseFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<CaseFieldErrors>({});
  const [preparedImage, setPreparedImage] = useState<PreparedCaseImage | null>(null);
  const [preparedSceneImage, setPreparedSceneImage] = useState<PreparedCaseImage | null>(null);
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  const [isPreparingSceneImage, setIsPreparingSceneImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      releasePreparedImage(preparedImage);
    };
  }, [preparedImage]);

  useEffect(() => {
    return () => {
      releasePreparedImage(preparedSceneImage);
    };
  }, [preparedSceneImage]);

  const previewThreat = computeThreatLevel({
    crimeScene: values.crimeScene,
    reward: values.reward,
    type: values.type,
  });
  const nicknamePlaceholder = useStablePlaceholder("fir-nickname", NICKNAME_PLACEHOLDERS);
  const areaPlaceholder = useStablePlaceholder("fir-area", AREA_PLACEHOLDERS);
  const lastSeenPlaceholder = useStablePlaceholder("fir-last-seen", LAST_SEEN_PLACEHOLDERS);
  const rewardPlaceholder = useStablePlaceholder("fir-reward", REWARD_PLACEHOLDERS);
  const suspectPlaceholder = useStablePlaceholder("fir-primary-suspect", PRIMARY_SUSPECT_PLACEHOLDERS);

  function updateValue<Key extends keyof CaseFormValues>(field: Key, value: CaseFormValues[Key]) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handlePreparedImageChange(
    event: React.ChangeEvent<HTMLInputElement>,
    previousImage: PreparedCaseImage | null,
    setPreparedImageState: React.Dispatch<React.SetStateAction<PreparedCaseImage | null>>,
    setIsPreparingState: React.Dispatch<React.SetStateAction<boolean>>,
    errorField: "image" | "sceneImage",
  ) {
    const selectedFile = event.target.files?.[0] ?? null;

    if (!selectedFile) {
      releasePreparedImage(previousImage);
      setPreparedImageState(null);
      setErrors((current) => ({
        ...current,
        [errorField]: undefined,
      }));
      return;
    }

    setIsPreparingState(true);
    setErrors((current) => ({
      ...current,
      [errorField]: undefined,
    }));

    try {
      const nextPreparedImage = await prepareCaseImage(selectedFile);
      releasePreparedImage(previousImage);
      setPreparedImageState(nextPreparedImage);
    } catch (error) {
      releasePreparedImage(previousImage);
      setPreparedImageState(null);
      event.target.value = "";
      setErrors((current) => ({
        ...current,
        [errorField]: error instanceof Error ? error.message : "Could not prepare that image.",
      }));
    } finally {
      setIsPreparingState(false);
    }
  }

  function clearPreparedImage(
    currentImage: PreparedCaseImage | null,
    setPreparedImageState: React.Dispatch<React.SetStateAction<PreparedCaseImage | null>>,
    errorField: "image" | "sceneImage",
  ) {
    releasePreparedImage(currentImage);
    setPreparedImageState(null);
    setErrors((current) => ({
      ...current,
      [errorField]: undefined,
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
    const nextErrors: CaseFieldErrors = {
      ...validation.errors,
    };

    if (isPreparingImage) {
      nextErrors.image = "Wait for the image preview to finish preparing.";
    }

    if (isPreparingSceneImage) {
      nextErrors.sceneImage = "Wait for the scene image preview to finish preparing.";
    }

    if (!validation.isValid || nextErrors.image || nextErrors.sceneImage) {
      setErrors(nextErrors);
      return;
    }

    const firCooldownMessage = getCooldownError(session.uid, "fir");
    if (firCooldownMessage) {
      setErrors({
        ...nextErrors,
        form: firCooldownMessage,
      });
      return;
    }

    const firQuotaMessage = getFirQuotaError(session.uid);
    if (firQuotaMessage) {
      setErrors({
        ...nextErrors,
        form: firQuotaMessage,
      });
      return;
    }

    if (preparedImage || preparedSceneImage) {
      const imageCooldownMessage = getCooldownError(session.uid, "image-upload");
      if (imageCooldownMessage) {
        setErrors({
          ...nextErrors,
          image: imageCooldownMessage,
          sceneImage: imageCooldownMessage,
        });
        return;
      }
    }

    setErrors(nextErrors);
    setIsSubmitting(true);
    const caseCode = generateCaseId();

    try {
      const createdCase = await createCaseRecord(validation.normalized, caseCode, session.uid);
      stampCooldown(session.uid, "fir");
      stampFirQuota(session.uid);

      let targetUrl = `/cases/${caseCode}`;
      let completedUploads = 0;
      let hasMediaUploadFailure = false;

      if (preparedImage) {
        try {
          await uploadCaseImage(createdCase, session.uid, preparedImage);
          completedUploads += 1;
        } catch {
          hasMediaUploadFailure = true;
        }
      }

      if (preparedSceneImage) {
        try {
          await uploadSceneImage(createdCase, session.uid, preparedSceneImage);
          completedUploads += 1;
        } catch {
          hasMediaUploadFailure = true;
        }
      }

      if (completedUploads > 0) {
        stampCooldown(session.uid, "image-upload");
      }

      if (hasMediaUploadFailure) {
        targetUrl = `/cases/${caseCode}?notice=media-upload-partial`;
      }

      startTransition(() => {
        router.push(targetUrl);
      });
    } catch (error) {
      setErrors({
        ...nextErrors,
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
          File Footwear F.I.R
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
                placeholder={nicknamePlaceholder}
                className={inputBaseClass}
              />
              {errors.nickname ? <p className="bureau-error">{errors.nickname}</p> : null}
            </label>

            <label className="grid gap-2">
              <span className="bureau-label">Chappal type</span>
              <DarkSelect<CaseFormValues["type"]>
                value={values.type}
                onChange={(nextValue) => updateValue("type", nextValue)}
                options={CHAPPAL_TYPES.map((type) => ({
                  value: type,
                  label: type,
                }))}
              />
              {errors.type ? <p className="bureau-error">{errors.type}</p> : null}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="bureau-label">Color</span>
              <DarkSelect<string>
                value={values.color}
                onChange={(nextValue) => updateValue("color", nextValue)}
                options={COLOR_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />
              <p className="text-xs leading-5 text-[#b7b0a5]">
                Pick a readable public color clue. Mystery Color is accepted without further paperwork.
              </p>
              {errors.color ? <p className="bureau-error">{errors.color}</p> : null}
            </label>

            <label className="grid gap-2">
              <span className="bureau-label">Area</span>
              <input
                value={values.area}
                onChange={(event) => updateValue("area", event.target.value)}
                maxLength={40}
                placeholder={areaPlaceholder}
                className={inputBaseClass}
              />
              {errors.area ? <p className="bureau-error">{errors.area}</p> : null}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="bureau-label">Crime scene</span>
              <DarkSelect<CaseFormValues["crimeScene"]>
                value={values.crimeScene}
                onChange={(nextValue) => updateValue("crimeScene", nextValue)}
                options={CRIME_SCENES.map((scene) => ({
                  value: scene,
                  label: scene,
                }))}
              />
              {errors.crimeScene ? <p className="bureau-error">{errors.crimeScene}</p> : null}
            </label>

            <label className="grid gap-2">
              <span className="bureau-label">Reward</span>
              <input
                value={values.reward}
                onChange={(event) => updateValue("reward", event.target.value)}
                maxLength={40}
                list="reward-suggestions"
                placeholder={rewardPlaceholder}
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
            <span className="bureau-label">Primary suspect</span>
            <input
              value={values.primarySuspect}
              onChange={(event) => updateValue("primarySuspect", event.target.value)}
              maxLength={80}
              placeholder={suspectPlaceholder}
              className={inputBaseClass}
            />
            <p className="text-xs leading-5 text-[#b7b0a5]">
              Optional. Keep it broad, funny, and non-doxxing.
            </p>
            {errors.primarySuspect ? <p className="bureau-error">{errors.primarySuspect}</p> : null}
          </label>

          <label className="grid gap-2">
            <span className="bureau-label">Last seen clue</span>
            <textarea
              value={values.lastSeenClue}
              onChange={(event) => updateValue("lastSeenClue", event.target.value)}
              maxLength={100}
              rows={4}
              placeholder={lastSeenPlaceholder}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <span className="bureau-label">Optional chappal photo</span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  handlePreparedImageChange(
                    event,
                    preparedImage,
                    setPreparedImage,
                    setIsPreparingImage,
                    "image",
                  )
                }
                className="block w-full rounded-[18px] border border-dashed border-white/10 bg-black/15 px-4 py-3 text-sm text-[#f8f0dc] file:mr-4 file:rounded-full file:border-0 file:bg-[#f5d55b] file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.18em] file:text-[#1a150f]"
              />
              {isPreparingImage ? (
                <p className="text-xs text-[#f5d55b]">Compressing chappal photo preview...</p>
              ) : null}
              {preparedImage ? (
                <div className="rounded-[18px] border border-white/10 bg-black/15 px-4 py-3 text-sm text-[#f8f0dc]">
                  Chappal photo preview ready for upload.
                  <button
                    type="button"
                    onClick={() => clearPreparedImage(preparedImage, setPreparedImage, "image")}
                    className="ml-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#f5d55b]"
                  >
                    Remove
                  </button>
                </div>
              ) : null}
              {errors.image ? <p className="bureau-error">{errors.image}</p> : null}
            </div>

            <div className="grid gap-2">
              <span className="bureau-label">Optional crime scene photo</span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  handlePreparedImageChange(
                    event,
                    preparedSceneImage,
                    setPreparedSceneImage,
                    setIsPreparingSceneImage,
                    "sceneImage",
                  )
                }
                className="block w-full rounded-[18px] border border-dashed border-white/10 bg-black/15 px-4 py-3 text-sm text-[#f8f0dc] file:mr-4 file:rounded-full file:border-0 file:bg-[#f5d55b] file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.18em] file:text-[#1a150f]"
              />
              {isPreparingSceneImage ? (
                <p className="text-xs text-[#f5d55b]">Compressing scene photo preview...</p>
              ) : null}
              {preparedSceneImage ? (
                <div className="rounded-[18px] border border-white/10 bg-black/15 px-4 py-3 text-sm text-[#f8f0dc]">
                  Crime scene photo preview ready for upload.
                  <button
                    type="button"
                    onClick={() =>
                      clearPreparedImage(preparedSceneImage, setPreparedSceneImage, "sceneImage")
                    }
                    className="ml-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#f5d55b]"
                  >
                    Remove
                  </button>
                </div>
              ) : null}
              {errors.sceneImage ? <p className="bureau-error">{errors.sceneImage}</p> : null}
            </div>
          </div>

          <div className="rounded-[18px] border border-dashed border-white/10 bg-black/10 px-4 py-3 text-xs leading-6 text-[#b7b0a5]">
            Both uploads accept JPG, PNG, or WebP and stay under 1 MB after compression. Upload only chappal or public footwear-area evidence. No faces, no people, no private homes, no documents, no adult content.
          </div>

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
            <ChappalAvatar
              color={values.color || "black"}
              nickname={values.nickname || "CC"}
              type={values.type}
              imageUrl={preparedImage?.previewUrl ?? null}
            />
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
              <dt>Citizen suspect</dt>
              <dd>{values.primarySuspect || "No suspect named yet"}</dd>
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
            <li>Daily filing quota is 5 FIRs per 24 hours per public user window.</li>
          </ul>
        </div>
      </aside>
    </section>
  );
}
