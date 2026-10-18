"use client";

import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { Observer } from "gsap/Observer";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// Register once, client side only.
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Observer, MorphSVGPlugin, useGSAP);

export { gsap, MorphSVGPlugin, Observer, ScrollToPlugin, ScrollTrigger, useGSAP };

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type LoopConfig = { repeat?: number; paused?: boolean; speed?: number; paddingRight?: number; reversed?: boolean };

// GreenSock's horizontalLoop helper (from the "Horizontal Loop Direction with Observer" pen), trimmed to
// what the header needs: a seamless, responsive xPercent loop of the given items.
export function horizontalLoop(itemsIn: Element[], config: LoopConfig = {}) {
  const items = gsap.utils.toArray<HTMLElement>(itemsIn);
  const tl = gsap.timeline({
    repeat: config.repeat,
    paused: config.paused,
    defaults: { ease: "none" },
    onReverseComplete: () => {
      tl.totalTime(tl.rawTime() + tl.duration() * 100);
    },
  });
  const length = items.length;
  const startX = items[0].offsetLeft;
  const widths: number[] = [];
  const xPercents: number[] = [];
  const pixelsPerSecond = (config.speed || 1) * 100;
  const snap = gsap.utils.snap(1);

  gsap.set(items, {
    xPercent: (i: number, el: HTMLElement) => {
      const w = (widths[i] = parseFloat(String(gsap.getProperty(el, "width", "px"))));
      xPercents[i] = snap(
        (parseFloat(String(gsap.getProperty(el, "x", "px"))) / w) * 100 + Number(gsap.getProperty(el, "xPercent")),
      );
      return xPercents[i];
    },
  });
  gsap.set(items, { x: 0 });

  const last = items[length - 1];
  const totalWidth =
    last.offsetLeft +
    (xPercents[length - 1] / 100) * widths[length - 1] -
    startX +
    last.offsetWidth * Number(gsap.getProperty(last, "scaleX")) +
    (config.paddingRight || 0);

  items.forEach((item, i) => {
    const curX = (xPercents[i] / 100) * widths[i];
    const distanceToStart = item.offsetLeft + curX - startX;
    const distanceToLoop = distanceToStart + widths[i] * Number(gsap.getProperty(item, "scaleX"));
    tl.to(item, { xPercent: snap(((curX - distanceToLoop) / widths[i]) * 100), duration: distanceToLoop / pixelsPerSecond }, 0)
      .fromTo(
        item,
        { xPercent: snap(((curX - distanceToLoop + totalWidth) / widths[i]) * 100) },
        {
          xPercent: xPercents[i],
          duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
          immediateRender: false,
        },
        distanceToLoop / pixelsPerSecond,
      );
  });

  tl.progress(1, true).progress(0, true); // pre-render for performance
  if (config.reversed) {
    tl.vars.onReverseComplete?.();
    tl.reverse();
  }
  return tl;
}
