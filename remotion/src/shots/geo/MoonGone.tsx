import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { Card, Sun } from './BlackHole';
import { EndCard } from './EndCard';
import { GlobeView, SpaceBg } from './Globe';
import { ALERT, H, MONO, ROUTE, SANS, W, lerp, ridge, rng } from './parts';

// =============================================================================
// "What if the Moon disappeared?" The Moon blinks out - but the tides carry on
// (the Sun pulls too, 46% as hard), only smaller; the night loses its brightest
// light; corals lose the full moon they time their spawning by; total eclipses
// end (the Sun is 400x wider and 400x farther, which is why the Moon fits it);
// Earth's tilt loses its anchor, next to Mars (no big moon, tilt 10-70 degrees);
// and the twist: the Moon is already leaving, 3.8 cm a year, measured by laser.
// The script, its numbers and sources live in make_moongone.py.
// =============================================================================
export const compositionConfig = {
  id: 'MoonGone',
  durationInSeconds: 42,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string; badge: string };
  at: { tides: number; shrink: number; dark: number; coral: number; eclipse: number; ratio: number; tilt: number; mars: number; leaving: number };
  durationInSeconds: number;
};

const SEA = '#4fc3ff';

// the near side's dark "seas" (maria) and a scatter of craters, in Moon radii
const MARIA: [number, number, number][] = [
  [-0.3, -0.38, 0.27], [0.08, -0.32, 0.17], [0.27, -0.06, 0.2], [0.58, -0.2, 0.11],
  [-0.52, 0.04, 0.3], [-0.16, 0.36, 0.15], [0.45, 0.18, 0.12], [-0.3, 0.12, 0.14],
];
const CRATERS = (() => {
  const r = rng(4242);
  return Array.from({ length: 26 }, () => {
    const a = r() * Math.PI * 2; const d = Math.sqrt(r()) * 0.85;
    return [Math.cos(a) * d, Math.sin(a) * d, 0.02 + r() * 0.05] as [number, number, number];
  });
})();

export const Moon: React.FC<{ id: string; x: number; y: number; r: number; o?: number; glow?: number }> = ({ id, x, y, r, o = 1, glow = 0.6 }) => (
  <g opacity={o}>
    <defs>
      <radialGradient id={`mb-${id}`} cx="0.4" cy="0.36" r="0.72">
        <stop offset="0" stopColor="#f6f3ec" /><stop offset="0.65" stopColor="#cfcac0" /><stop offset="1" stopColor="#8a867e" />
      </radialGradient>
      <radialGradient id={`mh-${id}`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0.45" stopColor="#dfe8ff" stopOpacity={0.5} /><stop offset="1" stopColor="#dfe8ff" stopOpacity={0} />
      </radialGradient>
      <clipPath id={`mc-${id}`}><circle cx={x} cy={y} r={r} /></clipPath>
    </defs>
    {glow > 0 && <circle cx={x} cy={y} r={r * 2.2} fill={`url(#mh-${id})`} opacity={glow} />}
    <circle cx={x} cy={y} r={r} fill={`url(#mb-${id})`} />
    <g clipPath={`url(#mc-${id})`}>
      {MARIA.map(([dx, dy, rr], i) => (
        <ellipse key={i} cx={x + dx * r} cy={y + dy * r} rx={rr * r} ry={rr * r * 0.82} fill="#7f7b74" opacity={0.42} />
      ))}
      {CRATERS.map(([dx, dy, rr], i) => (
        <circle key={i} cx={x + dx * r} cy={y + dy * r} r={rr * r} fill="none" stroke="#9c988f"
          strokeWidth={Math.max(1, r * 0.012)} opacity={0.5} />
      ))}
      <circle cx={x - 0.1 * r} cy={y + 0.68 * r} r={0.045 * r} fill="#fbfaf6" opacity={0.85} />
    </g>
  </g>
);

// the moment it blinks out: a ring and a scatter of dust
const Poof: React.FC<{ x: number; y: number; r: number; t: number }> = ({ x, y, r, t }) => {
  if (t <= 0 || t >= 1) return null;
  return (
    <g>
      <circle cx={x} cy={y} r={r * (1 + 2 * t)} fill="none" stroke="#e8f0ff" strokeWidth={10 * (1 - t)} opacity={1 - t} />
      {Array.from({ length: 18 }, (_, i) => {
        const a = (i / 18) * Math.PI * 2; const d = r * (0.6 + 2.2 * t);
        return <circle key={i} cx={x + Math.cos(a) * d} cy={y + Math.sin(a) * d} r={r * 0.07 * (1 - t)} fill="#dfe6f0" opacity={1 - t} />;
      })}
    </g>
  );
};

// one Moon phase (k: 0 new, 0.5 full, back to 1), lit on the right while waxing
const Phase: React.FC<{ x: number; y: number; r: number; k: number; o: number }> = ({ x, y, r, k, o }) => {
  const c = Math.cos(k * Math.PI * 2); const rx = Math.abs(c) * r;
  const waxing = k <= 0.5; const crescent = c > 0;
  const limb = waxing ? 1 : 0;
  const term = waxing ? (crescent ? 0 : 1) : (crescent ? 1 : 0);
  return (
    <g opacity={o}>
      <circle cx={x} cy={y} r={r} fill="#1a2233" stroke="#3b4a66" strokeWidth={2} />
      {k > 0.01 && k < 0.99 && (
        <path d={`M ${x} ${y - r} A ${r} ${r} 0 0 ${limb} ${x} ${y + r} A ${rx} ${r} 0 0 ${term} ${x} ${y - r} Z`} fill="#e9e6dc" />
      )}
    </g>
  );
};

const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; color: string; w: number; o: number }> = ({ x1, y1, x2, y2, color, w, o }) => {
  const a = Math.atan2(y2 - y1, x2 - x1); const h = w * 2.6;
  const p = (da: number) => `${x2 - Math.cos(a + da) * h},${y2 - Math.sin(a + da) * h}`;
  return (
    <g opacity={o} stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <path d={`M ${p(0.5)} L ${x2},${y2} L ${p(-0.5)}`} />
    </g>
  );
};

