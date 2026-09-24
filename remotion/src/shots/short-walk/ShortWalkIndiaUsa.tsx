import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import { WORLD } from '../../lib/geo/world';
import { DETAIL } from '../../lib/geo/detail';
import { VO } from './vo.gen';

// =============================================================================
// COMPOSITION CONFIG
// =============================================================================
export const compositionConfig = {
  id: 'ShortWalkIndiaUsa',
  durationInSeconds: 43,
  fps: 30,
  width: 1080,
  height: 1920,
};

const FPS = 30;
const F = (s: number) => Math.round(s * FPS);
const CUE = VO.map((l) => F(l.start));
const END = F(compositionConfig.durationInSeconds);

const ROUTE = '#ffe14d';
const ALERT = '#ff3b30';

// =============================================================================
// THE GROUND — NASA Blue Marble (public domain), cropped per leg by
// scratchpad/geo/make_legs.py. The crops are equirectangular, so projecting a
// coordinate into a leg is plain arithmetic: no Mercator, nothing to distort.
// Longitudes run east continuously, which is why the Pacific legs are 190 and
// 215 rather than -170 and -145 — the route must not wrap mid-journey.
// =============================================================================
type Leg = {
  id: string;
  lon0: number; lon1: number; lat0: number; lat1: number;
  from: number;            // VO line this leg starts on
  flags: { country: string; file: string }[];
  labels: { name: string; lon: number; lat: number }[];
  path: [number, number][];
  props?: { kind: 'mountain' | 'pine' | 'floe'; lon: number; lat: number; s: number }[];
  snow?: number;           // flakes over this leg
  mood: Mood;              // what the place is doing to the walker
};

const LEGS: Leg[] = [
  {
    id: '01-india', mood: 'walk', lon0: 68.94, lon1: 88.06, lat0: 5, lat1: 39, from: 0,
    flags: [{ country: 'India', file: 'flag_in.png' }],
    labels: [{ name: 'INDIA', lon: 78.5, lat: 13.5 }],
    path: [[77.2, 28.6], [75.8, 30.2], [74.9, 31.6]],
  },
  {
    id: '02-afghanistan', mood: 'walk', lon0: 59.69, lon1: 74.31, lat0: 18, lat1: 44, from: 2,
    flags: [
      { country: 'Pakistan', file: 'flag_pk.png' },
      { country: 'Afghanistan', file: 'flag_af.png' },
    ],
    labels: [
      { name: 'PAKISTAN', lon: 70.5, lat: 29.5 },
      { name: 'AFGHANISTAN', lon: 66.2, lat: 34.2 },
    ],
    path: [[74.3, 31.5], [71.5, 34.0], [69.2, 34.5], [67.1, 36.7]],
    props: [
      { kind: 'mountain', lon: 70.6, lat: 35.6, s: 1.5 },
      { kind: 'mountain', lon: 68.6, lat: 36.4, s: 1.1 },
      { kind: 'mountain', lon: 72.2, lat: 36.4, s: 0.9 },
    ],
  },
  {
    id: '03-central-asia', mood: 'hot', lon0: 54.69, lon1: 69.31, lat0: 30, lat1: 56, from: 3,
    flags: [
      { country: 'Turkmenistan', file: 'flag_tm.png' },
      { country: 'Uzbekistan', file: 'flag_uz.png' },
      { country: 'Kazakhstan', file: 'flag_kz.png' },
    ],
    labels: [
      { name: 'TURKMENISTAN', lon: 59.5, lat: 39.0 },
      { name: 'UZBEKISTAN', lon: 63.6, lat: 42.6 },
      { name: 'KAZAKHSTAN', lon: 63.0, lat: 48.5 },
    ],
    path: [[67.1, 36.7], [63.6, 39.1], [64.4, 39.8], [66.9, 41.0], [68.2, 44.5], [67.0, 50.0]],
  },
  {
    id: '04-russia', mood: 'cold', lon0: 88.75, lon1: 111.25, lat0: 38, lat1: 78, from: 4,
    flags: [{ country: 'Russia', file: 'flag_ru.png' }],
    labels: [{ name: 'RUSSIA', lon: 100, lat: 62 }],
    path: [[89.5, 54.0], [92.9, 56.0], [98.0, 56.4], [104.3, 56.8], [110.5, 58.5]],
    props: [
      { kind: 'pine', lon: 93.5, lat: 61.5, s: 1.5 },
      { kind: 'pine', lon: 97.5, lat: 63.5, s: 1.9 },
      { kind: 'pine', lon: 103.5, lat: 61.0, s: 1.4 },
      { kind: 'mountain', lon: 107.5, lat: 52.0, s: 1.2 },
    ],
    snow: 55,
  },
  {
    id: '05-bering', mood: 'stop', lon0: 184.94, lon1: 195.06, lat0: 55, lat1: 73, from: 5,
    flags: [
      { country: 'Russia', file: 'flag_ru.png' },
      { country: 'United States of America', file: 'flag_us.png' },
    ],
    labels: [
      { name: 'RUSSIA', lon: 186.0, lat: 67.4 },
      { name: 'ALASKA', lon: 193.4, lat: 65.0 },
    ],
    path: [[185.5, 66.8], [188.0, 66.3], [190.2, 66.1]],
    props: [
      { kind: 'floe', lon: 191.6, lat: 65.2, s: 1.0 },
      { kind: 'floe', lon: 189.2, lat: 63.9, s: 1.3 },
      { kind: 'floe', lon: 193.2, lat: 62.6, s: 0.9 },
    ],
    snow: 75,
  },
  {
    id: '06-alaska', mood: 'tired', lon0: 207.69, lon1: 222.31, lat0: 49, lat1: 75, from: 8,
    flags: [
      { country: 'United States of America', file: 'flag_us.png' },
      { country: 'Canada', file: 'flag_ca.png' },
    ],
    labels: [
      { name: 'ALASKA', lon: 211, lat: 66 },
      { name: 'CANADA', lon: 219, lat: 57 },
    ],
    path: [[208.0, 65.0], [212.2, 64.8], [217.0, 62.0], [221.5, 59.0]],
    props: [
      { kind: 'mountain', lon: 214.5, lat: 61.0, s: 1.6 },
      { kind: 'pine', lon: 218.5, lat: 57.5, s: 1.5 },
      { kind: 'pine', lon: 210.5, lat: 58.5, s: 1.2 },
    ],
    snow: 45,
  },
  {
    id: '07-usa', mood: 'cheer', lon0: 246.56, lon1: 263.44, lat0: 26, lat1: 56, from: 9,
    flags: [{ country: 'United States of America', file: 'flag_us.png' }],
    labels: [{ name: 'UNITED STATES', lon: 255, lat: 39 }],
    path: [[248.6, 47.5], [252.0, 43.0], [255.0, 39.7]],
  },
];

