import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { EndCard } from './EndCard';
import { SpaceBg } from './Globe';
import { ALERT, H, MONO, ROUTE, SANS, W, lerp, rng } from './parts';

// =============================================================================
// "A galaxy is coming for us." First second: a night sky with Andromeda's faint
// smudge, and the camera rushing into it as it becomes a full spiral. Then the
// two galaxies to scale-ish (2.5 million ly, closing at 300 km/s); the old
// 4.5-billion-year crash; a wall of simulated paths (100,000 runs) splitting
// into CRASH and MISS; a coin flip; and inside a merger, stars sliding past
// each other - spaced like ping-pong balls kilometres apart. Galaxies are drawn
// star by star (log spirals + a glowing core). Script and sources:
// make_whatif.py "andromeda".
// =============================================================================
export const compositionConfig = {
  id: 'AndroCollide',
  durationInSeconds: 30,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string; badge: string };
  at: { name: number; then: number; sims: number; coin: number; stars: number; pong: number };
  durationInSeconds: number;
};

type Star = { r: number; a: number; s: number; c: string; o: number };
const makeGalaxy = (seed: number, arms: number, n: number) => {
  const r = rng(seed); const out: Star[] = [];
  for (let i = 0; i < n; i++) {
    const arm = i % arms; const t = Math.pow(r(), 0.65);
    const a = arm * (Math.PI * 2 / arms) + t * 3.6 + (r() - 0.5) * (0.5 - t * 0.25);
    const core = t < 0.18;
    out.push({ r: t + (r() - 0.5) * 0.06, a, s: 0.6 + r() * (core ? 2.2 : 1.6),
      c: core ? (r() > 0.5 ? '#fff1c8' : '#ffd99a') : r() > 0.75 ? '#ffd2a8' : r() > 0.3 ? '#bcd4ff' : '#ffffff', o: 0.4 + r() * 0.6 });
  }
  return out;
};
const ANDRO = makeGalaxy(31, 2, 1400);
const MILKY = makeGalaxy(77, 4, 1200);

const Galaxy: React.FC<{ x: number; y: number; R: number; tilt: number; rot: number; spin: number; stars: Star[]; glow: string; id: string; o?: number }> = ({
  x, y, R, tilt, rot, spin, stars, glow, id, o = 1 }) => (
  <g opacity={o} transform={`translate(${x} ${y}) rotate(${rot}) scale(1 ${tilt})`}>
    <defs>
      <radialGradient id={`gc-${id}`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff6dc" stopOpacity={1} /><stop offset="0.25" stopColor={glow} stopOpacity={0.55} />
        <stop offset="1" stopColor={glow} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={0} cy={0} r={R * 1.05} fill={`url(#gc-${id})`} opacity={0.55} />
    {R > 6 && stars.map((st, i) => {
      const a = st.a + spin * (1.2 - st.r); const d = st.r * R;
      return <circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d} r={st.s * Math.max(0.35, R / 420)} fill={st.c} opacity={st.o} />;
    })}
    <circle cx={0} cy={0} r={R * 0.12} fill="#fff6dc" opacity={0.85} />
  </g>
);

