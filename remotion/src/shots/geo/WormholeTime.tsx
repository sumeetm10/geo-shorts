import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { Atlas } from './Atlas';
import { EndCard } from './EndCard';
import { SpaceBg } from './Globe';
import { ALERT, H, MONO, ROUTE, SANS, W, lerp } from './parts';
import { Flash, Scene } from './Trans';
import { WormholeShader } from './WormholeShader';
import { Ship } from './WormholeTravel';

// =============================================================================
// Part 2: the wormhole time machine. Two mouths (WormholeShader, two colour
// schemes) with a clock over each; one mouth towed away near light speed and
// back; its clock lags - it comes back younger; Atlas steps into the young
// mouth and out of the old one, the calendar flipping back; the catch - a
// timeline with a wall at "machine built"; no dinosaurs.
// Script and sources: make_whatif.py "wormtime".
// =============================================================================
export const compositionConfig = {
  id: 'WormholeTime',
  durationInSeconds: 28,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string; badge: string };
  at: { fly: number; young: number; past: number; catch: number; dino: number };
  durationInSeconds: number;
};

const Clock: React.FC<{ x: number; y: number; r: number; turns: number; color: string }> = ({ x, y, r, turns, color }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill="#0b1224" stroke={color} strokeWidth={8} />
    {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <line key={i} x1={Math.sin(a) * r * 0.78} y1={-Math.cos(a) * r * 0.78} x2={Math.sin(a) * r * 0.9} y2={-Math.cos(a) * r * 0.9} stroke="#cfd6e3" strokeWidth={4} />; })}
    <line x1={0} y1={0} x2={Math.sin(turns * Math.PI * 2) * r * 0.75} y2={-Math.cos(turns * Math.PI * 2) * r * 0.75} stroke={color} strokeWidth={8} strokeLinecap="round" />
    <line x1={0} y1={0} x2={Math.sin(turns / 12 * Math.PI * 2) * r * 0.5} y2={-Math.cos(turns / 12 * Math.PI * 2) * r * 0.5} stroke="#fff" strokeWidth={10} strokeLinecap="round" />
    <circle r={8} fill="#fff" />
  </g>
);

const Dino: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill="#3f7a3a" stroke="#000" strokeWidth={3}>
    <path d="M -90 0 Q -40 -60 20 -50 L 40 -110 Q 60 -130 80 -112 L 70 -96 L 54 -94 L 50 -40 Q 70 -10 60 0 Z" />
    <path d="M -90 0 Q -150 -10 -190 20 Q -140 10 -90 18 Z" />
    <rect x={-50} y={-4} width={18} height={50} /><rect x={20} y={-4} width={18} height={50} />
  </g>
);

