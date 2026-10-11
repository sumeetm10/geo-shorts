import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import { Atlas } from '../geo/Atlas';
import { BHShader } from '../geo/BHShader';
import { ALERT, ROUTE, SANS, lerp } from '../geo/parts';
import { ShaderSun } from '../geo/ShaderSun';
import { Flash, Scene } from '../geo/Trans';
import { Headline, LH, LW, LongFrame, LongProps, Stars, timeline } from './LongKit';

// Chapter 0 - the cold open: the ray-traced hole, Atlas drifting in, the promise
// of two true answers, and the turn to the Sun.
export const compositionConfig = {
  id: 'BHLOpen',
  durationInSeconds: 20,
  fps: 30,
  width: 1920,
  height: 1080,
};

const BHLOpen: React.FC<Partial<LongProps>> = ({ vo = [], at, durationInSeconds = 20, chapter = 0, chapterName = '' }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const { cue, within, END } = timeline(f, vo, durationInSeconds);
  const split = EASE_OUT(within(at.versions, 0, 0.25));
  const dive = EASE_INOUT(within(at.promise, 0, 1));

  return (
    <LongFrame vo={vo} dur={durationInSeconds} chapter={chapter} name={chapterName}>
      <Scene f={f} a={0} b={cue(at.sun)} kind="zoom">
        <AbsoluteFill style={{ background: '#000' }} />
        <BHShader x={0} y={0} w={LW} h={LH} res={380} tilt={0.13} dist={lerp(26, 17, EASE_OUT(prog(f, 0, cue(at.versions)))) - 4 * dive} />
        <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
          {split <= 0 && (() => { const t = prog(f, 0, cue(at.versions));
            return <g transform={`translate(${lerp(260, 640, t)} ${lerp(300, 470, t)}) rotate(${-20 + f * 0.6})`}>
              <Atlas x={0} y={60} s={lerp(1.6, 1.1, t)} t={f * 0.3} walking={0.4} mood="shocked" /></g>; })()}
          {split > 0 && dive <= 0.02 && <g opacity={split}>
            <line x1={LW / 2} y1={0} x2={LW / 2} y2={LH} stroke="#fff" strokeWidth={4} strokeDasharray="14 12" />
            {/* left: you fall straight through */}
            {(() => { const t = within(at.versions, 0.05, 0.5);
              return <g opacity={1 - prog(t, 0.75, 1)} transform={`translate(${lerp(560, 860, t)} ${lerp(380, 520, t)}) rotate(${-30 + 60 * t}) scale(${lerp(1, 0.25, t)})`}>
                <Atlas x={0} y={60} s={1.2} t={f * 0.3} walking={0.3} mood="shocked" /></g>; })()}
            {/* right: seen from outside, stuck at the edge, reddening */}
            {(() => { const t = within(at.versions, 0.4, 1); const red = prog(t, 0.2, 1);
              return <g opacity={1 - 0.6 * red} style={{ filter: `sepia(${red}) hue-rotate(${-30 * red}deg) saturate(${1 + 2 * red})` }}
                transform={`translate(${lerp(1250, 1180, EASE_OUT(t))} ${lerp(380, 470, EASE_OUT(t))}) rotate(-10)`}>
                <Atlas x={0} y={60} s={1.2} t={8} walking={0} mood="shocked" /></g>; })()}
          </g>}
        </svg>
        {split <= 0 && <Headline text="WHAT HAPPENS IF YOU FALL IN?" top={90} size={70} o={EASE_OUT(prog(f, 3, 14))} />}
        {split <= 0 && f >= cue(at.strange) && (
          <Headline text="TWO THINGS HAPPEN." sub="BOTH ARE TRUE." top={760} size={64} o={EASE_OUT(within(at.strange, 0.1, 0.3))} />
        )}
        {split > 0 && dive <= 0.02 && <>
          <div style={{ position: 'absolute', top: 110, left: 0, width: LW / 2, textAlign: 'center', opacity: split }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 28, letterSpacing: 5, color: ROUTE }}>VERSION 1</div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 58, color: '#fff', textShadow: '0 4px 20px #000' }}>YOU FALL THROUGH</div>
          </div>
          <div style={{ position: 'absolute', top: 110, left: LW / 2, width: LW / 2, textAlign: 'center', opacity: EASE_OUT(within(at.versions, 0.4, 0.55)) }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 28, letterSpacing: 5, color: ALERT }}>VERSION 2</div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 58, color: '#fff', textShadow: '0 4px 20px #000' }}>FROZEN AT THE EDGE</div>
          </div>
        </>}
        {dive > 0.02 && <Headline text="BY THE END OF THIS VIDEO" sub="YOU'LL KNOW HOW BOTH ARE TRUE" top={90} size={64} o={EASE_OUT(within(at.promise, 0.05, 0.3))} />}
      </Scene>
      <Flash f={f} at={cue(at.versions)} len={6} />

      <Scene f={f} a={cue(at.sun)} b={END + 30} kind="whip">
        <Stars drift={f * 0.4} />
        <ShaderSun x={1240} y={560} size={lerp(700, 860, within(at.sun, 0, 1))} res={360} zoom={0.62} speed={1.3} />
        <Headline text="IT STARTS" sub="WITH THE SUN" top={360} size={110} align="left" left={150} o={EASE_OUT(within(at.sun, 0.05, 0.3))} />
      </Scene>
    </LongFrame>
  );
};

export default BHLOpen;
