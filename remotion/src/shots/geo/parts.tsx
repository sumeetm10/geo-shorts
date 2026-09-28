import React from 'react';
import { useCurrentFrame } from 'remotion';

// =============================================================================
// Drawn parts for the "explore" videos (Explore.tsx). Everything is code: vector
// shapes, gradients and seeded noise - no photos, no AI images, nothing to
// license. They first appeared in the one-off GeoDive.tsx, which keeps its own
// copies so that finished video never changes.
// =============================================================================
export const W = 1080;
export const H = 1920;
export const ROUTE = '#ffe14d';
export const ALERT = '#ff3b30';
export const MONO = 'JetBrains Mono, monospace';
export const SANS = 'Space Grotesk, sans-serif';

export type Pt = { x: number; y: number };

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const fmt = (n: number) => {
  const neg = n < 0;
  const abs = Math.abs(n);
  const s = abs >= 100 || Number.isInteger(abs) ? String(Math.round(abs)) : abs.toFixed(1);
  const [i, d] = s.split('.');
  return (neg ? '−' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (d ? '.' + d : '');
};

// seeded random, so every frame draws the same rocks and ridges
export const rng = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// A mountain skyline (main summit, a shoulder, a lower peak) from midpoint
// displacement; h runs 0 (foot) .. 1 (summit).
export const ridge = (seed: number): [number, number][] => {
  const r = rng(seed);
  const base = (x: number) => {
    const main = Math.max(0, 1 - Math.abs(x - 0.47) / 0.47) ** 1.15;
    const shoulder = 0.9 * Math.max(0, 1 - Math.abs(x - 0.62) / 0.3) ** 1.3;
    const low = 0.72 * Math.max(0, 1 - Math.abs(x - 0.3) / 0.26) ** 1.4;
    return Math.max(main, shoulder, low);
  };
  let pts: [number, number][] = [[0, 0], [1, 0]];
  let amp = 0.16;
  for (let level = 0; level < 6; level++) {
    const next: [number, number][] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, h0] = pts[i];
      const [x1, h1] = pts[i + 1];
      const xm = (x0 + x1) / 2;
      const hm = level === 0 ? base(xm) : ((h0 + h1) / 2) * 0.35 + base(xm) * 0.65 + (r() - 0.5) * amp;
      next.push(pts[i], [xm, Math.max(0, Math.min(1, hm))]);
    }
    next.push(pts[pts.length - 1]);
    pts = next;
    amp *= 0.55;
  }
  let top = 0;
  pts.forEach((p, i) => { if (p[1] > pts[top][1]) top = i; });
  const peak = pts[top][1];
  return pts.map(([x, h], i) => [x, i === 0 || i === pts.length - 1 ? 0 : i === top ? 1 : h / peak] as [number, number]);
};

// ------------------------------------------------------------ gradients
// One set of <defs> per SVG that uses the parts below (ids are global in a page,
// so each scene renders only one of these).
export const Defs: React.FC = () => (
  <defs>
    <linearGradient id="wing" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#dfe5ea" /><stop offset="1" stopColor="#aeb8c2" />
    </linearGradient>
    <linearGradient id="fuse" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ffffff" /><stop offset="0.6" stopColor="#e3e8ed" />
      <stop offset="1" stopColor="#a9b3bd" />
    </linearGradient>
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
    <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#6f7882" /><stop offset="0.5" stopColor="#c9d0d6" />
      <stop offset="1" stopColor="#59626b" />
    </linearGradient>
    <linearGradient id="tower" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#dfe8ef" /><stop offset="0.5" stopColor="#a9b8c6" />
      <stop offset="1" stopColor="#6d7c8a" />
    </linearGradient>
    <radialGradient id="heat" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#ff7a1a" stopOpacity={0.55} />
      <stop offset="1" stopColor="#ff3b00" stopOpacity={0} />
    </radialGradient>
  </defs>
);

