import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { EndCard } from './EndCard';
import { GlobeView, SpaceBg } from './Globe';
import { ALERT, H, MONO, ROUTE, SANS, W, lerp } from './parts';
import { Flash, Scene } from './Trans';

// =============================================================================
// "Nepal's flag breaks a rule every other country follows." A wall of real
// (rectangular) flags; Nepal's double pennant slams into the middle; outlines
// show every flag is a rectangle but one; height vs width; a whip to the globe
// ("not the strangest thing"); ten highest peaks with eight lit up; a NEVER
// COLONISED stamp; and two clocks 5:45 apart. Script and sources:
// make_whatif.py "nepal".
// =============================================================================
export const compositionConfig = {
  id: 'NepalFacts',
  durationInSeconds: 26,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string; badge: string };
  at: { rect: number; tall: number; strange: number; peaks: number; never: number; clock: number };
  durationInSeconds: number;
};

const WALL = ['in', 'cn', 'us', 'jp', 'br', 'de', 'fr', 'gb', 'it', 'ru', 'bd', 'pk', 'lk', 'bt', 'kr', 'id', 'th', 'vn', 'ca', 'mx',
  'ar', 'eg', 'ng', 'za', 'ke', 'au', 'nz', 'es', 'pt', 'se', 'no', 'fi', 'tr', 'sa', 'ae', 'ir', 'my', 'ph', 'gh', 'co', 'pe', 'cl'];

// Nepal's flag: a double pennon, crimson with a blue border; moon above, sun below
export const NepalFlag: React.FC<{ x: number; y: number; h: number; o?: number }> = ({ x, y, h, o = 1 }) => {
  const w = h * 0.82;
  const pts = `0,0 ${w},${h * 0.52} ${w * 0.35},${h * 0.52} ${w},${h} 0,${h}`;
  return (
    <g transform={`translate(${x - w / 2} ${y - h / 2})`} opacity={o}>
      <polygon points={pts} fill="#003893" stroke="#003893" strokeWidth={h * 0.06} strokeLinejoin="miter" />
      <polygon points={pts} fill="#dc143c" />
      <g transform={`translate(${w * 0.24} ${h * 0.33})`}>
        <path d={`M ${-h * 0.09} 0 A ${h * 0.09} ${h * 0.09} 0 0 0 ${h * 0.09} 0 A ${h * 0.11} ${h * 0.075} 0 0 1 ${-h * 0.09} 0 Z`} fill="#fff" />
        {Array.from({ length: 8 }, (_, i) => { const a = Math.PI + (i / 7) * Math.PI;
          return <polygon key={i} points={`${Math.cos(a) * h * 0.05},${-h * 0.03 + Math.sin(a) * h * 0.05} ${Math.cos(a - 0.15) * h * 0.075},${-h * 0.03 + Math.sin(a - 0.15) * h * 0.075} ${Math.cos(a + 0.15) * h * 0.075},${-h * 0.03 + Math.sin(a + 0.15) * h * 0.075}`} fill="#fff" />; })}
      </g>
      <g transform={`translate(${w * 0.24} ${h * 0.77})`}>
        {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2;
          return <polygon key={i} points={`${Math.cos(a - 0.2) * h * 0.06},${Math.sin(a - 0.2) * h * 0.06} ${Math.cos(a) * h * 0.11},${Math.sin(a) * h * 0.11} ${Math.cos(a + 0.2) * h * 0.06},${Math.sin(a + 0.2) * h * 0.06}`} fill="#fff" />; })}
        <circle r={h * 0.065} fill="#fff" />
      </g>
    </g>
  );
};

// the ten highest mountains, roughly to scale; eight are in Nepal (the other two are K2 and Nanga Parbat)
const PEAKS = [8849, 8611, 8586, 8516, 8485, 8188, 8167, 8163, 8126, 8091];
const IN_NEPAL = [true, false, true, true, true, true, true, true, false, true];

const Clock: React.FC<{ x: number; y: number; r: number; h: number; m: number; label: string; color: string }> = ({ x, y, r, h, m, label, color }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill="rgba(6,10,18,0.92)" stroke={color} strokeWidth={8} />
    {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2;
      return <line key={i} x1={Math.sin(a) * r * 0.82} y1={-Math.cos(a) * r * 0.82} x2={Math.sin(a) * r * 0.93} y2={-Math.cos(a) * r * 0.93} stroke="#cfe0ff" strokeWidth={i % 3 ? 2 : 5} />; })}
    <line x1={0} y1={0} x2={Math.sin(((h % 12) + m / 60) / 12 * Math.PI * 2) * r * 0.5} y2={-Math.cos(((h % 12) + m / 60) / 12 * Math.PI * 2) * r * 0.5} stroke="#fff" strokeWidth={9} strokeLinecap="round" />
    <line x1={0} y1={0} x2={Math.sin(m / 60 * Math.PI * 2) * r * 0.78} y2={-Math.cos(m / 60 * Math.PI * 2) * r * 0.78} stroke={color} strokeWidth={6} strokeLinecap="round" />
    <text y={r + 56} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={34} fill="#fff">{label}</text>
    <text y={r + 100} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={40} fill={color}>{String(h).padStart(2, '0')}:{String(Math.floor(m)).padStart(2, '0')}</text>
  </g>
);