const W = 1080;
const H = 1920;

const lonE = (lon: number, leg: Leg) => (leg.lon1 > 180 && lon < 0 ? lon + 360 : lon);

const projector = (leg: Leg) => (lon: number, lat: number): [number, number] => [
  ((lonE(lon, leg) - leg.lon0) / (leg.lon1 - leg.lon0)) * W,
  ((leg.lat1 - lat) / (leg.lat1 - leg.lat0)) * H,
];

// 10m outlines where we have them (the route's countries), 110m otherwise.
// The Bering leg is 10 degrees wide and the 110m Chukotka polygon sat out over
// open water there — detail is not decoration at this zoom.
//
// CACHED, and that is not an optimisation detail: the detailed set is ~52,000
// points, and projecting them inside the component meant redoing the whole lot
// on all 1,290 frames. The render went from 142s to still-running after an
// hour. A leg's geometry never changes, so it is built once per (leg, country).
const PATH_CACHE = new Map<string, string>();

const countryPaths = (leg: Leg, name: string): string => {
  const key = `${leg.id}|${name}`;
  const hit = PATH_CACHE.get(key);
  if (hit !== undefined) return hit;
  const c = DETAIL.find((x) => x.name === name) ?? WORLD.find((x) => x.name === name);
  if (!c) {
    PATH_CACHE.set(key, '');
    return '';
  }
  const p = projector(leg);
  // rings entirely outside the frame cost fill time for nothing
  const out = c.rings
    .map((ring) => ring.map(([lon, lat]) => p(lon, lat)))
    .filter((pts) => pts.some(([x, y]) => x > -400 && x < W + 400 && y > -400 && y < H + 400))
    .map((pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ') + ' Z')
    .join(' ');
  PATH_CACHE.set(key, out);
  return out;
};

// =============================================================================
// PIECES
// =============================================================================

// A country wearing its flag: the flag image is clipped to the real outline.
const FlagCountry: React.FC<{ leg: Leg; name: string; file: string; o: number; id: string }> = ({
  leg, name, file, o, id,
}) => {
  const d = countryPaths(leg, name);
  if (!d) return null;
  return (
    <g opacity={o}>
      <defs>
        <clipPath id={id}>
          <path d={d} />
        </clipPath>
      </defs>
      <image href={staticFile(`projects/walk-india-usa/${file}`)}
        x={-200} y={-200} width={W + 400} height={H + 400}
        preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id})`} opacity={0.5} />
      <path d={d} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={3} />
    </g>
  );
};


// =============================================================================
// STICKERS — the reference drops 3D mountains, trees and snow onto the map.
// Ours are drawn, not photographed: two-tone faces and a ground shadow do the
// 3D reading, and nothing has to be licensed or downloaded.
// =============================================================================
const Mountain: React.FC<{ x: number; y: number; s: number; snow?: boolean; o?: number }> = ({
  x, y, s, snow = true, o = 1,
}) => {
  const w = 120 * s;
  const h = 96 * s;
  const peak = [x, y - h];
  return (
    <g opacity={o}>
      <ellipse cx={x} cy={y + 4 * s} rx={w * 0.62} ry={9 * s} fill="rgba(0,0,0,0.38)" />
      {/* lit face, then the shadow side over it */}
      <path d={`M ${peak[0]} ${peak[1]} L ${x + w * 0.62} ${y} L ${x - w * 0.62} ${y} Z`} fill="#6c6f77" />
      <path d={`M ${peak[0]} ${peak[1]} L ${x + w * 0.62} ${y} L ${x} ${y} Z`} fill="#4a4d55" />
      {snow && (
        <>
          <path d={`M ${peak[0]} ${peak[1]} L ${x + w * 0.22} ${y - h * 0.5}
                    Q ${x + w * 0.05} ${y - h * 0.62} ${x} ${y - h * 0.48}
                    Q ${x - w * 0.08} ${y - h * 0.6} ${x - w * 0.2} ${y - h * 0.52} Z`} fill="#f3f7fb" />
          <path d={`M ${peak[0]} ${peak[1]} L ${x + w * 0.22} ${y - h * 0.5} L ${x} ${y - h * 0.48} Z`}
            fill="#d7e2ee" />
        </>
      )}
    </g>
  );
};

const PineTree: React.FC<{ x: number; y: number; s: number; o?: number }> = ({ x, y, s, o = 1 }) => {
  const w = 34 * s;
  const h = 62 * s;
  const tier = (k: number, top: number, spread: number) => (
    <g key={k}>
      <path d={`M ${x} ${y - h * top} L ${x + w * spread} ${y - h * (top - 0.3)} L ${x - w * spread} ${y - h * (top - 0.3)} Z`}
        fill="#2f6b3d" />
      <path d={`M ${x} ${y - h * top} L ${x + w * spread} ${y - h * (top - 0.3)} L ${x} ${y - h * (top - 0.3)} Z`}
        fill="#24532f" />
    </g>
  );
  return (
    <g opacity={o}>
      <ellipse cx={x} cy={y + 2 * s} rx={w * 0.7} ry={5 * s} fill="rgba(0,0,0,0.35)" />
      <rect x={x - 3 * s} y={y - h * 0.22} width={6 * s} height={h * 0.22} fill="#4a3526" />
      {tier(0, 0.45, 0.9)}
      {tier(1, 0.72, 0.68)}
      {tier(2, 1.0, 0.46)}
    </g>
  );
};

const IceFloe: React.FC<{ x: number; y: number; s: number; o?: number }> = ({ x, y, s, o = 1 }) => (
  <g opacity={o}>
    <ellipse cx={x} cy={y} rx={52 * s} ry={22 * s} fill="#e8f3fb" />
    <ellipse cx={x + 30 * s} cy={y + 10 * s} rx={30 * s} ry={14 * s} fill="#dceaf6" />
    <ellipse cx={x - 26 * s} cy={y + 8 * s} rx={24 * s} ry={11 * s} fill="#f2f9ff" />
    <ellipse cx={x} cy={y + 3 * s} rx={52 * s} ry={22 * s} fill="none" stroke="#a9cbe4" strokeWidth={2} />
  </g>
);

// Snow that actually falls: deterministic per index so it never re-rolls
// between frames, drifting and wrapping at the bottom of the frame.
const SnowFall: React.FC<{ n: number; o?: number; seed?: number }> = ({ n, o = 1, seed = 1 }) => {
  const f = useCurrentFrame();
  const flakes = [];
  for (let i = 0; i < n; i++) {
    const r = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
    const rx = r - Math.floor(r);
    const r2 = Math.sin(i * 39.3468 + seed * 11.135) * 24634.6345;
    const ry = r2 - Math.floor(r2);
    const speed = 40 + ry * 90;
    const size = 1.4 + ry * 3.2;
    const x = rx * W + Math.sin((f / 26) + i) * 22;
    const y = ((ry * H + (f / FPS) * speed) % (H + 60)) - 30;
    flakes.push(<circle key={i} cx={x} cy={y} r={size} fill="#fff" opacity={0.28 + ry * 0.34} />);
  }
  return <g opacity={o}>{flakes}</g>;
};

// The walker: our stick figure, glowing like the reference's marker — and now
// with a face, because he is the one having the experience. The mood is set per
// leg: he sweats across the desert, shivers in Siberia, stops dead at the
// strait, trudges through Alaska and finishes with his arms up.
type Mood = 'walk' | 'hot' | 'cold' | 'stop' | 'tired' | 'cheer';

const Walker: React.FC<{ x: number; y: number; s: number; mood: Mood }> = ({ x, y, s, mood }) => {
  const f = useCurrentFrame();
  const moving = mood !== 'stop' && mood !== 'cheer';
  const swing = moving ? Math.sin(f / 3.2) * 0.5 : 0;
  // shivering is a fast, tiny tremor; everything else sits still
  const shake = mood === 'cold' ? Math.sin(f * 2.1) * 1.6 * s : 0;
  const cx = x + shake;

  const c = '#fff';
  const lw = 7 * s;
  const headR = 13 * s;
  const headY = y - 46 * s;
  const eyeY = headY - headR * 0.18;
  const eyeDx = headR * 0.38;
  const ink = '#12161c';

  // eyes: wide when he stops, squeezed when he is cold or straining
  const eyeR = mood === 'stop' ? 3.4 * s : mood === 'cold' || mood === 'tired' ? 1.5 * s : 2.4 * s;
  const browTilt = mood === 'stop' ? -16 : mood === 'hot' || mood === 'tired' ? 12 : mood === 'cold' ? 16 : 0;
  const browY = eyeY - headR * 0.52;
  const browW = headR * 0.42;

  // mouth: open for effort and alarm, a flat line when cold, a grin at the end
  const my = headY + headR * 0.46;
  const mouth =
    mood === 'stop' ? { rx: 4.2 * s, ry: 5.2 * s }
      : mood === 'hot' || mood === 'tired' ? { rx: 4.6 * s, ry: 3.0 * s }
        : null;
  const grin = mood === 'cheer';

  const armUp = mood === 'cheer' || mood === 'stop';
  const armY = armUp ? y - 44 * s : y - 16 * s;
  const armX = armUp ? 12 * s : 14 * s;

  return (
    <g style={{ filter: `drop-shadow(0 0 10px ${ALERT}) drop-shadow(0 0 22px ${ALERT})` }}>
      <circle cx={cx} cy={headY} r={headR} fill={c} />
      {/* face */}
      {[-1, 1].map((side) => (
        <line key={side}
          x1={cx + side * eyeDx - browW / 2}
          y1={browY + (Math.sin((browTilt * Math.PI) / 180) * browW * side) / 2}
          x2={cx + side * eyeDx + browW / 2}
          y2={browY - (Math.sin((browTilt * Math.PI) / 180) * browW * side) / 2}
          stroke={ink} strokeWidth={1.8 * s} strokeLinecap="round" />
      ))}
      <circle cx={cx - eyeDx} cy={eyeY} r={eyeR} fill={ink} />
      <circle cx={cx + eyeDx} cy={eyeY} r={eyeR} fill={ink} />
      {mouth ? (
        <ellipse cx={cx} cy={my} rx={mouth.rx} ry={mouth.ry} fill={ink} />
      ) : (
        <path
          d={grin
            ? `M ${cx - 5 * s} ${my - 1.4 * s} Q ${cx} ${my + 4 * s} ${cx + 5 * s} ${my - 1.4 * s}`
            : `M ${cx - 4.4 * s} ${my} L ${cx + 4.4 * s} ${my}`}
          fill="none" stroke={ink} strokeWidth={1.9 * s} strokeLinecap="round" />
      )}

      {/* body */}
      <line x1={cx} y1={y - 33 * s} x2={cx} y2={y - 12 * s} stroke={c} strokeWidth={lw} strokeLinecap="round" />
      <line x1={cx} y1={y - 28 * s} x2={cx + armX * (armUp ? 1 : Math.cos(swing))} y2={armY}
        stroke={c} strokeWidth={lw} strokeLinecap="round" />
      <line x1={cx} y1={y - 28 * s} x2={cx - armX * (armUp ? 1 : Math.cos(swing))} y2={armY}
        stroke={c} strokeWidth={lw} strokeLinecap="round" />
      <line x1={cx} y1={y - 12 * s} x2={cx + 12 * s * Math.sin(swing)} y2={y} stroke={c} strokeWidth={lw} strokeLinecap="round" />
      <line x1={cx} y1={y - 12 * s} x2={cx - 12 * s * Math.sin(swing)} y2={y} stroke={c} strokeWidth={lw} strokeLinecap="round" />

      {/* what the place is doing to him */}
      {mood === 'hot' && [0, 1].map((i) => {
        const t = ((f + i * 22) % 44) / 44;
        return (
          <path key={i}
            d={`M ${cx + (i ? 15 : -15) * s} ${headY - 4 * s + t * 22 * s}
                c ${2.4 * s} ${3 * s} ${2.4 * s} ${5 * s} 0 ${5 * s}
                c ${-2.4 * s} 0 ${-2.4 * s} ${-2 * s} 0 ${-5 * s} Z`}
            fill="#9ad8ff" opacity={(1 - t) * 0.9} />
        );
      })}
      {mood === 'cold' && [0, 1, 2].map((i) => (
        <text key={i} x={cx + (i - 1) * 11 * s} y={headY - 17 * s - ((f / 2 + i * 9) % 18) * s}
          fontSize={9 * s} fill="#cfe9ff" opacity={0.75} textAnchor="middle">*</text>
      ))}
      {mood === 'stop' && (
        <text x={cx} y={headY - 19 * s} fontSize={20 * s} fill={ALERT} textAnchor="middle"
          style={{ fontWeight: 700 }}>!</text>
      )}
    </g>
  );
};

// One leg of the journey: ground, flags, labels, the line drawing itself, walker.
const LegView: React.FC<{ leg: Leg; t: number; zoom: number }> = ({ leg, t, zoom }) => {
  const p = projector(leg);
  const pts = leg.path.map(([lon, lat]) => p(lon, lat));
  const segLens = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  const total = segLens.reduce((a, b) => a + b, 0);
  const drawn = total * t;

  // where the walker has got to
  let walk = pts[0];
  let acc = 0;
  for (let i = 0; i < segLens.length; i++) {
    if (acc + segLens[i] >= drawn) {
      const k = (drawn - acc) / segLens[i];
      walk = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
      break;
    }
    acc += segLens[i];
    walk = pts[i + 1];
  }

  const line = pts.map((q, i) => `${i ? 'L' : 'M'} ${q[0]} ${q[1]}`).join(' ');

  return (
    <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
      <Img src={staticFile(`projects/walk-india-usa/${leg.id}.jpg`)}
        style={{ width: W, height: H, objectFit: 'cover' }} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
        {leg.flags.map((fl, i) => (
          <FlagCountry key={fl.country} leg={leg} name={fl.country} file={fl.file}
            id={`clip-${leg.id}-${i}`} o={EASE_OUT(prog(t, 0, 0.18))} />
        ))}
        {(leg.props ?? []).map((pr, i) => {
          const [px, py] = p(pr.lon, pr.lat);
          const o = EASE_OUT(prog(t, 0.08 + i * 0.06, 0.35 + i * 0.06));
          if (pr.kind === 'mountain') return <Mountain key={i} x={px} y={py} s={pr.s} o={o} />;
          if (pr.kind === 'pine') return <PineTree key={i} x={px} y={py} s={pr.s} o={o} />;
          return <IceFloe key={i} x={px} y={py} s={pr.s} o={o} />;
        })}
        {leg.snow ? <SnowFall n={leg.snow} o={EASE_OUT(prog(t, 0, 0.25))} seed={leg.lon0} /> : null}
        <path d={line} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={16} strokeLinecap="round"
          strokeLinejoin="round" strokeDasharray={total} strokeDashoffset={total * (1 - t)} />
        <path d={line} fill="none" stroke={ROUTE} strokeWidth={9} strokeLinecap="round"
          strokeLinejoin="round" strokeDasharray={total} strokeDashoffset={total * (1 - t)} />
        <Walker x={walk[0]} y={walk[1]} s={2.5} mood={leg.mood} />
      </svg>
      {leg.labels.map((lb) => {
        const [x, y] = p(lb.lon, lb.lat);
        return (
          <div key={lb.name} style={{
            position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)',
            background: 'rgba(8,10,14,0.82)', border: '2px solid rgba(255,255,255,0.35)',
            borderRadius: 10, padding: '6px 14px', fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700, fontSize: 30, color: '#fff', letterSpacing: 1,
            opacity: EASE_OUT(prog(t, 0.05, 0.3)),
          }}>{lb.name}</div>
        );
      })}
    </AbsoluteFill>
  );
};

// =============================================================================
// THE SHORT
// =============================================================================
const ShortWalkIndiaUsa: React.FC = () => {
  const f = useCurrentFrame();

  const starts = LEGS.map((l) => CUE[l.from] ?? 0);
  const ends = starts.map((s, i) => (i + 1 < starts.length ? starts[i + 1] : END));
  const active = starts.reduce((best, s, i) => (f >= s - 12 ? i : best), 0);

  const beringIn = CUE[5] ?? F(20);
  const strait = EASE_OUT(prog(f, beringIn, beringIn + 16));

  return (
    <AbsoluteFill style={{ backgroundColor: '#05070b' }}>
      {LEGS.map((leg, i) => {
        const inAt = starts[i];
        const outAt = ends[i];
        if (f < inAt - 14 || f > outAt + 6) return null;
        const o = prog(f, inAt - 12, inAt + 4) * (1 - prog(f, outAt - 8, outAt + 4));
        const t = EASE_INOUT(prog(f, inAt, Math.max(inAt + 20, outAt - 6)));
        // a slow push in on every leg: the camera never sits still
        const zoom = 1.04 + 0.1 * prog(f, inAt - 10, outAt);
        return (
          <AbsoluteFill key={leg.id} style={{ opacity: o }}>
            <LegView leg={leg} t={t} zoom={zoom} />
          </AbsoluteFill>
        );
      })}

      {/* the hook question sits over the opening, then gets out of the way */}
      <div style={{
        position: 'absolute', top: 210, left: 60, right: 60, textAlign: 'center',
        fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 86, lineHeight: 1.05,
        color: '#fff', textShadow: '0 6px 30px rgba(0,0,0,0.85)',
        opacity: 1 - prog(f, CUE[1] ?? F(3), (CUE[1] ?? F(3)) + 12),
      }}>
        India → USA<br />
        <span style={{ color: ROUTE }}>on foot?</span>
      </div>

      {/* the obstacle gets the only red card in the video */}
      {strait > 0.01 && (
        <div style={{
          position: 'absolute', top: 250, left: 0, right: 0, textAlign: 'center',
          opacity: strait * (1 - prog(f, (CUE[8] ?? END) - 10, CUE[8] ?? END)),
          transform: `scale(${0.9 + 0.1 * strait})`,
        }}>
          <div style={{
            display: 'inline-block', background: 'rgba(10,10,12,0.72)',
            border: `3px solid ${ALERT}`, borderRadius: 16, padding: '14px 28px',
            fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 76,
            color: '#fff', textShadow: `0 0 26px ${ALERT}`,
          }}>BERING STRAIT</div>
          <div style={{
            marginTop: 14, fontFamily: 'JetBrains Mono, monospace', fontSize: 34,
            color: '#fff', textShadow: '0 4px 18px rgba(0,0,0,0.9)',
          }}>82 km of sea · no bridge</div>
        </div>
      )}

      <Captions lines={VO} y={1560} accent={ROUTE} maxWords={3} size={58} plate />
    </AbsoluteFill>
  );
};

export default ShortWalkIndiaUsa;
