import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { Card, LensedStars } from './BlackHole';
import { EndCard } from './EndCard';
import { Astronaut, Gargantua } from './Gargantua';
import { ALERT, H, MONO, ROUTE, SANS, W, lerp } from './parts';

// =============================================================================
// "The bigger the black hole, the safer it is to fall in." Small vs giant side
// by side; the tide at a small one (feet pulled harder than head) stretching an
// astronaut to spaghetti still outside the edge; a supermassive one where the
// astronaut drifts across the edge unstretched; a distant friend's view - the
// astronaut slowing, reddening, freezing at the edge (clock winding down); and
// inside, every path pointing to the centre, light included. Script and
// sources: make_whatif.py "bhfall".
// =============================================================================
export const compositionConfig = {
  id: 'BHFall',
  durationInSeconds: 33,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string; badge: string };
  at: { small: number; spag: number; giant: number; cross: number; friend: number; freeze: number; inside: number; light: number };
  durationInSeconds: number;
};

const GREEN = '#5dff8a';

const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; color: string; w: number; o?: number }> = ({ x1, y1, x2, y2, color, w, o = 1 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1); const h = w * 2.6;
  const p = (da: number) => `${x2 - Math.cos(a + da) * h},${y2 - Math.sin(a + da) * h}`;
  return (
    <g opacity={o} stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <line x1={x1} y1={y1} x2={x2} y2={y2} /><path d={`M ${p(0.5)} L ${x2},${y2} L ${p(-0.5)}`} />
    </g>
  );
};

const Clock: React.FC<{ x: number; y: number; r: number; turns: number; tint: string }> = ({ x, y, r, turns, tint }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="#0b0d14" stroke={tint} strokeWidth={5} />
    {Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return <line key={i} x1={x + Math.sin(a) * r * 0.8} y1={y - Math.cos(a) * r * 0.8} x2={x + Math.sin(a) * r * 0.92} y2={y - Math.cos(a) * r * 0.92}
        stroke={tint} strokeWidth={3} />;
    })}
    <line x1={x} y1={y} x2={x + Math.sin(turns * Math.PI * 2) * r * 0.78} y2={y - Math.cos(turns * Math.PI * 2) * r * 0.78} stroke={tint}
      strokeWidth={5} strokeLinecap="round" />
    <line x1={x} y1={y} x2={x + Math.sin(turns * Math.PI * 2 / 12) * r * 0.5} y2={y - Math.cos(turns * Math.PI * 2 / 12) * r * 0.5} stroke={tint}
      strokeWidth={7} strokeLinecap="round" />
  </g>
);

const Ship: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -80 0 L 40 -26 L 90 0 L 40 26 Z" fill="#cfd8e3" />
    <path d="M -40 -12 L -70 -50 L -50 -50 L -10 -14 Z M -40 12 L -70 50 L -50 50 L -10 14 Z" fill="#9aa6b2" />
    <circle cx={44} cy={0} r={10} fill="#4fc3ff" />
    <path d="M -80 -8 L -110 0 L -80 8 Z" fill="#ffb347" />
  </g>
);

