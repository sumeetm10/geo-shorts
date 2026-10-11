import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import { Atlas } from '../geo/Atlas';
import { BHShader } from '../geo/BHShader';
import { ALERT, ROUTE, SANS, lerp } from '../geo/parts';
import { Flash, Scene } from '../geo/Trans';
import { Headline, LH, LW, LongFrame, LongProps, Stamp, Stars, timeline } from './LongKit';

// Chapter 6 - the fall (the payoff): tidal stretch at a small hole, spaghettified
// before its edge; at a supermassive hole you cross the edge unharmed; then the
// split - your view (straight through) vs a distant friend's (you slow, freeze,
// redden and fade at the edge) - both true; no way out; the singularity.
export const compositionConfig = {
  id: 'BHLFall',
  durationInSeconds: 51,
  fps: 30,
  width: 1920,
  height: 1080,
};

const Clock: React.FC<{ x: number; y: number; r: number; turns: number; color: string }> = ({ x, y, r, turns, color }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill="#0b1224" stroke={color} strokeWidth={6} />
    {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <line key={i} x1={Math.sin(a) * r * 0.78} y1={-Math.cos(a) * r * 0.78} x2={Math.sin(a) * r * 0.92} y2={-Math.cos(a) * r * 0.92} stroke="#cfd6e3" strokeWidth={3} />; })}
    <line x1={0} y1={0} x2={Math.sin(turns * Math.PI * 2) * r * 0.75} y2={-Math.cos(turns * Math.PI * 2) * r * 0.75} stroke={color} strokeWidth={6} strokeLinecap="round" />
    <circle r={6} fill="#fff" />
  </g>
);

const Arrow: React.FC<{ x: number; y: number; len: number; color: string }> = ({ x, y, len, color }) => (
  <g>
    <line x1={x} y1={y} x2={x + len} y2={y} stroke={color} strokeWidth={10} strokeLinecap="round" />
    <path d={`M ${x + len} ${y - 18} L ${x + len + 26} ${y} L ${x + len} ${y + 18} Z`} fill={color} />
  </g>
);

