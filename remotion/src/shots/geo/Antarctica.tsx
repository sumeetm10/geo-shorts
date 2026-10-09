import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { Card } from './BlackHole';
import { EndCard } from './EndCard';
import { GlobeView, SpaceBg } from './Globe';
import { ALERT, Flakes, H, MONO, Pin, ROUTE, SANS, W, lerp, rng } from './parts';

// =============================================================================
// "Antarctica facts that sound fake." The globe swings down to the South Pole;
// a desert stamp over the ice and an almost empty rain gauge; a water drop 70%
// full (the world's fresh water); a cut through the 1.9 km ice sheet; a coast
// city as the sea rises 60 m; a thermometer to -89.2 C; Antarctica vs Europe by
// area; the treaty's 29 countries and what it bans; and the first baby born on
// the mainland (Esperanza Base, 1978). Script and sources: make_whatif.py "antarctica".
// =============================================================================
export const compositionConfig = {
  id: 'Antarctica',
  durationInSeconds: 40,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string; badge: string };
  at: { desert: number; water: number; ice: number; sea: number; cold: number; size: number; treaty: number; baby: number };
  durationInSeconds: number;
};

const RAD = Math.PI / 180;
const proj = (lon: number, lat: number, lon0: number, lat0: number, cx: number, cy: number, R: number) => {
  const p = lat * RAD; const dl = (lon - lon0) * RAD; const s0 = Math.sin(lat0 * RAD); const c0 = Math.cos(lat0 * RAD);
  return { x: cx + R * Math.cos(p) * Math.sin(dl), y: cy - R * (c0 * Math.sin(p) - s0 * Math.cos(p) * Math.cos(dl)) };
};
const ICE = '#cfe9ff';

const Skyline: React.FC<{ base: number }> = ({ base }) => {
  const r = rng(77);
  return (
    <g>
      {Array.from({ length: 13 }, (_, i) => {
        const w = 60 + r() * 30; const h = 120 + r() * 760; const x = i * 84 - 10;
        return (
          <g key={i}>
            <rect x={x} y={base - h} width={w} height={h} fill="#1b2538" stroke="#2f4266" strokeWidth={2} />
            {Array.from({ length: Math.floor(h / 36) }, (_, j) => (
              <rect key={j} x={x + 10} y={base - h + 12 + j * 36} width={w - 20} height={8} fill="#ffd27a" opacity={0.3} />
            ))}
          </g>
        );
      })}
    </g>
  );
};

