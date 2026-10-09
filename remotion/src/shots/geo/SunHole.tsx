import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { Card, LensedStars, Shadow, Sun } from './BlackHole';
import { EndCard } from './EndCard';
import { GlobeView } from './Globe';
import { ALERT, H, MONO, ROUTE, SANS, W, lerp } from './parts';

// =============================================================================
// "What if the Sun became a black hole?" The Sun collapses - and Earth keeps its
// orbit (same mass, same pull from afar); the Sun shrinks 1.39 million km -> 6 km
// (a walk of about an hour); it is invisible, lensing the stars around it; get
// close and you are stretched like spaghetti; and the real Sun is too light - it
// will swell, shed its shell and end as a white dwarf. Black-hole lensing and
// shadow come from BlackHole.tsx. Script and sources: make_whatif.py "sunhole".
// =============================================================================
export const compositionConfig = {
  id: 'SunHole',
  durationInSeconds: 40,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string; badge: string };
  at: { same: number; orbit: number; shrink: number; tiny: number; dark: number; spaghetti: number; relax: number; dwarf: number };
  durationInSeconds: number;
};

const SPACE = 'radial-gradient(ellipse at 50% 40%, #0a1430 0%, #03060f 55%, #000 100%)';

const Bar: React.FC<{ y: number; label: string; color: string; fill: number }> = ({ y, label, color, fill }) => (
  <g>
    <text x={540} y={y - 16} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={32} letterSpacing={3} fill={color}>{label}</text>
    <rect x={190} y={y} width={700} height={40} rx={10} fill="#1d2433" />
    <rect x={190} y={y} width={700 * fill} height={40} rx={10} fill={color} />
  </g>
);

