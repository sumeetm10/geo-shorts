import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { EndCard } from './EndCard';
import { SpaceBg } from './Globe';
import { ALERT, H, MONO, ROUTE, SANS, W, lerp } from './parts';
import { Flash, Scene } from './Trans';
import { WormholeShader } from './WormholeShader';

// =============================================================================
// "Einstein's own equations allow a tunnel through space. Could you fly
// through it?" The wormhole as a crystal ball (WormholeShader) with a ship
// heading in; the textbook embedding diagram - two sheets of space joined by a
// throat - with 1916 Flamm / 1935 Einstein-Rosen; the throat pinching shut
// before a light beam gets through; an energy gauge dropping below zero; the
// Casimir plates; and the flight through, out under another sky.
// Script and sources: make_whatif.py "wormtravel".
// =============================================================================
export const compositionConfig = {
  id: 'WormholeTravel',
  durationInSeconds: 34,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string; badge: string };
  at: { name: number; pinch: number; neg: number; casimir: number; tiny: number };
  durationInSeconds: number;
};

export const Ship: React.FC<{ x: number; y: number; s: number; rot?: number; flame?: number }> = ({ x, y, s, rot = 0, flame = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d={`M -40 0 L ${-40 - 50 * flame} -10 L ${-40 - 70 * flame} 0 L ${-40 - 50 * flame} 10 Z`} fill="#ffb347" opacity={0.9} />
    <path d="M -40 -16 L 30 -16 Q 70 0 30 16 L -40 16 Z" fill="#e9edf2" stroke="#000" strokeWidth={3} />
    <path d="M -30 -16 L -50 -36 L -10 -16 Z M -30 16 L -50 36 L -10 16 Z" fill="#c94a3a" stroke="#000" strokeWidth={3} />
    <circle cx={22} cy={-2} r={7} fill="#5fb3ff" stroke="#000" strokeWidth={2} />
  </g>
);

// two sheets of space joined by a throat (the classic diagram)
const Embedding: React.FC<{ cx: number; cy: number; s: number; t: number; pinch?: number }> = ({ cx, cy, s, t, pinch = 0 }) => {
  const rings = 14;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      {Array.from({ length: rings }, (_, i) => {
        const k = i / (rings - 1);                       // 0 = throat, 1 = far out
        const r = lerp(60 * (1 - pinch) + 4, 430, Math.pow(k, 1.6));
        const dy = 300 * Math.pow(1 - k, 2.2) + 10;       // how far the sheet dips toward the throat
        return [-1, 1].map((d) => (
          <ellipse key={`${i}${d}`} cx={0} cy={d * dy} rx={r} ry={r * 0.22} fill="none" stroke={d < 0 ? '#7fc4ff' : '#ff9ad5'} strokeWidth={2.5}
            opacity={0.25 + 0.6 * (1 - k)} />
        ));
      })}
      {Array.from({ length: 12 }, (_, j) => {
        const a = (j / 12) * Math.PI * 2 + t * 0.2;
        const pts = Array.from({ length: 30 }, (_, i) => { const k = i / 29; const r = lerp(60 * (1 - pinch) + 4, 430, Math.pow(k, 1.6));
          const dy = 300 * Math.pow(1 - k, 2.2) + 10; return [Math.cos(a) * r, Math.sin(a) * r * 0.22, dy] as const; });
        return [-1, 1].map((d) => <polyline key={`${j}${d}`} points={pts.map(([x, y, dy]) => `${x},${y + d * dy}`).join(' ')} fill="none"
          stroke={d < 0 ? '#7fc4ff' : '#ff9ad5'} strokeWidth={1.5} opacity={Math.sin(a) > 0 ? 0.55 : 0.2} />);
      })}
    </g>
  );
};

