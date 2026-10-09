import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { EndCard } from './EndCard';
import { GlobeView } from './Globe';
import { ALERT, H, MONO, ROUTE, SANS, W, lerp, rng } from './parts';

// =============================================================================
// "What if a black hole passed by Earth?" - the 3D globe from Globe.tsx in deep
// space, and a black hole drawn with real point-lens maths: every background
// star is shown at both of its lensed images (theta = (b +- sqrt(b^2+4 tE^2))/2),
// which is what bends the star field into an Einstein ring around the shadow.
// The script and its numbers live in make_blackhole.py.
// =============================================================================
export const compositionConfig = {
  id: 'BlackHole',
  durationInSeconds: 34,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string };
  at: { invisible: number; nearest: number; mass: number; size: number; pull: number; fling: number; rip: number; safe: number };
  labels: { nearest: string; nearestSub: string; size: string; rip: string; safe: string };
  durationInSeconds: number;
};

const STARS = (() => {
  const r = rng(77);
  const big = Array.from({ length: 520 }, () => ({ x: r() * W, y: r() * H, s: 0.6 + r() * 1.9, a: 0.35 + r() * 0.65, p: r() * 6 }));
  // a faint dust of small stars: around the lens they smear into the Einstein ring
  const dust = Array.from({ length: 1500 }, () => ({ x: r() * W, y: r() * H, s: 0.35 + r() * 0.7, a: 0.15 + r() * 0.35, p: r() * 6 }));
  return [...big, ...dust];
})();

// stars as seen around a lens at (lx, ly) with Einstein radius tE (px)
export const LensedStars: React.FC<{ lx: number; ly: number; tE: number; o: number }> = ({ lx, ly, tE, o }) => {
  const f = useCurrentFrame();
  const dots: React.ReactElement[] = [];
  STARS.forEach((s, i) => {
    const dx = s.x - lx;
    const dy = s.y - ly;
    const b = Math.hypot(dx, dy) || 0.001;
    const tw = s.a * (0.75 + 0.25 * Math.sin(f / 9 + s.p)) * o;
    if (tE < 1) {
      dots.push(<circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#fff" opacity={tw} />);
      return;
    }
    const root = Math.sqrt(b * b + 4 * tE * tE);
    const tp = (b + root) / 2;                    // outer image
    const tm = (b - root) / 2;                    // inner image, on the other side
    const ux = dx / b;
    const uy = dy / b;
    const magP = Math.min(6, (tp / b) * (tp / Math.max(0.5, Math.abs(tp - tE * tE / tp))) * 0.25 + 0.75);
    dots.push(<circle key={`p${i}`} cx={lx + ux * tp} cy={ly + uy * tp} r={s.s * Math.min(2.2, magP)} fill="#fff" opacity={Math.min(1, tw * magP)} />);
    if (b < tE * 3) {
      dots.push(<circle key={`m${i}`} cx={lx + ux * tm} cy={ly + uy * tm} r={s.s * 0.9} fill="#dfe9ff" opacity={tw * 0.6} />);
    }
  });
  return <g>{dots}</g>;
};

export const Shadow: React.FC<{ x: number; y: number; r: number; o: number }> = ({ x, y, r, o }) => {
  const f = useCurrentFrame();
  return (
    <g opacity={o}>
      <defs>
        <radialGradient id="ring" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.80" stopColor="#ffd9a0" stopOpacity={0} />
          <stop offset="0.86" stopColor="#ffe6bf" stopOpacity={0.9} />
          <stop offset="0.90" stopColor="#ff9f43" stopOpacity={0.35} />
          <stop offset="1" stopColor="#ff7a1a" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r * 1.25} fill="url(#ring)" opacity={0.85 + 0.15 * Math.sin(f / 7)} />
      <circle cx={x} cy={y} r={r} fill="#000" />
    </g>
  );
};

export const Sun: React.FC<{ x: number; y: number; r: number }> = ({ x, y, r }) => (
  <g>
    <defs>
      <radialGradient id="sunGlow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff7d6" /><stop offset="0.35" stopColor="#ffd34d" />
        <stop offset="0.6" stopColor="#ff9a1f" stopOpacity={0.6} /><stop offset="1" stopColor="#ff6a00" stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={x} cy={y} r={r * 2.4} fill="url(#sunGlow)" />
    <circle cx={x} cy={y} r={r} fill="#fff3c4" />
  </g>
);

const Arrow: React.FC<{ x1: number; y: number; len: number; dir: 1 | -1; color: string; w: number; o: number }> = ({ x1, y, len, dir, color, w, o }) => {
  const x2 = x1 + dir * len;
  return (
    <g opacity={o} stroke={color} strokeWidth={w} strokeLinecap="round" fill="none">
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <path d={`M ${x2 - dir * w * 2.4} ${y - w * 2} L ${x2} ${y} L ${x2 - dir * w * 2.4} ${y + w * 2}`} strokeLinejoin="round" />
    </g>
  );
};

