"use client";

import * as THREE from "three";
import { FACE_H, FACE_RADIUS, FACE_W, VIDEO_BOX } from "./cardFace";

// The project carousel's renderer. Cards sit in slots; the one in the middle faces you, and each card turns a half
// turn as it moves to a side slot, where it shows its reflection: the face mirrored back, glossy and a little darker.
// Positions are read from getPos() every frame (a float: 2.5 means halfway between the third and fourth card), so
// dragging, scrubbing and tweens all drive it the same way.

export type Rect = { x: number; y: number; w: number; h: number };

export type Layout = {
  W: number; // card size in the middle slot, px
  H: number;
  spacing: number; // px between slot centres
  centerY: number; // card centre, px from the top of the stage
  persp: number; // perspective distance, px
};

export type StageOptions = {
  faces: HTMLCanvasElement[];
  videos: (HTMLVideoElement | null)[];
  tints: string[];
  getPos: () => number;
  barZone: number; // px kept clear at the bottom of the stage
};

export type Hover = "centre" | "side" | null;

export interface Stage {
  layout: Layout;
  hidden: number; // card index not drawn (it's mid-flip as a DOM element)
  dim: number; // opacity of every other card
  resize(): void;
  setRunning(on: boolean): void;
  pointer(x: number | null, y?: number): Hover;
  cardRect(i: number): Rect;
  updateFace(i: number): void;
  dispose(): void;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const HOVER_SCALE = 0.045;
const SIDE_SCALE = 0.7; // a card's size in a side slot
const TILT = 0.16;
const GLOW_PAD = 72; // face px of room around a side card for its glow

export function computeLayout(vw: number, vh: number, barZone: number): Layout {
  const usable = Math.max(320, vh - barZone);
  const W = vw < 700 ? Math.min(vw * 0.74, (usable * 0.78) / 1.4) : clamp(Math.min(vw * 0.3, (usable * 0.8) / 1.4), 220, 440);
  const spacing = Math.min(W * 0.94, vw * 0.5 + W * 0.08);
  return {
    W,
    H: W * 1.4,
    spacing,
    centerY: usable / 2 + 8,
    persp: W * 3,
  };
}

// Where a card at slot offset o sits. Mirrors the vertex shader, for the CSS fallback.
function slot(o: number, L: Layout) {
  const ao = Math.abs(o);
  const sgn = o < 0 ? -1 : 1;
  const t = Math.min(ao, 1);
  return {
    theta: sgn * Math.PI * t,
    s: (1 - (1 - SIDE_SCALE) * smooth(0, 1, t)) * (1 - 0.15 * clamp(ao - 1, 0, 1)),
    x: sgn * L.spacing * (t + Math.max(ao - 1, 0) * 0.75),
    alpha: 1 - smooth(1.15, 1.75, ao),
  };
}

const VERT = /* glsl */ `
uniform vec2 uSize;
uniform vec2 uCenter;
uniform float uOffset;
uniform float uSpacing;
uniform float uPersp;
uniform float uHover;
uniform vec2 uTilt;
uniform vec2 uFacePx;
uniform float uPad; // face px the quad reaches past the card on every side, for the glow
varying vec2 vUv;
varying float vTurn;

const float PI = 3.141592653589793;

void main() {
  vUv = uv;
  float o = uOffset;
  float ao = abs(o);
  float sgn = o < 0.0 ? -1.0 : 1.0;
  float t = min(ao, 1.0);

  float theta = sgn * PI * t;
  float s = (1.0 - ${(1 - SIDE_SCALE).toFixed(2)} * smoothstep(0.0, 1.0, t)) * (1.0 - 0.15 * clamp(ao - 1.0, 0.0, 1.0));
  s *= 1.0 + ${HOVER_SCALE} * uHover;
  float x = sgn * uSpacing * (t + max(ao - 1.0, 0.0) * 0.75);

  vec3 p = vec3(position.xy * uSize * (1.0 + 2.0 * uPad / uFacePx), 0.0);

  // Hover: tip the card away under the cursor (only the centre card gets a tilt).
  float cx = cos(uTilt.y), sx = sin(uTilt.y);
  p = vec3(p.x, p.y * cx - p.z * sx, p.y * sx + p.z * cx);
  float cy = cos(uTilt.x), sy = sin(uTilt.x);
  p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);

  // The turn: a half turn between the centre slot and a side slot, edge-on halfway.
  float c = cos(theta), sn = sin(theta);
  p = vec3(p.x * c + p.z * sn, p.y, -p.x * sn + p.z * c);

  vec2 q = p.xy * (uPersp / (uPersp - p.z)) * s;
  vTurn = t;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(q + vec2(x, 0.0) + uCenter, 0.0, 1.0);
}
`;

const FRAG = /* glsl */ `
uniform sampler2D uFace;
uniform sampler2D uVideo;
uniform float uVideoOn;
uniform vec4 uVideoBox;
uniform float uVideoRadius;
uniform float uVideoAspect;
uniform vec2 uFacePx;
uniform float uAlpha;
uniform float uGlare; // the middle card's hover glare
uniform vec2 uMouse;
uniform float uTime;
uniform vec3 uTint;
uniform float uPad;
uniform float uBlur; // 0 in focus (the middle card) .. 1 fully out of focus (a side card)
uniform float uGlow; // the starry glow around a side card
varying vec2 vUv;
varying float vTurn;

const float PI = 3.141592653589793;
const vec2 DISC[12] = vec2[12](
  vec2(-0.326, -0.406), vec2(-0.840, -0.074), vec2(-0.696, 0.457), vec2(-0.203, 0.621),
  vec2(0.962, -0.195), vec2(0.473, -0.480), vec2(0.519, 0.767), vec2(0.185, -0.893),
  vec2(0.507, 0.064), vec2(0.896, 0.412), vec2(-0.322, -0.933), vec2(-0.792, -0.598)
);

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float sdRound(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// The face, out of focus by uBlur: a disc of samples, each from a blurrier mip.
vec4 face(vec2 uv) {
  if (uBlur < 0.01) return texture2D(uFace, uv);
  vec2 r = uBlur * 11.0 / uFacePx;
  float bias = 2.4 * uBlur;
  vec4 acc = vec4(0.0);
  for (int i = 0; i < 12; i++) acc += texture(uFace, uv + DISC[i] * r, bias);
  return acc / 12.0;
}

vec3 video(vec2 uv) {
  if (uBlur < 0.01) return texture2D(uVideo, uv).rgb;
  vec2 r = uBlur * 11.0 / uVideoBox.zw;
  float bias = 3.0 * uBlur;
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 12; i++) acc += texture(uVideo, uv + DISC[i] * r, bias).rgb;
  return acc / 12.0;
}

void main() {
  // The quad reaches past the card for the glow; cuv is the card's own uv (0..1 across the card).
  vec2 cuv = (vUv - 0.5) * (1.0 + 2.0 * uPad / uFacePx) + 0.5;
  vec2 fuv = vec2(cuv.x, 1.0 - cuv.y);
  vec2 fp = fuv * uFacePx;
  // Distance from the card's rounded edge, in face px (negative inside), and its outline, softer out of focus.
  float d = sdRound(fp - uFacePx * 0.5, uFacePx * 0.5, ${FACE_RADIUS}.0);
  float aa = max(fwidth(d), 1e-4) + uBlur * 6.0;
  float mask = clamp(0.5 - d / aa, 0.0, 1.0);
  vec4 f = face(clamp(cuv, 0.0, 1.0));
  vec4 col = vec4(f.rgb / max(f.a, 1e-3) * mask, mask); // premultiplied

  // The preview recording, cover-fitted into its rounded box over the poster (inset 1px to keep its border).
  if (uVideoOn > 0.001) {
    vec2 extent = uVideoBox.zw * 0.5 - 1.0;
    float d = sdRound(fp - (uVideoBox.xy + uVideoBox.zw * 0.5), extent, uVideoRadius - 1.0);
    float m = clamp(0.5 - d / max(fwidth(d), 1e-4), 0.0, 1.0);
    vec2 vp = (fp - uVideoBox.xy) / uVideoBox.zw;
    float box = uVideoBox.z / uVideoBox.w;
    vec2 k = box > uVideoAspect ? vec2(1.0, uVideoAspect / box) : vec2(box / uVideoAspect, 1.0);
    vec2 tuv = (vp - 0.5) * k + 0.5;
    vec3 v = video(vec2(tuv.x, 1.0 - tuv.y));
    col.rgb = mix(col.rgb, v * col.a, m * uVideoOn);
  }

  // Hover: a glare that follows the cursor, a faint holographic sheen, and stardust glinting near it.
  if (uGlare > 0.001) {
    vec2 dm = (fuv - uMouse) * vec2(uFacePx.x / uFacePx.y, 1.0);
    float glare = exp(-dot(dm, dm) * 9.0);
    float phase = dot(fuv, vec2(0.9, 0.6)) * 1.6 - dot(uMouse, vec2(1.0, 0.7)) * 1.2;
    vec3 holo = 0.55 + 0.45 * cos(6.28318 * (phase + vec3(0.0, 0.2, 0.4)));
    holo = mix(holo, uTint + 0.3, 0.4);
    vec2 cell = floor(fp / 6.0);
    float h = hash(cell);
    float dot6 = smoothstep(0.32, 0.0, length(fract(fp / 6.0) - 0.5));
    float glint = step(0.972, h) * dot6 * (0.5 + 0.5 * sin(uTime * 4.0 + h * 60.0));
    vec3 add = vec3(1.0, 0.98, 0.95) * glare * 0.26 + holo * (0.05 + 0.12 * glare) + vec3(glint * glare);
    col.rgb += add * uGlare * col.a;
  }

  // Starry glow: the card's own colours, taken blurred from just inside its edge, shine out around it and in along
  // its rim, so it seems to give off its gradient, with stars twinkling in the light on both sides of the edge.
  if (uGlow > 0.001) {
    // An explicit mip: outside the card one axis is clamped, which would trick filtering into a sharp one.
    vec3 edgeCol = textureLod(uFace, clamp(cuv, 0.06, 0.94), 6.0).rgb;
    vec3 glow = min(edgeCol * 2.0 + uTint * 0.6, vec3(1.1));
    vec2 cell = floor(fp / 13.0);
    float h = hash(cell);
    vec2 lp = fract(fp / 13.0) - 0.5 - (vec2(hash(cell + 7.1), hash(cell + 3.7)) - 0.5) * 0.45;
    float tw = 0.4 + 0.6 * sin(uTime * (1.2 + h * 2.5) + h * 40.0);
    float size = 0.75 + 0.5 * hash(cell + 1.9);
    float star = step(0.7, h) * tw * 1.4 * (
      smoothstep(0.15 * size, 0.0, length(lp)) +
      0.7 * smoothstep(0.46 * size, 0.0, abs(lp.x)) * smoothstep(0.045, 0.0, abs(lp.y)) +
      0.7 * smoothstep(0.46 * size, 0.0, abs(lp.y)) * smoothstep(0.045, 0.0, abs(lp.x)));
    // Both fade out well before the edge of the quad, so it never shows.
    float reach = smoothstep(${GLOW_PAD}.0, ${GLOW_PAD}.0 * 0.55, d);
    star *= exp(-abs(d) / 34.0) * reach;
    // Inner glow along the rim.
    col.rgb += glow * (exp(min(d, 0.0) / 16.0) * 0.4 + star) * mask * uGlow;
    // Outer glow and its stars, given off into the dark around the card.
    float halo = exp(-max(d, 0.0) / 18.0) * reach * (1.0 - mask);
    vec3 outerStar = mix(glow, vec3(1.0), 0.45) * star * (1.0 - mask);
    col.rgb += (glow * halo * 0.75 + outerStar) * uGlow;
    col.a += (halo * 0.45 + star * 0.6 * (1.0 - mask)) * uGlow;
  }

  // Turning over: a band of light sweeps across the card, like a sheet of glass catching the light.
  float band = dot(fuv, vec2(1.0, 0.35)) - mix(-0.4, 1.75, vTurn);
  col.rgb += vec3(1.0, 0.98, 0.95) * exp(-band * band * 30.0) * 0.45 * sin(PI * vTurn) * mask;

  // From behind, in a side slot, it's the card's reflection: mirrored back, a little darker, with a soft gloss
  // falling from the top edge.
  if (!gl_FrontFacing) {
    col.rgb *= 0.78;
    col.rgb += vec3(0.86, 0.84, 1.0) * 0.08 * smoothstep(0.55, 0.0, fuv.y) * mask;
  }
  gl_FragColor = col * uAlpha;
}
`;

type Card = {
  mesh: THREE.Mesh;
  u: Record<string, THREE.IUniform>;
  face: THREE.CanvasTexture;
  video: HTMLVideoElement | null;
  videoTex: THREE.VideoTexture | null;
};

class WebGLStage implements Stage {
  layout: Layout;
  hidden = -1;
  dim = 1;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
  private geometry = new THREE.PlaneGeometry(1, 1, 48, 24);
  private blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  private cards: Card[];
  private size = { w: 1, h: 1 };
  private hover = { v: 0, target: 0, mx: 0.5, my: 0.5, tx: 0.5, ty: 0.5 };
  // Zoom on hover for each side card, and which one the pointer is over (-1 for none).
  private lift: number[];
  private lifted = -1;
  private raf = 0;
  private last = 0;
  private running = false;
  private ro: ResizeObserver;

