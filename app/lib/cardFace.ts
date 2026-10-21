"use client";

import type { Project } from "../content";

// One project card, drawn into a 2D canvas. The carousel uploads it as the card's WebGL texture, the flip uses
// it as the front face, and the no-WebGL fallback shows it as is, so all three look the same.

export const FACE_W = 400;
export const FACE_H = 560;
export const FACE_SCALE = 2;
export const FACE_RADIUS = 26;
const PAD = 16;
// The preview recording plays in this box (16:10, like the recordings), over the poster drawn here.
export const VIDEO_BOX = { x: PAD, y: PAD, w: FACE_W - PAD * 2, h: ((FACE_W - PAD * 2) * 10) / 16, r: FACE_RADIUS - PAD };

// One nebula tint per project, used on its card, its hover glow and the floor beneath it.
const TINTS: Record<string, string> = {
  arachne: "#8d7dca",
  ledgerline: "#5b8fd6",
  rostra: "#d66bb0",
  relay: "#d9955b",
  fieldnote: "#4fb3a9",
  trawler: "#4a7bd9",
  terra: "#9b6bff",
};
export const tintOf = (id: string) => TINTS[id] ?? "#8d7dca";

export type Fonts = { display: string; mono: string; sans: string };

// The next/font families, read from the CSS variables the layout puts on <html>.
export function readFonts(): Fonts {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return { display: v("--font-display", "serif"), mono: v("--font-mono", "monospace"), sans: v("--font-geist-sans", "sans-serif") };
}

export async function loadFonts(f: Fonts) {
  await Promise.all([
    document.fonts.load(`italic 400 48px ${f.display}`),
    document.fonts.load(`400 11px ${f.mono}`),
    document.fonts.load(`500 11px ${f.mono}`),
    document.fonts.load(`400 13px ${f.sans}`),
  ]).catch(() => {});
}

function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const seedOf = (s: string) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, hex: string, a: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(hex, a));
  g.addColorStop(1, rgba(hex, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// Mono labels are letter-spaced by hand, since canvas letterSpacing isn't everywhere yet.
function trackedWidth(ctx: CanvasRenderingContext2D, text: string, tracking: number) {
  let w = 0;
  for (const ch of text) w += ctx.measureText(ch).width + tracking;
  return Math.max(0, w - tracking);
}

function tracked(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, tracking: number, align: "left" | "right" = "left") {
  let cx = align === "right" ? x - trackedWidth(ctx, text, tracking) : x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + tracking;
  }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const test = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(test).width > maxW) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, Math.max(1, maxLines));
  let last = kept[kept.length - 1];
  while (last.includes(" ") && ctx.measureText(`${last}…`).width > maxW) last = last.replace(/\s+\S+$/, "");
  kept[kept.length - 1] = `${last.replace(/[\s,.;:]+$/, "")}…`;
  return kept;
}

type Chip = { text: string; w: number };

// Tool chips in at most `maxRows` rows; anything that doesn't fit becomes a "+N" chip.
function layoutChips(ctx: CanvasRenderingContext2D, items: string[], maxW: number, maxRows: number, padX: number, gap: number, tracking: number) {
  const chip = (text: string): Chip => ({ text, w: trackedWidth(ctx, text, tracking) + padX * 2 });
  const width = (row: Chip[]) => row.reduce((s, c) => s + c.w, 0) + gap * Math.max(0, row.length - 1);
  const rows: Chip[][] = [[]];
  for (let i = 0; i < items.length; i++) {
    const c = chip(items[i].toUpperCase());
    const row = rows[rows.length - 1];
    if (row.length && width(row) + gap + c.w > maxW) {
      if (rows.length === maxRows) {
        let rest = items.length - i;
        let more = chip(`+${rest}`);
        while (row.length && width(row) + gap + more.w > maxW) {
          row.pop();
          more = chip(`+${++rest}`);
        }
        row.push(more);
        return rows;
      }
      rows.push([c]);
    } else row.push(c);
  }
  return rows;
}

export type FaceProject = Pick<Project, "id" | "title" | "kind" | "summary" | "stack" | "year"> & { num: string };

