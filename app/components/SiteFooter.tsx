"use client";

import { useEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import { openCaseStudy } from "../lib/openCase";
import { profile, projects } from "../content";

// Laid out after henry.codes: a stippled skyline rising out of space into a solid footer, columns of small
// labelled links, a large stippled ornament cut off at the right, and a serif sign-off.

const ICONS: Record<string, string> = {
  GitHub:
    "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  LinkedIn:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 4.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  Roque:
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.93 6h-2.95a15.65 15.65 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.93 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14a8.2 8.2 0 0 1 0-4h3.38a16.5 16.5 0 0 0 0 4H4.26zm.81 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.99 7.99 0 0 1 5.07 16zm2.95-8H5.07a7.99 7.99 0 0 1 4.33-3.56A15.65 15.65 0 0 0 8.02 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66a14.7 14.7 0 0 1 0-4h4.68a14.7 14.7 0 0 1 0 4zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56zM16.36 14a16.5 16.5 0 0 0 0-4h3.38a8.2 8.2 0 0 1 0 4h-3.38z",
  "Download CV":
    "M12 2a1 1 0 0 1 1 1v10.59l3.3-3.3a1 1 0 1 1 1.4 1.42l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 1 1 1.4-1.42l3.3 3.3V3a1 1 0 0 1 1-1zM4 19a1 1 0 0 1 1 1h14a1 1 0 1 1 2 0 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 1 1 0 0 1 1-1z",
};

const FOOT = "#0b0b12";

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function prep(c: HTMLCanvasElement, w: number, h: number) {
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  c.width = w * dpr;
  c.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return ctx;
}

// Stippled spires: a jagged skyline, dots dense and starlit at each crest, sinking into the solid footer.
function drawSkyline(c: HTMLCanvasElement) {
  const w = c.clientWidth;
  const h = c.clientHeight;
  const ctx = prep(c, w, h);
  if (!ctx) return;
  const rand = rng(7);

  const top = new Float32Array(Math.ceil(w) + 2).fill(h);
  for (let x = 0; x < w; ) {
    const sw = 24 + rand() * 70;
    const sh = h * (0.25 + rand() * 0.7);
    const lean = (rand() - 0.5) * 0.25;
    for (let i = 0; i < sw; i++) {
      const xi = Math.floor(x + i);
      if (xi > w) break;
      const edge = Math.min(i, sw - i) / sw; // rounder shoulders on each spire
      top[xi] = Math.min(top[xi], h - sh * (0.75 + 0.25 * Math.sqrt(edge * 2)) + i * lean);
    }
    x += sw * (0.45 + rand() * 0.5);
  }

  const step = 3;
  for (let x = 0; x < w; x += step) {
    const crest = top[Math.floor(x)];
    for (let y = Math.max(0, crest - 30); y < h; y += step) {
      const d = y - crest;
      const p = d < 0 ? Math.max(0, 0.18 + d / 160) : Math.min(1, 0.35 + d / 140);
      if (rand() > p) continue;
      const k = Math.min(1, Math.max(0, d / 170));
      const light = Math.round(205 - k * 190);
      ctx.fillStyle = `rgb(${light} ${light - 6} ${Math.min(255, light + 22)})`;
      const r = 0.7 + rand() * 0.9;
      ctx.fillRect(x + (rand() - 0.5) * step, y + (rand() - 0.5) * step, r, r);
    }
  }
  const g = ctx.createLinearGradient(0, h * 0.55, 0, h);
  g.addColorStop(0, "rgba(11, 11, 18, 0)");
  g.addColorStop(1, FOOT);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// Stippled ringed planet, standing in for henry.codes' crown of thorns.
function drawPlanet(c: HTMLCanvasElement) {
  const s = c.clientWidth;
  const ctx = prep(c, s, s);
  if (!ctx) return;
  const rand = rng(21);
  const cx = s / 2;
  const cy = s / 2;
  const R = s * 0.28;
  const tilt = -0.42;
  ctx.fillStyle = "#ece6da";

  const ring = (front: boolean) => {
    for (let i = 0; i < 2600; i++) {
      const a = rand() * Math.PI * 2;
      const rr = R * (1.45 + rand() * 0.55);
      const ex = Math.cos(a) * rr;
      const ey = Math.sin(a) * rr * 0.28;
      if (ey > 0 !== front) continue; // near half drawn over the planet, far half behind it
      const x = cx + ex * Math.cos(tilt) - ey * Math.sin(tilt);
      const y = cy + ex * Math.sin(tilt) + ey * Math.cos(tilt);
      if (!front && Math.hypot(x - cx, y - cy) < R) continue;
      ctx.globalAlpha = 0.35 + rand() * 0.65;
      ctx.fillRect(x, y, 1.3, 1.3);
    }
  };

  ring(false);
  for (let i = 0; i < 9000; i++) {
    const x = cx + (rand() * 2 - 1) * R;
    const y = cy + (rand() * 2 - 1) * R;
    const d = Math.hypot(x - cx, y - cy) / R;
    if (d > 1) continue;
    // Lit from the upper left.
    const lit = Math.max(0, ((cx - x) * 0.55 + (cy - y) * 0.55) / R + Math.sqrt(1 - d * d) * 0.7);
    if (rand() > lit * 0.9) continue;
    ctx.globalAlpha = 0.4 + rand() * 0.6;
    ctx.fillRect(x, y, 1.3, 1.3);
  }
  ring(true);
  ctx.globalAlpha = 1;
}

export default function SiteFooter() {
  const root = useRef<HTMLElement>(null);
  const sky = useRef<HTMLCanvasElement>(null);
  const planet = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const draw = () => {
      if (sky.current) drawSkyline(sky.current);
      if (planet.current) drawPlanet(planet.current);
    };
    draw();
    const ro = new ResizeObserver(draw);
    if (root.current) ro.observe(root.current);
    return () => ro.disconnect();
  }, []);

  return (
    <footer ref={root} className="sf" id="contact">
      <canvas ref={sky} className="sf-sky" aria-hidden="true" />
      <div className="sf-body">
        <canvas ref={planet} className="sf-planet" aria-hidden="true" />

        <div className="sf-cols">
          <div className="sf-col">
            <p className="sf-title">✦ Ver. 2026</p>
            <a
              href="#top"
              className="sf-link"
              onClick={(e) => {
                e.preventDefault();
                gsap.to(window, { scrollTo: 0, duration: 1.4, ease: "power3.inOut" });
              }}
            >
              Back to top <span aria-hidden="true">↑</span>
            </a>
          </div>

          <div className="sf-col">
            <p className="sf-title">Projects</p>
            <ul>
              {projects.map((p) => (
                <li key={p.id}>
                  <a
                    href={`/projects/${p.id}`}
                    className="sf-link"
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                      e.preventDefault();
                      openCaseStudy(p.id);
                    }}
                  >
                    {p.title}
                  </a>
                  <span className="sf-desc">{p.kind}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="sf-col">
            <p className="sf-title">Elsewhere</p>
            <ul>
              {profile.links.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="sf-link sf-icon"
                    download={l.href.endsWith(".pdf") || undefined}
                    target={l.href.startsWith("http") ? "_blank" : undefined}
                    rel={l.href.startsWith("http") ? "noreferrer" : undefined}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d={ICONS[l.label]} />
                    </svg>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="sf-col">
            <p className="sf-title">Contact</p>
            <a href={`mailto:${profile.email}`} className="sf-link">
              {profile.email}
            </a>
            <p className="sf-desc sf-status">{profile.status}</p>
          </div>
        </div>

        <div className="sf-sign">
          <span>© Sayef</span>
          <span>
            made in Brisbane <span aria-hidden="true">✦</span> Australia
          </span>
        </div>
      </div>
    </footer>
  );
}