// ------------------------------------------------------------ map parts
export const Pin: React.FC<{ p: Pt; o: number; label?: string; color?: string }> = ({ p, o, label, color = ALERT }) => {
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
          position: 'absolute', left: Math.min(W - 150, Math.max(150, p.x)), top: p.y - 74,
          transform: 'translate(-50%,-50%)', opacity: o,
          background: 'rgba(8,10,14,0.85)', border: `2px solid ${color}`, borderRadius: 10,
          padding: '6px 16px', fontFamily: SANS, fontWeight: 700, fontSize: 34, color: '#fff',
          whiteSpace: 'nowrap',
        }}>{label}</div>
      )}
    </>
  );
};

// an airliner seen from above, nose along +x
export const Airliner: React.FC<{ x: number; y: number; angle: number; s: number }> = ({ x, y, angle, s }) => (
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
export const ShipTop: React.FC<{ x: number; y: number; angle: number; s: number; wake: number }> = ({ x, y, angle, s, wake }) => (
  <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${s})`}>
    <path d={`M -14 -3 L ${-14 - 90 * wake} ${-26 * wake} M -14 3 L ${-14 - 90 * wake} ${26 * wake}`}
      stroke="rgba(255,255,255,0.55)" strokeWidth={3} fill="none" strokeLinecap="round" />
    <path d={`M -14 0 L ${-14 - 120 * wake} 0`} stroke="rgba(255,255,255,0.35)" strokeWidth={7} strokeLinecap="round" />
    <path d="M 22 0 C 18 -6 10 -7 -14 -7 L -16 -5 L -16 5 L -14 7 C 10 7 18 6 22 0 Z" fill="#f2f4f6" stroke="#1d2b44" strokeWidth={1.5} />
    <rect x={-6} y={-4} width={12} height={8} rx={1.5} fill="#cfd6de" />
    <rect x={-14} y={-5} width={5} height={10} fill="#ff7a1a" />
  </g>
);

// a 4x4 seen from above (roads, tracks, ice), front along +x
export const CarTop: React.FC<{ x: number; y: number; angle: number; s: number }> = ({ x, y, angle, s }) => (
  <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${s})`}>
    <ellipse cx={2} cy={6} rx={20} ry={9} fill="rgba(0,0,0,0.35)" />
    <rect x={-18} y={-9} width={36} height={18} rx={5} fill="#d9322e" />
    <rect x={-6} y={-7} width={14} height={14} rx={3} fill="#2a3440" />
    <rect x={10} y={-8} width={5} height={16} rx={2} fill="#f2c94c" />
  </g>
);

// ------------------------------------------------------------ side-view parts
// research vessel, bow to the right; wy is the waterline
export const Ship: React.FC<{ x: number; wy: number; s: number }> = ({ x, wy, s }) => (
  <g transform={`translate(${x} ${wy}) scale(${s})`}>
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
    <path d="M -140 -44 L -122 -118 L -104 -118 L -96 -44" fill="none" stroke="#ff7a1a" strokeWidth={7}
      strokeLinejoin="round" />
    <line x1={-113} y1={-118} x2={-113} y2={-60} stroke="#2a2f36" strokeWidth={2} />
  </g>
);

