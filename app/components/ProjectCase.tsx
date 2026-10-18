"use client";

import Image from "next/image";
import { useRef } from "react";
import AsciiFire from "./AsciiFire";
import ProjectIndex from "./ProjectIndex";
import ProjectVideo from "./ProjectVideo";
import { Code } from "./ProjectShowcase";
import CaseGradient from "./CaseGradient";
import { useTransitionNav } from "./PageTransition";
import { gsap, useGSAP } from "../lib/gsap";
import type { Project } from "../content";
import { caseStudies } from "../caseStudies";

const num = (i: number) => String(i + 1).padStart(2, "0");
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

// Remembers which project was open last, so the side line can travel from there to the new one.
let lastIndex: number | null = null;

export default function ProjectCase({ projects, index }: { projects: Project[]; index: number }) {
  const root = useRef<HTMLElement>(null);
  const side = useRef<HTMLElement>(null);
  const go = useTransitionNav();
  const p = projects[index];
  const n = projects.length;
  const prev = projects[index - 1];
  const next = projects[index + 1];
  const sections = caseStudies[p.id];

  useGSAP(
    () => {
      const fill = side.current?.querySelector(".pi-fill");
      if (!fill) return;
      const to = (index + 1) / n;
      const from = lastIndex === null ? to : (lastIndex + 1) / n;
      gsap.fromTo(fill, { scaleY: from, transformOrigin: "top left" }, { scaleY: to, duration: 0.9, ease: "power3.inOut", delay: 0.4 });
      lastIndex = index;
      gsap.from(".pc-reveal", { y: 30, opacity: 0, duration: 0.8, stagger: 0.08, ease: "power3.out", delay: 0.5 });
    },
    { scope: root, dependencies: [index] },
  );

  return (
    <main ref={root} id="main" className="pc">
      <CaseGradient />
      <AsciiFire className="pc-fire" reach={0.6} />
      <ProjectIndex ref={side} projects={projects} active={index} onPick={(i) => i !== index && go(`/projects/${projects[i].id}`)} className="pc-index" />

      <article className="pc-case">
        <a
          href="/#work"
          className="pc-back mono pc-reveal"
          onClick={(e) => {
            e.preventDefault();
            // Home reopens on this project's panel, already in place under the transition.
            sessionStorage.setItem("returnTo", p.id);
            go("/", "down");
          }}
        >
          <span aria-hidden="true">←</span> Back to projects
        </a>

        <p className="mono meta pc-reveal">
          <span>{num(index)}</span>
          <span>{p.year}</span>
          <span>{p.kind}</span>
        </p>
        <h1 className="pc-title pc-reveal">{p.title}</h1>
        <p className="pc-sub pc-reveal">Case study</p>

        <figure className="pc-figure pc-reveal">
          {p.video ? (
            <ProjectVideo src={p.video.src} poster={p.video.poster} label={`${p.title} in action`} />
          ) : (
            <Image src={p.image} alt={`${p.title} (placeholder image)`} fill priority sizes="(max-width: 760px) 100vw, 760px" />
          )}
        </figure>

        <section className="pc-desc pc-reveal" aria-label="Overview">
          <p className="label mono">Overview</p>
          <p className="pc-desc-text">{p.summary}</p>
        </section>

        <p className="work-outcome pc-reveal">{p.outcome}</p>

        <ul className="tags mono pc-reveal" aria-label="Stack">
          {p.stack.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>

        {sections?.map((s) => (
          <section key={s.heading} className="pc-section" aria-labelledby={`pc-${slug(s.heading)}`}>
            <h2 id={`pc-${slug(s.heading)}`} className="pc-h2">
              {s.heading}
            </h2>
            {s.body.map((para, i) => (
              <p key={i} className="pc-body">
                {para}
              </p>
            ))}
            {s.code && <Code file={s.code.file} lang={s.code.lang} src={s.code.src} variant="full" />}
          </section>
        ))}

        {p.repo && (
          <a href={p.repo} className="ps-open mono pc-repo" target="_blank" rel="noreferrer">
            View the code on GitHub <span aria-hidden="true">↗</span>
          </a>
        )}

        <nav className="pc-pager mono pc-reveal" aria-label="More projects">
          {prev ? (
            <a href={`/projects/${prev.id}`} onClick={(e) => (e.preventDefault(), go(`/projects/${prev.id}`))}>
              <span aria-hidden="true">←</span> {prev.title}
            </a>
          ) : (
            <span />
          )}
          {next && (
            <a href={`/projects/${next.id}`} onClick={(e) => (e.preventDefault(), go(`/projects/${next.id}`))}>
              {next.title} <span aria-hidden="true">→</span>
            </a>
          )}
        </nav>
      </article>
    </main>
  );
}
