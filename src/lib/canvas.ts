import { getDisplayHandle, pickChappalPalette } from "@/lib/case-helpers";
import type { CaseRecord, CaseStatus } from "@/types";

const POSTER_WIDTH = 1080;
const POSTER_HEIGHT = 1350;
const PAPER_MARGIN = 42;
const CONTENT_X = 72;
const CONTENT_WIDTH = POSTER_WIDTH - CONTENT_X * 2;
const DEFAULT_FONT = "Arial, sans-serif";
const HEADING_FONT = "'Arial Black', Arial, sans-serif";

interface PosterDownloadOptions {
  helpfulTipAttribution?: string | null;
  helpfulTipLabel?: string | null;
  helpfulTipMessage?: string | null;
}

interface Rect {
  height: number;
  width: number;
  x: number;
  y: number;
}

function normalizePosterText(value: string | null | undefined, fallback = "NOT FILED") {
  const normalized = (value ?? "").replace(/\s+/g, " ").trim();
  return normalized || fallback;
}

function getWrappedLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = Number.POSITIVE_INFINITY,
) {
  const source = normalizePosterText(text, "");
  if (!source) {
    return [];
  }

  const words = source.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (currentLine && context.measureText(candidate).width > maxWidth) {
      lines.push(currentLine);
      currentLine = word;

      if (lines.length === maxLines) {
        break;
      }

      continue;
    }

    currentLine = candidate;
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  if (lines.length === maxLines && words.length) {
    const consumedWords = lines.join(" ").split(" ").length;
    if (consumedWords < words.length) {
      let clippedLine = lines[maxLines - 1] ?? "";

      while (clippedLine && context.measureText(`${clippedLine}...`).width > maxWidth) {
        clippedLine = clippedLine.slice(0, -1).trimEnd();
      }

      lines[maxLines - 1] = clippedLine ? `${clippedLine}...` : "...";
    }
  }

  return lines;
}

function drawWrappedLines(
  context: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
) {
  lines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });

  return y + Math.max(0, lines.length - 1) * lineHeight;
}

function fitTextBlock(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
  startSize: number,
  minSize: number,
  weight: number,
  family = DEFAULT_FONT,
) {
  for (let fontSize = startSize; fontSize >= minSize; fontSize -= 2) {
    context.font = `${weight} ${fontSize}px ${family}`;
    const lines = getWrappedLines(context, text, maxWidth, maxLines);
    const lastLine = lines[lines.length - 1] ?? "";
    if (lines.length <= maxLines && context.measureText(lastLine).width <= maxWidth) {
      return { fontSize, lines };
    }
  }

  context.font = `${weight} ${minSize}px ${family}`;
  return {
    fontSize: minSize,
    lines: getWrappedLines(context, text, maxWidth, maxLines),
  };
}

function roundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function fillRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  roundedRectPath(context, x, y, width, height, radius);
  context.fill();
}

function strokeRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  roundedRectPath(context, x, y, width, height, radius);
  context.stroke();
}

function downloadCanvas(canvas: HTMLCanvasElement, fileName: string) {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = fileName;
  link.click();
}

function drawNoise(context: CanvasRenderingContext2D, width: number, height: number) {
  context.save();
  context.fillStyle = "rgba(34, 28, 21, 0.06)";

  for (let index = 0; index < 950; index += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 1.8 + 0.4;
    context.fillRect(x, y, size, size);
  }

  context.strokeStyle = "rgba(74, 56, 39, 0.055)";
  context.lineWidth = 1;
  for (let index = 0; index < 34; index += 1) {
    const y = PAPER_MARGIN + index * 34;
    context.beginPath();
    context.moveTo(PAPER_MARGIN + 18, y);
    context.lineTo(POSTER_WIDTH - PAPER_MARGIN - 18, y);
    context.stroke();
  }

  context.restore();
}

