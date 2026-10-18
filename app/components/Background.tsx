"use client";

import { useEffect, useRef } from "react";

// Deep-space backdrop: soft nebula clouds plus three depths of twinkling stars that drift with scroll.
type Star = { x: number; y: number; r: number; depth: number; phase: number; speed: number; hue: number };

const LAYERS = [
  { count: 0.00018, r: [0.4, 0.9], depth: 0.05 },
  { count: 0.00008, r: [0.8, 1.4], depth: 0.12 },
  { count: 0.000025, r: [1.3, 2.1], depth: 0.25 },
];
const HUES = [220, 250, 275, 40]; // icy blue, periwinkle, violet, the odd warm star

export default function Background() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stars: Star[] = [];
    let w = 0;
    let h = 0;
    let frame = 0;
    let last = 0;

    const seed = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      el.width = w * dpr;
      el.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = [];
      for (const L of LAYERS) {
        const n = Math.round(w * h * L.count);
        for (let i = 0; i < n; i++) {
          stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: L.r[0] + Math.random() * (L.r[1] - L.r[0]),
            depth: L.depth,
            phase: Math.random() * Math.PI * 2,
            speed: 0.4 + Math.random() * 1.4,
            hue: HUES[(Math.random() * HUES.length) | 0],
          });
        }
      }
    };

    const draw = (t: number) => {
      const sy = window.scrollY;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const y = (((s.y - sy * s.depth) % h) + h) % h;
        const tw = reduce ? 0.8 : 0.55 + 0.45 * Math.sin(t * 0.001 * s.speed + s.phase);
        ctx.globalAlpha = tw;
        ctx.fillStyle = `hsl(${s.hue} 70% 88%)`;
        ctx.beginPath();
        ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.r > 1.5) {
          // Bright stars get a faint cross glint.
          ctx.globalAlpha = tw * 0.35;
          ctx.fillRect(s.x - s.r * 4, y - 0.4, s.r * 8, 0.8);
          ctx.fillRect(s.x - 0.4, y - s.r * 4, 0.8, s.r * 8);
        }
      }
      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      frame = requestAnimationFrame(loop);
      if (document.hidden || t - last < 1000 / 30) return;
      last = t;
      draw(t);
    };

    seed();
    const onResize = () => {
      seed();
      draw(performance.now());
    };
    window.addEventListener("resize", onResize);
    const onScroll = () => draw(0);
    if (reduce) {
      draw(0);
      window.addEventListener("scroll", onScroll, { passive: true });
    } else {
      frame = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="bg" aria-hidden="true">
      <div className="bg-nebula" />
      <canvas ref={canvas} className="bg-canvas" />
    </div>
  );
}
