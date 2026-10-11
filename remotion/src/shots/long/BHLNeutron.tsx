import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import { BHShader } from '../geo/BHShader';
import { NeutronShader } from '../geo/NeutronShader';
import { ROUTE, lerp } from '../geo/parts';
import { ShaderSun } from '../geo/ShaderSun';
import { Flash, Scene } from '../geo/Trans';
import { Counter, Headline, LH, LW, LongFrame, LongProps, Stars, timeline } from './LongKit';

// Chapter 4 - the almost-black-hole: a supernova leaves a neutron star; more than
// the Sun's mass in ~20 km; a teaspoon outweighs 900 Great Pyramids; add mass and
// it collapses into a black hole.
export const compositionConfig = {
  id: 'BHLNeutron',
  durationInSeconds: 20,
  fps: 30,
  width: 1920,
  height: 1080,
};

const Pyramid: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -30 0 L 0 -26 L 30 0 Z" fill="#d9b26a" stroke="#6b4f1d" strokeWidth={2} />
    <path d="M 0 -26 L 30 0 L 8 0 Z" fill="#b58d45" />
  </g>
);

const BHLNeutron: React.FC<Partial<LongProps>> = ({ vo = [], at, durationInSeconds = 20, chapter = 4, chapterName = '' }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const { cue, within, lineEnd, END } = timeline(f, vo, durationInSeconds);
  const C = { x: LW / 2, y: 520 };

  return (
    <LongFrame vo={vo} dur={durationInSeconds} chapter={chapter} name={chapterName}>
      {/* the explosion and what's left */}
      <Scene f={f} a={0} b={cue(at.size)} kind="zoom">
        <Stars drift={f * 0.2} />
        <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
          {[0, 1, 2].map((k) => { const r = prog(f, 6 + k * 5, 50 + k * 5);
            return r > 0 && r < 1 ? <circle key={k} cx={C.x} cy={C.y} r={60 + r * 1100} fill="none" stroke={k ? '#ffb46b' : '#fff'} strokeWidth={50 * (1 - r)} opacity={1 - r} /> : null; })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, opacity: EASE_OUT(prog(f, 30, 60)) }}>
          <NeutronShader x={C.x} y={C.y} size={900} res={340} radius={0.4} spin={0.3} />
        </div>
        <Headline text="NEUTRON STAR" top={150} size={96} o={EASE_OUT(prog(f, 40, 60))} />
      </Scene>
      <Flash f={f} at={6} len={8} />

      {/* more than the Sun, in ~20 km */}
      <Scene f={f} a={cue(at.size)} b={cue(at.spoon)} kind="push">
        <Stars drift={f * 0.2} />
        {(() => { const s = EASE_INOUT(within(at.size, 0.05, 0.6)); return <>
          {s < 0.98 && <div style={{ position: 'absolute', inset: 0, opacity: 1 - prog(s, 0.8, 0.98) }}>
            <ShaderSun x={C.x} y={C.y} size={lerp(900, 50, s)} res={300} zoom={0.62} speed={1.3} /></div>}
          {s > 0.8 && <div style={{ position: 'absolute', inset: 0, opacity: prog(s, 0.8, 1) }}>
            <NeutronShader x={C.x} y={C.y} size={280} res={200} radius={0.3} spin={0.4} /></div>}
          <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
            {s >= 1 && <g opacity={EASE_OUT(within(at.size, 0.6, 0.75))}>
              <line x1={C.x - 42} y1={C.y + 70} x2={C.x + 42} y2={C.y + 70} stroke={ROUTE} strokeWidth={5} />
              <line x1={C.x - 42} y1={C.y + 58} x2={C.x - 42} y2={C.y + 82} stroke={ROUTE} strokeWidth={5} />
              <line x1={C.x + 42} y1={C.y + 58} x2={C.x + 42} y2={C.y + 82} stroke={ROUTE} strokeWidth={5} />
            </g>}
          </svg>
          <Counter value="1.4 SUNS" label="OF MASS" x={420} y={420} size={74} />
          <Counter value="~20 KM" label="WIDE" x={1500} y={420} size={74} o={EASE_OUT(within(at.size, 0.6, 0.75))} />
        </>; })()}
      </Scene>

      {/* a teaspoon vs 900 pyramids */}
      <Scene f={f} a={cue(at.spoon)} b={cue(at.collapse)} kind="zoom">
        <Stars drift={f * 0.2} />
        {(() => { const t = within(at.spoon, 0, 0.9); const n = Math.round(900 * EASE_INOUT(t)); const tilt = lerp(0, 12, EASE_OUT(prog(t, 0, 0.2))) * Math.PI / 180;
          const L = { x: C.x - Math.cos(tilt) * 420, y: 560 + Math.sin(tilt) * 420 }; const R = { x: C.x + Math.cos(tilt) * 420, y: 560 - Math.sin(tilt) * 420 };
          const shown = Math.min(60, Math.ceil(n / 15));
          return <>
            <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
              <path d={`M ${C.x} 560 L ${C.x - 70} 900 L ${C.x + 70} 900 Z`} fill="#3b3f48" stroke="#000" strokeWidth={4} />
              <line x1={L.x} y1={L.y} x2={R.x} y2={R.y} stroke="#9aa3b5" strokeWidth={16} strokeLinecap="round" />
              {[L, R].map((p, i) => <g key={i}>
                <line x1={p.x} y1={p.y} x2={p.x - 110} y2={p.y + 170} stroke="#9aa3b5" strokeWidth={4} />
                <line x1={p.x} y1={p.y} x2={p.x + 110} y2={p.y + 170} stroke="#9aa3b5" strokeWidth={4} />
                <path d={`M ${p.x - 150} ${p.y + 170} Q ${p.x} ${p.y + 225} ${p.x + 150} ${p.y + 170} Z`} fill="#6b7385" stroke="#000" strokeWidth={3} />
              </g>)}
              <g transform={`translate(${L.x} ${L.y + 150}) scale(1.4)`}>
                <rect x={30} y={-8} width={150} height={16} rx={8} fill="#c9ced6" stroke="#000" strokeWidth={3} transform="rotate(-12)" />
                <ellipse rx={52} ry={34} fill="#c9ced6" stroke="#000" strokeWidth={3} />
                <ellipse cy={-4} rx={40} ry={22} fill="#bfe0ff" /><ellipse cy={-4} rx={56} ry={36} fill="#8fc2ff" opacity={0.35 + 0.15 * Math.sin(f / 4)} />
              </g>
              {Array.from({ length: shown }, (_, i) => { const row = Math.floor(i / 8); const col = i % 8;
                return <Pyramid key={i} x={R.x - 140 + col * 40 + (row % 2) * 20} y={R.y + 190 - row * 24} s={0.9} />; })}
              <text x={R.x} y={R.y - 40} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight={700} fontSize={76} fill={ROUTE} stroke="#000" strokeWidth={3}>×{n}</text>
            </svg>
            <Headline text="ONE TEASPOON" sub="OUTWEIGHS 900 GREAT PYRAMIDS" top={70} size={78} />
          </>; })()}
      </Scene>

      {/* add mass: collapse */}
      <Scene f={f} a={cue(at.collapse)} b={END + 30} kind="zoom">
        <AbsoluteFill style={{ background: '#000' }} />
        <Stars drift={f * 0.2} o={0.6} />
        {(() => { const c = EASE_INOUT(within(at.collapse, 0.35, 0.75)); const shake = c > 0 && c < 1 ? 6 : 0; return <>
          {c < 1 && <div style={{ position: 'absolute', inset: 0, transform: `translate(${Math.sin(f * 2) * shake}px, ${Math.cos(f * 3) * shake}px)` }}>
            <NeutronShader x={C.x} y={C.y} size={lerp(760, 80, c)} res={300} radius={0.4} spin={lerp(0.3, 3, c)} /></div>}
          {c >= 1 && <div style={{ position: 'absolute', inset: 0, opacity: EASE_OUT(within(at.collapse, 0.75, 0.9)) }}>
            <BHShader x={0} y={0} w={LW} h={LH} res={340} tilt={0.15} dist={24} /></div>}
        </>; })()}
        <Headline text="ADD A LITTLE MORE MASS..." top={70} size={70} o={1 - prog(f, Math.round((cue(at.collapse) + lineEnd(at.collapse)) / 2), Math.round((cue(at.collapse) + lineEnd(at.collapse)) / 2) + 10)} />
      </Scene>
      <Flash f={f} at={Math.round(lerp(cue(at.collapse), lineEnd(at.collapse), 0.75))} len={8} />
    </LongFrame>
  );
};

export default BHLNeutron;
