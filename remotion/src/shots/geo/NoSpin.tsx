import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { Card, Sun } from './BlackHole';
import { EndCard } from './EndCard';
import { GlobeView, SpaceBg } from './Globe';
import { ALERT, H, MONO, ROUTE, SANS, W, lerp, ridge, rng } from './parts';

// =============================================================================
// "What if Earth stopped spinning?" The globe slams to a halt and a figure flies
// off east; the equator's 1,670 km/h counted up; speed by latitude (1,674.7 x
// cos lat, drawn on the globe's parallels); winds 4x the 408 km/h record over a
// bending city; a wave wall over the land; a sky where the Sun takes six months
// to cross and then six months of night; the 43 km equatorial bulge relaxing;
// and the 2.3 ms per century the day really changes by. Script and sources:
// make_whatif.py "nospin".
// =============================================================================
export const compositionConfig = {
  id: 'NoSpin',
  durationInSeconds: 42,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string; badge: string };
  at: { speed: number; now: number; wind: number; ocean: number; year: number; six: number; bulge: number; slow: number };
  durationInSeconds: number;
};

const EQ = 1674.7;
const LATS = [{ lat: 0, name: 'EQUATOR' }, { lat: 30, name: '30°' }, { lat: 45, name: '45°' }, { lat: 60, name: '60°' }, { lat: 90, name: 'POLE' }];
const kmh = (lat: number) => Math.round((EQ * Math.cos((lat * Math.PI) / 180)) / 10) * 10;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const SKY = (() => { const r = rng(331); return Array.from({ length: 300 }, () => ({ x: r() * W, y: r() * 1250, s: 0.5 + r() * 1.6, a: 0.3 + r() * 0.7 })); })();

const City: React.FC<{ base: number; bend: number; f: number }> = ({ base, bend, f }) => {
  const r = rng(12);
  const blocks = Array.from({ length: 14 }, (_, i) => ({ x: i * 80 - 20, w: 60 + r() * 30, h: 120 + r() * 320 }));
  return (
    <g>
      {blocks.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={base - b.h} width={b.w} height={b.h} fill="#141c2c" stroke="#2a3a58" strokeWidth={2} />
          {Array.from({ length: Math.floor(b.h / 40) }, (_, j) => (
            <rect key={j} x={b.x + 10} y={base - b.h + 14 + j * 40} width={b.w - 20} height={10} fill="#ffd27a" opacity={0.25} />
          ))}
        </g>
      ))}
      {/* trees bending in the wind */}
      {Array.from({ length: 8 }, (_, i) => {
        const x = 40 + i * 140; const lean = bend * (40 + 8 * Math.sin(f / 2 + i));
        return (
          <g key={i}>
            <path d={`M ${x} ${base + 40} Q ${x + lean * 0.3} ${base - 30} ${x + lean} ${base - 90}`} stroke="#3b2a1c" strokeWidth={10} fill="none" />
            <ellipse cx={x + lean} cy={base - 110} rx={46 + bend * 20} ry={34 - bend * 10} fill="#2f6b3a" />
          </g>
        );
      })}
      <rect x={0} y={base} width={W} height={H - base} fill="#0c111a" />
    </g>
  );
};

