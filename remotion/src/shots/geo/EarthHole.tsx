import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { Card, Sun } from './BlackHole';
import { EndCard } from './EndCard';
import { GlobeView, SpaceBg } from './Globe';
import { ALERT, Defs, DrillBit, H, MONO, Pin, ROUTE, Rig, SANS, W, lerp } from './parts';

// =============================================================================
// "What if you jumped into a hole through the Earth?" A jumper drops into a hole
// in the globe; the deepest real hole (Kola, 12,262 m) drilled on a side view;
// how little that is of the way to the centre; the shaft dug on a true-scale
// cross-section (crust, mantle, outer and inner core - the core as hot as the
// Sun's surface); the 38-minute fall with its speed peaking at the centre, the
// stop at the far side and the swing back; and the globe turned to the far side
// of the USA, which is ocean - as it is for ~85% of land. Script and sources:
// make_whatif.py "earthhole".
// =============================================================================
export const compositionConfig = {
  id: 'EarthHole',
  durationInSeconds: 40,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string; badge: string };
  at: { kola: number; tiny: number; dig: number; core: number; center: number; stop: number; back: number; ocean: number };
  durationInSeconds: number;
};

const RAD = Math.PI / 180;
const proj = (lon: number, lat: number, lon0: number, lat0: number, cx: number, cy: number, R: number) => {
  const p = lat * RAD; const dl = (lon - lon0) * RAD; const s0 = Math.sin(lat0 * RAD); const c0 = Math.cos(lat0 * RAD);
  const cosc = s0 * Math.sin(p) + c0 * Math.cos(p) * Math.cos(dl);
  return { x: cx + R * Math.cos(p) * Math.sin(dl), y: cy - R * (c0 * Math.sin(p) - s0 * Math.cos(p) * Math.cos(dl)), vis: cosc > 0 };
};
// the start (middle of the USA) and the point straight through the planet from it
const START = { lon: -98, lat: 39 };
const FAR = { lon: 82, lat: -39 };

// Earth cut in half, layers at true scale (outer core 3,480 km, inner core 1,220 km
// of 6,371); the crust drawn thicker than it is so it can be seen at all
const Cut: React.FC<{ cx: number; cy: number; R: number; dig: number; heat: number; f: number }> = ({ cx, cy, R, dig, heat, f }) => (
  <g>
    <defs>
      <radialGradient id="mantle" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0.5" stopColor="#ff8a3d" /><stop offset="1" stopColor="#9c2f1c" />
      </radialGradient>
      <radialGradient id="ocore" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0.3" stopColor="#ffd36b" /><stop offset="1" stopColor="#ff9a2e" />
      </radialGradient>
      <radialGradient id="icore" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ffffff" /><stop offset="0.6" stopColor="#fff2a8" /><stop offset="1" stopColor="#ffd36b" />
      </radialGradient>
      <radialGradient id="coreGlow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff5c2" stopOpacity={0.9} /><stop offset="1" stopColor="#ffb347" stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={cx} cy={cy} r={R + 14} fill="#3d7fe0" opacity={0.25} />
    <circle cx={cx} cy={cy} r={R} fill="#4a6b3a" />
    <circle cx={cx} cy={cy} r={R * 0.975} fill="url(#mantle)" />
    <circle cx={cx} cy={cy} r={R * 0.546} fill="url(#ocore)" />
    <circle cx={cx} cy={cy} r={R * 0.19 * (1 + 0.6 * heat) * 1.8} fill="url(#coreGlow)" opacity={heat * (0.7 + 0.3 * Math.sin(f / 4))} />
    <circle cx={cx} cy={cy} r={R * 0.19} fill="url(#icore)" />
    {/* the shaft */}
    {dig > 0 && <rect x={cx - 13} y={cy - R - 4} width={26} height={(2 * R + 8) * dig} rx={8} fill="#07090d" stroke="#000" strokeWidth={2} />}
  </g>
);

const Jumper: React.FC<{ x: number; y: number; s: number; rot?: number }> = ({ x, y, s, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} stroke="#fff" strokeWidth={7} strokeLinecap="round" fill="none">
    <circle cx={0} cy={-34} r={11} fill="#fff" />
    <line x1={0} y1={-22} x2={0} y2={14} />
    <line x1={0} y1={-16} x2={-20} y2={-40} /><line x1={0} y1={-16} x2={20} y2={-40} />
    <line x1={0} y1={14} x2={-14} y2={40} /><line x1={0} y1={14} x2={14} y2={40} />
  </g>
);

