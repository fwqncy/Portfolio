"use client";

import { forwardRef } from "react";
import type { Project } from "../content";

// Side list from the "Lateral Pin Indicator" pen: every project name, with a coloured line that grows down
// to the active one. Callers drive `active` and the fill; this only renders it.
type Props = { projects: Project[]; active: number; onPick: (i: number) => void; className?: string };

const ProjectIndex = forwardRef<HTMLElement, Props>(function ProjectIndex({ projects, active, onPick, className }, ref) {
  return (
    <nav ref={ref} className={`pi ${className ?? ""}`} aria-label="Projects">
      <span className="pi-track" aria-hidden="true">
        <span className="pi-fill" />
      </span>
      <ol className="pi-list">
        {projects.map((p, i) => (
          <li key={p.id}>
            <button type="button" className="pi-item" aria-current={i === active ? "true" : undefined} onClick={() => onPick(i)}>
              <span className="pi-num">{String(i + 1).padStart(2, "0")}</span>
              {p.title}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
});

export default ProjectIndex;
