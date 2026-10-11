import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { Atlas } from './Atlas';
import { EndCard } from './EndCard';
import { GlobeView, SpaceBg } from './Globe';
import { NeutronShader } from './NeutronShader';
import { ALERT, H, MONO, ROUTE, SANS, W, lerp } from './parts';
import { ShaderSun } from './ShaderSun';
import { Flash, Scene } from './Trans';

// =============================================================================
// "One teaspoon of this star weighs more than 900 Great Pyramids." A balance:
// a glowing teaspoon against a growing heap of pyramids; the supernova and the
// neutron star left behind (NeutronShader); the Sun (ShaderSun) crushed into a
// 20 km ball; Atlas walking across it (4 hours); the whole Earth squeezed to
// 305 m, the size of the Arecibo dish; mountains under a millimetre; and the
// pulsar's beams spinning. Script and sources: make_whatif.py "neutron".
// =============================================================================
export const compositionConfig = {
  id: 'NeutronStar',
  durationInSeconds: 33,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string; badge: string };
  at: { name: number; size: number; walk: number; earth: number; mount: number; spin: number };
  durationInSeconds: number;
};

const Pyramid: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -30 0 L 0 -26 L 30 0 Z" fill="#d9b26a" stroke="#6b4f1d" strokeWidth={2} />
    <path d="M 0 -26 L 30 0 L 8 0 Z" fill="#b58d45" />
  </g>
);

const Spoon: React.FC<{ x: number; y: number; s: number; glow: number }> = ({ x, y, s, glow }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={30} y={-8} width={150} height={16} rx={8} fill="#c9ced6" stroke="#000" strokeWidth={3} transform="rotate(-12)" />
    <ellipse cx={0} cy={0} rx={52} ry={34} fill="#c9ced6" stroke="#000" strokeWidth={3} />
    <ellipse cx={0} cy={-4} rx={40} ry={22} fill="#bfe0ff" />
    <ellipse cx={0} cy={-4} rx={60 * glow} ry={40 * glow} fill="#8fc2ff" opacity={0.35} />
    <ellipse cx={-6} cy={-8} rx={22} ry={10} fill="#ffffff" opacity={0.9} />
  </g>
);

