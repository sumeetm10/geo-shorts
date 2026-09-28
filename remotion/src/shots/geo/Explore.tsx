import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { EndCard } from './EndCard';
import {
  Airliner, CarTop, Climber, Defs, DrillBit, Flakes, H, Icon, MONO, Pin, ROUTE, Rig, SANS, Ship,
  ShipTop, Sub, Tower, W, Wreck, fmt, lerp, ridge, rng,
} from './parts';
import type { Pt } from './parts';

// =============================================================================
// "Explore" Shorts: "How do you get to <an extreme place>?" built automatically.
// make_explore.py turns a researched topic into a list of scenes, one or more
// narration lines each, and every number in them is checked against the
// topic's Wikipedia text before anything is rendered. This file only draws:
//   map     NASA Blue Marble crop, pins, a route flown / sailed / driven
//   column  a cross-section that follows a value down (ocean, rock, ice) or up
//           (air): markers, a sub / drill / climber, Everest or Titanic to scale
//   stat    one big number counting up, with an icon (temperature, time...)
//   card    one short fact
// Frame 0 is the hook over a wide map; the last line runs back into it.
// =============================================================================
export const compositionConfig = {
  id: 'Explore',
  durationInSeconds: 35,
  fps: 30,
  width: 1080,
  height: 1920,
};

type MapScene = {
  type: 'map'; from: number; to: number; image: string; focus: Pt;
  pins: { x: number; y: number; label: string; color?: string }[];
  route?: { a: Pt; b: Pt; mode: 'plane' | 'ship' | 'car' | 'walk' };
};
type ColumnScene = {
  type: 'column'; from: number; to: number; axis: 'depth' | 'height';
  medium: 'ocean' | 'rock' | 'ice' | 'air'; vehicle: 'sub' | 'drill' | 'climber' | 'none';
  max: number; stops: { line: number; value: number }[]; markers: { value: number; label: string }[];
  compare?: { line: number; kind: 'everest' | 'titanic' | 'tower'; value: number; label: string; spare?: string };
};
type StatScene = {
  type: 'stat'; from: number; to: number; icon: string; value: number; unit: string; label: string;
  theme: 'cold' | 'hot' | 'dark' | 'sea';
};
type CardScene = { type: 'card'; from: number; to: number; text: string; theme: 'cold' | 'hot' | 'dark' | 'sea' };
type Scene = MapScene | ColumnScene | StatScene | CardScene;

export type ExploreProps = {
  vo: VoLine[];
  hook: { top: string; bottom: string };
  wide: { image: string; target: Pt };
  scenes: Scene[];
  durationInSeconds: number;
};

type Clock = {
  f: number; cue: (i: number) => number; lineEnd: (i: number) => number;
  within: (i: number, a: number, b: number) => number; start: number; end: number;
};

const THEME: Record<string, string> = {
  cold: 'linear-gradient(to bottom, #cfeaff 0%, #6aa7d8 40%, #1d3f6e 75%, #081528 100%)',
  hot: 'linear-gradient(to bottom, #ffd98a 0%, #f08a2c 35%, #8a2410 75%, #250704 100%)',
  dark: 'linear-gradient(to bottom, #0d1a2e 0%, #070d18 60%, #02050a 100%)',
  sea: 'linear-gradient(to bottom, #3aa0dc 0%, #135b99 40%, #062446 80%, #010a16 100%)',
};

