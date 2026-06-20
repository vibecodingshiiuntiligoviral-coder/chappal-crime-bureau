import { getDisplayHandle, pickChappalPalette } from "@/lib/case-helpers";
import type { CaseRecord, CaseStatus } from "@/types";

const POSTER_WIDTH = 1080;
const POSTER_HEIGHT = 1350;
const PAPER_INSET = 48;
const SAFE_X = 72;
const SAFE_Y = 68;
const SAFE_WIDTH = POSTER_WIDTH - SAFE_X * 2;
const TOP_STRIP_HEIGHT = 56;
const HEADER_HEIGHT = 180;
const MAIN_HEIGHT = 478;
const MIDDLE_HEIGHT = 328;
const FOOTER_HEIGHT = 112;
const SECTION_GAP = 18;
const COLUMN_GAP = 18;
const EVIDENCE_WIDTH = 422;
const FACTS_WIDTH = SAFE_WIDTH - EVIDENCE_WIDTH - COLUMN_GAP;
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

interface FittedText {
  fontSize: number;
  lineHeight: number;
  lines: string[];
}

type ImageFitMode = "contain" | "cover";

function normalizePosterText(value: string | null | undefined, fallback = "NOT FILED") {
  const normalized = (value ?? "").replace(/\s+/g, " ").trim();
  return normalized || fallback;
}

