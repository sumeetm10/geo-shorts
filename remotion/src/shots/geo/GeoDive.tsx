import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { EndCard } from './EndCard';

// =============================================================================
// "How do you get to the deepest point on Earth?" — a map journey that turns
// into a dive. The first half is NASA Blue Marble (its sea floor shows the
// Mariana Trench); the second half is a drawn cross-section of the water, with
// the camera riding the sub down and pulling out to show the whole 11 km.
// Everything is drawn in code with gradients and seeded noise (no photos, no
// AI images): a research ship, a deep submersible with light beams, sun rays,
// the Titanic's bow, a ridged Everest and a sediment floor.
// Every place, depth and line time arrives as props (make_dive.py).
// =============================================================================
export const compositionConfig = {
  id: 'GeoDive',
  durationInSeconds: 30,
  fps: 30,
  width: 1080,
  height: 1920,
};

const W = 1080;
const H = 1920;
const ROUTE = '#ffe14d';
const ALERT = '#ff3b30';
const DEEP = 10935;       // Challenger Deep, NOAA 2021 estimate (m)
const EVEREST = 8849;     // m
const TITANIC = 3800;     // the wreck lies at about 3,800 m
const DARK = 1000;        // below this there is no sunlight

type Pt = { x: number; y: number };
export type DiveProps = {
  vo: VoLine[];
  wide: { image: string; deep: Pt };
  near: { image: string; guam: Pt; deep: Pt; trench: Pt & { angle: number } };
  at: {
    guam: number; sail: number; dive: number; titanic: number; bottom: number;
    everest: number; pressure: number; people: number; loop: number;
  };
  hook: { top: string; bottom: string };
  durationInSeconds: number;
};

const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const MONO = 'JetBrains Mono, monospace';
const SANS = 'Space Grotesk, sans-serif';

// seeded random, so every frame draws the same rocks and ridges
const rng = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Everest's skyline: a main summit, Lhotse's shoulder to its right, and a
// ridged, broken outline from midpoint displacement. h is 0 (floor) .. 1 (top).
const RIDGE: [number, number][] = (() => {
  const r = rng(8849);
  const base = (x: number) => {
    const main = Math.max(0, 1 - Math.abs(x - 0.47) / 0.47) ** 1.15;
    const lhotse = 0.9 * Math.max(0, 1 - Math.abs(x - 0.62) / 0.3) ** 1.3;
    const nuptse = 0.72 * Math.max(0, 1 - Math.abs(x - 0.3) / 0.26) ** 1.4;
    return Math.max(main, lhotse, nuptse);
  };
  let pts: [number, number][] = [[0, 0], [1, 0]];
  let amp = 0.16;
  for (let level = 0; level < 6; level++) {
    const next: [number, number][] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, h0] = pts[i];
      const [x1, h1] = pts[i + 1];
      const xm = (x0 + x1) / 2;
      const hm = level === 0 ? base(xm) : (h0 + h1) / 2 * 0.35 + base(xm) * 0.65 + (r() - 0.5) * amp;
      next.push(pts[i], [xm, Math.max(0, Math.min(1, hm))]);
    }
    next.push(pts[pts.length - 1]);
    pts = next;
    amp *= 0.55;
  }
  // pin the true summit
  let top = 0;
  pts.forEach((p, i) => { if (p[1] > pts[top][1]) top = i; });
  pts[top] = [pts[top][0], 1];
  return pts.map(([x, h], i) => [x, i === 0 || i === pts.length - 1 ? 0 : h / pts[top][1]] as [number, number]);
})();

const ROCKS = (() => {
  const r = rng(10935);
  return Array.from({ length: 26 }, () => ({ x: r() * W, w: 8 + r() * 26, h: 4 + r() * 10, dy: r() * 30 }));
})();

// ----------------------------------------------------------------- map bits
const Pin: React.FC<{ p: Pt; o: number; label?: string; color?: string }> = ({ p, o, label, color = ALERT }) => {
  const f = useCurrentFrame();
  const ring = (f % 36) / 36;
  return (
    <>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: o }}>
        <circle cx={p.x} cy={p.y} r={18 + ring * 46} fill="none" stroke={color} strokeWidth={4} opacity={1 - ring} />
        <circle cx={p.x} cy={p.y} r={16} fill={color} stroke="#fff" strokeWidth={5} />
      </svg>
      {label && (
        <div style={{
          position: 'absolute', left: p.x, top: p.y - 74, transform: 'translate(-50%,-50%)', opacity: o,
          background: 'rgba(8,10,14,0.85)', border: `2px solid ${color}`, borderRadius: 10,
          padding: '6px 16px', fontFamily: SANS, fontWeight: 700, fontSize: 34, color: '#fff',
          whiteSpace: 'nowrap',
        }}>{label}</div>
      )}
    </>
  );
};