const WormholeTravel: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '', badge: '' }, at, durationInSeconds = 34 }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const last = vo.length - 1;
  const shake = (a: number) => `translate(${Math.sin(f * 1.7) * a}px, ${Math.cos(f * 2.3) * a}px)`;

  const hookScene = (t: number) => (
    <>
      <WormholeShader x={0} y={0} w={W} h={H} res={460} R={lerp(0.2, 0.26, t)} />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <Ship x={lerp(140, 470, EASE_INOUT(t))} y={lerp(1500, 1040, EASE_INOUT(t))} s={lerp(1.4, 0.5, EASE_INOUT(t))} rot={-55} flame={0.8 + 0.2 * Math.sin(f / 2)} />
      </svg>
    </>
  );

  const pinchT = EASE_INOUT(within(at.pinch, 0.25, 0.75));
  const beam = within(at.pinch, 0.15, 0.7);
  const gauge = lerp(1, -1, EASE_INOUT(within(at.neg, 0.15, 0.8)));
  const fly = EASE_INOUT(within(at.tiny, 0.15, 1));

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <Scene f={f} a={0} b={cue(at.name)} kind="zoom">{hookScene(prog(f, 0, cue(at.name)))}</Scene>

      {/* the diagram, 1916 and 1935 */}
      <Scene f={f} a={cue(at.name)} b={cue(at.pinch)} kind="zoom">
        <SpaceBg />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <Embedding cx={540} cy={1050} s={lerp(0.85, 1.0, within(at.name, 0, 1))} t={f / 30} />
        </svg>
        <div style={{ position: 'absolute', top: 220, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 104, color: '#fff', textShadow: '0 6px 30px #000' }}>WORMHOLE</div>
        </div>
        {[['1916', 'FLAMM', 0.35], ['1935', 'EINSTEIN & ROSEN', 0.6]].map(([y, who, a], i) => {
          const o = EASE_OUT(within(at.name, a as number, (a as number) + 0.12)); if (o <= 0) return null;
          return <div key={i} style={{ position: 'absolute', top: 1380, left: i ? 560 : 60, width: 460, opacity: o, transform: `translateY(${(1 - o) * 40}px)` }}>
            <div style={{ background: 'rgba(10,14,30,0.85)', border: `4px solid ${i ? '#ff9ad5' : '#7fc4ff'}`, borderRadius: 18, padding: '10px 18px', textAlign: 'center' }}>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 64, color: '#fff' }}>{y}</div>
              <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 34, color: i ? '#ff9ad5' : '#7fc4ff' }}>{who}</div>
            </div>
          </div>;
        })}
      </Scene>

      {/* it pinches shut before light gets through */}
      <Scene f={f} a={cue(at.pinch)} b={cue(at.neg)} kind="whip">
        <SpaceBg />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <g style={{ transform: pinchT > 0.6 ? shake(3) : undefined }}><Embedding cx={540} cy={1050} s={1} t={f / 30} pinch={pinchT} /></g>
          <line x1={540} y1={300} x2={540} y2={lerp(300, 1040 - 250 * pinchT * 0, Math.min(beam, 0.95))} stroke={ROUTE} strokeWidth={10} strokeLinecap="round" />
          <circle cx={540} cy={lerp(300, 1040, Math.min(beam, 0.95))} r={16} fill="#fff8c4" />
          {pinchT > 0.95 && <text x={540} y={1060} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={90} fill={ALERT} stroke="#000" strokeWidth={4}>✕</text>}
        </svg>
        <div style={{ position: 'absolute', top: 220, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 88, color: '#fff', textShadow: '0 6px 30px #000' }}>IT PINCHES SHUT</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: ROUTE, opacity: EASE_OUT(within(at.pinch, 0.6, 0.75)) }}>EVEN LIGHT CAN'T GET THROUGH</div>
        </div>
      </Scene>
      <Flash f={f} at={Math.round(lerp(cue(at.pinch), lineEnd(at.pinch), 0.72))} len={6} />

      {/* negative energy */}
      <Scene f={f} a={cue(at.neg)} b={cue(at.casimir)} kind="push">
        <WormholeShader x={0} y={0} w={W} h={H} res={360} R={0.16} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <rect x={160} y={1220} width={760} height={70} rx={35} fill="#111827" stroke="#fff" strokeWidth={5} />
          <line x1={540} y1={1200} x2={540} y2={1310} stroke="#fff" strokeWidth={5} />
          <rect x={gauge >= 0 ? 540 : 540 + gauge * 370} y={1228} width={Math.abs(gauge) * 370} height={54} rx={27} fill={gauge >= 0 ? '#5dff8a' : ALERT} />
          <text x={540} y={1360} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={40} fill="#fff">0</text>
          <text x={180} y={1360} fontFamily={SANS} fontWeight={800} fontSize={40} fill={ALERT}>−</text>
          <text x={880} y={1360} fontFamily={SANS} fontWeight={800} fontSize={40} fill="#5dff8a">+</text>
        </svg>
        <div style={{ position: 'absolute', top: 220, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 36, letterSpacing: 5, color: '#9fd0ff' }}>TO HOLD IT OPEN</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 92, color: ALERT, textShadow: '0 6px 30px #000' }}>NEGATIVE</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 92, color: '#fff', textShadow: '0 6px 30px #000' }}>ENERGY</div>
        </div>
      </Scene>

      {/* the Casimir effect */}
      <Scene f={f} a={cue(at.casimir)} b={cue(at.tiny)} kind="zoom">
        <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 55%, #10203a 0%, #02040a 70%)' }} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {(() => { const gap = lerp(170, 120, EASE_INOUT(within(at.casimir, 0.4, 0.9))); return <g>
            {Array.from({ length: 9 }, (_, i) => { const y = 760 + i * 60; return <g key={i}>
              <path d={Array.from({ length: 30 }, (_, k) => `${k ? 'L' : 'M'} ${40 + k * 12} ${y + 14 * Math.sin(k * 0.9 + f / 4 + i)}`).join(' ')} stroke="#7fc4ff" strokeWidth={3} fill="none" opacity={0.7} />
              <path d={Array.from({ length: 30 }, (_, k) => `${k ? 'L' : 'M'} ${700 + k * 12} ${y + 14 * Math.sin(k * 0.9 + f / 4 + i)}`).join(' ')} stroke="#7fc4ff" strokeWidth={3} fill="none" opacity={0.7} />
              {i % 3 === 0 && <path d={Array.from({ length: 12 }, (_, k) => `${k ? 'L' : 'M'} ${540 - gap + 30 + k * ((gap * 2 - 60) / 11)} ${y + 10 * Math.sin(k * 0.6 + f / 5)}`).join(' ')} stroke="#7fc4ff" strokeWidth={3} fill="none" opacity={0.7} />}
            </g>; })}
            {[-1, 1].map((d) => <g key={d}>
              <rect x={540 + d * gap - 16} y={720} width={32} height={560} rx={6} fill="#c9ced6" stroke="#000" strokeWidth={3} />
              <path d={`M ${540 + d * (gap + 120)} 1000 L ${540 + d * (gap + 40)} 1000`} stroke={ROUTE} strokeWidth={10} markerEnd="" />
              <path d={`M ${540 + d * (gap + 40)} 980 L ${540 + d * (gap + 22)} 1000 L ${540 + d * (gap + 40)} 1020 Z`} fill={ROUTE} />
            </g>)}
          </g>; })()}
        </svg>
        <div style={{ position: 'absolute', top: 220, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 84, color: '#fff', textShadow: '0 6px 30px #000' }}>CASIMIR EFFECT</div>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, color: '#9fd0ff' }}>TWO METAL PLATES, ALMOST TOUCHING</div>
        </div>
        {within(at.casimir, 0.55, 0.65) > 0 && (
          <div style={{ position: 'absolute', top: 1340, left: 0, right: 0, textAlign: 'center', transform: `rotate(-5deg) scale(${lerp(1.5, 1, EASE_OUT(within(at.casimir, 0.55, 0.68)))})` }}>
            <span style={{ display: 'inline-block', border: '10px solid #5dff8a', color: '#5dff8a', fontFamily: SANS, fontWeight: 800, fontSize: 64,
              padding: '4px 26px', borderRadius: 14, background: 'rgba(0,0,0,0.5)' }}>NEGATIVE ENERGY: REAL</span>
          </div>
        )}
      </Scene>

      {/* maybe only a tiny amount - fly through */}
      <Scene f={f} a={cue(at.tiny)} b={cue(last)} kind="zoom">
        <WormholeShader x={0} y={0} w={W} h={H} res={460} R={0.24} travel={fly} hue={0} />
        <div style={{ position: 'absolute', top: 220, left: 0, right: 0, textAlign: 'center', opacity: 1 - prog(fly, 0.3, 0.5) }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 36, letterSpacing: 5, color: '#9fd0ff' }}>HOW MUCH IS NEEDED?</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 92, color: ROUTE, textShadow: '0 6px 30px #000' }}>MAYBE TINY</div>
        </div>
      </Scene>

      {/* CTA: would you step in? part 2 teaser */}
      <Scene f={f} a={cue(last)} b={END + 30} kind="zoom">
        {hookScene(0.05)}
        {f < END - 20 && <div style={{ position: 'absolute', top: 620, left: 0, right: 0, textAlign: 'center', transform: `rotate(-4deg) scale(${lerp(1.5, 1, EASE_OUT(prog(f, cue(last), cue(last) + 10)))})` }}>
          <span style={{ display: 'inline-block', background: ROUTE, color: '#111', fontFamily: SANS, fontWeight: 800, fontSize: 60, padding: '12px 30px',
            borderRadius: 20, border: '6px solid #000', boxShadow: '0 14px 40px #000' }}>PART 2 · TIME MACHINE</span>
        </div>}
      </Scene>

      {(() => {
        const o = Math.max(1 - prog(f, cue(at.name) - 6, cue(at.name) + 6), prog(f, END - 22, END - 4));
        return (
          <>
            <div style={{ position: 'absolute', top: 170, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
              fontSize: 104, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.9)', opacity: o }}>
              {hook.top}<br /><span style={{ color: ROUTE }}>{hook.bottom}</span>
            </div>
            <div style={{ position: 'absolute', top: 1440, left: 0, right: 0, textAlign: 'center', opacity: o,
              transform: `rotate(-3deg) scale(${1 + 0.04 * Math.sin(f / 5)})` }}>
              <span style={{ display: 'inline-block', background: ALERT, color: '#fff', fontFamily: SANS, fontWeight: 800,
                fontSize: 54, padding: '10px 28px', borderRadius: 18, border: '5px solid #fff' }}>{hook.badge}</span>
            </div>
          </>
        );
      })()}

      <EndCard from={cue(last)} to={END - 14} text="" compact />
      <Captions lines={vo} y={1600} accent={ROUTE} maxWords={3} size={58} plate />
    </AbsoluteFill>
  );
};

export default WormholeTravel;