function splitLongToken(
  context: CanvasRenderingContext2D,
  token: string,
  maxWidth: number,
) {
  if (!token || context.measureText(token).width <= maxWidth) {
    return [token];
  }

  const parts: string[] = [];
  let current = "";

  for (const character of token) {
    const candidate = `${current}${character}`;
    if (current && context.measureText(candidate).width > maxWidth) {
      parts.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }

  if (current) {
    parts.push(current);
  }

  return parts;
}

function clampLineWithEllipsis(
  context: CanvasRenderingContext2D,
  line: string,
  maxWidth: number,
) {
  let trimmedLine = line.trimEnd();

  while (trimmedLine && context.measureText(`${trimmedLine}...`).width > maxWidth) {
    trimmedLine = trimmedLine.slice(0, -1).trimEnd();
  }

  return trimmedLine ? `${trimmedLine}...` : "...";
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

  const tokens = source
    .split(" ")
    .filter(Boolean)
    .flatMap((token) => splitLongToken(context, token, maxWidth));
  const lines: string[] = [];
  let currentLine = "";
  let hasOverflow = false;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const candidate = currentLine ? `${currentLine} ${token}` : token;

    if (currentLine && context.measureText(candidate).width > maxWidth) {
      lines.push(currentLine);
      currentLine = token;

      if (lines.length === maxLines) {
        hasOverflow = true;
        currentLine = "";
        break;
      }

      continue;
    }

    currentLine = candidate;
  }

  if (currentLine) {
    if (lines.length < maxLines) {
      lines.push(currentLine);
    } else {
      hasOverflow = true;
    }
  }

  if (hasOverflow && lines.length) {
    lines[lines.length - 1] = clampLineWithEllipsis(
      context,
      lines[lines.length - 1] ?? "",
      maxWidth,
    );
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
  options?: {
    lineHeightMultiplier?: number;
    maxHeight?: number;
  },
): FittedText {
  const lineHeightMultiplier = options?.lineHeightMultiplier ?? 1.24;

  for (let fontSize = startSize; fontSize >= minSize; fontSize -= 2) {
    context.font = `${weight} ${fontSize}px ${family}`;
    const lines = getWrappedLines(context, text, maxWidth, maxLines);
    const lineHeight = Math.ceil(fontSize * lineHeightMultiplier);
    const blockHeight =
      lines.length === 0 ? 0 : fontSize + Math.max(0, lines.length - 1) * lineHeight;

    if (!options?.maxHeight || blockHeight <= options.maxHeight) {
      return {
        fontSize,
        lineHeight,
        lines,
      };
    }
  }

  context.font = `${weight} ${minSize}px ${family}`;
  return {
    fontSize: minSize,
    lineHeight: Math.ceil(minSize * lineHeightMultiplier),
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

function drawWarningTapeBar(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const segmentWidth = 18;

  for (let segmentIndex = 0; segmentIndex * segmentWidth < width; segmentIndex += 1) {
    context.fillStyle = segmentIndex % 2 === 0 ? "#17120d" : "#e1b53f";
    context.fillRect(x + segmentIndex * segmentWidth, y, segmentWidth, height);
  }
}

function drawNoise(context: CanvasRenderingContext2D, width: number, height: number) {
  context.save();
  context.fillStyle = "rgba(32, 24, 15, 0.06)";

  for (let index = 0; index < 1200; index += 1) {
    const grainX = Math.random() * width;
    const grainY = Math.random() * height;
    const grainSize = Math.random() * 1.7 + 0.3;
    context.fillRect(grainX, grainY, grainSize, grainSize);
  }

  context.strokeStyle = "rgba(58, 43, 25, 0.08)";
  context.lineWidth = 1;

  for (let lineIndex = 0; lineIndex < 34; lineIndex += 1) {
    const lineY = PAPER_INSET + 18 + lineIndex * 35;
    context.beginPath();
    context.moveTo(PAPER_INSET + 18, lineY);
    context.lineTo(POSTER_WIDTH - PAPER_INSET - 18, lineY);
    context.stroke();
  }

  context.restore();
}

function drawPosterBackground(context: CanvasRenderingContext2D) {
  const outerGradient = context.createLinearGradient(0, 0, 0, POSTER_HEIGHT);
  outerGradient.addColorStop(0, "#8f7d61");
  outerGradient.addColorStop(0.5, "#74644c");
  outerGradient.addColorStop(1, "#8a7a60");
  context.fillStyle = outerGradient;
  context.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  context.fillStyle = "#17120d";
  context.fillRect(0, 0, POSTER_WIDTH, 24);
  context.fillRect(0, POSTER_HEIGHT - 24, POSTER_WIDTH, 24);

  const paperGradient = context.createLinearGradient(0, PAPER_INSET, 0, POSTER_HEIGHT - PAPER_INSET);
  paperGradient.addColorStop(0, "#efe6d2");
  paperGradient.addColorStop(0.55, "#e4d7bd");
  paperGradient.addColorStop(1, "#d9cbaf");
  context.fillStyle = paperGradient;
  context.fillRect(
    PAPER_INSET,
    PAPER_INSET,
    POSTER_WIDTH - PAPER_INSET * 2,
    POSTER_HEIGHT - PAPER_INSET * 2,
  );

  context.strokeStyle = "#17120d";
  context.lineWidth = 6;
  context.strokeRect(
    PAPER_INSET,
    PAPER_INSET,
    POSTER_WIDTH - PAPER_INSET * 2,
    POSTER_HEIGHT - PAPER_INSET * 2,
  );

  drawWarningTapeBar(context, PAPER_INSET + 18, PAPER_INSET + 18, 208, 12);
  drawWarningTapeBar(context, POSTER_WIDTH - PAPER_INSET - 226, PAPER_INSET + 18, 208, 12);
  drawWarningTapeBar(context, PAPER_INSET + 18, POSTER_HEIGHT - PAPER_INSET - 30, 208, 12);
  drawWarningTapeBar(
    context,
    POSTER_WIDTH - PAPER_INSET - 226,
    POSTER_HEIGHT - PAPER_INSET - 30,
    208,
    12,
  );

  drawNoise(context, POSTER_WIDTH, POSTER_HEIGHT);
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

function drawImageIntoFrame(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  frame: Rect,
  fitMode: ImageFitMode,
) {
  const imageRatio = image.width / image.height;
  const frameRatio = frame.width / frame.height;
  let drawWidth = frame.width;
  let drawHeight = frame.height;
  let drawX = frame.x;
  let drawY = frame.y;

  if (fitMode === "cover") {
    if (imageRatio > frameRatio) {
      drawHeight = frame.height;
      drawWidth = drawHeight * imageRatio;
      drawX = frame.x - (drawWidth - frame.width) / 2;
    } else {
      drawWidth = frame.width;
      drawHeight = drawWidth / imageRatio;
      drawY = frame.y - (drawHeight - frame.height) / 2;
    }
  } else if (imageRatio > frameRatio) {
    drawWidth = frame.width;
    drawHeight = drawWidth / imageRatio;
    drawY = frame.y + (frame.height - drawHeight) / 2;
  } else {
    drawHeight = frame.height;
    drawWidth = drawHeight * imageRatio;
    drawX = frame.x + (frame.width - drawWidth) / 2;
  }

  context.save();
  context.beginPath();
  context.rect(frame.x, frame.y, frame.width, frame.height);
  context.clip();
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  context.restore();
}

function drawCaseSketchPlaceholder(
  context: CanvasRenderingContext2D,
  caseRecord: CaseRecord,
  frame: Rect,
) {
  const palette = pickChappalPalette(caseRecord.color);
  const strapGradient = context.createLinearGradient(0, frame.y, 0, frame.y + frame.height);
  strapGradient.addColorStop(0, palette.secondary);
  strapGradient.addColorStop(1, palette.primary);

  context.fillStyle = "#e8deca";
  context.fillRect(frame.x, frame.y, frame.width, frame.height);

  context.strokeStyle = "rgba(23, 18, 13, 0.13)";
  context.lineWidth = 2;
  for (let index = -frame.height; index < frame.width; index += 26) {
    context.beginPath();
    context.moveTo(frame.x + index, frame.y);
    context.lineTo(frame.x + index + frame.height, frame.y + frame.height);
    context.stroke();
  }

  const soleWidth = frame.width * 0.28;
  const soleHeight = frame.height * 0.66;
  const leftX = frame.x + frame.width * 0.17;
  const rightX = frame.x + frame.width * 0.53;
  const soleY = frame.y + frame.height * 0.12;

  context.fillStyle = strapGradient;
  fillRoundedRect(context, leftX, soleY, soleWidth, soleHeight, 92);
  fillRoundedRect(context, rightX, soleY + frame.height * 0.04, soleWidth, soleHeight, 92);

  context.fillStyle = palette.accent;
  fillRoundedRect(context, leftX + 12, soleY + 52, soleWidth - 22, 20, 10);
  fillRoundedRect(context, leftX + 26, soleY + 108, soleWidth - 54, 18, 10);
  fillRoundedRect(context, rightX + 10, soleY + 46, soleWidth - 26, 20, 10);
  fillRoundedRect(context, rightX + 26, soleY + 116, soleWidth - 58, 18, 10);

  context.fillStyle = "rgba(18, 14, 9, 0.88)";
  fillRoundedRect(context, frame.x + 26, frame.y + frame.height - 98, frame.width - 52, 70, 12);

  context.fillStyle = "#f8efdb";
  context.font = `700 24px ${HEADING_FONT}`;
  context.textAlign = "center";
  context.fillText(
    "NO PHOTO FILED",
    frame.x + frame.width / 2,
    frame.y + frame.height - 58,
  );
  context.font = `600 16px ${DEFAULT_FONT}`;
  context.fillText(
    "Generated bureau sketch attached",
    frame.x + frame.width / 2,
    frame.y + frame.height - 32,
  );
}

function drawScenePlaceholder(context: CanvasRenderingContext2D, frame: Rect) {
  context.fillStyle = "#e8deca";
  context.fillRect(frame.x, frame.y, frame.width, frame.height);

  context.strokeStyle = "rgba(23, 18, 13, 0.12)";
  context.lineWidth = 2;
  for (let index = 0; index < frame.height; index += 24) {
    context.beginPath();
    context.moveTo(frame.x, frame.y + index);
    context.lineTo(frame.x + frame.width, frame.y + index);
    context.stroke();
  }

  context.strokeStyle = "#17120d";
  context.lineWidth = 4;
  context.strokeRect(frame.x + 24, frame.y + 24, frame.width - 48, frame.height - 48);
  context.beginPath();
  context.moveTo(frame.x + 24, frame.y + 24);
  context.lineTo(frame.x + frame.width - 24, frame.y + frame.height - 24);
  context.moveTo(frame.x + frame.width - 24, frame.y + 24);
  context.lineTo(frame.x + 24, frame.y + frame.height - 24);
  context.stroke();

  context.fillStyle = "#17120d";
  context.font = `700 18px ${HEADING_FONT}`;
  context.textAlign = "center";
  context.fillText(
    "SCENE IMAGE UNAVAILABLE",
    frame.x + frame.width / 2,
    frame.y + frame.height / 2 - 10,
  );
  context.font = `600 14px ${DEFAULT_FONT}`;
  context.fillText(
    "Public notice will proceed without this evidence.",
    frame.x + frame.width / 2,
    frame.y + frame.height / 2 + 18,
  );
}

function drawPanelShell(
  context: CanvasRenderingContext2D,
  title: string,
  box: Rect,
  accent = "#e1b53f",
  titleColor = "#17120d",
) {
  context.fillStyle = "#17120d";
  context.fillRect(box.x, box.y, box.width, box.height);
  context.strokeStyle = "#17120d";
  context.lineWidth = 4;
  context.strokeRect(box.x, box.y, box.width, box.height);

  context.fillStyle = accent;
  context.fillRect(box.x + 14, box.y + 14, box.width - 28, 34);
  context.fillStyle = titleColor;
  context.font = `700 18px ${DEFAULT_FONT}`;
  context.textAlign = "left";
  context.fillText(title.toUpperCase(), box.x + 26, box.y + 37);

  return {
    x: box.x + 18,
    y: box.y + 58,
    width: box.width - 36,
    height: box.height - 76,
  };
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
  context.fillStyle = "#efe5d0";
  context.fillRect(box.x, box.y, box.width, box.height);
  context.strokeStyle = "#17120d";
  context.lineWidth = 2;
  context.strokeRect(box.x, box.y, box.width, box.height);

  context.fillStyle = "#4f4330";
  context.font = `700 13px ${DEFAULT_FONT}`;
  context.textAlign = "left";
  context.fillText(label.toUpperCase(), box.x + 14, box.y + 22);

  const fittedValue = fitTextBlock(
    context,
    normalizePosterText(value),
    box.width - 28,
    options?.maxLines ?? 2,
    options?.startFontSize ?? 22,
    options?.minFontSize ?? 14,
    700,
    DEFAULT_FONT,
    {
      maxHeight: box.height - 40,
      lineHeightMultiplier: 1.22,
    },
  );

  context.fillStyle = "#17120d";
  context.font = `700 ${fittedValue.fontSize}px ${DEFAULT_FONT}`;
  drawWrappedLines(context, fittedValue.lines, box.x + 14, box.y + 48, fittedValue.lineHeight);
}

function getStatusStampConfig(liveStatus: CaseStatus) {
  if (liveStatus === "Found / Case Closed") {
    return {
      accent: "#4a7752",
      border: "#203c25",
      text: "FOUND / RECOVERED",
      textColor: "#f7efdb",
    };
  }

  if (liveStatus === "Under Investigation") {
    return {
      accent: "#e1b53f",
      border: "#17120d",
      text: "UNDER INVESTIGATION",
      textColor: "#17120d",
    };
  }

  return {
    accent: "#bb4736",
    border: "#6a2219",
    text: "MISSING",
    textColor: "#f7efdb",
  };
}

function drawTopStrip(context: CanvasRenderingContext2D) {
  context.fillStyle = "#17120d";
  context.fillRect(SAFE_X, SAFE_Y, SAFE_WIDTH, TOP_STRIP_HEIGHT);
  context.fillStyle = "#e1b53f";
  context.fillRect(SAFE_X, SAFE_Y, 366, TOP_STRIP_HEIGHT);

  context.fillStyle = "#17120d";
  context.font = `700 22px ${DEFAULT_FONT}`;
  context.textAlign = "left";
  context.fillText("CHAPPAL CRIME BUREAU", SAFE_X + 18, SAFE_Y + 37);

  context.fillStyle = "#f4e9d1";
  context.font = `700 20px ${DEFAULT_FONT}`;
  context.textAlign = "right";
  context.fillText("PUBLIC FOOTWEAR NOTICE", SAFE_X + SAFE_WIDTH - 18, SAFE_Y + 37);
}

function drawStatusStamp(context: CanvasRenderingContext2D, liveStatus: CaseStatus, box: Rect) {
  const stamp = getStatusStampConfig(liveStatus);

  context.fillStyle = "#1a150f";
  fillRoundedRect(context, box.x, box.y, box.width, box.height, 14);
  context.strokeStyle = stamp.border;
  context.lineWidth = 4;
  strokeRoundedRect(context, box.x, box.y, box.width, box.height, 14);

  context.fillStyle = "rgba(255, 255, 255, 0.08)";
  fillRoundedRect(context, box.x + 10, box.y + 10, box.width - 20, 28, 8);
  context.fillStyle = "#efe5d0";
  context.font = `700 11px ${DEFAULT_FONT}`;
  context.textAlign = "center";
  context.fillText("CURRENT STATUS", box.x + box.width / 2, box.y + 29);

  context.fillStyle = stamp.accent;
  fillRoundedRect(context, box.x + 12, box.y + 46, box.width - 24, box.height - 58, 10);

  const fittedStatus = fitTextBlock(
    context,
    stamp.text,
    box.width - 42,
    2,
    24,
    16,
    700,
    DEFAULT_FONT,
    {
      maxHeight: box.height - 78,
      lineHeightMultiplier: 1.12,
    },
  );

  context.fillStyle = stamp.textColor;
  context.font = `700 ${fittedStatus.fontSize}px ${DEFAULT_FONT}`;
  context.textAlign = "center";
  drawWrappedLines(
    context,
    fittedStatus.lines,
    box.x + box.width / 2,
    box.y + 74,
    fittedStatus.lineHeight,
  );
}

function drawHeaderBlock(
  context: CanvasRenderingContext2D,
  caseRecord: CaseRecord,
  liveStatus: CaseStatus,
) {
  const headerBox = {
    x: SAFE_X,
    y: SAFE_Y + TOP_STRIP_HEIGHT + 16,
    width: SAFE_WIDTH,
    height: HEADER_HEIGHT,
  };
  const headline =
    liveStatus === "Found / Case Closed" ? "CASE CLOSED - CHAPPAL RECOVERED" : "MISSING CHAPPAL";
  const stampBox = {
    x: headerBox.x + headerBox.width - 252,
    y: headerBox.y + 24,
    width: 224,
    height: 108,
  };
  const headlineWidth = headerBox.width - stampBox.width - 82;

  context.fillStyle = "#efe5d0";
  context.fillRect(headerBox.x, headerBox.y, headerBox.width, headerBox.height);
  context.strokeStyle = "#17120d";
  context.lineWidth = 4;
  context.strokeRect(headerBox.x, headerBox.y, headerBox.width, headerBox.height);

  context.fillStyle = "#bb4736";
  context.fillRect(headerBox.x, headerBox.y + headerBox.height - 10, headerBox.width, 10);

  context.fillStyle = "#4f4330";
  context.font = `700 17px ${DEFAULT_FONT}`;
  context.textAlign = "left";
  context.fillText(`FILE REF: ${caseRecord.caseId}`, headerBox.x + 24, headerBox.y + 40);

  context.strokeStyle = "rgba(23, 18, 13, 0.25)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(headerBox.x + 24, headerBox.y + 58);
  context.lineTo(headerBox.x + headlineWidth, headerBox.y + 58);
  context.stroke();

  const fittedHeadline = fitTextBlock(
    context,
    headline,
    headlineWidth,
    2,
    68,
    42,
    700,
    HEADING_FONT,
    {
      maxHeight: 96,
      lineHeightMultiplier: 1.06,
    },
  );

  context.fillStyle = "#17120d";
  context.font = `700 ${fittedHeadline.fontSize}px ${HEADING_FONT}`;
  context.textAlign = "left";
  drawWrappedLines(
    context,
    fittedHeadline.lines,
    headerBox.x + 24,
    headerBox.y + 112,
    fittedHeadline.lineHeight,
  );

  context.fillStyle = "#6d5d45";
  context.font = `700 14px ${DEFAULT_FONT}`;
  context.fillText(
    "Citizen circulation copy. Share without phone numbers.",
    headerBox.x + 24,
    headerBox.y + 150,
  );

  drawStatusStamp(context, liveStatus, stampBox);
}

async function drawEvidencePanel(
  context: CanvasRenderingContext2D,
  caseRecord: CaseRecord,
  box: Rect,
) {
  const content = drawPanelShell(context, "Evidence Image", box);
  context.fillStyle = "#e8deca";
  context.fillRect(content.x, content.y, content.width, content.height);
  context.strokeStyle = "#17120d";
  context.lineWidth = 3;
  context.strokeRect(content.x, content.y, content.width, content.height);

  const imageFrame = {
    x: content.x + 14,
    y: content.y + 14,
    width: content.width - 28,
    height: content.height - 28,
  };

  context.fillStyle = "#f5ecd8";
  context.fillRect(imageFrame.x, imageFrame.y, imageFrame.width, imageFrame.height);
  context.strokeStyle = "#17120d";
  context.lineWidth = 2;
  context.strokeRect(imageFrame.x, imageFrame.y, imageFrame.width, imageFrame.height);

  if (caseRecord.imageUrl) {
    try {
      const image = await loadPosterImage(caseRecord.imageUrl);
      drawImageIntoFrame(context, image, imageFrame, "contain");
      return;
    } catch {
      // Fall through to the bureau sketch placeholder.
    }
  }

  drawCaseSketchPlaceholder(context, caseRecord, imageFrame);
}

async function drawSceneEvidencePanel(
  context: CanvasRenderingContext2D,
  caseRecord: CaseRecord,
  box: Rect,
) {
  const content = drawPanelShell(context, "Scene Evidence", box, "#d8b44d");
  context.fillStyle = "#e8deca";
  context.fillRect(content.x, content.y, content.width, content.height);
  context.strokeStyle = "#17120d";
  context.lineWidth = 3;
  context.strokeRect(content.x, content.y, content.width, content.height);

  const imageFrame = {
    x: content.x + 12,
    y: content.y + 12,
    width: content.width - 24,
    height: content.height - 24,
  };

  context.fillStyle = "#f5ecd8";
  context.fillRect(imageFrame.x, imageFrame.y, imageFrame.width, imageFrame.height);
  context.strokeStyle = "#17120d";
  context.lineWidth = 2;
  context.strokeRect(imageFrame.x, imageFrame.y, imageFrame.width, imageFrame.height);

  if (caseRecord.sceneImageUrl) {
    try {
      const image = await loadPosterImage(caseRecord.sceneImageUrl);
      drawImageIntoFrame(context, image, imageFrame, "contain");
      return;
    } catch {
      // Fall through to the placeholder.
    }
  }

  drawScenePlaceholder(context, imageFrame);
}

function drawFactsPanel(
  context: CanvasRenderingContext2D,
  caseRecord: CaseRecord,
  box: Rect,
) {
  const content = drawPanelShell(context, "Case Facts", box);
  const gap = 8;
  const halfWidth = (content.width - gap) / 2;
  const handleValue = caseRecord.instagramHandle
    ? getDisplayHandle(caseRecord.instagramHandle)
    : "Not filed";
  let rowY = content.y;

  drawInfoCell(
    context,
    "Case ID",
    caseRecord.caseId,
    {
      x: content.x,
      y: rowY,
      width: content.width,
      height: 48,
    },
    {
      maxLines: 1,
      startFontSize: 22,
      minFontSize: 15,
    },
  );
  rowY += 56;

  drawInfoCell(
    context,
    "Nickname",
    caseRecord.nickname,
    {
      x: content.x,
      y: rowY,
      width: content.width,
      height: 58,
    },
    {
      maxLines: 2,
      startFontSize: 24,
      minFontSize: 16,
    },
  );
  rowY += 66;

  drawInfoCell(
    context,
    "Type",
    caseRecord.type,
    {
      x: content.x,
      y: rowY,
      width: halfWidth,
      height: 56,
    },
    {
      maxLines: 2,
      startFontSize: 20,
      minFontSize: 14,
    },
  );
  drawInfoCell(
    context,
    "Color",
    caseRecord.color,
    {
      x: content.x + halfWidth + gap,
      y: rowY,
      width: halfWidth,
      height: 56,
    },
    {
      maxLines: 2,
      startFontSize: 20,
      minFontSize: 14,
    },
  );
  rowY += 64;

  drawInfoCell(
    context,
    "Area",
    caseRecord.area,
    {
      x: content.x,
      y: rowY,
      width: halfWidth,
      height: 68,
    },
    {
      maxLines: 3,
      startFontSize: 20,
      minFontSize: 14,
    },
  );
  drawInfoCell(
    context,
    "Crime Scene",
    caseRecord.crimeScene,
    {
      x: content.x + halfWidth + gap,
      y: rowY,
      width: halfWidth,
      height: 68,
    },
    {
      maxLines: 2,
      startFontSize: 19,
      minFontSize: 14,
    },
  );
  rowY += 76;

  drawInfoCell(
    context,
    "Threat Level",
    caseRecord.threatLevel,
    {
      x: content.x,
      y: rowY,
      width: halfWidth,
      height: 56,
    },
    {
      maxLines: 2,
      startFontSize: 20,
      minFontSize: 14,
    },
  );
  drawInfoCell(
    context,
    "Reward",
    caseRecord.reward,
    {
      x: content.x + halfWidth + gap,
      y: rowY,
      width: halfWidth,
      height: 56,
    },
    {
      maxLines: 3,
      startFontSize: 18,
      minFontSize: 13,
    },
  );
  rowY += 64;

  drawInfoCell(
    context,
    "Public Handle",
    handleValue,
    {
      x: content.x,
      y: rowY,
      width: content.width,
      height: 50,
    },
    {
      maxLines: 2,
      startFontSize: 18,
      minFontSize: 13,
    },
  );
}

function drawCluePanel(context: CanvasRenderingContext2D, caseRecord: CaseRecord, box: Rect) {
  const content = drawPanelShell(context, "Last Seen Clue", box);
  context.fillStyle = "#efe5d0";
  context.fillRect(content.x, content.y, content.width, content.height);
  context.strokeStyle = "#17120d";
  context.lineWidth = 3;
  context.strokeRect(content.x, content.y, content.width, content.height);

  const fittedClue = fitTextBlock(
    context,
    normalizePosterText(caseRecord.lastSeenClue),
    content.width - 36,
    box.height > 260 ? 6 : 4,
    box.width > 500 ? 34 : 28,
    18,
    600,
    DEFAULT_FONT,
    {
      maxHeight: content.height - 40,
      lineHeightMultiplier: 1.22,
    },
  );

  context.fillStyle = "#17120d";
  context.font = `600 ${fittedClue.fontSize}px ${DEFAULT_FONT}`;
  context.textAlign = "left";
  drawWrappedLines(context, fittedClue.lines, content.x + 18, content.y + 42, fittedClue.lineHeight);
}

function drawSuspectPanel(context: CanvasRenderingContext2D, caseRecord: CaseRecord, box: Rect) {
  const content = drawPanelShell(context, "Citizen Suspect", box, "#d6ad48");
  context.fillStyle = "#efe5d0";
  context.fillRect(content.x, content.y, content.width, content.height);
  context.strokeStyle = "#17120d";
  context.lineWidth = 3;
  context.strokeRect(content.x, content.y, content.width, content.height);

  const fittedSuspect = fitTextBlock(
    context,
    normalizePosterText(caseRecord.primarySuspect, "No citizen suspect filed."),
    content.width - 36,
    4,
    24,
    15,
    700,
    DEFAULT_FONT,
    {
      maxHeight: content.height - 40,
      lineHeightMultiplier: 1.18,
    },
  );

  context.fillStyle = "#17120d";
  context.font = `700 ${fittedSuspect.fontSize}px ${DEFAULT_FONT}`;
  context.textAlign = "left";
  drawWrappedLines(
    context,
    fittedSuspect.lines,
    content.x + 18,
    content.y + 38,
    fittedSuspect.lineHeight,
  );
}

function buildHelpfulTipValue(options: PosterDownloadOptions) {
  if (!options.helpfulTipMessage) {
    return "No public tip credited.";
  }

  const parts = [
    normalizePosterText(options.helpfulTipLabel, "Public tip"),
    normalizePosterText(options.helpfulTipMessage),
  ];

  if (options.helpfulTipAttribution) {
    parts.push(`Tip by: ${normalizePosterText(options.helpfulTipAttribution)}`);
  }

  return parts.join(" - ");
}

function drawClosurePanel(
  context: CanvasRenderingContext2D,
  caseRecord: CaseRecord,
  box: Rect,
  options: PosterDownloadOptions,
) {
  const content = drawPanelShell(context, "Case Closure Report", box, "#89b07c");
  const gap = 10;
  const halfWidth = (content.width - gap) / 2;
  let rowY = content.y;

  drawInfoCell(
    context,
    "Found At",
    caseRecord.closureFoundLocation || "Not recorded",
    {
      x: content.x,
      y: rowY,
      width: halfWidth,
      height: 64,
    },
    {
      maxLines: 3,
      startFontSize: 20,
      minFontSize: 14,
    },
  );
  drawInfoCell(
    context,
    "Who Took It",
    caseRecord.closureWhoTookIt || "Unknown",
    {
      x: content.x + halfWidth + gap,
      y: rowY,
      width: halfWidth,
      height: 64,
    },
    {
      maxLines: 3,
      startFontSize: 20,
      minFontSize: 14,
    },
  );
  rowY += 74;

  drawInfoCell(
    context,
    "Helpful Tip",
    buildHelpfulTipValue(options),
    {
      x: content.x,
      y: rowY,
      width: halfWidth,
      height: 74,
    },
    {
      maxLines: 4,
      startFontSize: 16,
      minFontSize: 12,
    },
  );
  drawInfoCell(
    context,
    "Reward Delivered",
    caseRecord.closureRewardDelivered == null
      ? "Not specified"
      : caseRecord.closureRewardDelivered
        ? "Yes"
        : "No",
    {
      x: content.x + halfWidth + gap,
      y: rowY,
      width: halfWidth,
      height: 74,
    },
    {
      maxLines: 3,
      startFontSize: 22,
      minFontSize: 14,
    },
  );
  rowY += 84;

  drawInfoCell(
    context,
    "Closure Summary",
    caseRecord.closureSummary || "No additional closure note was filed.",
    {
      x: content.x,
      y: rowY,
      width: content.width,
      height: content.height - (rowY - content.y),
    },
    {
      maxLines: 4,
      startFontSize: 19,
      minFontSize: 13,
    },
  );
}

function drawFooter(context: CanvasRenderingContext2D) {
  const footerBox = {
    x: SAFE_X,
    y: SAFE_Y + TOP_STRIP_HEIGHT + 16 + HEADER_HEIGHT + SECTION_GAP + MAIN_HEIGHT + SECTION_GAP + MIDDLE_HEIGHT + SECTION_GAP,
    width: SAFE_WIDTH,
    height: FOOTER_HEIGHT,
  };

  context.fillStyle = "#17120d";
  context.fillRect(footerBox.x, footerBox.y, footerBox.width, footerBox.height);
  context.strokeStyle = "#17120d";
  context.lineWidth = 4;
  context.strokeRect(footerBox.x, footerBox.y, footerBox.width, footerBox.height);

  context.fillStyle = "#bb4736";
  context.fillRect(footerBox.x, footerBox.y, footerBox.width, 8);

  context.fillStyle = "#f5ebd5";
  context.font = `700 19px ${DEFAULT_FONT}`;
  context.textAlign = "left";
  context.fillText(
    "No phone numbers. No exact addresses. No real tracking.",
    footerBox.x + 22,
    footerBox.y + 40,
  );

  context.font = `600 15px ${DEFAULT_FONT}`;
  context.fillText(
    "Report sightings on Chappal Crime Bureau.",
    footerBox.x + 22,
    footerBox.y + 68,
  );

  context.save();
  context.translate(footerBox.x + footerBox.width - 280, footerBox.y + 22);
  context.rotate(-0.05);
  context.strokeStyle = "#bb4736";
  context.lineWidth = 4;
  context.strokeRect(0, 0, 250, 34);
  context.fillStyle = "#bb4736";
  context.font = `700 16px ${DEFAULT_FONT}`;
  context.textAlign = "center";
  context.fillText("NOT A REAL POLICE DOCUMENT", 125, 22);
  context.restore();

  context.fillStyle = "#e1b53f";
  fillRoundedRect(context, footerBox.x + footerBox.width - 258, footerBox.y + 58, 226, 28, 8);
  context.fillStyle = "#17120d";
  context.font = `700 15px ${DEFAULT_FONT}`;
  context.textAlign = "center";
  context.fillText(
    "PUBLIC TRAUMA RECORD",
    footerBox.x + footerBox.width - 145,
    footerBox.y + 77,
  );
}

async function waitForFonts() {
  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready;
  }
}

function getMainSectionRect() {
  return {
    x: SAFE_X,
    y: SAFE_Y + TOP_STRIP_HEIGHT + 16 + HEADER_HEIGHT + SECTION_GAP,
    width: SAFE_WIDTH,
    height: MAIN_HEIGHT,
  };
}

function getMiddleSectionRect() {
  const mainBox = getMainSectionRect();
  return {
    x: SAFE_X,
    y: mainBox.y + mainBox.height + SECTION_GAP,
    width: SAFE_WIDTH,
    height: MIDDLE_HEIGHT,
  };
}

async function drawMissingMiddleSection(
  context: CanvasRenderingContext2D,
  caseRecord: CaseRecord,
  middleBox: Rect,
) {
  const hasSuspect = Boolean(caseRecord.primarySuspect.trim());
  const hasSceneEvidence =
    caseRecord.sceneImageStatus === "active" && Boolean(caseRecord.sceneImageUrl);

  if (hasSceneEvidence) {
    const clueWidth = 578;
    const sideWidth = middleBox.width - clueWidth - COLUMN_GAP;
    const sideX = middleBox.x + clueWidth + COLUMN_GAP;

    drawCluePanel(context, caseRecord, {
      x: middleBox.x,
      y: middleBox.y,
      width: clueWidth,
      height: middleBox.height,
    });

    if (hasSuspect) {
      const suspectHeight = 142;
      drawSuspectPanel(context, caseRecord, {
        x: sideX,
        y: middleBox.y,
        width: sideWidth,
        height: suspectHeight,
      });
      await drawSceneEvidencePanel(context, caseRecord, {
        x: sideX,
        y: middleBox.y + suspectHeight + SECTION_GAP,
        width: sideWidth,
        height: middleBox.height - suspectHeight - SECTION_GAP,
      });
      return;
    }

    await drawSceneEvidencePanel(context, caseRecord, {
      x: sideX,
      y: middleBox.y,
      width: sideWidth,
      height: middleBox.height,
    });
    return;
  }

  if (hasSuspect) {
    const suspectHeight = 144;
    drawCluePanel(context, caseRecord, {
      x: middleBox.x,
      y: middleBox.y,
      width: middleBox.width,
      height: middleBox.height - suspectHeight - SECTION_GAP,
    });
    drawSuspectPanel(context, caseRecord, {
      x: middleBox.x,
      y: middleBox.y + middleBox.height - suspectHeight,
      width: middleBox.width,
      height: suspectHeight,
    });
    return;
  }

  drawCluePanel(context, caseRecord, middleBox);
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

  drawPosterBackground(context);
  drawTopStrip(context);
  drawHeaderBlock(context, caseRecord, liveStatus);

  const mainBox = getMainSectionRect();
  await drawEvidencePanel(context, caseRecord, {
    x: mainBox.x,
    y: mainBox.y,
    width: EVIDENCE_WIDTH,
    height: MAIN_HEIGHT,
  });
  drawFactsPanel(context, caseRecord, {
    x: mainBox.x + EVIDENCE_WIDTH + COLUMN_GAP,
    y: mainBox.y,
    width: FACTS_WIDTH,
    height: MAIN_HEIGHT,
  });

  const middleBox = getMiddleSectionRect();
  if (liveStatus === "Found / Case Closed") {
    drawClosurePanel(context, caseRecord, middleBox, options);
  } else {
    await drawMissingMiddleSection(context, caseRecord, middleBox);
  }

  drawFooter(context);

  downloadCanvas(
    canvas,
    `${caseRecord.caseId.toLowerCase()}-${
      liveStatus === "Found / Case Closed" ? "case-closed" : "missing-poster"
    }.png`,
  );
}
