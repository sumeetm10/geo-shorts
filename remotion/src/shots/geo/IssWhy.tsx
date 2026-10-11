import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { Atlas } from './Atlas';
import { EndCard } from './EndCard';
import { GlobeView, SpaceBg } from './Globe';
import { ISS } from './IssCrash';
import { ALERT, H, MONO, ROUTE, SANS, W, lerp, rng } from './parts';
import { Flash, Scene } from './Trans';

// =============================================================================
// Part 2 of the ISS deorbit: why not just leave it up there? The ageing station
// (air leaks, mold), Atlas spending half his time fixing it, Skylab falling on
// Western Australia in 1979 and the A$400 littering fine, the SpaceX tug with
// 46 thrusters, and the twist - lawmakers asking NASA to study saving it in a
// safe higher orbit. Script and sources: make_whatif.py "isspart2".
// =============================================================================
export const compositionConfig = {
  id: 'IssWhy',
  durationInSeconds: 31,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string; badge: string };
  at: { old: number; half: number; fall: number; sky: number; tug: number; save: number };
  durationInSeconds: number;
};

const WA = { lon: 123, lat: -32 };            // where Skylab's debris landed

// Skylab: the workshop cylinder, the one surviving wing, the solar "windmill"
const Skylab: React.FC<{ x: number; y: number; s: number; rot?: number }> = ({ x, y, s, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-90} y={-34} width={180} height={68} rx={10} fill="#d9d2c0" stroke="#000" strokeWidth={3} />
    <rect x={90} y={-20} width={70} height={40} fill="#b9b2a2" stroke="#000" strokeWidth={3} />
    <rect x={-60} y={34} width={120} height={70} fill="#2c4a7a" stroke="#000" strokeWidth={3} />
    {[-1, 1].map((d) => [-1, 1].map((e) => <rect key={`${d}${e}`} x={125 + d * 50 - 20} y={e * 60 - 14} width={40} height={28} fill="#2c4a7a" stroke="#000" strokeWidth={2} />))}
  </g>
);

// the SpaceX deorbit tug: a Dragon with a long trunk, nose-up under the station
const Tug: React.FC<{ x: number; y: number; s: number; burn: number }> = ({ x, y, s, burn }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {burn > 0 && Array.from({ length: 6 }, (_, i) => (
      <path key={i} d={`M ${-36 + i * 14.4} 150 L ${-30 + i * 14.4} ${150 + 170 * burn + 10 * Math.sin(i * 2 + burn * 30)} L ${-24 + i * 14.4} 150 Z`} fill="#ffcf6b" opacity={0.9} />
    ))}
    <rect x={-40} y={20} width={80} height={130} fill="#e9edf2" stroke="#000" strokeWidth={3} />
    {Array.from({ length: 5 }, (_, i) => <rect key={i} x={-40} y={34 + i * 22} width={80} height={6} fill="#1a1d22" />)}
    <path d="M -40 20 L -26 -30 Q 0 -44 26 -30 L 40 20 Z" fill="#f4f6f9" stroke="#000" strokeWidth={3} />
    <rect x={-10} y={-24} width={20} height={14} rx={4} fill="#20262e" />
  </g>
);

