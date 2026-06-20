import {
  CASE_CLOSED_MESSAGE,
  DAILY_FIR_QUOTA_MESSAGE,
  TIP_PRESETS,
} from "@/lib/constants";
import {
  getTipAttributionLabel,
  computeThreatLevel,
  fromDbStatus,
  fromDbThreatLevel,
  toDbThreatLevel,
} from "@/lib/case-helpers";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import type {
  CaseFormValues,
  CaseClosurePayload,
  CaseRecord,
  PreparedCaseImage,
  ReportPayload,
  TipAttributionInput,
  TipPresetType,
  TipRecord,
  TipType,
} from "@/types";

type AnyRow = Record<string, unknown>;

function ensureSupabase() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase config is missing. Add NEXT_PUBLIC_SUPABASE_URL and your public client key.",
    );
  }
}

function asMillis(value: unknown) {
  if (!value) {
    return Date.now();
  }

  if (typeof value === "string" || value instanceof Date) {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : Date.now();
  }

  return Date.now();
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getStorageImageUrl(path: string | null, status: string | null) {
  if (!path || status !== "active") {
    return null;
  }

  const { data } = getSupabaseClient().storage.from("case-images").getPublicUrl(path);
  return data.publicUrl ?? null;
}

function mapCaseRow(row: AnyRow): CaseRecord {
  const imagePath = normalizeString(row.image_path) || null;
  const imageStatus = normalizeString(row.image_status) || "none";
  const sceneImagePath = normalizeString(row.scene_image_path) || null;
  const sceneImageStatus = normalizeString(row.scene_image_status) || "none";

  return {
    id: normalizeString(row.id),
    caseId: normalizeString(row.case_code),
    ownerId: normalizeString(row.owner_id),
    nickname: normalizeString(row.nickname),
    type: normalizeString(row.type) as CaseRecord["type"],
    color: normalizeString(row.color),
    area: normalizeString(row.area),
    crimeScene: normalizeString(row.crime_scene) as CaseRecord["crimeScene"],
    lastSeenClue: normalizeString(row.last_seen),
    reward: normalizeString(row.reward),
    instagramHandle: normalizeString(row.instagram),
    primarySuspect: normalizeString(row.primary_suspect),
    status: fromDbStatus(row.status),
    threatLevel: fromDbThreatLevel(row.threat_level),
    tipCount: Number(row.tip_count ?? 0),
    imagePath,
    imageStatus,
    imageUrl: getStorageImageUrl(imagePath, imageStatus),
    sceneImagePath,
    sceneImageStatus,
    sceneImageUrl: getStorageImageUrl(sceneImagePath, sceneImageStatus),
    closureWhoTookIt: normalizeString(row.closure_who_took_it),
    closureFoundLocation: normalizeString(row.closure_found_location),
    closureTipsHelped: Boolean(row.closure_tips_helped),
    closureHelpfulTipId: normalizeString(row.closure_helpful_tip_id) || null,
    closureRewardDelivered:
      row.closure_reward_delivered === null || row.closure_reward_delivered === undefined
        ? null
        : Boolean(row.closure_reward_delivered),
    closureSummary: normalizeString(row.closure_summary),
    closedAt: row.closed_at ? asMillis(row.closed_at) : null,
    createdAt: asMillis(row.created_at),
    updatedAt: asMillis(row.updated_at ?? row.created_at),
  };
}

function normalizeTipType(value: unknown): TipType {
  const normalized = normalizeString(value);

  if (
    normalized === "sighting" ||
    normalized === "rack-check" ||
    normalized === "uncle-suspected" ||
    normalized === "friend-prank" ||
    normalized === "emotionally-moved-on" ||
    normalized === "hostage-roleplay"
  ) {
    return normalized;
  }

  return "custom";
}

function mapTipRow(row: AnyRow): TipRecord {
  const authorAlias = normalizeString(row.author_alias);
  const authorInstagram = normalizeString(row.author_instagram);

  return {
    id: normalizeString(row.id),
    caseId: normalizeString(row.case_id),
    authorId: normalizeString(row.author_id),
    type: normalizeTipType(row.type),
    message: normalizeString(row.message),
    authorAlias,
    authorInstagram,
    attributionLabel: getTipAttributionLabel(authorAlias, authorInstagram),
    createdAt: asMillis(row.created_at),
  };
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "";
}

function buildFriendlyError(error: unknown, fallback: string) {
  return getErrorMessage(error) || fallback;
}

function isCaseInsertBlockedByPolicy(error: unknown) {
  const normalized = getErrorMessage(error).toLowerCase();

  return (
    normalized.includes("row-level security") ||
    normalized.includes("violates row-level security policy") ||
    normalized.includes("permission denied") ||
    normalized.includes("not allowed") ||
    normalized.includes("quota") ||
    normalized.includes("24 hour") ||
    normalized.includes("24-hour")
  );
}

function isTipInsertBlockedByPolicy(error: unknown) {
  const normalized = getErrorMessage(error).toLowerCase();

  return (
    normalized.includes("row-level security") ||
    normalized.includes("violates row-level security policy") ||
    normalized.includes("permission denied") ||
    normalized.includes("not allowed")
  );
}

function buildTipInsertError(error: unknown, caseRecord: CaseRecord) {
  if (caseRecord.status === "found" || isTipInsertBlockedByPolicy(error)) {
    return CASE_CLOSED_MESSAGE;
  }

  return buildFriendlyError(error, "Could not send that tip.");
}

function buildCaseCreateError(error: unknown) {
  if (isCaseInsertBlockedByPolicy(error)) {
    return DAILY_FIR_QUOTA_MESSAGE;
  }

  return buildFriendlyError(error, "Could not register the FIR.");
}

async function tryInsertReportPayload(payloads: Array<Record<string, unknown>>) {
  const client = getSupabaseClient();
  let lastError: unknown = null;

  for (const payload of payloads) {
    const { error } = await client.from("reports").insert(payload);
    if (!error) {
      return;
    }

    lastError = error;
  }

  throw new Error(buildFriendlyError(lastError, "Could not submit the report."));
}

export async function createCaseRecord(
  values: CaseFormValues,
  caseCode: string,
  userId: string,
) {
  ensureSupabase();

  const client = getSupabaseClient();
  const threatLevel = computeThreatLevel({
    crimeScene: values.crimeScene,
    reward: values.reward,
    type: values.type,
  });

  const { data, error } = await client
    .from("cases")
    .insert({
      owner_id: userId,
      case_code: caseCode,
      nickname: values.nickname,
      type: values.type,
      color: values.color,
      area: values.area,
      crime_scene: values.crimeScene,
      last_seen: values.lastSeenClue,
      reward: values.reward,
      instagram: values.instagramHandle || null,
      primary_suspect: values.primarySuspect || null,
      status: "missing",
      threat_level: toDbThreatLevel(threatLevel),
      image_path: null,
      image_status: "none",
      scene_image_path: null,
      scene_image_status: "none",
      closure_who_took_it: null,
      closure_found_location: null,
      closure_tips_helped: false,
      closure_helpful_tip_id: null,
      closure_reward_delivered: null,
      closure_summary: null,
      closed_at: null,
      tip_count: 0,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(buildCaseCreateError(error));
  }

  return mapCaseRow(data);
}

export async function uploadCaseImage(
  caseRecord: CaseRecord,
  userId: string,
  preparedImage: PreparedCaseImage,
) {
  ensureSupabase();

  const client = getSupabaseClient();
  const imagePath = `${userId}/${caseRecord.id}/main.webp`;
  const { error: uploadError } = await client.storage
    .from("case-images")
    .upload(imagePath, preparedImage.blob, {
      contentType: "image/webp",
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(buildFriendlyError(uploadError, "Image upload failed."));
  }

  const { data, error } = await client
    .from("cases")
    .update({
      image_path: imagePath,
      image_status: "active",
    })
    .eq("id", caseRecord.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(buildFriendlyError(error, "Image uploaded, but the case could not be updated."));
  }

  return mapCaseRow(data);
}

export async function uploadSceneImage(
  caseRecord: CaseRecord,
  userId: string,
  preparedImage: PreparedCaseImage,
) {
  ensureSupabase();

  const client = getSupabaseClient();
  const imagePath = `${userId}/${caseRecord.id}/scene.webp`;
  const { error: uploadError } = await client.storage
    .from("case-images")
    .upload(imagePath, preparedImage.blob, {
      contentType: "image/webp",
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(buildFriendlyError(uploadError, "Scene image upload failed."));
  }

  const { data, error } = await client
    .from("cases")
    .update({
      scene_image_path: imagePath,
      scene_image_status: "active",
    })
    .eq("id", caseRecord.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      buildFriendlyError(error, "Scene image uploaded, but the case could not be updated."),
    );
  }

  return mapCaseRow(data);
}

export async function fetchCases(limit = 30) {
  ensureSupabase();

  const client = getSupabaseClient();
  const { data, error } = await client
    .from("cases")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(buildFriendlyError(error, "Could not load the live bureau feed."));
  }

  return (data ?? []).map((row) => mapCaseRow(row));
}

export async function fetchCaseByCode(caseCode: string) {
  ensureSupabase();

  const client = getSupabaseClient();
  const { data, error } = await client
    .from("cases")
    .select("*")
    .eq("case_code", caseCode)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(buildFriendlyError(error, "Could not load this case file."));
  }

  if (!data) {
    return null;
  }

  return mapCaseRow(data);
}

export async function fetchTipsForCase(caseRowId: string, limit = 50) {
  ensureSupabase();

  const client = getSupabaseClient();
  const { data, error } = await client
    .from("tips")
    .select("*")
    .eq("case_id", caseRowId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(buildFriendlyError(error, "Could not load the public tip board."));
  }

  return (data ?? []).map((row) => mapTipRow(row));
}

async function syncTipCount(caseRowId: string) {
  const client = getSupabaseClient();

  const { count, error } = await client
    .from("tips")
    .select("id", { count: "exact", head: true })
    .eq("case_id", caseRowId);

  if (error || typeof count !== "number") {
    return null;
  }

  const { error: updateError } = await client
    .from("cases")
    .update({ tip_count: count })
    .eq("id", caseRowId);

  if (updateError) {
    return null;
  }

  return count;
}

export async function createPresetTip(
  caseRecord: CaseRecord,
  presetType: TipPresetType,
  userId: string,
  attribution?: TipAttributionInput,
) {
  const selectedPreset = TIP_PRESETS.find((preset) => preset.type === presetType);
  if (!selectedPreset) {
    throw new Error("That preset tip does not exist.");
  }

  return insertTip(caseRecord, userId, selectedPreset.type, selectedPreset.message, attribution);
}

export async function createCustomTip(
  caseRecord: CaseRecord,
  message: string,
  userId: string,
  attribution?: TipAttributionInput,
) {
  return insertTip(caseRecord, userId, "custom", message, attribution);
}

export async function createHostageTip(
  caseRecord: CaseRecord,
  message: string,
  userId: string,
  attribution?: TipAttributionInput,
) {
  return insertTip(caseRecord, userId, "hostage-roleplay", message, attribution);
}

async function insertTip(
  caseRecord: CaseRecord,
  userId: string,
  type: TipType,
  message: string,
  attribution?: TipAttributionInput,
) {
  ensureSupabase();

  if (caseRecord.status === "found") {
    throw new Error(CASE_CLOSED_MESSAGE);
  }

  if (caseRecord.ownerId === userId) {
    throw new Error("You cannot send tips on your own case.");
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from("tips")
    .insert({
      case_id: caseRecord.id,
      author_id: userId,
      type,
      message,
      author_alias: attribution?.alias || null,
      author_instagram: attribution?.instagramHandle || null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(buildTipInsertError(error, caseRecord));
  }

  await syncTipCount(caseRecord.id);
  return mapTipRow(data);
}

export async function submitCaseClosure(caseRecord: CaseRecord, payload: CaseClosurePayload) {
  ensureSupabase();

  const client = getSupabaseClient();
  const { data, error } = await client
    .from("cases")
    .update({
      status: "found",
      closed_at: new Date().toISOString(),
      closure_who_took_it: payload.whoTookIt,
      closure_found_location: payload.foundLocation,
      closure_tips_helped: payload.tipsHelped,
      closure_helpful_tip_id: payload.helpfulTipId,
      closure_reward_delivered: payload.rewardDelivered,
      closure_summary: payload.summary,
    })
    .eq("id", caseRecord.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(buildFriendlyError(error, "Could not mark this case as found."));
  }

  return mapCaseRow(data);
}

export async function markCaseFound(caseRecord: CaseRecord) {
  return submitCaseClosure(caseRecord, {
    whoTookIt: null,
    foundLocation: "Recovered without debrief.",
    tipsHelped: false,
    helpfulTipId: null,
    rewardDelivered: null,
    summary: null,
  });
}

export async function submitReport(payload: ReportPayload, userId: string) {
  ensureSupabase();

  const basePayload = {
    reason: payload.reason,
    note: payload.note || null,
  };

  const attempts: Array<Record<string, unknown>> = [
    {
      ...basePayload,
      owner_id: userId,
      case_id: payload.caseId,
      tip_id: payload.tipId ?? null,
    },
    {
      ...basePayload,
      reporter_id: userId,
      case_id: payload.caseId,
      tip_id: payload.tipId ?? null,
    },
    {
      ...basePayload,
      owner_id: userId,
      case_id: payload.caseId,
      target_type: payload.targetType,
      target_id: payload.targetType === "tip" ? payload.tipId : payload.caseId,
    },
    {
      ...basePayload,
      reporter_id: userId,
      case_id: payload.caseId,
      target_type: payload.targetType,
      target_id: payload.targetType === "tip" ? payload.tipId : payload.caseId,
    },
  ];

  await tryInsertReportPayload(attempts);
}
