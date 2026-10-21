"use client";

import { useRef } from "react";
import { gsap, horizontalLoop, Observer, prefersReducedMotion, useGSAP } from "../lib/gsap";

// A whole TypeScript "Hello World!" project, one line per item, scrolling past like a ticker tape.
const LINES = [
  "$ mkdir hello-world && cd hello-world",
  "$ npm init -y",
  "$ npm install --save-dev typescript",
  "$ npx tsc --init",
  "// src/index.ts",
  "const greeting: string = \"Hello World!\";",
  "function main(): void {",
  "  console.log(greeting);",
  "}",
  "main();",
  "$ npx tsc && node dist/index.js",
  "> Hello World!",
];

// Sits at the very top of the home page and scrolls away with it.
export default function CodeHeader() {
  const bar = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      // "Horizontal Loop Direction with Observer": the tape speeds up with scrolling and follows its direction.
      const tl = horizontalLoop(gsap.utils.toArray(".ch-item", bar.current), { repeat: -1, paddingRight: 48, speed: 0.4 });
      Observer.create({
        target: window,
        type: "wheel,touch,scroll",
        onChangeY(self) {
          // A gentle nudge rather than a burst: ease up to 1.6x, then settle back to cruising speed.
          const dir = self.deltaY < 0 ? -1 : 1;
          gsap
            .timeline({ defaults: { ease: "sine.inOut" } })
            .to(tl, { timeScale: dir * 1.6, duration: 0.6, overwrite: true })
            .to(tl, { timeScale: dir, duration: 1.4 }, "+=0.4");
        },
      });
    },
    { scope: bar },
  );

  return (
    <header ref={bar} className="ch" aria-label="Hello World in TypeScript">
      <div className="ch-rail" aria-hidden="true">
        {LINES.map((l, i) => (
          <code key={i} className="ch-item" data-kind={l.startsWith("$") ? "cmd" : l.startsWith("//") ? "com" : l.startsWith(">") ? "out" : "code"}>
            {l}
          </code>
        ))}
      </div>
      <span className="visually-hidden">console.log(&quot;Hello World!&quot;)</span>
    </header>
  );
}
