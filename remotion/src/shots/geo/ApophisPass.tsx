import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { EndCard } from './EndCard';
import { GlobeView, SpaceBg } from './Globe';
import { ALERT, H, MONO, ROUTE, SANS, W, lerp, ridge, rng } from './parts';
import { Flash, Scene } from './Trans';

// =============================================================================
// "Apophis flies closer than our satellites on Friday 13 April 2029." Earth with
// its ring of geostationary satellites and the asteroid sweeping through; the
// serpent it is named after; a 2.7% impact meter; the path bending away under
// RULED OUT; a to-scale side view (Earth radius 6,371 km, the asteroid at
// 31,600 km up, inside the satellites at 35,786 km); and a night sky where you
// can see it. Script and sources: make_whatif.py "apophis".
// =============================================================================
export const compositionConfig = {
  id: 'ApophisPass',
  durationInSeconds: 32,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string; badge: string };
  at: { name: number; odds: number; ruled: number; close: number; sats: number; eyes: number };
  durationInSeconds: number;
};

const LUMPS = (() => { const r = rng(2029); return Array.from({ length: 26 }, () => 0.78 + r() * 0.22); })();
const PITS = (() => { const r = rng(13); return Array.from({ length: 11 }, () => [(r() - 0.5) * 1.3, (r() - 0.5) * 0.9, 0.06 + r() * 0.13]); })();
// Apophis is elongated (450 x 170 m first estimates): drawn as a peanut
export const Asteroid: React.FC<{ x: number; y: number; r: number; rot: number; trail?: number }> = ({ x, y, r, rot, trail = 0 }) => (
  <g>
    {trail > 0 && <path d={`M ${x} ${y} L ${x + r * 9} ${y - r * 5.5}`} stroke="#9fd0ff" strokeWidth={r * 0.9} strokeLinecap="round" opacity={0.18 * trail} />}
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(1.6 1)`}>
      <defs>
        <radialGradient id="apo" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#b8aa98" /><stop offset="0.6" stopColor="#6e6356" /><stop offset="1" stopColor="#2e2822" />
        </radialGradient>
      </defs>
      <path d={LUMPS.map((k, i) => { const a = (i / LUMPS.length) * Math.PI * 2; const pinch = 1 - 0.18 * Math.pow(Math.cos(a), 2) * 0;
        return `${i ? 'L' : 'M'} ${Math.cos(a) * r * k} ${Math.sin(a) * r * k * pinch * (0.62 + 0.38 * Math.abs(Math.cos(a)))}`; }).join(' ') + ' Z'}
        fill="url(#apo)" stroke="#1b1612" strokeWidth={Math.max(1.5, r * 0.04)} />
      {PITS.map(([px, py, pr], i) => <circle key={i} cx={px * r * 0.7} cy={py * r * 0.5} r={pr * r * 0.6} fill="#3f372f" opacity={0.6} />)}
    </g>
  </g>
);

const ApophisPass: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '', badge: '' }, at, durationInSeconds = 32 }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const last = vo.length - 1;
  const spin = 20 - f * 0.5;

  // hook: the satellite ring and the asteroid sweeping through it
  const sweep = prog(f, 0, cue(at.name) + 10);
  const hookScene = (t: number) => (
    <>
      <SpaceBg />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <ellipse cx={540} cy={1060} rx={470} ry={120} fill="none" stroke="#5f6b85" strokeWidth={3} strokeDasharray="6 10" />
        {Array.from({ length: 22 }, (_, i) => { const a = (i / 22) * Math.PI * 2 + f / 120; if (Math.sin(a) < 0) return null;
          return <rect key={i} x={540 + Math.cos(a) * 470 - 6} y={1060 + Math.sin(a) * 120 - 4} width={12} height={8} fill="#cfd8e3" />; })}
      </svg>
      <GlobeView id="ah" cx={540} cy={1060} R={300} lon0={spin} lat0={12} />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {Array.from({ length: 22 }, (_, i) => { const a = (i / 22) * Math.PI * 2 + f / 120; if (Math.sin(a) >= 0) return null;
          return <rect key={i} x={540 + Math.cos(a) * 470 - 6} y={1060 + Math.sin(a) * 120 - 4} width={12} height={8} fill="#cfd8e3" />; })}
        <Asteroid x={lerp(900, -80, t)} y={lerp(470, 1240, t)} r={58} rot={f * 3} trail={1} />
      </svg>
    </>
  );

  const odds = 2.7 * EASE_OUT(within(at.odds, 0.1, 0.7));
  const bend = EASE_INOUT(within(at.ruled, 0.1, 0.8));
  // to scale: 100 px = Earth's radius (6,371 km)
  const ER = 100; const k = ER / 6371;
  const pass = EASE_INOUT(prog(f, cue(at.close), cue(at.eyes)));
  const loopT = prog(f, cue(last), END - 2);

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <Scene f={f} a={0} b={cue(at.name)} kind="zoom">{hookScene(sweep)}</Scene>

      {/* the name */}
      <Scene f={f} a={cue(at.name)} b={cue(at.odds)} kind="zoom">
        <SpaceBg />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <path d={`M 120 1300 C 300 1100, 200 900, 420 820 S 760 900, 820 700 S 980 520, 900 420`} stroke="#3a2a40" strokeWidth={90} fill="none"
            strokeLinecap="round" opacity={0.55} />
          <circle cx={900} cy={420} r={34} fill="#3a2a40" opacity={0.55} />
          <circle cx={912} cy={410} r={7} fill={ALERT} opacity={0.8} />
          <Asteroid x={540} y={960} r={200} rot={f * 0.8} />
        </svg>
        <div style={{ position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 130, color: '#fff', textShadow: '0 6px 30px #000', letterSpacing: 6 }}>APOPHIS</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 38, color: '#c9a0ff' }}>NAMED AFTER A SERPENT OF DARKNESS</div>
        </div>
      </Scene>

      {/* 2.7% then ruled out */}
      <Scene f={f} a={cue(at.odds)} b={cue(at.close)} kind="push">
        <SpaceBg />
        <GlobeView id="ao" cx={420} cy={1180} R={210} lon0={spin} lat0={12} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {/* the path: aimed at Earth, then bending away */}
          <path d={`M 1000 420 Q ${lerp(640, 900, bend)} ${lerp(820, 1000, bend)} ${lerp(470, 980, bend)} ${lerp(1120, 1500, bend)}`}
            stroke={bend > 0.5 ? '#5dff8a' : ALERT} strokeWidth={6} strokeDasharray="14 12" fill="none" />
          <Asteroid x={1000} y={420} r={40} rot={f * 2} />
          {f < cue(at.ruled) && <circle cx={470} cy={1120} r={30 + 10 * Math.sin(f / 3)} fill="none" stroke={ALERT} strokeWidth={6} />}
        </svg>
        <div style={{ position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#ffb199' }}>2004 · CHANCE OF IMPACT</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 150, color: f < cue(at.ruled) ? ALERT : '#8b93a6', textShadow: '0 6px 30px #000',
            textDecoration: f >= cue(at.ruled) && bend > 0.3 ? 'line-through' : 'none' }}>{odds.toFixed(1)}%</div>
        </div>
        {f >= cue(at.ruled) && (
          <div style={{ position: 'absolute', top: 640, left: 0, right: 0, textAlign: 'center', transform: `rotate(-8deg) scale(${lerp(1.5, 1, EASE_OUT(within(at.ruled, 0.2, 0.45)))})`,
            opacity: EASE_OUT(within(at.ruled, 0.2, 0.4)) }}>
            <span style={{ display: 'inline-block', border: '10px solid #5dff8a', color: '#5dff8a', fontFamily: SANS, fontWeight: 800, fontSize: 92,
              padding: '4px 28px', borderRadius: 14, background: 'rgba(0,0,0,0.4)' }}>RULED OUT</span>
          </div>
        )}
      </Scene>
      <Flash f={f} at={Math.round(lerp(cue(at.ruled), lineEnd(at.ruled), 0.22))} len={6} color="#c8ffd8" />

      {/* to scale: 31,600 km, inside the satellites at 35,786 km */}
      <Scene f={f} a={cue(at.close)} b={cue(at.eyes)} kind="whip">
        <SpaceBg />
        <GlobeView id="ac" cx={160} cy={1000} R={ER} lon0={spin} lat0={12} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <circle cx={160} cy={1000} r={(6371 + 35786) * k} fill="none" stroke="#9fd0ff" strokeWidth={4} strokeDasharray="10 10"
            opacity={f >= cue(at.sats) ? 1 : 0.35} />
          {f >= cue(at.sats) && Array.from({ length: 9 }, (_, i) => { const a = -0.9 + i * 0.22;
            return <rect key={i} x={160 + Math.cos(a) * (6371 + 35786) * k - 8} y={1000 + Math.sin(a) * (6371 + 35786) * k - 5} width={16} height={10} fill="#cfd8e3" />; })}
          {(() => {
            const d = (6371 + 31600) * k; const a = lerp(-1.1, 1.1, pass);
            const x = 160 + Math.cos(a) * d; const y = 1000 + Math.sin(a) * d;
            return (
              <g>
                <path d={`M ${160 + Math.cos(-1.1) * d} ${1000 + Math.sin(-1.1) * d} A ${d} ${d} 0 0 1 ${x} ${y}`} stroke={ROUTE} strokeWidth={5} fill="none" />
                <Asteroid x={x} y={y} r={22} rot={f * 3} />
                <line x1={160} y1={1000} x2={x} y2={y} stroke={ROUTE} strokeWidth={2} strokeDasharray="6 8" opacity={0.7} />
              </g>
            );
          })()}
          {f >= cue(at.sats) && <text x={470} y={1420} fontFamily={SANS} fontWeight={800} fontSize={30} fill="#9fd0ff">SATELLITES · 35,786 km</text>}
        </svg>
        <div style={{ position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#ffd38a' }}>ABOVE THE SURFACE</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 130, color: '#fff', textShadow: '0 6px 30px #000' }}>
            {Math.round(31600 * EASE_OUT(within(at.close, 0.1, 0.7))).toLocaleString('en-US')} km</div>
          {f >= cue(at.sats) && <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 44, color: ALERT }}>CLOSER THAN THE SATELLITES</div>}
        </div>
      </Scene>

      {/* see it with your own eyes */}
      <Scene f={f} a={cue(at.eyes)} b={cue(last)} kind="zoom">
        <AbsoluteFill style={{ background: 'linear-gradient(#01030a 0%, #07122a 70%, #0d1b33 100%)' }} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {Array.from({ length: 220 }, (_, i) => { const r = rng(i + 77); return <circle key={i} cx={r() * W} cy={r() * 1300} r={0.6 + r() * 1.4} fill="#fff" opacity={0.3 + r() * 0.6} />; })}
          {(() => { const t = within(at.eyes, 0, 1); const x = lerp(200, 900, t); const y = lerp(380, 640, t);
            return <g><line x1={x - 140} y1={y - 50} x2={x} y2={y} stroke="#cfe6ff" strokeWidth={3} opacity={0.5} /><circle cx={x} cy={y} r={7} fill="#fff" /><circle cx={x} cy={y} r={22} fill="#fff" opacity={0.2} /></g>; })()}
          {(() => { const R = ridge(55); return <path d={`M ${R.map(([x, h]) => `${-40 + x * 1160},${1420 - h * 150}`).join(' L ')} L 1120 1920 L -40 1920 Z`} fill="#03050a" />; })()}
          <g transform="translate(700 1330)" fill="#03050a">
            <circle cx={0} cy={-120} r={22} /><rect x={-20} y={-100} width={40} height={90} rx={14} /><rect x={-18} y={-12} width={14} height={70} /><rect x={4} y={-12} width={14} height={70} />
            <line x1={10} y1={-90} x2={34} y2={-140} stroke="#03050a" strokeWidth={10} strokeLinecap="round" />
          </g>
        </svg>
        <div style={{ position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 76, color: '#fff', textShadow: '0 6px 30px #000' }}>NO TELESCOPE</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 76, color: ROUTE }}>NEEDED</div>
        </div>
      </Scene>

      <Scene f={f} a={cue(last)} b={END + 30} kind="zoom">{hookScene(loopT * 0.05)}</Scene>

      {(() => {
        const o = Math.max(1 - prog(f, cue(at.name) - 6, cue(at.name) + 6), prog(f, END - 22, END - 4));
        return (
          <>
            <div style={{ position: 'absolute', top: 170, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
              fontSize: 100, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.9)', opacity: o }}>
              {hook.top}<br /><span style={{ color: ROUTE }}>{hook.bottom}</span>
            </div>
            <div style={{ position: 'absolute', top: 1440, left: 0, right: 0, textAlign: 'center', opacity: o,
              transform: `rotate(-3deg) scale(${1 + 0.04 * Math.sin(f / 5)})` }}>
              <span style={{ display: 'inline-block', background: '#ff2d2d', color: '#fff', fontFamily: SANS, fontWeight: 800,
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

export default ApophisPass;
