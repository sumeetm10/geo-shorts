import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { Card, Sun } from './BlackHole';
import { EndCard } from './EndCard';
import { GlobeView, SpaceBg } from './Globe';
import { H, MONO, ROUTE, SANS, W, lerp, ridge, rng } from './parts';

// =============================================================================
// "What if the Sun vanished?" (v2, built for curiosity). The Sun goes out but
// its last light is still on the way: a stream of light keeps flowing to Earth
// with a countdown; then darkness and real city lights (Natural Earth's 3,000
// biggest places); Earth racing off; a night sky where the stars stay and the
// planets go out one by one; deep-sea vent life carrying on; rogue planets.
// The script, its numbers and sources live in make_sungone.py.
// =============================================================================
export const compositionConfig = {
  id: 'SunGone',
  durationInSeconds: 40,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string; badge: string };
  at: { light: number; dark: number; fly: number; cross: number; stars: number; planets: number; vents: number; rogue: number };
  durationInSeconds: number;
};

const SKY = (() => {
  const r = rng(909);
  const stars = Array.from({ length: 700 }, () => {
    // denser along a tilted band: the Milky Way
    const t = r(); const off = (r() - 0.5) * (r() < 0.6 ? 260 : 1600);
    const x = t * W * 1.4 - W * 0.2; const y = 200 + t * 900 + off;
    return { x, y, s: 0.4 + r() * 1.6, a: 0.25 + r() * 0.75, p: r() * 6 };
  });
  return stars;
})();
const PLANETS = [
  { name: 'VENUS', x: 250, y: 1020, r: 9, color: '#fff6d8', when: 0.12, note: 'minutes' },
  { name: 'MARS', x: 760, y: 780, r: 6, color: '#ffb08a', when: 0.25, note: 'minutes' },
  { name: 'JUPITER', x: 470, y: 520, r: 8, color: '#ffe9c2', when: 0.55, note: '1 HOUR+' },
  { name: 'SATURN', x: 860, y: 420, r: 7, color: '#ffe0a0', when: 0.9, note: '2 HOURS+' },
];

const Horizon: React.FC = () => {
  const R = React.useMemo(() => ridge(301), []);
  const R2 = React.useMemo(() => ridge(77), []);
  const pts = (rr: [number, number][], base: number, hgt: number, x0: number, w: number) =>
    rr.map(([x, h]) => `${x0 + x * w},${base - h * hgt}`).join(' L ');
  return (
    <g>
      <path d={`M ${pts(R2, 1500, 260, -200, 900)} L 700 2000 L -200 2000 Z`} fill="#0c1220" stroke="#3a4f78" strokeWidth={2} />
      <path d={`M ${pts(R, 1520, 330, 380, 900)} L 1280 2000 L 380 2000 Z`} fill="#080d16" stroke="#2f4266" strokeWidth={2} />
      <rect x={0} y={1500} width={W} height={H - 1500} fill="#05080d" />
    </g>
  );
};