const IssWhy: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '', badge: '' }, at, durationInSeconds = 31 }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const last = vo.length - 1;
  const shake = (a: number) => `translate(${Math.sin(f * 1.7) * a}px, ${Math.cos(f * 2.3) * a}px)`;

  // hook: the station circling, a big question over it
  const hookScene = (t: number) => (
    <>
      <SpaceBg />
      <GlobeView id="wh" cx={540} cy={1900} R={1100} lon0={-40 - f * 0.12} lat0={35} />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <ISS x={lerp(820, 300, t)} y={lerp(860, 720, t)} s={0.95} rot={lerp(-12, 8, t)} />
        <text x={lerp(820, 300, t) + 150} y={lerp(860, 720, t) - 110} fontFamily={SANS} fontWeight={800} fontSize={220} fill={ROUTE}
          stroke="#000" strokeWidth={6} transform={`rotate(${8 * Math.sin(f / 6)} ${lerp(820, 300, t) + 200} ${lerp(860, 720, t) - 180})`}>?</text>
      </svg>
    </>
  );

  const pie = 0.5 * EASE_OUT(within(at.half, 0.15, 0.7));
  const fallT = EASE_INOUT(within(at.fall, 0.45, 1));
  const rain = within(at.sky, 0, 0.5);
  const fine = EASE_OUT(within(at.sky, 0.5, 0.65));
  const burn = f >= cue(at.tug) ? prog(f, lerp(cue(at.tug), lineEnd(at.tug), 0.35), lineEnd(at.tug)) : 0;
  const lift = EASE_INOUT(within(at.save, 0.15, 0.85));

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <Scene f={f} a={0} b={cue(at.old)} kind="zoom">{hookScene(prog(f, 0, cue(at.old) + 8))}</Scene>

      {/* it's old: leaks and mold */}
      <Scene f={f} a={cue(at.old)} b={cue(at.half)} kind="zoom">
        <SpaceBg />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <g style={{ transform: shake(1.2) }}><ISS x={540} y={1000} s={2.0} rot={-6} /></g>
          {[[480, 860], [600, 1150], [430, 1060]].map(([x, y], i) => {
            const o = within(at.old, 0.25 + i * 0.08, 0.6); if (o <= 0) return null;
            return <g key={i}>{Array.from({ length: 6 }, (_, k) => { const p = ((f / 14 + k / 6) % 1);
              return <circle key={k} cx={x - 30 - p * 220} cy={y - 20 - p * 90 + Math.sin(k) * 20} r={10 + p * 34} fill="#e8f3ff" opacity={0.6 * (1 - p) * Math.min(1, o * 3)} />; })}</g>; })}
          {within(at.old, 0.6, 0.7) > 0 && [[520, 930], [560, 1080], [500, 1180], [580, 900]].map(([x, y], i) => {
            const g = EASE_OUT(within(at.old, 0.6 + i * 0.05, 0.85));
            return <circle key={i} cx={x} cy={y} r={26 * g} fill="#5d8f2c" opacity={0.85} stroke="#2f4d12" strokeWidth={3} />; })}
        </svg>
        <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: 5, color: '#9fd0ff' }}>IN ORBIT SINCE</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 140, color: '#fff', textShadow: '0 6px 30px #000' }}>1998</div>
        </div>
        {within(at.old, 0.3, 0.4) > 0 && <div style={{ position: 'absolute', top: 1380, left: 80, fontFamily: SANS, fontWeight: 800, fontSize: 56, color: '#e8f3ff',
          transform: `scale(${lerp(1.4, 1, EASE_OUT(within(at.old, 0.3, 0.42)))})` }}>AIR LEAKS</div>}
        {within(at.old, 0.6, 0.7) > 0 && <div style={{ position: 'absolute', top: 1380, right: 80, fontFamily: SANS, fontWeight: 800, fontSize: 56, color: '#9fdc5a',
          transform: `scale(${lerp(1.4, 1, EASE_OUT(within(at.old, 0.6, 0.72)))})` }}>MOLD</div>}
      </Scene>

      {/* half their time fixing it */}
      <Scene f={f} a={cue(at.half)} b={cue(at.fall)} kind="push">
        <SpaceBg />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <rect x={-40} y={1180} width={1160} height={120} rx={20} fill="#e9edf2" stroke="#000" strokeWidth={4} />
          {Array.from({ length: 8 }, (_, i) => <circle key={i} cx={40 + i * 140} cy={1240} r={14} fill="#9aa6b2" />)}
          <g transform={`rotate(${Math.sin(f / 9) * 6} 640 1100)`}>
            <Atlas x={460} y={1170 + Math.sin(f / 12) * 10} s={4.2} t={f} walking={0.25} mood="shocked" left />
          </g>
          <g transform={`translate(${640 + Math.sin(f / 4) * 8} ${860}) rotate(${-30 + 25 * Math.sin(f / 3)}) scale(1.8)`}>
            <rect x={-8} y={0} width={16} height={90} rx={6} fill="#9aa6b2" stroke="#000" strokeWidth={3} />
            <path d="M -26 -6 Q 0 -40 26 -6 L 14 6 L 0 -10 L -14 6 Z" fill="#9aa6b2" stroke="#000" strokeWidth={3} />
          </g>
          {/* the day as a pie: half of it spent on repairs */}
          <circle cx={800} cy={620} r={130} fill="#1b2433" stroke="#fff" strokeWidth={6} />
          <path d={`M 800 620 L 800 490 A 130 130 0 ${pie > 0.5 ? 1 : 0} 1 ${800 + 130 * Math.sin(pie * 2 * Math.PI)} ${620 - 130 * Math.cos(pie * 2 * Math.PI)} Z`} fill={ALERT} />
          <text x={800} y={640} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={52} fill="#fff" stroke="#000" strokeWidth={2}>{Math.round(pie * 100)}%</text>
        </svg>
        <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 72, color: '#fff', textShadow: '0 6px 30px #000' }}>JUST FIXING IT</div>
        </div>
      </Scene>

      {/* left alone it falls anyway - like Skylab */}
      <Scene f={f} a={cue(at.fall)} b={cue(at.sky)} kind="whip">
        <SpaceBg />
        <GlobeView id="wf" cx={540} cy={1250} R={lerp(330, 560, fallT)} lon0={lerp(60, WA.lon, fallT)} lat0={lerp(0, WA.lat, fallT)} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {fallT <= 0 ? (() => { const k = within(at.fall, 0, 0.45);
            const pts = Array.from({ length: 70 }, (_, i) => { const q = i / 69 * k; const a = -1.5 + q * 6; const r = lerp(470, 360, q);
              return `${540 + Math.cos(a) * r},${1250 + Math.sin(a) * r * 0.45}`; });
            const p = pts[pts.length - 1].split(',').map(Number);
            return <g><polyline points={pts.join(' ')} fill="none" stroke={ALERT} strokeWidth={4} strokeDasharray="10 8" /><ISS x={p[0]} y={p[1]} s={0.22} /></g>;
          })() : (
            <g style={{ transform: shake(3) }}>
              <path d={`M ${lerp(900, 560, fallT) + 40} ${lerp(500, 1150, fallT) - 30} L ${lerp(900, 560, fallT) + 320} ${lerp(500, 1150, fallT) - 330}`} stroke="#ff8a2a" strokeWidth={60}
                strokeLinecap="round" opacity={0.45} />
              <Skylab x={lerp(900, 560, fallT)} y={lerp(500, 1150, fallT)} s={0.8} rot={-40 + f * 2} />
            </g>
          )}
        </svg>
        <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
          {fallT <= 0 ? (
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 80, color: '#fff', textShadow: '0 6px 30px #000' }}>LEFT ALONE?</div>
          ) : (
            <>
              <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 96, color: '#fff', textShadow: '0 6px 30px #000' }}>SKYLAB</div>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 60, color: ROUTE }}>JULY 11, 1979</div>
            </>
          )}
        </div>
      </Scene>

      {/* debris on Western Australia - and the fine */}
      <Scene f={f} a={cue(at.sky)} b={cue(at.tug)} kind="zoom">
        <SpaceBg />
        <GlobeView id="ws" cx={540} cy={1250} R={620} lon0={WA.lon} lat0={WA.lat} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {Array.from({ length: 26 }, (_, i) => { const r = rng(i + 400); const d = prog(rain, r() * 0.5, r() * 0.5 + 0.5);
            const tx = 470 + r() * 160; const ty = 1220 + r() * 90;
            if (d <= 0) return null;
            return <g key={i}>
              {d < 1 && <line x1={tx + 300 * (1 - d) + 60} y1={ty - 700 * (1 - d) - 140} x2={tx + 300 * (1 - d)} y2={ty - 700 * (1 - d)} stroke="#ff9a3c" strokeWidth={6} strokeLinecap="round" />}
              {d >= 1 && <circle cx={tx} cy={ty} r={7} fill="#2b2b2b" stroke="#ffcf6b" strokeWidth={3} />}
            </g>; })}
        </svg>
        <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 70, color: '#fff', textShadow: '0 6px 30px #000' }}>WESTERN AUSTRALIA</div>
        </div>
        {fine > 0 && (
          <div style={{ position: 'absolute', top: 560, left: 0, right: 0, textAlign: 'center', transform: `rotate(-5deg) scale(${lerp(1.6, 1, fine)})`, opacity: fine }}>
            <div style={{ display: 'inline-block', background: '#fffbe6', border: '6px solid #000', borderRadius: 12, padding: '18px 36px', boxShadow: '0 16px 40px #000' }}>
              <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 34, color: '#555', letterSpacing: 4 }}>FINE · ISSUED TO NASA</div>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 110, color: ALERT }}>A$400</div>
              <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 52, color: '#111' }}>LITTERING</div>
            </div>
          </div>
        )}
      </Scene>
      <Flash f={f} at={Math.round(lerp(cue(at.sky), lineEnd(at.sky), 0.5))} len={5} />

      {/* the SpaceX tug with 46 thrusters */}
      <Scene f={f} a={cue(at.tug)} b={cue(at.save)} kind="push">
        <SpaceBg />
        <GlobeView id="wt" cx={540} cy={2300} R={1200} lon0={-123} lat0={-30} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <g transform={`translate(0 ${-lerp(0, -260, EASE_INOUT(burn))})`} style={{ transform: burn > 0 ? shake(2.5) : undefined }}>
            <ISS x={540} y={1060} s={1.2} rot={0} />
            <g transform={`translate(540 ${lerp(420, 870, EASE_OUT(within(at.tug, 0, 0.3)))}) scale(1 -1)`}><Tug x={0} y={0} s={1.1} burn={burn > 0 ? 0.6 + 0.4 * Math.sin(f / 2) : 0} /></g>
          </g>
        </svg>
        <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: 5, color: '#9fd0ff' }}>SPACEX DEORBIT TUG</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 130, color: ROUTE, textShadow: '0 6px 30px #000' }}>{Math.round(46 * EASE_OUT(within(at.tug, 0.2, 0.6)))}</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 44, color: '#fff' }}>THRUSTERS</div>
        </div>
      </Scene>

      {/* twist: save it instead? */}
      <Scene f={f} a={cue(at.save)} b={cue(last)} kind="zoom">
        <SpaceBg />
        <GlobeView id="wv" cx={540} cy={1250} R={300} lon0={-f * 0.4} lat0={20} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <ellipse cx={540} cy={1250} rx={390} ry={140} fill="none" stroke="#9fd0ff" strokeWidth={3} strokeDasharray="8 10" opacity={1 - lift * 0.6} />
          <ellipse cx={540} cy={1250} rx={500} ry={420} fill="none" stroke="#5dff8a" strokeWidth={5} strokeDasharray="14 10" opacity={lift} />
          <ISS x={lerp(540 + 390 * Math.cos(-1.2), 540 + 500 * Math.cos(-1.9), lift)} y={lerp(1250 + 140 * Math.sin(-1.2), 1250 + 420 * Math.sin(-1.9), lift)} s={0.45} />
          {lift > 0.1 && <path d={`M 690 1110 Q 640 ${lerp(1100, 900, lift)} ${lerp(690, 450, lift)} ${lerp(1110, 870, lift)}`} stroke="#5dff8a" strokeWidth={6} fill="none" opacity={0.6} />}
        </svg>
        <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 70, color: '#fff', textShadow: '0 6px 30px #000' }}>OR...</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 96, color: '#5dff8a', textShadow: '0 6px 30px #000', opacity: EASE_OUT(within(at.save, 0.3, 0.5)) }}>SAVE IT?</div>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, color: '#cfe6ff', opacity: EASE_OUT(within(at.save, 0.5, 0.7)) }}>A SAFE, HIGHER ORBIT</div>
        </div>
      </Scene>

      {/* CTA: vote */}
      <Scene f={f} a={cue(last)} b={END + 30} kind="zoom">
        {hookScene(0.02)}
        <div style={{ position: 'absolute', top: 1180, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 40 }}>
          {[['CRASH IT', ALERT], ['SAVE IT', '#1fa55a']].map(([t, c], i) => (
            <div key={t} style={{ background: c, color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 56, padding: '16px 34px', borderRadius: 20, border: '5px solid #fff',
              transform: `scale(${1 + 0.05 * Math.sin(f / 4 + i * 3)})` }}>{t}</div>
          ))}
        </div>
      </Scene>

      {(() => {
        const o = Math.max(1 - prog(f, cue(at.old) - 6, cue(at.old) + 6), prog(f, END - 22, END - 4));
        return (
          <>
            <div style={{ position: 'absolute', top: 170, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
              fontSize: 96, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.9)', opacity: o }}>
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

export default IssWhy;