export const Card: React.FC<{ top: string; sub?: string; o: number; color?: string; y?: number }> = ({ top, sub, o, color = ROUTE, y = 300 }) => (
  <div style={{ position: 'absolute', top: y, left: 60, right: 60, textAlign: 'center', opacity: o,
    transform: `scale(${0.92 + 0.08 * o})` }}>
    <div style={{ display: 'inline-block', background: 'rgba(8,10,14,0.78)', border: `3px solid ${color}`, borderRadius: 18,
      padding: '14px 30px', fontFamily: SANS, fontWeight: 700, fontSize: 64, color: '#fff', lineHeight: 1.1 }}>{top}</div>
    {sub && <div style={{ marginTop: 14, fontFamily: MONO, fontSize: 36, color: '#cfe6ff',
      textShadow: '0 4px 16px rgba(0,0,0,0.9)' }}>{sub}</div>}
  </div>
);

const BlackHole: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '' }, at, labels, durationInSeconds = 34 }) => {
  const f = useCurrentFrame();
  if (!at || !labels) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const span = (a: number, b: number) => prog(f, cue(a) - 6, cue(a) + 8) * (1 - prog(f, cue(b) - 8, cue(b) + 6));
  const last = vo.length - 1;
  const spinLon = 20 - f * 0.9;                                      // slow, steady rotation

  // ---- scene opacities
  const sHook = 1 - prog(f, cue(at.invisible) - 6, cue(at.invisible) + 8);
  const sSpace = span(at.invisible, at.pull);                         // invisible -> nearest -> mass -> size
  const sPull = span(at.pull, at.rip);                                // pull + fling (the orbit diagram)
  const sRip = span(at.rip, at.safe);
  const sSafe = span(at.safe, last);
  const loopT = EASE_INOUT(prog(f, cue(last), END - 4));

  // ---- the lens drifting in (space scene)
  const appear = EASE_INOUT(prog(f, cue(at.mass), lerp(cue(at.mass), lineEnd(at.mass), 0.8)));
  const lx = lerp(1300, 600, EASE_INOUT(prog(f, cue(at.invisible), cue(at.size))));
  const ly = lerp(520, 760, EASE_INOUT(prog(f, cue(at.invisible), cue(at.size))));
  const tE = lerp(90, 300, appear) * (1 + 0.12 * EASE_OUT(within(at.size, 0, 0.6)));
  const shadowR = tE * 0.46;
  const earthR = lerp(300, 150, EASE_INOUT(prog(f, cue(at.invisible), cue(at.mass))));
  const earthX = lerp(540, 230, EASE_INOUT(prog(f, cue(at.invisible), cue(at.nearest))));
  const earthY = lerp(1000, 1260, EASE_INOUT(prog(f, cue(at.invisible), cue(at.nearest))));
  const gaiaO = f >= cue(at.nearest) ? EASE_OUT(within(at.nearest, 0.05, 0.35)) * (1 - prog(f, cue(at.mass) - 6, cue(at.mass))) : 0;

  // ---- orbit diagram
  const sunX = 180; const sunY = 980;
  const orbitR = 360;                                // Earth sits on its orbit, halfway between
  const flingT = EASE_INOUT(within(at.fling, 0.1, 0.95));
  const ex0 = sunX + orbitR;
  const ey0 = sunY;
  const bhX = ex0 + orbitR;                         // the black hole as far away as the Sun
  // flung: swings round the black hole's side and out of the picture
  const ex = lerp(ex0, 1180, flingT) + Math.sin(flingT * Math.PI) * 60;
  const ey = lerp(ey0, 300, flingT * flingT);
  const frost = flingT;

  // ---- tidal rip
  const rip = EASE_INOUT(within(at.rip, 0.15, 0.9));
  const ripCounter = Math.round(lerp(5_000_000, 1_000_000, EASE_OUT(within(at.rip, 0, 0.5))) / 10000) * 10000;

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      {/* ---------------- hook: Earth in space ---------------- */}
      {sHook > 0.001 && (
        <AbsoluteFill style={{ opacity: sHook }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}><LensedStars lx={-9999} ly={0} tE={0} o={1} /></svg>
          <GlobeView id="hook" cx={540} cy={1000} R={420} lon0={spinLon} lat0={12} />
        </AbsoluteFill>
      )}

      {/* ---------------- the lens arrives ---------------- */}
      {sSpace > 0.001 && (
        <AbsoluteFill style={{ opacity: sSpace }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <LensedStars lx={lx} ly={ly} tE={tE} o={1} />
          </svg>
          <GlobeView id="space" cx={earthX} cy={earthY} R={earthR} lon0={spinLon} lat0={12} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {/* Gaia BH1: a far-off point, 1,560 light-years from the little Earth */}
            {gaiaO > 0.01 && (
              <g opacity={gaiaO}>
                <line x1={earthX + 60} y1={earthY - 60} x2={880} y2={560} stroke={ROUTE} strokeWidth={3} strokeDasharray="10 12" />
                <circle cx={880} cy={560} r={9} fill="#ffb35c" />
                <circle cx={880} cy={560} r={26} fill="none" stroke="#ffb35c" strokeWidth={3} opacity={0.6} />
              </g>
            )}
            <Shadow x={lx} y={ly} r={shadowR} o={appear} />
            {/* the size bracket */}
            {f >= cue(at.size) && (
              <g opacity={EASE_OUT(within(at.size, 0.1, 0.4))} stroke={ROUTE} strokeWidth={4}>
                <line x1={lx - shadowR} y1={ly + shadowR + 60} x2={lx + shadowR} y2={ly + shadowR + 60} />
                <line x1={lx - shadowR} y1={ly + shadowR + 46} x2={lx - shadowR} y2={ly + shadowR + 74} />
                <line x1={lx + shadowR} y1={ly + shadowR + 46} x2={lx + shadowR} y2={ly + shadowR + 74} />
              </g>
            )}
          </svg>
          {f >= cue(at.size) && (
            <div style={{ position: 'absolute', left: lx - 200, width: 400, top: ly + shadowR + 84, textAlign: 'center',
              fontFamily: MONO, fontWeight: 700, fontSize: 44, color: ROUTE, opacity: EASE_OUT(within(at.size, 0.1, 0.4)),
              textShadow: '0 4px 16px #000' }}>{labels.size}
              <div style={{ fontSize: 24, fontWeight: 400, color: '#9fb3c8', marginTop: 4 }}>not to scale</div></div>
          )}
          <Card top="INVISIBLE" sub="no light escapes" o={EASE_OUT(within(at.invisible, 0.2, 0.45)) * (1 - prog(f, cue(at.nearest) - 6, cue(at.nearest)))} />
          <Card top={labels.nearest} sub={labels.nearestSub}
            o={f >= cue(at.nearest) ? EASE_OUT(within(at.nearest, 0.05, 0.3)) * (1 - prog(f, cue(at.mass) - 6, cue(at.mass))) : 0} />
          <Card top="10 × THE SUN'S MASS" o={f >= cue(at.mass) ? EASE_OUT(within(at.mass, 0.2, 0.5)) * (1 - prog(f, cue(at.size) - 6, cue(at.size))) : 0} />
        </AbsoluteFill>
      )}

      {/* ---------------- pull and fling: the orbit diagram ---------------- */}
      {sPull > 0.001 && (
        <AbsoluteFill style={{ opacity: sPull }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <LensedStars lx={bhX} ly={sunY} tE={90} o={0.8} />
            <circle cx={sunX} cy={sunY} r={orbitR} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={3} strokeDasharray="10 12" />
            <Sun x={sunX} y={sunY} r={46} />
            <Shadow x={bhX} y={sunY} r={40} o={1} />
            {f >= cue(at.pull) && f < cue(at.fling) && (
              <>
                {/* the pulls on Earth: the Sun's (1x) and the black hole's (10x), to scale */}
                <Arrow x1={ex0 - 60} y={sunY} len={30} dir={-1} color="#ffd34d" w={9} o={EASE_OUT(within(at.pull, 0.1, 0.35))} />
                <Arrow x1={ex0 + 60} y={sunY} len={300 * EASE_OUT(within(at.pull, 0.3, 0.8))} dir={1} color={ALERT} w={12}
                  o={EASE_OUT(within(at.pull, 0.3, 0.5))} />
                <text x={ex0 - 80} y={sunY - 40} textAnchor="end" fontFamily={MONO} fontWeight={700} fontSize={36} fill="#ffd34d"
                  opacity={EASE_OUT(within(at.pull, 0.1, 0.35))}>1×</text>
                <text x={ex0 + 200} y={sunY - 40} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={44} fill={ALERT}
                  opacity={EASE_OUT(within(at.pull, 0.4, 0.6))}>10×</text>
              </>
            )}
            {f >= cue(at.fling) && (
              <path d={`M ${ex0} ${ey0} Q ${(ex0 + 1150) / 2} ${ey0 - 40} ${ex} ${ey}`} fill="none" stroke="#9fd0ff" strokeWidth={4}
                strokeDasharray="6 10" opacity={0.7} />
            )}
          </svg>
          <GlobeView id="orbit" cx={ex} cy={ey} R={46} lon0={spinLon} lat0={12} />
          <AbsoluteFill style={{ background: `radial-gradient(circle at ${ex}px ${ey}px, rgba(150,200,255,${0.35 * frost}) 0px, rgba(0,0,0,0) 120px)` }} />
          <Card top="10 × STRONGER PULL" sub="at the same distance as the Sun"
            o={f >= cue(at.pull) ? EASE_OUT(within(at.pull, 0.2, 0.45)) * (1 - prog(f, cue(at.fling) - 6, cue(at.fling))) : 0} />
          <Card top="FLUNG INTO THE COLD" color="#9fd0ff" o={f >= cue(at.fling) ? EASE_OUT(within(at.fling, 0.3, 0.55)) : 0} />
        </AbsoluteFill>
      )}

      {/* ---------------- the tidal rip ---------------- */}
      {sRip > 0.001 && (
        <AbsoluteFill style={{ opacity: sRip }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <LensedStars lx={860} ly={560} tE={300} o={1} />
            <Shadow x={860} y={560} r={138} o={1} />
          </svg>
          <AbsoluteFill style={{ transform: `rotate(-38deg) scale(${1 - 0.18 * rip}, ${1 + 0.4 * rip})`, transformOrigin: '420px 1240px' }}>
            <GlobeView id="rip" cx={420} cy={1240} R={330} lon0={spinLon} lat0={12} />
          </AbsoluteFill>
          <AbsoluteFill style={{ background: `radial-gradient(circle at 420px 1240px, rgba(255,80,20,${0.45 * rip}) 0px, rgba(0,0,0,0) 520px)` }} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {Array.from({ length: 60 }, (_, i) => {
              const g = rng(i * 7 + 3);
              const r1 = g(); const r2 = g(); const r3 = g();
              const t = Math.max(0, Math.min(1, rip * 1.3 - r1 * 0.4));
              // from the stretched near side of Earth, curling into the black hole
              const sx = 560 + (r2 - 0.5) * 120; const sy = 1060 + (r3 - 0.5) * 120;
              const x = lerp(sx, 860, t) + Math.sin(t * Math.PI) * (r2 - 0.5) * 220;
              const y = lerp(sy, 560, t) + Math.sin(t * Math.PI) * (r3 - 0.5) * 160;
              return <circle key={i} cx={x} cy={y} r={(3 + r1 * 6) * (1 - 0.6 * t)} fill={r3 > 0.5 ? '#c98b5a' : '#ffb35c'}
                opacity={rip * (1 - t * 0.7)} />;
            })}
          </svg>
          <div style={{ position: 'absolute', top: 160, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: '#ffb199' }}>DISTANCE</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 96, color: '#fff', textShadow: '0 6px 26px #000' }}>
              {ripCounter.toLocaleString('en-US')} km</div>
          </div>
          <Card top={labels.rip} color={ALERT} y={1330} o={EASE_OUT(within(at.rip, 0.45, 0.7))} />
        </AbsoluteFill>
      )}

      {/* ---------------- safe ---------------- */}
      {sSafe > 0.001 && (
        <AbsoluteFill style={{ opacity: sSafe }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}><LensedStars lx={-9999} ly={0} tE={0} o={1} /></svg>
          <GlobeView id="safe" cx={540} cy={1000} R={420} lon0={spinLon} lat0={12} />
          <Card top={labels.safe} o={EASE_OUT(within(at.safe, 0.2, 0.45))} />
        </AbsoluteFill>
      )}

      {/* ---------------- loop: back to frame 0 ---------------- */}
      {loopT > 0.001 && (
        <AbsoluteFill style={{ opacity: loopT }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}><LensedStars lx={-9999} ly={0} tE={0} o={1} /></svg>
          {/* lands exactly on frame 0's globe as the video ends */}
          <GlobeView id="loop" cx={540} cy={1000} R={420} lon0={20 + (END - f) * 0.9} lat0={12} />
        </AbsoluteFill>
      )}

      <div style={{
        position: 'absolute', top: 200, left: 50, right: 50, textAlign: 'center', fontFamily: SANS, fontWeight: 700,
        fontSize: 72, lineHeight: 1.1, color: '#fff', textShadow: '0 6px 30px rgba(0,0,0,0.85)',
        opacity: Math.max(sHook, prog(f, END - 22, END - 4)),
      }}>
        {hook.top}<br /><span style={{ color: ROUTE }}>{hook.bottom}</span>
      </div>

      <EndCard from={cue(last)} to={END - 14} text="" compact />
      <Captions lines={vo} y={1560} accent={ROUTE} maxWords={3} size={58} plate />
    </AbsoluteFill>
  );
};

export default BlackHole;