const BHFall: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '', badge: '' }, at, durationInSeconds = 33 }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const span = (a: number, b: number) => prog(f, cue(a) - 6, cue(a) + 8) * (1 - prog(f, cue(b) - 8, cue(b) + 6));
  const last = vo.length - 1;
  const bob = Math.sin(f / 14) * 8;

  // ---- hook: a small one shreds, a giant one doesn't
  const sHook = 1 - prog(f, cue(at.small) - 6, cue(at.small) + 8);
  const hookScene = (key: string) => (
    <>
      <AbsoluteFill style={{ background: '#000' }} />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <LensedStars lx={540} ly={1300} tE={420} o={1} />
        <Gargantua id={`hg-${key}`} x={540} y={1300} rs={270} f={f} />
        <Astronaut x={790} y={900 + bob} s={0.9} rot={-15} />
        <text x={790} y={1030} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={40} fill={GREEN}>GIANT: FINE</text>
        <Gargantua id={`hs-${key}`} x={250} y={700} rs={46} f={f} tilt={0.2} />
        <Astronaut x={250} y={540} s={0.7} sx={0.35} sy={3.4} />
        <text x={250} y={800} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={40} fill={ALERT}>SMALL: OUCH</text>
      </svg>
    </>
  );

  // ---- the tide at a small black hole
  const sSmall = span(at.small, at.giant);
  const arrows = EASE_OUT(within(at.small, 0.2, 0.55));
  const stretch = f < cue(at.spag) ? lerp(1, 1.25, within(at.small, 0.5, 1)) : lerp(1.25, 3.2, EASE_INOUT(within(at.spag, 0, 0.8)));
  // feet stay outside the edge (top of the dashed circle is y 1158): bottom of the figure = ay + 155 * stretch
  const ay = 1120 - 155 * stretch - (f < cue(at.spag) ? 200 : lerp(200, 0, EASE_INOUT(within(at.spag, 0, 0.8))));

  // ---- a giant one: across the edge unharmed
  const sGiant = span(at.giant, at.friend);
  const drift = EASE_INOUT(within(at.cross, 0, 0.9));

  // ---- the friend's view: slower, redder, frozen
  const sFriend = span(at.friend, at.inside);
  const approach = f < cue(at.freeze) ? within(at.friend, 0, 1) * 0.6 : 0.6 + 0.4 * (1 - Math.exp(-3 * within(at.freeze, 0, 1)));
  const red = f < cue(at.freeze) ? 0 : EASE_INOUT(within(at.freeze, 0.05, 0.9));
  // the clock: steady while far, then each tick takes longer
  const turns = (() => {
    const t0 = cue(at.friend);
    if (f < cue(at.freeze)) return (f - t0) / 45;
    const base = (cue(at.freeze) - t0) / 45; const k = (f - cue(at.freeze)) / 45;
    return base + (1 - Math.exp(-k * 1.6)) / 1.6;
  })();
  const tint = `rgb(${Math.round(lerp(242, 255, red))},${Math.round(lerp(244, 70, red))},${Math.round(lerp(248, 50, red))})`;

  // ---- inside: every path to the centre; light too
  const sIn = span(at.inside, last);
  const loopT = EASE_INOUT(prog(f, cue(last), END - 4));

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      {sHook > 0.001 && <AbsoluteFill style={{ opacity: sHook }}>{hookScene('hook')}</AbsoluteFill>}

      {/* ---------------- small black hole: tide, then spaghetti ---------------- */}
      {sSmall > 0.001 && (
        <AbsoluteFill style={{ opacity: sSmall, background: '#000' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <LensedStars lx={540} ly={1250} tE={150} o={1} />
            <Gargantua id="small" x={540} y={1250} rs={70} f={f} tilt={0.18} />
            <circle cx={540} cy={1250} r={92} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray="10 10" opacity={0.7} />
            <text x={660} y={1150} fontFamily={SANS} fontWeight={700} fontSize={28} fill="#fff" opacity={0.8}>THE EDGE</text>
            <Astronaut x={540} y={ay} s={1.8} sx={1 / Math.sqrt(stretch)} sy={stretch} />
            {f < cue(at.spag) && (
              <g opacity={arrows}>
                <Arrow x1={700} y1={ay - 110} x2={700} y2={ay - 40} color="#9fd0ff" w={8} />
                <text x={730} y={ay - 64} fontFamily={SANS} fontWeight={700} fontSize={30} fill="#9fd0ff">HEAD: PULLED</text>
                <Arrow x1={700} y1={ay + 60} x2={700} y2={ay + 270} color={ALERT} w={10} />
                <text x={730} y={ay + 160} fontFamily={SANS} fontWeight={700} fontSize={30} fill={ALERT}>FEET: PULLED</text>
                <text x={730} y={ay + 196} fontFamily={SANS} fontWeight={700} fontSize={30} fill={ALERT}>MUCH HARDER</text>
              </g>
            )}
          </svg>
          {f < cue(at.spag)
            ? <Card top="A SMALL BLACK HOLE" sub="left by a collapsed star" color="#ffb347" y={210} o={EASE_OUT(within(at.small, 0, 0.25))} />
            : <Card top="SPAGHETTIFIED" sub="before even reaching the edge" color={ALERT} y={210} o={EASE_OUT(within(at.spag, 0.3, 0.55))} />}
        </AbsoluteFill>
      )}

      {/* ---------------- a supermassive one: across the edge, unstretched ---------------- */}
      {sGiant > 0.001 && (
        <AbsoluteFill style={{ opacity: sGiant, background: '#000' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {f < cue(at.cross) ? (
              <>
                <LensedStars lx={540} ly={1150} tE={520} o={1} />
                <Gargantua id="giant" x={540} y={1150} rs={lerp(220, 330, EASE_OUT(within(at.giant, 0, 1)))} f={f} />
                <Astronaut x={820} y={560 + bob} s={0.55} rot={-10} />
              </>
            ) : (
              <>
                {/* close to the edge of a huge hole: the horizon looks almost flat */}
                <LensedStars lx={540} ly={2900} tE={1900} o={1} />
                <circle cx={540} cy={2900} r={1800} fill="#000" />
                <circle cx={540} cy={2900} r={1800} fill="none" stroke="#fff3d6" strokeWidth={6} opacity={0.9} />
                <circle cx={540} cy={2900} r={1840} fill="none" stroke="#ffb347" strokeWidth={50} opacity={0.18} />
                <text x={80} y={1060} fontFamily={SANS} fontWeight={700} fontSize={30} fill="#fff3d6">THE EDGE</text>
                <Astronaut x={540} y={lerp(640, 1320, drift) + bob * 0.5} s={1.5} rot={lerp(-10, 8, drift)} />
                <Arrow x1={680} y1={lerp(560, 1240, drift)} x2={680} y2={lerp(610, 1290, drift)} color={GREEN} w={7} />
                <Arrow x1={680} y1={lerp(700, 1380, drift)} x2={680} y2={lerp(750, 1430, drift)} color={GREEN} w={7} />
              </>
            )}
          </svg>
          {f < cue(at.cross)
            ? <Card top="A SUPERMASSIVE ONE" sub="Sagittarius A*: 4.3 million Suns" color="#ffb347" y={210} o={EASE_OUT(within(at.giant, 0.1, 0.35))} />
            : <Card top="NO STRETCH. NOTHING." sub="you just drift across" color={GREEN} y={210} o={EASE_OUT(within(at.cross, 0.1, 0.35))} />}
        </AbsoluteFill>
      )}

      {/* ---------------- a friend watching: slower, redder, frozen ---------------- */}
      {sFriend > 0.001 && (
        <AbsoluteFill style={{ opacity: sFriend, background: '#000' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <LensedStars lx={540} ly={2900} tE={1900} o={1} />
            <circle cx={540} cy={2900} r={1800} fill="#000" />
            <circle cx={540} cy={2900} r={1800} fill="none" stroke="#fff3d6" strokeWidth={6} opacity={0.9} />
            <circle cx={540} cy={2900} r={1840} fill="none" stroke="#ffb347" strokeWidth={50} opacity={0.18} />
            <Ship x={190} y={420} s={1.1} />
            <line x1={260} y1={450} x2={540} y2={lerp(700, 1050, approach)} stroke="#9fd0ff" strokeWidth={3} strokeDasharray="8 10" opacity={0.6} />
            <text x={110} y={520} fontFamily={SANS} fontWeight={700} fontSize={28} fill="#9fd0ff">YOUR FRIEND</text>
            <Astronaut x={540} y={lerp(700, 1050, approach)} s={1.5} tint={tint} o={1 - 0.75 * red} />
            <Clock x={820} y={lerp(640, 990, approach)} r={70} turns={turns} tint={tint} />
          </svg>
          <div style={{ position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#9fc8ea' }}>WHAT YOUR FRIEND SEES</div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 80, color: red > 0.6 ? ALERT : '#fff', textShadow: '0 6px 30px #000' }}>
              {red < 0.15 ? 'FALLING...' : red < 0.45 ? 'SLOWER...' : red < 0.75 ? 'REDDER...' : 'FROZEN'}</div>
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- inside: every path to the centre ---------------- */}
      {sIn > 0.001 && (
        <AbsoluteFill style={{ opacity: sIn, background: '#000' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <radialGradient id="inside" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor="#2a0a04" /><stop offset="0.7" stopColor="#0a0302" /><stop offset="1" stopColor="#000" />
              </radialGradient>
            </defs>
            <circle cx={540} cy={1000} r={470} fill="url(#inside)" stroke="#fff3d6" strokeWidth={5} />
            {Array.from({ length: 36 }, (_, i) => {
              const a = (i / 36) * Math.PI * 2; const t = ((f * 0.012 + (i % 6) / 6) % 1);
              const d = lerp(440, 40, t);
              return <Arrow key={i} x1={540 + Math.cos(a) * d} y1={1000 + Math.sin(a) * d} x2={540 + Math.cos(a) * (d - 46)}
                y2={1000 + Math.sin(a) * (d - 46)} color="#ffb347" w={4} o={0.75 * (1 - t * 0.5)} />;
            })}
            <circle cx={540} cy={1000} r={14 + 4 * Math.sin(f / 4)} fill="#fff" />
            <circle cx={540} cy={1000} r={46} fill="#fff" opacity={0.15} />
            {f >= cue(at.light) && Array.from({ length: 8 }, (_, i) => {
              // light leaving outward turns back
              const t = within(at.light, 0, 1); const a = (i / 8) * Math.PI * 2 + 0.3;
              const out = 200 + 200 * Math.sin(Math.min(1, t * 1.3) * Math.PI) ; const sw = 0.6 * Math.min(1, t * 1.3);
              const x = 540 + Math.cos(a + sw) * out; const y = 1000 + Math.sin(a + sw) * out;
              return <path key={i} d={`M ${540 + Math.cos(a) * 200} ${1000 + Math.sin(a) * 200} Q ${540 + Math.cos(a + sw / 2) * (out + 60)} ${1000 + Math.sin(a + sw / 2) * (out + 60)} ${x} ${y}`}
                stroke="#fff3c4" strokeWidth={5} fill="none" opacity={0.9} />;
            })}
            {f < cue(at.light) && <Astronaut x={540 + 300 * Math.cos(f / 25) * (1 - within(at.inside, 0, 1) * 0.7)}
              y={1000 + 300 * Math.sin(f / 25) * (1 - within(at.inside, 0, 1) * 0.7)} s={0.7} rot={f * 2} />}
          </svg>
          {f < cue(at.light)
            ? <Card top="EVERY PATH → THE CENTRE" sub="inside the edge" color="#ffb347" y={210} o={EASE_OUT(within(at.inside, 0.15, 0.4))} />
            : <Card top="NOT EVEN LIGHT GETS OUT" color={ALERT} y={210} o={1} />}
        </AbsoluteFill>
      )}

      {loopT > 0.001 && <AbsoluteFill style={{ opacity: loopT }}>{hookScene('loop')}</AbsoluteFill>}

      {(() => {
        const o = Math.max(sHook, prog(f, END - 22, END - 4));
        return (
          <>
            <div style={{ position: 'absolute', top: 160, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
              fontSize: 82, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.9)', opacity: o }}>
              {hook.top}<br /><span style={{ color: ROUTE }}>{hook.bottom}</span>
            </div>
            <div style={{ position: 'absolute', top: 1410, left: 0, right: 0, textAlign: 'center', opacity: o,
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

export default BHFall;
