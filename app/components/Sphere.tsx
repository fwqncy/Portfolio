"use client";

import { memo, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Palette from the shadergradient reference. Clicking the sphere cycles the order.
const PALETTES: [string, string, string][] = [
  ["#8a30ff", "#900000", "#e15ab9"],
  ["#e15ab9", "#8a30ff", "#900000"],
  ["#900000", "#e15ab9", "#8a30ff"],
];

const noise = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uStrength;
varying float vNoise;
varying vec3 vNormal;
varying vec3 vView;
${noise}
float field(vec3 p){ return snoise(p * 0.95 + vec3(uTime * 0.18, uTime * 0.12, 0.0)); }
vec3 displace(vec3 p){ return p + normalize(p) * field(p) * 0.17 * uStrength; }
void main(){
  vec3 p = displace(position);
  // Rebuild normals from two nearby displaced points so lighting follows the wobble.
  vec3 t = normalize(cross(normal, abs(normal.y) < 0.99 ? vec3(0.0,1.0,0.0) : vec3(1.0,0.0,0.0)));
  vec3 b = normalize(cross(normal, t));
  float e = 0.01;
  vec3 pt = displace(position + t * e);
  vec3 pb = displace(position + b * e);
  vec3 n = normalize(cross(pt - p, pb - p));
  vNormal = normalize(normalMatrix * n);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vView = normalize(-mv.xyz);
  vNoise = field(position);
  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
varying float vNoise;
varying vec3 vNormal;
varying vec3 vView;
void main(){
  float n = vNoise * 0.5 + 0.5;
  vec3 col = mix(uColor2, uColor1, smoothstep(0.1, 0.65, n));
  col = mix(col, uColor3, smoothstep(0.55, 0.95, n));
  float fres = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.4);
  float light = 0.55 + 0.45 * max(dot(vNormal, normalize(vec3(-0.4, 0.6, 0.7))), 0.0);
  col = col * light + fres * 0.35 * uColor3;
  // Soften the rim into whatever sits behind the canvas.
  float alpha = 1.0 - smoothstep(0.55, 1.0, fres) * 0.6;
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

function Blob({ still }: { still: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const hovered = useRef(false);
  const palette = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 3.0 },
      uStrength: { value: 1.0 },
      uColor1: { value: new THREE.Color(PALETTES[0][0]) },
      uColor2: { value: new THREE.Color(PALETTES[0][1]) },
      uColor3: { value: new THREE.Color(PALETTES[0][2]) },
    }),
    [],
  );
  const targets = useMemo(() => PALETTES[0].map((c) => new THREE.Color(c)), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!still) uniforms.uTime.value += dt;
    const goal = hovered.current ? 1.9 : 1.0;
    uniforms.uStrength.value += (goal - uniforms.uStrength.value) * dt * 3;
    uniforms.uColor1.value.lerp(targets[0], dt * 2.5);
    uniforms.uColor2.value.lerp(targets[1], dt * 2.5);
    uniforms.uColor3.value.lerp(targets[2], dt * 2.5);
    if (mesh.current && !still) mesh.current.rotation.y += dt * 0.08;
  });

  return (
    <mesh
      ref={mesh}
      rotation={[0, 0.4, 0.2]}
      onPointerOver={() => (hovered.current = true)}
      onPointerOut={() => (hovered.current = false)}
      onClick={() => {
        palette.current = (palette.current + 1) % PALETTES.length;
        PALETTES[palette.current].forEach((c, i) => targets[i].set(c));
      }}
    >
      <icosahedronGeometry args={[1.2, 64]} />
      <shaderMaterial transparent vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} />
    </mesh>
  );
}

function Sphere({
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
      camera={{ position: [0, 0, 4.6], fov: 45 }}
      frameloop={active && !still ? "always" : "demand"}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      onCreated={onReady}
    >
      <Blob still={still} />
    </Canvas>
  );
}

export default memo(Sphere);
