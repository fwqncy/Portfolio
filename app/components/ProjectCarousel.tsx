"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import CaseGradient from "./CaseGradient";
import CaseStudy from "./CaseStudy";
import GalaxyBar from "./GalaxyBar";
import { gsap, prefersReducedMotion, ScrollTrigger } from "../lib/gsap";
import { drawFace, FACE_RADIUS, FACE_W, loadFonts, readFonts, snapshot, tintOf } from "../lib/cardFace";
import { computeLayout, createStage, type Rect, type Stage } from "../lib/cardStage";
import { OPEN_CASE } from "../lib/openCase";
import type { Project } from "../content";

// Projects as a row of cards. Terra, the newest, starts in the middle, and moving right (click a side card, drag,
// swipe, the arrow keys or the galaxy bar) walks back through older work. Clicking the middle card flips it over
// and zooms in to its case study on the back. The URL follows (/projects/terra), so Back closes it again.

const BAR_ZONE = 150; // px kept clear under the cards for the galaxy bar
const INSET = 12; // px between the open case study and the screen edge (matches .cs in globals.css)
const PANEL_RADIUS = 24;

const pad = (i: number) => String(i + 1).padStart(2, "0");
const rubber = (x: number) => x / (1 + x * 2.2);
const fromHome = () => (window.history.state as { fromHome?: boolean } | null)?.fromHome === true;
const lockScroll = (on: boolean) => document.documentElement.classList.toggle("is-locked", on);
const rectOf = (el: Element): Rect => {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
};
const panelRect = (): Rect => {
  const { clientWidth: w, clientHeight: h } = document.documentElement;
  return { x: INSET, y: INSET, w: w - INSET * 2, h: h - INSET * 2 };
};

// Where the card ends up halfway through opening: flipped, centred and a little closer.
function zoomRect(card: Rect, panel: Rect): Rect {
  const k = Math.min(1.25, (panel.h * 0.92) / card.h, (panel.w * 0.92) / card.w);
  const w = card.w * k;
  const h = card.h * k;
  return { x: panel.x + (panel.w - w) / 2, y: panel.y + (panel.h - h) / 2, w, h };
}

// clip-path for the open panel (rect d), from the card's rect r (t = 0) to the whole panel (t = 1).
function clipBetween(r: Rect, d: Rect, fromRadius: number, t: number) {
  const m = (a: number) => a * (1 - t);
  const top = m(r.y - d.y);
  const right = m(d.x + d.w - (r.x + r.w));
  const bottom = m(d.y + d.h - (r.y + r.h));
  const left = m(r.x - d.x);
  const radius = fromRadius + (PANEL_RADIUS - fromRadius) * t;
  return `inset(${top}px ${right}px ${bottom}px ${left}px round ${radius}px)`;
}

type Flip = { wrap: HTMLDivElement; card: HTMLDivElement };

// A DOM stand-in for the card while it turns over: its face on the front, the case study's gradient on the back.
function makeFlip(front: HTMLCanvasElement, card: Rect, zoom: Rect, panel: Rect): Flip {
  const k = zoom.w / card.w;
  const wrap = document.createElement("div");
  wrap.className = "flip";
  wrap.setAttribute("aria-hidden", "true");
  Object.assign(wrap.style, { left: `${card.x}px`, top: `${card.y}px`, width: `${card.w}px`, height: `${card.h}px` });
  wrap.style.setProperty("--r", `${FACE_RADIUS * (card.w / FACE_W)}px`);
  const inner = document.createElement("div");
  inner.className = "flip-card";
  front.className = "flip-face flip-front";
  const back = document.createElement("div");
  back.className = "flip-face flip-back";
  // Lined up with where the panel will be, so the hand-over to it is seamless.
  back.style.backgroundSize = `${panel.w / k}px ${panel.h / k}px`;
  back.style.backgroundPosition = `${(panel.x - zoom.x) / k}px ${(panel.y - zoom.y) / k}px`;
  inner.append(front, back);
  wrap.append(inner);
  document.body.append(wrap);
  gsap.set(inner, { transformPerspective: card.w * 4 });
  return { wrap, card: inner };
}