function drawPosterBackground(context: CanvasRenderingContext2D, width: number, height: number) {
  const background = context.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, "#d8ccb5");
  background.addColorStop(0.5, "#e5dbc7");
  background.addColorStop(1, "#cfc19f");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#1a140f";
  context.fillRect(0, 0, width, 22);
  context.fillRect(0, height - 22, width, 22);

  const edgeShadow = context.createLinearGradient(0, 0, 0, height);
  edgeShadow.addColorStop(0, "rgba(0, 0, 0, 0.18)");
  edgeShadow.addColorStop(0.08, "rgba(0, 0, 0, 0)");
  edgeShadow.addColorStop(0.92, "rgba(0, 0, 0, 0)");
  edgeShadow.addColorStop(1, "rgba(0, 0, 0, 0.16)");
  context.fillStyle = edgeShadow;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#efe5d0";
  context.fillRect(PAPER_MARGIN, PAPER_MARGIN, width - PAPER_MARGIN * 2, height - PAPER_MARGIN * 2);
  context.strokeStyle = "#17120d";
  context.lineWidth = 6;
  context.strokeRect(
    PAPER_MARGIN,
    PAPER_MARGIN,
    width - PAPER_MARGIN * 2,
    height - PAPER_MARGIN * 2,
  );

  context.fillStyle = "rgba(210, 169, 48, 0.12)";
  context.fillRect(PAPER_MARGIN + 14, PAPER_MARGIN + 14, width - PAPER_MARGIN * 2 - 28, 28);

  drawNoise(context, width, height);
}

async function loadPosterImage(imageUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the poster image."));
    image.src = imageUrl;
  });
}

function drawEvidencePlaceholder(
  context: CanvasRenderingContext2D,
  caseRecord: CaseRecord,
  box: Rect,
) {
  const palette = pickChappalPalette(caseRecord.color);

  context.fillStyle = "#ddd3bf";
  context.fillRect(box.x, box.y, box.width, box.height);

  context.strokeStyle = "rgba(28, 23, 18, 0.1)";
  context.lineWidth = 2;
  for (let index = -box.height; index < box.width; index += 26) {
    context.beginPath();
    context.moveTo(box.x + index, box.y);
    context.lineTo(box.x + index + box.height, box.y + box.height);
    context.stroke();
  }

  const leftX = box.x + box.width * 0.23;
  const rightX = box.x + box.width * 0.58;
  const strapY = box.y + box.height * 0.18;
  const strapWidth = box.width * 0.18;
  const strapHeight = box.height * 0.5;

  const slipperGradient = context.createLinearGradient(0, strapY, 0, strapY + strapHeight);
  slipperGradient.addColorStop(0, palette.secondary);
  slipperGradient.addColorStop(1, palette.primary);
  context.fillStyle = slipperGradient;

  fillRoundedRect(context, leftX, strapY, strapWidth, strapHeight, 48);
  fillRoundedRect(context, rightX, strapY + box.height * 0.05, strapWidth, strapHeight, 48);

  context.fillStyle = palette.accent;
  fillRoundedRect(context, leftX - 14, strapY + 26, strapWidth + 42, 14, 8);
  fillRoundedRect(context, rightX - 22, strapY + 48, strapWidth + 42, 14, 8);

  context.fillStyle = "rgba(14, 12, 9, 0.78)";
  fillRoundedRect(context, box.x + 24, box.y + box.height - 90, box.width - 48, 58, 10);

  context.fillStyle = "#f7eed9";
  context.font = `700 24px ${HEADING_FONT}`;
  context.textAlign = "center";
  context.fillText("EVIDENCE NOT SUBMITTED", box.x + box.width / 2, box.y + box.height - 54);

  context.font = `600 16px ${DEFAULT_FONT}`;
  context.fillText("Generated bureau sketch attached", box.x + box.width / 2, box.y + box.height - 26);
}