// ----------------------------------------------------------------- map
const MapView: React.FC<{ s: MapScene; c: Clock }> = ({ s, c }) => {
  const { f } = c;
  const zoom = 1.12 - 0.12 * EASE_OUT(prog(f, c.start - 6, c.start + 18)) + 0.06 * prog(f, c.start, c.end);
  const t = EASE_INOUT(prog(f, c.start + 4, lerp(c.start, c.end, 0.85)));
  const r = s.route;
  const pos = r ? { x: lerp(r.a.x, r.b.x, t * 0.94), y: lerp(r.a.y, r.b.y, t * 0.94) } : null;
  const ang = r ? (Math.atan2(r.b.y - r.a.y, r.b.x - r.a.x) * 180) / Math.PI : 0;
  return (
    <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `${s.focus.x}px ${s.focus.y}px` }}>
      <Img src={staticFile(s.image)} style={{ width: W, height: H, objectFit: 'cover' }} />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <Defs />
        <defs>
          {r && (
            <linearGradient id={`trail${s.from}`} gradientUnits="userSpaceOnUse" x1={r.a.x} y1={r.a.y} x2={pos!.x} y2={pos!.y}>
              <stop offset="0" stopColor="#fff" stopOpacity={0} /><stop offset="1" stopColor="#fff" stopOpacity={0.75} />
            </linearGradient>
          )}
        </defs>
        {r && pos && t > 0 && (
          <>
            {r.mode === 'plane' ? (
              <line x1={r.a.x} y1={r.a.y} x2={pos.x} y2={pos.y} stroke={`url(#trail${s.from})`} strokeWidth={5} strokeLinecap="round" />
            ) : (
              <>
                <line x1={r.a.x} y1={r.a.y} x2={pos.x} y2={pos.y} stroke="rgba(0,0,0,0.45)" strokeWidth={12} strokeLinecap="round" />
                <line x1={r.a.x} y1={r.a.y} x2={pos.x} y2={pos.y} stroke={ROUTE} strokeWidth={6}
                  strokeDasharray={r.mode === 'walk' ? '2 16' : r.mode === 'ship' ? '20 16' : undefined} strokeLinecap="round" />
              </>
            )}
            {t < 0.999 && r.mode === 'plane' && <Airliner x={pos.x} y={pos.y} angle={ang} s={2.1} />}
            {r.mode === 'ship' && <ShipTop x={pos.x} y={pos.y} angle={ang} s={2.2} wake={Math.min(1, t * 4)} />}
            {r.mode === 'car' && <CarTop x={pos.x} y={pos.y} angle={ang} s={2.0} />}
          </>
        )}
      </svg>
      {s.pins.map((p, i) => (
        <Pin key={i} p={p} label={p.label} color={p.color}
          o={EASE_OUT(prog(f, i === 0 && s.pins.length > 1 ? c.start : lerp(c.start, c.end, 0.55),
            (i === 0 && s.pins.length > 1 ? c.start : lerp(c.start, c.end, 0.55)) + 10))} />
      ))}
    </AbsoluteFill>
  );
};

// ----------------------------------------------------------------- column
const niceStep = (max: number) => {
  const raw = max / 9;
  const p = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 5, 10].map((k) => k * p).find((k) => k >= raw) ?? p * 10;
};
const unitOf = (v: number, max: number) => (max >= 20000 ? `${fmt(v / 1000)} km` : `${fmt(v)} m`);