// deep submersible, facing right
export const Sub: React.FC<{ x: number; y: number; s: number; light: number; shake: number }> = ({ x, y, s, light, shake }) => {
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
      <path d="M -80 60 L 70 60 M -60 50 L -60 60 M 40 50 L 40 60" stroke="#59626c" strokeWidth={5} />
      <rect x={24} y={44} width={58} height={14} fill="none" stroke="#8a939d" strokeWidth={2} />
      <rect x={-122} y={-14} width={30} height={26} rx={5} fill="url(#metal)" />
      <ellipse cx={-124} cy={-1} rx={3} ry={12 * spin + 2} fill="#aab3bd" />
      <path d="M -96 -40 C -96 -54 -84 -58 -64 -58 L 50 -58 C 80 -58 96 -36 96 0
               C 96 36 80 54 50 54 L -64 54 C -84 54 -96 46 -96 34 Z" fill="url(#subBody)" />
      <path d="M -90 -44 C -84 -54 -70 -54 -60 -54 L 48 -54 C 66 -54 80 -46 88 -34 L -90 -34 Z"
        fill="#ffffff" opacity={0.55} />
      <rect x={-96} y={4} width={186} height={12} fill="#16324f" />
      <rect x={-34} y={-78} width={44} height={22} rx={8} fill="url(#subBody)" />
      <rect x={30} y={-72} width={26} height={16} rx={4} fill="url(#metal)" />
      <circle cx={-12} cy={-84} r={4} fill="#ff5a3c" opacity={0.5 + 0.5 * Math.abs(Math.sin(f / 5))} />
      <circle cx={62} cy={-14} r={17} fill="url(#port)" stroke="#8b96a1" strokeWidth={5} />
      <ellipse cx={56} cy={-20} rx={6} ry={3.5} fill="#ffffff" opacity={0.6} />
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

// drilling rig at the surface (a derrick), standing on gy
export const Rig: React.FC<{ x: number; gy: number; s: number }> = ({ x, gy, s }) => (
  <g transform={`translate(${x} ${gy}) scale(${s})`}>
    <rect x={-90} y={-26} width={180} height={26} fill="#3b4652" />
    <rect x={-90} y={-26} width={180} height={6} fill="#5d6b78" />
    <path d="M -46 -26 L -12 -250 L 12 -250 L 46 -26" fill="none" stroke="url(#steel)" strokeWidth={9} />
    {[-70, -115, -160, -205].map((y, i) => {
      const w = 46 - (i + 1) * 7.5;
      return <path key={y} d={`M ${-w} ${y} L ${w} ${y - 40} M ${w} ${y} L ${-w} ${y - 40}`}
        stroke="#9aa6b2" strokeWidth={3} />;
    })}
    <rect x={-20} y={-266} width={40} height={16} fill="#ff7a1a" />
    <line x1={0} y1={-250} x2={0} y2={-26} stroke="#2a2f36" strokeWidth={3} />
    <rect x={56} y={-70} width={60} height={44} fill="#e8edf2" />
    <rect x={64} y={-62} width={14} height={10} fill="#1b2d44" />
    <rect x={86} y={-62} width={14} height={10} fill="#1b2d44" />
  </g>
);

// drill bit at the bottom of the shaft
export const DrillBit: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => {
  const f = useCurrentFrame();
  const spin = f * 0.5;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx={0} cy={4} r={46} fill="url(#heat)" />
      <rect x={-12} y={-40} width={24} height={30} fill="url(#steel)" />
      <path d="M -18 -12 L 18 -12 L 10 14 L 0 22 L -10 14 Z" fill="#8a939d" />
      {[0, 1, 2].map((i) => (
        <line key={i} x1={-12 + ((i * 12 + spin * 6) % 24)} y1={-10} x2={-6 + ((i * 12 + spin * 6) % 24) / 2}
          y2={14} stroke="#3a4148" strokeWidth={3} />
      ))}
    </g>
  );
};

// a climber with a backpack, facing right
export const Climber: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => {
  const f = useCurrentFrame();
  const sw = Math.sin(f / 4) * 0.45;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke="#fff" strokeWidth={6} strokeLinecap="round"
      style={{ filter: 'drop-shadow(0 0 8px rgba(255,59,48,0.9))' }}>
      <rect x={-20} y={-58} width={16} height={26} rx={4} fill="#ff7a1a" stroke="none" />
      <circle cx={2} cy={-66} r={9} fill="#ffd23f" stroke="none" />
      <line x1={0} y1={-56} x2={0} y2={-26} />
      <line x1={0} y1={-50} x2={16} y2={-40 + sw * 10} />
      <line x1={16} y1={-40 + sw * 10} x2={22} y2={-8} stroke="#9aa4ae" strokeWidth={3} />
      <line x1={0} y1={-26} x2={10 * Math.sin(sw)} y2={0} />
      <line x1={0} y1={-26} x2={-10 * Math.sin(sw)} y2={0} />
    </g>
  );
};