async function drawCaseImage(
  context: CanvasRenderingContext2D,
  caseRecord: CaseRecord,
  box: Rect,
) {
  context.fillStyle = "#16120e";
  context.fillRect(box.x, box.y, box.width, box.height);

  context.fillStyle = "#efe5d0";
  context.fillRect(box.x + 12, box.y + 12, box.width - 24, box.height - 24);

  context.fillStyle = "#16120e";
  context.font = `700 18px ${DEFAULT_FONT}`;
  context.textAlign = "left";
  context.fillText("EVIDENCE IMAGE", box.x + 28, box.y + 40);

  const imageFrame = {
    x: box.x + 24,
    y: box.y + 58,
    width: box.width - 48,
    height: box.height - 82,
  };

  context.strokeStyle = "#16120e";
  context.lineWidth = 4;
  context.strokeRect(imageFrame.x, imageFrame.y, imageFrame.width, imageFrame.height);

  if (caseRecord.imageUrl) {
    try {
      const image = await loadPosterImage(caseRecord.imageUrl);
      const imageRatio = image.width / image.height;
      const frameRatio = imageFrame.width / imageFrame.height;

      let drawWidth = imageFrame.width;
      let drawHeight = imageFrame.height;
      let drawX = imageFrame.x;
      let drawY = imageFrame.y;

      if (imageRatio > frameRatio) {
        drawWidth = imageFrame.height * imageRatio;
        drawX = imageFrame.x - (drawWidth - imageFrame.width) / 2;
      } else {
        drawHeight = imageFrame.width / imageRatio;
        drawY = imageFrame.y - (drawHeight - imageFrame.height) / 2;
      }

      context.save();
      context.beginPath();
      context.rect(imageFrame.x, imageFrame.y, imageFrame.width, imageFrame.height);
      context.clip();
      context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      context.restore();
      return;
    } catch {
      // Fall through to the generated placeholder below.
    }
  }

  drawEvidencePlaceholder(context, caseRecord, imageFrame);
}

function drawInfoCell(
  context: CanvasRenderingContext2D,
  label: string,
  value: string,
  box: Rect,
  options?: {
    maxLines?: number;
    minFontSize?: number;
    startFontSize?: number;
  },
) {
  context.fillStyle = "#e6dcc8";
  context.fillRect(box.x, box.y, box.width, box.height);
  context.strokeStyle = "#16120e";
  context.lineWidth = 2;
  context.strokeRect(box.x, box.y, box.width, box.height);

  context.fillStyle = "#16120e";
  context.font = `700 15px ${DEFAULT_FONT}`;
  context.textAlign = "left";
  context.fillText(label.toUpperCase(), box.x + 16, box.y + 24);

  const fittedValue = fitTextBlock(
    context,
    normalizePosterText(value),
    box.width - 32,
    options?.maxLines ?? 2,
    options?.startFontSize ?? 24,
    options?.minFontSize ?? 17,
    700,
    DEFAULT_FONT,
  );

  context.fillStyle = "#12100d";
  context.font = `700 ${fittedValue.fontSize}px ${DEFAULT_FONT}`;
  drawWrappedLines(context, fittedValue.lines, box.x + 16, box.y + 54, fittedValue.fontSize + 6);
}

