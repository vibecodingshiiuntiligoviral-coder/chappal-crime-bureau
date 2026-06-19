import { buildRoleplayNote, computeThreatLevel, getDisplayHandle } from "@/lib/case-helpers";
import type { CaseRecord, CaseStatus } from "@/types";

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let currentLine = "";
  let cursorY = y;

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && currentLine) {
      context.fillText(currentLine, x, cursorY);
      currentLine = word;
      cursorY += lineHeight;
      continue;
    }

    currentLine = candidate;
  }

  if (currentLine) {
    context.fillText(currentLine, x, cursorY);
  }

  return cursorY;
}

function downloadCanvas(canvas: HTMLCanvasElement, fileName: string) {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = fileName;
  link.click();
}

function drawPosterBackground(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = "#0d0b09";
  context.fillRect(0, 0, width, height);

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "rgba(210, 144, 26, 0.22)");
  gradient.addColorStop(0.55, "rgba(146, 24, 24, 0.12)");
  gradient.addColorStop(1, "rgba(42, 79, 60, 0.22)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "rgba(245, 213, 91, 0.12)";
  for (let y = 0; y < height; y += 42) {
    context.fillRect(0, y, width, 1);
  }
}

async function waitForFonts() {
  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready;
  }
}

export async function downloadPoster(caseRecord: CaseRecord, liveStatus: CaseStatus) {
  await waitForFonts();

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Poster rendering is not supported in this browser.");
  }

  drawPosterBackground(context, canvas.width, canvas.height);
  const threatLevel = computeThreatLevel(caseRecord);

  context.fillStyle = "#f5d55b";
  context.fillRect(72, 72, 936, 82);

  context.fillStyle = "#14100d";
  context.font = "700 34px Arial";
  context.fillText("CHAPPAL CRIME BUREAU", 104, 125);

  context.fillStyle = "#f8f0dc";
  context.font = "700 94px Arial";
  context.fillText("MISSING CHAPPAL ALERT", 72, 250);

  context.fillStyle = "#c84333";
  context.font = "700 38px Arial";
  context.fillText(`CASE ID ${caseRecord.caseId}`, 72, 314);

  context.fillStyle = "#f8f0dc";
  context.font = "600 42px Arial";
  context.fillText(`${caseRecord.nickname} / ${caseRecord.type}`, 72, 392);

  context.font = "500 32px Arial";
  context.fillStyle = "#d5d0c5";
  const fields = [
    `Area: ${caseRecord.area}`,
    `Crime Scene: ${caseRecord.crimeScene}`,
    `Threat Level: ${threatLevel}`,
    `Status: ${liveStatus}`,
    `Reward: ${caseRecord.reward}`,
  ];

  fields.forEach((line, index) => {
    context.fillText(line, 72, 470 + index * 58);
  });

  context.fillStyle = "#f5d55b";
  context.fillRect(72, 760, 936, 4);

  context.fillStyle = "#f8f0dc";
  context.font = "700 36px Arial";
  context.fillText("LAST SEEN CLUE", 72, 832);

  context.font = "500 34px Arial";
  wrapText(context, caseRecord.lastSeenClue, 72, 892, 936, 48);

  if (caseRecord.instagramHandle) {
    context.fillStyle = "#9fc38f";
    context.font = "600 32px Arial";
    context.fillText(`Public handle: ${getDisplayHandle(caseRecord.instagramHandle)}`, 72, 1090);
  }

  context.fillStyle = "#c84333";
  context.font = "700 28px Arial";
  context.fillText("No phone numbers. No exact addresses. No real tracking.", 72, 1190);

  context.fillStyle = "#f8f0dc";
  context.font = "500 26px Arial";
  context.fillText("India's most useless emergency service.", 72, 1240);

  downloadCanvas(canvas, `${caseRecord.caseId.toLowerCase()}-missing-poster.png`);
}

export async function downloadRoleplayNote(caseRecord: CaseRecord) {
  await waitForFonts();

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Note rendering is not supported in this browser.");
  }

  drawPosterBackground(context, canvas.width, canvas.height);

  context.fillStyle = "#c84333";
  context.fillRect(74, 74, 932, 94);
  context.fillStyle = "#fff8eb";
  context.font = "700 36px Arial";
  context.fillText("ROLEPLAY NOTE. DO NOT CLAIM REAL THEFT.", 114, 132);

  context.fillStyle = "#f8f0dc";
  context.font = "700 82px Arial";
  context.fillText("HOSTAGE NOTE LAB", 72, 290);

  context.fillStyle = "#d5d0c5";
  context.font = "600 34px Arial";
  context.fillText(caseRecord.caseId, 72, 354);

  context.fillStyle = "#f5d55b";
  context.fillRect(72, 404, 936, 4);

  context.fillStyle = "#f8f0dc";
  context.font = "600 44px Arial";
  wrapText(context, buildRoleplayNote(caseRecord), 72, 500, 936, 60);

  context.fillStyle = "#9fc38f";
  context.font = "500 30px Arial";
  context.fillText("This is a joke generator for a meme lost-and-found.", 72, 910);

  downloadCanvas(canvas, `${caseRecord.caseId.toLowerCase()}-roleplay-note.png`);
}