const NeutronStar: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '', badge: '' }, at, durationInSeconds = 33 }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const last = vo.length - 1;
  const shake = (a: number) => `translate(${Math.sin(f * 1.7) * a}px, ${Math.cos(f * 2.3) * a}px)`;

  // hook: the balance - one spoon outweighs a growing heap of pyramids
  const hookScene = (t: number) => {
    const n = Math.round(900 * EASE_INOUT(t));
    const shown = Math.min(48, Math.ceil(n / 18.75));
    const tiltA = lerp(0, 14, EASE_OUT(prog(t, 0, 0.25)));        // spoon side goes down and stays down
    const L = { x: 540 - Math.cos(tiltA * Math.PI / 180) * 330, y: 1000 + Math.sin(tiltA * Math.PI / 180) * 330 };
    const R = { x: 540 + Math.cos(tiltA * Math.PI / 180) * 330, y: 1000 - Math.sin(tiltA * Math.PI / 180) * 330 };
    return (
      <>
        <SpaceBg />
        <NeutronShader x={540} y={560} size={520} res={240} radius={0.3} spin={0.35} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <path d="M 540 1000 L 480 1420 L 600 1420 Z" fill="#3b3f48" stroke="#000" strokeWidth={4} />
          <line x1={L.x} y1={L.y} x2={R.x} y2={R.y} stroke="#9aa3b5" strokeWidth={14} strokeLinecap="round" />
          <circle cx={540} cy={1000} r={16} fill="#cfd6e3" stroke="#000" strokeWidth={3} />
          {[L, R].map((p, i) => <g key={i}>
            <line x1={p.x} y1={p.y} x2={p.x - 90} y2={p.y + 150} stroke="#9aa3b5" strokeWidth={4} />
            <line x1={p.x} y1={p.y} x2={p.x + 90} y2={p.y + 150} stroke="#9aa3b5" strokeWidth={4} />
            <path d={`M ${p.x - 120} ${p.y + 150} Q ${p.x} ${p.y + 200} ${p.x + 120} ${p.y + 150} Z`} fill="#6b7385" stroke="#000" strokeWidth={3} />
          </g>)}
          <Spoon x={L.x} y={L.y + lerp(-500, 128, EASE_OUT(prog(t, 0, 0.12)))} s={1.2} glow={0.8 + 0.2 * Math.sin(f / 4)} />
          {Array.from({ length: shown }, (_, i) => { const row = Math.floor(i / 6); const col = i % 6;
            return <Pyramid key={i} x={R.x - 100 + col * 40 + (row % 2) * 20} y={R.y + 172 - row * 26} s={0.9} />; })}
          <text x={R.x} y={R.y - 60} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={70} fill={ROUTE} stroke="#000" strokeWidth={3}>×{n}</text>
        </svg>
      </>
    );
  };

  const sunShrink = EASE_INOUT(within(at.size, 0.05, 0.55));
  const walkT = within(at.walk, 0, 1);
  const earthT = EASE_INOUT(within(at.earth, 0.1, 0.6));
  const mm = EASE_OUT(within(at.mount, 0.35, 0.6));

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <Scene f={f} a={0} b={cue(at.name)} kind="zoom">{hookScene(prog(f, 0, cue(at.name)))}</Scene>

      {/* the supernova, and what it leaves behind */}
      <Scene f={f} a={cue(at.name)} b={cue(at.size)} kind="zoom">
        <SpaceBg />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {[0, 1, 2].map((k) => { const r = prog(f, cue(at.name) + k * 5, cue(at.name) + 40 + k * 5);
            return r > 0 && r < 1 ? <circle key={k} cx={540} cy={1000} r={60 + r * 900} fill="none" stroke={k ? '#ffb46b' : '#fff'} strokeWidth={40 * (1 - r)} opacity={1 - r} /> : null; })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, opacity: EASE_OUT(within(at.name, 0.2, 0.45)) }}>
          <NeutronShader x={540} y={1000} size={1000} res={360} radius={0.42} spin={0.3} />
        </div>
        <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 100, color: '#fff', textShadow: '0 6px 30px #000' }}>NEUTRON STAR</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 36, color: '#9fd0ff', opacity: EASE_OUT(within(at.name, 0.45, 0.65)) }}>THE CRUSHED CORE OF AN EXPLODED STAR</div>
        </div>
      </Scene>
      <Flash f={f} at={cue(at.name)} len={8} />

      {/* the Sun's mass into a 20 km ball */}
      <Scene f={f} a={cue(at.size)} b={cue(at.walk)} kind="push">
        <SpaceBg />
        {sunShrink < 0.98 && <div style={{ position: 'absolute', inset: 0, opacity: 1 - prog(sunShrink, 0.8, 0.98) }}>
          <ShaderSun x={540} y={1000} size={lerp(1300, 60, sunShrink)} res={300} zoom={0.62} speed={1.4} />
        </div>}
        {sunShrink > 0.8 && <div style={{ position: 'absolute', inset: 0, opacity: prog(sunShrink, 0.8, 1) }}>
          <NeutronShader x={540} y={1000} size={300} res={200} radius={0.3} spin={0.4} />
        </div>}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {sunShrink >= 1 && <g opacity={EASE_OUT(within(at.size, 0.6, 0.75))}>
            <line x1={495} y1={1100} x2={585} y2={1100} stroke={ROUTE} strokeWidth={5} />
            <line x1={495} y1={1088} x2={495} y2={1112} stroke={ROUTE} strokeWidth={5} /><line x1={585} y1={1088} x2={585} y2={1112} stroke={ROUTE} strokeWidth={5} />
            <text x={540} y={1160} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={54} fill={ROUTE}>~20 km</text>
          </g>}
        </svg>
        <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: 5, color: '#ffd38a' }}>MORE MASS THAN</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 110, color: '#fff', textShadow: '0 6px 30px #000' }}>THE SUN</div>
        </div>
      </Scene>

      {/* Atlas walks across it: four hours */}
      <Scene f={f} a={cue(at.walk)} b={cue(at.earth)} kind="whip">
        <SpaceBg />
        <NeutronShader x={540} y={1820} size={2400} res={420} radius={0.42} spin={0.04} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <g transform={`rotate(${lerp(-24, 24, walkT)} 540 1820)`}>
            <Atlas x={540} y={1820 - 0.42 * 1200 + 4} s={3.2} t={f} walking={1} mood="walk" />
          </g>
        </svg>
        <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: 5, color: '#9fd0ff' }}>WALK ACROSS IT IN</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 130, color: ROUTE, textShadow: '0 6px 30px #000' }}>
            {Math.floor(4 * walkT)}h {String(Math.floor((240 * walkT) % 60)).padStart(2, '0')}m</div>
          
        </div>
      </Scene>

      {/* the whole Earth squeezed to 305 m */}
      <Scene f={f} a={cue(at.earth)} b={cue(at.mount)} kind="zoom">
        <SpaceBg />
        {earthT < 1 && <GlobeView id="ne" cx={540} cy={1000} R={lerp(420, 8, earthT)} lon0={80 - f * 0.4} lat0={15} />}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {earthT >= 1 && (() => { const o = EASE_OUT(within(at.earth, 0.6, 0.8)); return <g opacity={o}>
            <circle cx={540} cy={1000} r={10} fill="#8fc2ff" stroke="#fff" strokeWidth={3} />
            <ellipse cx={540} cy={1000} rx={330} ry={90} fill="none" stroke="#cfd6e3" strokeWidth={6} strokeDasharray="4 8" />
            <text x={540} y={1150} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={40} fill="#cfd6e3">THE SIZE OF THE ARECIBO DISH</text>
          </g>; })()}
        </svg>
        <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: 5, color: '#9fd0ff' }}>ALL OF EARTH, SQUEEZED</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 120, color: '#fff', textShadow: '0 6px 30px #000' }}>
            {earthT < 1 ? `${Math.round(lerp(12742, 0.305, earthT)).toLocaleString('en-US')} km` : '305 m'}</div>
        </div>
      </Scene>
      <Flash f={f} at={Math.round(lerp(cue(at.earth), lineEnd(at.earth), 0.6))} len={5} color="#cfe6ff" />

      {/* mountains under a millimetre */}
      <Scene f={f} a={cue(at.mount)} b={cue(at.spin)} kind="push">
        <SpaceBg />
        <NeutronShader x={540} y={2600} size={3600} res={420} radius={0.42} spin={0.02} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <circle cx={540} cy={900} r={300} fill="#071022" stroke="#cfd6e3" strokeWidth={10} />
          <line x1={760} y1={1120} x2={900} y2={1260} stroke="#cfd6e3" strokeWidth={26} strokeLinecap="round" />
          <clipPath id="lens"><circle cx={540} cy={900} r={290} /></clipPath>
          <g clipPath="url(#lens)">
            <rect x={240} y={1000} width={600} height={300} fill="#8fc2ff" />
            <path d={`M 240 1000 L 470 1000 Q 540 ${1000 - 46 * mm} 610 1000 L 840 1000 L 840 1010 L 240 1010 Z`} fill="#bfe0ff" />
            {Array.from({ length: 11 }, (_, i) => <line key={i} x1={300} y1={1000 - i * 10} x2={i % 5 === 0 ? 340 : 325} y2={1000 - i * 10} stroke={ROUTE} strokeWidth={3} />)}
            <text x={350} y={905} fontFamily={MONO} fontWeight={700} fontSize={34} fill={ROUTE}>1 mm</text>
          </g>
        </svg>
        <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: 5, color: '#9fd0ff' }}>TALLEST MOUNTAINS</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 120, color: '#fff', textShadow: '0 6px 30px #000' }}>&lt; 1 mm</div>
        </div>
      </Scene>

      {/* it spins: the pulsar beams */}
      <Scene f={f} a={cue(at.spin)} b={cue(last)} kind="zoom">
        <SpaceBg />
        <div style={{ position: 'absolute', inset: 0, transform: shake(1.5) }}>
          <NeutronShader x={540} y={1000} size={1100} res={360} radius={0.2} spin={lerp(0.3, 2.2, EASE_INOUT(within(at.spin, 0, 0.6)))} beam={EASE_OUT(within(at.spin, 0, 0.3))} />
        </div>
        <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 84, color: '#fff', textShadow: '0 6px 30px #000' }}>HUNDREDS</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 48, color: ROUTE }}>OF SPINS EVERY SECOND</div>
        </div>
      </Scene>

      <Scene f={f} a={cue(last)} b={END + 30} kind="zoom">{hookScene(0.06)}</Scene>

      {(() => {
        const o = Math.max(1 - prog(f, cue(at.name) - 6, cue(at.name) + 6), prog(f, END - 22, END - 4));
        return (
          <>
            <div style={{ position: 'absolute', top: 170, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
              fontSize: 100, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.9)', opacity: o }}>
              {hook.top}<br /><span style={{ color: ROUTE }}>{hook.bottom}</span>
            </div>
            <div style={{ position: 'absolute', top: 1480, left: 0, right: 0, textAlign: 'center', opacity: o,
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

export default NeutronStar;