function drawFactsPanel(
  context: CanvasRenderingContext2D,
  caseRecord: CaseRecord,
  liveStatus: CaseStatus,
  box: Rect,
) {
  context.fillStyle = "#1a140f";
  context.fillRect(box.x, box.y, box.width, box.height);
  context.strokeStyle = "#16120e";
  context.lineWidth = 4;
  context.strokeRect(box.x, box.y, box.width, box.height);

  context.fillStyle = "#e6bf47";
  context.fillRect(box.x + 14, box.y + 14, box.width - 28, 34);
  context.fillStyle = "#16120e";
  context.font = `700 18px ${DEFAULT_FONT}`;
  context.fillText("CASE FACTS", box.x + 28, box.y + 37);

  const innerX = box.x + 18;
  const innerY = box.y + 62;
  const innerWidth = box.width - 36;
  const gap = 12;
  const halfWidth = (innerWidth - gap) / 2;
  const fullRowHeight = 84;
  const halfRowHeight = 82;

  drawInfoCell(context, "Case ID", caseRecord.caseId, {
    x: innerX,
    y: innerY,
    width: innerWidth,
    height: fullRowHeight,
  });

  drawInfoCell(context, "Nickname", caseRecord.nickname, {
    x: innerX,
    y: innerY + fullRowHeight + gap,
    width: innerWidth,
    height: fullRowHeight + 10,
  });

  const gridY = innerY + fullRowHeight * 2 + gap * 2 + 10;
  drawInfoCell(context, "Type", caseRecord.type, {
    x: innerX,
    y: gridY,
    width: halfWidth,
    height: halfRowHeight,
  });
  drawInfoCell(context, "Color", caseRecord.color, {
    x: innerX + halfWidth + gap,
    y: gridY,
    width: halfWidth,
    height: halfRowHeight,
  });
  drawInfoCell(context, "Area", caseRecord.area, {
    x: innerX,
    y: gridY + halfRowHeight + gap,
    width: halfWidth,
    height: halfRowHeight + 6,
  });
  drawInfoCell(context, "Crime Scene", caseRecord.crimeScene, {
    x: innerX + halfWidth + gap,
    y: gridY + halfRowHeight + gap,
    width: halfWidth,
    height: halfRowHeight + 6,
  });
  drawInfoCell(context, "Threat Level", caseRecord.threatLevel, {
    x: innerX,
    y: gridY + (halfRowHeight + gap) * 2 + 6,
    width: halfWidth,
    height: halfRowHeight,
  });
  drawInfoCell(context, "Reward", caseRecord.reward, {
    x: innerX + halfWidth + gap,
    y: gridY + (halfRowHeight + gap) * 2 + 6,
    width: halfWidth,
    height: halfRowHeight,
  });
  drawInfoCell(
    context,
    "Public Handle",
    caseRecord.instagramHandle ? getDisplayHandle(caseRecord.instagramHandle) : "Not filed",
    {
      x: innerX,
      y: gridY + (halfRowHeight + gap) * 3 + 6,
      width: innerWidth,
      height: 82,
    },
    {
      maxLines: 2,
      startFontSize: 22,
      minFontSize: 16,
    },
  );

  context.fillStyle = "rgba(230, 191, 71, 0.14)";
  context.fillRect(box.x + box.width - 154, box.y + 16, 116, 28);
  context.fillStyle = "#f2e6c8";
  context.font = `700 12px ${DEFAULT_FONT}`;
  context.textAlign = "center";
  context.fillText(normalizePosterText(liveStatus), box.x + box.width - 96, box.y + 35);
}

function getStatusStampConfig(liveStatus: CaseStatus) {
  if (liveStatus === "Found / Case Closed") {
    return {
      accent: "#2f6941",
      border: "#173321",
      text: "FOUND / RECOVERED",
    };
  }

  if (liveStatus === "Under Investigation") {
    return {
      accent: "#d3a61d",
      border: "#16120e",
      text: "UNDER INVESTIGATION",
    };
  }

  return {
    accent: "#b43c2c",
    border: "#611d15",
    text: "MISSING",
  };
}

function drawStatusStamp(context: CanvasRenderingContext2D, liveStatus: CaseStatus) {
  const stamp = getStatusStampConfig(liveStatus);

  context.save();
  context.translate(790, 194);
  context.rotate(-0.08);
  context.fillStyle = stamp.accent;
  fillRoundedRect(context, 0, 0, 228, 64, 12);
  context.strokeStyle = stamp.border;
  context.lineWidth = 4;
  strokeRoundedRect(context, 0, 0, 228, 64, 12);
  context.fillStyle = liveStatus === "Under Investigation" ? "#16120e" : "#f7ead1";
  context.font = `700 22px ${DEFAULT_FONT}`;
  context.textAlign = "center";
  context.fillText(stamp.text, 114, 40);
  context.restore();
}