// a little astronaut, stretched (sy) and squeezed (sx) by the tide
const Astronaut: React.FC<{ x: number; y: number; s: number; sx: number; sy: number; rot: number }> = ({ x, y, s, sx, sy, rot }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * sx} ${s * sy})`}>
    <rect x={-22} y={-10} width={44} height={60} rx={16} fill="#f2f4f8" />
    <rect x={-34} y={-4} width={14} height={44} rx={7} fill="#e3e7ee" />
    <rect x={20} y={-4} width={14} height={44} rx={7} fill="#e3e7ee" />
    <rect x={-18} y={46} width={15} height={40} rx={7} fill="#e3e7ee" />
    <rect x={3} y={46} width={15} height={40} rx={7} fill="#e3e7ee" />
    <circle cx={0} cy={-30} r={26} fill="#f2f4f8" />
    <ellipse cx={4} cy={-30} rx={17} ry={13} fill="#1b2a44" />
    <ellipse cx={9} cy={-34} rx={5} ry={3} fill="#9fd0ff" opacity={0.8} />
    <rect x={-14} y={6} width={28} height={16} rx={4} fill="#ff6b3d" />
  </g>
);

const Walker: React.FC<{ x: number; y: number; f: number }> = ({ x, y, f }) => {
  const sw = Math.sin(f / 3) * 22;
  return (
    <g transform={`translate(${x} ${y})`} stroke="#fff" strokeWidth={7} strokeLinecap="round" fill="none">
      <circle cx={0} cy={-78} r={12} fill="#fff" />
      <line x1={0} y1={-64} x2={0} y2={-26} />
      <line x1={0} y1={-56} x2={sw * 0.6} y2={-36} /><line x1={0} y1={-56} x2={-sw * 0.6} y2={-36} />
      <line x1={0} y1={-26} x2={sw * 0.7} y2={0} /><line x1={0} y1={-26} x2={-sw * 0.7} y2={0} />
    </g>
  );
};

const SunHole: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '', badge: '' }, at, durationInSeconds = 40 }) => {
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

  // ---- hook: the Sun collapses into a black hole near the end of the line
  const sHook = 1 - prog(f, cue(at.same) - 6, cue(at.same) + 8);
  const collapse = EASE_INOUT(within(0, 0.55, 0.85));
  const hookScene = (key: string, c: number, lon: number) => (
    <>
      <AbsoluteFill style={{ background: SPACE }} />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <LensedStars lx={300} ly={600} tE={110 * prog(c, 0.7, 1)} o={1} />
        {c < 0.95 && <g transform={`translate(300 600) scale(${1 - c * 0.97}) translate(-300 -600)`}><Sun x={300} y={600} r={170} /></g>}
        <Shadow x={300} y={600} r={48} o={prog(c, 0.75, 1)} />
      </svg>
      <GlobeView id={key} cx={640} cy={1180} R={330} lon0={lon} lat0={12} />
    </>
  );

  // ---- same mass, same pull: the orbit diagram
  const sOrbit = span(at.same, at.shrink);
  const morph = EASE_INOUT(within(at.same, 0.3, 0.6));
  const bars = EASE_OUT(within(at.same, 0.15, 0.45));
  const ang = (f - cue(at.same)) / 22 - 1.2;
  const ox = 540; const oy = 1000; const oR = 330;
  const ex = ox + oR * Math.cos(ang); const ey = oy + oR * Math.sin(ang);
  const trail = EASE_OUT(within(at.orbit, 0, 0.6));

  // ---- 1.39 million km -> 6 km
  const sShrink = span(at.shrink, at.dark);
  const shrinkT = EASE_INOUT(within(at.shrink, 0.05, 1));
  const km = 1391400 * Math.pow(6 / 1391400, shrinkT);
  const sunR = 1000 * Math.pow(0.006, shrinkT);
  const tinyT = f >= cue(at.tiny) ? 1 : 0;
  const walk = EASE_INOUT(within(at.tiny, 0.3, 1));
  const holeIn = EASE_OUT(within(at.tiny, 0, 0.3));

  // ---- invisible, lensing
  const sDark = span(at.dark, at.relax);
  const tE = 260;
  const fall = EASE_INOUT(within(at.spaghetti, 0, 1));
  const ast = f >= cue(at.spaghetti) ? 1 : 0;

  // ---- the real Sun: too light; red giant -> white dwarf
  const sRelax = span(at.relax, last);
  const swell = EASE_INOUT(within(at.dwarf, 0, 0.4));
  const shed = EASE_OUT(within(at.dwarf, 0.4, 0.85));
  const loopT = EASE_INOUT(prog(f, cue(last), END - 4));

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      {/* ---------------- hook ---------------- */}
      {sHook > 0.001 && <AbsoluteFill style={{ opacity: sHook }}>{hookScene('hook', collapse, spin)}</AbsoluteFill>}

      {/* ---------------- same mass, same pull ---------------- */}
      {sOrbit > 0.001 && (
        <AbsoluteFill style={{ opacity: sOrbit }}>
          <AbsoluteFill style={{ background: SPACE }} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <LensedStars lx={ox} ly={oy} tE={70 * morph} o={1} />
            <circle cx={ox} cy={oy} r={oR} fill="none" stroke="#5f6b85" strokeWidth={3} strokeDasharray="10 12" />
            {trail > 0 && (
              <path d={`M ${ox + oR * Math.cos(ang - 2.6 * trail)} ${oy + oR * Math.sin(ang - 2.6 * trail)}
                A ${oR} ${oR} 0 ${2.6 * trail > Math.PI ? 1 : 0} 1 ${ex} ${ey}`} fill="none" stroke={ROUTE} strokeWidth={8} strokeLinecap="round" />
            )}
            {morph < 0.98 && <g transform={`translate(${ox} ${oy}) scale(${1 - morph * 0.85}) translate(${-ox} ${-oy})`}><Sun x={ox} y={oy} r={95} /></g>}
            <Shadow x={ox} y={oy} r={30} o={morph} />
            {/* the pull on Earth: same arrow before and after */}
            <line x1={ex} y1={ey} x2={lerp(ex, ox, 0.42)} y2={lerp(ey, oy, 0.42)} stroke="#9fd0ff" strokeWidth={8} strokeLinecap="round" />
            <circle cx={lerp(ex, ox, 0.42)} cy={lerp(ey, oy, 0.42)} r={10} fill="#9fd0ff" />
            <g opacity={bars}>
              <Bar y={300} label="PULL OF THE SUN" color={ROUTE} fill={bars} />
              <Bar y={420} label="PULL OF A SAME-MASS BLACK HOLE" color="#9fd0ff" fill={bars * morph} />
            </g>
          </svg>
          <GlobeView id="orbit" cx={ex} cy={ey} R={58} lon0={spin} lat0={12} />
          <Card top="SAME ORBIT · SAME YEAR" color={ROUTE} y={1400} o={EASE_OUT(within(at.orbit, 0.2, 0.45))} />
        </AbsoluteFill>
      )}

      {/* ---------------- 1.39 million km -> 6 km ---------------- */}
      {sShrink > 0.001 && (
        <AbsoluteFill style={{ opacity: sShrink }}>
          <AbsoluteFill style={{ background: SPACE }} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <LensedStars lx={540} ly={900} tE={tinyT ? 260 * holeIn : 0} o={1} />
            {!tinyT && sunR > 1 && <Sun x={540} y={900} r={sunR} />}
            {!tinyT && sunR <= 1 && <circle cx={540} cy={900} r={2} fill="#fff" />}
            <Shadow x={540} y={900} r={120} o={holeIn} />
            {tinyT > 0 && (
              <g opacity={holeIn}>
                <line x1={420} y1={1130} x2={660} y2={1130} stroke={ROUTE} strokeWidth={6} />
                <line x1={420} y1={1112} x2={420} y2={1148} stroke={ROUTE} strokeWidth={6} />
                <line x1={660} y1={1112} x2={660} y2={1148} stroke={ROUTE} strokeWidth={6} />
                <text x={540} y={1100} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={44} fill={ROUTE}>6 km</text>
                <rect x={140} y={1320} width={800} height={10} rx={5} fill="#3a4357" />
                <rect x={140} y={1320} width={800 * walk} height={10} rx={5} fill={ROUTE} />
                <Walker x={140 + 800 * walk} y={1312} f={f} />
                <text x={540} y={1390} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={34} fill="#cfe6ff">
                  ON FOOT: {Math.round(60 * walk)} MIN</text>
              </g>
            )}
          </svg>
          <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: 6, color: '#ffb199' }}>
              {tinyT ? 'THE WHOLE SUN, CRUSHED' : 'THE SUN, SHRINKING'}</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 120, color: '#fff', textShadow: '0 6px 30px #000' }}>
              {tinyT ? '6' : Math.round(km).toLocaleString('en-US')} km</div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 36, color: ROUTE }}>WIDE</div>
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- invisible, and spaghetti ---------------- */}
      {sDark > 0.001 && (
        <AbsoluteFill style={{ opacity: sDark }}>
          <AbsoluteFill style={{ background: SPACE }} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <LensedStars lx={540} ly={1000} tE={tE} o={1} />
            {/* light falling in and never coming out */}
            {!ast && Array.from({ length: 6 }, (_, i) => {
              const t = ((f * 0.02 + i / 6) % 1);
              const a = i * 1.05 + 0.4; const d = lerp(560, 110, t);
              return <line key={i} x1={540 + Math.cos(a) * d} y1={1000 + Math.sin(a) * d} x2={540 + Math.cos(a) * (d + 90)}
                y2={1000 + Math.sin(a) * (d + 90)} stroke={ROUTE} strokeWidth={6} strokeLinecap="round" opacity={(1 - t) * 0.9} />;
            })}
            <Shadow x={540} y={1000} r={120} o={1} />
            {ast > 0 && (
              <Astronaut x={lerp(880, 650, fall)} y={lerp(380, 640, fall)} s={1.6} sx={lerp(1, 0.4, fall)} sy={lerp(1, 3, fall)}
                rot={lerp(-20, 38, fall)} />
            )}
          </svg>
          {!ast && <Card top="INVISIBLE" sub="not even light escapes" color="#cfe6ff" y={220} o={EASE_OUT(within(at.dark, 0.15, 0.4))} />}
          {ast > 0 && <Card top="SPAGHETTIFICATION" sub="stretched by the difference in gravity" color={ALERT} y={220}
            o={EASE_OUT(within(at.spaghetti, 0.15, 0.4))} />}
        </AbsoluteFill>
      )}

      {/* ---------------- the real Sun: too light; it ends as a white dwarf ---------------- */}
      {sRelax > 0.001 && (
        <AbsoluteFill style={{ opacity: sRelax }}>
          <AbsoluteFill style={{ background: SPACE }} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <LensedStars lx={-9999} ly={0} tE={0} o={1} />
            <defs>
              <radialGradient id="giant" cx="0.45" cy="0.42" r="0.6">
                <stop offset="0" stopColor="#ffb07a" /><stop offset="0.7" stopColor="#e2502a" /><stop offset="1" stopColor="#8e1d10" />
              </radialGradient>
              <radialGradient id="dwarf" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor="#ffffff" /><stop offset="0.25" stopColor="#dfe9ff" /><stop offset="1" stopColor="#7aa8ff" stopOpacity={0} />
              </radialGradient>
            </defs>
            {f < cue(at.dwarf) && (
              <>
                <Sun x={540} y={950} r={220} />
                <g opacity={EASE_OUT(within(at.relax, 0.3, 0.55))}>
                  <circle cx={880} cy={560} r={70} fill="#000" stroke="#ffb35c" strokeWidth={4} />
                  <line x1={820} y1={500} x2={940} y2={620} stroke={ALERT} strokeWidth={14} strokeLinecap="round" />
                  <line x1={940} y1={500} x2={820} y2={620} stroke={ALERT} strokeWidth={14} strokeLinecap="round" />
                </g>
              </>
            )}
            {f >= cue(at.dwarf) && (
              <>
                {shed < 1 && <circle cx={540} cy={950} r={lerp(220, 420, swell)} fill="url(#giant)" opacity={1 - shed} />}
                <circle cx={540} cy={950} r={lerp(420, 640, shed)} fill="none" stroke="#ff8a5c" strokeWidth={lerp(40, 4, shed)}
                  opacity={shed * (1 - shed) * 2.4} />
                <circle cx={540} cy={950} r={70} fill="url(#dwarf)" opacity={shed} />
                <circle cx={540} cy={950} r={14} fill="#fff" opacity={shed} />
              </>
            )}
          </svg>
          {f < cue(at.dwarf) && <Card top="NOT ENOUGH MASS" sub="to ever become a black hole" color={ROUTE} y={1350}
            o={EASE_OUT(within(at.relax, 0.2, 0.45))} />}
          {f >= cue(at.dwarf) && (
            <div style={{ position: 'absolute', top: 220, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
              fontSize: 64, lineHeight: 1.25, textShadow: '0 6px 26px #000' }}>
              <span style={{ color: '#ffd34d' }}>SUN</span> <span style={{ color: '#fff', opacity: swell }}>→</span>{' '}
              <span style={{ color: '#ff6b3d', opacity: swell }}>RED GIANT</span><br />
              <span style={{ color: '#fff', opacity: shed }}>→ </span><span style={{ color: '#dfe9ff', opacity: shed }}>WHITE DWARF</span>
            </div>
          )}
        </AbsoluteFill>
      )}

      {/* ---------------- loop: back to frame 0 ---------------- */}
      {loopT > 0.001 && <AbsoluteFill style={{ opacity: loopT }}>{hookScene('loop', 0, spin0 + (END - f) * 0.6)}</AbsoluteFill>}

      {(() => {
        const o = Math.max(sHook, prog(f, END - 22, END - 4));
        return (
          <>
            <div style={{ position: 'absolute', top: 160, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
              fontSize: 92, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.9)', opacity: o }}>
              {hook.top}<br /><span style={{ color: ROUTE }}>{hook.bottom}</span>
            </div>
            <div style={{ position: 'absolute', top: 1400, left: 0, right: 0, textAlign: 'center', opacity: o,
              transform: `rotate(-3deg) scale(${1 + 0.04 * Math.sin(f / 5)})` }}>
              <span style={{ display: 'inline-block', background: '#ff2d2d', color: '#fff', fontFamily: SANS, fontWeight: 800,
                fontSize: 62, padding: '10px 30px', borderRadius: 18, border: '5px solid #fff' }}>{hook.badge}</span>
            </div>
          </>
        );
      })()}

      <EndCard from={cue(last)} to={END - 14} text="" compact />
      <Captions lines={vo} y={1560} accent={ROUTE} maxWords={3} size={58} plate />
    </AbsoluteFill>
  );
};

export default SunHole;