const BHLFall: React.FC<Partial<LongProps>> = ({ vo = [], at, durationInSeconds = 51, chapter = 6, chapterName = '' }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const { cue, within, END } = timeline(f, vo, durationInSeconds);
  const H0 = { x: 1450, y: 500 };                      // the small hole

  // the split-screen clock: yours runs; the friend's view slows toward a stop
  const tYou = (f - cue(at.split)) / 30 * 0.5;
  const slow = (k: number) => 1 - Math.exp(-k * 1.4);
  const tFriend = slow(Math.max(0, (f - cue(at.split)) / 30)) * 0.9;

  return (
    <LongFrame vo={vo} dur={durationInSeconds} chapter={chapter} name={chapterName}>
      {/* a small hole: stretch, then spaghetti - before the edge */}
      <Scene f={f} a={0} b={cue(at.giant)} kind="zoom">
        <Stars drift={f * 0.2} />
        <BHShader x={H0.x - 230} y={H0.y - 230} w={460} h={460} res={220} tilt={0.3} dist={18} round />
        <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
          {f >= cue(at.before) && <circle cx={H0.x} cy={H0.y} r={70} fill="none" stroke="#fff" strokeWidth={4} strokeDasharray="10 10" opacity={EASE_OUT(within(at.before, 0, 0.3))} />}
          {f >= cue(at.before) && <text x={H0.x} y={H0.y + 250} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={34} fill="#fff" opacity={EASE_OUT(within(at.before, 0.1, 0.3))}>THE EDGE</text>}
          {(() => {
            const st = EASE_INOUT(prog(f, cue(at.spag), cue(at.before) + 20));     // 0 normal -> 1 noodle
            const x = lerp(520, 1080, EASE_INOUT(prog(f, 0, cue(at.before) + 40)));
            return <g>
              <g transform={`translate(${x} 520) rotate(-90) scale(${lerp(1, 0.35, st)} ${lerp(1, 3.6, st)})`}>
                <Atlas x={0} y={60} s={1.6} t={f * 0.2} walking={0.2} mood="shocked" />
              </g>
              {f < cue(at.spag) + 10 && <g opacity={EASE_OUT(within(0, 0.3, 0.5))}>
                <Arrow x={x + 140} y={470} len={lerp(40, 220, within(0, 0.4, 0.8))} color={ALERT} />
                <Arrow x={x - 200} y={570} len={50} color="#9fd0ff" />
                <text x={x + 150} y={420} fontFamily={SANS} fontWeight={800} fontSize={30} fill={ALERT}>FEET: PULLED HARDER</text>
                <text x={x - 260} y={640} fontFamily={SANS} fontWeight={800} fontSize={30} fill="#9fd0ff">HEAD</text>
              </g>}
            </g>;
          })()}
        </svg>
        {f >= cue(at.spag) && f < cue(at.before) && <Headline text="SPAGHETTIFICATION" sub="YES, THAT'S THE REAL NAME" top={70} size={84} o={EASE_OUT(within(at.spag, 0.3, 0.5))} />}
        {f >= cue(at.before) && <Headline text="BEFORE YOU EVEN" sub="REACH THE EDGE" top={70} size={76} subColor={ALERT} />}
      </Scene>

      {/* a supermassive hole: cross the edge, notice nothing */}
      <Scene f={f} a={cue(at.giant)} b={cue(at.split)} kind="whip">
        <AbsoluteFill style={{ background: '#000' }} />
        <BHShader x={0} y={180} w={LW} h={LH} res={340} tilt={0.5} dist={14} />
        <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
          <path d={`M 0 640 Q ${LW / 2} 520 ${LW} 640`} stroke="#fff" strokeWidth={4} strokeDasharray="14 12" fill="none" />
          <text x={1700} y={600} fontFamily={SANS} fontWeight={800} fontSize={32} fill="#fff">THE EDGE</text>
          <g transform={`translate(${LW / 2} ${lerp(300, 820, EASE_INOUT(within(at.giant, 0.1, 0.95)))}) rotate(-6)`}>
            <Atlas x={0} y={60} s={1.8} t={f * 0.3} walking={0.4} mood="walk" />
          </g>
        </svg>
        <Headline text="A SUPERMASSIVE ONE?" top={60} size={72} />
        <Stamp text="YOU'D NOTICE NOTHING" t={within(at.giant, 0.6, 0.9)} top={300} size={60} />
      </Scene>

      {/* the split: your view vs a friend far away */}
      <Scene f={f} a={cue(at.split)} b={cue(at.inside)} kind="zoom">
        <AbsoluteFill style={{ background: '#000' }} />
        <Stars drift={0} o={0.5} />
        <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
          <line x1={LW / 2} y1={140} x2={LW / 2} y2={880} stroke="#fff" strokeWidth={4} strokeDasharray="14 12" opacity={EASE_OUT(within(at.split, 0.1, 0.4))} />
          {[0, 1].map((side) => { const cx = side ? 1440 : 480;
            return <g key={side}>
              <circle cx={cx} cy={860} r={330} fill="#000" stroke="#ffb46b" strokeWidth={5} />
              <ellipse cx={cx} cy={540} rx={420} ry={40} fill="none" stroke="#ff9a3c" strokeWidth={3} opacity={0.4} />
            </g>; })}
          {/* left: you - straight through */}
          {f >= cue(at.you) && (() => {
            const y = lerp(220, 760, Math.min(1, prog(f, cue(at.you), cue(at.friend) + 30)));
            return <g>
              <g transform={`translate(480 ${y})`}><Atlas x={0} y={0} s={1.4} t={f * 0.3} walking={0.3} mood="walk" /></g>
              <Clock x={180} y={300} r={60} turns={tYou} color="#9fd0ff" />
            </g>; })()}
          {/* right: the friend's view - slowing, freezing, reddening, fading */}
          {f >= cue(at.friend) && (() => { const k = slow((f - cue(at.friend)) / 30); const y = lerp(220, 520, k);
            const red = prog(f, cue(at.frozen), cue(at.both)); const fadeOut = 0.15 + 0.85 * (1 - prog(f, cue(at.frozen), cue(at.inside)));
            return <g opacity={fadeOut} style={{ filter: `sepia(${red}) saturate(${1 + 3 * red}) hue-rotate(${-25 * red}deg)` }}>
              <g transform={`translate(1440 ${y})`}><Atlas x={0} y={0} s={1.4} t={f * 0.3 * (1 - k) + 40 * k} walking={0.3 * (1 - k)} mood="shocked" /></g>
              <Clock x={1740} y={300} r={60} turns={tFriend} color={ALERT} />
            </g>; })()}
        </svg>
        <div style={{ position: 'absolute', top: 70, left: 0, width: LW / 2, textAlign: 'center', opacity: EASE_OUT(within(at.you, 0, 0.3)) }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 26, letterSpacing: 5, color: ROUTE }}>YOUR VIEW</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 52, color: '#fff' }}>STRAIGHT THROUGH</div>
        </div>
        <div style={{ position: 'absolute', top: 70, left: LW / 2, width: LW / 2, textAlign: 'center', opacity: EASE_OUT(within(at.friend, 0, 0.3)) }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 26, letterSpacing: 5, color: ALERT }}>A FRIEND FAR AWAY SEES</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 52, color: '#fff' }}>{f >= cue(at.frozen) ? 'FROZEN AT THE EDGE' : 'YOU SLOW DOWN...'}</div>
        </div>
        <Stamp text="BOTH ARE TRUE" t={within(at.both, 0.05, 0.4)} top={360} size={84} color={ROUTE} rot={-4} />
      </Scene>
      <Flash f={f} at={cue(at.both)} len={6} />

      {/* no way out; the singularity */}
      <Scene f={f} a={cue(at.inside)} b={END + 30} kind="zoom">
        <AbsoluteFill style={{ background: '#000' }} />
        <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
          {Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2; const t = ((f / 40 + i * 0.13) % 1);
            const r0 = lerp(560, 30, t); const r1 = r0 - 60;
            return <line key={i} x1={LW / 2 + Math.cos(a) * r0} y1={520 + Math.sin(a) * r0} x2={LW / 2 + Math.cos(a) * Math.max(0, r1)} y2={520 + Math.sin(a) * Math.max(0, r1)}
              stroke={ROUTE} strokeWidth={4} opacity={0.3 + 0.7 * (1 - t)} />; })}
          {f >= cue(at.centre) && <g opacity={EASE_OUT(within(at.centre, 0.5, 0.75))}>
            <circle cx={LW / 2} cy={520} r={6 + 3 * Math.sin(f / 2)} fill="#fff" />
            <circle cx={LW / 2} cy={520} r={40} fill="#fff" opacity={0.12} />
          </g>}
        </svg>
        {f < cue(at.centre) ? <Headline text="NO WAY BACK OUT" top={70} size={86} color={ALERT} /> :
          <Headline text="THE SINGULARITY" sub="CRUSHED INTO AN INFINITELY SMALL POINT" top={70} size={86} o={EASE_OUT(within(at.centre, 0.55, 0.75))} />}
      </Scene>
    </LongFrame>
  );
};

export default BHLFall;
