"use client";

import { memo, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Billboard, Environment } from "@react-three/drei";
import * as THREE from "three";

// Four-pointed star outline, clockwise from the top tip. Tips alternate with
// shallow valleys; the vertical tips are longer, like the reference image.
const OUTLINE: [number, number][] = [
  [0, 1.6],
  [0.4, 0.4],
  [1.3, 0],
  [0.4, -0.4],
  [0, -1.6],
  [-0.4, -0.4],
  [-1.3, 0],
  [-0.4, 0.4],
];
const DEPTH = 0.5;

// One colour per facet, front then back: pink, purple, blue and near-black.
const FRONT = ["#f6b3dd", "#8a30ff", "#4d8dff", "#0c0b14", "#e15ab9", "#2c1664", "#8fc4ff", "#14111f"];
const BACK = ["#4d8dff", "#14111f", "#e15ab9", "#8a30ff", "#8fc4ff", "#0c0b14", "#f6b3dd", "#2c1664"];

function useStarGeometry() {
  return useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    // 0 at the centre apex, 1 on the outline: drives the inner glow toward the edges.
    const glow: number[] = [];
    const c = new THREE.Color();
    const n = OUTLINE.length;

    const facet = (apex: number[], a: number[], b: number[], hex: string) => {
      positions.push(...apex, ...a, ...b);
      glow.push(0, 1, 1);
      c.set(hex);
      for (let k = 0; k < 3; k++) colors.push(c.r, c.g, c.b);
    };

    for (let i = 0; i < n; i++) {
      const [x1, y1] = OUTLINE[i];
      const [x2, y2] = OUTLINE[(i + 1) % n];
      // Counter-clockwise as seen from each side, so normals point outward.
      facet([0, 0, DEPTH], [x2, y2, 0], [x1, y1, 0], FRONT[i]);
      facet([0, 0, -DEPTH], [x1, y1, 0], [x2, y2, 0], BACK[i]);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute("glow", new THREE.Float32BufferAttribute(glow, 1));
    geometry.computeVertexNormals();
    return geometry;
  }, []);
}

// Inner glow: each facet brightens toward the star's outer edges and tips,
// tinted by its own colour with a little pink mixed in.
function addInnerGlow(shader: THREE.WebGLProgramParametersWithUniforms) {
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nattribute float glow;\nvarying float vGlow;")
    .replace("#include <begin_vertex>", "#include <begin_vertex>\nvGlow = glow;");
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", "#include <common>\nvarying float vGlow;")
    .replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
      totalEmissiveRadiance += mix(vColor.rgb, vec3(0.96, 0.7, 0.87), 0.35) * smoothstep(0.35, 1.0, vGlow) * 0.55;`,
    );
}

// Soft outer halo in the star's colours, with no bright core, drawn once into a canvas texture.
function useHalo() {
  return useMemo(() => {
    const s = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = s;
    const g = canvas.getContext("2d")!;
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, "rgba(225,90,185,0.55)");
    r.addColorStop(0.35, "rgba(138,48,255,0.32)");
    r.addColorStop(0.65, "rgba(77,141,255,0.12)");
    r.addColorStop(1, "rgba(77,141,255,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, s, s);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

function Star({ still }: { still: boolean }) {
  const group = useRef<THREE.Group>(null);
  const geometry = useStarGeometry();
  const halo = useHalo();

  useFrame((state, delta) => {
    if (!group.current || still) return;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    // Steady spin on y, plus slower tilts on x and z at unrelated rates so the motion never quite repeats.
    group.current.rotation.y += dt * 0.45;
    group.current.rotation.x = Math.sin(t * 0.37) * 0.55;
    group.current.rotation.z = Math.sin(t * 0.23 + 1.2) * 0.35;
  });

  return (
    <>
      <group ref={group} rotation={[0.1, 0.5, 0]}>
        <mesh geometry={geometry}>
          <meshPhysicalMaterial
            vertexColors
            flatShading
            side={THREE.DoubleSide}
            metalness={0.25}
            roughness={0.08}
            clearcoat={1}
            clearcoatRoughness={0.03}
            iridescence={1}
            iridescenceIOR={1.3}
            envMapIntensity={1.4}
            onBeforeCompile={addInnerGlow}
          />
        </mesh>
      </group>
      {/* Sits behind the star so it glows around the silhouette without washing over it. */}
      <Billboard>
        <mesh scale={5.2} position={[0, 0, -1.6]}>
          <planeGeometry />
          <meshBasicMaterial map={halo} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </Billboard>
    </>
  );
}

function Crystal({
  active,
  still,
  onReady,
}: {
  active: boolean;
  still: boolean;
  onReady: () => void;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 5.2], fov: 45 }}
      frameloop={active && !still ? "always" : "demand"}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      onCreated={onReady}
    >
      <Environment files="/hdr/city.hdr" />
      <Star still={still} />
    </Canvas>
  );
}

export default memo(Crystal);