function cover(ctx: CanvasRenderingContext2D, src: CanvasImageSource, sw: number, sh: number, box: typeof VIDEO_BOX) {
  if (!sw || !sh) return;
  const k = Math.max(box.w / sw, box.h / sh);
  const w = sw * k;
  const h = sh * k;
  ctx.drawImage(src, box.x + (box.w - w) / 2, box.y + (box.h - h) / 2, w, h);
}

function videoFrame(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.roundRect(VIDEO_BOX.x + 0.5, VIDEO_BOX.y + 0.5, VIDEO_BOX.w - 1, VIDEO_BOX.h - 1, VIDEO_BOX.r);
  ctx.strokeStyle = "rgba(236, 230, 218, 0.14)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

export function drawFace(canvas: HTMLCanvasElement, p: FaceProject, fonts: Fonts, poster: HTMLImageElement | null) {
  canvas.width = FACE_W * FACE_SCALE;
  canvas.height = FACE_H * FACE_SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(FACE_SCALE, 0, 0, FACE_SCALE, 0, 0);
  ctx.clearRect(0, 0, FACE_W, FACE_H);
  const tint = tintOf(p.id);
  const inner = FACE_W - PAD * 2;

  // Deep space, lit by the project's nebula and a sprinkle of stars.
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, FACE_W, FACE_H, FACE_RADIUS);
  ctx.clip();
  const base = ctx.createLinearGradient(0, 0, 0, FACE_H);
  base.addColorStop(0, "#15132a");
  base.addColorStop(1, "#08070f");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, FACE_W, FACE_H);
  glow(ctx, FACE_W * 0.92, FACE_H * 0.56, 300, tint, 0.32);
  glow(ctx, FACE_W * 0.04, FACE_H * 1.02, 260, tint, 0.2);
  const rand = rng(seedOf(p.id));
  for (let i = 0; i < 48; i++) {
    ctx.globalAlpha = 0.12 + rand() * 0.4;
    ctx.fillStyle = "#ece6da";
    const r = 0.4 + rand() * 0.8;
    ctx.beginPath();
    ctx.arc(rand() * FACE_W, VIDEO_BOX.y + VIDEO_BOX.h + rand() * (FACE_H - VIDEO_BOX.h), r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Preview: the poster until the recording takes over.
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(VIDEO_BOX.x, VIDEO_BOX.y, VIDEO_BOX.w, VIDEO_BOX.h, VIDEO_BOX.r);
  ctx.clip();
  ctx.fillStyle = "#0b0b12";
  ctx.fillRect(VIDEO_BOX.x, VIDEO_BOX.y, VIDEO_BOX.w, VIDEO_BOX.h);
  if (poster?.naturalWidth) cover(ctx, poster, poster.naturalWidth, poster.naturalHeight, VIDEO_BOX);
  ctx.restore();
  videoFrame(ctx);

  ctx.textBaseline = "alphabetic";

  // Number and year.
  let y = VIDEO_BOX.y + VIDEO_BOX.h + 30;
  ctx.font = `400 10px ${fonts.mono}`;
  ctx.fillStyle = "rgba(236, 230, 218, 0.62)";
  tracked(ctx, p.num, PAD, y, 1.4);
  tracked(ctx, p.year, FACE_W - PAD, y, 1.4, "right");

  // Title, shrunk to fit one line.
  let size = 52;
  const title = p.title.toUpperCase();
  ctx.font = `italic 400 ${size}px ${fonts.display}`;
  while (ctx.measureText(title).width > inner && size > 26) {
    size -= 2;
    ctx.font = `italic 400 ${size}px ${fonts.display}`;
  }
  y += 10 + size * 0.82;
  ctx.save();
  ctx.shadowColor = "rgba(179, 168, 230, 0.4)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#ece6da";
  ctx.fillText(title, PAD, y);
  ctx.restore();
  // Instrument Serif has one weight; a same-colour stroke makes it bolder, like the hero name.
  ctx.strokeStyle = "#ece6da";
  ctx.lineWidth = 0.9;
  ctx.strokeText(title, PAD, y);

  // Subtitle.
  y += 22;
  ctx.font = `400 10.5px ${fonts.mono}`;
  ctx.fillStyle = "#b3a8e6";
  let kind = p.kind.toUpperCase();
  while (kind.length > 4 && trackedWidth(ctx, kind, 1.2) > inner) kind = `${kind.slice(0, -2).trimEnd()}…`;
  tracked(ctx, kind, PAD, y, 1.2);

  // Footer: the call to action, pinned to the bottom.
  const footY = FACE_H - PAD - 38;
  ctx.fillStyle = "rgba(236, 230, 218, 0.12)";
  ctx.fillRect(PAD, footY, inner, 1);
  const ctaY = FACE_H - PAD - 14;
  ctx.font = `500 10.5px ${fonts.mono}`;
  ctx.fillStyle = "#ece6da";
  tracked(ctx, "CLICK FOR CASE STUDY", PAD, ctaY, 1.5);
  const ax = FACE_W - PAD - 13;
  const ay = ctaY - 4;
  ctx.beginPath();
  ctx.arc(ax, ay, 13, 0, Math.PI * 2);
  ctx.fillStyle = rgba(tint, 0.22);
  ctx.fill();
  ctx.strokeStyle = "rgba(220, 214, 247, 0.55)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ax - 4, ay + 4);
  ctx.lineTo(ax + 4, ay - 4);
  ctx.moveTo(ax - 2.5, ay - 4);
  ctx.lineTo(ax + 4, ay - 4);
  ctx.lineTo(ax + 4, ay + 2.5);
  ctx.strokeStyle = "#ece6da";
  ctx.lineWidth = 1.3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  // Tools, bottom-aligned above the footer.
  ctx.font = `400 9.5px ${fonts.mono}`;
  const chipH = 22;
  const gap = 6;
  const rows = layoutChips(ctx, p.stack, inner, 2, 9, gap, 0.9);
  let cy = footY - 14 - rows.length * chipH - (rows.length - 1) * gap;
  const chipsTop = cy;
  for (const row of rows) {
    let cx = PAD;
    for (const c of row) {
      ctx.beginPath();
      ctx.roundRect(cx + 0.5, cy + 0.5, c.w - 1, chipH - 1, chipH / 2);
      ctx.strokeStyle = "rgba(236, 230, 218, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "rgba(236, 230, 218, 0.86)";
      tracked(ctx, c.text, cx + 9, cy + 14.5, 0.9);
      cx += c.w + gap;
    }
    cy += chipH + gap;
  }

  // Description fills what's left between the subtitle and the tools.
  ctx.font = `400 13px ${fonts.sans}`;
  ctx.fillStyle = "rgba(236, 230, 218, 0.74)";
  const lineH = 19.5;
  const top = y + 14;
  const lines = wrap(ctx, p.summary, inner, Math.floor((chipsTop - 12 - top) / lineH));
  lines.forEach((l, i) => ctx.fillText(l, PAD, top + 13 + i * lineH));

  // Edge: brighter along the top, like light catching a glass card.
  ctx.beginPath();
  ctx.roundRect(0.5, 0.5, FACE_W - 1, FACE_H - 1, FACE_RADIUS - 0.5);
  const edge = ctx.createLinearGradient(0, 0, 0, FACE_H);
  edge.addColorStop(0, "rgba(236, 230, 218, 0.36)");
  edge.addColorStop(0.45, "rgba(236, 230, 218, 0.1)");
  edge.addColorStop(1, "rgba(236, 230, 218, 0.2)");
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1;
  ctx.stroke();
}

// The card exactly as it looks right now, with the current video frame, for the front of the flip.
export function snapshot(face: HTMLCanvasElement, video?: HTMLVideoElement | null) {
  const c = document.createElement("canvas");
  c.width = face.width;
  c.height = face.height;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  ctx.drawImage(face, 0, 0);
  if (video && video.readyState >= 2) {
    ctx.setTransform(FACE_SCALE, 0, 0, FACE_SCALE, 0, 0);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(VIDEO_BOX.x, VIDEO_BOX.y, VIDEO_BOX.w, VIDEO_BOX.h, VIDEO_BOX.r);
    ctx.clip();
    cover(ctx, video, video.videoWidth, video.videoHeight, VIDEO_BOX);
    ctx.restore();
    videoFrame(ctx);
  }
  return c;
}
