import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import { BHShader } from '../geo/BHShader';
import { EndCard } from '../geo/EndCard';
import { ALERT, MONO, ROUTE, SANS, lerp, rng } from '../geo/parts';
import { Flash, Scene } from '../geo/Trans';
import { Headline, LH, LW, LongFrame, LongProps, Stars, timeline } from './LongKit';

// Chapter 7 - even black holes die: Hawking radiation (1974), the smallest go
// first, a Sun-mass hole needs more than 10^67 years, the universe is ~14 billion
// years old, every black hole is still waiting; back to the opening shot.
export const compositionConfig = {
  id: 'BHLEnd',
  durationInSeconds: 40,
  fps: 30,
  width: 1920,
  height: 1080,
};

const DOTS = (() => { const r = rng(1974); return Array.from({ length: 14 }, () => [140 + r() * 1000, 240 + r() * 520, r()]); })();

const BHLEnd: React.FC<Partial<LongProps>> = ({ vo = [], at, durationInSeconds = 40, chapter = 7, chapterName = '' }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const { cue, within, END, last } = timeline(f, vo, durationInSeconds);
  const C = { x: LW / 2, y: 520 };

  return (
    <LongFrame vo={vo} dur={durationInSeconds} chapter={chapter} name={chapterName}>
      <Scene f={f} a={0} b={cue(at.hawking)} kind="zoom">
        <AbsoluteFill style={{ background: '#000' }} />
        <BHShader x={0} y={0} w={LW} h={LH} res={340} tilt={0.14} dist={20} />
        <Headline text="THE FINAL TWIST" sub="BLACK HOLES DON'T LAST FOREVER" top={150} size={84} subColor={ALERT} o={EASE_OUT(prog(f, 4, 18))} />
      </Scene>

      {/* Hawking radiation: leaking, shrinking */}
      <Scene f={f} a={cue(at.hawking)} b={cue(at.small)} kind="push">
        <Stars drift={f * 0.2} />
        {(() => { const s = lerp(460, 300, EASE_INOUT(within(at.hawking, 0.2, 1)));
          return <BHShader x={C.x - s / 2} y={C.y - s / 2} w={s} h={s} res={220} tilt={0.3} dist={18} round />; })()}
        <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
          {Array.from({ length: 36 }, (_, i) => { const a = i * 2.39; const t = ((f / 50 + i / 36) % 1);
            return <circle key={i} cx={C.x + Math.cos(a) * lerp(140, 700, t)} cy={C.y + Math.sin(a) * lerp(140, 700, t) * 0.8} r={4} fill="#cfe6ff" opacity={(1 - t) * EASE_OUT(within(at.hawking, 0.3, 0.5))} />; })}
        </svg>
        <Headline text="1974" sub="STEPHEN HAWKING: THEY LEAK, AND SHRINK" top={70} size={96} />
      </Scene>

      {/* the smallest are already gone */}
      <Scene f={f} a={cue(at.small)} b={cue(at.time)} kind="zoom">
        <Stars drift={f * 0.2} />
        <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
          {DOTS.map(([x, y, k], i) => { const pop = within(at.small, 0.08 + (i / DOTS.length) * 0.82, 0.13 + (i / DOTS.length) * 0.82);
            const r = 12 + k * 30;
            return pop >= 1 ? null : <g key={i}>
              <circle cx={x} cy={y} r={r * (1 + 2 * pop)} fill="none" stroke="#cfe6ff" strokeWidth={4} opacity={pop} />
              <circle cx={x} cy={y} r={r * (1 - pop)} fill="#000" stroke="#ffb46b" strokeWidth={3} />
            </g>; })}
        </svg>
        <BHShader x={1440 - 210} y={560 - 210} w={420} h={420} res={200} tilt={0.3} dist={18} round />
        <div style={{ position: 'absolute', left: 1440 - 200, width: 400, top: 790, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 32, color: '#cfd6e3' }}>BIG ONES: STILL HERE</div>
        <div style={{ position: 'absolute', left: 220, top: 790, fontFamily: MONO, fontWeight: 700, fontSize: 40, color: ROUTE }}>
          TINY ONES GONE: {DOTS.filter((_, i) => within(at.small, 0.13 + (i / DOTS.length) * 0.82, 1) > 0).length}</div>
        <Headline text="THE SMALLER," sub="THE FASTER THEY GO" top={70} size={84} />
      </Scene>

      {/* 10^67 years vs 14 billion */}
      <Scene f={f} a={cue(at.time)} b={cue(at.wait)} kind="whip">
        <AbsoluteFill style={{ background: '#05070d' }} />
        {f < cue(at.universe) ? <>
          <div style={{ position: 'absolute', top: 260, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 200, color: '#fff' }}>
            10<sup style={{ fontSize: 110, color: ROUTE }}>67</sup></div>
          <div style={{ position: 'absolute', top: 560, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 48, color: '#cfd6e3' }}>
            YEARS, FOR ONE THE MASS OF OUR SUN</div>
          <div style={{ position: 'absolute', top: 660, left: 100, right: 100, overflow: 'hidden', whiteSpace: 'nowrap', fontFamily: MONO, fontSize: 42, color: '#5a6478' }}>
            <span style={{ display: 'inline-block', transform: `translateX(${-f * 6 % 400}px)` }}>1{'0'.repeat(67)}{'0'.repeat(20)}</span></div>
        </> : <>
          <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
            <circle cx={260} cy={560} r={8} fill={ROUTE} />
            <line x1={260} y1={600} x2={lerp(260, LW + 200, EASE_INOUT(within(at.universe, 0.3, 1)))} y2={600} stroke="#ff9a3c" strokeWidth={14} strokeLinecap="round" />
            <text x={260} y={520} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={34} fill={ROUTE}>THE UNIVERSE SO FAR</text>
            <text x={1100} y={680} fontFamily={SANS} fontWeight={800} fontSize={34} fill="#ff9a3c" opacity={EASE_OUT(within(at.universe, 0.4, 0.6))}>ONE BLACK HOLE'S LIFE → (it doesn't fit)</text>
          </svg>
          <Headline text="14 BILLION YEARS" sub="THE UNIVERSE'S AGE: NOT EVEN A DOT" top={110} size={92} />
        </>}
      </Scene>

      {/* still waiting */}
      <Scene f={f} a={cue(at.wait)} b={cue(last)} kind="zoom">
        <AbsoluteFill style={{ background: '#000' }} />
        <Stars drift={f * 0.1} o={1 - EASE_INOUT(within(at.wait, 0.1, 1)) * 0.9} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.4 + 0.6 * EASE_INOUT(within(at.wait, 0.1, 0.8)) }}>
          <BHShader x={C.x - 300} y={C.y - 300} w={600} h={600} res={260} tilt={0.14} dist={20} round />
        </div>
        <Headline text="STILL WAITING" sub="FOR THE UNIVERSE TO GROW OLD" top={70} size={84} subColor="#9fd0ff" />
      </Scene>

      {/* back to the start: two answers */}
      <Scene f={f} a={cue(last)} b={END + 30} kind="zoom">
        <AbsoluteFill style={{ background: '#000' }} />
        <BHShader x={0} y={0} w={LW} h={LH} res={380} tilt={0.13} dist={lerp(20, 26, within(last, 0, 1))} />
        <Headline text="ONE BLACK HOLE." sub="TWO ANSWERS." top={90} size={92} />
      </Scene>
      <Flash f={f} at={cue(last)} len={6} />
      <EndCard from={cue(last) + 20} to={END - 8} text="" compact />
    </LongFrame>
  );
};

export default BHLEnd;