const Antarctica: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '', badge: '' }, at, durationInSeconds = 40 }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const span = (a: number, b: number) => prog(f, cue(a) - 6, cue(a) + 8) * (1 - prog(f, cue(b) - 8, cue(b) + 6));
  const last = vo.length - 1;
  const spin = 20 - f * 0.4;

  // ---- hook: swing from the equator down over the South Pole
  const sHook = 1 - prog(f, cue(at.desert) - 6, cue(at.desert) + 8);
  const swing = EASE_INOUT(within(0, 0.05, 0.85));
  const hookScene = (key: string, t: number) => (
    <>
      <SpaceBg />
      <GlobeView id={key} cx={540} cy={1030} R={lerp(400, 470, t)} lon0={spin} lat0={lerp(15, -72, t)} />
    </>
  );

  // ---- desert
  const sDesert = span(at.desert, at.water);
  const stamp = EASE_OUT(within(at.desert, 0.15, 0.4));

  // ---- 70% of fresh water
  const sWater = span(at.water, at.ice);
  const fill = EASE_INOUT(within(at.water, 0.1, 0.7));

  // ---- 1.9 km of ice (300 px per km)
  const sIce = span(at.ice, at.sea);
  const grow = EASE_OUT(within(at.ice, 0.05, 0.6));

  // ---- seas +60 m (8 px per metre)
  const sSea = span(at.sea, at.cold);
  const rise = EASE_INOUT(within(at.sea, 0.1, 0.9));

  // ---- -89.2 C
  const sCold = span(at.cold, at.size);
  const drop = EASE_INOUT(within(at.cold, 0.05, 0.6));
  const temp = lerp(20, -89.2, drop);

  // ---- 40% bigger than Europe; treaty; first baby
  const sSize = span(at.size, at.treaty);
  const bars = EASE_OUT(within(at.size, 0.05, 0.6));
  const sMap = span(at.treaty, last);
  const ring = EASE_OUT(within(at.treaty, 0.05, 0.5));
  const bans = EASE_OUT(within(at.treaty, 0.45, 0.7));
  const lat0 = -72; const lon0 = -40;
  const esp = proj(-56.99, -63.4, lon0, lat0, 540, 1030, 470);
  const loopT = EASE_INOUT(prog(f, cue(last), END - 4));

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      {sHook > 0.001 && <AbsoluteFill style={{ opacity: sHook }}>{hookScene('hook', swing)}</AbsoluteFill>}

      {/* ---------------- a desert ---------------- */}
      {sDesert > 0.001 && (
        <AbsoluteFill style={{ opacity: sDesert }}>
          <SpaceBg />
          <GlobeView id="desert" cx={540} cy={1030} R={470} lon0={spin} lat0={-72} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <Flakes shift={f * 2} o={0.35} n={14} />
            <g transform={`translate(540 1000) rotate(-12) scale(${lerp(1.6, 1, stamp)})`} opacity={stamp}>
              <rect x={-300} y={-90} width={600} height={180} rx={18} fill="none" stroke={ALERT} strokeWidth={14} />
              <text x={0} y={42} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={130} fill={ALERT}>DESERT</text>
            </g>
            <g opacity={EASE_OUT(within(at.desert, 0.4, 0.6))} transform="translate(860 1300)">
              <rect x={-40} y={-180} width={80} height={180} rx={8} fill="rgba(255,255,255,0.12)" stroke="#fff" strokeWidth={4} />
              <rect x={-36} y={-12} width={72} height={8} fill="#4fc3ff" />
              <text x={0} y={40} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={24} fill="#fff">RAIN + SNOW</text>
            </g>
          </svg>
          <Card top="THE DRIEST CONTINENT" color={ICE} y={220} o={EASE_OUT(within(at.desert, 0.3, 0.55))} />
        </AbsoluteFill>
      )}

      {/* ---------------- 70% of the fresh water ---------------- */}
      {sWater > 0.001 && (
        <AbsoluteFill style={{ opacity: sWater, background: 'linear-gradient(#04101f 0%, #0a2340 100%)' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <clipPath id="drop"><path d="M 540 560 C 700 800 820 960 820 1110 A 280 280 0 0 1 260 1110 C 260 960 380 800 540 560 Z" /></clipPath>
            </defs>
            <path d="M 540 560 C 700 800 820 960 820 1110 A 280 280 0 0 1 260 1110 C 260 960 380 800 540 560 Z" fill="#0d2a4a" />
            <g clipPath="url(#drop)">
              <rect x={240} y={lerp(1390, 1390 - 830 * 0.7, fill)} width={600} height={900} fill={ICE} />
              {Array.from({ length: 12 }, (_, i) => {
                const r = rng(i + 30);
                return <path key={i} d={`M ${300 + r() * 480} ${1390 - r() * 560 * fill} l 18 -30 l 18 30 z`} fill="#fff" opacity={0.5} />;
              })}
            </g>
            <path d="M 540 560 C 700 800 820 960 820 1110 A 280 280 0 0 1 260 1110 C 260 960 380 800 540 560 Z" fill="none"
              stroke="#9fd0ff" strokeWidth={8} />
          </svg>
          <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 150, color: '#fff', textShadow: '0 6px 30px #000' }}>{Math.round(70 * fill)}%</div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: ICE }}>OF THE WORLD'S FRESH WATER · FROZEN</div>
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- 1.9 km of ice ---------------- */}
      {sIce > 0.001 && (
        <AbsoluteFill style={{ opacity: sIce, background: 'linear-gradient(#0b1730 0%, #2b4f7a 40%, #000 41%)' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <rect x={0} y={1350} width={W} height={H} fill="#3b2f25" />
            <rect x={0} y={1350 - 570 * grow} width={W} height={570 * grow} fill={ICE} />
            {Array.from({ length: 9 }, (_, i) => (
              <line key={i} x1={0} x2={W} y1={1350 - 570 * grow * (i / 9)} y2={1350 - 570 * grow * (i / 9) + 6} stroke="#9fc8ea" strokeWidth={2} opacity={0.5} />
            ))}
            <line x1={900} y1={1350} x2={900} y2={1350 - 570 * grow} stroke={ALERT} strokeWidth={6} />
            <line x1={880} y1={1350 - 570 * grow} x2={920} y2={1350 - 570 * grow} stroke={ALERT} strokeWidth={6} />
            <text x={880} y={1350 - 285 * grow} textAnchor="end" fontFamily={MONO} fontWeight={700} fontSize={56} fill={ALERT} opacity={grow}>1.9 km</text>
            {/* a person, to scale would be under a pixel - so a flag on top for scale of "up" */}
            <g transform={`translate(260 ${1350 - 570 * grow})`} opacity={grow}>
              <line x1={0} y1={0} x2={0} y2={-70} stroke="#fff" strokeWidth={4} />
              <path d="M 0 -70 L 46 -58 L 0 -46 Z" fill={ALERT} />
              <text x={10} y={-84} fontFamily={SANS} fontWeight={700} fontSize={24} fill="#fff">YOU, UP HERE</text>
            </g>
            <text x={60} y={1400} fontFamily={SANS} fontWeight={700} fontSize={28} fill="#d8c3a5">ROCK</text>
          </svg>
          <Card top="ICE, ON AVERAGE" color={ICE} y={220} o={EASE_OUT(within(at.ice, 0.2, 0.45))} />
        </AbsoluteFill>
      )}

      {/* ---------------- seas +60 m ---------------- */}
      {sSea > 0.001 && (
        <AbsoluteFill style={{ opacity: sSea, background: 'linear-gradient(#0d1424 0%, #1c2a44 100%)' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <Skyline base={1420} />
            <path d={`M 0 ${1420 - 480 * rise} ${Array.from({ length: 28 }, (_, i) => `L ${(i + 1) * 40} ${1420 - 480 * rise + Math.sin(i * 0.8 + f / 5) * 8}`).join(' ')} L ${W} 1920 L 0 1920 Z`}
              fill="#1f6fae" opacity={0.88} />
            <line x1={60} y1={1420} x2={60} y2={1420 - 480} stroke="#fff" strokeWidth={3} strokeDasharray="8 8" opacity={0.6} />
          </svg>
          <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#9fe0ff' }}>IF IT ALL MELTED</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 140, color: '#fff', textShadow: '0 6px 30px #000' }}>+{Math.round(60 * rise)} m</div>
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- -89.2 C ---------------- */}
      {sCold > 0.001 && (
        <AbsoluteFill style={{ opacity: sCold, background: 'linear-gradient(#020812 0%, #0b2440 100%)' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <Flakes shift={f * 4} o={0.8} n={120} />
            <rect x={490} y={560} width={100} height={700} rx={50} fill="#0b0d14" stroke="#cfe0ff" strokeWidth={6} />
            <circle cx={540} cy={1330} r={95} fill="#4fc3ff" stroke="#cfe0ff" strokeWidth={6} />
            <rect x={515} y={lerp(700, 1240, drop)} width={50} height={1300 - lerp(700, 1240, drop)} rx={25} fill="#4fc3ff" />
            {[20, 0, -20, -40, -60, -80].map((t) => {
              const y = lerp(700, 1240, (20 - t) / 109.2);
              return <g key={t}><line x1={600} x2={640} y1={y} y2={y} stroke="#cfe0ff" strokeWidth={3} />
                <text x={655} y={y + 10} fontFamily={MONO} fontSize={28} fill="#cfe0ff">{t}</text></g>;
            })}
          </svg>
          <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#9fe0ff' }}>COLDEST EVER MEASURED</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 140, color: '#fff', textShadow: '0 6px 30px #000' }}>{temp.toFixed(1)}°C</div>
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- 40% bigger than Europe ---------------- */}
      {sSize > 0.001 && (
        <AbsoluteFill style={{ opacity: sSize, background: '#05080f' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {/* equal-area discs: Europe = 1, Antarctica = 1.4 */}
            <circle cx={540} cy={1000} r={330 * bars} fill={ICE} opacity={0.9} />
            <circle cx={540} cy={1000 + 330 - 330 / Math.sqrt(1.4)} r={(330 / Math.sqrt(1.4)) * bars} fill="none" stroke={ROUTE} strokeWidth={8}
              strokeDasharray="16 12" />
            <text x={540} y={1000 + 70} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={44} fill="#1b2a44" opacity={bars}>EUROPE</text>
            <text x={540} y={640} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={44} fill="#9fe0ff" opacity={bars}>ANTARCTICA</text>
          </svg>
          <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 140, color: '#fff', textShadow: '0 6px 30px #000' }}>+{Math.round(40 * bars)}%</div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: ROUTE }}>BIGGER THAN EUROPE</div>
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- the treaty; the first baby ---------------- */}
      {sMap > 0.001 && (
        <AbsoluteFill style={{ opacity: sMap }}>
          <SpaceBg />
          <GlobeView id="map" cx={540} cy={1030} R={470} lon0={lon0} lat0={lat0} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {f < cue(at.baby) && Array.from({ length: 29 }, (_, i) => {
              const a = (i / 29) * Math.PI * 2 - Math.PI / 2 + f / 200;
              return <circle key={i} cx={540 + Math.cos(a) * 520 * ring} cy={1030 + Math.sin(a) * 520 * ring} r={16} fill={ROUTE} opacity={ring}
                stroke="#000" strokeWidth={3} />;
            })}
            {f < cue(at.baby) && (
              <g opacity={bans}>
                {[[370, 'ARMIES'], [710, 'MINING']].map(([x, t]) => (
                  <g key={String(t)} transform={`translate(${x} 1030)`}>
                    <circle r={110} fill="rgba(8,10,14,0.85)" stroke={ALERT} strokeWidth={12} />
                    <line x1={-78} y1={78} x2={78} y2={-78} stroke={ALERT} strokeWidth={12} />
                    <text y={12} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={34} fill="#fff">{t}</text>
                  </g>
                ))}
              </g>
            )}
          </svg>
          {f >= cue(at.baby) && <Pin p={esp} o={EASE_OUT(within(at.baby, 0.1, 0.35))} label="ESPERANZA BASE" color={ROUTE} />}
          {f < cue(at.baby)
            ? (
              <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center' }}>
                <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 120, color: '#fff', textShadow: '0 6px 30px #000' }}>
                  {Math.round(29 * ring)} COUNTRIES</div>
                <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: ROUTE }}>NO ONE OWNS IT · 1959 TREATY</div>
              </div>
            )
            : (
              <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center' }}>
                <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#9fe0ff' }}>FIRST BABY BORN ON THE MAINLAND</div>
                <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 150, color: '#fff', textShadow: '0 6px 30px #000' }}>1978</div>
              </div>
            )}
        </AbsoluteFill>
      )}

      {loopT > 0.001 && <AbsoluteFill style={{ opacity: loopT }}>{hookScene('loop', 0)}</AbsoluteFill>}

      {(() => {
        const o = Math.max(sHook, prog(f, END - 22, END - 4));
        return (
          <>
            <div style={{ position: 'absolute', top: 160, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
              fontSize: 96, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.9)', opacity: o }}>
              {hook.top}<br /><span style={{ color: '#9fe0ff' }}>{hook.bottom}</span>
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

export default Antarctica;