const AndroCollide: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '', badge: '' }, at, durationInSeconds = 30 }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const span = (a: number, b: number) => prog(f, cue(a) - 6, cue(a) + 8) * (1 - prog(f, cue(b) - 8, cue(b) + 6));
  const last = vo.length - 1;
  const spin = f * 0.004;

  // ---- hook: night sky, Andromeda's smudge, rush in
  const sHook = 1 - prog(f, cue(at.name) - 6, cue(at.name) + 8);
  const rush = 0.25 + 0.75 * EASE_OUT(within(0, 0, 0.8));      // already rushing in at frame 0
  const hookScene = (key: string, t: number) => (
    <>
      <AbsoluteFill style={{ background: 'linear-gradient(#01030a 0%, #050b1a 70%, #0a1424 100%)' }} />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {Array.from({ length: 260 }, (_, i) => {
          const r = rng(i + 500); const x = r() * W; const y = r() * 1400;
          const dx = (x - 700) * (1 + t * 3); const dy = (y - 620) * (1 + t * 3);
          return <circle key={i} cx={700 + dx} cy={620 + dy} r={0.6 + r() * 1.4} fill="#fff" opacity={(0.3 + r() * 0.7) * (1 - t * 0.6)} />;
        })}
        <Galaxy id={`h-${key}`} x={lerp(700, 540, t)} y={lerp(620, 900, t)} R={lerp(46, 560, Math.pow(t, 1.2))} tilt={0.38} rot={-32}
          spin={spin} stars={ANDRO} glow="#9fb8ff" />
        {/* the hills you watch it from */}
        <path d={`M 0 ${1500 + t * 500} Q 270 ${1400 + t * 500} 540 ${1460 + t * 500} T 1080 ${1420 + t * 500} L 1080 1920 L 0 1920 Z`}
          fill="#05070d" />
      </svg>
    </>
  );

  // ---- 2.5 million light-years, 300 km/s
  const sName = span(at.name, at.sims);
  const closeIn = f < cue(at.then) ? EASE_OUT(within(at.name, 0, 1)) * 0.25 : 0.25 + 0.75 * EASE_INOUT(within(at.then, 0.05, 0.85));
  const ax = lerp(860, 600, closeIn); const mx = lerp(220, 470, closeIn);
  const years = f < cue(at.then) ? 0 : 4.5 * EASE_INOUT(within(at.then, 0.05, 0.85));
  const crashFlash = f >= cue(at.then) ? prog(within(at.then, 0.82, 1), 0, 1) : 0;

  // ---- 100,000 simulations; a coin flip
  const sSims = span(at.sims, at.stars);
  const sims = Math.round(100000 * EASE_OUT(within(at.sims, 0.05, 0.85)));
  const coinT = f >= cue(at.coin) ? within(at.coin, 0, 1) : 0;

  // ---- stars almost never hit; ping-pong balls
  const sStars = span(at.stars, last);
  const merge = EASE_INOUT(within(at.stars, 0, 1));
  const loopT = EASE_INOUT(prog(f, cue(last), END - 4));

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      {sHook > 0.001 && <AbsoluteFill style={{ opacity: sHook }}>{hookScene('hook', rush)}</AbsoluteFill>}

      {/* ---------------- two galaxies closing in ---------------- */}
      {sName > 0.001 && (
        <AbsoluteFill style={{ opacity: sName }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <Galaxy id="mw" x={mx} y={1050} R={210} tilt={0.42} rot={20} spin={spin} stars={MILKY} glow="#ffd99a" />
            <Galaxy id="an" x={ax} y={850} R={250} tilt={0.38} rot={-32} spin={-spin} stars={ANDRO} glow="#9fb8ff" />
            <circle cx={mx + 90} cy={1060} r={7} fill={ROUTE} />
            <text x={mx + 100} y={1110} fontFamily={SANS} fontWeight={800} fontSize={28} fill={ROUTE}>YOU ARE HERE</text>
            <text x={ax} y={680} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={40} fill="#cfe0ff">ANDROMEDA</text>
            {f < cue(at.then) && (
              <g opacity={EASE_OUT(within(at.name, 0.2, 0.5))}>
                <line x1={ax - 60} y1={780} x2={ax - 200} y2={850} stroke={ALERT} strokeWidth={8} strokeLinecap="round" />
                <path d={`M ${ax - 180} ${830} L ${ax - 205} ${852} L ${ax - 172} ${862}`} stroke={ALERT} strokeWidth={8} fill="none" strokeLinecap="round" />
              </g>
            )}
            {crashFlash > 0 && <circle cx={(ax + mx) / 2} cy={950} r={100 + 700 * crashFlash} fill="#fff" opacity={0.7 * (1 - crashFlash)} />}
          </svg>
          <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center' }}>
            {f < cue(at.then) ? (
              <>
                <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 92, color: '#fff', textShadow: '0 6px 30px #000' }}>2.5 MILLION</div>
                <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: '#9fb8ff' }}>LIGHT-YEARS AWAY</div>
                <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 60, color: ALERT, marginTop: 10 }}>→ 300 km/s</div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#9fb8ff' }}>THE OLD FORECAST</div>
                <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 110, color: '#fff', textShadow: '0 6px 30px #000' }}>
                  {years.toFixed(1)} BN YRS</div>
                <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 44, color: ALERT, opacity: prog(years, 4.3, 4.5) }}>CRASH</div>
              </>
            )}
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- 100,000 simulations; a coin flip ---------------- */}
      {sSims > 0.001 && (
        <AbsoluteFill style={{ opacity: sSims, background: '#03060f' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {f < cue(at.coin) && Array.from({ length: 48 }, (_, i) => {
              const col = i % 6; const row = Math.floor(i / 6); const x0 = 110 + col * 172; const y0 = 560 + row * 112;
              const shown = within(at.sims, 0.02 + (i / 48) * 0.6, 0.1 + (i / 48) * 0.6);
              const hit = (i * 37) % 100 < 50;
              const t = shown;
              const ex = x0 + 110 * t; const ey = y0 + (hit ? 40 : -20) * t + Math.sin(t * 3) * 14;
              return (
                <g key={i} opacity={shown > 0 ? 1 : 0}>
                  <circle cx={x0} cy={y0 + 40} r={6} fill="#ffd99a" />
                  <path d={`M ${x0 + 140} ${y0} Q ${x0 + 80} ${y0 + 20} ${ex} ${ey}`} stroke={hit ? ALERT : '#5dff8a'} strokeWidth={3} fill="none" />
                  <circle cx={ex} cy={ey} r={5} fill="#9fb8ff" />
                </g>
              );
            })}
            {f >= cue(at.coin) && (() => {
              const flips = coinT * 9; const sx = Math.cos(flips * Math.PI);
              const side = Math.cos(flips * Math.PI) > 0;
              return (
                <g transform={`translate(540 ${960 - Math.sin(Math.min(1, coinT * 1.1) * Math.PI) * 260}) scale(${Math.max(0.04, Math.abs(sx))} 1)`}>
                  <circle r={210} fill={side ? '#ffd34d' : '#c0c8d6'} stroke="#000" strokeWidth={8} />
                  <circle r={180} fill="none" stroke="#00000044" strokeWidth={6} />
                  <text y={22} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={70} fill="#1b2a44">{side ? 'CRASH' : 'MISS'}</text>
                </g>
              );
            })()}
          </svg>
          <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center' }}>
            {f < cue(at.coin) ? (
              <>
                <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 110, color: '#fff', textShadow: '0 6px 30px #000' }}>{sims.toLocaleString('en-US')}</div>
                <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: '#9fb8ff' }}>SIMULATIONS</div>
                <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 36, marginTop: 10 }}>
                  <span style={{ color: ALERT }}>CRASH</span> <span style={{ color: '#fff' }}>vs</span> <span style={{ color: '#5dff8a' }}>MISS</span></div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 130, color: '#fff', textShadow: '0 6px 30px #000' }}>~50 / 50</div>
                <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 36, color: '#9fb8ff' }}>OVER THE NEXT 10 BILLION YEARS</div>
              </>
            )}
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- stars almost never hit; ping-pong balls ---------------- */}
      {sStars > 0.001 && (
        <AbsoluteFill style={{ opacity: sStars }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {f < cue(at.pong) ? (
              <>
                <Galaxy id="m2" x={lerp(300, 520, merge)} y={lerp(1100, 980, merge)} R={300} tilt={0.5} rot={20 + merge * 30} spin={spin} stars={MILKY} glow="#ffd99a" o={0.9} />
                <Galaxy id="a2" x={lerp(780, 560, merge)} y={lerp(820, 940, merge)} R={320} tilt={0.45} rot={-32 - merge * 30} spin={-spin} stars={ANDRO} glow="#9fb8ff" o={0.9} />
                <circle cx={540} cy={960} r={120} fill="none" stroke={ROUTE} strokeWidth={4} strokeDasharray="10 10" opacity={EASE_OUT(within(at.stars, 0.4, 0.6))} />
              </>
            ) : (
              <g>
                {/* a ground-level scale: one ball, then the next one 3.2 km away */}
                <rect x={0} y={1130} width={W} height={10} fill="#3a4357" />
                <circle cx={160} cy={1100} r={30} fill="#fff" stroke="#000" strokeWidth={3} />
                <line x1={200} y1={1180} x2={lerp(200, 880, EASE_OUT(within(at.pong, 0.15, 0.6)))} y2={1180} stroke={ROUTE} strokeWidth={6} />
                <text x={540} y={1240} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={56} fill={ROUTE}
                  opacity={within(at.pong, 0.5, 0.7)}>3.2 km</text>
                <circle cx={920} cy={1100} r={30} fill="#fff" stroke="#000" strokeWidth={3} opacity={within(at.pong, 0.5, 0.7)} />
                <text x={160} y={1040} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={30} fill="#fff">A STAR</text>
                <text x={920} y={1040} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={30} fill="#fff"
                  opacity={within(at.pong, 0.5, 0.7)}>THE NEXT</text>
              </g>
            )}
          </svg>
          <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 72, color: '#fff', textShadow: '0 6px 30px #000' }}>
              {f < cue(at.pong) ? 'STARS: ALMOST NO HITS' : 'PING-PONG BALLS'}</div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 36, color: '#9fb8ff' }}>
              {f < cue(at.pong) ? 'EVEN IF THE GALAXIES MERGE' : 'THAT IS HOW FAR APART STARS ARE'}</div>
          </div>
        </AbsoluteFill>
      )}

      {loopT > 0.001 && <AbsoluteFill style={{ opacity: loopT }}>{hookScene('loop', 0)}</AbsoluteFill>}

      {(() => {
        const o = Math.max(sHook, prog(f, END - 22, END - 4));
        return (
          <>
            <div style={{ position: 'absolute', top: 160, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
              fontSize: 92, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.9)', opacity: o }}>
              {hook.top}<br /><span style={{ color: ROUTE }}>{hook.bottom}</span>
            </div>
            <div style={{ position: 'absolute', top: 1420, left: 0, right: 0, textAlign: 'center', opacity: o,
              transform: `rotate(-3deg) scale(${1 + 0.04 * Math.sin(f / 5)})` }}>
              <span style={{ display: 'inline-block', background: '#ff2d2d', color: '#fff', fontFamily: SANS, fontWeight: 800,
                fontSize: 62, padding: '10px 30px', borderRadius: 18, border: '5px solid #fff' }}>{hook.badge}</span>
            </div>
          </>
        );
      })()}

      <EndCard from={cue(last)} to={END - 14} text="" compact />
      <Captions lines={vo} y={1600} accent={ROUTE} maxWords={3} size={58} plate />
    </AbsoluteFill>
  );
};

export default AndroCollide;