  constructor(
    private box: HTMLElement,
    private opts: StageOptions,
  ) {
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0);
    const canvas = this.renderer.domElement;
    canvas.className = "pcx-canvas";
    canvas.setAttribute("aria-hidden", "true");
    box.appendChild(canvas);
    this.blank.needsUpdate = true;
    this.layout = computeLayout(1, 1, opts.barZone);
    const aniso = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());

    this.cards = opts.faces.map((faceCanvas, i) => {
      const face = new THREE.CanvasTexture(faceCanvas);
      face.premultiplyAlpha = true;
      face.anisotropy = aniso;
      const tint = new THREE.Color(opts.tints[i]);
      const u: Record<string, THREE.IUniform> = {
        uSize: { value: new THREE.Vector2(1, 1) },
        uCenter: { value: new THREE.Vector2() },
        uOffset: { value: 0 },
        uSpacing: { value: 1 },
        uPersp: { value: 1000 },
        uHover: { value: 0 },
        uGlare: { value: 0 },
        uTilt: { value: new THREE.Vector2() },
        uFace: { value: face },
        uVideo: { value: this.blank },
        uVideoOn: { value: 0 },
        uVideoBox: { value: new THREE.Vector4(VIDEO_BOX.x, VIDEO_BOX.y, VIDEO_BOX.w, VIDEO_BOX.h) },
        uVideoRadius: { value: VIDEO_BOX.r },
        uVideoAspect: { value: 1.6 },
        uFacePx: { value: new THREE.Vector2(FACE_W, FACE_H) },
        uAlpha: { value: 1 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uTime: { value: 0 },
        uTint: { value: new THREE.Vector3(tint.r, tint.g, tint.b) },
        uPad: { value: 0 },
        uBlur: { value: 0 },
        uGlow: { value: 0 },
      };
      const material = new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        premultipliedAlpha: true,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(this.geometry, material);
      mesh.frustumCulled = false;
      this.scene.add(mesh);
      return { mesh, u, face, video: opts.videos[i] ?? null, videoTex: null };
    });

    this.lift = this.cards.map(() => 0);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(box);
    this.resize();
  }