const WormholeTime: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '', badge: '' }, at, durationInSeconds = 28 }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const last = vo.length - 1;

  const A = { x: 280, y: 1050 }; const B = { x: 800, y: 1050 };       // A = old end (stays), B = the one that travels
  const mouth = (p: { x: number; y: number }, size: number, hue: number, key: string) => (
    <WormholeShader key={key} x={p.x - size / 2} y={p.y - size / 2} w={size} h={size} res={300} R={0.5} hue={hue} round />
  );
  // the travelling mouth goes off to the right and comes back
  const trip = within(at.fly, 0.1, 0.95);
  const away = Math.sin(trip * Math.PI);
  const Bp = { x: B.x + away * 900, y: B.y - away * 300 };
  const tA = f / 30 * 0.6;                                // old end's clock keeps running
  const lag = 0.9 * EASE_INOUT(prog(f, cue(at.fly), cue(at.young) + 30));
  const tB = tA - lag;

  const hookScene = (t: number) => (
    <>
      <SpaceBg />
      {mouth(A, 440, 0, 'a')}{mouth(B, 440, 1, 'b')}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <Clock x={A.x} y={A.y - 330} r={70} turns={tA * (1 + 6 * (1 - t))} color="#7fc4ff" />
        <Clock x={B.x} y={B.y - 330} r={70} turns={-tA * (1 + 6 * (1 - t))} color="#ff9ad5" />
        <path d={`M ${A.x + 200} ${A.y + 250} Q 540 ${A.y + 380} ${B.x - 200} ${B.y + 250}`} stroke="#ffffff" strokeWidth={4} strokeDasharray="10 12" fill="none" opacity={0.5} />
      </svg>
    </>
  );

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <Scene f={f} a={0} b={cue(at.fly)} kind="zoom">{hookScene(prog(f, 0, cue(at.fly)))}</Scene>

      {/* tow one mouth away near light speed and back */}
      <Scene f={f} a={cue(at.fly)} b={cue(at.young)} kind="whip">
        <SpaceBg />
        {mouth(A, 440, 0, 'a')}
        {mouth(Bp, 440 * (1 - 0.4 * away), 1, 'b')}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {away > 0.05 && Array.from({ length: 8 }, (_, i) => <line key={i} x1={Bp.x - 100 - i * 30} y1={Bp.y - 80 + i * 22} x2={Bp.x - 360 - i * 30} y2={Bp.y - 80 + i * 22} stroke="#fff" strokeWidth={3} opacity={0.4 * away} />)}
          <Ship x={Bp.x + 230 * (1 - 0.4 * away)} y={Bp.y} s={0.9} rot={trip < 0.5 ? -15 : 165} />
          <Clock x={A.x} y={A.y - 330} r={70} turns={tA} color="#7fc4ff" />
        </svg>
        <div style={{ position: 'absolute', top: 220, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 36, letterSpacing: 5, color: '#ff9ad5' }}>ONE END FLIES AT</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 88, color: '#fff', textShadow: '0 6px 30px #000' }}>NEARLY LIGHT SPEED</div>
        </div>
      </Scene>

      {/* it comes back younger */}
      <Scene f={f} a={cue(at.young)} b={cue(at.past)} kind="push">
        <SpaceBg />
        {mouth(A, 440, 0, 'a')}{mouth(B, 440, 1, 'b')}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <Clock x={A.x} y={A.y - 340} r={90} turns={tA} color="#7fc4ff" />
          <Clock x={B.x} y={B.y - 340} r={90} turns={tB} color="#ff9ad5" />
          <text x={A.x} y={A.y + 300} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={52} fill="#7fc4ff">OLD END</text>
          <text x={B.x} y={B.y + 300} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={52} fill="#ff9ad5"
            opacity={EASE_OUT(within(at.young, 0.4, 0.55))}>YOUNG END</text>
        </svg>
        <div style={{ position: 'absolute', top: 220, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 84, color: '#fff', textShadow: '0 6px 30px #000' }}>TIME RUNS SLOWER</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: ROUTE }}>FOR THE END THAT MOVED</div>
        </div>
      </Scene>

      {/* in the young end, out of the old one: the past */}
      <Scene f={f} a={cue(at.past)} b={cue(at.catch)} kind="zoom">
        <SpaceBg />
        {mouth(A, 440, 0, 'a')}{mouth(B, 440, 1, 'b')}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {(() => { const t = within(at.past, 0.05, 0.9);
            const inB = t < 0.45; const k = inB ? t / 0.45 : (t - 0.45) / 0.55;
            const x = inB ? lerp(B.x + 300, B.x, k) : lerp(A.x, A.x - 260, k);
            const s = inB ? lerp(2.4, 0.4, k) : lerp(0.4, 2.4, k);
            return <Atlas x={x} y={A.y + 120 * (inB ? 1 - k : k) + 40} s={s} t={f} walking={1} mood={inB ? 'walk' : 'shocked'} left={inB} />; })()}
          <text x={B.x} y={B.y + 300} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={52} fill="#ff9ad5">IN</text>
          <text x={A.x} y={A.y + 300} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={52} fill="#7fc4ff">OUT</text>
        </svg>
        <div style={{ position: 'absolute', top: 220, left: 0, right: 0, textAlign: 'center' }}>
          {within(at.past, 0.55, 0.65) > 0 ? (
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 110, color: ROUTE, textShadow: '0 6px 30px #000',
              transform: `scale(${lerp(1.5, 1, EASE_OUT(within(at.past, 0.55, 0.68)))})` }}>THE PAST</div>
          ) : (
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 84, color: '#fff', textShadow: '0 6px 30px #000' }}>STEP IN...</div>
          )}
        </div>
      </Scene>
      <Flash f={f} at={Math.round(lerp(cue(at.past), lineEnd(at.past), 0.47))} len={6} color="#ffd6f0" />

      {/* the catch: not before the machine was built */}
      <Scene f={f} a={cue(at.catch)} b={cue(last)} kind="whip">
        <AbsoluteFill style={{ background: 'linear-gradient(#050814, #0c1328)' }} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <line x1={60} y1={1000} x2={1020} y2={1000} stroke="#cfd6e3" strokeWidth={8} />
          {[[200, 'DINOSAURS'], [560, 'BUILT'], [900, 'NOW']].map(([x, l]) => <g key={l as string}>
            <line x1={x as number} y1={975} x2={x as number} y2={1025} stroke="#cfd6e3" strokeWidth={6} />
            <text x={x as number} y={1080} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={36} fill={l === 'BUILT' ? ROUTE : '#cfd6e3'}>{l}</text>
          </g>)}
          <rect x={548} y={760} width={24} height={300} fill={ROUTE} opacity={EASE_OUT(within(at.catch, 0.4, 0.55))} />
          {(() => { const b = EASE_INOUT(within(at.catch, 0.1, 0.55)); const x = lerp(900, 580, b);
            return <g><path d={`M 900 940 Q ${(900 + x) / 2} 860 ${x} 940`} stroke="#ff9ad5" strokeWidth={8} fill="none" />
              <path d={`M ${x} 940 l 26 -14 l -4 30 z`} fill="#ff9ad5" /></g>; })()}
          {f >= cue(at.dino) && <g opacity={EASE_OUT(within(at.dino, 0, 0.2))}>
            <Dino x={200} y={880} s={1} />
            <line x1={70} y1={760} x2={330} y2={960} stroke={ALERT} strokeWidth={16} strokeLinecap="round" />
            <line x1={330} y1={760} x2={70} y2={960} stroke={ALERT} strokeWidth={16} strokeLinecap="round" />
          </g>}
        </svg>
        <div style={{ position: 'absolute', top: 220, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 92, color: ALERT, textShadow: '0 6px 30px #000' }}>THE CATCH</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: '#fff' }}>NO FURTHER BACK THAN THE DAY IT WAS BUILT</div>
        </div>
        {f >= cue(at.dino) && <div style={{ position: 'absolute', top: 1260, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 44, color: '#9fd0ff',
          opacity: EASE_OUT(within(at.dino, 0.5, 0.7)) }}>NO WORMHOLE FOUND... YET</div>}
      </Scene>

      <Scene f={f} a={cue(last)} b={END + 30} kind="zoom">
        {hookScene(0.9)}
        <div style={{ position: 'absolute', top: 1190, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 64, color: ROUTE,
          textShadow: '0 6px 30px #000' }}>WHERE WOULD YOU GO?</div>
      </Scene>

      {(() => {
        const o = Math.max(1 - prog(f, cue(at.fly) - 6, cue(at.fly) + 6), prog(f, END - 22, END - 4));
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

export default WormholeTime;
