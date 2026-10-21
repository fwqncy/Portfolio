"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../lib/gsap";

// The project scroller, after a "garden" progress bar: as it fills, little celestial blooms grow along it on
// threads of light (sparkles, orbs, ringed planets, crescent moons, tiny galaxies), a comet rides the head, and
// when it pulls back, the blooms it passes burst into stardust. Drag or click it, or use the arrow keys.

type Props = {
  count: number;
  index: number; // settled position, for the slider's value
  num: string;
  label: string;
  getPos: () => number; // continuous position, read every frame
  orientation?: "horizontal" | "vertical";
  running?: boolean;
  onScrub: (pos: number) => void;
  onRelease: () => void;
  onStep: (to: number) => void;
  className?: string;
};

const COLORS = ["#ffffff", "#dcd6f7", "#b3a8e6", "#8fb4ff", "#9cc4f5", "#f0a7c8", "#ffd38a"];
const FIELD = 64; // px of canvas beyond the track, room for blooms and drifting dust
const BASE = 14; // px of canvas on the near side of the track
const PAD = 14; // px of canvas past each end of the track
const HIT = 32; // the track's hit area, px across

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const easeOut = (k: number) => 1 - (1 - k) ** 3;
const backOut = (k: number) => 1 + 2.70158 * (k - 1) ** 3 + 1.70158 * (k - 1) ** 2;

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

function star(ctx: CanvasRenderingContext2D, outer: number, inner: number) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    const r = i % 2 ? inner : outer;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
}