// an airliner seen from above, nose along +x
const Airliner: React.FC<{ x: number; y: number; angle: number; s: number }> = ({ x, y, angle, s }) => (
  <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${s})`}>
    <ellipse cx={4} cy={16} rx={36} ry={7} fill="rgba(0,0,0,0.35)" />
    <path d="M -18 -2 L 6 -34 L 12 -34 L 4 -2 Z M -18 2 L 6 34 L 12 34 L 4 2 Z" fill="url(#wing)" />
    <path d="M -36 -1 L -30 -13 L -26 -13 L -28 -1 Z M -36 1 L -30 13 L -26 13 L -28 1 Z" fill="url(#wing)" />
    <rect x={-6} y={-16} width={10} height={5} rx={2.5} fill="#8d97a3" />
    <rect x={-6} y={11} width={10} height={5} rx={2.5} fill="#8d97a3" />
    <path d="M 40 0 C 40 -4 34 -5 28 -5 L -34 -4 C -38 -3 -40 -1 -40 0 C -40 1 -38 3 -34 4 L 28 5 C 34 5 40 4 40 0 Z"
      fill="url(#fuse)" />
    <path d="M 36 -2 L 39 -1 L 39 1 L 36 2 Z" fill="#2b3a4c" />
  </g>
);

// a small ship seen from above, bow along +x, with a foam wake
const ShipTop: React.FC<{ x: number; y: number; angle: number; s: number; wake: number }> = ({ x, y, angle, s, wake }) => (
  <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${s})`}>
    <path d={`M -14 -3 L ${-14 - 90 * wake} ${-26 * wake} M -14 3 L ${-14 - 90 * wake} ${26 * wake}`}
      stroke="rgba(255,255,255,0.55)" strokeWidth={3} fill="none" strokeLinecap="round" />
    <path d={`M -14 0 L ${-14 - 120 * wake} 0`} stroke="rgba(255,255,255,0.35)" strokeWidth={7} strokeLinecap="round" />
    <path d="M 22 0 C 18 -6 10 -7 -14 -7 L -16 -5 L -16 5 L -14 7 C 10 7 18 6 22 0 Z" fill="#f2f4f6" stroke="#1d2b44" strokeWidth={1.5} />
    <rect x={-6} y={-4} width={12} height={8} rx={1.5} fill="#cfd6de" />
    <rect x={-14} y={-5} width={5} height={10} fill="#ff7a1a" />
  </g>
);

// ----------------------------------------------------------------- dive bits
// research vessel, side view, bow to the right; wy is the waterline
const Ship: React.FC<{ x: number; wy: number; s: number }> = ({ x, wy, s }) => (
  <g transform={`translate(${x} ${wy}) scale(${s})`}>
    {/* below the waterline, seen through the water */}
    <path d="M -148 0 L 140 0 L 118 34 L -136 34 Z" fill="#7a2323" opacity={0.55} />
    <path d="M -150 -44 L 138 -50 L 156 -54 L 142 0 L -148 0 L -154 -30 Z" fill="url(#hull)" />
    <path d="M -150 -44 L 138 -50 L 156 -54 L 155 -49 L 138 -45 L -151 -39 Z" fill="#e8edf2" />
    <path d="M -50 -44 L -50 -92 L 72 -92 L 84 -48 Z" fill="url(#white)" />
    <path d="M -20 -92 L -20 -124 L 52 -124 L 62 -92 Z" fill="url(#white)" />
    {Array.from({ length: 7 }, (_, i) => (
      <rect key={i} x={-40 + i * 16} y={-78} width={9} height={7} rx={1} fill="#1b2d44" />
    ))}
    <path d="M -14 -118 L 50 -118 L 56 -106 L -14 -106 Z" fill="#1b2d44" />
    <rect x={-40} y={-140} width={18} height={48} fill="#e8edf2" />
    <rect x={-40} y={-140} width={18} height={10} fill="#1d4f8c" />
    <line x1={24} y1={-124} x2={24} y2={-176} stroke="#dde3e9" strokeWidth={4} />
    <rect x={8} y={-166} width={32} height={5} rx={2} fill="#9aa4ae" />
    {/* A-frame crane at the stern: it lowers the sub into the sea */}
    <path d="M -140 -44 L -122 -118 L -104 -118 L -96 -44" fill="none" stroke="#ff7a1a" strokeWidth={7}
      strokeLinejoin="round" />
    <line x1={-113} y1={-118} x2={-113} y2={-60} stroke="#2a2f36" strokeWidth={2} />
  </g>
);

