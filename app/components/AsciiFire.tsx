"use client";

import { useEffect, useRef } from "react";

// Oldschool "Doom fire": heat is fed along the bottom row, drifts upward with a little sideways
// jitter and cools as it rises. Each cell's heat picks a character from the ramp.
const RAMP = " ..::-/\\/\\+=*%abc01xyz#";
const FPS = 18;
const FONT_PX = 10;
const LINE = 1.15;

// `reach` is roughly how far up the box the flames climb, as a fraction of its height.
export default function AsciiFire({ className, reach = 0.7 }: { className?: string; reach?: number }) {
  const pre = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const el = pre.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let cols = 0;
    let rows = 0;
    let heat = new Uint8Array(0);
    let cool = 1;
    let frame = 0;
    let last = 0;
    const max = RAMP.length - 1;

    const resize = () => {
      // Geist Mono advances 0.6em per character.
      const c = Math.max(1, Math.floor(el.clientWidth / (FONT_PX * 0.6)));
      const r = Math.max(1, Math.floor(el.clientHeight / (FONT_PX * LINE)));
      if (c === cols && r === rows) return;
      cols = c;
      rows = r;
      heat = new Uint8Array(cols * rows);
      // Average heat lost per row, so taller boxes get taller flames.
      cool = (max + 2) / Math.max(1, rows * reach);
    };

    const step = (t: number) => {
      const base = cols * (rows - 1);
      for (let x = 0; x < cols; x++) {
        // Slow rolling swell along the floor, plus per-cell flicker. Squaring keeps most of the
        // floor cool, so the flame breaks into separate tongues.
        const swell = 0.5 + 0.5 * Math.sin(x * 0.19 + t * 0.6) * Math.cos(x * 0.053 - t * 0.4);
        heat[base + x] = Math.floor((0.3 + 0.7 * swell * swell) * (max + 2) + Math.random() * 3);
      }
      for (let y = 0; y < rows - 1; y++) {
        for (let x = 0; x < cols; x++) {
          const src = heat[(y + 1) * cols + x];
          const dx = Math.min(cols - 1, Math.max(0, x + ((Math.random() * 3) | 0) - 1));
          heat[y * cols + dx] = Math.max(0, src - Math.floor(Math.random() * (2 * cool + 1)));
        }
      }
    };

    const draw = () => {
      let out = "";
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) out += RAMP[Math.min(max, heat[y * cols + x])];
        out += "\n";
      }
      el.textContent = out;
    };

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (now - last < 1000 / FPS) return;
      last = now;
      step(now / 1000);
      draw();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    if (reduce) {
      // Settle into a still flame instead of animating.
      for (let i = 0; i < rows * 2; i++) step(i / FPS);
      draw();
    } else {
      frame = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [reach]);

  return <pre ref={pre} className={className} aria-hidden="true" />;
}
