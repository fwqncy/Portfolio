"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "../lib/gsap";

// "SVG Shape Overlays" (GreenSock, after Blake Bowen): two wavy layers sweep across to cover the screen, the
// route changes underneath, then they carry on in the same direction to reveal it. "up" sweeps bottom to top
// (into a case study); "down" mirrors it top to bottom (back home).
const NUM_POINTS = 10;
const DELAY_POINTS_MAX = 0.12;
const DELAY_PER_PATH = 0.1;
const DURATION = 0.5;

type Dir = "up" | "down";
type Nav = (href: string, dir?: Dir) => void;
const Ctx = createContext<Nav>(() => {});
export const useTransitionNav = () => useContext(Ctx);

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const svg = useRef<SVGSVGElement>(null);
  const flip = useRef<SVGGElement>(null);
  const paths = useRef<SVGPathElement[]>([]);
  const points = useRef<number[][]>([]);
  const opened = useRef(false);
  const busy = useRef(false);
  const pending = useRef<string | null>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const current = useRef(pathname);
  current.current = pathname;

  const render = useCallback(() => {
    paths.current.forEach((path, i) => {
      const p = points.current[i];
      let d = opened.current ? `M 0 0 V ${p[0]} C` : `M 0 ${p[0]} C`;
      for (let j = 0; j < NUM_POINTS - 1; j++) {
        const x = ((j + 1) / (NUM_POINTS - 1)) * 100;
        const cp = x - (1 / (NUM_POINTS - 1)) * 50;
        d += ` ${cp} ${p[j]} ${cp} ${p[j + 1]} ${x} ${p[j + 1]}`;
      }
      d += opened.current ? " V 100 H 0" : " V 0 H 0";
      path.setAttribute("d", d);
    });
  }, []);

  // Animate every point from 100 to 0. Opened: the shape grows up from the bottom; closed: it leaves upward.
  const run = useCallback(
    (open: boolean, onComplete?: () => void) => {
      opened.current = open;
      points.current = paths.current.map(() => Array(NUM_POINTS).fill(100));
      const delays = Array.from({ length: NUM_POINTS }, () => Math.random() * DELAY_POINTS_MAX);
      tl.current?.kill();
      const t = gsap.timeline({ onUpdate: render, onComplete, defaults: { ease: "power2.inOut", duration: DURATION } });
      const n = paths.current.length;
      paths.current.forEach((_, i) => {
        const pathDelay = DELAY_PER_PATH * (open ? i : n - i - 1);
        for (let j = 0; j < NUM_POINTS; j++) t.to(points.current[i], { [j]: 0 }, delays[j] + pathDelay);
      });
      tl.current = t;
      render();
    },
    [render],
  );

  const reveal = useCallback(() => {
    requestAnimationFrame(() =>
      run(false, () => {
        busy.current = false;
        svg.current?.removeAttribute("data-active");
      }),
    );
  }, [run]);

  const navigate = useCallback<Nav>(
    (href, dir = "up") => {
      if (busy.current) return;
      if (prefersReducedMotion()) return router.push(href);
      busy.current = true;
      // Warm the destination so it's ready the moment the screen is covered.
      router.prefetch(href.split("#")[0] || "/");
      // Mirroring the drawing vertically turns the upward sweep into a downward one.
      flip.current?.setAttribute("transform", dir === "down" ? "translate(0 100) scale(1 -1)" : "");
      svg.current?.setAttribute("data-active", "true");
      run(true, () => {
        const target = href.split("#")[0] || "/";
        router.push(href);
        if (target === current.current) reveal(); // same page: no route change will fire
        else pending.current = target;
      });
    },
    [router, run, reveal],
  );

  // Once the new route has rendered, reveal it.
  useEffect(() => {
    if (!busy.current || pending.current === null) return;
    pending.current = null;
    reveal();
  }, [pathname, reveal]);

  return (
    <Ctx.Provider value={navigate}>
      {children}
      <svg ref={svg} className="pt" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="pt-g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1a1240" />
            <stop offset="1" stopColor="#8d7dca" />
          </linearGradient>
          <linearGradient id="pt-g2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#dcd6f7" />
            <stop offset="1" stopColor="#5b6bd6" />
          </linearGradient>
        </defs>
        <g ref={flip}>
          <path ref={(el) => void (el && (paths.current[0] = el))} fill="url(#pt-g2)" d="" />
          <path ref={(el) => void (el && (paths.current[1] = el))} fill="url(#pt-g1)" d="" />
        </g>
      </svg>
    </Ctx.Provider>
  );
}
