import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import { BHShader } from '../geo/BHShader';
import { MONO, ROUTE, SANS, lerp } from '../geo/parts';
import { ShaderSun } from '../geo/ShaderSun';
import { Flash, Scene } from '../geo/Trans';
import { Counter, GlobeAt, Headline, LH, LW, LongFrame, LongProps, Stamp, Stars, timeline } from './LongKit';

// Chapter 1 - how to make a black hole: light that can't escape, Schwarzschild's
// 1916 solution, squeezing the Sun to ~6 km and Earth to a marble, and Earth
// still orbiting a black-hole Sun, in the cold and the dark.
export const compositionConfig = {
  id: 'BHLMake',
  durationInSeconds: 52,
  fps: 30,
  width: 1920,
  height: 1080,
};

const BHLMake: React.FC<Partial<LongProps>> = ({ vo = [], at, durationInSeconds = 52, chapter = 1, chapterName = '' }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const { cue, within, END } = timeline(f, vo, durationInSeconds);
  const C = { x: LW / 2, y: 520 };

  return (
    <LongFrame vo={vo} dur={durationInSeconds} chapter={chapter} name={chapterName}>
      {/* nothing escapes, not even light */}
      <Scene f={f} a={0} b={cue(at.maths)} kind="zoom">
        <Stars drift={f * 0.3} />
        <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
          {Array.from({ length: 9 }, (_, i) => {
            const y0 = 260 + i * 60; const t = prog(f, 10 + i * 6, 70 + i * 6); const pull = (y0 - C.y) * -0.9;
                        const caught = Math.abs(y0 - C.y) < 170;
            const path = caught ? `M -50 ${y0} Q ${C.x - 200} ${y0} ${C.x} ${C.y}` : `M -50 ${y0} Q ${C.x} ${y0 + pull * 0.35} ${LW + 50} ${y0 + pull * 0.6}`;
            return <path key={i} d={path} stroke={ROUTE} strokeWidth={4} fill="none" strokeDasharray="2400" strokeDashoffset={2400 * (1 - t)} opacity={caught ? 1 : 0.55}
              />;
          })}
          <circle cx={C.x} cy={C.y} r={120} fill="#000" />
          <circle cx={C.x} cy={C.y} r={126} fill="none" stroke="#ffd38a" strokeWidth={4} opacity={0.7} />
        </svg>
        <Headline text="NOTHING ESCAPES" sub="NOT EVEN LIGHT" top={700} size={72} o={EASE_OUT(within(0, 0.3, 0.5))} />
      </Scene>

      {/* 1916: Schwarzschild */}
      <Scene f={f} a={cue(at.maths)} b={cue(at.squeeze)} kind="push">
        <AbsoluteFill style={{ background: 'linear-gradient(135deg, #1b1610, #050505)' }} />
        <div style={{ position: 'absolute', left: 1120, top: 170, width: 680, height: 600, background: '#efe6cf', borderRadius: 8, transform: 'rotate(3deg)',
          boxShadow: '0 30px 80px #000', padding: '40px 46px', fontFamily: 'Georgia, serif', color: '#2b2418' }}>
          <div style={{ fontSize: 30, fontStyle: 'italic' }}>Über das Gravitationsfeld eines Massenpunktes…</div>
          <div style={{ fontSize: 40, marginTop: 50, opacity: EASE_OUT(within(at.maths, 0.15, 0.45)) }}>ds² = (1 − α/R) dt² − …</div>
          <div style={{ fontSize: 40, marginTop: 30, opacity: EASE_OUT(within(at.maths, 0.3, 0.6)) }}>R = (r³ + α³)<sup>1/3</sup></div>
          <svg width={660} height={200} style={{ marginTop: 30 }}>
            <path d={`M 10 150 Q 200 ${150 - 120 * EASE_OUT(within(at.maths, 0.4, 0.9))} 330 40 T 650 120`} stroke="#2b2418" strokeWidth={3} fill="none" />
          </svg>
        </div>
        <Headline text="1916" sub="KARL SCHWARZSCHILD" top={240} size={140} align="left" left={130} />
        <div style={{ position: 'absolute', left: 130, top: 540, width: 900, fontFamily: SANS, fontWeight: 800, fontSize: 36, color: '#cfd6e3',
          opacity: EASE_OUT(within(at.maths, 0.45, 0.65)) }}>SOLVED WHILE SERVING IN THE ARMY IN WORLD WAR I</div>
      </Scene>

      {/* squeeze anything */}
      <Scene f={f} a={cue(at.squeeze)} b={cue(at.sun)} kind="zoom">
        <Stars drift={f * 0.3} />
        <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
          {(() => { const s = EASE_INOUT(within(at.squeeze, 0.1, 0.95)); const gap = lerp(330, 40, s);
            return <g>
              <circle cx={C.x} cy={C.y} r={lerp(300, 30, s)} fill={`rgb(${lerp(120, 10, s)},${lerp(140, 10, s)},${lerp(180, 20, s)})`} stroke="#9fb3c8" strokeWidth={4} />
              {[-1, 1].map((d) => <g key={d}>
                <rect x={C.x + d * gap - (d > 0 ? 0 : 60)} y={160} width={60} height={720} rx={8} fill="#6b7385" stroke="#000" strokeWidth={4} />
                <path d={`M ${C.x + d * (gap + 160)} ${C.y} L ${C.x + d * (gap + 80)} ${C.y}`} stroke={ROUTE} strokeWidth={14} />
                <path d={`M ${C.x + d * (gap + 80)} ${C.y - 26} L ${C.x + d * (gap + 60)} ${C.y} L ${C.x + d * (gap + 80)} ${C.y + 26} Z`} fill={ROUTE} />
              </g>)}
            </g>; })()}
        </svg>
        <Headline text="SQUEEZE ANYTHING HARD ENOUGH" top={70} size={64} />
      </Scene>

      {/* the Sun to 6 km */}
      <Scene f={f} a={cue(at.sun)} b={cue(at.earth)} kind="whip">
        <Stars drift={f * 0.3} />
        {(() => { const s = EASE_INOUT(within(at.sun, 0.25, 0.8)); const km = Math.round(Math.exp(lerp(Math.log(1391400), Math.log(6), s)));
          return <>
            {s < 0.97 && <div style={{ position: 'absolute', inset: 0, opacity: 1 - prog(s, 0.85, 0.97) }}>
              <ShaderSun x={C.x} y={C.y} size={lerp(900, 30, s)} res={360} zoom={0.62} speed={1.3} /></div>}
            {s > 0.9 && <div style={{ position: 'absolute', inset: 0, opacity: prog(s, 0.9, 1) }}>
              <BHShader x={C.x - 200} y={C.y - 200} w={400} h={400} res={220} tilt={0.3} dist={20} round /></div>}
            <Counter value={`${km.toLocaleString('en-US')} km`} label="ACROSS" x={C.x} y={780} />
          </>; })()}
        <Flash f={f} at={Math.round(lerp(cue(at.sun), cue(at.earth), 0.8))} len={6} />
      </Scene>

      {/* Earth to a marble */}
      <Scene f={f} a={cue(at.earth)} b={cue(at.orbit)} kind="zoom">
        <Stars drift={f * 0.3} />
        {(() => { const s = EASE_INOUT(within(at.earth, 0.15, 0.6)); return <>
          {s < 1 && <GlobeAt x={C.x - 300 * s} y={C.y} R={lerp(380, 8, s)} lon0={20 - f * 0.4} lat0={15} id="em" />}
          <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
            {s >= 1 && <g opacity={EASE_OUT(within(at.earth, 0.6, 0.75))}>
              <circle cx={C.x - 300} cy={C.y} r={26} fill="#000" stroke="#ffd38a" strokeWidth={3} />
              <defs><radialGradient id="marble" cx="0.35" cy="0.3"><stop offset="0" stopColor="#bfe6ff" /><stop offset="1" stopColor="#1d5fa8" /></radialGradient></defs>
              <circle cx={C.x + 220} cy={C.y} r={70} fill="url(#marble)" stroke="#0b2a4a" strokeWidth={4} />
              <ellipse cx={C.x + 196} cy={C.y - 24} rx={20} ry={10} fill="#fff" opacity={0.7} />
              <text x={C.x + 220} y={C.y + 130} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={36} fill="#cfe6ff">A MARBLE</text>
              <text x={C.x - 300} y={C.y + 90} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={36} fill="#fff">EARTH</text>
            </g>}
          </svg>
          <Counter value={s < 1 ? `${Math.round(lerp(6371, 0, s)).toLocaleString('en-US')} km` : '9 mm'} label="RADIUS" x={C.x} y={780} />
        </>; })()}
      </Scene>

      {/* Earth would not fall in */}
      <Scene f={f} a={cue(at.orbit)} b={cue(at.find)} kind="push">
        <Stars drift={f * 0.2} />
        {(() => { const a = f / 30 * 0.9; const ex = C.x + Math.cos(a) * 560; const ey = C.y + Math.sin(a) * 250;
          const dark = EASE_INOUT(within(at.dark, 0.1, 0.8)); const isBH = f >= cue(at.orbit);
          return <>
            <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
              <ellipse cx={C.x} cy={C.y} rx={560} ry={250} fill="none" stroke="#9fd0ff" strokeWidth={3} strokeDasharray="10 12" />
            </svg>
            {isBH && <BHShader x={C.x - 170} y={C.y - 170} w={340} h={340} res={200} tilt={1.2} dist={22} round />}
            <GlobeAt x={ex} y={ey} R={60} lon0={-f} lat0={10} id="eo" night={dark} frost={dark * 0.8} />
            {f < cue(at.dark) && <Stamp text="EARTH DOES NOT FALL IN" t={within(at.orbit, 0.45, 0.8)} top={80} size={60} />}
            {f >= cue(at.dark) && <Headline text="JUST COLD" sub="AND DARK" top={80} size={70} subColor="#9fd0ff" o={EASE_OUT(within(at.dark, 0.2, 0.4))} />}
          </>; })()}
      </Scene>

      {/* how do we find them? */}
      <Scene f={f} a={cue(at.find)} b={END + 30} kind="zoom">
        <Stars drift={f * 0.3} />
        <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
          {(() => { const t = within(at.find, 0, 1); const x = lerp(400, 1500, (Math.sin(t * Math.PI * 1.5) + 1) / 2); const y = 500 + 120 * Math.sin(t * 7);
            return <g><circle cx={x} cy={y} r={150} fill="none" stroke={ROUTE} strokeWidth={8} />
              <line x1={x + 106} y1={y + 106} x2={x + 220} y2={y + 220} stroke={ROUTE} strokeWidth={22} strokeLinecap="round" /></g>; })()}
        </svg>
        <Headline text="HOW DO WE FIND THEM?" top={80} size={80} />
        <div style={{ position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 40, color: ROUTE }}>?</div>
      </Scene>
    </LongFrame>
  );
};

export default BHLMake;