const Vent: React.FC<{ f: number }> = ({ f }) => {
  const plume = Array.from({ length: 22 }, (_, i) => {
    const t = ((f * 0.9 + i * 13) % 140) / 140;
    return { x: 540 + Math.sin(i * 2.1 + f / 20) * (20 + t * 140), y: 1180 - t * 900, r: 26 + t * 120, o: (1 - t) * 0.5 };
  });
  return (
    <g>
      <defs>
        <radialGradient id="ventGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff8a3d" stopOpacity={0.7} /><stop offset="1" stopColor="#ff8a3d" stopOpacity={0} />
        </radialGradient>
      </defs>
      {plume.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#1b1d22" opacity={p.o} />)}
      <circle cx={540} cy={1210} r={170} fill="url(#ventGlow)" />
      <path d="M 470 1480 L 500 1250 L 520 1200 L 560 1200 L 578 1250 L 610 1480 Z" fill="#2a2420" />
      <path d="M 505 1230 L 575 1230" stroke="#ff9a4d" strokeWidth={6} opacity={0.8} />
      {/* tube worms: white tubes, red plumes, swaying */}
      {Array.from({ length: 16 }, (_, i) => {
        const bx = 330 + i * 28 + (i > 7 ? 120 : 0);
        const sway = Math.sin(f / 14 + i) * 10;
        const h = 90 + (i % 5) * 26;
        return (
          <g key={i}>
            <path d={`M ${bx} 1490 Q ${bx + sway / 2} ${1490 - h / 2} ${bx + sway} ${1490 - h}`} stroke="#e9e4da" strokeWidth={9}
              fill="none" strokeLinecap="round" />
            <circle cx={bx + sway} cy={1490 - h - 8} r={11} fill="#e0312a" />
          </g>
        );
      })}
      <rect x={0} y={1480} width={W} height={H - 1480} fill="#15110e" />
    </g>
  );
};

const SunGone: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '', badge: '' }, at, durationInSeconds = 40 }) => {
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

  // ---- hook: the Sun blinks out at the end of the hook - but Earth stays lit
  const sunOff = EASE_OUT(prog(f, cue(at.light) - 18, cue(at.light) - 2));
  const sHook = 1 - prog(f, cue(at.light) - 2, cue(at.light) + 10);

  // ---- the last light travelling (light, dark)
  const sunX = 120; const sunY = 960; const ex = 820; const ey = 960;
  const travel = prog(f, cue(at.light) + 4, cue(at.dark) + 6);       // 0 -> 1 over 8 min 20 s
  const tail = sunX + (ex - sunX) * travel;
  const secs = Math.max(0, Math.round(500 * (1 - travel)));
  const clock = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  const darkness = f >= cue(at.dark) ? EASE_OUT(within(at.dark, 0.05, 0.35)) : 0;
  const lightsOn = f >= cue(at.dark) ? EASE_OUT(within(at.dark, 0.3, 0.8)) : 0;
  const sLight = span(at.light, at.fly);

  // ---- escape and crossing
  const sFly = span(at.fly, at.cross);
  const sCross = span(at.cross, at.stars);
  const cross = EASE_INOUT(within(at.cross, 0.15, 0.85));

  // ---- night sky
  const sSky = span(at.stars, at.vents);
  const skyClock = within(at.planets, 0.05, 0.95);                 // 0 -> 2.5 h on the clock
  const clockMin = Math.round(skyClock * 150);
  const sVents = span(at.vents, at.rogue);
  const sRogue = span(at.rogue, last);
  const loopT = EASE_INOUT(prog(f, cue(last), END - 4));

  const streak = (n: number, len: number, o: number) => Array.from({ length: n }, (_, i) => {
    const r = rng(i + 5); const y = r() * H; const x = ((r() * W * 2 - f * 40 * (0.5 + r())) % (W + len) + W + len) % (W + len) - len;
    return <line key={i} x1={x} y1={y} x2={x + len} y2={y} stroke="#cfe6ff" strokeWidth={1.2 + r() * 1.5} opacity={o * (0.2 + r() * 0.4)} />;
  });

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      {/* ---------------- hook ---------------- */}
      {sHook > 0.001 && (
        <AbsoluteFill style={{ opacity: sHook }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <g opacity={1 - sunOff}><Sun x={-40} y={340} r={160} /></g>
          </svg>
          <GlobeView id="hook" cx={570} cy={1080} R={440} lon0={spin} lat0={12} />
        </AbsoluteFill>
      )}

      {/* ---------------- the last light still travelling ---------------- */}
      {sLight > 0.001 && (
        <AbsoluteFill style={{ opacity: sLight }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <linearGradient id="beamG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffb347" stopOpacity={0} /><stop offset="0.5" stopColor="#ffd27a" stopOpacity={0.8} />
                <stop offset="1" stopColor="#ffb347" stopOpacity={0} />
              </linearGradient>
            </defs>
            {/* where the Sun was */}
            <circle cx={sunX} cy={sunY} r={70} fill="none" stroke="rgba(255,190,90,0.35)" strokeWidth={3} strokeDasharray="6 8" />
            {/* the beam: only the part not yet arrived is lit */}
            {travel < 1 && (
              <>
                <rect x={tail} y={sunY - 70} width={Math.max(0, ex - 200 - tail)} height={140} fill="url(#beamG)" opacity={0.55} />
                {Array.from({ length: 140 }, (_, i) => {
                  const u = ((i / 140) + f * 0.012) % 1;
                  const x = tail + (ex - 190 - tail) * u;
                  const y = sunY + Math.sin(i * 1.7) * 62;
                  return <circle key={i} cx={x} cy={y} r={3 + (i % 4)} fill="#fff1c2" opacity={0.85} />;
                })}
              </>
            )}
            {travel < 1 && (
              <>
                <line x1={tail} y1={sunY - 60} x2={tail} y2={sunY + 60} stroke="#ffe14d" strokeWidth={4} />
                <text x={tail} y={sunY - 80} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={32} fill="#ffe14d">LAST LIGHT</text>
                {/* gravity's change rides along at the same speed */}
                <circle cx={sunX} cy={sunY} r={tail - sunX} fill="none" stroke="#9fd0ff" strokeWidth={2} strokeDasharray="4 10" opacity={0.7} />
              </>
            )}
          </svg>
          <GlobeView id="light" cx={ex} cy={ey} R={190} lon0={spin} lat0={12} overlay={{ night: darkness }} lights={lightsOn} />
          <div style={{ position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 6, color: '#ffb199' }}>
              {travel < 1 ? 'DAYLIGHT LEFT ON EARTH' : 'DARKNESS'}</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 150, color: travel < 1 ? '#fff' : '#ff6b6b',
              textShadow: '0 6px 30px #000' }}>{clock}</div>
          </div>
          <Card top="GRAVITY WAITS TOO" sub="it travels at the speed of light" y={1250}
            o={EASE_OUT(within(at.light, 0.45, 0.7)) * (1 - prog(f, cue(at.dark) - 6, cue(at.dark)))} />
          <Card top="NIGHT EVERYWHERE" color="#ffb347" y={1250} o={lightsOn * (1 - prog(f, cue(at.fly) - 6, cue(at.fly)))} />
        </AbsoluteFill>
      )}

      {/* ---------------- Earth races off ---------------- */}
      {sFly > 0.001 && (
        <AbsoluteFill style={{ opacity: sFly }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>{streak(70, 220, 1)}</svg>
          <GlobeView id="fly" cx={540} cy={1000} R={360} lon0={spin} lat0={12} overlay={{ night: 1 }} lights={1} />
          <div style={{ position: 'absolute', top: 220, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 120, color: '#fff', textShadow: '0 6px 30px #000' }}>29.78 km/s</div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, color: ROUTE, letterSpacing: 2 }}>IN A STRAIGHT LINE</div>
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- one planet-width in 7 minutes ---------------- */}
      {sCross > 0.001 && (
        <AbsoluteFill style={{ opacity: sCross }}>
          <SpaceBg />
          <GlobeView id="cross" cx={540} cy={1000} R={400} lon0={spin} lat0={12} overlay={{ night: 1 }} lights={1} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <line x1={140} y1={1000} x2={140 + 800 * cross} y2={1000} stroke={ROUTE} strokeWidth={8} strokeLinecap="round" />
            <circle cx={140 + 800 * cross} cy={1000} r={18} fill="#fff" />
          </svg>
          <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 140, color: '#fff', textShadow: '0 6px 30px #000' }}>
              {Math.round(cross * 7)} MIN</div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, color: ROUTE }}>ACROSS THE WHOLE PLANET</div>
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- the night sky: stars stay, planets go out ---------------- */}
      {sSky > 0.001 && (
        <AbsoluteFill style={{ opacity: sSky, background: 'linear-gradient(#01030a 0%, #050b1a 70%, #0a1424 100%)' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <filter id="mw" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="60" /></filter>
            </defs>
            <ellipse cx={540} cy={760} rx={900} ry={170} transform="rotate(38 540 760)" fill="#9bb6e6" opacity={0.16} filter="url(#mw)" />
            <ellipse cx={560} cy={740} rx={700} ry={70} transform="rotate(38 560 740)" fill="#d9e4ff" opacity={0.1} filter="url(#mw)" />
            {SKY.map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#fff" opacity={s.a * (0.7 + 0.3 * Math.sin(f / 7 + s.p))} />
            ))}
            {PLANETS.map((p) => {
              const gone = f >= cue(at.planets) ? prog(skyClock, p.when - 0.04, p.when + 0.04) : 0;
              return (
                <g key={p.name} opacity={1 - gone}>
                  <circle cx={p.x} cy={p.y} r={p.r * 4.5} fill={p.color} opacity={0.22} />
                  <circle cx={p.x} cy={p.y} r={p.r * 1.5} fill={p.color} />
                  <text x={p.x + 22} y={p.y + 8} fontFamily={SANS} fontWeight={700} fontSize={28} fill="#e8f0ff">{p.name}</text>
                </g>
              );
            })}
            <Horizon />
          </svg>
          {f < cue(at.planets) && <Card top="THE STARS STAY" sub="they make their own light" o={EASE_OUT(within(at.stars, 0.2, 0.45))} y={210} />}
          {f >= cue(at.planets) && (
            <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center' }}>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: '#9fc8ea' }}>AFTER THE SUN WENT OUT</div>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 110, color: '#fff', textShadow: '0 6px 26px #000' }}>
                {Math.floor(clockMin / 60)}h {String(clockMin % 60).padStart(2, '0')}m</div>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 36, color: ROUTE }}>
                {PLANETS.filter((p) => skyClock >= p.when).map((p) => `${p.name} GONE`).slice(-1)[0] ?? 'PLANETS SHINE ON REFLECTED SUNLIGHT'}</div>
            </div>
          )}
        </AbsoluteFill>
      )}

      {/* ---------------- deep-sea vents ---------------- */}
      {sVents > 0.001 && (
        <AbsoluteFill style={{ opacity: sVents, background: 'linear-gradient(#020812 0%, #041426 60%, #0b1a24 100%)' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}><Vent f={f} /></svg>
          <Card top="NO SUNLIGHT NEEDED" sub="vent life runs on chemicals, not light" color="#ff9a4d" o={EASE_OUT(within(at.vents, 0.2, 0.45))} y={210} />
        </AbsoluteFill>
      )}

      {/* ---------------- rogue planets ---------------- */}
      {sRogue > 0.001 && (
        <AbsoluteFill style={{ opacity: sRogue }}>
          <SpaceBg />
          {[[180, 560, 60], [880, 1200, 46], [300, 1420, 30]].map(([x, y, r], i) => (
            <svg key={i} width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
              <circle cx={x + Math.sin(f / 60 + i) * 20} cy={y} r={r} fill="#10141c" stroke="rgba(150,190,255,0.25)" strokeWidth={2} />
            </svg>
          ))}
          <GlobeView id="rogue" cx={lerp(700, 500, within(at.rogue, 0, 1))} cy={950} R={240} lon0={spin} lat0={20}
            overlay={{ night: 0.92, frost: 0.6 }} lights={0.45} />
          <Card top="BILLIONS OF ROGUE PLANETS" sub="our galaxy may have billions to trillions" color="#b07cff"
            o={EASE_OUT(within(at.rogue, 0.3, 0.55))} y={1300} />
        </AbsoluteFill>
      )}

      {/* ---------------- loop: back to frame 0 ---------------- */}
      {loopT > 0.001 && (
        <AbsoluteFill style={{ opacity: loopT }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}><Sun x={-40} y={340} r={160} /></svg>
          <GlobeView id="loop" cx={570} cy={1080} R={440} lon0={spin0 + (END - f) * 0.6} lat0={12} />
        </AbsoluteFill>
      )}

      {/* thumbnail-style title + badge on the hook and the last frames */}
      {(() => {
        const o = Math.max(sHook * (1 - sunOff * 0.3), prog(f, END - 22, END - 4));
        return (
          <>
            <div style={{ position: 'absolute', top: 160, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
              fontSize: 106, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.9)', opacity: o }}>
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

export default SunGone;