const ColumnView: React.FC<{ s: ColumnScene; c: Clock }> = ({ s, c }) => {
  const { f } = c;
  const up = s.axis === 'height';
  // the value the camera follows: each stop is reached 70% into its line
  const valueAt = (fr: number) => {
    let v = 0;
    let prev = 0;
    for (const st of s.stops) {
      const a = c.cue(st.line);
      const b = lerp(a, c.lineEnd(st.line), 0.7);
      if (fr >= a) v = prev + (st.value - prev) * EASE_INOUT(prog(fr, a, b));
      prev = st.value;
    }
    return v;
  };
  const V = valueAt(f);
  const moving = Math.min(1, Math.abs(valueAt(f) - valueAt(f - 2)) / (s.max / 500));
  let zOut = 0;
  if (s.compare && f >= c.cue(s.compare.line)) {
    zOut = EASE_INOUT(c.within(s.compare.line, 0, 0.35));
    const after = s.compare.line + 1;
    if (after <= s.to) zOut *= 1 - EASE_INOUT(c.within(after, 0, 0.3));
  }
  const Kc = 3500 / s.max;
  const Kf = 1230 / s.max;
  const K = lerp(Kc, Kf, zOut);
  const A = up ? lerp(1100 + V * Kc, 1580, zOut) : lerp(780 - V * Kc, 330, zOut);
  const yOf = (m: number) => (up ? A - m * K : A + m * K);
  const y0 = yOf(0);
  const yMax = yOf(s.max);
  const vx = lerp(540, 860, zOut);
  const vy = yOf(V);
  const vs = lerp(1, 0.45, zOut);

  let bg: string;
  if (s.medium === 'air') {
    bg = `linear-gradient(to bottom, #000 ${yOf(60000)}px, #050d24 ${yOf(30000)}px, #12306a ${yOf(15000)}px,
      #3a78c2 ${yOf(8000)}px, #6fb2e6 ${yOf(3000)}px, #a6d8f7 ${y0}px, #55663a ${y0}px, #2b3520 ${y0 + 600}px)`;
  } else if (s.medium === 'ocean') {
    bg = `linear-gradient(to bottom, #9fd4f5 0px, #d9eefb ${y0 - 1}px, #3aa0dc ${y0}px, #1c74b4 ${yOf(120)}px,
      #0f4f8a ${yOf(350)}px, #072447 ${yOf(1000)}px, #020b18 ${yOf(3000)}px, #000307 ${yMax}px)`;
  } else if (s.medium === 'ice') {
    bg = `linear-gradient(to bottom, #9fd4f5 0px, #e4f2fb ${y0 - 1}px, #f4fbff ${y0}px, #a9d9f2 ${yOf(s.max * 0.25)}px,
      #4d8fc2 ${yOf(s.max * 0.65)}px, #1b3b63 ${yMax}px, #2a231e ${yMax + 1}px, #140f0b ${yMax + 800}px)`;
  } else {
    bg = `linear-gradient(to bottom, #9fd4f5 0px, #d9eefb ${y0 - 1}px, #6b8f3a ${y0}px, #7a5a3a ${y0 + 14}px,
      #5c4128 ${yOf(s.max * 0.3)}px, #3a2618 ${yOf(s.max * 0.7)}px, #2a130b ${yMax}px, #1a0905 ${yMax + 800}px)`;
  }

  const step = niceStep(s.max);
  const ticks = Array.from({ length: Math.floor(s.max / step) + 1 }, (_, k) => k * step).filter((m) => m > 0);
  const cmp = s.compare;
  const cmpO = cmp ? zOut : 0;
  const R = React.useMemo(() => ridge(8849), []);
  const rocks = React.useMemo(() => {
    const r = rng(s.max | 0);
    return Array.from({ length: 24 }, () => ({ x: r() * W, w: 8 + r() * 26, h: 4 + r() * 10, dy: r() * 30 }));
  }, [s.max]);
  const counterLabel = up ? 'ALTITUDE' : 'DEPTH';
  const strata = s.medium === 'rock' || s.medium === 'ice';

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <Defs />
        {/* surface */}
        {s.medium === 'ocean' && (
          <>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const x = 90 + i * 180 + Math.sin(f / 38 + i * 1.7) * 30;
              const o = (1 - prog(V, 150, 700)) * (0.5 + 0.5 * Math.sin(f / 22 + i));
              return o > 0.01 ? (
                <path key={i} d={`M ${x} ${y0} L ${x + 70} ${y0} L ${x + 230} ${y0 + 1000} L ${x + 40} ${y0 + 1000} Z`}
                  fill="url(#ray)" opacity={o} />
              ) : null;
            })}
            <path d={`M 0 ${y0} ${Array.from({ length: 13 }, (_, i) =>
              `Q ${i * 90 + 45} ${y0 + Math.sin(f / 9 + i) * 6} ${(i + 1) * 90} ${y0}`).join(' ')}`}
              fill="none" stroke="#f2fbff" strokeWidth={4} opacity={0.85} />
            {s.vehicle === 'sub' && <Ship x={380} wy={y0} s={1.3 * lerp(1, 0.5, zOut)} />}
          </>
        )}
        {strata && Array.from({ length: 9 }, (_, i) => {
          const y = yOf((s.max * (i + 1)) / 9.5);
          return <path key={i} d={`M 0 ${y} Q 270 ${y - 14} 540 ${y + 6} T ${W} ${y - 4}`} fill="none"
            stroke={s.medium === 'ice' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.22)'} strokeWidth={5} />;
        })}
        {s.medium === 'air' && s.vehicle === 'climber' && (() => {
          const summit = yOf(s.max);
          const pts = R.map(([x, h]) => `${60 + x * 960},${lerp(y0 + 4, summit, h)}`).join(' L ');
          return (
            <g>
              <path d={`M ${pts} Z`} fill="url(#rock)" />
              <path d={`M ${pts}`} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
            </g>
          );
        })()}

        {(s.medium === 'ocean' || strata) && (
          <Flakes shift={V * Kc} o={prog(V, s.max * 0.01, s.max * 0.05) * (1 - zOut)}
            color={s.medium === 'rock' ? '#d8b48a' : '#dfefff'} n={70} />
        )}

        {/* ruler */}
        {ticks.map((m) => {
          const y = yOf(m);
          if (y < -30 || y > H + 30) return null;
          return (
            <g key={m} opacity={0.72}>
              <line x1={40} y1={y} x2={78} y2={y} stroke="#e8f3ff" strokeWidth={3} />
              <text x={88} y={y + 9} fontFamily={MONO} fontSize={26} fill="#e8f3ff">
                {step >= 1000 ? `${fmt(m / 1000)} km` : `${fmt(m)} m`}</text>
            </g>
          );
        })}

        {/* markers, each appearing as the camera reaches it */}
        {s.markers.map((mk, i) => {
          const y = yOf(mk.value);
          const o = Math.max(prog(up ? V : V, mk.value * 0.8, mk.value * 0.98), zOut * 0.8);
          return (
            <g key={i} opacity={o}>
              <line x1={0} y1={y} x2={W} y2={y} stroke={i % 2 ? '#e8a15a' : ROUTE} strokeWidth={3}
                strokeDasharray="18 14" opacity={0.7} />
              <text x={40} y={y - 22} fontFamily={SANS} fontWeight={700} fontSize={30}
                fill={i % 2 ? '#e8a15a' : ROUTE} opacity={1 - zOut * 0.5}
                style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.6)', strokeWidth: 5 }}>{mk.label}</text>
            </g>
          );
        })}

        {/* comparison, drawn to the same scale */}
        {cmp && cmpO > 0.01 && (() => {
          const base = up ? y0 : yMax;
          const top = up ? yOf(cmp.value) : yOf(s.max - cmp.value);
          if (cmp.kind === 'titanic') {
            return <Wreck x={780} y={yOf(cmp.value) + 40} s={0.6} o={cmpO} />;
          }
          if (cmp.kind === 'tower') {
            return (
              <g opacity={cmpO}>
                <Tower x={300} by={base} hpx={Math.abs(base - top)} o={1} />
                <text x={300} y={top - 20} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={34} fill="#fff">{cmp.label}</text>
              </g>
            );
          }
          const grow = lerp(base, top, EASE_OUT(Math.min(1, cmpO * 1.2)));
          const pts = R.map(([x, h]) => `${50 + x * 700},${lerp(base + 4, grow, h)}`).join(' L ');
          return (
            <g opacity={cmpO}>
              <path d={`M ${pts} Z`} fill="url(#rock)" />
              <path d={`M ${pts}`} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={2} />
              <text x={50 + 0.47 * 700} y={grow - 24} textAnchor="middle" fontFamily={SANS} fontWeight={700}
                fontSize={36} fill="#fff" style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.6)', strokeWidth: 5 }}>
                {cmp.label}</text>
              {cmp.spare && !up && (
                <>
                  <line x1={990} y1={y0} x2={990} y2={top} stroke={ROUTE} strokeWidth={5} />
                  <line x1={970} y1={y0} x2={1010} y2={y0} stroke={ROUTE} strokeWidth={5} />
                  <line x1={970} y1={top} x2={1010} y2={top} stroke={ROUTE} strokeWidth={5} />
                  <text x={960} y={(y0 + top) / 2 + 12} textAnchor="end" fontFamily={SANS} fontWeight={700}
                    fontSize={38} fill={ROUTE}>{cmp.spare}</text>
                </>
              )}
            </g>
          );
        })()}

        {/* floor of the sea */}
        {s.medium === 'ocean' && (
          <>
            <path d={`M 0 ${yMax + 8} ${Array.from({ length: 20 }, (_, i) =>
              `L ${(i + 1) * 60} ${yMax + Math.sin(i * 2.3) * 8}`).join(' ')} L ${W + 60} ${H + 900} L 0 ${H + 900} Z`}
              fill="url(#sediment)" />
            {rocks.map((r, i) => (
              <ellipse key={i} cx={r.x} cy={yMax + 6 + r.dy * (1 - zOut * 0.7)} rx={r.w * lerp(1, 0.5, zOut)}
                ry={r.h * lerp(1, 0.5, zOut)} fill="#2a221c" opacity={0.8} />
            ))}
          </>
        )}

        {/* the hole and the rig */}
        {strata && s.vehicle === 'drill' && (
          <>
            <rect x={vx - 12 * vs} y={y0} width={24 * vs} height={Math.max(0, vy - y0)} fill="#0b0705" />
            <line x1={vx} y1={y0} x2={vx} y2={vy} stroke="#9aa6b2" strokeWidth={4 * vs} />
            <Rig x={vx} gy={y0} s={1.1 * vs} />
            <DrillBit x={vx} y={vy} s={1.2 * vs} />
          </>
        )}
        {s.medium === 'ocean' && s.vehicle === 'sub' && (
          <>
            <circle cx={vx} cy={vy} r={280 * vs} fill="url(#halo)" opacity={prog(V, 350, 1000)} />
            {Array.from({ length: 12 }, (_, k) => {
              const age = ((f + k * 11) % 36) / 36;
              return <circle key={k} cx={vx + (-70 + ((k * 37) % 60)) * vs + Math.sin(f / 4 + k) * 6}
                cy={vy - (50 + age * 200) * vs} r={(2.5 + (k % 4)) * vs} fill="none" stroke="#dff3ff"
                strokeWidth={1.5} opacity={(1 - age) * 0.6 * moving} />;
            })}
            <Sub x={vx} y={vy} s={vs} light={prog(V, 350, 1000)} shake={0} />
          </>
        )}
        {s.vehicle === 'climber' && (
          <Climber x={lerp(200, 60 + 0.47 * 960, Math.min(1, V / s.max))} y={vy} s={1.6 * vs} />
        )}
      </svg>

      {/* counter */}
      <div style={{ position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center', opacity: 1 - zOut }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: '#cfe6ff',
          textShadow: '0 3px 12px rgba(0,0,0,0.8)' }}>{counterLabel}</div>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 104, color: V >= s.max - 1 ? ROUTE : '#fff',
          textShadow: '0 6px 26px rgba(0,0,0,0.8)' }}>{unitOf(V, s.max)}</div>
      </div>
    </AbsoluteFill>
  );
};