function drawTopStrip(context: CanvasRenderingContext2D) {
  context.fillStyle = "#16120e";
  context.fillRect(CONTENT_X, 72, CONTENT_WIDTH, 52);

  context.fillStyle = "#e6bf47";
  context.fillRect(CONTENT_X, 72, 408, 52);

  context.fillStyle = "#16120e";
  context.font = `700 22px ${DEFAULT_FONT}`;
  context.textAlign = "left";
  context.fillText("CHAPPAL CRIME BUREAU", CONTENT_X + 18, 105);

  context.fillStyle = "#f2e6c8";
  context.font = `700 20px ${DEFAULT_FONT}`;
  context.fillText("PUBLIC FOOTWEAR NOTICE", CONTENT_X + 434, 104);
}

function drawHeadlineBlock(context: CanvasRenderingContext2D, caseRecord: CaseRecord, liveStatus: CaseStatus) {
  const headline =
    liveStatus === "Found / Case Closed" ? "CASE CLOSED - CHAPPAL RECOVERED" : "MISSING CHAPPAL";
  const fittedHeading = fitTextBlock(
    context,
    headline,
    CONTENT_WIDTH - 270,
    2,
    72,
    48,
    700,
    HEADING_FONT,
  );

  context.fillStyle = "#efe5d0";
  context.fillRect(CONTENT_X, 152, CONTENT_WIDTH, 104);
  context.strokeStyle = "#16120e";
  context.lineWidth = 5;
  context.strokeRect(CONTENT_X, 152, CONTENT_WIDTH, 104);

  context.fillStyle = "#16120e";
  context.fillRect(CONTENT_X + 18, 170, 196, 24);
  context.fillStyle = "#e6bf47";
  context.font = `700 13px ${DEFAULT_FONT}`;
  context.fillText("PUBLIC FILE HEADLINE", CONTENT_X + 28, 187);

  context.fillStyle = "#12100d";
  context.font = `700 ${fittedHeading.fontSize}px ${HEADING_FONT}`;
  drawWrappedLines(context, fittedHeading.lines, CONTENT_X + 26, 228, fittedHeading.fontSize + 4);

  context.fillStyle = "#6a5a3c";
  context.font = `700 18px ${DEFAULT_FONT}`;
  context.fillText(`FILE REF ${caseRecord.caseId}`, CONTENT_X + 24, 246);
}

function drawSectionFrame(
  context: CanvasRenderingContext2D,
  title: string,
  box: Rect,
  titleAccent = "#e6bf47",
) {
  context.fillStyle = "#16120e";
  context.fillRect(box.x, box.y, box.width, box.height);
  context.strokeStyle = "#16120e";
  context.lineWidth = 4;
  context.strokeRect(box.x, box.y, box.width, box.height);

  context.fillStyle = titleAccent;
  context.fillRect(box.x + 14, box.y + 14, box.width - 28, 34);
  context.fillStyle = "#16120e";
  context.font = `700 18px ${DEFAULT_FONT}`;
  context.textAlign = "left";
  context.fillText(title.toUpperCase(), box.x + 28, box.y + 37);
}

function drawClueBlock(context: CanvasRenderingContext2D, caseRecord: CaseRecord, box: Rect) {
  drawSectionFrame(context, "Last Seen Clue", box);
  context.fillStyle = "#efe5d0";
  context.fillRect(box.x + 18, box.y + 58, box.width - 36, box.height - 76);
  context.strokeStyle = "#16120e";
  context.lineWidth = 3;
  context.strokeRect(box.x + 18, box.y + 58, box.width - 36, box.height - 76);

  const fittedClue = fitTextBlock(
    context,
    normalizePosterText(caseRecord.lastSeenClue),
    box.width - 72,
    5,
    38,
    24,
    600,
    DEFAULT_FONT,
  );

  context.fillStyle = "#16120e";
  context.font = `600 ${fittedClue.fontSize}px ${DEFAULT_FONT}`;
  drawWrappedLines(
    context,
    fittedClue.lines,
    box.x + 36,
    box.y + 104,
    fittedClue.fontSize + 10,
  );
}

