import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE_INOUT, EASE_OUT } from '../../lib/shorts';
import { BHShader } from '../geo/BHShader';
import { ROUTE, SANS, lerp } from '../geo/parts';
import { Scene } from '../geo/Trans';
import { Counter, Headline, LH, LW, LongFrame, LongProps, Stars, timeline } from './LongKit';

// Chapter 3 - how big can they get: TON 618, ~40 billion Suns. To scale: its
// edge is ~1,630 au across (3.0 km x 40.7e9 per side), so light needs 9+ days to
// cross; Neptune's whole orbit (~60 au) is a speck beside it.
export const compositionConfig = {
  id: 'BHLBig',
  durationInSeconds: 24,
  fps: 30,
  width: 1920,
  height: 1080,
};

const BHLBig: React.FC<Partial<LongProps>> = ({ vo = [], at, durationInSeconds = 24, chapter = 3, chapterName = '' }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const { cue, within, END } = timeline(f, vo, durationInSeconds);
  const D = 1500;                                       // horizon diameter on screen, px (= 1,632 au)
  const pxPerAu = D / 1632;
  const C = { x: LW / 2, y: 560 };

  return (
    <LongFrame vo={vo} dur={durationInSeconds} chapter={chapter} name={chapterName}>
      <Scene f={f} a={0} b={cue(at.cross)} kind="zoom">
        <AbsoluteFill style={{ background: '#000' }} />
        <BHShader x={0} y={0} w={LW} h={LH} res={380} tilt={0.18} dist={lerp(30, 19, EASE_OUT(within(0, 0, 1)))} />
        <Headline text="TON 618" top={70} size={110} />
        <Counter value={`${Math.round(40 * EASE_OUT(within(0, 0.4, 0.85)))} BILLION`} label="TIMES THE SUN'S MASS" x={C.x} y={800} size={80}
          o={EASE_OUT(within(0, 0.35, 0.5))} />
      </Scene>

      {/* light needs 9 days to cross it; the solar system is a speck */}
      <Scene f={f} a={cue(at.cross)} b={cue(at.almost)} kind="push">
        <Stars drift={f * 0.15} />
        <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
          <defs><radialGradient id="hz"><stop offset="0.9" stopColor="#000" /><stop offset="0.97" stopColor="#ff9a3c" stopOpacity={0.5} /><stop offset="1" stopColor="#000" stopOpacity={0} /></radialGradient></defs>
          <circle cx={C.x} cy={C.y + D / 2 - 160} r={D / 2 + 20} fill="url(#hz)" />
          <circle cx={C.x} cy={C.y + D / 2 - 160} r={D / 2} fill="#000" stroke="#ffb46b" strokeWidth={3} />
          {(() => { const t = EASE_INOUT(within(at.cross, 0.1, 0.9)); const x = lerp(C.x - D / 2, C.x + D / 2, t); const y = C.y - 160 + 10;
            return f < cue(at.speck) ? <g>
              <line x1={C.x - D / 2} y1={y} x2={x} y2={y} stroke={ROUTE} strokeWidth={6} />
              <circle cx={x} cy={y} r={14} fill="#fffbe0" /><circle cx={x} cy={y} r={34} fill={ROUTE} opacity={0.25} />
            </g> : null; })()}
          {f >= cue(at.speck) && (() => { const o = EASE_OUT(within(at.speck, 0, 0.3)); const r = 30 * pxPerAu;   // Neptune ~30 au
            const sx = C.x; const sy = C.y - 160 - 120;
            return <g opacity={o}>
              <circle cx={sx} cy={sy} r={r} fill="none" stroke="#9fd0ff" strokeWidth={3} />
              <circle cx={sx} cy={sy} r={3} fill={ROUTE} />
              <line x1={sx + r + 6} y1={sy - 4} x2={sx + 200} y2={sy - 90} stroke="#fff" strokeWidth={3} />
              <text x={sx + 210} y={sy - 96} fontFamily={SANS} fontWeight={800} fontSize={40} fill="#fff">OUR WHOLE SOLAR SYSTEM</text>
              <text x={sx + 210} y={sy - 52} fontFamily={SANS} fontWeight={700} fontSize={26} fill="#9fb3c8">out to Neptune, to scale</text>
            </g>; })()}
        </svg>
        {f < cue(at.speck) && <Counter value={`${(9.4 * EASE_INOUT(within(at.cross, 0.1, 0.9))).toFixed(1)} DAYS`} label="FOR LIGHT TO CROSS IT" x={C.x} y={70} size={84} />}
        {f >= cue(at.speck) && <Headline text="A SPECK" top={70} size={96} color={ROUTE} />}
      </Scene>

      {/* almost a black hole */}
      <Scene f={f} a={cue(at.almost)} b={END + 30} kind="zoom">
        <Stars drift={f * 0.3} />
        <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
          <defs><radialGradient id="dying"><stop offset="0" stopColor="#fff" /><stop offset="0.3" stopColor="#ffb46b" /><stop offset="1" stopColor="#ff5a14" stopOpacity={0} /></radialGradient></defs>
          {(() => { const p = 1 + 0.18 * Math.sin(f / 2.2) * EASE_OUT(within(at.almost, 0.2, 1)); const r = lerp(300, 160, EASE_INOUT(within(at.almost, 0.2, 1)));
            return <circle cx={C.x} cy={C.y} r={r * p} fill="url(#dying)" />; })()}
        </svg>
        <Headline text="ALMOST A BLACK HOLE" sub="BUT NOT QUITE?" top={70} size={76} />
      </Scene>
    </LongFrame>
  );
};

export default BHLBig;