const NepalFacts: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '', badge: '' }, at, durationInSeconds = 26 }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const last = vo.length - 1;

  const slam = EASE_OUT(prog(f, 6, 22));
  const wall = (dim: number, outline: number) => (
    <>
      <AbsoluteFill style={{ background: '#0b0f18' }} />
      {WALL.map((c, i) => {
        const col = i % 6; const row = Math.floor(i / 6);
        const x = 40 + col * 170; const y = 430 + row * 140 + ((col % 2) * 24);
        return (
          <div key={c} style={{ position: 'absolute', left: x, top: y, width: 150, height: 100, opacity: 1 - dim * 0.7,
            transform: `scale(${1 + 0.03 * Math.sin(f / 9 + i)})`, outline: outline > 0 ? `${4 * outline}px solid ${ROUTE}` : undefined }}>
            <Img src={staticFile(`flags/${c}.png`)} style={{ width: 150, height: 100, objectFit: 'cover', borderRadius: 6 }} />
          </div>
        );
      })}
    </>
  );

  // the clock: Nepal is UTC + 5:45, the minutes sweep
  const tick = EASE_INOUT(within(at.clock, 0.1, 0.6));
  const utcM = tick * 30; const npTot = 45 + tick * 30;            // minutes past 17:00, rolling into 18:xx

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      {/* hook + rect: the wall, Nepal slams in, then the outlines */}
      <Scene f={f} a={0} b={cue(at.tall)} kind="zoom">
        {wall(f >= cue(at.rect) ? EASE_OUT(within(at.rect, 0, 0.3)) : slam * 0.4, f >= cue(at.rect) ? EASE_OUT(within(at.rect, 0.2, 0.5)) : 0)}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <g transform={`translate(540 940) scale(${lerp(3, 1, slam)}) rotate(${lerp(-25, 0, slam)}) translate(-540 -940)`} opacity={slam}>
            <NepalFlag x={540} y={940} h={430} />
          </g>
          {f >= cue(at.rect) && (
            <polygon points={`${540 - 176},${725} ${540 + 176},${725 + 224} ${540 - 25},${725 + 224} ${540 + 176},${1155} ${540 - 176},${1155}`}
              fill="none" stroke={ALERT} strokeWidth={8} strokeDasharray="18 10" opacity={EASE_OUT(within(at.rect, 0.3, 0.6))} />
          )}
        </svg>
        {f >= cue(at.rect) && (
          <div style={{ position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center', opacity: EASE_OUT(within(at.rect, 0.2, 0.45)) }}>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 78, color: '#fff', textShadow: '0 6px 30px #000' }}>EVERY FLAG: ▭</div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 78, color: ALERT }}>EXCEPT ONE</div>
          </div>
        )}
      </Scene>
      <Flash f={f} at={8} len={8} />

      {/* taller than wide */}
      <Scene f={f} a={cue(at.tall)} b={cue(at.strange)} kind="push">
        <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, #1b2440 0%, #05070d 75%)' }} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <NepalFlag x={480} y={960} h={620} />
          <g stroke={ROUTE} strokeWidth={6} opacity={EASE_OUT(within(at.tall, 0.15, 0.4))}>
            <line x1={800} y1={650} x2={800} y2={1270} /><line x1={780} y1={650} x2={820} y2={650} /><line x1={780} y1={1270} x2={820} y2={1270} />
            <line x1={226} y1={1330} x2={734} y2={1330} /><line x1={226} y1={1310} x2={226} y2={1350} /><line x1={734} y1={1310} x2={734} y2={1350} />
          </g>
          <text x={840} y={975} fontFamily={SANS} fontWeight={800} fontSize={40} fill={ROUTE} opacity={EASE_OUT(within(at.tall, 0.15, 0.4))}>TALLER</text>
          <text x={480} y={1400} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={36} fill="#cfe0ff" opacity={EASE_OUT(within(at.tall, 0.3, 0.55))}>THAN WIDE</text>
        </svg>
      </Scene>

      {/* "not the strangest thing": whip to the globe over Nepal; never colonised */}
      <Scene f={f} a={cue(at.strange)} b={cue(at.peaks)} kind="whip">
        <SpaceBg />
        <GlobeView id="np" cx={540} cy={1000} R={lerp(420, 900, EASE_INOUT(within(at.strange, 0, 1)))} lon0={84} lat0={28} />
        <div style={{ position: 'absolute', top: 220, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 74, color: '#fff', textShadow: '0 6px 30px #000' }}>AND THAT'S NOT</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 74, color: ROUTE }}>THE STRANGEST PART</div>
        </div>
      </Scene>

      {/* eight of the ten highest peaks */}
      <Scene f={f} a={cue(at.peaks)} b={cue(at.never)} kind="push">
        <AbsoluteFill style={{ background: 'linear-gradient(#0b1730 0%, #2b4f7a 60%, #8aa6c8 100%)' }} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {PEAKS.map((m, i) => {
            const x = 70 + i * 104; const ht = (m - 7000) * 0.42; const base = 1300;
            const lit = IN_NEPAL[i] && within(at.peaks, 0.1 + i * 0.05, 0.2 + i * 0.05) > 0;
            return (
              <g key={i}>
                <path d={`M ${x - 62} ${base} L ${x} ${base - ht} L ${x + 62} ${base} Z`} fill={lit ? '#e9eef5' : '#4a5568'} stroke="#1b2538" strokeWidth={3} />
                <path d={`M ${x - 18} ${base - ht + 50} L ${x} ${base - ht} L ${x + 18} ${base - ht + 50} Z`} fill="#fff" opacity={lit ? 1 : 0.4} />
                {lit && <g transform={`translate(${x} ${base - ht - 46})`}><NepalFlag x={0} y={0} h={56} /></g>}
              </g>
            );
          })}
          <rect x={0} y={1300} width={W} height={H - 1300} fill="#2a3346" />
        </svg>
        <div style={{ position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 150, color: '#fff', textShadow: '0 6px 30px #000' }}>
            {Math.min(8, IN_NEPAL.filter((v, i) => v && within(at.peaks, 0.1 + i * 0.05, 0.2 + i * 0.05) > 0).length)} / 10</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: ROUTE }}>OF THE WORLD'S HIGHEST MOUNTAINS</div>
        </div>
      </Scene>

      {/* never colonised */}
      <Scene f={f} a={cue(at.never)} b={cue(at.clock)} kind="zoom">
        <SpaceBg />
        <GlobeView id="np2" cx={540} cy={1000} R={900} lon0={84} lat0={28} />
        <div style={{ position: 'absolute', top: 1180, left: 0, right: 0, textAlign: 'center', transform: `rotate(-8deg) scale(${lerp(1.6, 1, EASE_OUT(within(at.never, 0, 0.35)))})`,
          opacity: EASE_OUT(within(at.never, 0, 0.3)) }}>
          <span style={{ display: 'inline-block', border: `10px solid ${ALERT}`, color: ALERT, fontFamily: SANS, fontWeight: 800, fontSize: 96,
            padding: '6px 30px', borderRadius: 14, background: 'rgba(0,0,0,0.35)' }}>NEVER COLONISED</span>
        </div>
      </Scene>
      <Flash f={f} at={cue(at.never)} len={6} color="#ffd0d0" />

      {/* UTC + 5:45 */}
      <Scene f={f} a={cue(at.clock)} b={cue(last)} kind="whip">
        <AbsoluteFill style={{ background: '#05070d' }} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <Clock x={290} y={880} r={170} h={12} m={utcM} label="UTC" color="#cfe0ff" />
          <Clock x={790} y={880} r={170} h={17 + Math.floor(npTot / 60)} m={npTot % 60} label="NEPAL" color={ROUTE} />
          {within(at.clock, 0.55, 0.7) > 0 && [200, 540, 880].map((x, i) => (
            <g key={x} opacity={within(at.clock, 0.55 + i * 0.05, 0.65 + i * 0.05)}>
              <circle cx={x} cy={1330} r={58} fill="rgba(6,10,18,0.9)" stroke={i === 0 ? ROUTE : '#5f6b85'} strokeWidth={6} />
              <text x={x} y={1345} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={34} fill="#fff">:45</text>
            </g>
          ))}
        </svg>
        <div style={{ position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 140, color: '#fff', textShadow: '0 6px 30px #000' }}>+5:45</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: ROUTE, opacity: within(at.clock, 0.55, 0.7) }}>ONLY 3 TIME ZONES DO THAT</div>
        </div>
      </Scene>

      {/* loop back to the opening wall */}
      <Scene f={f} a={cue(last)} b={END + 30} kind="zoom">
        {wall(0, 0)}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}><NepalFlag x={540} y={940} h={430} o={prog(f, END - 20, END - 2)} /></svg>
      </Scene>

      {(() => {
        const o = Math.max(1 - prog(f, cue(at.rect) - 6, cue(at.rect) + 6), prog(f, END - 22, END - 4));
        return (
          <>
            <div style={{ position: 'absolute', top: 170, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
              fontSize: 100, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.95)', opacity: o }}>
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

export default NepalFacts;
