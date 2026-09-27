"use client";

import { useEffect, useState } from "react";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";

// ShaderGradient preset "04 Nighty night", values copied one-to-one from shadergradient.co/customize.
const GRADIENT = {
  type: "waterPlane",
  shader: "defaults",
  uTime: 8,
  uSpeed: 0.3,
  uStrength: 1.5,
  uDensity: 1.5,
  uFrequency: 0,
  uAmplitude: 0,
  positionX: 0,
  positionY: 0,
  positionZ: 0,
  rotationX: 50,
  rotationY: 0,
  rotationZ: -60,
  color1: "#606080",
  color2: "#8d7dca",
  color3: "#212121",
  reflection: 0.1,
  wireframe: false,
  cAzimuthAngle: 180,
  cPolarAngle: 80,
  cDistance: 2.8,
  cameraZoom: 9.1,
  lightType: "3d",
  envPreset: "city",
  brightness: 1,
  grain: "on",
  range: "disabled",
  rangeStart: 0,
  rangeEnd: 40,
} as const;

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

// Fixed behind the whole page. The CSS gradient on .bg is the no-WebGL fallback.
export default function Background() {
  const [supported, setSupported] = useState(false);
  const [still, setStill] = useState(false);

  useEffect(() => {
    setSupported(hasWebGL());

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => setStill(mq.matches);
    onMotion();
    mq.addEventListener("change", onMotion);
    return () => mq.removeEventListener("change", onMotion);
  }, []);

  return (
    <div className="bg" aria-hidden="true">
      {supported && (
        <div className="bg-canvas">
          <ShaderGradientCanvas
            style={{ position: "absolute", inset: 0 }}
            pixelDensity={1}
            fov={45}
            pointerEvents="none"
            lazyLoad={false}
            envBasePath="/hdr/"
          >
            <ShaderGradient control="props" animate={still ? "off" : "on"} {...GRADIENT} />
          </ShaderGradientCanvas>
        </div>
      )}
    </div>
  );
}