const NIGHT = (() => {
  const r = rng(616);
  return Array.from({ length: 420 }, () => ({ x: r() * W, y: r() * 1300, s: 0.5 + r() * 1.6, a: 0.3 + r() * 0.7, p: r() * 6 }));
})();

const Hills: React.FC<{ lit: number }> = ({ lit }) => {
  const R1 = React.useMemo(() => ridge(512), []);
  const R2 = React.useMemo(() => ridge(88), []);
  const pts = (rr: [number, number][], base: number, hgt: number, x0: number, w: number) =>
    rr.map(([x, h]) => `${x0 + x * w},${base - h * hgt}`).join(' L ');
  const back = `M ${pts(R2, 1330, 240, -200, 900)} L 700 1500 L -200 1500 Z`;
  const front = `M ${pts(R1, 1360, 300, 360, 920)} L 1280 1500 L 360 1500 Z`;
  return (
    <g>
      <path d={back} fill="#0b111d" /><path d={back} fill="#3c5680" opacity={0.55 * lit} />
      <path d={front} fill="#070b13" /><path d={front} fill="#2c4268" opacity={0.6 * lit} />
      <rect x={0} y={1440} width={W} height={H - 1440} fill="#04070c" />
      <rect x={0} y={1440} width={W} height={60} fill="#1a2f52" opacity={0.7 * lit} />
    </g>
  );
};

// a branching coral, drawn once per seed
const coralLines = (x: number, y: number, len: number, ang: number, depth: number, out: number[][] = []) => {
  const x2 = x + Math.cos(ang) * len; const y2 = y + Math.sin(ang) * len;
  out.push([x, y, x2, y2, depth]);
  if (depth > 0) {
    coralLines(x2, y2, len * 0.72, ang - 0.42, depth - 1, out);
    coralLines(x2, y2, len * 0.72, ang + 0.38, depth - 1, out);
  }
  return out;
};
const CORALS = [
  { x: 170, len: 120, color: '#ff7b9c' }, { x: 470, len: 150, color: '#ffb36b' },
  { x: 760, len: 130, color: '#b08cff' }, { x: 960, len: 100, color: '#ff8f70' },
].map((c) => ({ ...c, lines: coralLines(c.x, 1460, c.len, -Math.PI / 2, 3) }));
const DOMES = [{ x: 320, rx: 90, color: '#c96a6a' }, { x: 620, rx: 110, color: '#d99a5b' }, { x: 870, rx: 70, color: '#9a7bd1' }];

const Mars: React.FC<{ x: number; y: number; r: number; tilt: number; f: number }> = ({ x, y, r, tilt, f }) => {
  const spots: [number, number, number][] = [[-0.6, -0.15, 0.32], [0.1, 0.2, 0.22], [0.7, -0.3, 0.18], [1.3, 0.05, 0.28], [1.9, 0.3, 0.2]];
  return (
    <g transform={`rotate(${tilt} ${x} ${y})`}>
      <defs>
        <radialGradient id="marsB" cx="0.42" cy="0.38" r="0.7">
          <stop offset="0" stopColor="#f08a55" /><stop offset="0.7" stopColor="#c25a2e" /><stop offset="1" stopColor="#7a3218" />
        </radialGradient>
        <radialGradient id="marsL" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.7" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.55} />
        </radialGradient>
        <clipPath id="marsC"><circle cx={x} cy={y} r={r} /></clipPath>
      </defs>
      <circle cx={x} cy={y} r={r * 1.06} fill="#ff9a6a" opacity={0.12} />
      <circle cx={x} cy={y} r={r} fill="url(#marsB)" />
      <g clipPath="url(#marsC)">
        {spots.map(([u0, v, s], i) => {
          const u = ((u0 + f * 0.006 + 1.2) % 2.6) - 1.3;          // spins west to east and wraps
          const k = Math.sqrt(Math.max(0, 1 - u * u));
          return <ellipse key={i} cx={x + u * r} cy={y + v * r} rx={s * r * k} ry={s * r * 0.6} fill="#6b2a14" opacity={0.45} />;
        })}
        <ellipse cx={x} cy={y - r * 0.94} rx={r * 0.42} ry={r * 0.13} fill="#f4f1ee" />
        <ellipse cx={x} cy={y + r * 0.96} rx={r * 0.28} ry={r * 0.09} fill="#f4f1ee" opacity={0.9} />
      </g>
      <circle cx={x} cy={y} r={r} fill="url(#marsL)" />
      <line x1={x} y1={y - r - 120} x2={x} y2={y + r + 120} stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.9} />
    </g>
  );
};

