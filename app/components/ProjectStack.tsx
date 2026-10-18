"use client";

import { useRef, useState } from "react";
import ProjectIndex from "./ProjectIndex";
import ProjectShowcase from "./ProjectShowcase";
import { useTransitionNav } from "./PageTransition";
import { gsap, ScrollTrigger, useGSAP } from "../lib/gsap";
import type { Project } from "../content";

const num = (i: number) => String(i + 1).padStart(2, "0");

export default function ProjectStack({ projects }: { projects: Project[] }) {
  const root = useRef<HTMLDivElement>(null);
  const index = useRef<HTMLElement>(null);
  const pins = useRef<ScrollTrigger[]>([]);
  const [active, setActive] = useState(0);
  const go = useTransitionNav();
  const n = projects.length;

  useGSAP(
    () => {
      const panels = gsap.utils.toArray<HTMLElement>(".ps-panel", root.current);

      // "Layered pinning": each panel pins at the top and the next one slides over it.
      // The last one doesn't pin, so it scrolls away and the starfield opens up before the footer.
      pins.current = panels.map((panel, i) =>
        ScrollTrigger.create({ trigger: panel, start: "top top", pin: i < panels.length - 1, pinSpacing: false }),
      );

      // The last panel's bottom fade grows in only once it has fully covered the one beneath.
      const lastPanel = panels[panels.length - 1];
      gsap.fromTo(
        lastPanel,
        { "--fade": 0 },
        { "--fade": 1, ease: "none", scrollTrigger: { trigger: lastPanel, start: "top top", end: "+=40%", scrub: true } },
      );

      // Once a panel fully covers the one beneath, hide that one, so faded edges show stars, not old panels.
      panels.forEach((panel, i) => {
        if (i === 0) return;
        ScrollTrigger.create({
          trigger: panel,
          start: "top top",
          onEnter: () => gsap.set(panels[i - 1], { autoAlpha: 0 }),
          onLeaveBack: () => gsap.set(panels[i - 1], { autoAlpha: 1 }),
        });
      });

      // The lateral indicator's fill tracks progress through the stack; the active name follows it.
      const fill = index.current?.querySelector(".pi-fill") ?? null;
      gsap.set(fill, { scaleY: 1 / n, transformOrigin: "top left" });
      ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          gsap.to(fill, { scaleY: 1 / n + self.progress * (1 - 1 / n), duration: 0.25, overwrite: true });
          setActive(Math.round(self.progress * (n - 1)));
        },
      });

      // Only show the side list while the stack is on screen.
      gsap.set(index.current, { autoAlpha: 0 });
      ScrollTrigger.create({
        trigger: root.current,
        start: "top 60%",
        end: "bottom 40%",
        onToggle: (self) => gsap.to(index.current, { autoAlpha: self.isActive ? 1 : 0, duration: 0.3 }),
      });

      // Coming back from a case study: jump straight to that project's panel (once pins are measured), so it's
      // already in place under the transition. "/#work" links still land on the section.
      const back = sessionStorage.getItem("returnTo");
      sessionStorage.removeItem("returnTo");
      const at = back ? projects.findIndex((p) => p.id === back) : -1;
      if (at !== -1 || window.location.hash === "#work") {
        ScrollTrigger.refresh();
        const work = document.getElementById("work");
        const y = at !== -1 ? pins.current[at].start + 2 : (work?.getBoundingClientRect().top ?? 0) + window.scrollY;
        window.scrollTo({ top: y, behavior: "instant" });
        requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "instant" })); // beat any router scroll
      }
    },
    { scope: root, dependencies: [projects] },
  );

  // Clicking a name scrolls to its panel; the line follows as the page moves.
  const pick = (i: number) => {
    const st = pins.current[i];
    if (st) gsap.to(window, { scrollTo: st.start + 2, duration: 1, ease: "power2.inOut" });
  };

  return (
    <div ref={root} className="ps">
      <ProjectIndex ref={index} projects={projects} active={active} onPick={pick} className="ps-index" />
      {projects.map((p, i) => (
        <section
          key={p.id}
          className="ps-panel"
          data-i={i % 3}
          data-edge={i === 0 ? "first" : i === n - 1 ? "last" : undefined}
          aria-labelledby={`ps-${p.id}`}
        >
          <div className="ps-inner">
            <div className="ps-text">
              <p className="ps-meta mono">
                <span>{num(i)}</span>
                <span>{p.year}</span>
              </p>
              <h3 id={`ps-${p.id}`} className="ps-title">
                {p.title}
              </h3>
              <p className="ps-kind mono">{p.kind}</p>
              <p className="ps-summary">{p.summary}</p>
              <ul className="tags mono" aria-label="Stack">
                {p.stack.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <a
                href={`/projects/${p.id}`}
                className="ps-open mono"
                onClick={(e) => {
                  e.preventDefault();
                  go(`/projects/${p.id}`);
                }}
              >
                Open case study <span aria-hidden="true">↗</span>
              </a>
            </div>
            {/* Mouse shortcut only; the "Open case study" link above is the accessible control. */}
            <div className="ps-media" onClick={() => go(`/projects/${p.id}`)}>
              <ProjectShowcase id={p.id} title={p.title} video={p.video} />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