// ----------------------------------------------------------------- stat / card
const StatView: React.FC<{ s: StatScene; c: Clock }> = ({ s, c }) => {
  const { f } = c;
  const t = EASE_OUT(prog(f, c.start + 4, lerp(c.start, c.end, 0.6)));
  const v = s.value * t;
  const fall = s.theme === 'cold';
  return (
    <AbsoluteFill style={{ background: THEME[s.theme] || THEME.dark }}>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <Flakes shift={fall ? -f * 5 : f * 4} o={0.9} color={s.theme === 'hot' ? '#ffb347' : '#ffffff'} n={110} />
        <g transform={`translate(540 ${760 + Math.sin(f / 20) * 6})`}>
          <Icon kind={s.icon} fill={s.icon === 'thermo' ? (s.value < 0 ? 0.15 + 0.1 * (1 - t) : 0.2 + 0.75 * t) : t} s={1.15} />
        </g>
      </svg>
      <div style={{ position: 'absolute', top: 1060, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 150, color: '#fff',
          textShadow: '0 8px 30px rgba(0,0,0,0.7)' }}>{fmt(v)}<span style={{ fontSize: 90 }}>{s.unit}</span></div>
        <div style={{ marginTop: 6, fontFamily: SANS, fontWeight: 700, fontSize: 50, letterSpacing: 3, color: ROUTE,
          textShadow: '0 4px 16px rgba(0,0,0,0.8)', padding: '0 60px' }}>{s.label}</div>
      </div>
    </AbsoluteFill>
  );
};