const MoonGone: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '', badge: '' }, at, durationInSeconds = 42 }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const span = (a: number, b: number) => prog(f, cue(a) - 6, cue(a) + 8) * (1 - prog(f, cue(b) - 8, cue(b) + 6));
  const last = vo.length - 1;
  const spin0 = 20;
  const spin = spin0 - f * 0.6;

  // ---- hook: Earth, its Moon and the tidal bulge; the Moon blinks out just after "vanished"
  const sHook = 1 - prog(f, cue(at.tides) - 6, cue(at.tides) + 8);
  const gone0 = EASE_OUT(within(0, 0.3, 0.42));
  const poof0 = within(0, 0.3, 0.6);
  const hookScene = (key: string, moonO: number, poof: number, bulge: number, lon: number) => (
    <>
      <SpaceBg />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <ellipse cx={540} cy={1150} rx={400 + bulge} ry={410} transform="rotate(-64 540 1150)" fill={SEA} opacity={0.22}
          stroke={SEA} strokeWidth={3} strokeOpacity={0.5} />
        <Moon id={`hook-${key}`} x={830} y={560} r={95} o={moonO} />
        <Poof x={830} y={560} r={95} t={poof} />
      </svg>
      <GlobeView id={key} cx={540} cy={1150} R={400} lon0={lon} lat0={12} />
    </>
  );

  // ---- the Sun still pulls (top-down view of Earth)
  const sTides = span(at.tides, at.shrink);
  const sunBar = EASE_OUT(within(at.tides, 0.15, 0.5));
  const moonBar = 1 - EASE_INOUT(within(at.tides, 0.05, 0.3));
  const bulgeT = EASE_INOUT(within(at.tides, 0.4, 0.8));

  // ---- tides shrink (side view of a beach)
  const sShrink = span(at.shrink, at.dark);
  const amp = lerp(230, 230 * 0.46, EASE_INOUT(within(at.shrink, 0.2, 0.55)));
  const level = 1000 - amp * Math.sin((f - cue(at.shrink)) / 8 + 1.2);
  const newMarks = EASE_OUT(within(at.shrink, 0.45, 0.7));

  // ---- the night loses its brightest light
  const sDark = span(at.dark, at.coral);
  const moonOut = EASE_INOUT(within(at.dark, 0.72, 0.86));

  // ---- corals lose their calendar
  const sCoral = span(at.coral, at.eclipse);
  const spawning = EASE_OUT(within(at.coral, 0.05, 0.25));
  const lost = EASE_INOUT(within(at.coral, 0.55, 0.78));

  // ---- the last total eclipse
  const sEcl = span(at.eclipse, at.ratio);
  const cover = EASE_INOUT(within(at.eclipse, 0, 0.42));
  const eclGone = EASE_OUT(within(at.eclipse, 0.6, 0.72));
  const total = prog(cover, 0.94, 1) * (1 - eclGone);

  // ---- why eclipses work: 400x wider, 400x farther
  const sRatio = span(at.ratio, at.tilt);
  const cone = EASE_OUT(within(at.ratio, 0, 0.22));
  const wider = EASE_INOUT(within(at.ratio, 0.18, 0.45));
  const farther = EASE_INOUT(within(at.ratio, 0.5, 0.75));
  const same = EASE_OUT(within(at.ratio, 0.8, 0.92));

  // ---- Earth's tilt loses its anchor
  const sTilt = span(at.tilt, at.mars);
  const anchorGone = EASE_OUT(within(at.tilt, 0.12, 0.26));
  const wob = EASE_INOUT(within(at.tilt, 0.25, 0.55));
  const tilt = 23.4 + 11 * wob * Math.sin((f - cue(at.tilt)) / 10);
  const orbitA = (f - cue(at.tilt)) / 14;

  // ---- Mars: no big moon, tilt 10-70 degrees
  const sMars = span(at.mars, at.leaving);
  const mTilt = 40 - 30 * Math.cos(((f - cue(at.mars)) / 30) * 1.55);

  // ---- the twist: the Moon is already leaving
  const sLeave = span(at.leaving, last);
  const drift = EASE_INOUT(within(at.leaving, 0.15, 0.95));
  const loopT = EASE_INOUT(prog(f, cue(last), END - 4));

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      {/* ---------------- hook ---------------- */}
      {sHook > 0.001 && (
        <AbsoluteFill style={{ opacity: sHook }}>{hookScene('hook', 1 - gone0, poof0, lerp(60, 30, gone0), spin)}</AbsoluteFill>
      )}

      {/* ---------------- the Sun pulls on the oceans too ---------------- */}
      {sTides > 0.001 && (
        <AbsoluteFill style={{ opacity: sTides }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <Sun x={1150} y={1000} r={120} />
            <ellipse cx={540} cy={1000} rx={230 + lerp(105, 48, bulgeT) + 6 * Math.sin(f / 6)} ry={248} fill={SEA} opacity={0.3}
              stroke={SEA} strokeWidth={3} strokeOpacity={0.6} />
            <circle cx={120} cy={1000} r={62} fill="none" stroke="#8b93a6" strokeWidth={3} strokeDasharray="8 10" />
            <text x={120} y={1100} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={30} fill="#8b93a6">MOON</text>
            <text x={120} y={1136} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={30} fill={ALERT}>GONE</text>
            <Arrow x1={800} y1={1000} x2={lerp(800, 960, sunBar)} y2={1000} color={ROUTE} w={10} o={sunBar} />
            {/* the pull, Moon = 100% */}
            <text x={540} y={250} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={34} letterSpacing={5} fill="#9fc8ea">PULL ON THE OCEANS</text>
            <text x={70} y={348} fontFamily={SANS} fontWeight={700} fontSize={40} fill="#c9ced8">MOON</text>
            <rect x={260} y={312} width={600} height={46} rx={10} fill="#2a3242" />
            <rect x={260} y={312} width={600 * moonBar} height={46} rx={10} fill="#c9ced8" />
            <text x={880} y={350} fontFamily={MONO} fontWeight={700} fontSize={40} fill={moonBar < 0.5 ? ALERT : '#c9ced8'}>
              {moonBar < 0.5 ? '0%' : '100%'}</text>
            <text x={70} y={448} fontFamily={SANS} fontWeight={700} fontSize={40} fill={ROUTE}>SUN</text>
            <rect x={260} y={412} width={600} height={46} rx={10} fill="#2a3242" />
            <rect x={260} y={412} width={600 * 0.46 * sunBar} height={46} rx={10} fill={ROUTE} />
            <text x={280 + 600 * 0.46 * sunBar} y={450} fontFamily={MONO} fontWeight={700} fontSize={40} fill={ROUTE}>
              {Math.round(46 * sunBar)}%</text>
          </svg>
          <GlobeView id="tides" cx={540} cy={1000} R={230} lon0={spin} lat0={90} />
          <Card top="THE SUN MAKES TIDES TOO" color={ROUTE} y={1290} o={EASE_OUT(within(at.tides, 0.25, 0.45))} />
        </AbsoluteFill>
      )}

      {/* ---------------- smaller tides on a beach ---------------- */}
      {sShrink > 0.001 && (
        <AbsoluteFill style={{ opacity: sShrink, background: 'linear-gradient(#081428 0%, #12284a 60%, #1c3a5e 100%)' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <path d={`M 0 ${level} ${Array.from({ length: 28 }, (_, i) => {
              const x = (i + 1) * 40; return `L ${x} ${level + Math.sin(i * 0.9 + f / 5) * 9}`;
            }).join(' ')} L ${W} 1920 L 0 1920 Z`} fill="#1f6fae" opacity={0.92} />
            <path d={`M 0 ${level} ${Array.from({ length: 28 }, (_, i) => {
              const x = (i + 1) * 40; return `L ${x} ${level + Math.sin(i * 0.9 + f / 5) * 9}`;
            }).join(' ')}`} fill="none" stroke="#bfe6ff" strokeWidth={5} />
            {/* the beach and the sea bed */}
            <path d="M 0 1500 L 380 1500 L 1080 700 L 1080 1920 L 0 1920 Z" fill="#c8a46a" />
            <path d="M 380 1500 L 1080 700" stroke="#e8cf98" strokeWidth={6} />
            {/* a tide post */}
            <rect x={232} y={600} width={36} height={900} fill="#6b4a2b" />
            {Array.from({ length: 18 }, (_, i) => (
              <line key={i} x1={226} x2={274} y1={640 + i * 50} y2={640 + i * 50} stroke="#e8d9c0" strokeWidth={3} opacity={0.7} />
            ))}
            {/* where the tide used to reach, and where it reaches now */}
            {[770, 1230].map((y, i) => (
              <g key={y}>
                <line x1={0} x2={W} y1={y} y2={y} stroke="#ffffff" strokeWidth={3} strokeDasharray="14 12" opacity={0.55} />
                <text x={300} y={y - 14} fontFamily={SANS} fontWeight={700} fontSize={30} fill="#ffffff" opacity={0.75}>
                  {i === 0 ? 'OLD HIGH TIDE' : 'OLD LOW TIDE'}</text>
              </g>
            ))}
            {[1000 - 230 * 0.46, 1000 + 230 * 0.46].map((y, i) => (
              <g key={y} opacity={newMarks}>
                <line x1={0} x2={W} y1={y} y2={y} stroke={ROUTE} strokeWidth={5} />
                <text x={300} y={y + (i === 0 ? -14 : 40)} fontFamily={SANS} fontWeight={700} fontSize={30} fill={ROUTE}>
                  {i === 0 ? 'NEW HIGH TIDE' : 'NEW LOW TIDE'}</text>
              </g>
            ))}
          </svg>
          <div style={{ position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: 6, color: '#9fc8ea' }}>TIDES WITHOUT THE MOON</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 96, color: '#fff', textShadow: '0 6px 30px #000' }}>
              {newMarks > 0.5 ? 'LESS THAN HALF' : 'SHRINKING...'}</div>
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- the brightest light of the night goes out ---------------- */}
      {sDark > 0.001 && (
        <AbsoluteFill style={{ opacity: sDark, background: '#01030a' }}>
          <AbsoluteFill style={{ opacity: 1 - moonOut, background: 'linear-gradient(#0c1a36 0%, #142a52 70%, #1b3563 100%)' }} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {NIGHT.map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#fff"
                opacity={s.a * (0.7 + 0.3 * Math.sin(f / 7 + s.p)) * (0.25 + 0.75 * moonOut)} />
            ))}
            <Moon id="dark" x={720} y={600} r={120} o={1 - moonOut} glow={1} />
            <Poof x={720} y={600} r={120} t={within(at.dark, 0.72, 1)} />
            <Hills lit={1 - moonOut} />
            {/* moonlight glittering on the water */}
            {Array.from({ length: 10 }, (_, i) => (
              <rect key={i} x={690 + Math.sin(f / 4 + i) * 30} y={1446 + i * 5} width={60 - i * 3} height={3} fill="#e6eeff"
                opacity={(1 - moonOut) * 0.8} />
            ))}
          </svg>
          <Card top="BRIGHTEST LIGHT OF THE NIGHT" color="#cfe0ff" y={220} o={EASE_OUT(within(at.dark, 0.1, 0.3)) * (1 - moonOut)} />
          <Card top="GONE" color={ALERT} y={220} o={moonOut} />
        </AbsoluteFill>
      )}

      {/* ---------------- corals lose their calendar ---------------- */}
      {sCoral > 0.001 && (
        <AbsoluteFill style={{ opacity: sCoral, background: 'linear-gradient(#02050d 0%, #02050d 28%, #041a33 30%, #062a45 70%, #0a2c3c 100%)' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {/* moonlight through the surface */}
            {[300, 520, 760].map((x, i) => (
              <path key={x} d={`M ${x - 40} 580 L ${x + 40} 580 L ${x + 160 + i * 20} 1460 L ${x - 160} 1460 Z`} fill="#cfe0ff"
                opacity={(0.07 + 0.03 * Math.sin(f / 9 + i)) * (1 - lost)} />
            ))}
            <path d={`M 0 576 ${Array.from({ length: 28 }, (_, i) => `L ${(i + 1) * 40} ${576 + Math.sin(i * 0.8 + f / 6) * 6}`).join(' ')}`}
              stroke="#5fa8d8" strokeWidth={3} fill="none" opacity={0.7} />
            {/* the calendar they keep: spawning on the nights after a full moon */}
            <text x={540} y={200} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={34} letterSpacing={5}
              fill={lost > 0.5 ? ALERT : '#9fc8ea'}>{lost > 0.5 ? 'CALENDAR GONE' : 'THE CORAL CALENDAR'}</text>
            {Array.from({ length: 8 }, (_, i) => (
              <Phase key={i} x={100 + i * 126} y={300} r={40} k={i / 8} o={1 - 0.85 * lost} />
            ))}
            <circle cx={100 + 4 * 126} cy={300} r={54} fill="none" stroke={ROUTE} strokeWidth={5} opacity={1 - lost} />
            <text x={100 + 4 * 126} y={400} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={30} fill={ROUTE}
              opacity={1 - lost}>SPAWNING NIGHTS FOLLOW</text>
            <text x={540} y={340} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={150} fill={ALERT}
              opacity={lost}>?</text>
            {/* spawn rising from the reef */}
            {Array.from({ length: 80 }, (_, i) => {
              const r = rng(i + 70); const c = CORALS[i % 4];
              const t = ((f * 1.2 + r() * 300) % 170) / 170;
              const x = c.x + (r() - 0.5) * 120 + Math.sin(t * 6 + i) * 24;
              const y = 1300 - t * 700;
              return <circle key={i} cx={x} cy={y} r={6 + r() * 6} fill="#ff9ec7" opacity={(1 - t) * 0.95 * spawning * (1 - lost)} />;
            })}
            {/* the reef */}
            <rect x={0} y={1455} width={W} height={H - 1455} fill="#1d2a2c" />
            {DOMES.map((d) => (
              <g key={d.x}>
                <path d={`M ${d.x - d.rx} 1462 A ${d.rx} ${d.rx * 0.75} 0 0 1 ${d.x + d.rx} 1462 Z`} fill={d.color} />
                {[0.35, 0.6, 0.85].map((k) => (
                  <path key={k} d={`M ${d.x - d.rx * k} 1462 A ${d.rx * k} ${d.rx * 0.75 * k} 0 0 1 ${d.x + d.rx * k} 1462`}
                    fill="none" stroke="#00000055" strokeWidth={4} />
                ))}
              </g>
            ))}
            {CORALS.map((c) => c.lines.map(([x1, y1, x2, y2, d], j) => (
              <line key={`${c.x}-${j}`} x1={x1} y1={y1} x2={x2 + Math.sin(f / 18 + j) * (3 - d)} y2={y2} stroke={c.color}
                strokeWidth={6 + d * 5} strokeLinecap="round" />
            )))}
          </svg>
          <Card top="THEY SPAWN AFTER A FULL MOON" color="#ffc2d6" y={660} o={spawning * (1 - lost)} />
        </AbsoluteFill>
      )}

      {/* ---------------- the last total solar eclipse ---------------- */}
      {sEcl > 0.001 && (
        <AbsoluteFill style={{ opacity: sEcl, background: '#02040a' }}>
          <AbsoluteFill style={{ opacity: 1 - total, background: 'linear-gradient(#1b4a86 0%, #3f7fbf 60%, #8fbfe6 100%)' }} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <filter id="corona" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" /></filter>
            </defs>
            {NIGHT.slice(0, 160).map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#fff" opacity={s.a * total} />)}
            <g opacity={total}>
              <circle cx={540} cy={820} r={230} fill="#dfe9ff" opacity={0.35} filter="url(#corona)" />
              {Array.from({ length: 22 }, (_, i) => {
                const a = (i / 22) * Math.PI * 2 + 0.2; const len = 90 + ((i * 53) % 7) * 30;
                return <line key={i} x1={540 + Math.cos(a) * 172} y1={820 + Math.sin(a) * 172} x2={540 + Math.cos(a) * (172 + len)}
                  y2={820 + Math.sin(a) * (172 + len)} stroke="#f2f6ff" strokeWidth={14} opacity={0.6} filter="url(#corona)" />;
              })}
            </g>
            <g opacity={1 - 0.85 * total}><Sun x={540} y={820} r={170} /></g>
            <circle cx={lerp(-240, 540, cover)} cy={820} r={172} fill="#07080c" opacity={1 - eclGone} />
            <Poof x={540} y={820} r={172} t={within(at.eclipse, 0.6, 0.9)} />
          </svg>
          <Card top="TOTAL SOLAR ECLIPSE" color="#f2f6ff" y={220} o={total} />
          <Card top="NEVER AGAIN" color={ALERT} y={1250} o={eclGone} />
        </AbsoluteFill>
      )}

      {/* ---------------- why the Moon fits the Sun ---------------- */}
      {sRatio > 0.001 && (
        <AbsoluteFill style={{ opacity: sRatio }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <Sun x={880} y={1000} r={118} />
            {[-1, 1].map((s) => (
              <line key={s} x1={150} y1={1000} x2={lerp(150, 880, cone)} y2={lerp(1000, 1000 + s * 118, cone)} stroke="#ffffff"
                strokeWidth={3} strokeDasharray="10 8" opacity={0.8} />
            ))}
            <Moon id="ratio" x={350} y={1000} r={32} glow={0.3} />
            {/* the Sun's width */}
            <g opacity={wider}>
              <line x1={1035} y1={882} x2={1035} y2={1118} stroke={ROUTE} strokeWidth={5} />
              <line x1={1020} y1={882} x2={1050} y2={882} stroke={ROUTE} strokeWidth={5} />
              <line x1={1020} y1={1118} x2={1050} y2={1118} stroke={ROUTE} strokeWidth={5} />
              <line x1={395} y1={968} x2={395} y2={1032} stroke="#c9ced8" strokeWidth={4} />
            </g>
            {/* the two distances */}
            <g opacity={farther}>
              <line x1={150} y1={1190} x2={350} y2={1190} stroke="#c9ced8" strokeWidth={5} />
              <text x={250} y={1240} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={34} fill="#c9ced8">1x</text>
              <line x1={150} y1={1290} x2={880} y2={1290} stroke={ROUTE} strokeWidth={5} />
              <text x={515} y={1340} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={34} fill={ROUTE}>400x</text>
            </g>
            <circle cx={150} cy={1000} r={26} fill="#3d7fe0" stroke="#bfe0ff" strokeWidth={4} />
            <text x={150} y={1070} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={28} fill="#bfe0ff">YOU</text>
            <text x={1040} y={1170} textAnchor="end" fontFamily={SANS} fontWeight={700} fontSize={24} fill="#8b93a6">NOT TO SCALE</text>
          </svg>
          <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, fontWeight: 700,
            color: '#fff', textShadow: '0 6px 30px #000' }}>
            <div style={{ fontSize: 34, letterSpacing: 6, color: '#9fc8ea', fontFamily: SANS }}>THE SUN IS</div>
            <div style={{ fontSize: 104, opacity: Math.max(0.25, wider > 0 ? 1 : 0.25) }}>
              {wider > 0 ? Math.max(1, Math.round(400 * wider)) : '?'}x <span style={{ fontSize: 60, color: ROUTE }}>WIDER</span></div>
            <div style={{ fontSize: 104, opacity: farther > 0 ? 1 : 0.25 }}>
              {farther > 0 ? Math.max(1, Math.round(400 * farther)) : '?'}x <span style={{ fontSize: 60, color: ROUTE }}>FARTHER</span></div>
          </div>
          <Card top="SO THEY LOOK THE SAME SIZE" color={ROUTE} y={1390} o={same} />
        </AbsoluteFill>
      )}

      {/* ---------------- Earth's tilt loses its anchor ---------------- */}
      {sTilt > 0.001 && (
        <AbsoluteFill style={{ opacity: sTilt }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <ellipse cx={540} cy={950} rx={430} ry={70} fill="none" stroke="#8b93a6" strokeWidth={2} strokeDasharray="8 10"
              opacity={0.7 * (1 - anchorGone)} />
            {Math.sin(orbitA) < 0 && <Moon id="tiltB" x={540 + 430 * Math.cos(orbitA)} y={950 + 70 * Math.sin(orbitA)} r={42} o={1 - anchorGone} />}
            <path d={`M 540 950 L ${540 + 470 * Math.sin((23.4 - 11) * Math.PI / 180)} ${950 - 470 * Math.cos((23.4 - 11) * Math.PI / 180)}
              A 470 470 0 0 1 ${540 + 470 * Math.sin((23.4 + 11) * Math.PI / 180)} ${950 - 470 * Math.cos((23.4 + 11) * Math.PI / 180)} Z`}
              fill={ALERT} opacity={0.22 * wob} />
          </svg>
          <AbsoluteFill style={{ transform: `rotate(${tilt}deg)`, transformOrigin: '540px 950px' }}>
            <GlobeView id="tilt" cx={540} cy={950} R={300} lon0={spin} lat0={0} />
            <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
              <line x1={540} y1={950 - 450} x2={540} y2={950 + 450} stroke="#fff" strokeWidth={6} strokeLinecap="round" />
            </svg>
          </AbsoluteFill>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {Math.sin(orbitA) >= 0 && <Moon id="tiltF" x={540 + 430 * Math.cos(orbitA)} y={950 + 70 * Math.sin(orbitA)} r={42} o={1 - anchorGone} />}
            <Poof x={540 + 430 * Math.cos(orbitA)} y={950 + 70 * Math.sin(orbitA)} r={42} t={within(at.tilt, 0.12, 0.4)} />
          </svg>
          <Card top="THE MOON KEEPS IT STEADY" color="#cfe0ff" y={220} o={1 - anchorGone} />
          <div style={{ position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center', opacity: wob }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: 6, color: '#ffb199' }}>EARTH'S TILT COULD SWING</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 130, color: '#fff', textShadow: '0 6px 30px #000' }}>20°+</div>
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- Mars: no big moon ---------------- */}
      {sMars > 0.001 && (
        <AbsoluteFill style={{ opacity: sMars }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {/* the range its tilt has swung through */}
            <path d={`M 540 960 L ${540 + 430 * Math.sin(10 * Math.PI / 180)} ${960 - 430 * Math.cos(10 * Math.PI / 180)}
              A 430 430 0 0 1 ${540 + 430 * Math.sin(70 * Math.PI / 180)} ${960 - 430 * Math.cos(70 * Math.PI / 180)} Z`}
              fill={ALERT} opacity={0.16} stroke={ALERT} strokeWidth={3} strokeOpacity={0.5} />
            <text x={540 + 470 * Math.sin(10 * Math.PI / 180)} y={960 - 470 * Math.cos(10 * Math.PI / 180)} textAnchor="middle"
              fontFamily={MONO} fontWeight={700} fontSize={40} fill="#ffb199">10°</text>
            <text x={540 + 480 * Math.sin(70 * Math.PI / 180)} y={960 - 480 * Math.cos(70 * Math.PI / 180) + 10} textAnchor="middle"
              fontFamily={MONO} fontWeight={700} fontSize={40} fill="#ffb199">70°</text>
            <Mars x={540} y={960} r={250} tilt={mTilt} f={f} />
            {/* its two tiny moons */}
            {[[330, 0.07, 9], [420, 0.03, 6]].map(([rr, w, s], i) => {
              const a = f * w + i * 2;
              return <circle key={i} cx={540 + rr * Math.cos(a)} cy={960 + rr * 0.22 * Math.sin(a)} r={s} fill="#b9a99a"
                opacity={Math.sin(a) < 0 && Math.abs(Math.cos(a)) * rr < 250 ? 0 : 1} />;
            })}
          </svg>
          <div style={{ position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: 6, color: '#ffb199' }}>MARS: NO BIG MOON</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 120, color: '#fff', textShadow: '0 6px 30px #000' }}>
              TILT {Math.round(mTilt)}°</div>
          </div>
          <Card top="ITS TILT SWINGS 10° TO 70°" color={ALERT} y={1390} o={EASE_OUT(within(at.mars, 0.35, 0.55))} />
        </AbsoluteFill>
      )}

      {/* ---------------- the twist: it is already leaving ---------------- */}
      {sLeave > 0.001 && (
        <AbsoluteFill style={{ opacity: sLeave }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <circle cx={740} cy={1000} r={62} fill="none" stroke="#8b93a6" strokeWidth={3} strokeDasharray="8 10" opacity={drift > 0.05 ? 0.8 : 0} />
            <Arrow x1={820} y1={1100} x2={lerp(820, 920, drift)} y2={1100} color={ROUTE} w={7} o={prog(drift, 0.1, 0.3)} />
            <Moon id="leave" x={lerp(740, 900, drift)} y={1000} r={60} glow={0.5} />
            {/* a laser pulse to the Moon and back */}
            {(() => {
              const u = ((f - cue(at.leaving)) % 40) / 40; const mx = lerp(740, 900, drift) - 60;
              const x = u < 0.5 ? lerp(400, mx, u * 2) : lerp(mx, 400, (u - 0.5) * 2);
              return (
                <g>
                  <line x1={400} y1={1000} x2={mx} y2={1000} stroke="#5dff8a" strokeWidth={2} opacity={0.25} />
                  <line x1={x - 40} y1={1000} x2={x + 40} y2={1000} stroke="#5dff8a" strokeWidth={8} strokeLinecap="round" />
                  <circle cx={x} cy={1000} r={18} fill="#5dff8a" opacity={0.35} />
                </g>
              );
            })()}
          </svg>
          <GlobeView id="leave" cx={250} cy={1000} R={160} lon0={spin} lat0={12} />
          <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: 6, color: '#9fc8ea' }}>THE MOON IS ALREADY LEAVING</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 140, color: '#fff', textShadow: '0 6px 30px #000' }}>+3.8 cm</div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 44, color: ROUTE }}>EVERY YEAR</div>
          </div>
          <Card top="MEASURED BY LASER" color="#5dff8a" y={1290} o={EASE_OUT(within(at.leaving, 0.4, 0.6))} />
        </AbsoluteFill>
      )}

      {/* ---------------- loop: back to frame 0 ---------------- */}
      {loopT > 0.001 && (
        <AbsoluteFill style={{ opacity: loopT }}>{hookScene('loop', 1, 0, 60, spin0 + (END - f) * 0.6)}</AbsoluteFill>
      )}

      {/* thumbnail-style title + badge on the hook and the last frames */}
      {(() => {
        const o = Math.max(sHook, prog(f, END - 22, END - 4));
        return (
          <>
            <div style={{ position: 'absolute', top: 160, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
              fontSize: 100, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.9)', opacity: o }}>
              {hook.top}<br /><span style={{ color: ROUTE }}>{hook.bottom}</span>
            </div>
            <div style={{ position: 'absolute', top: 1380, left: 0, right: 0, textAlign: 'center', opacity: o,
              transform: `rotate(-3deg) scale(${1 + 0.04 * Math.sin(f / 5)})` }}>
              <span style={{ display: 'inline-block', background: '#ff2d2d', color: '#fff', fontFamily: SANS, fontWeight: 800,
                fontSize: 66, padding: '10px 30px', borderRadius: 18, border: '5px solid #fff' }}>{hook.badge}</span>
            </div>
          </>
        );
      })()}

      <EndCard from={cue(last)} to={END - 14} text="" compact />
      <Captions lines={vo} y={1560} accent={ROUTE} maxWords={3} size={58} plate />
    </AbsoluteFill>
  );
};

export default MoonGone;