// deep submersible, side view, facing right; styled on modern two-person subs
const Sub: React.FC<{ x: number; y: number; s: number; light: number; shake: number }> = ({ x, y, s, light, shake }) => {
  const f = useCurrentFrame();
  const jx = shake * Math.sin(f * 2.7) * 3;
  const spin = Math.abs(Math.sin(f * 0.9));
  return (
    <g transform={`translate(${x + jx} ${y}) scale(${s})`}>
      {light > 0.01 && (
        <g opacity={light} filter="url(#soft)">
          <path d="M 92 -26 L 560 -170 L 560 40 Z" fill="url(#beam)" />
          <path d="M 92 30 L 560 90 L 560 300 Z" fill="url(#beam)" />
        </g>
      )}
      {/* skids and the sample basket */}
      <path d="M -80 60 L 70 60 M -60 50 L -60 60 M 40 50 L 40 60" stroke="#59626c" strokeWidth={5} />
      <rect x={24} y={44} width={58} height={14} fill="none" stroke="#8a939d" strokeWidth={2} />
      <path d="M 34 44 L 34 58 M 46 44 L 46 58 M 58 44 L 58 58 M 70 44 L 70 58" stroke="#8a939d" strokeWidth={1.2} />
      {/* rear thruster */}
      <rect x={-122} y={-14} width={30} height={26} rx={5} fill="url(#metal)" />
      <ellipse cx={-124} cy={-1} rx={3} ry={12 * spin + 2} fill="#aab3bd" />
      {/* hull */}
      <path d="M -96 -40 C -96 -54 -84 -58 -64 -58 L 50 -58 C 80 -58 96 -36 96 0
               C 96 36 80 54 50 54 L -64 54 C -84 54 -96 46 -96 34 Z" fill="url(#subBody)" />
      <path d="M -90 -44 C -84 -54 -70 -54 -60 -54 L 48 -54 C 66 -54 80 -46 88 -34 L -90 -34 Z"
        fill="#ffffff" opacity={0.55} />
      <rect x={-96} y={4} width={186} height={12} fill="#16324f" />
      {/* hatch tower and top thruster */}
      <rect x={-34} y={-78} width={44} height={22} rx={8} fill="url(#subBody)" />
      <rect x={30} y={-72} width={26} height={16} rx={4} fill="url(#metal)" />
      <circle cx={-12} cy={-84} r={4} fill="#ff5a3c" opacity={0.5 + 0.5 * Math.abs(Math.sin(f / 5))} />
      {/* the pilot's viewport */}
      <circle cx={62} cy={-14} r={17} fill="url(#port)" stroke="#8b96a1" strokeWidth={5} />
      <ellipse cx={56} cy={-20} rx={6} ry={3.5} fill="#ffffff" opacity={0.6} />
      {/* light bar and folded arm */}
      <rect x={86} y={-34} width={12} height={78} rx={4} fill="#dfe6ec" />
      {[-24, -4, 16, 34].map((ly) => (
        <circle key={ly} cx={96} cy={ly} r={4.5} fill="#fffbe6" opacity={0.35 + 0.65 * light} />
      ))}
      <path d="M 70 40 L 104 30 L 116 52" fill="none" stroke="#454d57" strokeWidth={6}
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={104} cy={30} r={5} fill="#6b7580" />
    </g>
  );
};

// the Titanic's bow section, as it lies: broken off, dark, rusting
const Wreck: React.FC<{ x: number; y: number; s: number; o: number }> = ({ x, y, s, o }) => (
  <g transform={`translate(${x} ${y}) rotate(-4) scale(${s})`} opacity={o}>
    <path d="M -170 -26 L -150 -34 L -160 -12 L -142 -4 L -166 12 L -150 30 L 150 30
             C 170 24 184 -10 188 -52 L 160 -46 L -120 -36 Z" fill="url(#rust)" />
    <path d="M -120 -36 L 160 -46 L 188 -52 L 186 -46 L 160 -40 L -122 -30 Z" fill="#6d5444" />
    {Array.from({ length: 13 }, (_, i) => (
      <circle key={i} cx={-110 + i * 20} cy={-18 + i * -0.5} r={2.6} fill="#0b0706" stroke="#7a4a2a" strokeWidth={1} />
    ))}
    {Array.from({ length: 9 }, (_, i) => (
      <path key={i} d={`M ${-100 + i * 30} -30 L ${-102 + i * 30} ${4 + (i % 3) * 8}`}
        stroke="rgba(160,86,40,0.55)" strokeWidth={3} />
    ))}
    <path d="M -60 -38 L -60 -60 L 40 -62 L 44 -42 Z" fill="#3a2a22" />
    <path d="M 60 -44 L 120 -110" stroke="#4a372c" strokeWidth={5} />
  </g>
);

// Marine snow: flakes in screen space that rise past the sub as it sinks.
const Snow: React.FC<{ depthPx: number; o: number }> = ({ depthPx, o }) => {
  const dots = [];
  for (let i = 0; i < 90; i++) {
    const r = Math.sin(i * 12.9898) * 43758.5453;
    const rx = r - Math.floor(r);
    const r2 = Math.sin(i * 78.233) * 24634.6345;
    const ry = r2 - Math.floor(r2);
    const y = (((ry * (H + 200) - depthPx * (0.8 + ry * 0.6)) % (H + 200)) + (H + 200)) % (H + 200) - 100;
    dots.push(<circle key={i} cx={rx * W} cy={y} r={1.2 + ry * 2.2} fill="#dfefff" opacity={0.18 + ry * 0.35} />);
  }
  return <g opacity={o}>{dots}</g>;
};

// ------------------------------------------------------------------ the shot
const GeoDive: React.FC<Partial<DiveProps>> = ({
  vo = [], wide, near, at, hook = { top: '', bottom: '' }, durationInSeconds = 30,
}) => {
  const f = useCurrentFrame();
  if (!wide || !near || !at) return <AbsoluteFill style={{ background: '#05070b' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const span = (fr: number, i: number, a: number, b: number) =>
    prog(fr, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const within = (i: number, a: number, b: number) => span(f, i, a, b);

  // ---------------- map half
  const toNear = EASE_INOUT(prog(f, cue(at.guam) - 6, cue(at.guam) + 10));
  const toDive = EASE_INOUT(prog(f, cue(at.dive) - 4, cue(at.dive) + 12));
  const wideZoom = 1.04 + 0.05 * prog(f, 0, cue(at.guam)) + 1.6 * toNear;
  const nearZoom = 1.18 - 0.18 * toNear + 1.8 * toDive;
  const plane = EASE_INOUT(within(at.guam, 0.05, 0.75));
  const route = EASE_INOUT(within(at.sail, 0.08, 0.9));
  const g = near.guam;
  const d = near.deep;
  const planeFrom = { x: g.x - 700, y: g.y - 520 };
  const px = lerp(planeFrom.x, g.x, plane);
  const py = lerp(planeFrom.y, g.y, plane);
  const bx = lerp(g.x, d.x, route * 0.86);           // the ship stops short of the pin
  const by = lerp(g.y, d.y, route * 0.86);
  const heading = (Math.atan2(d.y - g.y, d.x - g.x) * 180) / Math.PI;

  // ---------------- dive half: depth (m) at the sub, and the camera
  const bottomAt = lerp(cue(at.bottom), lineEnd(at.bottom), 0.62);
  const depthAt = (fr: number) => {
    if (fr >= cue(at.bottom)) return TITANIC + (DEEP - TITANIC) * EASE_INOUT(prog(fr, cue(at.bottom), bottomAt));
    if (fr >= cue(at.titanic)) return DARK + (TITANIC - DARK) * EASE_INOUT(span(fr, at.titanic, 0, 0.45));
    if (fr >= cue(at.dive)) return DARK * EASE_INOUT(span(fr, at.dive, 0.15, 0.8));
    return 0;
  };
  const D = depthAt(f);
  const sinking = Math.min(1, Math.max(0, depthAt(f) - depthAt(f - 2)) / 20);
  const out = EASE_INOUT(Math.min(within(at.everest, 0, 0.35), 1 - within(at.pressure, 0, 0.3)));
  const zOut = f >= cue(at.everest) ? out : 0;
  const K = lerp(0.32, 1230 / DEEP, zOut);
  const A = lerp(780 - D * 0.32, 330, zOut);
  const yOf = (m: number) => A + m * K;
  const subX = lerp(540, 880, zOut);
  const subY = yOf(D);
  const subS = lerp(1, 0.42, zOut);
  const diveO = toDive;
  const loopT = EASE_INOUT(prog(f, cue(at.loop), END - 4));
  const hookO = Math.max(1 - prog(f, cue(at.guam) - 8, cue(at.guam) + 4), prog(f, END - 22, END - 4));

  const y0 = yOf(0);
  const water = `linear-gradient(to bottom, #9fd4f5 0px, #d9eefb ${y0 - 1}px, #3aa0dc ${y0}px,
    #1c74b4 ${yOf(120)}px, #0f4f8a ${yOf(350)}px, #072447 ${yOf(DARK)}px, #020b18 ${yOf(3000)}px,
    #000307 ${yOf(DEEP)}px)`;
  const floorY = yOf(DEEP);
  const floorPath = (() => {
    const r = rng(42);
    let p = `M 0 ${floorY + 8}`;
    for (let x = 60; x <= W + 60; x += 60) p += ` L ${x} ${floorY + (r() - 0.5) * 16}`;
    return p + ` L ${W + 60} ${H + 600} L 0 ${H + 600} Z`;
  })();
  const evO = f >= cue(at.everest) ? EASE_OUT(within(at.everest, 0.25, 0.6)) * (1 - within(at.pressure, 0, 0.3)) : 0;
  const evPeak = yOf(DEEP - EVEREST);
  const evGrow = lerp(floorY, evPeak, EASE_OUT(within(at.everest, 0.25, 0.7)));
  const EV0 = 50;
  const EVW = 760;
  const ridge = RIDGE.map(([x, h]) => `${EV0 + x * EVW},${lerp(floorY + 4, evGrow, h)}`).join(' L ');
  const snowLine = lerp(floorY, evGrow, 0.62);
  const snowEdge = (() => {
    const r = rng(7);
    let p = `M ${EV0} ${snowLine}`;
    for (let x = EV0; x <= EV0 + EVW; x += 22) p += ` L ${x} ${snowLine + (r() - 0.3) * 26}`;
    return p + ` L ${EV0 + EVW} ${evGrow - 60} L ${EV0} ${evGrow - 60} Z`;
  })();
  const pressO = f >= cue(at.pressure) ? EASE_OUT(within(at.pressure, 0.2, 0.45)) * (1 - prog(f, cue(at.people), cue(at.people) + 8)) : 0;
  const peopleO = f >= cue(at.people) ? EASE_OUT(prog(f, cue(at.people), cue(at.people) + 12)) * (1 - prog(f, cue(at.loop) - 6, cue(at.loop) + 4)) : 0;
  const counterO = diveO * (1 - prog(f, cue(at.loop), cue(at.loop) + 10)) * (1 - zOut);
  const lightOn = prog(D, 350, 1000);
  const raysO = 1 - prog(D, 150, 700);
  const poolO = prog(D, DEEP - 900, DEEP) * (1 - zOut);

  return (
    <AbsoluteFill style={{ backgroundColor: '#05070b', overflow: 'hidden' }}>
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="wing" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#dfe5ea" /><stop offset="1" stopColor="#aeb8c2" />
          </linearGradient>
          <linearGradient id="fuse" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" /><stop offset="0.6" stopColor="#e3e8ed" />
            <stop offset="1" stopColor="#a9b3bd" />
          </linearGradient>
        </defs>
      </svg>

      {/* ---------------- map half ---------------- */}
      {diveO < 1 && (
        <AbsoluteFill style={{ opacity: 1 - diveO }}>
          {toNear < 1 && (
            <AbsoluteFill style={{
              opacity: 1 - toNear, transform: `scale(${wideZoom})`,
              transformOrigin: `${wide.deep.x}px ${wide.deep.y}px`,
            }}>
              <Img src={staticFile(wide.image)} style={{ width: W, height: H, objectFit: 'cover' }} />
              <Pin p={wide.deep} o={1} />
            </AbsoluteFill>
          )}
          {toNear > 0 && (
            <AbsoluteFill style={{
              opacity: toNear, transform: `scale(${nearZoom})`, transformOrigin: `${d.x}px ${d.y}px`,
            }}>
              <Img src={staticFile(near.image)} style={{ width: W, height: H, objectFit: 'cover' }} />
              <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
                <defs>
                  <linearGradient id="trail" gradientUnits="userSpaceOnUse" x1={planeFrom.x} y1={planeFrom.y} x2={px} y2={py}>
                    <stop offset="0" stopColor="#fff" stopOpacity={0} /><stop offset="1" stopColor="#fff" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                {route > 0 && (
                  <>
                    <line x1={g.x} y1={g.y} x2={bx} y2={by} stroke="rgba(0,0,0,0.45)" strokeWidth={12}
                      strokeLinecap="round" />
                    <line x1={g.x} y1={g.y} x2={bx} y2={by} stroke={ROUTE} strokeWidth={6}
                      strokeDasharray="20 16" strokeLinecap="round" />
                    <ShipTop x={bx} y={by} angle={heading} s={2.2} wake={Math.min(1, route * 4)} />
                  </>
                )}
                {plane > 0 && plane < 1 && (
                  <>
                    <line x1={planeFrom.x} y1={planeFrom.y} x2={px} y2={py} stroke="url(#trail)" strokeWidth={5}
                      strokeLinecap="round" />
                    <Airliner x={px} y={py} angle={36.6} s={2.1} />
                  </>
                )}
              </svg>
              <div style={{
                position: 'absolute', left: near.trench.x, top: near.trench.y,
                transform: `translate(-50%,-50%) rotate(${near.trench.angle}deg)`,
                opacity: EASE_OUT(within(at.sail, 0.1, 0.35)) * (1 - toDive),
                fontFamily: SANS, fontWeight: 700, fontSize: 40, letterSpacing: 6, color: '#bfe3ff',
                textShadow: '0 4px 16px rgba(0,0,0,0.9)', whiteSpace: 'nowrap',
              }}>MARIANA TRENCH</div>
              <Pin p={g} o={EASE_OUT(within(at.guam, 0.35, 0.6))} label="GUAM" color="#2bb673" />
              <Pin p={d} o={EASE_OUT(within(at.sail, 0.55, 0.8))} label="CHALLENGER DEEP" />
              <div style={{
                position: 'absolute', left: (g.x + d.x) / 2 + 70, top: (g.y + d.y) / 2 + 40,
                transform: 'translate(-50%,-50%)', opacity: EASE_OUT(within(at.sail, 0.3, 0.5)),
                background: 'rgba(8,10,14,0.85)', borderRadius: 10, padding: '6px 14px',
                fontFamily: MONO, fontSize: 32, color: ROUTE, whiteSpace: 'nowrap',
              }}>300+ KM</div>
            </AbsoluteFill>
          )}
        </AbsoluteFill>
      )}

      {/* ---------------- dive half ---------------- */}
      {diveO > 0 && (
        <AbsoluteFill style={{ opacity: diveO, background: water }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#fff8dc" stopOpacity={0.6} />
                <stop offset="0.5" stopColor="#dff3ff" stopOpacity={0.16} />
                <stop offset="1" stopColor="#dff3ff" stopOpacity={0} />
              </linearGradient>
              <filter id="soft" x="-20%" y="-50%" width="140%" height="200%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
              <linearGradient id="subBody" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffffff" /><stop offset="0.45" stopColor="#e4e9ee" />
                <stop offset="1" stopColor="#98a3ae" />
              </linearGradient>
              <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#c3cad1" /><stop offset="0.5" stopColor="#7d8791" />
                <stop offset="1" stopColor="#4a525b" />
              </linearGradient>
              <radialGradient id="port" cx="0.4" cy="0.35" r="0.7">
                <stop offset="0" stopColor="#4d7392" /><stop offset="0.6" stopColor="#10273c" />
                <stop offset="1" stopColor="#050c14" />
              </radialGradient>
              <linearGradient id="hull" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#2c3f5e" /><stop offset="1" stopColor="#131d2e" />
              </linearGradient>
              <linearGradient id="white" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#c9d1d9" />
              </linearGradient>
              <linearGradient id="rust" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#3d2a20" /><stop offset="0.5" stopColor="#24170f" />
                <stop offset="1" stopColor="#140c08" />
              </linearGradient>
              <linearGradient id="rock" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#9c948c" /><stop offset="0.47" stopColor="#7c756e" />
                <stop offset="0.5" stopColor="#4e4945" /><stop offset="1" stopColor="#2f2c29" />
              </linearGradient>
              <linearGradient id="snowFill" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#ffffff" /><stop offset="0.48" stopColor="#f1f5f9" />
                <stop offset="0.52" stopColor="#b9c6d3" /><stop offset="1" stopColor="#8e9cab" />
              </linearGradient>
              <linearGradient id="sediment" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#5a4c40" /><stop offset="0.08" stopColor="#3b3129" />
                <stop offset="1" stopColor="#15110e" />
              </linearGradient>
              <radialGradient id="pool" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor="#fff3cf" stopOpacity={0.5} />
                <stop offset="1" stopColor="#fff3cf" stopOpacity={0} />
              </radialGradient>
              <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor="#bfe3ff" stopOpacity={0.16} />
                <stop offset="1" stopColor="#bfe3ff" stopOpacity={0} />
              </radialGradient>
              <linearGradient id="ray" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffffff" stopOpacity={0.3} />
                <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
              <clipPath id="evClip"><path d={`M ${ridge} Z`} /></clipPath>
            </defs>

            {/* sun rays under the surface, gone within a few hundred metres */}
            {raysO > 0.01 && [0, 1, 2, 3, 4, 5].map((i) => {
              const sway = Math.sin(f / 38 + i * 1.7) * 30;
              const x = 90 + i * 180 + sway;
              return (
                <path key={i} d={`M ${x} ${y0} L ${x + 70} ${y0} L ${x + 230} ${y0 + 1000} L ${x + 40} ${y0 + 1000} Z`}
                  fill="url(#ray)" opacity={raysO * (0.5 + 0.5 * Math.sin(f / 22 + i))} />
              );
            })}

            {/* the surface from just below: a bright, moving line */}
            <path d={`M 0 ${y0} ${Array.from({ length: 13 }, (_, i) =>
              `Q ${i * 90 + 45} ${y0 + Math.sin(f / 9 + i) * 6} ${(i + 1) * 90} ${y0}`).join(' ')}`}
              fill="none" stroke="#f2fbff" strokeWidth={4} opacity={0.85} />
            <Ship x={380} wy={y0} s={1.3 * lerp(1, 0.5, zOut)} />

            <Snow depthPx={D * 0.32} o={prog(D, 30, 300) * (1 - zOut)} />

            {/* depth ruler */}
            {Array.from({ length: 12 }, (_, k) => k * 1000).map((m) => {
              const y = yOf(m);
              if (y < -30 || y > H + 30 || m === 0) return null;
              return (
                <g key={m} opacity={0.7}>
                  <line x1={40} y1={y} x2={78} y2={y} stroke="#cfe6ff" strokeWidth={3} />
                  <text x={88} y={y + 9} fontFamily={MONO} fontSize={26} fill="#cfe6ff">{m / 1000} km</text>
                </g>
              );
            })}

            {/* sunlight ends */}
            <line x1={0} y1={yOf(DARK)} x2={W} y2={yOf(DARK)} stroke="#ffd23f" strokeWidth={3}
              strokeDasharray="18 14" opacity={0.6 * (1 - zOut * 0.5)} />
            <text x={40} y={yOf(DARK) - 22} textAnchor="start" fontFamily={SANS} fontWeight={700}
              fontSize={30} fill="#ffd23f" opacity={0.9 * (1 - zOut)}>NO SUNLIGHT BELOW 1 KM</text>

            {/* the Titanic's depth */}
            <line x1={0} y1={yOf(TITANIC)} x2={W} y2={yOf(TITANIC)} stroke="#e8a15a" strokeWidth={3}
              strokeDasharray="18 14" opacity={0.6} />
            <Wreck x={800} y={yOf(TITANIC) + 90} s={1.05 * lerp(1, 0.45, zOut)}
              o={EASE_OUT(within(at.titanic, 0.05, 0.4)) * (1 - zOut * 0.4)} />
            <text x={40} y={yOf(TITANIC) - 22} textAnchor="start" fontFamily={SANS} fontWeight={700}
              fontSize={30} fill="#e8a15a" opacity={f >= cue(at.titanic) ? 0.95 * (1 - zOut) : 0}>
              TITANIC · 3,800 m</text>

            {/* Everest, standing on the floor of the trench */}
            {evO > 0.01 && (
              <g opacity={evO}>
                <path d={`M ${ridge} Z`} fill="url(#rock)" />
                <g clipPath="url(#evClip)">
                  <path d={snowEdge} fill="url(#snowFill)" opacity={0.95} />
                </g>
                <path d={`M ${ridge}`} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={2} />
                <text x={EV0 + EVW * 0.47} y={evGrow - 26} textAnchor="middle" fontFamily={SANS} fontWeight={700}
                  fontSize={38} fill="#fff">EVEREST 8,849 m</text>
                {/* the water still left above the summit */}
                <line x1={990} y1={yOf(0)} x2={990} y2={evPeak} stroke={ROUTE} strokeWidth={5} />
                <line x1={970} y1={yOf(0)} x2={1010} y2={yOf(0)} stroke={ROUTE} strokeWidth={5} />
                <line x1={970} y1={evPeak} x2={1010} y2={evPeak} stroke={ROUTE} strokeWidth={5} />
                <line x1={EV0 + EVW * 0.47} y1={evPeak} x2={990} y2={evPeak} stroke={ROUTE} strokeWidth={2}
                  strokeDasharray="10 10" />
                <text x={960} y={(yOf(0) + evPeak) / 2 + 12} textAnchor="end" fontFamily={SANS}
                  fontWeight={700} fontSize={40} fill={ROUTE}>2 KM TO SPARE</text>
              </g>
            )}

            {/* the floor: soft sediment and scattered rocks */}
            <path d={floorPath} fill="url(#sediment)" />
            {ROCKS.map((r, i) => (
              <ellipse key={i} cx={r.x} cy={floorY + 6 + r.dy * (1 - zOut * 0.7)} rx={r.w * lerp(1, 0.5, zOut)}
                ry={r.h * lerp(1, 0.5, zOut)} fill="#2a221c" opacity={0.8} />
            ))}
            {poolO > 0.01 && (
              <ellipse cx={subX + 330} cy={floorY + 20} rx={260} ry={46} fill="url(#pool)" opacity={poolO} />
            )}

            {/* the sub's own glow in the dark */}
            <circle cx={subX} cy={subY} r={280 * subS} fill="url(#halo)" opacity={lightOn} />

            {/* bubbles while it sinks */}
            {Array.from({ length: 12 }, (_, k) => {
              const age = ((f + k * 11) % 36) / 36;
              const bx2 = subX + (-70 + ((k * 37) % 60)) * subS + Math.sin(f / 4 + k) * 6;
              return (
                <circle key={k} cx={bx2} cy={subY - (50 + age * 200) * subS} r={(2.5 + (k % 4)) * subS}
                  fill="none" stroke="#dff3ff" strokeWidth={1.5} opacity={(1 - age) * 0.6 * sinking} />
              );
            })}

            {/* pressure squeezing the hull */}
            {pressO > 0.01 && [0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
              const r = 160 - 18 * Math.sin(f / 3);
              const rad = (a * Math.PI) / 180;
              const cx = subX + Math.cos(rad) * r;
              const cy = subY + Math.sin(rad) * r * 0.75;
              return (
                <g key={a} opacity={pressO} transform={`translate(${cx} ${cy}) rotate(${a + 180})`}>
                  <path d="M -26 0 L 18 0 M 6 -12 L 22 0 L 6 12" fill="none" stroke={ALERT}
                    strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
                </g>
              );
            })}

            <Sub x={subX} y={subY} s={subS} light={lightOn} shake={pressO} />
          </svg>

          {/* depth counter */}
          <div style={{
            position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center', opacity: counterO,
          }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: '#9fc8ea',
              textShadow: '0 3px 12px rgba(0,0,0,0.8)' }}>DEPTH</div>
            <div style={{
              fontFamily: MONO, fontWeight: 700, fontSize: 104, color: D >= DEEP - 1 ? ROUTE : '#fff',
              textShadow: '0 6px 26px rgba(0,0,0,0.8)',
            }}>{fmt(D)} m</div>
          </div>

          {pressO > 0.01 && (
            <div style={{
              position: 'absolute', top: 330, left: 0, right: 0, textAlign: 'center', opacity: pressO,
              transform: `scale(${0.9 + 0.1 * pressO})`,
            }}>
              <div style={{
                display: 'inline-block', background: 'rgba(10,10,12,0.78)', border: `3px solid ${ALERT}`,
                borderRadius: 16, padding: '12px 26px', fontFamily: SANS, fontWeight: 700, fontSize: 58,
                color: '#fff', textShadow: `0 0 22px ${ALERT}`,
              }}>OVER 1,000× THE PRESSURE</div>
            </div>
          )}

          {peopleO > 0.01 && (
            <div style={{
              position: 'absolute', top: 330, left: 60, right: 60, textAlign: 'center', opacity: peopleO,
            }}>
              <div style={{
                display: 'inline-block', background: 'rgba(10,10,12,0.78)', border: `3px solid ${ROUTE}`,
                borderRadius: 16, padding: '12px 26px', fontFamily: SANS, fontWeight: 700, fontSize: 54,
                color: '#fff', lineHeight: 1.15,
              }}>FEWER VISITORS<br />THAN SPACE</div>
            </div>
          )}
        </AbsoluteFill>
      )}

      {/* ---------------- loop: back to frame 0 ---------------- */}
      {loopT > 0.001 && (
        <AbsoluteFill style={{ opacity: loopT, transform: 'scale(1.04)', transformOrigin: `${wide.deep.x}px ${wide.deep.y}px` }}>
          <Img src={staticFile(wide.image)} style={{ width: W, height: H, objectFit: 'cover' }} />
          <Pin p={wide.deep} o={1} />
        </AbsoluteFill>
      )}

      {/* cinematic edge darkening */}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.42) 100%)' }} />

      <div style={{
        position: 'absolute', top: 200, left: 50, right: 50, textAlign: 'center',
        fontFamily: SANS, fontWeight: 700, fontSize: 70, lineHeight: 1.1, color: '#fff',
        textShadow: '0 6px 30px rgba(0,0,0,0.85)', opacity: hookO,
      }}>
        {hook.top}<br /><span style={{ color: ROUTE }}>{hook.bottom}</span>
      </div>

      <EndCard from={cue(at.people)} to={END - 14} text="" compact />
      <Captions lines={vo} y={1560} accent={ROUTE} maxWords={3} size={58} plate />
    </AbsoluteFill>
  );
};

export default GeoDive;
