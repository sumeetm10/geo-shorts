import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { EndCard } from './EndCard';
import { GlobeView, SpaceBg } from './Globe';
import { ALERT, H, MONO, ROUTE, SANS, W, lerp, rng } from './parts';
import { Flash, Scene } from './Trans';

// =============================================================================
// "NASA is going to crash the ISS into the ocean - on purpose." The station
// burning up over the ocean; the station itself; an orbit loop with a sunrise
// counter (16 a day); 2030 and the orbit spiralling down; the deorbit vehicle
// docking and firing; the globe turning to Point Nemo with distance rings; the
// spacecraft cemetery on the sea floor; and the twist - straight up from Point
// Nemo, the nearest people are on the ISS. Script and sources: make_whatif.py
// "issdeorbit".
// =============================================================================
export const compositionConfig = {
  id: 'IssCrash',
  durationInSeconds: 35,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string; badge: string };
  at: { big: number; fast: number; down: number; push: number; nemo: number; grave: number; twist: number };
  durationInSeconds: number;
};

const NEMO = { lon: -123.4, lat: -48.9 };

// the station, seen from above: truss, eight long solar wings, modules, radiators
export const ISS: React.FC<{ x: number; y: number; s: number; rot?: number; fire?: number; dv?: number }> = ({ x, y, s, rot = 0, fire = 0, dv = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {fire > 0 && (
      <g opacity={fire}>
        <defs><filter id="issfire" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22" /></filter></defs>
        <g filter="url(#issfire)">
          <ellipse cx={330} cy={0} rx={420} ry={150} fill="#ff5a14" opacity={0.55} />
          <ellipse cx={180} cy={0} rx={260} ry={110} fill="#ffb347" opacity={0.75} />
          <ellipse cx={-150} cy={0} rx={70} ry={190} fill="#fff1c9" opacity={0.9} />
        </g>
      </g>
    )}
    <rect x={-220} y={-6} width={440} height={12} fill="#b9c2cc" stroke="#000" strokeWidth={2} />
    {[-200, -150, 150, 200].map((px) => [-1, 1].map((d) => (
      <g key={`${px}${d}`}>
        <rect x={px - 18} y={d > 0 ? 10 : -150} width={36} height={140} fill="#9a6a1d" stroke="#000" strokeWidth={2} />
        {Array.from({ length: 7 }, (_, i) => <line key={i} x1={px - 18} y1={(d > 0 ? 10 : -150) + i * 20} x2={px + 18} y2={(d > 0 ? 10 : -150) + i * 20} stroke="#5a3d10" strokeWidth={1.5} />)}
      </g>
    )))}
    {[-60, 60].map((px) => <rect key={px} x={px - 26} y={-70} width={52} height={36} fill="#e9edf2" stroke="#000" strokeWidth={2} />)}
    <rect x={-14} y={-90} width={28} height={190} rx={10} fill="#eef1f5" stroke="#000" strokeWidth={2.5} />
    <rect x={-50} y={40} width={100} height={22} rx={8} fill="#dfe4ea" stroke="#000" strokeWidth={2} />
    {dv > 0 && (
      <g opacity={dv}>
        <rect x={-18} y={100} width={36} height={70} rx={6} fill="#2f3640" stroke="#000" strokeWidth={2} />
        <rect x={-12} y={108} width={24} height={10} fill={ROUTE} />
      </g>
    )}
  </g>
);

const IssCrash: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '', badge: '' }, at, durationInSeconds = 35 }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const last = vo.length - 1;
  const shake = (a: number) => `translate(${Math.sin(f * 1.7) * a}px, ${Math.cos(f * 2.3) * a}px)`;

  // hook: the station burning in over the Pacific
  const hookScene = (t: number) => (
    <>
      <SpaceBg />
      <GlobeView id="ih" cx={540} cy={1900} R={1100} lon0={NEMO.lon + 20 - t * 6} lat0={NEMO.lat + 30} />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {Array.from({ length: 14 }, (_, i) => { const r = rng(i + 3); const k = (t * 1.4 + r()) % 1;
          return <circle key={i} cx={lerp(560, 980, k) + r() * 60} cy={lerp(760, 420, k) + r() * 60} r={4 + r() * 6} fill="#ffb347" opacity={0.8 * (1 - k)} />; })}
        <g style={{ transform: shake(3) }}><ISS x={lerp(620, 470, t)} y={lerp(700, 860, t)} s={0.9} rot={-30} fire={1} /></g>
      </svg>
    </>
  );

  const orbitA = (f / 30) * 1.6;
  const rise = Math.min(16, Math.floor(16 * EASE_INOUT(within(at.fast, 0.05, 0.95))));
  const spiral = EASE_INOUT(prog(f, cue(at.down), cue(at.nemo)));
  const pushAt = at.push === at.down ? Math.round(lerp(cue(at.down), lineEnd(at.down), 0.4)) : cue(at.push);
  const ring = EASE_OUT(within(at.nemo, 0.2, 0.9));
  const up = EASE_INOUT(within(at.twist, 0.1, 0.7));

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <Scene f={f} a={0} b={cue(at.big)} kind="zoom">{hookScene(prog(f, 0, cue(at.big) + 8))}</Scene>

      {/* the largest spacecraft ever built */}
      <Scene f={f} a={cue(at.big)} b={cue(at.fast)} kind="zoom">
        <SpaceBg />
        <GlobeView id="ib" cx={540} cy={2350} R={1400} lon0={30 - f * 0.08} lat0={30} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <ISS x={540} y={980} s={lerp(1.6, 2.1, within(at.big, 0, 1))} rot={-8} />
        </svg>
        <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: 5, color: '#9fd0ff' }}>THE LARGEST SPACECRAFT</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 96, color: '#fff', textShadow: '0 6px 30px #000' }}>EVER BUILT</div>
        </div>
      </Scene>

      {/* 28,000 km/h, 16 sunrises a day */}
      <Scene f={f} a={cue(at.fast)} b={cue(at.down)} kind="push">
        <SpaceBg />
        <GlobeView id="if" cx={540} cy={1060} R={300} lon0={-f * 0.6} lat0={20} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <ellipse cx={540} cy={1060} rx={400} ry={150} fill="none" stroke="#9fd0ff" strokeWidth={3} strokeDasharray="8 10" transform="rotate(-18 540 1060)" />
          {(() => { const a = orbitA * 2.2; const ex = Math.cos(a) * 400; const ey = Math.sin(a) * 150; const c = Math.cos(-18 * Math.PI / 180); const s = Math.sin(-18 * Math.PI / 180);
            if (Math.sin(a) < -0.1 && Math.abs(Math.cos(a)) < 0.75) return null;
            return <ISS x={540 + ex * c - ey * s} y={1060 + ex * s + ey * c} s={0.18} rot={-18} />; })()}
          <circle cx={150} cy={720} r={60} fill="#ffd38a" opacity={0.25 + 0.2 * Math.sin(f / 3)} />
          <circle cx={150} cy={720} r={28} fill="#ffe9b0" />
        </svg>
        <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 110, color: '#fff', textShadow: '0 6px 30px #000' }}>
            {Math.round(28000 * EASE_OUT(within(at.fast, 0, 0.45))).toLocaleString('en-US')}</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: '#ffb199' }}>KM PER HOUR</div>
        </div>
        <div style={{ position: 'absolute', top: 1380, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 56, color: ROUTE }}>
          ☀ SUNRISES TODAY: <span style={{ fontFamily: MONO }}>{rise}</span>
        </div>
      </Scene>

      {/* after 2030 it comes down; a vehicle pushes it */}
      <Scene f={f} a={cue(at.down)} b={cue(at.nemo)} kind="whip">
        <SpaceBg />
        <GlobeView id="id" cx={540} cy={1100} R={330} lon0={NEMO.lon + 40 - f * 0.2} lat0={-20} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {(() => { const pts = Array.from({ length: 90 }, (_, i) => { const k = i / 89 * spiral; const a = -1.2 + k * 7; const r = lerp(470, 350, k);
            return `${540 + Math.cos(a) * r},${1100 + Math.sin(a) * r * 0.45}`; });
            const lastPt = pts[pts.length - 1].split(',').map(Number);
            return <g>
              <polyline points={pts.join(' ')} fill="none" stroke={spiral > 0.5 ? ALERT : '#9fd0ff'} strokeWidth={4} strokeDasharray="10 8" />
              <ISS x={lastPt[0]} y={lastPt[1]} s={0.22} dv={f >= pushAt ? 1 : 0} fire={f >= pushAt ? 0.6 : 0} />
            </g>; })()}
        </svg>
        <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
          {f < pushAt ? (
            <>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: 5, color: '#ffb199' }}>AFTER</div>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 150, color: '#fff', textShadow: '0 6px 30px #000' }}>2030</div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 60, color: '#fff', textShadow: '0 6px 30px #000' }}>DEORBIT VEHICLE</div>
              <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: ROUTE }}>AIMED AT ONE EXACT SPOT</div>
            </>
          )}
        </div>
      </Scene>
      <Flash f={f} at={pushAt} len={5} color="#ffe2b8" />

      {/* Point Nemo */}
      <Scene f={f} a={cue(at.nemo)} b={cue(at.grave)} kind="zoom">
        <SpaceBg />
        <GlobeView id="in" cx={540} cy={1100} R={lerp(330, 520, EASE_INOUT(within(at.nemo, 0, 0.5)))}
          lon0={lerp(NEMO.lon + 40, NEMO.lon, EASE_INOUT(within(at.nemo, 0, 0.5)))} lat0={lerp(-20, NEMO.lat, EASE_INOUT(within(at.nemo, 0, 0.5)))} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {[1, 2, 3].map((k) => <circle key={k} cx={540} cy={1100} r={ring * k * 130} fill="none" stroke={ROUTE} strokeWidth={4} opacity={(1 - (k - 1) * 0.25) * ring} />)}
          <circle cx={540} cy={1100} r={12} fill={ALERT} stroke="#fff" strokeWidth={4} />
        </svg>
        <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 104, color: '#fff', textShadow: '0 6px 30px #000' }}>POINT NEMO</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: ROUTE }}>FARTHEST FROM ANY LAND</div>
        </div>
      </Scene>

      {/* the spacecraft cemetery */}
      <Scene f={f} a={cue(at.grave)} b={cue(at.twist)} kind="push">
        <AbsoluteFill style={{ background: 'linear-gradient(#0b3a5c 0%, #062238 40%, #020b14 100%)' }} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M ${i * 130 - 40} 0 L ${i * 130 + 60} 0 L ${i * 130 + 200 + Math.sin(f / 20 + i) * 30} 1300 L ${i * 130 + 100} 1300 Z`}
            fill="#5fb3ff" opacity={0.05} />)}
          <path d="M 0 1500 Q 270 1440 540 1490 T 1080 1470 L 1080 1920 L 0 1920 Z" fill="#14100c" />
          {Array.from({ length: 16 }, (_, i) => { const r = rng(i + 40); const x = 60 + r() * 960; const y = 1460 + r() * 220; const w = 40 + r() * 90;
            return <g key={i} transform={`rotate(${(r() - 0.5) * 50} ${x} ${y})`}>
              <rect x={x - w / 2} y={y - 14} width={w} height={28} rx={6} fill="#4a4f57" stroke="#000" strokeWidth={2} />
              {r() > 0.5 && <rect x={x + w / 2} y={y - 6} width={w * 0.8} height={12} fill="#2c4a7a" stroke="#000" strokeWidth={2} />}
            </g>; })}
          {(() => { const t = within(at.grave, 0, 1); return <g transform={`rotate(${lerp(-20, 15, t)} 540 ${lerp(500, 1380, t)})`}>
            <rect x={490} y={lerp(500, 1380, t) - 22} width={100} height={44} rx={8} fill="#8a9099" stroke="#000" strokeWidth={2} />
            <rect x={590} y={lerp(500, 1380, t) - 10} width={110} height={20} fill="#2c4a7a" stroke="#000" strokeWidth={2} /></g>; })()}
          {Array.from({ length: 20 }, (_, i) => { const r = rng(i + 90); const y = ((r() * 1500 - f * (2 + r() * 3)) % 1500 + 1500) % 1500;
            return <circle key={i} cx={r() * W} cy={y} r={3 + r() * 6} fill="none" stroke="#bfe3ff" strokeWidth={2} opacity={0.5} />; })}
        </svg>
        <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 84, color: '#fff', textShadow: '0 6px 30px #000' }}>SPACECRAFT</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 84, color: '#9fd0ff', textShadow: '0 6px 30px #000' }}>CEMETERY</div>
        </div>
      </Scene>

      {/* twist: straight up, the nearest people */}
      <Scene f={f} a={cue(at.twist)} b={cue(last)} kind="zoom">
        <AbsoluteFill style={{ background: `linear-gradient(#01030a 0%, #07122a ${lerp(60, 40, up)}%, #0b3a5c 100%)` }} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {Array.from({ length: 160 }, (_, i) => { const r = rng(i + 7); return <circle key={i} cx={r() * W} cy={r() * 1100} r={0.6 + r() * 1.3} fill="#fff" opacity={0.3 + r() * 0.6} />; })}
          <path d="M 0 1560 Q 270 1530 540 1560 T 1080 1550 L 1080 1920 L 0 1920 Z" fill="#0a4a74" />
          <circle cx={540} cy={1555} r={14} fill={ALERT} stroke="#fff" strokeWidth={4} />
          <line x1={540} y1={1530} x2={540} y2={lerp(1530, 640, up)} stroke={ROUTE} strokeWidth={6} strokeDasharray="14 10" />
          {up > 0.95 && <ISS x={540} y={560} s={0.6} />}
          {up > 0.95 && <circle cx={540} cy={560} r={150 + 10 * Math.sin(f / 4)} fill="none" stroke={ROUTE} strokeWidth={5} />}
        </svg>
        <div style={{ position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 64, color: '#fff', textShadow: '0 6px 30px #000' }}>NEAREST HUMANS?</div>
        </div>
        {up > 0.95 && <div style={{ position: 'absolute', top: 780, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 70, color: ROUTE,
          transform: `scale(${lerp(1.4, 1, EASE_OUT(within(at.twist, 0.7, 0.85)))})` }}>UP THERE</div>}
      </Scene>

      <Scene f={f} a={cue(last)} b={END + 30} kind="zoom">{hookScene(0.03)}</Scene>

      {(() => {
        const o = Math.max(1 - prog(f, cue(at.big) - 6, cue(at.big) + 6), prog(f, END - 22, END - 4));
        return (
          <>
            <div style={{ position: 'absolute', top: 170, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
              fontSize: 92, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.9)', opacity: o }}>
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

export default IssCrash;