const EarthHole: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '', badge: '' }, at, durationInSeconds = 40 }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const span = (a: number, b: number) => prog(f, cue(a) - 6, cue(a) + 8) * (1 - prog(f, cue(b) - 8, cue(b) + 6));
  const last = vo.length - 1;

  // ---- hook: a jumper drops into a hole in the middle of the USA
  const sHook = 1 - prog(f, cue(at.kola) - 6, cue(at.kola) + 8);
  const hookScene = (key: string, jump: number) => {
    const hole = proj(START.lon, START.lat, START.lon, 30, 540, 1080, 420);
    return (
      <>
        <SpaceBg />
        <GlobeView id={key} cx={540} cy={1080} R={420} lon0={START.lon} lat0={30} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <ellipse cx={hole.x} cy={hole.y} rx={46} ry={30} fill="#020305" stroke="#ffb347" strokeWidth={4} />
          <ellipse cx={hole.x} cy={hole.y} rx={60} ry={40} fill="none" stroke="#ffb347" strokeWidth={2} opacity={0.4 + 0.3 * Math.sin(f / 4)} />
          {jump < 1 && <Jumper x={hole.x} y={lerp(hole.y - 260, hole.y, jump)} s={lerp(1.6, 0.3, jump)} rot={jump * 30} />}
        </svg>
      </>
    );
  };
  const jump0 = EASE_INOUT(within(0, 0.45, 0.9));

  // ---- Kola: the deepest hole ever, drilled on a side view (1 px = 20 m)
  const sKola = span(at.kola, at.tiny);
  const drill = EASE_INOUT(within(at.kola, 0.1, 0.8));
  const depthM = Math.round(12262 * drill);
  const gy = 560;

  // ---- the cross-section, from 0.2% to digging to the core
  const sCut = span(at.tiny, at.center);
  const dig = f < cue(at.dig) ? 0.004 : lerp(0.004, 0.5, EASE_INOUT(within(at.dig, 0.05, 1)));
  const heat = EASE_OUT(within(at.core, 0.1, 0.5));
  const cx = 540; const cy = 1000; const R = 420;

  // ---- the fall: simple harmonic, 38 minutes per crossing
  const sFall = span(at.center, at.ocean);
  const ft = f < cue(at.stop) ? lerp(0, 0.5, EASE_INOUT(within(at.center, 0.05, 1)))
    : f < cue(at.back) ? lerp(0.5, 1, EASE_OUT(within(at.stop, 0, 0.85)))
      : lerp(1, 3, within(at.back, 0, 1));
  const jy = cy - R * Math.cos(Math.PI * ft);
  const speed = Math.abs(Math.sin(Math.PI * ft));
  const mins = Math.round(38 * ft);
  const trips = Math.floor(ft + 0.02);

  // ---- the far side: ocean
  const sOcean = span(at.ocean, last);
  const turn = EASE_INOUT(within(at.ocean, 0, 0.45));
  const lon0 = lerp(START.lon, FAR.lon, turn); const lat0 = lerp(30, -30, turn);
  const pStart = proj(START.lon, START.lat, lon0, lat0, 540, 1000, 400);
  const pFar = proj(FAR.lon, FAR.lat, lon0, lat0, 540, 1000, 400);
  const splash = within(at.ocean, 0.45, 0.8);
  const pie = EASE_OUT(within(at.ocean, 0.5, 0.85));
  const loopT = EASE_INOUT(prog(f, cue(last), END - 4));

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      {sHook > 0.001 && <AbsoluteFill style={{ opacity: sHook }}>{hookScene('hook', jump0)}</AbsoluteFill>}

      {/* ---------------- Kola: 12,262 m ---------------- */}
      {sKola > 0.001 && (
        <AbsoluteFill style={{ opacity: sKola, background: 'linear-gradient(#0b1730 0%, #1b3560 28%, #000 29%)' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <Defs />
            {/* rock layers */}
            {[['#4f3a28', 0], ['#5e4430', 120], ['#6b4c35', 260], ['#5a3d2a', 420], ['#4a3222', 600], ['#3d291c', 780]].map(([c, y]) => (
              <rect key={String(y)} x={0} y={gy + Number(y)} width={W} height={H} fill={String(c)} />
            ))}
            <rect x={0} y={gy - 8} width={W} height={10} fill="#6f8f4a" />
            <line x1={540} y1={gy} x2={540} y2={gy + 613 * drill} stroke="#0b0d10" strokeWidth={14} />
            <DrillBit x={540} y={gy + 613 * drill + 10} s={0.7} />
            <Rig x={540} gy={gy} s={0.8} />
            {/* depth ruler: 1 km = 50 px */}
            {Array.from({ length: 13 }, (_, i) => (
              <g key={i}>
                <line x1={150} x2={i % 2 ? 175 : 190} y1={gy + i * 50} y2={gy + i * 50} stroke="#e8d9c0" strokeWidth={3} />
                {i % 2 === 0 && <text x={200} y={gy + i * 50 + 11} fontFamily={MONO} fontSize={28} fill="#e8d9c0">{i} km</text>}
              </g>
            ))}
            <line x1={150} x2={150} y1={gy} y2={gy + 600} stroke="#e8d9c0" strokeWidth={3} />
          </svg>
          <div style={{ position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#9fc8ea' }}>DEEPEST HOLE EVER DUG</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 110, color: '#fff', textShadow: '0 6px 30px #000' }}>
              {depthM.toLocaleString('en-US')} m</div>
          </div>
          <Card top="KOLA SUPERDEEP BOREHOLE" sub="Russia" color={ROUTE} y={1300} o={EASE_OUT(within(at.kola, 0.5, 0.75))} />
        </AbsoluteFill>
      )}

      {/* ---------------- the cross-section: 0.2%, crust, mantle, core ---------------- */}
      {sCut > 0.001 && (
        <AbsoluteFill style={{ opacity: sCut }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <Cut cx={cx} cy={cy} R={R} dig={dig} heat={heat} f={f} />
            {f < cue(at.dig) && (
              <g opacity={EASE_OUT(within(at.tiny, 0.1, 0.4))}>
                <line x1={cx + 40} y1={cy - R} x2={cx + 40} y2={cy} stroke="#fff" strokeWidth={3} strokeDasharray="10 10" />
                <circle cx={cx} cy={cy - R} r={10} fill={ALERT} />
                <line x1={cx} y1={cy - R} x2={cx - 200} y2={cy - R - 90} stroke={ALERT} strokeWidth={3} />
                <text x={cx - 210} y={cy - R - 100} textAnchor="end" fontFamily={SANS} fontWeight={700} fontSize={32} fill={ALERT}>KOLA</text>
                <text x={cx + 60} y={cy - R / 2} fontFamily={SANS} fontWeight={700} fontSize={30} fill="#fff">TO THE</text>
                <text x={cx + 60} y={cy - R / 2 + 36} fontFamily={SANS} fontWeight={700} fontSize={30} fill="#fff">CENTRE</text>
              </g>
            )}
            {f >= cue(at.dig) && (
              <g fontFamily={SANS} fontWeight={700} fontSize={32}>
                <text x={cx + 40} y={cy - R + 40} fill="#cfe6a0" opacity={prog(dig, 0.004, 0.03)}>CRUST</text>
                <text x={cx + 40} y={cy - R * 0.75} fill="#ffd0b0" opacity={prog(dig, 0.05, 0.15)}>MANTLE</text>
                <text x={cx + 40} y={cy - R * 0.4} fill="#fff1c2" opacity={prog(dig, 0.25, 0.32)}>OUTER CORE</text>
                <text x={cx + 40} y={cy - R * 0.08} fill="#ffffff" opacity={prog(dig, 0.4, 0.46)}>INNER CORE</text>
              </g>
            )}
            {f >= cue(at.core) && (
              <g opacity={heat}><Sun x={900} y={500} r={56} /></g>
            )}
          </svg>
          {f < cue(at.dig) && (
            <div style={{ position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center' }}>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#9fc8ea' }}>OF THE WAY TO THE CENTRE</div>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 130, color: '#fff', textShadow: '0 6px 30px #000' }}>0.2%</div>
            </div>
          )}
          {f >= cue(at.core) && <Card top="≈ THE SUN'S SURFACE" sub="that's how hot the inner core is" color="#ffd36b" y={210} o={heat} />}
        </AbsoluteFill>
      )}

      {/* ---------------- the fall ---------------- */}
      {sFall > 0.001 && (
        <AbsoluteFill style={{ opacity: sFall }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <Cut cx={cx} cy={cy} R={R} dig={1} heat={0.6} f={f} />
            {/* speed lines while falling fast */}
            {speed > 0.3 && Array.from({ length: 6 }, (_, i) => (
              <line key={i} x1={cx - 30 + i * 12} y1={jy - 40 - ((f * 9 + i * 23) % 70)} x2={cx - 30 + i * 12} y2={jy - 10 - ((f * 9 + i * 23) % 70)}
                stroke="#fff" strokeWidth={3} opacity={speed * 0.7} />
            ))}
            <Jumper x={cx} y={jy} s={0.75} rot={ft % 2 < 1 ? 180 : 0} />
            {/* speed gauge */}
            <text x={90} y={1080} fontFamily={SANS} fontWeight={700} fontSize={28} fill="#9fc8ea">SPEED</text>
            <rect x={90} y={700} width={40} height={340} rx={10} fill="#1d2433" />
            <rect x={90} y={700 + 340 * (1 - speed)} width={40} height={340 * speed} rx={10} fill={speed > 0.95 ? ALERT : ROUTE} />
            {speed > 0.95 && <text x={150} y={720} fontFamily={MONO} fontWeight={700} fontSize={36} fill={ALERT}>MAX</text>}
          </svg>
          <div style={{ position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#9fc8ea' }}>
              {f >= cue(at.back) ? `FALLING... TRIP ${Math.min(3, trips + 1)}` : 'FALLING'}</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 120, color: '#fff', textShadow: '0 6px 30px #000' }}>
              {mins} MIN</div>
          </div>
          {f >= cue(at.stop) && f < cue(at.back) && <Card top="STOP. OTHER SIDE." color={ROUTE} y={1470 - 40} o={EASE_OUT(within(at.stop, 0.7, 0.9))} />}
          {f >= cue(at.back) && <Card top="LIKE A PENDULUM" color="#9fd0ff" y={1430} o={EASE_OUT(within(at.back, 0.2, 0.4))} />}
        </AbsoluteFill>
      )}

      {/* ---------------- the far side: ocean ---------------- */}
      {sOcean > 0.001 && (
        <AbsoluteFill style={{ opacity: sOcean }}>
          <SpaceBg />
          <GlobeView id="ocean" cx={540} cy={1000} R={400} lon0={lon0} lat0={lat0} />
          {pStart.vis && <Pin p={pStart} o={1 - turn} label="YOU JUMP HERE" color={ROUTE} />}
          {pFar.vis && <Pin p={pFar} o={turn} label="YOU LAND HERE" color={ALERT} />}
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {splash > 0 && splash < 1 && [0, 0.25, 0.5].map((d) => {
              const t = Math.max(0, Math.min(1, splash * 1.5 - d));
              return <circle key={d} cx={pFar.x} cy={pFar.y} r={20 + 90 * t} fill="none" stroke="#bfe6ff" strokeWidth={6 * (1 - t)} opacity={1 - t} />;
            })}
            <g opacity={pie}>
              <circle cx={540} cy={420} r={120} fill="#5e7a4a" />
              <path d={`M 540 420 L 540 300 A 120 120 0 ${0.85 * pie > 0.5 ? 1 : 0} 1 ${540 + 120 * Math.sin(2 * Math.PI * 0.85 * pie)}
                ${420 - 120 * Math.cos(2 * Math.PI * 0.85 * pie)} Z`} fill="#2f8fe0" />
              <text x={540} y={438} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={56} fill="#fff">{Math.round(85 * pie)}%</text>
            </g>
          </svg>
          <div style={{ position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center', opacity: pie, fontFamily: SANS,
            fontWeight: 700, fontSize: 34, letterSpacing: 3, color: '#9fc8ea' }}>OF LAND HAS OCEAN ON THE OTHER SIDE</div>
          <Card top="SPLASH: INDIAN OCEAN" color="#2f8fe0" y={1440} o={EASE_OUT(within(at.ocean, 0.42, 0.6))} />
        </AbsoluteFill>
      )}

      {loopT > 0.001 && <AbsoluteFill style={{ opacity: loopT }}>{hookScene('loop', 0)}</AbsoluteFill>}

      {(() => {
        const o = Math.max(sHook, prog(f, END - 22, END - 4));
        return (
          <>
            <div style={{ position: 'absolute', top: 160, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
              fontSize: 86, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.9)', opacity: o }}>
              {hook.top}<br /><span style={{ color: ROUTE }}>{hook.bottom}</span>
            </div>
            <div style={{ position: 'absolute', top: 1400, left: 0, right: 0, textAlign: 'center', opacity: o,
              transform: `rotate(-3deg) scale(${1 + 0.04 * Math.sin(f / 5)})` }}>
              <span style={{ display: 'inline-block', background: '#ff2d2d', color: '#fff', fontFamily: SANS, fontWeight: 800,
                fontSize: 62, padding: '10px 30px', borderRadius: 18, border: '5px solid #fff' }}>{hook.badge}</span>
            </div>
          </>
        );
      })()}

      <EndCard from={cue(last)} to={END - 14} text="" compact />
      <Captions lines={vo} y={1560} accent={ROUTE} maxWords={3} size={58} plate />
    </AbsoluteFill>
  );
};

export default EarthHole;