const CardView: React.FC<{ s: CardScene; c: Clock }> = ({ s, c }) => {
  const { f } = c;
  const t = EASE_OUT(prog(f, c.start, c.start + 14));
  return (
    <AbsoluteFill style={{ background: THEME[s.theme] || THEME.dark }}>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <Flakes shift={f * 2} o={0.6} n={60} />
      </svg>
      <div style={{ position: 'absolute', top: 640, left: 70, right: 70, textAlign: 'center',
        transform: `scale(${0.92 + 0.08 * t})`, opacity: t }}>
        <div style={{ display: 'inline-block', background: 'rgba(8,10,14,0.72)', border: `3px solid ${ROUTE}`,
          borderRadius: 22, padding: '30px 38px', fontFamily: SANS, fontWeight: 700, fontSize: 66, lineHeight: 1.15,
          color: '#fff' }}>{s.text}</div>
      </div>
    </AbsoluteFill>
  );
};

// ----------------------------------------------------------------- the shot
const Explore: React.FC<Partial<ExploreProps>> = ({
  vo = [], hook = { top: '', bottom: '' }, wide, scenes = [], durationInSeconds = 35,
}) => {
  const f = useCurrentFrame();
  if (!wide) return <AbsoluteFill style={{ background: '#05070b' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const last = vo.length - 1;
  const firstStart = scenes.length ? cue(scenes[0].from) : END;
  const wideO = 1 - prog(f, firstStart - 6, firstStart + 8);
  const loopT = EASE_INOUT(prog(f, cue(last), END - 4));
  const hookO = Math.max(1 - prog(f, cue(1) - 8, cue(1) + 4), prog(f, END - 22, END - 4));

  const wideView = (z: number) => (
    <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: `${wide.target.x}px ${wide.target.y}px` }}>
      <Img src={staticFile(wide.image)} style={{ width: W, height: H, objectFit: 'cover' }} />
      <Pin p={wide.target} o={1} />
    </AbsoluteFill>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#05070b', overflow: 'hidden' }}>
      {wideO > 0.001 && <AbsoluteFill style={{ opacity: wideO }}>{wideView(1.04 + 0.05 * prog(f, 0, firstStart))}</AbsoluteFill>}

      {scenes.map((s, i) => {
        const start = cue(s.from);
        const end = s.to + 1 <= last ? cue(s.to + 1) : END;
        if (f < start - 8 || f > end + 8) return null;
        const o = prog(f, start - 6, start + 6) * (i + 1 < scenes.length ? 1 - prog(f, end - 6, end + 6) : 1);
        const c: Clock = { f, cue, lineEnd, within, start, end };
        return (
          <AbsoluteFill key={i} style={{ opacity: o }}>
            {s.type === 'map' && <MapView s={s} c={c} />}
            {s.type === 'column' && <ColumnView s={s} c={c} />}
            {s.type === 'stat' && <StatView s={s} c={c} />}
            {s.type === 'card' && <CardView s={s} c={c} />}
          </AbsoluteFill>
        );
      })}

      {loopT > 0.001 && <AbsoluteFill style={{ opacity: loopT }}>{wideView(1.04)}</AbsoluteFill>}

      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.42) 100%)' }} />

      <div style={{
        position: 'absolute', top: 200, left: 50, right: 50, textAlign: 'center',
        fontFamily: SANS, fontWeight: 700, fontSize: 70, lineHeight: 1.1, color: '#fff',
        textShadow: '0 6px 30px rgba(0,0,0,0.85)', opacity: hookO,
      }}>
        {hook.top}<br /><span style={{ color: ROUTE }}>{hook.bottom}</span>
      </div>

      <EndCard from={cue(last)} to={END - 14} text="" compact />
      <Captions lines={vo} y={1560} accent={ROUTE} maxWords={3} size={58} plate />
    </AbsoluteFill>
  );
};

export default Explore;
