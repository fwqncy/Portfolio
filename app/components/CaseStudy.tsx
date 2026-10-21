"use client";

import Image from "next/image";
import Code from "./Code";
import ProjectVideo from "./ProjectVideo";
import type { Project } from "../content";
import { caseStudies } from "../caseStudies";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

type Props = {
  project: Project;
  num: string;
  prev?: Project;
  next?: Project;
  onClose: () => void;
  onPick: (id: string) => void;
};

// A project's write-up, shown on the back of its card.
export default function CaseStudy({ project: p, num, prev, next, onClose, onPick }: Props) {
  const sections = caseStudies[p.id];
  const pick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; // new tab etc. stay native
    e.preventDefault();
    onPick(id);
  };

  return (
    <article className="cs-case">
      <button type="button" className="cs-back mono cs-reveal" onClick={onClose}>
        <span aria-hidden="true">←</span> Back to Projects
      </button>

      <p className="mono meta cs-reveal">
        <span>{num}</span>
        <span>{p.year}</span>
        <span>{p.kind}</span>
      </p>
      <h2 id="cs-title" className="cs-title cs-reveal">
        {p.title}
      </h2>
      <p className="cs-sub cs-reveal">Case Study</p>

      <figure className="cs-figure cs-reveal">
        {p.video ? (
          <ProjectVideo src={p.video.src} poster={p.video.poster} label={`${p.title} in action`} />
        ) : (
          <Image src={p.image} alt={`${p.title} (placeholder image)`} fill sizes="(max-width: 760px) 100vw, 760px" />
        )}
      </figure>

      <section className="cs-desc cs-reveal" aria-label="Overview">
        <p className="label mono">Overview</p>
        <p className="cs-desc-text">{p.summary}</p>
      </section>

      <p className="work-outcome cs-reveal">{p.outcome}</p>

      <ul className="tags mono cs-reveal" aria-label="Stack">
        {p.stack.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>

      {sections?.map((s) => (
        <section key={s.heading} className="cs-section" aria-labelledby={`cs-${slug(s.heading)}`}>
          <h3 id={`cs-${slug(s.heading)}`} className="cs-h3">
            {s.heading}
          </h3>
          {s.body.map((para, i) => (
            <p key={i} className="cs-body">
              {para}
            </p>
          ))}
          {s.code && <Code {...s.code} />}
        </section>
      ))}

      {p.repo && (
        <a href={p.repo} className="cs-repo mono" target="_blank" rel="noreferrer">
          View the Code on GitHub <span aria-hidden="true">↗</span>
        </a>
      )}

      <nav className="cs-pager mono" aria-label="More projects">
        {prev ? (
          <a href={`/projects/${prev.id}`} onClick={(e) => pick(e, prev.id)}>
            <span aria-hidden="true">←</span> {prev.title}
          </a>
        ) : (
          <span />
        )}
        {next && (
          <a href={`/projects/${next.id}`} onClick={(e) => pick(e, next.id)}>
            {next.title} <span aria-hidden="true">→</span>
          </a>
        )}
      </nav>
    </article>
  );
}