  resize() {
    const w = Math.max(1, this.box.clientWidth);
    const h = Math.max(1, this.box.clientHeight);
    this.size = { w, h };
    this.renderer.setSize(w, h, false);
    Object.assign(this.camera, { left: -w / 2, right: w / 2, top: h / 2, bottom: -h / 2 });
    this.camera.updateProjectionMatrix();
    this.layout = computeLayout(w, h, this.opts.barZone);
    if (!this.running) this.draw(performance.now());
  }

  setRunning(on: boolean) {
    if (on === this.running) return;
    this.running = on;
    cancelAnimationFrame(this.raf);
    if (on) {
      this.last = performance.now();
      const loop = (t: number) => {
        this.raf = requestAnimationFrame(loop);
        if (!document.hidden) this.draw(t);
      };
      this.raf = requestAnimationFrame(loop);
    }
  }

  // Hover tracking: the centre card (zoom, tilt and glare) or a side card either side of it (zoom). x, y are px
  // from the stage's top-left; null when the pointer leaves.
  pointer(x: number | null, y = 0): Hover {
    const pos = this.opts.getPos();
    const centre = Math.round(pos);
    this.hover.target = 0;
    this.lifted = -1;
    if (x === null || Math.abs(pos - centre) > 0.02) return null;
    const inside = (r: Rect) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    const r = this.restRect(1 + HOVER_SCALE * this.hover.v);
    if (inside(r)) {
      this.hover.target = 1;
      this.hover.tx = (x - r.x) / r.w;
      this.hover.ty = (y - r.y) / r.h;
      return "centre";
    }
    for (const side of [-1, 1]) {
      const i = centre + side;
      if (i < 0 || i >= this.cards.length) continue;
      if (inside(this.restRect(SIDE_SCALE * (1 + HOVER_SCALE * this.lift[i]), side))) {
        this.lifted = i;
        return "side";
      }
    }
    return null;
  }

