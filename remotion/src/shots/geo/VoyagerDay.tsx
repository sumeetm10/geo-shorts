import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { Sun } from './BlackHole';
import { EndCard } from './EndCard';
import { GlobeView, SpaceBg } from './Globe';
import { ALERT, H, MONO, ROUTE, SANS, W, lerp, rng } from './parts';
import { Flash, Scene } from './Trans';

// =============================================================================
// "Voyager 1 is about to be one light-day from Earth." First second: the probe
// rushes past the camera into the dark. Then: 1977 and still talking (signal
// arcs home); the zoom-out past Neptune's orbit to 25.6 billion km; a signal
// crawling home with a clock passing 23 hours; the clock and the calendar hit
// 24:00 / NOV 18; the probe crossing a "1 light-day" boundary nobody has
// crossed; and 17 km/s. Transitions: zoom / push / whip (Trans.tsx).
// Script and sources: make_whatif.py "voyager".
// =============================================================================
export const compositionConfig = {
  id: 'VoyagerDay',
  durationInSeconds: 30,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string; badge: string };
  at: { name: number; far: number; signal: number; day: number; record: number; speed: number };
  durationInSeconds: number;
};

// Voyager, drawn: high-gain dish, bus, magnetometer boom, power (RTG) boom
export const Probe: React.FC<{ x: number; y: number; s: number; rot?: number }> = ({ x, y, s, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <line x1={10} y1={10} x2={210} y2={120} stroke="#cfd8e3" strokeWidth={3} />
    <line x1={-10} y1={14} x2={-150} y2={80} stroke="#9aa6b2" strokeWidth={6} />
    {[0, 1, 2].map((i) => <rect key={i} x={-150 + i * 20 - 8} y={70 + i * 9 - 8} width={18} height={16} rx={3} fill="#8a6d3b" stroke="#000" strokeWidth={1.5} />)}
    <polygon points="-22,4 -12,-14 12,-14 22,4 12,22 -12,22" fill="#5f6b78" stroke="#000" strokeWidth={2} />
    <rect x={-8} y={-10} width={16} height={8} fill="#d4a017" />
    <ellipse cx={0} cy={-34} rx={58} ry={20} fill="#f2f4f8" stroke="#000" strokeWidth={2.5} />
    <ellipse cx={0} cy={-37} rx={44} ry={13} fill="#dfe6ee" />
    <line x1={0} y1={-37} x2={0} y2={-60} stroke="#cfd8e3" strokeWidth={3} />
    <circle cx={0} cy={-62} r={4} fill="#cfd8e3" />
  </g>
);

const STREAKS = (() => { const r = rng(1977); return Array.from({ length: 90 }, () => ({ a: r() * Math.PI * 2, d: r(), s: 1 + r() * 2 })); })();

const VoyagerDay: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '', badge: '' }, at, durationInSeconds = 30 }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const last = vo.length - 1;

  // ---- hook: the probe rushes past and away, stars streaking
  const fly = prog(f, 0, cue(at.name));
  const hookScene = (t: number) => (
    <>
      <AbsoluteFill style={{ background: '#000' }} />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {STREAKS.map((st, i) => {
          const d = ((st.d + f * 0.012) % 1); const r1 = 40 + d * 900; const r2 = r1 + 30 + d * 160;
          return <line key={i} x1={540 + Math.cos(st.a) * r1} y1={900 + Math.sin(st.a) * r1} x2={540 + Math.cos(st.a) * r2}
            y2={900 + Math.sin(st.a) * r2} stroke="#fff" strokeWidth={st.s} opacity={0.25 + 0.6 * d} />;
        })}
        <Probe x={lerp(700, 560, t)} y={lerp(1250, 860, t)} s={lerp(3.4, 0.7, EASE_OUT(t))} rot={lerp(-25, -8, t)} />
      </svg>
    </>
  );

  // ---- far: zoom out past the planets (Neptune 30 AU; Voyager ~171 AU)
  const zoom = EASE_INOUT(within(at.far, 0, 0.7));
  const AUpx = lerp(60, 2.5, zoom);                          // px per AU
  const vx = 540 + 171 * AUpx * 0.62; const vy = 960 - 171 * AUpx * 0.78;
  const km = 25.6 * EASE_OUT(within(at.far, 0.1, 0.8));

  // ---- signal home: the clock crawls past 23 hours, then 24:00 on Nov 18
  const sig = EASE_INOUT(within(at.signal, 0.05, 1));
  const hours = f < cue(at.day) ? 23 * sig : 23 + EASE_INOUT(within(at.day, 0.1, 0.7));
  const hh = Math.floor(hours); const mm = Math.floor((hours - hh) * 60);

  // ---- record + speed
  const cross = EASE_INOUT(within(at.record, 0.05, 0.9));
  const loopT = prog(f, cue(last), END - 2);

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <Scene f={f} a={0} b={cue(at.name)} kind="zoom">{hookScene(fly)}</Scene>

      {/* 1977, still talking */}
      <Scene f={f} a={cue(at.name)} b={cue(at.far)} kind="zoom" out="zoom">
        <SpaceBg />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <Probe x={720} y={760} s={1.5} rot={-12} />
          {[0, 1, 2, 3].map((k) => {
            const t = ((f * 0.025 + k / 4) % 1);
            return <path key={k} d={`M ${660 - t * 420} ${800 + t * 520} a ${60 + t * 160} ${60 + t * 160} 0 0 1 ${80 + t * 160} ${-40 - t * 80}`}
              stroke={ROUTE} strokeWidth={5} fill="none" opacity={1 - t} />;
          })}
        </svg>
        <GlobeView id="v-earth" cx={250} cy={1370} R={110} lon0={20 - f * 0.6} lat0={12} />
        <div style={{ position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#9fc8ea' }}>VOYAGER 1 · LAUNCHED</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 150, color: '#fff', textShadow: '0 6px 30px #000' }}>1977</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: ROUTE }}>STILL SENDING MESSAGES HOME</div>
        </div>
      </Scene>

      {/* 25.6 billion km: zoom out past the planets */}
      <Scene f={f} a={cue(at.far)} b={cue(at.signal)} kind="push">
        <SpaceBg />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {[1, 5.2, 9.6, 19.2, 30.1].map((a) => (
            <circle key={a} cx={540} cy={960} r={a * AUpx} fill="none" stroke={a === 30.1 ? '#9fd0ff' : '#5f6b85'} strokeWidth={a === 30.1 ? 3 : 2} />
          ))}
          <Sun x={540} y={960} r={Math.max(3, 0.005 * AUpx * 200)} />
          {30.1 * AUpx < 700 && <text x={540} y={960 - 30.1 * AUpx - 12} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={26} fill="#9fd0ff">NEPTUNE</text>}
          <line x1={540} y1={960} x2={vx} y2={vy} stroke={ROUTE} strokeWidth={3} strokeDasharray="10 10" opacity={zoom} />
          <Probe x={Math.min(1000, vx)} y={Math.max(380, vy)} s={0.5} rot={-20} />
        </svg>
        <div style={{ position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#9fc8ea' }}>DISTANCE FROM US</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 110, color: '#fff', textShadow: '0 6px 30px #000' }}>{km.toFixed(1)} BN KM</div>
        </div>
      </Scene>

      {/* the signal crawling home; 24:00 on Nov 18 */}
      <Scene f={f} a={cue(at.signal)} b={cue(at.record)} kind="whip">
        <SpaceBg />
        <GlobeView id="v-home" cx={200} cy={1260} R={120} lon0={20 - f * 0.6} lat0={12} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <Probe x={890} y={560} s={0.9} rot={-15} />
          <line x1={880} y1={600} x2={260} y2={1180} stroke="#5f6b85" strokeWidth={3} strokeDasharray="6 12" />
          {(() => { const t = f < cue(at.day) ? sig : 1; const x = lerp(880, 260, t); const y = lerp(600, 1180, t);
            return <g><circle cx={x} cy={y} r={34} fill={ROUTE} opacity={0.25} /><circle cx={x} cy={y} r={12} fill={ROUTE} /></g>; })()}
          {/* the clock */}
          <g transform="translate(540 900)">
            <circle r={150} fill="rgba(6,10,18,0.9)" stroke={f >= cue(at.day) ? ALERT : '#cfe0ff'} strokeWidth={8} />
            {Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2;
              return <line key={i} x1={Math.sin(a) * 128} y1={-Math.cos(a) * 128} x2={Math.sin(a) * 142} y2={-Math.cos(a) * 142} stroke="#cfe0ff" strokeWidth={i % 6 ? 2 : 5} />; })}
            <path d={`M 0 0 L 0 -140 A 140 140 0 ${hours > 12 ? 1 : 0} 1 ${Math.sin((hours / 24) * Math.PI * 2) * 140} ${-Math.cos((hours / 24) * Math.PI * 2) * 140} Z`}
              fill={f >= cue(at.day) ? ALERT : ROUTE} opacity={0.35} />
            <line x1={0} y1={0} x2={Math.sin((hours / 24) * Math.PI * 2) * 120} y2={-Math.cos((hours / 24) * Math.PI * 2) * 120} stroke="#fff" strokeWidth={8} strokeLinecap="round" />
          </g>
        </svg>
        <div style={{ position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#9fc8ea' }}>
            {f < cue(at.day) ? 'ONE SIGNAL, ONE WAY' : 'NOVEMBER 18, 2026'}</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 130, color: f >= cue(at.day) ? ALERT : '#fff', textShadow: '0 6px 30px #000' }}>
            {String(hh).padStart(2, '0')}:{String(mm).padStart(2, '0')}</div>
          {f >= cue(at.day) && <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 48, color: ROUTE, opacity: within(at.day, 0.6, 0.8) }}>1 LIGHT-DAY</div>}
        </div>
      </Scene>
      <Flash f={f} at={Math.round(lerp(cue(at.day), lineEnd(at.day), 0.7))} color="#ffe6a0" />

      {/* nobody has been this far; still 17 km/s */}
      <Scene f={f} a={cue(at.record)} b={cue(last)} kind="zoom">
        <SpaceBg />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {f >= cue(at.speed) && STREAKS.map((st, i) => {
            const d = ((st.d + f * 0.03) % 1); const y = 200 + st.a * 230; const x = 1100 - d * 1300;
            return <line key={i} x1={x} y1={y} x2={x + 140} y2={y} stroke="#cfe6ff" strokeWidth={st.s} opacity={0.5} />;
          })}
          <circle cx={-900} cy={960} r={1500} fill="none" stroke={ROUTE} strokeWidth={6} strokeDasharray="20 14" />
          <text x={450} y={1380} fontFamily={SANS} fontWeight={800} fontSize={36} fill={ROUTE} transform="rotate(12 450 1380)">1 LIGHT-DAY</text>
          <Probe x={f < cue(at.speed) ? lerp(420, 760, cross) : 760} y={960} s={1.4} rot={-6} />
        </svg>
        <div style={{ position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center' }}>
          {f < cue(at.speed) ? (
            <>
              <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 70, color: '#fff', textShadow: '0 6px 30px #000' }}>NOTHING WE MADE</div>
              <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 70, color: ROUTE }}>HAS GONE FARTHER</div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#9fc8ea' }}>STILL FLYING AT</div>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 150, color: '#fff', textShadow: '0 6px 30px #000' }}>17 km/s</div>
            </>
          )}
        </div>
      </Scene>

      {/* loop back to the opening */}
      <Scene f={f} a={cue(last)} b={END + 30} kind="zoom">{hookScene(1 - loopT)}</Scene>

      {(() => {
        const o = Math.max(1 - prog(f, cue(at.name) - 6, cue(at.name) + 6), prog(f, END - 22, END - 4));
        return (
          <>
            <div style={{ position: 'absolute', top: 170, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
              fontSize: 104, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.9)', opacity: o }}>
              {hook.top}<br /><span style={{ color: ROUTE }}>{hook.bottom}</span>
            </div>
            <div style={{ position: 'absolute', top: 1420, left: 0, right: 0, textAlign: 'center', opacity: o,
              transform: `rotate(-3deg) scale(${1 + 0.04 * Math.sin(f / 5)})` }}>
              <span style={{ display: 'inline-block', background: '#ff2d2d', color: '#fff', fontFamily: SANS, fontWeight: 800,
                fontSize: 62, padding: '10px 30px', borderRadius: 18, border: '5px solid #fff' }}>{hook.badge}</span>
            </div>
          </>
        );
      })()}

      <EndCard from={cue(last)} to={END - 14} text="" compact />
      <Captions lines={vo} y={1600} accent={ROUTE} maxWords={3} size={58} plate />
    </AbsoluteFill>
  );
};

export default VoyagerDay;