// the Titanic's bow section, broken off and rusting
export const Wreck: React.FC<{ x: number; y: number; s: number; o: number }> = ({ x, y, s, o }) => (
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

// a supertall tower (Burj Khalifa-like setbacks), base at (x, by), height hpx
export const Tower: React.FC<{ x: number; by: number; hpx: number; o: number }> = ({ x, by, hpx, o }) => {
  const tiers = [[34, 0], [28, 0.28], [22, 0.5], [16, 0.68], [10, 0.82], [5, 0.92]];
  return (
    <g opacity={o}>
      {tiers.map(([w, t], i) => {
        const next = i + 1 < tiers.length ? tiers[i + 1][1] : 0.97;
        return <rect key={i} x={x - w} y={by - hpx * next} width={w * 2} height={hpx * (next - t)} fill="url(#tower)" />;
      })}
      <line x1={x} y1={by - hpx * 0.97} x2={x} y2={by - hpx} stroke="#c9d3dc" strokeWidth={3} />
    </g>
  );
};

// Marine snow / dust: flakes in screen space drifting past as the camera moves.
export const Flakes: React.FC<{ shift: number; o: number; color?: string; n?: number }> = ({ shift, o, color = '#dfefff', n = 90 }) => {
  const dots = [];
  for (let i = 0; i < n; i++) {
    const r = Math.sin(i * 12.9898) * 43758.5453;
    const rx = r - Math.floor(r);
    const r2 = Math.sin(i * 78.233) * 24634.6345;
    const ry = r2 - Math.floor(r2);
    const y = (((ry * (H + 200) - shift * (0.8 + ry * 0.6)) % (H + 200)) + (H + 200)) % (H + 200) - 100;
    dots.push(<circle key={i} cx={rx * W} cy={y} r={1.2 + ry * 2.2} fill={color} opacity={0.18 + ry * 0.35} />);
  }
  return <g opacity={o}>{dots}</g>;
};

// ------------------------------------------------------------ stat icons
export const Icon: React.FC<{ kind: string; fill: number; s: number }> = ({ kind, fill, s }) => {
  const c = '#ffffff';
  if (kind === 'thermo') {
    const h = 300 * Math.max(0, Math.min(1, fill));
    return (
      <g transform={`scale(${s})`}>
        <rect x={-34} y={-200} width={68} height={330} rx={34} fill="rgba(255,255,255,0.12)" stroke={c} strokeWidth={8} />
        <circle cx={0} cy={150} r={62} fill={ALERT} stroke={c} strokeWidth={8} />
        <rect x={-16} y={130 - h} width={32} height={h + 20} rx={16} fill={ALERT} />
        {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={40} y1={-170 + i * 60} x2={66} y2={-170 + i * 60} stroke={c} strokeWidth={6} />)}
      </g>
    );
  }
  if (kind === 'clock') {
    const a = fill * Math.PI * 2 * 3;
    return (
      <g transform={`scale(${s})`}>
        <circle cx={0} cy={0} r={170} fill="rgba(255,255,255,0.1)" stroke={c} strokeWidth={10} />
        <line x1={0} y1={0} x2={Math.sin(a) * 120} y2={-Math.cos(a) * 120} stroke={ROUTE} strokeWidth={12} strokeLinecap="round" />
        <line x1={0} y1={0} x2={Math.sin(a / 12) * 80} y2={-Math.cos(a / 12) * 80} stroke={c} strokeWidth={14} strokeLinecap="round" />
      </g>
    );
  }
  if (kind === 'people') {
    return (
      <g transform={`scale(${s})`} fill={c}>
        {[-120, 0, 120].map((x, i) => (
          <g key={x} opacity={i === 1 ? 1 : 0.55 + 0.45 * fill}>
            <circle cx={x} cy={-80} r={46} /><path d={`M ${x - 80} 120 C ${x - 80} 10 ${x + 80} 10 ${x + 80} 120 Z`} />
          </g>
        ))}
      </g>
    );
  }
  // ruler / distance
  return (
    <g transform={`scale(${s})`}>
      <rect x={-220} y={-50} width={440} height={100} rx={12} fill="rgba(255,255,255,0.12)" stroke={c} strokeWidth={8} />
      {Array.from({ length: 11 }, (_, i) => (
        <line key={i} x1={-200 + i * 40} y1={-50} x2={-200 + i * 40} y2={i % 5 === 0 ? 10 : -10} stroke={c} strokeWidth={6} />
      ))}
      <rect x={-220} y={60} width={440 * fill} height={14} rx={7} fill={ROUTE} />
    </g>
  );
};