const NoSpin: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '', badge: '' }, at, durationInSeconds = 42 }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const span = (a: number, b: number) => prog(f, cue(a) - 6, cue(a) + 8) * (1 - prog(f, cue(b) - 8, cue(b) + 6));
  const last = vo.length - 1;

  // ---- hook: fast spin, a dead stop just after "stopped spinning", a figure flung east
  const sHook = 1 - prog(f, cue(at.speed) - 6, cue(at.speed) + 8);
  const stopF = Math.round(lerp(cue(0), lineEnd(0), 0.45));
  const lonAt = (fr: number) => 40 - Math.min(fr, stopF) * 3.2;
  const fling = EASE_INOUT(prog(f, stopF, lerp(cue(0), lineEnd(0), 0.95)));
  const shake = f >= stopF && f < stopF + 10 ? Math.sin(f * 3) * (stopF + 10 - f) * 1.5 : 0;
  const hookScene = (key: string, lon: number, fl: number, sh: number) => (
    <>
      <SpaceBg />
      <AbsoluteFill style={{ transform: `translate(${sh}px, 0)` }}>
        <GlobeView id={key} cx={480} cy={1080} R={400} lon0={lon} lat0={8} />
      </AbsoluteFill>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {fl > 0 && fl < 1 && Array.from({ length: 5 }, (_, i) => (
          <line key={i} x1={lerp(880, 1240, fl) - 160 - i * 30} y1={1040 + i * 14 - 28} x2={lerp(880, 1240, fl) - 40 - i * 30}
            y2={1040 + i * 14 - 28} stroke="#fff" strokeWidth={4} opacity={0.7} />
        ))}
        <g transform={`translate(${lerp(880, 1240, fl)} ${1030 - 60 * Math.sin(fl * Math.PI)}) rotate(${fl * 200})`}
          stroke="#fff" strokeWidth={8} strokeLinecap="round" fill="none">
          <circle cx={0} cy={-34} r={12} fill="#fff" />
          <line x1={0} y1={-22} x2={0} y2={14} /><line x1={0} y1={-14} x2={-22} y2={-30} /><line x1={0} y1={-14} x2={22} y2={-2} />
          <line x1={0} y1={14} x2={-16} y2={38} /><line x1={0} y1={14} x2={18} y2={34} />
        </g>
      </svg>
    </>
  );

  // ---- 1,670 km/h at the equator, and by latitude
  const sSpeed = span(at.speed, at.wind);
  const count = EASE_OUT(within(at.speed, 0.1, 0.7));
  const latsIn = EASE_OUT(within(at.now, 0.05, 0.5));
  const gLat0 = 18; const gx = 420; const gy = 1000; const gR = 360;

  // ---- wind, then the ocean
  const sWind = span(at.wind, at.ocean);
  const gust = EASE_OUT(within(at.wind, 0.1, 0.4));
  const bars = EASE_OUT(within(at.wind, 0.35, 0.7));
  const sSea = span(at.ocean, at.year);
  const wave = EASE_INOUT(within(at.ocean, 0, 1));

  // ---- a day that lasts a year
  const sSky = span(at.year, at.bulge);
  const skyT = f < cue(at.six) ? lerp(0, 0.25, EASE_INOUT(within(at.year, 0.1, 1))) : lerp(0.25, 1, within(at.six, 0, 1));
  const sunA = Math.PI * Math.min(1, skyT * 2);              // across the sky in the first half
  const night = prog(skyT, 0.44, 0.56);
  const month = MONTHS[Math.min(11, Math.floor(skyT * 12))];

  // ---- the bulge, and the real slowing
  const sBulge = span(at.bulge, at.slow);
  const relax = EASE_INOUT(within(at.bulge, 0.45, 0.9));
  const sSlow = span(at.slow, last);
  const ms = EASE_OUT(within(at.slow, 0.3, 0.7)) * 2.3;
  const loopT = EASE_INOUT(prog(f, cue(last), END - 4));

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      {sHook > 0.001 && <AbsoluteFill style={{ opacity: sHook }}>{hookScene('hook', lonAt(f), fling, shake)}</AbsoluteFill>}
      {sHook > 0.001 && f >= stopF && f < stopF + 14 && (
        <AbsoluteFill style={{ background: '#fff', opacity: 0.5 * (1 - (f - stopF) / 14) }} />
      )}

      {/* ---------------- 1,670 km/h, and by latitude ---------------- */}
      {sSpeed > 0.001 && (
        <AbsoluteFill style={{ opacity: sSpeed }}>
          <SpaceBg />
          <GlobeView id="speed" cx={gx} cy={gy} R={gR} lon0={lonAt(stopF)} lat0={gLat0} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {LATS.map(({ lat, name }, i) => {
              const c0 = Math.cos((gLat0 * Math.PI) / 180); const s0 = Math.sin((gLat0 * Math.PI) / 180);
              const cl = Math.cos((lat * Math.PI) / 180); const sl = Math.sin((lat * Math.PI) / 180);
              const y = gy - gR * c0 * sl; const rx = gR * cl; const ry = gR * s0 * cl;
              const show = i === 0 ? 1 : latsIn;
              const ly = [1040, 900, 800, 700, 600][i];                // labels spaced out, leader lines to the parallels
              return (
                <g key={lat} opacity={show}>
                  {lat < 90 && <path d={`M ${gx - rx} ${y} A ${rx} ${ry} 0 0 0 ${gx + rx} ${y}`} fill="none"
                    stroke={i === 0 ? ROUTE : '#cfe6ff'} strokeWidth={i === 0 ? 6 : 3} opacity={0.9} />}
                  <line x1={gx + rx} y1={lat === 90 ? y - 6 : y} x2={800} y2={ly} stroke="#cfe6ff" strokeWidth={2} opacity={0.5} />
                  <text x={810} y={ly - 6} fontFamily={SANS} fontWeight={700} fontSize={26} fill="#9fc8ea">{name}</text>
                  <text x={810} y={ly + 30} fontFamily={MONO} fontWeight={700} fontSize={34} fill={i === 0 ? ROUTE : '#fff'}>
                    {i === 0 ? Math.round(1670 * count).toLocaleString('en-US') : kmh(lat).toLocaleString('en-US')}</text>
                </g>
              );
            })}
            <path d={`M ${gx - 90} ${gy + 30} L ${gx + 160} ${gy + 30}`} stroke={ROUTE} strokeWidth={10} strokeLinecap="round" />
            <path d={`M ${gx + 130} ${gy + 6} L ${gx + 166} ${gy + 30} L ${gx + 130} ${gy + 54}`} stroke={ROUTE} strokeWidth={10}
              strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <text x={gx + 35} y={gy + 90} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={34} fill={ROUTE}>EAST</text>
          </svg>
          <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#9fc8ea' }}>
              {f < cue(at.now) ? 'THE EQUATOR IS MOVING AT' : 'THE GROUND UNDER YOU, RIGHT NOW (KM/H)'}</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 120, color: '#fff', textShadow: '0 6px 30px #000' }}>
              {Math.round(1670 * count).toLocaleString('en-US')} km/h</div>
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- winds 4x the record ---------------- */}
      {sWind > 0.001 && (
        <AbsoluteFill style={{ opacity: sWind, background: 'linear-gradient(#1a2338 0%, #2b3a5a 60%, #3a4a68 100%)' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {Array.from({ length: 70 }, (_, i) => {
              const r = rng(i + 3); const y = 500 + r() * 1000; const len = 120 + r() * 260;
              const x = ((r() * W * 2 + f * 70 * (0.6 + r())) % (W + len + 200)) - len - 100;
              return <line key={i} x1={x} y1={y} x2={x + len} y2={y} stroke="#e6f0ff" strokeWidth={2 + r() * 3} opacity={gust * (0.25 + r() * 0.5)} />;
            })}
            <City base={1480} bend={gust} f={f} />
            <g opacity={bars}>
              <text x={90} y={330} fontFamily={SANS} fontWeight={700} fontSize={30} fill="#cfe6ff">STRONGEST GUST EVER RECORDED</text>
              <rect x={90} y={350} width={900 * 408 / 1674.7} height={44} rx={10} fill="#9fb3c8" />
              <text x={110 + 900 * 408 / 1674.7} y={386} fontFamily={MONO} fontWeight={700} fontSize={34} fill="#fff">408 km/h</text>
              <text x={90} y={460} fontFamily={SANS} fontWeight={700} fontSize={30} fill={ALERT}>IF EARTH STOPPED</text>
              <rect x={90} y={480} width={900 * bars} height={44} rx={10} fill={ALERT} />
              <text x={540} y={600} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={56} fill="#fff">1,670 km/h · 4×</text>
            </g>
          </svg>
        </AbsoluteFill>
      )}

      {/* ---------------- the oceans sweep over the land ---------------- */}
      {sSea > 0.001 && (
        <AbsoluteFill style={{ opacity: sSea, background: 'linear-gradient(#0d1424 0%, #1c2a44 100%)' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <City base={1480} bend={0.6} f={f} />
            {(() => {
              const fx = lerp(-300, 820, wave);
              const crest = Array.from({ length: 24 }, (_, i) => {
                const y = 560 + i * 42; const bulge = Math.sin((i / 23) * Math.PI) * 160 + Math.sin(f / 3 + i) * 14;
                return `L ${fx + bulge} ${y}`;
              }).join(' ');
              return (
                <g>
                  <path d={`M -400 560 L ${fx} 560 ${crest} L ${fx} 1920 L -400 1920 Z`} fill="#1f6fae" opacity={0.95} />
                  <path d={`M ${fx} 560 ${crest}`} fill="none" stroke="#e6f6ff" strokeWidth={14} strokeLinecap="round" />
                  {Array.from({ length: 30 }, (_, i) => {
                    const r = rng(i + 90);
                    return <circle key={i} cx={fx + 120 + r() * 160} cy={560 + r() * 960} r={4 + r() * 10} fill="#e6f6ff" opacity={0.7} />;
                  })}
                </g>
              );
            })()}
          </svg>
          <Card top="THE OCEANS KEEP GOING TOO" color="#4fc3ff" y={220} o={EASE_OUT(within(at.ocean, 0.1, 0.35))} />
        </AbsoluteFill>
      )}

      {/* ---------------- one day = one year ---------------- */}
      {sSky > 0.001 && (
        <AbsoluteFill style={{ opacity: sSky, background: '#02040a' }}>
          <AbsoluteFill style={{ opacity: 1 - night, background: 'linear-gradient(#2b6cb0 0%, #69a7e0 60%, #f2c38b 100%)' }} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {SKY.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#fff" opacity={s.a * night} />)}
            <path d={`M 120 1380 A 420 600 0 0 1 960 1380`} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray="8 14" opacity={0.5 * (1 - night)} />
            {skyT < 0.5 && <Sun x={540 - 420 * Math.cos(sunA)} y={1380 - 600 * Math.sin(sunA)} r={70} />}
            {(() => {
              const R1 = ridge(808);
              return <path d={`M ${R1.map(([x, h]) => `${-50 + x * 1180},${1380 - h * 200}`).join(' L ')} L 1130 1920 L -50 1920 Z`}
                fill="#0b1220" />;
            })()}
          </svg>
          <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: 5, color: night > 0.5 ? '#9fc8ea' : '#fff4d6' }}>
              {f < cue(at.six) ? 'ONE DAY = ONE YEAR' : night > 0.5 ? 'SIX MONTHS OF NIGHT' : 'SIX MONTHS OF DAYLIGHT'}</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 140, color: '#fff', textShadow: '0 6px 30px #000' }}>{month}</div>
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- the bulge relaxes ---------------- */}
      {sBulge > 0.001 && (
        <AbsoluteFill style={{ opacity: sBulge }}>
          <SpaceBg />
          <AbsoluteFill style={{ transform: `scale(${lerp(1.12, 1, relax)}, ${lerp(0.9, 1, relax)})`, transformOrigin: '540px 980px' }}>
            <GlobeView id="bulge" cx={540} cy={980} R={380} lon0={lonAt(stopF)} lat0={0} />
          </AbsoluteFill>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <circle cx={540} cy={980} r={380} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray="10 12" opacity={0.6} />
            <g opacity={1 - relax}>
              <line x1={540 - 380 * 1.12} y1={980} x2={540 + 380 * 1.12} y2={980} stroke={ROUTE} strokeWidth={5} />
              <text x={540} y={960} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={46} fill={ROUTE}>+43 km</text>
            </g>
            <text x={540} y={1440} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={26} fill="#8b93a6">SHAPE EXAGGERATED</text>
          </svg>
          <Card top={relax > 0.5 ? 'NO SPIN: A ROUNDER EARTH' : 'SPIN MAKES IT FAT AT THE MIDDLE'} color={ROUTE} y={220}
            o={EASE_OUT(within(at.bulge, 0.1, 0.3))} />
        </AbsoluteFill>
      )}

      {/* ---------------- the real change: 2.3 ms a century ---------------- */}
      {sSlow > 0.001 && (
        <AbsoluteFill style={{ opacity: sSlow }}>
          <SpaceBg />
          <GlobeView id="slow" cx={540} cy={1060} R={300} lon0={20 - f * 0.6} lat0={12} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <circle cx={540} cy={1060} r={360} fill="none" stroke="#5f6b85" strokeWidth={4} />
            {Array.from({ length: 60 }, (_, i) => {
              const a = (i / 60) * Math.PI * 2;
              return <line key={i} x1={540 + Math.sin(a) * 360} y1={1060 - Math.cos(a) * 360} x2={540 + Math.sin(a) * (i % 5 ? 345 : 330)}
                y2={1060 - Math.cos(a) * (i % 5 ? 345 : 330)} stroke="#8b93a6" strokeWidth={i % 5 ? 2 : 4} />;
            })}
            <line x1={540} y1={1060} x2={540 + Math.sin(f / 20) * 340} y2={1060 - Math.cos(f / 20) * 340} stroke={ROUTE} strokeWidth={5} />
          </svg>
          <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#9fc8ea' }}>EACH DAY GETS LONGER BY</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 120, color: '#fff', textShadow: '0 6px 30px #000' }}>
              {ms.toFixed(1)} ms</div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, color: ROUTE }}>PER CENTURY</div>
          </div>
          <Card top="IT WON'T HAPPEN" color="#9fd0ff" y={1460 - 40} o={EASE_OUT(within(at.slow, 0.05, 0.25))} />
        </AbsoluteFill>
      )}

      {loopT > 0.001 && <AbsoluteFill style={{ opacity: loopT }}>{hookScene('loop', 40 - (END - f) * 3.2, 0, 0)}</AbsoluteFill>}

      {(() => {
        const o = Math.max(sHook, prog(f, END - 22, END - 4));
        return (
          <>
            <div style={{ position: 'absolute', top: 160, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
              fontSize: 96, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.9)', opacity: o }}>
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

export default NoSpin;
