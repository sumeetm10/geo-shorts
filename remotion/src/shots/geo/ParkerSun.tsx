import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { EndCard } from './EndCard';
import { GlobeView, SpaceBg } from './Globe';
import { ALERT, H, MONO, ROUTE, SANS, W, lerp } from './parts';
import { ShaderSun } from './ShaderSun';
import { Flash, Scene } from './Trans';

// =============================================================================
// "The fastest thing humans ever built is flying into the Sun." A live shader
// Sun (ShaderSun) with Parker Solar Probe diving at it; a 690,000 km/h counter;
// the probe streaking across Earth in a 66-second timer (12,742 km / 690,000
// km/h); the 6.16 million km pass on 24 Dec 2024; and the split view of the
// heat shield (1,370 °C) against the instruments behind it (29 °C).
// Script and sources: make_whatif.py "parker".
// =============================================================================
export const compositionConfig = {
  id: 'ParkerSun',
  durationInSeconds: 31,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string; badge: string };
  at: { name: number; cross: number; xmas: number; record: number; heat: number; cool: number };
  durationInSeconds: number;
};

// side view: the white heat shield faces the Sun on the left (rot 0)
export const ParkerProbe: React.FC<{ x: number; y: number; s: number; rot?: number; glow?: number }> = ({ x, y, s, rot = 0, glow = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {glow > 0 && <ellipse cx={-62} cy={0} rx={30} ry={120} fill="#ff8a2a" opacity={0.55 * glow} />}
    <rect x={-20} y={-10} width={130} height={8} fill="#9aa6b2" />
    <rect x={10} y={-48} width={70} height={60} rx={6} fill="#4b5563" stroke="#000" strokeWidth={3} />
    <rect x={22} y={-36} width={46} height={10} fill="#d4a017" />
    <rect x={30} y={-108} width={42} height={58} fill="#1f3b73" stroke="#000" strokeWidth={3} />
    <rect x={30} y={14} width={42} height={58} fill="#1f3b73" stroke="#000" strokeWidth={3} />
    <line x1={51} y1={-108} x2={51} y2={72} stroke="#6b8cc7" strokeWidth={2} />
    <path d="M -46 -112 L -30 -112 L -30 112 L -46 112 Q -60 0 -46 -112 Z" fill="#f4f1ea" stroke="#000" strokeWidth={4} />
    <line x1={-30} y1={-60} x2={10} y2={-30} stroke="#cfd8e3" strokeWidth={4} />
    <line x1={-30} y1={60} x2={10} y2={0} stroke="#cfd8e3" strokeWidth={4} />
  </g>
);

const ParkerSun: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '', badge: '' }, at, durationInSeconds = 31 }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const last = vo.length - 1;
  const shake = (a: number) => `translate(${Math.sin(f * 1.7) * a}px, ${Math.cos(f * 2.3) * a}px)`;

  // hook: the probe dives from top-right straight at a huge Sun
  const hookScene = (t: number) => (
    <>
      <SpaceBg />
      <ShaderSun x={300} y={1180} size={1500} zoom={0.62} speed={1.4} />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {Array.from({ length: 7 }, (_, i) => <line key={i} x1={lerp(1000, 640, t) + 80 + i * 26} y1={lerp(380, 760, t) - 80 - i * 22}
          x2={lerp(1000, 640, t) + 280 + i * 30} y2={lerp(380, 760, t) - 260 - i * 26} stroke="#fff" strokeWidth={3} opacity={0.35} />)}
        <ParkerProbe x={lerp(1000, 640, t)} y={lerp(380, 760, t)} s={1.1} rot={-42} glow={0.4 + 0.6 * t} />
      </svg>
    </>
  );

  const speed = 690000 * EASE_OUT(within(at.name, 0.05, 0.6));
  const crossT = EASE_INOUT(within(at.cross, 0.1, 0.85));
  const dist = lerp(150, 6.16, EASE_OUT(within(at.xmas, 0.15, 0.85)));
  const heat = Math.round(1370 * EASE_OUT(within(at.heat, 0.1, 0.7)));

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <Scene f={f} a={0} b={cue(at.name)} kind="zoom">{hookScene(EASE_INOUT(prog(f, 0, cue(at.name) + 8)))}</Scene>

      {/* the probe and its speed */}
      <Scene f={f} a={cue(at.name)} b={cue(at.cross)} kind="whip">
        <SpaceBg />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {Array.from({ length: 40 }, (_, i) => { const y = 500 + ((i * 97) % 900); const x = ((i * 233 - f * 60) % 1400 + 1400) % 1400 - 160;
            return <line key={i} x1={x} y1={y} x2={x + 160} y2={y} stroke="#cfe6ff" strokeWidth={2} opacity={0.5} />; })}
          <g style={{ transform: shake(2) }}><ParkerProbe x={540} y={1000} s={2.3} glow={0.6} /></g>
        </svg>
        <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 60, color: '#fff', textShadow: '0 6px 30px #000' }}>PARKER SOLAR PROBE</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 118, color: ROUTE, textShadow: '0 6px 30px #000' }}>
            {Math.round(speed).toLocaleString('en-US')}</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 44, color: '#ffb199' }}>KM PER HOUR</div>
        </div>
      </Scene>

      {/* across Earth in about a minute */}
      <Scene f={f} a={cue(at.cross)} b={cue(at.xmas)} kind="push">
        <SpaceBg />
        <GlobeView id="pe" cx={540} cy={1060} R={400} lon0={70 - f * 0.3} lat0={15} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <line x1={120} y1={1060} x2={lerp(120, 960, crossT)} y2={1060} stroke={ROUTE} strokeWidth={8} strokeLinecap="round" />
          <ParkerProbe x={lerp(120, 960, crossT)} y={1060} s={0.55} rot={180} />
        </svg>
        <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: 5, color: '#9fd0ff' }}>ACROSS THE WHOLE EARTH</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 130, color: '#fff', textShadow: '0 6px 30px #000' }}>
            {(() => { const s = Math.round(66 * crossT); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; })()}</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: ROUTE }}>≈ ONE MINUTE</div>
        </div>
      </Scene>

      {/* 24 Dec 2024: 6.16 million km */}
      <Scene f={f} a={cue(at.xmas)} b={cue(at.heat)} kind="zoom">
        <SpaceBg />
        <ShaderSun x={-260} y={1060} size={lerp(1100, 1900, EASE_INOUT(within(at.xmas, 0, 1)))} zoom={0.62} speed={1.4} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <g style={{ transform: shake(f >= cue(at.record) ? 3 : 1.2) }}><ParkerProbe x={760} y={1060} s={1.2} glow={1} /></g>
        </svg>
        <div style={{ position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: '#fff', borderRadius: 18, padding: '6px 30px', boxShadow: '0 10px 30px #000' }}>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 34, color: '#fff', background: '#d42a2a', margin: '0 -30px', padding: '4px 0', borderRadius: '14px 14px 0 0' }}>DEC 2024</div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 92, color: '#111', lineHeight: 1.05 }}>24</div>
          </div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 96, color: '#fff', textShadow: '0 6px 30px #000', marginTop: 18 }}>{dist.toFixed(2)}M km</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 38, color: '#ffd38a' }}>FROM THE SUN'S SURFACE</div>
        </div>
        {f >= cue(at.record) && (
          <div style={{ position: 'absolute', top: 1340, left: 0, right: 0, textAlign: 'center', transform: `rotate(-6deg) scale(${lerp(1.5, 1, EASE_OUT(within(at.record, 0, 0.25)))})`,
            opacity: EASE_OUT(within(at.record, 0, 0.2)) }}>
            <span style={{ display: 'inline-block', border: '10px solid #fff', color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 80,
              padding: '4px 28px', borderRadius: 14, background: 'rgba(212,42,42,0.85)' }}>CLOSEST EVER</span>
          </div>
        )}
      </Scene>
      <Flash f={f} at={cue(at.record)} len={6} color="#ffe2b8" />

      {/* the shield: 1,370 degrees in front, 29 behind */}
      <Scene f={f} a={cue(at.heat)} b={cue(last)} kind="whip">
        <AbsoluteFill style={{ background: 'linear-gradient(90deg, #ff7a18 0%, #b3260a 38%, #120509 52%, #050a18 100%)' }} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {Array.from({ length: 18 }, (_, i) => { const y = 400 + i * 70; const x = ((i * 131 + f * 14) % 420) - 60;
            return <path key={i} d={`M ${x} ${y} q 30 -20 60 0 t 60 0`} stroke="#ffd38a" strokeWidth={4} fill="none" opacity={0.45} />; })}
          <ParkerProbe x={500} y={1000} s={3.2} glow={1} />
          {f >= cue(at.cool) && <circle cx={500 + 51 * 3.2} cy={1000 - 18 * 3.2} r={24 + 6 * Math.sin(f / 4)} fill="none" stroke="#5dd4ff" strokeWidth={6} />}
        </svg>
        <div style={{ position: 'absolute', top: 200, left: 40, width: 460, textAlign: 'left' }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 4, color: '#fff' }}>SHIELD</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 104, color: '#fff', textShadow: '0 6px 30px #000' }}>{heat.toLocaleString('en-US')}°C</div>
        </div>
        {f >= cue(at.cool) && (
          <div style={{ position: 'absolute', top: 200, right: 40, width: 420, textAlign: 'right', opacity: EASE_OUT(within(at.cool, 0, 0.25)),
            transform: `scale(${lerp(1.4, 1, EASE_OUT(within(at.cool, 0, 0.25)))})` }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 4, color: '#9fd0ff' }}>INSTRUMENTS</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 104, color: '#5dd4ff', textShadow: '0 6px 30px #000' }}>29°C</div>
          </div>
        )}
      </Scene>

      <Scene f={f} a={cue(last)} b={END + 30} kind="zoom">{hookScene(0.05)}</Scene>

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

export default ParkerSun;