// Each bloom is drawn once into a small sprite: the body, then its halo behind it.
function sprite(kind: number, color: string, size: number, dpr: number) {
  const R = Math.ceil(size * 4);
  const c = document.createElement("canvas");
  c.width = c.height = R * 2 * dpr;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  ctx.scale(dpr, dpr);
  ctx.translate(R, R);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  if (kind === 0) {
    // Sparkle
    star(ctx, size * 1.8, size * 0.32);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.32, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 1) {
    // Glowing orb
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    g.addColorStop(0, "#fff");
    g.addColorStop(0.5, color);
    g.addColorStop(1, rgba(color, 0.6));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 2) {
    // Ringed planet: back of the ring, the planet, then the front of the ring over it.
    ctx.save();
    ctx.rotate(-0.45);
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.75, size * 0.5, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.75, size * 0.5, 0, 0, Math.PI);
    ctx.stroke();
    ctx.restore();
  } else if (kind === 3) {
    // Crescent moon
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(size * 0.48, -size * 0.32, size * 0.86, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  } else if (kind === 4) {
    // Tiny spiral galaxy
    ctx.lineWidth = 0.9;
    for (const arm of [0, Math.PI]) {
      ctx.beginPath();
      for (let t = 0; t <= 1.001; t += 0.05) {
        const a = arm + t * 3.4;
        const r = size * (0.2 + t * 1.35);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.62);
      }
      ctx.stroke();
    }
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.38, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Star cluster
    for (const [x, y, r] of [
      [0, 0, 0.55],
      [size * 0.9, -size * 0.7, 0.4],
      [-size * 0.8, -size * 0.5, 0.35],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, size * r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalCompositeOperation = "destination-over";
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
  g.addColorStop(0, rgba(color, 0.5));
  g.addColorStop(0.35, rgba(color, 0.14));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(-R, -R, R * 2, R * 2);
  return c;
}

type Bloom = { a: number; h: number; phase: number; speed: number; grow: number; color: string; sprite: HTMLCanvasElement };
type Mote = { a: number; c: number; va: number; vc: number; life: number; max: number; size: number; rot: number; spin: number; color: string };

export default function GalaxyBar({
  count,
  index,
  num,
  label,
  getPos,
  orientation = "horizontal",
  running = true,
  onScrub,
  onRelease,
  onStep,
  className,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const dragging = useRef(false);
  const live = useRef(running);
  live.current = running;
  const vertical = orientation === "vertical";
  // Latest callbacks for the effect below without restarting it.
  const read = useRef(getPos);
  read.current = getPos;

  useEffect(() => {
    const el = canvas.current;
    const box = field.current;
    const ctx = el?.getContext("2d");
    if (!el || !box || !ctx) return;
    const reduce = prefersReducedMotion();
    const fill = () => clamp((read.current() + 1) / count, 0, 1);
    let L = 1;
    let dpr = 1;
    let cw = 1;
    let ch = 1;
    let head = 0;
    let blooms: Bloom[] = [];
    let motes: Mote[] = [];
    const dust = new Map<string, HTMLCanvasElement>();
    let raf = 0;
    let last = performance.now();
    let shown = "";
    let visible = false;

    const at = (a: number, c: number): [number, number] => (vertical ? [BASE + c, PAD + a] : [PAD + a, FIELD - c]);

    const setup = () => {
      L = Math.max(40, vertical ? box.clientHeight : box.clientWidth);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = vertical ? BASE + FIELD : L + PAD * 2;
      ch = vertical ? L + PAD * 2 : FIELD + BASE;
      el.width = Math.round(cw * dpr);
      el.height = Math.round(ch * dpr);
      el.style.width = `${cw}px`;
      el.style.height = `${ch}px`;
      head = fill() * L;
      const rand = rng(vertical ? 11 : 7);
      blooms = [];
      for (let a = 6 + rand() * 6; a < L - 4; a += 8 + rand() * 9) {
        const kind = [0, 0, 0, 1, 1, 2, 2, 3, 4, 5][(rand() * 10) | 0];
        const size = 1.8 + rand() * 2 + (kind === 2 || kind === 4 ? 0.6 : 0);
        const color = COLORS[(rand() * COLORS.length) | 0];
        blooms.push({
          a,
          h: 8 + rand() ** 1.3 * (FIELD - 24),
          phase: rand() * Math.PI * 2,
          speed: 1 + rand() * 2,
          grow: a <= head - 2 ? 1 : 0,
          color,
          sprite: sprite(kind, color, size, dpr),
        });
      }
      motes = [];
    };

    const mote = (color: string) => {
      let s = dust.get(color);
      if (!s) {
        s = sprite(0, color, 1.6, dpr);
        dust.set(color, s);
      }
      return s;
    };

    const burst = (b: Bloom, vel: number) => {
      const away = vel < 0 ? 1 : -1; // scatter the way the comet came from
      const n = 4 + ((Math.random() * 3) | 0);
      for (let i = 0; i < n && motes.length < 260; i++) {
        motes.push({
          a: b.a + (Math.random() - 0.5) * 4,
          c: b.h + (Math.random() - 0.5) * 4,
          va: away * (15 + Math.random() * 45) + (Math.random() - 0.5) * 20,
          vc: 10 + Math.random() * 40,
          life: 0,
          max: 0.9 + Math.random() * 0.8,
          size: 0.6 + Math.random() * 0.7,
          rot: Math.random() * 6,
          spin: (Math.random() - 0.5) * 8,
          color: b.color,
        });
      }
    };

    const draw = (t: number, vel: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      ctx.lineCap = "round";

      // Track, and the glowing fill up to the comet.
      const [x0, y0] = at(0, 0);
      const [x1, y1] = at(L, 0);
      const [hx, hy] = at(head, 0);
      ctx.strokeStyle = "rgba(236, 230, 218, 0.16)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      const g = ctx.createLinearGradient(x0, y0, hx + 0.01, hy + 0.01);
      g.addColorStop(0, "rgba(141, 125, 202, 0.5)");
      g.addColorStop(1, "#dcd6f7");
      ctx.strokeStyle = g;
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(179, 168, 230, 0.8)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(hx, hy);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Blooms: a thread of light grows out of the track, then the body pops open at its tip.
      for (const b of blooms) {
        if (b.grow <= 0) continue;
        const top = b.h * easeOut(clamp(b.grow / 0.55, 0, 1));
        const [sx, sy] = at(b.a, 0);
        const [tx, ty] = at(b.a, top);
        const sg = ctx.createLinearGradient(sx, sy, tx + 0.01, ty + 0.01);
        sg.addColorStop(0, rgba(b.color, 0.04));
        sg.addColorStop(1, rgba(b.color, 0.5));
        ctx.strokeStyle = sg;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        if (b.grow > 0.4) {
          const k = backOut(clamp((b.grow - 0.4) / 0.6, 0, 1));
          const s = (b.sprite.width / dpr) * k;
          ctx.globalAlpha = reduce ? 1 : 0.7 + 0.3 * Math.sin((t / 1000) * b.speed + b.phase);
          ctx.drawImage(b.sprite, tx - s / 2, ty - s / 2, s, s);
          ctx.globalAlpha = 1;
        }
      }

      // Stardust.
      for (const m of motes) {
        const [mx, my] = at(m.a, m.c);
        const s = (mote(m.color).width / dpr) * m.size;
        ctx.globalAlpha = (1 - m.life / m.max) ** 1.5;
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(m.rot);
        ctx.drawImage(mote(m.color), -s / 2, -s / 2, s, s);
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // The comet: a tail streaming back from wherever it's heading, and a bright head bobbing on the track.
      const dir = vel < -5 ? 1 : -1;
      const len = 16 + Math.min(70, Math.abs(vel) * 0.12);
      const [ex, ey] = at(clamp(head + dir * len, 0, L), 0);
      const tg = ctx.createLinearGradient(ex, ey, hx + 0.01, hy + 0.01);
      tg.addColorStop(0, "rgba(220, 214, 247, 0)");
      tg.addColorStop(1, "rgba(236, 232, 255, 0.95)");
      ctx.strokeStyle = tg;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(hx, hy);
      ctx.stroke();
      const bob = reduce ? 0 : Math.sin(t / 380) * 1.2;
      const [cx, cy] = at(head, bob);
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
      halo.addColorStop(0, "rgba(220, 214, 247, 0.7)");
      halo.addColorStop(0.3, "rgba(179, 168, 230, 0.28)");
      halo.addColorStop(1, "rgba(179, 168, 230, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(cx, cy, dragging.current ? 4 : 3.2, 0, Math.PI * 2);
      ctx.fill();
    };

    const step = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const f = fill();
      const prev = head;
      head = f * L;
      const vel = dt > 0 ? (head - prev) / dt : 0;
      const text = `${Math.round(f * 100)}%`;
      if (text !== shown && pct.current) pct.current.textContent = shown = text;

      for (const b of blooms) {
        if (b.a <= head - 2) b.grow = reduce ? 1 : Math.min(1, b.grow + dt / 0.75);
        else if (b.grow > 0) {
          if (b.grow > 0.5 && !reduce) burst(b, vel);
          b.grow = 0;
        }
      }
      if (!reduce && Math.abs(vel) > 40 && Math.random() < Math.min(0.8, Math.abs(vel) / 500) && motes.length < 260) {
        const back = vel > 0 ? -1 : 1;
        motes.push({
          a: head + back * 4,
          c: (Math.random() - 0.3) * 5,
          va: back * (10 + Math.random() * 20),
          vc: 6 + Math.random() * 14,
          life: 0,
          max: 0.5 + Math.random() * 0.5,
          size: 0.5 + Math.random() * 0.4,
          rot: 0,
          spin: 3,
          color: "#dcd6f7",
        });
      }
      motes = motes.filter((m) => {
        m.life += dt;
        m.a += m.va * dt;
        m.c += m.vc * dt;
        m.va *= 0.97;
        m.vc *= 0.985;
        m.rot += m.spin * dt;
        return m.life < m.max;
      });
      draw(t, vel);
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (!document.hidden && visible && live.current) step(t);
      else last = t;
    };

    setup();
    step(performance.now());
    raf = requestAnimationFrame(loop);
    const ro = new ResizeObserver(() => {
      setup();
      draw(performance.now(), 0);
    });
    ro.observe(box);
    const io = new IntersectionObserver((es) => (visible = es[es.length - 1].isIntersecting));
    if (root.current) io.observe(root.current);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [count, vertical]);

  const scrubFrom = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    const frac = vertical ? (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width;
    onScrub(clamp(frac * count - 1, 0, count - 1));
  };

  const end = () => {
    if (!dragging.current) return;
    dragging.current = false;
    onRelease();
  };

  return (
    <div ref={root} className={`gb ${className ?? ""}`} data-orientation={orientation}>
      <p className="gb-head mono">
        <span className="gb-label">
          <span className="gb-num">{num}</span> {label}
        </span>
        <span ref={pct} className="gb-pct" aria-hidden="true">
          {Math.round(((index + 1) / count) * 100)}%
        </span>
      </p>
      <div
        ref={field}
        className="gb-track"
        role="slider"
        tabIndex={0}
        aria-label="Projects"
        aria-orientation={orientation}
        aria-valuemin={1}
        aria-valuemax={count}
        aria-valuenow={index + 1}
        aria-valuetext={`${label}, ${index + 1} of ${count}`}
        style={{ [vertical ? "width" : "height"]: HIT }}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          dragging.current = true;
          scrubFrom(e);
        }}
        onPointerMove={(e) => dragging.current && scrubFrom(e)}
        onPointerUp={end}
        onPointerCancel={end}
        onKeyDown={(e) => {
          const by: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, PageDown: 1, ArrowLeft: -1, ArrowUp: -1, PageUp: -1 };
          let to: number | null = null;
          if (e.key in by) to = index + by[e.key];
          else if (e.key === "Home") to = 0;
          else if (e.key === "End") to = count - 1;
          if (to === null) return;
          e.preventDefault();
          onStep(clamp(to, 0, count - 1));
        }}
      >
        <canvas
          ref={canvas}
          className="gb-canvas"
          aria-hidden="true"
          style={vertical ? { left: HIT / 2 - BASE, top: -PAD } : { left: -PAD, top: HIT / 2 - FIELD }}
        />
      </div>
    </div>
  );
}
