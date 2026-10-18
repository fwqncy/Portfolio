"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

// The intro, written as a small TypeScript file, with ASCII rings orbiting it like a planet.

const k = (t: string) => <span className="ac-key">{t}</span>;
const str = (t: string) => <span className="ac-str">&quot;{t}&quot;</span>;
const prop = (t: string) => <span className="ac-prop">{t}</span>;
const type = (t: string) => <span className="ac-type">{t}</span>;
const com = (t: string) => <span className="ac-com">{t}</span>;

const LINES: ReactNode[] = [
  com("// about-me.ts"),
  <>
    {k("export const")} {prop("sayef")}: {type("Engineer")} = {"{"}
  </>,
  <>
    {"  "}
    {prop("hello")}: {str("Hello, I’m Sayef")},
  </>,
  <>
    {"  "}
    {prop("studied")}: {str("a computer science graduate")},
  </>,
  <>
    {"  "}
    {prop("before")}: {str("who spent six years managing restaurants")},
  </>,
  <>
    {"  "}
    {prop("now")}: {str("and now builds software for the problems he actually lived.")},
  </>,
  <>{"};"}</>,
];

// Rings: rx/ry are fractions of the stage's width/height, `tilt` leans the orbit, `speed` is radians per second.
const RINGS = [
  { rx: 0.47, ry: 0.36, tilt: -0.16, speed: 0.22, count: 220 },
  { rx: 0.44, ry: 0.31, tilt: -0.16, speed: -0.15, count: 170 },
  { rx: 0.5, ry: 0.42, tilt: -0.16, speed: 0.1, count: 120 },
];
const DEPTH = " .·:+*✦";
// Rings sit a little above the stage's middle, so they wrap the code rather than hang below it.
const CENTER_Y = 0.42;
const FONT_PX = 12;
const LINE = 1.2;

function Aura() {
  const pre = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const el = pre.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cols = 0;
    let rows = 0;
    let frame = 0;
    let last = 0;

    const resize = () => {
      cols = Math.max(1, Math.floor(el.clientWidth / (FONT_PX * 0.6)));
      rows = Math.max(1, Math.floor(el.clientHeight / (FONT_PX * LINE)));
    };

    const draw = (t: number) => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      const grid: string[][] = Array.from({ length: rows }, () => Array<string>(cols).fill(" "));
      const level: number[][] = Array.from({ length: rows }, () => Array<number>(cols).fill(0));
      for (const r of RINGS) {
        const cos = Math.cos(r.tilt);
        const sin = Math.sin(r.tilt);
        for (let i = 0; i < r.count; i++) {
          const a = (i / r.count) * Math.PI * 2 + t * r.speed;
          // Points on the orbit: sin(a) > 0 is the near side (brighter), < 0 the far side (dimmer).
          const ex = Math.cos(a) * r.rx * W;
          const ey = Math.sin(a) * r.ry * H;
          const c = Math.round((W / 2 + ex * cos - ey * sin) / (FONT_PX * 0.6));
          const rr = Math.round((H * CENTER_Y + ex * sin + ey * cos) / (FONT_PX * LINE));
          if (c < 0 || c >= cols || rr < 0 || rr >= rows) continue;
          const near = (Math.sin(a) + 1) / 2;
          const lv = 1 + Math.round(near * (DEPTH.length - 2)) - (i % 7 === 0 ? 1 : 0);
          if (lv > level[rr][c]) {
            level[rr][c] = lv;
            grid[rr][c] = DEPTH[Math.max(1, lv)];
          }
        }
      }
      el.textContent = grid.map((row) => row.join("")).join("\n");
    };

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (now - last < 1000 / 24) return;
      last = now;
      draw(now / 1000);
    };

    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now() / 1000);
    });
    ro.observe(el);
    resize();
    if (reduce) draw(0);
    else frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, []);

  return <pre ref={pre} className="ac-aura" aria-hidden="true" />;
}

export default function AboutCode() {
  return (
    <section className="intro" aria-label="About">
      <Aura />
      <div className="ac">
        <pre className="ac-code mono" aria-label="Hello, I’m Sayef, a computer science graduate who spent six years managing restaurants and now builds software for the problems he actually lived.">
          <code aria-hidden="true">
            {LINES.map((l, i) => (
              <span key={i} className="ac-line">
                <span className="ac-ln">{i + 1}</span>
                {l}
                {i === LINES.length - 1 && <span className="ac-caret" />}
                {"\n"}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </section>
  );
}