// The offset that moves a card from rect a to rect b around its centre.
const shift = (a: Rect, b: Rect) => ({ x: b.x + b.w / 2 - (a.x + a.w / 2), y: b.y + b.h / 2 - (a.y + a.h / 2), scale: b.w / a.w });

type Drag = { id: number; x0: number; y0: number; p0: number; moved: boolean; lx: number; lt: number; vx: number };

export default function ProjectCarousel({ projects, openId }: { projects: Project[]; openId?: string }) {
  // Newest first.
  const order = useMemo(() => [...projects].reverse(), [projects]);
  const n = order.length;
  const numOf = useCallback((d: number) => pad(n - 1 - d), [n]);
  const start = Math.max(0, openId ? order.findIndex((p) => p.id === openId) : 0);

  const root = useRef<HTMLDivElement>(null);
  const stageBox = useRef<HTMLDivElement>(null);
  const hit = useRef<HTMLAnchorElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const faces = useRef<HTMLCanvasElement[]>([]);
  const stage = useRef<Stage | null>(null);
  const pos = useRef({ v: start });
  const activeRef = useRef(start);
  const caseRef = useRef<number | null>(openId ? start : null);
  const busy = useRef(false);
  const pushed = useRef(false);
  const skipPop = useRef(false);
  const pendingClose = useRef(false);
  const inView = useRef(false);
  const reduce = useRef(false);
  const drag = useRef<Drag | null>(null);
  const justDragged = useRef(false);
  const scrubTarget = useRef(start);
  const ready = useRef<{ promise: Promise<void>; resolve: () => void } | null>(null);
  if (!ready.current) {
    let resolve = () => {};
    const promise = new Promise<void>((r) => (resolve = r));
    ready.current = { promise, resolve };
  }
  const [active, setActive] = useState(start);
  const [caseD, setCaseD] = useState<number | null>(openId ? start : null);
  const [built, setBuilt] = useState(false);

  const getPos = useCallback(() => pos.current.v, []);
  // Scrolls the page (out of sight behind the open case study) so the carousel fills the screen.
  const park = useCallback(() => {
    const top = root.current?.getBoundingClientRect().top ?? 0;
    if (Math.abs(top) > 0.5) window.scrollTo({ top: window.scrollY + top, behavior: "instant" });
  }, []);
  const chrome = () => root.current?.querySelectorAll<HTMLElement>(".pcx-chrome") ?? [];
  const canvasEl = () => stageBox.current?.querySelector<HTMLElement>(".pcx-canvas") ?? null;

  // Follows the position: which card is in the middle, and which recording plays.
  const sync = useCallback(() => {
    const v = pos.current.v;
    const r = Math.max(0, Math.min(n - 1, Math.round(v)));
    if (r !== activeRef.current) {
      activeRef.current = r;
      setActive(r);
    }
    const settled = Math.abs(v - r) < 0.01;
    root.current?.toggleAttribute("data-moving", !settled);
    const play = settled && inView.current && caseRef.current === null && !reduce.current;
    videos.current.forEach((el, i) => {
      if (!el) return;
      if (play && i === r) {
        if (el.paused) {
          el.preload = "auto";
          el.play().catch(() => {});
        }
      } else if (!el.paused) el.pause();
    });
  }, [n]);

  // Resolves true once the carousel arrives, false if something else took over first.
  const goTo = useCallback(
    (d: number) =>
      new Promise<boolean>((resolve) => {
        const to = Math.max(0, Math.min(n - 1, Math.round(d)));
        const dist = Math.abs(to - pos.current.v);
        gsap.killTweensOf(pos.current);
        if (dist < 0.001 || reduce.current) {
          pos.current.v = to;
          sync();
          resolve(true);
          return;
        }
        gsap.to(pos.current, {
          v: to,
          duration: Math.min(1.5, 0.8 + 0.16 * dist),
          ease: "power3.inOut",
          onUpdate: sync,
          onComplete: () => {
            sync();
            resolve(true);
          },
          onInterrupt: () => resolve(false),
        });
      }),
    [n, sync],
  );

  // Scrubbing from the galaxy bar: follow the pointer closely, settle on release.
  const scrubTo = useCallback(
    (p: number) => {
      scrubTarget.current = p;
      gsap.to(pos.current, { v: p, duration: reduce.current ? 0 : 0.35, ease: "power3.out", overwrite: true, onUpdate: sync });
    },
    [sync],
  );

  const placeHit = useCallback(() => {
    const box = stageBox.current;
    if (!box || !root.current) return;
    const L = computeLayout(box.clientWidth, box.clientHeight, BAR_ZONE);
    root.current.style.setProperty("--cw", `${L.W}px`);
    root.current.style.setProperty("--ch", `${L.H}px`);
    root.current.style.setProperty("--cy", `${L.centerY}px`);
  }, []);

  // Build the cards once the section gets close, then only animate them while it's on screen.
  useEffect(() => {
    reduce.current = prefersReducedMotion();
    const box = stageBox.current;
    const el = root.current;
    if (!box || !el) return;
    let cancelled = false;
    let made: Stage | null = null;
    const fonts = readFonts();
    const canvases = order.map(() => document.createElement("canvas"));
    const posters: (HTMLImageElement | null)[] = order.map(() => null);
    faces.current = canvases;
    const paint = (d: number) => drawFace(canvases[d], { ...order[d], num: numOf(d) }, fonts, posters[d]);

    const init = async () => {
      await loadFonts(fonts);
      if (cancelled) return;
      order.forEach((_, d) => paint(d));
      made = createStage(box, {
        faces: canvases,
        videos: videos.current,
        tints: order.map((p) => tintOf(p.id)),
        getPos: () => pos.current.v,
        barZone: BAR_ZONE,
      });
      stage.current = made;
      if (caseRef.current !== null) {
        made.hidden = caseRef.current;
        made.dim = 0;
        gsap.set(canvasEl(), { scale: 1.08 });
      }
      made.setRunning(inView.current && caseRef.current === null);
      setBuilt(true);
      ready.current?.resolve();
      // Newest first, so the cards on screen get their posters soonest.
      order.forEach((p, d) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          if (cancelled) return;
          posters[d] = img;
          paint(d);
          made?.updateFace(d);
        };
        img.src = p.video?.poster ?? p.image;
      });
    };

    let started = false;
    const begin = () => {
      if (started) return;
      started = true;
      near.disconnect();
      init();
    };
    // Entries can arrive batched; the last one is the current state.
    const near = new IntersectionObserver((es) => es[es.length - 1].isIntersecting && begin(), { rootMargin: "800px 0px" });
    near.observe(el);
    if (caseRef.current !== null) begin(); // a case study is open: the cards are needed to close it

    const seen = new IntersectionObserver((es) => {
      inView.current = es[es.length - 1].isIntersecting;
      stage.current?.setRunning(inView.current && caseRef.current === null);
      sync();
    });
    seen.observe(el);
    placeHit();
    const ro = new ResizeObserver(placeHit);
    ro.observe(box);

    return () => {
      cancelled = true;
      near.disconnect();
      seen.disconnect();
      ro.disconnect();
      made?.dispose();
      stage.current = null;
    };
  }, [order, numOf, placeHit, sync]);

  const openCase = useCallback(
    async (d: number, push: boolean) => {
      if (busy.current || caseRef.current !== null) return;
      busy.current = true;
      try {
        if (!(await goTo(d))) return;
        await ready.current?.promise;
        const dlg = dialog.current;
        if (!dlg) return;
        if (push) {
          // Tagged, so coming back to this entry later (Forward) knows Back leads home.
          window.history.pushState({ fromHome: true }, "", `/projects/${order[d].id}`);
          pushed.current = true;
        }
        caseRef.current = d;
        flushSync(() => setCaseD(d));
        sync();
        lockScroll(true);
        const stg = stage.current;
        const card = stg?.cardRect(d);
        stg?.pointer(null);

        if (reduce.current || !stg || !card) {
          if (stg) {
            stg.hidden = d;
            stg.dim = 0;
            stg.setRunning(false);
          }
          gsap.set(chrome(), { autoAlpha: 0 });
          dlg.showModal();
          dlg.focus({ preventScroll: true });
          await gsap.fromTo(dlg, { opacity: 0 }, { opacity: 1, duration: 0.2, clearProps: "opacity" });
          return;
        }

        const panel = panelRect();
        const zoom = zoomRect(card, panel);
        const flip = makeFlip(snapshot(faces.current[d], videos.current[d]), card, zoom, panel);
        stg.hidden = d;

        // 1. The card turns over and comes toward you, while the rest of the carousel falls away behind it.
        const dim = { v: stg.dim };
        await gsap
          .timeline({ defaults: { duration: 0.8, ease: "power2.inOut" } })
          .to(flip.card, { rotationY: 180 }, 0)
          .to(flip.wrap, shift(card, zoom), 0)
          .to(dim, { v: 0, duration: 0.5, ease: "power1.in", onUpdate: () => void (stg.dim = dim.v) }, 0)
          .to(canvasEl(), { scale: 1.08 }, 0)
          .to(chrome(), { autoAlpha: 0, duration: 0.4 }, 0);

        // 2. Its back opens out into the case study.
        dlg.setAttribute("data-phase", "opening");
        dlg.showModal();
        dlg.focus({ preventScroll: true });
        const box = rectOf(dlg);
        const from = FACE_RADIUS * (zoom.w / FACE_W);
        const t = { v: 0 };
        const clip = () => void (dlg.style.clipPath = clipBetween(zoom, box, from, t.v));
        clip();
        flip.wrap.remove();
        stg.setRunning(false);
        await gsap.to(t, { v: 1, duration: 0.75, ease: "power3.inOut", onUpdate: clip });
        dlg.style.clipPath = "";
        dlg.removeAttribute("data-phase");
        gsap.fromTo(
          dlg.querySelectorAll(".cs-reveal, .cs-chrome"),
          { y: 24, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.05, ease: "power3.out", clearProps: "transform,opacity,visibility" },
        );
      } finally {
        busy.current = false;
        if (pendingClose.current) {
          pendingClose.current = false;
          closeRef.current(true);
        }
      }
    },
    [goTo, order, sync],
  );

  const closeCase = useCallback(
    async (fromHistory = false) => {
      const d = caseRef.current;
      if (d === null) return;
      if (busy.current) {
        if (fromHistory) pendingClose.current = true;
        return;
      }
      busy.current = true;
      try {
        if (!fromHistory) {
          if (pushed.current) {
            skipPop.current = true;
            window.history.back();
          } else window.history.replaceState(null, "", "/");
        }
        pushed.current = false;
        const dlg = dialog.current;
        if (!dlg) return;
        await ready.current?.promise;
        const stg = stage.current;
        // The project may have changed inside the panel: put its card in the middle, out of sight. Pinning and
        // late fonts can also have moved the page under the panel, so bring the carousel back into view.
        gsap.killTweensOf(pos.current);
        pos.current.v = d;
        sync();
        park();

        if (reduce.current || !stg) {
          await gsap.to(dlg, { opacity: 0, duration: 0.2 });
          dlg.close();
          dlg.style.opacity = "";
          if (stg) {
            stg.hidden = -1;
            stg.dim = 1;
          }
          gsap.set(chrome(), { autoAlpha: 1 });
        } else {
          stg.resize();
          stg.pointer(null);
          stg.setRunning(true);
          const panel = panelRect();
          const box = rectOf(dlg);

          // 1. The case study fades and folds back down to the size of the card...
          await gsap.to(dlg.querySelectorAll(".cs-scroll, .cs-chrome"), { autoAlpha: 0, duration: 0.25 });
          const card = stg.cardRect(d);
          const zoom = zoomRect(card, panel);
          const to = FACE_RADIUS * (zoom.w / FACE_W);
          const t = { v: 1 };
          const clip = () => void (dlg.style.clipPath = clipBetween(zoom, box, to, t.v));
          await gsap.to(t, { v: 0, duration: 0.6, ease: "power3.inOut", onUpdate: clip });

          // 2. ...and turns back over into its place in the carousel.
          const flip = makeFlip(snapshot(faces.current[d], videos.current[d]), card, zoom, panel);
          gsap.set(flip.card, { rotationY: 180 });
          gsap.set(flip.wrap, shift(card, zoom));
          dlg.close();
          dlg.style.clipPath = "";
          gsap.set(dlg.querySelectorAll(".cs-scroll, .cs-chrome"), { clearProps: "opacity,visibility" });
          const dim = { v: 0 };
          await gsap
            .timeline({ defaults: { duration: 0.8, ease: "power2.inOut" } })
            .to(flip.card, { rotationY: 0 }, 0)
            .to(flip.wrap, { x: 0, y: 0, scale: 1 }, 0)
            .to(canvasEl(), { scale: 1 }, 0)
            .to(dim, { v: 1, duration: 0.6, ease: "power1.out", onUpdate: () => void (stg.dim = dim.v) }, 0.2)
            .to(chrome(), { autoAlpha: 1, duration: 0.5 }, 0.3);
          stg.hidden = -1;
          flip.wrap.remove();
        }
        lockScroll(false);
        caseRef.current = null;
        setCaseD(null);
        stg?.setRunning(inView.current);
        sync();
        hit.current?.focus({ preventScroll: true });
      } finally {
        busy.current = false;
      }
    },
    [park, sync],
  );
  const closeRef = useRef(closeCase);
  closeRef.current = closeCase;

  // Another project, without leaving the case study: the content cross-fades and the card behind follows.
  const selectCase = useCallback(
    async (d: number, replace = true) => {
      const cur = caseRef.current;
      if (cur === null || busy.current) return;
      const to = Math.max(0, Math.min(n - 1, d));
      goTo(to);
      if (to === cur) return;
      busy.current = true;
      try {
        if (replace) window.history.replaceState({ fromHome: fromHome() }, "", `/projects/${order[to].id}`);
        const body = scroller.current;
        if (!reduce.current && body) await gsap.to(body, { autoAlpha: 0, y: -16, duration: 0.22, ease: "power2.in" });
        caseRef.current = to;
        if (stage.current) stage.current.hidden = to;
        flushSync(() => setCaseD(to));
        if (body) {
          body.scrollTop = 0;
          gsap.set(body, { clearProps: "opacity,visibility,transform" });
        }
        if (!reduce.current && dialog.current) {
          gsap.fromTo(
            dialog.current.querySelectorAll(".cs-reveal"),
            { y: 24, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.04, ease: "power3.out", clearProps: "transform,opacity,visibility" },
          );
        }
      } finally {
        busy.current = false;
      }
    },
    [goTo, n, order],
  );

  // Back and Forward open and close case studies; footer links open them from anywhere on the page.
  useEffect(() => {
    const onPop = () => {
      if (skipPop.current) {
        skipPop.current = false;
        return;
      }
      const id = window.location.pathname.match(/^\/projects\/([^/]+)/)?.[1];
      const d = id ? order.findIndex((p) => p.id === id) : -1;
      if (d === -1) closeCase(true);
      else if (caseRef.current === null) {
        pushed.current = fromHome();
        openCase(d, false);
      } else selectCase(d, false);
    };
    const onOpen = (e: Event) => {
      const d = order.findIndex((p) => p.id === (e as CustomEvent<string>).detail);
      if (d === -1) return;
      if (caseRef.current !== null) return void selectCase(d);
      const el = root.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (Math.abs(r.top) < window.innerHeight * 0.2) return void openCase(d, true);
      gsap.to(window, {
        scrollTo: { y: el },
        duration: reduce.current ? 0 : 1.1,
        ease: "power2.inOut",
        onComplete: () => void openCase(d, true),
      });
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener(OPEN_CASE, onOpen);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener(OPEN_CASE, onOpen);
    };
  }, [order, openCase, closeCase, selectCase]);

  // Opened at /projects/<id>: the case study is already showing (server-rendered); park the carousel under it.
  useEffect(() => {
    const dlg = dialog.current;
    if (!openId || !dlg || !dlg.hasAttribute("data-static")) return;
    ScrollTrigger.refresh();
    park();
    requestAnimationFrame(park); // beat any router scroll
    lockScroll(true);
    dlg.removeAttribute("data-static");
    if (!dlg.open) dlg.showModal();
    dlg.focus({ preventScroll: true });
    gsap.set(chrome(), { autoAlpha: 0 });
  }, [openId, park]);

  // Horizontal trackpad swipes step through the cards; vertical scrolling is left alone.
  useEffect(() => {
    const el = stageBox.current;
    if (!el) return;
    let acc = 0;
    let locked = false;
    let timer = 0;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || caseRef.current !== null) return;
      e.preventDefault();
      acc += e.deltaX;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        acc = 0;
        locked = false;
      }, 180);
      if (!locked && Math.abs(acc) > 40) {
        locked = true;
        goTo(activeRef.current + Math.sign(acc));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.clearTimeout(timer);
    };
  }, [goTo]);

  const unit = () => (stage.current?.layout.spacing ?? 400) * 0.9;

  const hoverAt = (e: React.PointerEvent<HTMLDivElement>) => {
    const stg = stage.current;
    if (e.pointerType !== "mouse" || !stg || busy.current || caseRef.current !== null) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const over = stg.pointer(x, y);
    const el = root.current;
    if (!el) return;
    el.toggleAttribute("data-hover", over === "centre");
    el.toggleAttribute("data-hover-side", over === "side");
    el.style.setProperty("--mx", over === "centre" ? ((x - r.width / 2) / stg.layout.W).toFixed(3) : "0");
    el.style.setProperty("--my", over === "centre" ? ((y - stg.layout.centerY) / stg.layout.H).toFixed(3) : "0");
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || busy.current) return;
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, p0: pos.current.v, moved: false, lx: e.clientX, lt: e.timeStamp, vx: 0 };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = drag.current;
    if (!g || g.id !== e.pointerId) return hoverAt(e);
    const dx = e.clientX - g.x0;
    if (!g.moved) {
      if (Math.abs(dx) < 6) return;
      // Mostly vertical: it's a scroll, not a drag.
      if (Math.abs(e.clientY - g.y0) > Math.abs(dx)) {
        drag.current = null;
        return;
      }
      g.moved = true;
      gsap.killTweensOf(pos.current);
      e.currentTarget.setPointerCapture(e.pointerId);
      stage.current?.pointer(null);
      root.current?.removeAttribute("data-hover");
      root.current?.removeAttribute("data-hover-side");
      root.current?.setAttribute("data-dragging", "");
    }
    const dt = e.timeStamp - g.lt;
    if (dt > 0) {
      g.vx = 0.7 * ((e.clientX - g.lx) / dt) + 0.3 * g.vx;
      g.lx = e.clientX;
      g.lt = e.timeStamp;
    }
    // Past either end it gives a little, then pulls back.
    let p = g.p0 - dx / unit();
    if (p < 0) p = -rubber(-p);
    else if (p > n - 1) p = n - 1 + rubber(p - (n - 1));
    pos.current.v = p;
    sync();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = drag.current;
    drag.current = null;
    if (!g || g.id !== e.pointerId || !g.moved) return;
    root.current?.removeAttribute("data-dragging");
    justDragged.current = true;
    window.setTimeout(() => (justDragged.current = false), 0);
    // A flick carries on to the next card even if it didn't get halfway.
    const fling = Math.max(-1.4, Math.min(1.4, (-g.vx * 160) / unit()));
    let to = Math.round(pos.current.v + fling);
    if (to === Math.round(g.p0) && Math.abs(e.clientX - g.x0) > 40) to += e.clientX < g.x0 ? 1 : -1;
    goTo(to);
  };

  // The browser took the gesture over (a scroll, usually): settle on the nearest card.
  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = drag.current;
    drag.current = null;
    if (!g || g.id !== e.pointerId || !g.moved) return;
    root.current?.removeAttribute("data-dragging");
    goTo(pos.current.v);
  };

  // Clicking a side card brings it to the middle.
  const onStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const L = stage.current?.layout;
    if (!L || justDragged.current || busy.current || hit.current?.contains(e.target as Node)) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    if (Math.abs(e.clientY - r.top - L.centerY) > L.H * 0.7) return;
    if (x < -L.W / 2) goTo(activeRef.current - 1);
    else if (x > L.W / 2) goTo(activeRef.current + 1);
  };

  const onHit = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; // new tab etc. stay native
    e.preventDefault();
    if (!justDragged.current) openCase(activeRef.current, true);
  };

  const p = order[active];
  const c = caseD === null ? null : order[caseD];

  return (
    <div
      ref={root}
      className="pcx"
      role="region"
      aria-roledescription="carousel"
      aria-label="Projects"
      data-built={built || undefined}
      onKeyDown={(e) => {
        if (e.defaultPrevented || caseRef.current !== null) return;
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        goTo(activeRef.current + (e.key === "ArrowRight" ? 1 : -1));
      }}
    >
      <div
        ref={stageBox}
        className="pcx-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={() => {
          stage.current?.pointer(null);
          root.current?.removeAttribute("data-hover");
          root.current?.removeAttribute("data-hover-side");
          root.current?.style.setProperty("--mx", "0");
          root.current?.style.setProperty("--my", "0");
        }}
        onClick={onStageClick}
      >
        <div className="pcx-ambient pcx-chrome" aria-hidden="true">
          <div className="pcx-glow" style={{ "--tint": tintOf(p.id) } as React.CSSProperties} />
        </div>
        <div className="pcx-videos" aria-hidden="true">
          {order.map((q, d) =>
            q.video ? (
              <video
                key={q.id}
                ref={(el) => void (videos.current[d] = el)}
                src={q.video.src}
                muted
                loop
                playsInline
                preload="none"
                tabIndex={-1}
              />
            ) : null,
          )}
        </div>
        <div className="pcx-slide" role="group" aria-roledescription="slide" aria-label={`${active + 1} of ${n}`}>
          <h3 className="visually-hidden">{p.title}</h3>
          <p className="visually-hidden">
            {p.kind}, {p.year}. {p.summary}
          </p>
          <p className="visually-hidden">Tools: {p.stack.join(", ")}</p>
          <a ref={hit} href={`/projects/${p.id}`} className="pcx-hit" draggable={false} onClick={onHit}>
            <span className="visually-hidden">Click for Case Study: {p.title}</span>
          </a>
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {p.title}, {active + 1} of {n}
      </p>

      <div className="pcx-nav pcx-chrome">
        <button
          type="button"
          className="pcx-arrow"
          aria-label="Previous Project"
          aria-disabled={active === 0 || undefined}
          onClick={() => goTo(activeRef.current - 1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <GalaxyBar
          className="pcx-bar"
          count={n}
          index={active}
          num={numOf(active)}
          label={p.title}
          getPos={getPos}
          running={caseD === null}
          onScrub={scrubTo}
          onRelease={() => goTo(Math.round(scrubTarget.current))}
          onStep={(to) => goTo(to)}
        />
        <button
          type="button"
          className="pcx-arrow"
          aria-label="Next Project"
          aria-disabled={active === n - 1 || undefined}
          onClick={() => goTo(activeRef.current + 1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <dialog
        ref={dialog}
        className="cs"
        aria-labelledby="cs-title"
        tabIndex={-1}
        data-static={openId ? "" : undefined}
        onCancel={(e) => {
          e.preventDefault();
          closeCase();
        }}
        onClose={() => {
          // Closed by the browser rather than by closeCase: put everything back without the animation.
          if (busy.current || caseRef.current === null) return;
          const stg = stage.current;
          if (stg) {
            stg.hidden = -1;
            stg.dim = 1;
            stg.setRunning(inView.current);
          }
          gsap.set(chrome(), { autoAlpha: 1 });
          gsap.set(canvasEl(), { scale: 1 });
          lockScroll(false);
          caseRef.current = null;
          setCaseD(null);
          if (pushed.current) {
            pushed.current = false;
            skipPop.current = true;
            window.history.back();
          } else window.history.replaceState(null, "", "/");
        }}
      >
        {c && caseD !== null && (
          <>
            <CaseGradient />
            <div className="cs-shade" aria-hidden="true" />
            <GalaxyBar
              className="cs-bar cs-chrome"
              orientation="vertical"
              count={n}
              index={active}
              num={numOf(active)}
              label={order[active].title}
              getPos={getPos}
              running={caseD !== null}
              onScrub={scrubTo}
              onRelease={() => selectCase(Math.round(scrubTarget.current))}
              onStep={(to) => selectCase(to)}
            />
            <button type="button" className="cs-close cs-chrome" aria-label="Close Case Study" onClick={() => closeCase()}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <div ref={scroller} className="cs-scroll">
              <CaseStudy
                project={c}
                num={numOf(caseD)}
                prev={order[caseD - 1]}
                next={order[caseD + 1]}
                onClose={() => closeCase()}
                onPick={(id) => selectCase(order.findIndex((q) => q.id === id))}
              />
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}
