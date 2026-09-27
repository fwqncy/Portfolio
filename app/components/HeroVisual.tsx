"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const Sphere = dynamic(() => import("./Sphere"), { ssr: false });

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

// The CSS poster underneath is the loading state and the no-WebGL / no-JS fallback.
export default function HeroVisual() {
  const box = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState(false);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(true);
  const [still, setStill] = useState(false);

  useEffect(() => {
    setSupported(hasWebGL());

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => setStill(mq.matches);
    onMotion();
    mq.addEventListener("change", onMotion);

    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
      rootMargin: "100px",
    });
    if (box.current) io.observe(box.current);

    return () => {
      mq.removeEventListener("change", onMotion);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={box} className="hero-visual" aria-hidden="true">
      <div className="hero-poster" data-hidden={ready} />
      {supported && (
        <div className="hero-canvas" data-ready={ready}>
          <Sphere active={active} still={still} onReady={() => setReady(true)} />
        </div>
      )}
      <p className="hero-visual-hint mono">{still ? "fig. 01, static" : "fig. 01, hover to excite, click to cycle"}</p>
    </div>
  );
}
