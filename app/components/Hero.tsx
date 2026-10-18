"use client";

import { useRef } from "react";
import HeroVisual from "./HeroVisual";
import { gsap, prefersReducedMotion, useGSAP } from "../lib/gsap";

// Editorial title card: the name in the site's display serif, and the role in mono.
// Bottom-left, with the star to the right as its counterweight.
export default function Hero({ role }: { role: string }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      // Quiet entrance: lines rise in one after another.
      gsap.from(".hero-line", { y: 24, opacity: 0, duration: 1.1, ease: "power3.out", stagger: 0.12, delay: 0.25 });
      gsap.from(".hero-scroll", { opacity: 0, duration: 1, delay: 1.2 });

      // Comets pop up at random around the name and shoot diagonally past, every few seconds.
      const field = root.current?.querySelector<HTMLElement>(".hero-comets");
      let timer = 0;
      const launch = () => {
        if (field && !document.hidden && window.scrollY < window.innerHeight * 0.6) {
          const c = document.createElement("span");
          c.className = "hero-comet";
          const angle = gsap.utils.random(18, 34); // degrees below horizontal, heading down and to the right
          const len = gsap.utils.random(70, 150);
          const dist = gsap.utils.random(220, 420);
          const rad = (angle * Math.PI) / 180;
          c.style.width = `${len}px`;
          c.style.left = `${gsap.utils.random(-5, 80)}%`;
          c.style.top = `${gsap.utils.random(-30, 70)}%`;
          field.appendChild(c);
          gsap.fromTo(
            c,
            { rotation: angle, x: 0, y: 0, opacity: 0 },
            {
              x: Math.cos(rad) * dist,
              y: Math.sin(rad) * dist,
              duration: gsap.utils.random(0.9, 1.5),
              ease: "power1.in",
              keyframes: { opacity: [0, 1, 1, 0] },
              onComplete: () => c.remove(),
            },
          );
        }
        timer = window.setTimeout(launch, gsap.utils.random(1400, 3800));
      };
      timer = window.setTimeout(launch, 1200);

      // Scrubbed like the "Scroll-based image sequence" helper: the hero pins, and scroll position alone
      // drives the title card and star dissolving into the starfield.
      gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: root.current, start: "top top", end: "+=100%", scrub: true, pin: true },
        })
        .to(".hero-visual", { opacity: 0, scale: 0.6, rotate: 25, filter: "blur(12px)" }, 0)
        .to(".hero-copy", { opacity: 0, y: -40, filter: "blur(8px)" }, 0)
        .to(".hero-scroll", { opacity: 0 }, 0);

      return () => window.clearTimeout(timer);
    },
    { scope: root },
  );

  return (
    <section ref={root} id="top" className="hero" aria-labelledby="hero-title">
      <HeroVisual />
      <div className="hero-copy">
        <div className="hero-comets" aria-hidden="true" />
        <h1 id="hero-title" className="hero-name hero-line">
          Sayef Khan
        </h1>
        <p className="hero-role mono hero-line">
          <span className="hero-rule" aria-hidden="true" />
          {role}
        </p>
      </div>
      <p className="hero-scroll mono" aria-hidden="true">
        Scroll <span>↓</span>
      </p>
    </section>
  );
}
