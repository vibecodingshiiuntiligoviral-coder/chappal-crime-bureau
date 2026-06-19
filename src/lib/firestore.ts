import {
  addDoc,
  collection,
  doc,
  getCountFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { TIP_PRESETS } from "@/lib/constants";
import { getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase";
import type { CaseFormValues, CaseRecord, ReportPayload, TipPresetKey, TipRecord } from "@/types";

function ensureFirebase() {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase config missing. Add your NEXT_PUBLIC_FIREBASE_* values first.");
  }
}

function timestampToMillis(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }

  return Date.now();
}

function mapCaseRecord(snapshot: { id: string; data: () => Record<string, unknown> }): CaseRecord {
  const raw = snapshot.data();

  return {
    caseId: snapshot.id,
    nickname: String(raw.nickname ?? ""),
    type: String(raw.type ?? "") as CaseRecord["type"],
    color: String(raw.color ?? ""),
    area: String(raw.area ?? ""),
    crimeScene: String(raw.crimeScene ?? "") as CaseRecord["crimeScene"],
    lastSeenClue: String(raw.lastSeenClue ?? ""),
    reward: String(raw.reward ?? ""),
    instagramHandle: String(raw.instagramHandle ?? ""),
    status: String(raw.status ?? "Missing") as CaseRecord["status"],
    createdByUid: String(raw.createdByUid ?? ""),
    createdAt: timestampToMillis(raw.createdAt),
    updatedAt: timestampToMillis(raw.updatedAt),
  };
}

function mapTipRecord(snapshot: { id: string; data: () => Record<string, unknown> }): TipRecord {
  const raw = snapshot.data();

  return {
    id: snapshot.id,
    caseId: String(raw.caseId ?? ""),
    kind: String(raw.kind ?? "custom") as TipRecord["kind"],
    presetKey: String(raw.presetKey ?? ""),
    message: String(raw.message ?? ""),
    createdByUid: String(raw.createdByUid ?? ""),
    createdAt: timestampToMillis(raw.createdAt),
  };
}

export async function createCaseRecord(values: CaseFormValues, caseId: string, uid: string) {
  ensureFirebase();

  const db = getFirestoreDb();

  await setDoc(doc(db, "cases", caseId), {
    ...values,
    caseId,
    createdByUid: uid,
    status: "Missing",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToCases(
  onData: (cases: CaseRecord[]) => void,
  onError: (message: string) => void,
  queryLimit = 18,
) {
  ensureFirebase();

  const db = getFirestoreDb();
  const casesQuery = query(collection(db, "cases"), orderBy("createdAt", "desc"), limit(queryLimit));

  return onSnapshot(
    casesQuery,
    (snapshot) => {
      onData(snapshot.docs.map(mapCaseRecord));
    },
    () => {
      onError("Could not load the live bureau feed.");
    },
  );
}

export function subscribeToCase(
  caseId: string,
  onData: (caseRecord: CaseRecord | null) => void,
  onError: (message: string) => void,
) {
  ensureFirebase();

  const db = getFirestoreDb();
  const caseRef = doc(db, "cases", caseId);

  return onSnapshot(
    caseRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }

      onData(mapCaseRecord(snapshot));
    },
    () => {
      onError("Could not load this case file.");
    },
  );
}

export function subscribeToTips(
  caseId: string,
  onData: (tips: TipRecord[]) => void,
  onError: (message: string) => void,
) {
  ensureFirebase();

  const db = getFirestoreDb();
  const tipsQuery = query(
    collection(db, "cases", caseId, "tips"),
    orderBy("createdAt", "desc"),
    limit(24),
  );

  return onSnapshot(
    tipsQuery,
    (snapshot) => {
      onData(snapshot.docs.map(mapTipRecord));
    },
    () => {
      onError("Could not load the public tip board.");
    },
  );
}

export async function fetchTipCount(caseId: string) {
  ensureFirebase();
  const db = getFirestoreDb();
  const aggregate = await getCountFromServer(collection(db, "cases", caseId, "tips"));
  return aggregate.data().count;
}

export async function fetchTipCounts(caseIds: string[]) {
  ensureFirebase();
  const entries = await Promise.all(
    caseIds.map(async (caseId) => [caseId, await fetchTipCount(caseId)] as const),
  );

  return Object.fromEntries(entries);
}

export async function createPresetTip(caseId: string, presetKey: TipPresetKey, uid: string) {
  ensureFirebase();
  const db = getFirestoreDb();
  const selectedPreset = TIP_PRESETS.find((preset) => preset.key === presetKey);

  if (!selectedPreset) {
    throw new Error("That preset tip does not exist.");
  }

  await addDoc(collection(db, "cases", caseId, "tips"), {
    caseId,
    kind: "preset",
    presetKey,
    message: selectedPreset.message,
    createdByUid: uid,
    createdAt: serverTimestamp(),
  });
}

export async function createCustomTip(caseId: string, message: string, uid: string) {
  ensureFirebase();
  const db = getFirestoreDb();

  await addDoc(collection(db, "cases", caseId, "tips"), {
    caseId,
    kind: "custom",
    presetKey: "",
    message,
    createdByUid: uid,
    createdAt: serverTimestamp(),
  });
}

export async function markCaseFound(caseId: string) {
  ensureFirebase();
  const db = getFirestoreDb();

  await updateDoc(doc(db, "cases", caseId), {
    status: "Found",
    updatedAt: serverTimestamp(),
  });
}

export async function submitCaseReport(caseId: string, payload: ReportPayload, uid: string) {
  ensureFirebase();
  const db = getFirestoreDb();

  await addDoc(collection(db, "cases", caseId, "reports"), {
    reason: payload.reason,
    note: payload.note,
    createdByUid: uid,
    createdAt: serverTimestamp(),
  });
}