function drawSuspectBlock(context: CanvasRenderingContext2D, caseRecord: CaseRecord, box: Rect) {
  drawSectionFrame(context, "Citizen Suspect", box, "#d1ad49");
  context.fillStyle = "#efe5d0";
  context.fillRect(box.x + 18, box.y + 58, box.width - 36, box.height - 76);
  context.strokeStyle = "#16120e";
  context.lineWidth = 3;
  context.strokeRect(box.x + 18, box.y + 58, box.width - 36, box.height - 76);

  const fittedSuspect = fitTextBlock(
    context,
    normalizePosterText(caseRecord.primarySuspect, "No citizen suspect filed."),
    box.width - 72,
    3,
    32,
    22,
    700,
    DEFAULT_FONT,
  );

  context.fillStyle = "#16120e";
  context.font = `700 ${fittedSuspect.fontSize}px ${DEFAULT_FONT}`;
  drawWrappedLines(
    context,
    fittedSuspect.lines,
    box.x + 36,
    box.y + 102,
    fittedSuspect.fontSize + 8,
  );
}

function drawClosureBlock(
  context: CanvasRenderingContext2D,
  caseRecord: CaseRecord,
  box: Rect,
  options: PosterDownloadOptions,
) {
  drawSectionFrame(context, "Case Closure Report", box, "#7cab74");

  const innerX = box.x + 18;
  const innerY = box.y + 58;
  const innerWidth = box.width - 36;
  const gap = 14;
  const halfWidth = (innerWidth - gap) / 2;

  drawInfoCell(context, "Found at", caseRecord.closureFoundLocation || "Not recorded", {
    x: innerX,
    y: innerY,
    width: halfWidth,
    height: 92,
  });
  drawInfoCell(context, "Who took it", caseRecord.closureWhoTookIt || "Unknown", {
    x: innerX + halfWidth + gap,
    y: innerY,
    width: halfWidth,
    height: 92,
  });
  drawInfoCell(
    context,
    "Helpful Tip",
    options.helpfulTipMessage
      ? `${normalizePosterText(options.helpfulTipLabel, "Public tip")} - ${normalizePosterText(options.helpfulTipMessage)}`
      : "No reward-worthy tip recorded.",
    {
      x: innerX,
      y: innerY + 106,
      width: halfWidth,
      height: 132,
    },
    {
      maxLines: 4,
      startFontSize: 22,
      minFontSize: 15,
    },
  );
  drawInfoCell(
    context,
    "Reward delivered",
    caseRecord.closureRewardDelivered == null
      ? "Not specified"
      : caseRecord.closureRewardDelivered
        ? "Yes"
        : "No",
    {
      x: innerX + halfWidth + gap,
      y: innerY + 106,
      width: halfWidth,
      height: 132,
    },
    {
      maxLines: 3,
      startFontSize: 24,
      minFontSize: 16,
    },
  );

  const summaryBoxY = innerY + 252;
  context.fillStyle = "#e6dcc8";
  context.fillRect(innerX, summaryBoxY, innerWidth, box.height - (summaryBoxY - box.y) - 18);
  context.strokeStyle = "#16120e";
  context.lineWidth = 3;
  context.strokeRect(innerX, summaryBoxY, innerWidth, box.height - (summaryBoxY - box.y) - 18);

  context.fillStyle = "#16120e";
  context.font = `700 15px ${DEFAULT_FONT}`;
  context.fillText("CLOSURE SUMMARY", innerX + 16, summaryBoxY + 24);

  const summaryText = caseRecord.closureSummary || "No additional closure note was filed.";
  const fittedSummary = fitTextBlock(
    context,
    normalizePosterText(summaryText),
    innerWidth - 32,
    5,
    26,
    17,
    600,
    DEFAULT_FONT,
  );

  context.font = `600 ${fittedSummary.fontSize}px ${DEFAULT_FONT}`;
  drawWrappedLines(
    context,
    fittedSummary.lines,
    innerX + 16,
    summaryBoxY + 58,
    fittedSummary.fontSize + 8,
  );

  if (options.helpfulTipAttribution) {
    context.fillStyle = "#4a5d4d";
    context.font = `700 13px ${DEFAULT_FONT}`;
    context.fillText(
      `TIP CREDIT: ${normalizePosterText(options.helpfulTipAttribution)}`,
      innerX + 16,
      box.y + box.height - 22,
    );
  }
}

