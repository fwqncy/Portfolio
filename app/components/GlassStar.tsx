"use client";

import { memo, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Billboard, Environment, Lightformer, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

// Outline: a superellipse with exponent < 1 curves each side inward, giving
// four long, needle-sharp points. The vertical points are stretched further.
const P = 0.5;
const SCALE_X = 1.2;
const SCALE_Y = 1.75;
const THICKNESS = 0.24;
const SEGMENTS = 360;
const RINGS = 64;

// Near each point the exponent rises a little, which curves the sides in less there and
// gives the last stretch of each arm more body. Away from the points it is exactly P.
const TIP_WIDEN = 0.15;
const TIP_SPREAD = 0.12;

function outlineRadius(theta: number) {
  const quarter = ((theta % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2);
  const fromAxis = Math.min(quarter, Math.PI / 2 - quarter);
  const p = P + TIP_WIDEN * Math.exp(-fromAxis / TIP_SPREAD);
  const c = Math.abs(Math.cos(theta)) ** p;
  const s = Math.abs(Math.sin(theta)) ** p;
  return (c + s) ** (-1 / p);
}

// Each ring blends from a circle the size of the valleys (at the centre) to the full star
// (at the rim). Inner rings have no corners, so no creases run from the tips to the centre,
// and the circle never reaches past the valleys, so the silhouette is still the star.
const VALLEY = outlineRadius(Math.PI / 4);
function ringRadius(theta: number, rho: number) {
  return rho * (VALLEY + (outlineRadius(theta) - VALLEY) * rho * rho);
}

// Height of the surface at a point: a smooth dome with no crease at the centre,
// curving down to a rounded rim so light catches the edge. Thickness only depends on
// distance from the centre, so the arms taper to the sharp tips without ridges.
function height(rho: number) {
  return THICKNESS * (1 - rho * rho) ** 0.85;
}

function useStarGeometry() {
  return useMemo(() => {
    const positions: number[] = [];
    const indices: number[] = [];
    const row = SEGMENTS + 1;

    // Front surface, then the back as its mirror in z. They share the rim position.
    for (const side of [1, -1]) {
      const base = positions.length / 3;
      for (let j = 0; j <= RINGS; j++) {
        // Rings bunch up toward the rim, where the surface curves fastest, to keep it smooth.
        const rho = Math.sin((j / RINGS) * (Math.PI / 2));
        for (let i = 0; i <= SEGMENTS; i++) {
          const theta = (i / SEGMENTS) * Math.PI * 2;
          const r = ringRadius(theta, rho);
          positions.push(r * Math.cos(theta) * SCALE_X, r * Math.sin(theta) * SCALE_Y, side * height(rho));
        }
      }
      for (let j = 0; j < RINGS; j++) {
        for (let i = 0; i < SEGMENTS; i++) {
          const a = base + j * row + i;
          const b = a + row;
          // Wind each side so its normals face outward.
          if (side === 1) indices.push(a, b, a + 1, a + 1, b, b + 1);
          else indices.push(a, a + 1, b, a + 1, b + 1, b);
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    // The wrap-around column (theta 0 and 2pi) and the rim (front and back) are stored as
    // separate vertices, so each side gets its own normal and shows a crease. Average them.
    const normals = geometry.getAttribute("normal") as THREE.BufferAttribute;
    const n = new THREE.Vector3();
    const weld = (ids: number[]) => {
      n.set(0, 0, 0);
      for (const id of ids) n.add(new THREE.Vector3().fromBufferAttribute(normals, id));
      n.normalize();
      for (const id of ids) normals.setXYZ(id, n.x, n.y, n.z);
    };
    const back = (RINGS + 1) * row;
    for (let j = 0; j <= RINGS; j++) {
      weld([j * row, j * row + SEGMENTS]);
      weld([back + j * row, back + j * row + SEGMENTS]);
    }
    for (let i = 0; i <= SEGMENTS; i++) weld([RINGS * row + i, back + RINGS * row + i]);
    normals.needsUpdate = true;

    return geometry;
  }, []);
}

// Soft neon edge glow: additive fresnel, strongest where the surface turns away from the camera.
const rimShader = {
  uniforms: { uColor: { value: new THREE.Color("#dfe6ff") }, uIntensity: { value: 2 } },
  vertexShader: /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vView;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vNormal = normalize(normalMatrix * normal);
      vView = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    uniform float uIntensity;
    varying vec3 vNormal;
    varying vec3 vView;
    void main() {
      float f = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.5);
      gl_FragColor = vec4(uColor * f * uIntensity, f);
    }
  `,
};

// Faint halo behind the star, cool white fading through violet to nothing.
function useHalo() {
  return useMemo(() => {
    const s = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = s;
    const g = canvas.getContext("2d")!;
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, "rgba(200,210,255,0.35)");
    r.addColorStop(0.35, "rgba(138,48,255,0.14)");
    r.addColorStop(0.7, "rgba(77,141,255,0.05)");
    r.addColorStop(1, "rgba(77,141,255,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, s, s);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

// What the glass refracts: the deep black stage from the reference.
const BACKDROP = new THREE.Color("#050508");

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
      <Billboard>
        <mesh scale={5.6} position={[0, 0, -1.8]}>
          <planeGeometry />
          <meshBasicMaterial map={halo} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </Billboard>
      <group ref={group} rotation={[0.25, 0.4, -0.2]}>
        {/* Polished chrome core just inside the glass. The glass refracts this instead of
            the page behind the canvas, which gives the silver liquid look of the reference. */}
        <mesh geometry={geometry} scale={[0.96, 0.96, 0.85]}>
          <meshStandardMaterial color="#e6e9f5" metalness={1} roughness={0.1} envMapIntensity={2.4} />
        </mesh>
        <mesh geometry={geometry}>
          <MeshTransmissionMaterial
            background={BACKDROP}
            backside
            backsideThickness={0.3}
            samples={6}
            resolution={512}
            transmission={1}
            thickness={0.5}
            roughness={0}
            ior={1.6}
            chromaticAberration={0.35}
            anisotropicBlur={0.08}
            distortion={0.1}
            distortionScale={0.3}
            temporalDistortion={still ? 0 : 0.04}
            clearcoat={1}
            clearcoatRoughness={0}
            color="#ffffff"
            envMapIntensity={2}
          />
        </mesh>
        <mesh geometry={geometry}>
          <shaderMaterial
            args={[rimShader]}
            transparent
            depthWrite={false}
            depthFunc={THREE.LessEqualDepth}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    </>
  );
}

// Studio lighting made of glowing strips, for crisp chrome highlights on black.
// A cool blue and a pink strip tint the reflections toward the site's palette.
function Studio() {
  return (
    <Environment resolution={256}>
      <Lightformer form="rect" intensity={5} color="#ffffff" position={[0, 3, 2]} scale={[6, 0.4, 1]} />
      <Lightformer form="rect" intensity={4} color="#ffffff" position={[-3, 1, 2]} rotation-y={Math.PI / 3} scale={[4, 0.3, 1]} />
      <Lightformer form="rect" intensity={3} color="#ffffff" position={[3, -2, 2]} rotation-y={-Math.PI / 3} scale={[4, 0.25, 1]} />
      <Lightformer form="rect" intensity={4} color="#ffffff" position={[0, 0, 5]} scale={[4, 4, 1]} />
      <Lightformer form="rect" intensity={1.6} color="#8fb4ff" position={[3, 1, -1]} rotation-y={-Math.PI / 2} scale={[4, 0.5, 1]} />
      <Lightformer form="ring" intensity={0.7} color="#e15ab9" position={[-2, -3, -2]} scale={1.5} />
      <Lightformer form="rect" intensity={0.4} color="#8a30ff" position={[0, 0, -4]} scale={[5, 2, 1]} />
    </Environment>
  );
}

function GlassStar({
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
      camera={{ position: [0, 0, 4.9], fov: 45 }}
      frameloop={active && !still ? "always" : "demand"}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      onCreated={onReady}
    >
      <Studio />
      <Star still={still} />
    </Canvas>
  );
}

export default memo(GlassStar);