  // A card's box within the stage at rest, in the centre slot or a side slot (side -1 or 1).
  private restRect(scale = 1, side = 0): Rect {
    const L = this.layout;
    const w = L.W * scale;
    const h = L.H * scale;
    return { x: this.size.w / 2 + side * L.spacing - w / 2, y: L.centerY - h / 2, w, h };
  }

  // Viewport rect of card i once it's in the middle, as it's drawn right now (hover zoom included).
  cardRect(_i: number): Rect {
    const b = this.box.getBoundingClientRect();
    const r = this.restRect(1 + HOVER_SCALE * this.hover.v);
    return { x: b.left + r.x, y: b.top + r.y, w: r.w, h: r.h };
  }

  updateFace(i: number) {
    const c = this.cards[i];
    if (c) c.face.needsUpdate = true;
  }

  private draw(t: number) {
    const dt = Math.min(0.05, (t - this.last) / 1000);
    this.last = t;
    const L = this.layout;
    const pos = this.opts.getPos();
    const centre = Math.round(pos);
    const h = this.hover;
    if (Math.abs(pos - centre) > 0.02) {
      h.target = 0;
      this.lifted = -1;
    }
    const ease = 1 - Math.exp(-dt * 9);
    h.v += (h.target - h.v) * ease;
    h.mx += (h.tx - h.mx) * ease;
    h.my += (h.ty - h.my) * ease;

    this.cards.forEach((c, i) => {
      const o = i - pos;
      const ao = Math.abs(o);
      const alpha = i === this.hidden ? 0 : (1 - smooth(1.15, 1.75, ao)) * (i === centre ? 1 : this.dim);
      c.mesh.visible = alpha > 0.002;
      if (!c.mesh.visible) return;
      // Nearest the middle is drawn last, on top.
      c.mesh.renderOrder = -Math.round(ao * 100);
      const u = c.u;
      u.uOffset.value = o;
      u.uAlpha.value = alpha;
      (u.uSize.value as THREE.Vector2).set(L.W, L.H);
      (u.uCenter.value as THREE.Vector2).set(0, this.size.h / 2 - L.centerY);
      u.uSpacing.value = L.spacing;
      u.uPersp.value = L.persp;
      // Out of focus and glowing as it turns away to the side; the middle card stays crisp.
      const side = smooth(0.25, 1, Math.min(ao, 1));
      this.lift[i] += ((i === this.lifted ? 1 : 0) - this.lift[i]) * ease;
      u.uBlur.value = side;
      // A hovered side card brightens a little as it zooms.
      u.uGlow.value = side * (1 + 0.35 * this.lift[i]);
      u.uPad.value = side > 0.001 ? GLOW_PAD : 0;
      u.uTime.value = t / 1000;
      const hv = i === centre ? h.v : 0;
      u.uHover.value = i === centre ? h.v : this.lift[i];
      u.uGlare.value = hv;
      (u.uMouse.value as THREE.Vector2).set(h.mx, h.my);
      (u.uTilt.value as THREE.Vector2).set((h.mx - 0.5) * TILT * 2 * hv, (h.my - 0.5) * TILT * 2 * hv);

      // The recording takes over from the poster once it has a frame; a paused one keeps its last frame.
      const v = c.video;
      if (v && v.readyState >= 2) {
        if (!c.videoTex) {
          c.videoTex = new THREE.VideoTexture(v);
          // Mipmapped, so it blurs smoothly on the side cards.
          c.videoTex.generateMipmaps = true;
          c.videoTex.minFilter = THREE.LinearMipmapLinearFilter;
          // It only uploads when a new frame is presented; upload the current one now, in case it pauses first.
          c.videoTex.needsUpdate = true;
          u.uVideo.value = c.videoTex;
        }
        if (v.videoWidth) u.uVideoAspect.value = v.videoWidth / v.videoHeight;
        u.uVideoOn.value = Math.min(1, u.uVideoOn.value + dt * 4);
      }
    });
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.setRunning(false);
    this.ro.disconnect();
    for (const c of this.cards) {
      c.face.dispose();
      c.videoTex?.dispose();
      (c.mesh.material as THREE.Material).dispose();
    }
    this.blank.dispose();
    this.geometry.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

// No WebGL: the same cards and spin with CSS 3D transforms, minus the stretch and the recordings.
class CssStage implements Stage {
  layout: Layout;
  hidden = -1;
  dim = 1;
  private layer: HTMLDivElement;
  private raf = 0;
  private running = false;
  private size = { w: 1, h: 1 };
  private ro: ResizeObserver;

  constructor(
    private box: HTMLElement,
    private opts: StageOptions,
  ) {
    this.layer = document.createElement("div");
    this.layer.className = "pcx-canvas pcx-css";
    this.layer.setAttribute("aria-hidden", "true");
    for (const face of opts.faces) this.layer.appendChild(face);
    box.appendChild(this.layer);
    this.layout = computeLayout(1, 1, opts.barZone);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(box);
    this.resize();
  }

  resize() {
    this.size = { w: Math.max(1, this.box.clientWidth), h: Math.max(1, this.box.clientHeight) };
    this.layout = computeLayout(this.size.w, this.size.h, this.opts.barZone);
    this.draw();
  }

  setRunning(on: boolean) {
    if (on === this.running) return;
    this.running = on;
    cancelAnimationFrame(this.raf);
    if (on) {
      const loop = () => {
        this.raf = requestAnimationFrame(loop);
        if (!document.hidden) this.draw();
      };
      this.raf = requestAnimationFrame(loop);
    }
  }

  pointer(x: number | null, y = 0): Hover {
    const r = this.cardRect(0);
    const b = this.box.getBoundingClientRect();
    const over = x !== null && x >= r.x - b.left && x <= r.x - b.left + r.w && y >= r.y - b.top && y <= r.y - b.top + r.h;
    return over ? "centre" : null;
  }

  cardRect(_i: number): Rect {
    const L = this.layout;
    const b = this.box.getBoundingClientRect();
    return { x: b.left + this.size.w / 2 - L.W / 2, y: b.top + L.centerY - L.H / 2, w: L.W, h: L.H };
  }

  updateFace() {}

  private draw() {
    const L = this.layout;
    const pos = this.opts.getPos();
    const centre = Math.round(pos);
    this.opts.faces.forEach((el, i) => {
      const o = i - pos;
      const { theta, s, x, alpha } = slot(o, L);
      const a = i === this.hidden ? 0 : alpha * (i === centre ? 1 : this.dim);
      el.style.width = `${L.W}px`;
      el.style.height = `${L.H}px`;
      el.style.opacity = String(a);
      el.style.visibility = a > 0.002 ? "visible" : "hidden";
      el.style.zIndex = String(100 - Math.round(Math.abs(o) * 10));
      // Out of focus and glowing in its own tint at the side, like the WebGL cards (minus the stars).
      const side = smooth(0.25, 1, Math.min(Math.abs(o), 1));
      el.style.filter = side > 0.01 ? `blur(${(side * 3).toFixed(2)}px) drop-shadow(0 0 ${Math.round(side * 26)}px ${this.opts.tints[i]})` : "none";
      el.style.transform = `translate(-50%, -50%) translate3d(${this.size.w / 2 + x}px, ${L.centerY}px, 0) perspective(${L.persp}px) rotateY(${theta}rad) scale(${s})`;
    });
  }

  dispose() {
    this.setRunning(false);
    this.ro.disconnect();
    this.layer.remove();
  }
}

function hasWebGL() {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

export function createStage(box: HTMLElement, opts: StageOptions): Stage {
  if (hasWebGL()) {
    try {
      return new WebGLStage(box, opts);
    } catch {
      // Fall through to CSS.
    }
  }
  return new CssStage(box, opts);
}