function drawFooter(context: CanvasRenderingContext2D) {
  const footerY = 1194;
  context.fillStyle = "#16120e";
  context.fillRect(CONTENT_X, footerY, CONTENT_WIDTH, 102);
  context.fillStyle = "#e6bf47";
  context.fillRect(CONTENT_X, footerY, CONTENT_WIDTH, 12);

  context.fillStyle = "#f2e6c8";
  context.font = `700 20px ${DEFAULT_FONT}`;
  context.textAlign = "left";
  context.fillText("No phone numbers. No exact addresses. No real tracking.", CONTENT_X + 24, footerY + 42);
  context.font = `600 18px ${DEFAULT_FONT}`;
  context.fillText("Report sightings on Chappal Crime Bureau.", CONTENT_X + 24, footerY + 72);

  context.save();
  context.translate(CONTENT_X + CONTENT_WIDTH - 278, footerY + 30);
  context.rotate(-0.06);
  context.strokeStyle = "#b43c2c";
  context.lineWidth = 4;
  context.strokeRect(0, 0, 250, 34);
  context.fillStyle = "#b43c2c";
  context.font = `700 17px ${DEFAULT_FONT}`;
  context.textAlign = "center";
  context.fillText("NOT A REAL POLICE DOCUMENT", 125, 23);
  context.restore();

  context.fillStyle = "#e6bf47";
  fillRoundedRect(context, CONTENT_X + CONTENT_WIDTH - 266, footerY + 60, 238, 26, 8);
  context.fillStyle = "#16120e";
  context.font = `700 15px ${DEFAULT_FONT}`;
  context.textAlign = "center";
  context.fillText("PUBLIC TRAUMA RECORD", CONTENT_X + CONTENT_WIDTH - 147, footerY + 78);
}

async function waitForFonts() {
  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready;
  }
}

export async function downloadPoster(
  caseRecord: CaseRecord,
  liveStatus: CaseStatus,
  options: PosterDownloadOptions = {},
) {
  await waitForFonts();

  const canvas = document.createElement("canvas");
  canvas.width = POSTER_WIDTH;
  canvas.height = POSTER_HEIGHT;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Poster rendering is not supported in this browser.");
  }

  drawPosterBackground(context, canvas.width, canvas.height);
  drawTopStrip(context);
  drawHeadlineBlock(context, caseRecord, liveStatus);
  drawStatusStamp(context, liveStatus);

  await drawCaseImage(context, caseRecord, {
    x: CONTENT_X,
    y: 292,
    width: 430,
    height: 468,
  });

  drawFactsPanel(context, caseRecord, liveStatus, {
    x: 530,
    y: 292,
    width: 478,
    height: 468,
  });

  if (liveStatus === "Found / Case Closed") {
    drawClosureBlock(
      context,
      caseRecord,
      {
        x: CONTENT_X,
        y: 792,
        width: CONTENT_WIDTH,
        height: 380,
      },
      options,
    );
  } else if (caseRecord.primarySuspect.trim()) {
    drawClueBlock(context, caseRecord, {
      x: CONTENT_X,
      y: 792,
      width: CONTENT_WIDTH,
      height: 218,
    });

    drawSuspectBlock(context, caseRecord, {
      x: CONTENT_X,
      y: 1028,
      width: CONTENT_WIDTH,
      height: 144,
    });
  } else {
    drawClueBlock(context, caseRecord, {
      x: CONTENT_X,
      y: 792,
      width: CONTENT_WIDTH,
      height: 380,
    });
  }

  drawFooter(context);

  downloadCanvas(
    canvas,
    `${caseRecord.caseId.toLowerCase()}-${
      liveStatus === "Found / Case Closed" ? "case-closed" : "missing-poster"
    }.png`,
  );
}
