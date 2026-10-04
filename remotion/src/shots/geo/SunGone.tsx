import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { Card, Sun } from './BlackHole';
import { EndCard } from './EndCard';
import { GlobeView, SpaceBg } from './Globe';
import { H, MONO, ROUTE, SANS, W, lerp } from './parts';

// =============================================================================
// "What if the Sun disappeared?" - the Sun vanishes, but the darkness has to
// travel: a black light-front spreads out from where it was and reaches Earth
// 8 min 20 s later (and gravity's change arrives with it). Then night, the
// straight-line escape at ~30 km/s, frost, and a rogue planet in the dark.
// The script and its sources live in make_sungone.py.
// =============================================================================
export const compositionConfig = {
  id: 'SunGone',
  durationInSeconds: 36,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string };
  at: { delay: number; why: number; dark: number; fly: number; plants: number; cold: number; rogue: number; safe: number };
  durationInSeconds: number;
};

const Leaf: React.FC<{ x: number; y: number; dead: number }> = ({ x, y, dead }) => {
  const c = `rgb(${lerp(70, 120, dead)}, ${lerp(190, 105, dead)}, ${lerp(80, 80, dead)})`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${-20 + 35 * dead})`}>
      <path d="M 0 0 C 120 -40 220 -200 230 -330 C 90 -300 -20 -170 0 0 Z" fill={c} />
      <path d="M 0 0 C 70 -110 140 -220 230 -330" stroke="rgba(0,0,0,0.25)" strokeWidth={8} fill="none" />
      <line x1={0} y1={0} x2={-60} y2={90} stroke={c} strokeWidth={14} strokeLinecap="round" />
    </g>
  );
};

const SunGone: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '' }, at, durationInSeconds = 36 }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const span = (a: number, b: number) => prog(f, cue(a) - 6, cue(a) + 8) * (1 - prog(f, cue(b) - 8, cue(b) + 6));
  const last = vo.length - 1;
  const spin0 = 20;
  const spin = spin0 - f * 0.8;

  // ---- the orbit picture (delay, why, dark, fly)
  const sunX = 250; const sunY = 900;
  const orbitR = 470;
  const ang = -0.12;
  const ex0 = sunX + orbitR * Math.cos(ang);
  const ey0 = sunY + orbitR * Math.sin(ang);
  const vanish = EASE_OUT(within(at.delay, 0.05, 0.3));            // the Sun is gone
  const front = prog(f, cue(at.delay) + 6, cue(at.dark));           // darkness travelling at light speed
  const frontR = front * orbitR;
  const clockSecs = Math.max(0, Math.round(500 * (1 - front)));    // 8 min 20 s = 500 s
  const clock = `${String(Math.floor(clockSecs / 60)).padStart(2, '0')}:${String(clockSecs % 60).padStart(2, '0')}`;
  const dark = f >= cue(at.dark) ? EASE_OUT(within(at.dark, 0, 0.35)) : 0;
  const flyT = f >= cue(at.fly) ? EASE_INOUT(within(at.fly, 0.1, 1)) : 0;
  // escape along the tangent (orbit runs anticlockwise, so the tangent points up)
  const ex = ex0 + flyT * 220;
  const ey = ey0 - flyT * 980;
  const sOrbit = span(at.delay, at.plants);

  // ---- close-ups
  const sHook = 1 - prog(f, cue(at.delay) - 6, cue(at.delay) + 8);
  const sPlants = span(at.plants, at.cold);
  const sCold = span(at.cold, at.rogue);
  const sRogue = span(at.rogue, at.safe);
  const sSafe = span(at.safe, last);
  const loopT = EASE_INOUT(prog(f, cue(last), END - 4));
  const frost = EASE_INOUT(within(at.cold, 0.05, 0.95));

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      {/* ---------------- hook: the lit Earth, the Sun just out of frame ---------------- */}
      {sHook > 0.001 && (
        <AbsoluteFill style={{ opacity: sHook }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}><Sun x={-60} y={330} r={150} /></svg>
          <GlobeView id="hook" cx={560} cy={1060} R={430} lon0={spin} lat0={12} />
        </AbsoluteFill>
      )}

      {/* ---------------- the orbit: the Sun vanishes, the dark spreads, Earth escapes ---------------- */}
      {sOrbit > 0.001 && (
        <AbsoluteFill style={{ opacity: sOrbit }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {/* sunlight still on its way: warm outside the front, black inside */}
            <defs>
              <radialGradient id="warm" cx={sunX} cy={sunY} r={1400} gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#ffb347" stopOpacity={0.22} /><stop offset="1" stopColor="#ffb347" stopOpacity={0} />
              </radialGradient>
            </defs>
            <rect x={0} y={0} width={W} height={H} fill="url(#warm)" opacity={1 - dark} />
            {front > 0 && <circle cx={sunX} cy={sunY} r={frontR} fill="#000" opacity={0.85 * (1 - 0.7 * flyT)} />}
            {front > 0 && front < 1 && (
              <circle cx={sunX} cy={sunY} r={frontR} fill="none" stroke="#9fd0ff" strokeWidth={3} strokeDasharray="8 10" opacity={0.8} />
            )}
            <circle cx={sunX} cy={sunY} r={orbitR} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={3} strokeDasharray="10 12" />
            <g opacity={1 - vanish} transform={`translate(${sunX} ${sunY}) scale(${1 + vanish * 0.6}) translate(${-sunX} ${-sunY})`}>
              <Sun x={sunX} y={sunY} r={70} />
            </g>
            {/* the Moon, beside Earth, lit only by sunlight */}
            <circle cx={ex + 95} cy={ey - 40} r={16} fill={`rgb(${lerp(220, 40, dark)}, ${lerp(220, 42, dark)}, ${lerp(215, 48, dark)})`} />
            {flyT > 0 && (
              <line x1={ex0} y1={ey0} x2={ex} y2={ey} stroke={ROUTE} strokeWidth={4} strokeDasharray="10 10" opacity={0.8} />
            )}
          </svg>
          <GlobeView id="orbit" cx={ex} cy={ey} R={60} lon0={spin} lat0={12} overlay={{ night: dark }} />
          {f < cue(at.dark) + 20 && (
            <div style={{ position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center',
              opacity: prog(f, cue(at.delay), cue(at.delay) + 10) * (1 - prog(f, cue(at.dark) + 4, cue(at.dark) + 20)) }}>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 6, color: '#ffb199' }}>EARTH STILL SEES IT FOR</div>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 140, color: '#fff', textShadow: '0 6px 30px #000' }}>{clock}</div>
            </div>
          )}
          <Card top="GRAVITY WAITS TOO" sub="it travels at the speed of light"
            o={f >= cue(at.why) ? EASE_OUT(within(at.why, 0.35, 0.6)) * (1 - prog(f, cue(at.dark) - 6, cue(at.dark))) : 0} y={1300} />
          <Card top="LIGHTS OUT" o={f >= cue(at.dark) ? EASE_OUT(within(at.dark, 0.2, 0.45)) * (1 - prog(f, cue(at.fly) - 6, cue(at.fly))) : 0} y={260} />
          <Card top="30 km EVERY SECOND" sub="in a straight line, forever" color={ROUTE}
            o={f >= cue(at.fly) ? EASE_OUT(within(at.fly, 0.3, 0.55)) : 0} y={1300} />
        </AbsoluteFill>
      )}

      {/* ---------------- plants ---------------- */}
      {sPlants > 0.001 && (
        <AbsoluteFill style={{ opacity: sPlants, background: 'radial-gradient(ellipse at 50% 55%, #10202a 0%, #03070b 70%)' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <Leaf x={420} y={1180} dead={EASE_INOUT(within(at.plants, 0.2, 0.9))} />
          </svg>
          <Card top="PHOTOSYNTHESIS STOPS" sub="no light, no food" o={EASE_OUT(within(at.plants, 0.15, 0.4))} />
        </AbsoluteFill>
      )}

      {/* ---------------- the freeze ---------------- */}
      {sCold > 0.001 && (
        <AbsoluteFill style={{ opacity: sCold }}>
          <SpaceBg />
          <GlobeView id="cold" cx={540} cy={1000} R={460} lon0={spin} lat0={20} overlay={{ night: 0.55, frost }} />
          <Card top="COLDER EVERY DAY" color="#9fd0ff" o={EASE_OUT(within(at.cold, 0.2, 0.45))} />
        </AbsoluteFill>
      )}

      {/* ---------------- rogue planet ---------------- */}
      {sRogue > 0.001 && (
        <AbsoluteFill style={{ opacity: sRogue }}>
          <SpaceBg />
          <GlobeView id="rogue" cx={lerp(820, 300, within(at.rogue, 0, 1))} cy={lerp(1150, 760, within(at.rogue, 0, 1))} R={170}
            lon0={spin} lat0={20} overlay={{ night: 0.85, frost: 1 }} />
          <Card top="A ROGUE PLANET" sub="no star, drifting through the dark" color="#b07cff" o={EASE_OUT(within(at.rogue, 0.25, 0.5))} y={1330} />
        </AbsoluteFill>
      )}

      {/* ---------------- relief ---------------- */}
      {sSafe > 0.001 && (
        <AbsoluteFill style={{ opacity: sSafe }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}><Sun x={-60} y={330} r={150} /></svg>
          <GlobeView id="safe" cx={560} cy={1060} R={430} lon0={spin} lat0={12} />
          <Card top="BILLIONS OF YEARS LEFT" o={EASE_OUT(within(at.safe, 0.2, 0.45))} y={300} />
        </AbsoluteFill>
      )}

      {/* ---------------- loop: back to frame 0 ---------------- */}
      {loopT > 0.001 && (
        <AbsoluteFill style={{ opacity: loopT }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}><Sun x={-60} y={330} r={150} /></svg>
          <GlobeView id="loop" cx={560} cy={1060} R={430} lon0={spin0 + (END - f) * 0.8} lat0={12} />
        </AbsoluteFill>
      )}

      {/* thumbnail-style title on the hook and the last frames */}
      <div style={{
        position: 'absolute', top: 170, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
        fontSize: 116, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.9)',
        opacity: Math.max(sHook, prog(f, END - 22, END - 4)),
      }}>
        {hook.top}<br /><span style={{ color: ROUTE }}>{hook.bottom}</span>
      </div>

      <EndCard from={cue(last)} to={END - 14} text="" compact />
      <Captions lines={vo} y={1560} accent={ROUTE} maxWords={3} size={58} plate />
    </AbsoluteFill>
  );
};

export default SunGone;
