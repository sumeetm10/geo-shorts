import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { Card } from './BlackHole';
import { EndCard } from './EndCard';
import { GlobeView, SpaceBg } from './Globe';
import { ALERT, Defs, H, MONO, Pin, ROUTE, Rig, SANS, W, lerp, rng } from './parts';

// =============================================================================
// "The asteroid that killed the dinosaurs was only a little taller than Everest."
// The rock (~10 km) set down beside Everest (8.8 km) at one scale; its 20 km/s
// plunge; the globe turned to Chicxulub; the 100 x 30 km cavity in a true-scale
// cut (Everest inside for size); the blast wind rings; three in four species
// gone; the crater today, buried ~1 km under the Yucatan; and the oil survey
// plane whose magnetic map showed the bullseye. Script and sources:
// make_whatif.py "dinorock".
// =============================================================================
export const compositionConfig = {
  id: 'DinoRock',
  durationInSeconds: 40,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string; badge: string };
  at: { size: number; speed: number; mexico: number; hole: number; wind: number; extinct: number; buried: number; oil: number };
  durationInSeconds: number;
};

const RAD = Math.PI / 180;
const CHX = { lon: -89.5, lat: 21.4 };
const proj = (lon: number, lat: number, lon0: number, lat0: number, cx: number, cy: number, R: number) => {
  const p = lat * RAD; const dl = (lon - lon0) * RAD; const s0 = Math.sin(lat0 * RAD); const c0 = Math.cos(lat0 * RAD);
  return { x: cx + R * Math.cos(p) * Math.sin(dl), y: cy - R * (c0 * Math.sin(p) - s0 * Math.cos(p) * Math.cos(dl)) };
};

const LUMPS = (() => { const r = rng(2024); return Array.from({ length: 22 }, () => 0.84 + r() * 0.16); })();
const PITS = (() => { const r = rng(77); return Array.from({ length: 9 }, () => [(r() - 0.5) * 1.2, (r() - 0.5) * 1.2, 0.06 + r() * 0.12]); })();
const Rock: React.FC<{ x: number; y: number; r: number; rot: number }> = ({ x, y, r, rot }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <defs>
      <radialGradient id="rockG" cx="0.38" cy="0.35" r="0.75">
        <stop offset="0" stopColor="#a39686" /><stop offset="0.6" stopColor="#6e6356" /><stop offset="1" stopColor="#3a332c" />
      </radialGradient>
    </defs>
    <path d={LUMPS.map((k, i) => { const a = (i / LUMPS.length) * Math.PI * 2; return `${i ? 'L' : 'M'} ${Math.cos(a) * r * k} ${Math.sin(a) * r * k}`; }).join(' ') + ' Z'}
      fill="url(#rockG)" stroke="#2a241e" strokeWidth={Math.max(2, r * 0.02)} />
    {PITS.map(([px, py, pr], i) => (
      <circle key={i} cx={px * r * 0.7} cy={py * r * 0.7} r={pr * r} fill="#4f463c" opacity={0.55} stroke="#8a7e70" strokeWidth={Math.max(1, r * 0.01)} />
    ))}
  </g>
);

// Everest at a given scale (px per km), peak at (x, base - 8.8 km)
const Everest: React.FC<{ x: number; base: number; k: number }> = ({ x, base, k }) => {
  const h = 8.85 * k; const w = h * 1.1;
  return (
    <g>
      <path d={`M ${x - w} ${base} L ${x - w * 0.45} ${base - h * 0.55} L ${x - w * 0.2} ${base - h * 0.72} L ${x} ${base - h}
        L ${x + w * 0.3} ${base - h * 0.66} L ${x + w * 0.55} ${base - h * 0.5} L ${x + w} ${base} Z`} fill="#5d6675" />
      <path d={`M ${x - w * 0.2} ${base - h * 0.72} L ${x} ${base - h} L ${x + w * 0.3} ${base - h * 0.66} L ${x + w * 0.14} ${base - h * 0.74}
        L ${x + w * 0.02} ${base - h * 0.7} L ${x - w * 0.08} ${base - h * 0.76} Z`} fill="#eef3f8" />
    </g>
  );
};

const DINO = 'M5 50 L20 30 L35 26 L55 24 L70 14 L88 12 L97 18 L90 23 L78 23 L72 31 L66 35 L62 50 L56 50 L56 41 L44 41 L42 50 L36 50 L36 39 L20 37 Z';
const FERN = 'M50 52 L50 20 M50 26 L34 12 M50 26 L66 12 M50 34 L30 24 M50 34 L70 24 M50 42 L34 34 M50 42 L66 34';

const DinoRock: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '', badge: '' }, at, durationInSeconds = 40 }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const span = (a: number, b: number) => prog(f, cue(a) - 6, cue(a) + 8) * (1 - prog(f, cue(b) - 8, cue(b) + 6));
  const last = vo.length - 1;

  // ---- hook + size: the rock set down beside Everest (60 px per km)
  const K = 60; const base = 1340;
  const sScale = span(0, at.speed);
  const drop = EASE_OUT(within(0, 0.05, 0.5));
  const brackets = f >= cue(at.size) ? EASE_OUT(within(at.size, 0.05, 0.4)) : 0;
  const scaleScene = (dropT: number, br: number) => (
    <>
      <AbsoluteFill style={{ background: 'linear-gradient(#0b1730 0%, #24467a 55%, #c98a5a 100%)' }} />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <Everest x={830} base={base} k={K} />
        <Rock x={lerp(-200, 300, dropT)} y={lerp(-400, base - 5 * K, dropT)} r={5 * K} rot={dropT * 140} />
        {dropT > 0.98 && Array.from({ length: 12 }, (_, i) => {
          const t = Math.min(1, (f - cue(0) - 12) / 30);
          return t > 0 && t < 1 ? <circle key={i} cx={300 + (i - 6) * 50 * t * 2} cy={base - 30 * Math.sin(t * Math.PI)} r={30 * (1 - t) + 10}
            fill="#c9a77a" opacity={0.6 * (1 - t)} /> : null;
        })}
        <rect x={0} y={base} width={W} height={H - base} fill="#3b2f25" />
        <g opacity={br}>
          <line x1={40} y1={base} x2={40} y2={base - 10 * K} stroke={ROUTE} strokeWidth={5} />
          <line x1={26} y1={base - 10 * K} x2={54} y2={base - 10 * K} stroke={ROUTE} strokeWidth={5} />
          <text x={60} y={base - 10 * K - 16} fontFamily={MONO} fontWeight={700} fontSize={44} fill={ROUTE}>~10 km</text>
          <line x1={1040} y1={base} x2={1040} y2={base - 8.85 * K} stroke="#fff" strokeWidth={5} />
          <line x1={1026} y1={base - 8.85 * K} x2={1054} y2={base - 8.85 * K} stroke="#fff" strokeWidth={5} />
          <text x={1020} y={base - 8.85 * K - 16} textAnchor="end" fontFamily={MONO} fontWeight={700} fontSize={44} fill="#fff">8.8 km</text>
          <text x={830} y={base + 60} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={34} fill="#eef3f8">EVEREST</text>
          <text x={300} y={base + 60} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={34} fill={ROUTE}>THE ASTEROID</text>
        </g>
      </svg>
    </>
  );

  // ---- 20 km/s
  const sSpeed = span(at.speed, at.mexico);
  const plunge = EASE_INOUT(within(at.speed, 0, 1));
  const rx = lerp(1100, 560, plunge); const ry = lerp(80, 1020, plunge);

  // ---- Mexico
  const sMex = span(at.mexico, at.hole);
  const turn = EASE_INOUT(within(at.mexico, 0, 0.7));
  const mLon = lerp(20, CHX.lon, turn); const mLat = lerp(10, CHX.lat, turn);
  const mR = lerp(380, 620, EASE_INOUT(within(at.mexico, 0.4, 1)));
  const pMex = proj(CHX.lon, CHX.lat, mLon, mLat, 540, 1020, mR);

  // ---- the cavity, 100 x 30 km (9 px per km)
  const sHole = span(at.hole, at.wind);
  const dig = EASE_OUT(within(at.hole, 0.05, 0.6));
  const K2 = 9; const gy = 760;

  // ---- wind rings over the Gulf
  const sWind = span(at.wind, at.extinct);
  const wt = within(at.wind, 0, 1);

  // ---- three in four species
  const sExt = span(at.extinct, at.buried);
  const die = EASE_INOUT(within(at.extinct, 0.15, 0.7));

  // ---- buried, and found while hunting for oil
  const sBur = span(at.buried, last);
  const fly = within(at.oil, 0, 1);
  const found = EASE_OUT(within(at.oil, 0.35, 0.75));
  const loopT = EASE_INOUT(prog(f, cue(last), END - 4));

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      {sScale > 0.001 && <AbsoluteFill style={{ opacity: sScale }}>{scaleScene(drop, brackets)}</AbsoluteFill>}

      {/* ---------------- 20 km a second ---------------- */}
      {sSpeed > 0.001 && (
        <AbsoluteFill style={{ opacity: sSpeed }}>
          <SpaceBg />
          <GlobeView id="speed" cx={540} cy={2350} R={1500} lon0={CHX.lon} lat0={-40} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <linearGradient id="trail" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ff6a00" stopOpacity={0} /><stop offset="0.7" stopColor="#ffb347" stopOpacity={0.7} />
                <stop offset="1" stopColor="#fff3c4" stopOpacity={1} />
              </linearGradient>
            </defs>
            <path d={`M ${rx + 520} ${ry - 900} L ${rx + 46} ${ry - 50} L ${rx - 30} ${ry + 30} Z`} fill="url(#trail)" opacity={0.85} />
            <circle cx={rx} cy={ry} r={70} fill="#ffcf7a" opacity={0.35} />
            <Rock x={rx} y={ry} r={44} rot={f * 4} />
          </svg>
          <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 140, color: '#fff', textShadow: '0 6px 30px #000' }}>20 km/s</div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 44, color: ROUTE }}>72,000 KM/H</div>
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- Mexico ---------------- */}
      {sMex > 0.001 && (
        <AbsoluteFill style={{ opacity: sMex }}>
          <SpaceBg />
          <GlobeView id="mex" cx={540} cy={1020} R={mR} lon0={mLon} lat0={mLat} />
          <Pin p={pMex} o={EASE_OUT(within(at.mexico, 0.55, 0.8))} label="CHICXULUB, MEXICO" color={ALERT} />
        </AbsoluteFill>
      )}

      {/* ---------------- the cavity ---------------- */}
      {sHole > 0.001 && (
        <AbsoluteFill style={{ opacity: sHole, background: 'linear-gradient(#162a4a 0%, #2c4f7a 40%, #000 41%)' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {[['#6b4c35', 0], ['#5e4430', 90], ['#4f3a28', 200], ['#43301f', 330], ['#38281a', 470]].map(([c, y]) => (
              <rect key={String(y)} x={0} y={gy + Number(y)} width={W} height={H} fill={String(c)} />
            ))}
            <rect x={0} y={gy - 8} width={W} height={10} fill="#6f8f4a" />
            <path d={`M ${540 - 50 * K2 * dig} ${gy} A ${50 * K2 * dig} ${30 * K2 * dig} 0 0 0 ${540 + 50 * K2 * dig} ${gy} Z`} fill="#120a06"
              stroke="#ff7a1a" strokeWidth={6} />
            <g opacity={prog(dig, 0.8, 1)}>
              <line x1={540 - 450} y1={gy - 40} x2={540 + 450} y2={gy - 40} stroke={ROUTE} strokeWidth={5} />
              <text x={540} y={gy - 60} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={46} fill={ROUTE}>100 km WIDE</text>
              <line x1={540} y1={gy} x2={540} y2={gy + 270} stroke="#fff" strokeWidth={4} strokeDasharray="10 8" />
              <text x={560} y={gy + 200} fontFamily={MONO} fontWeight={700} fontSize={42} fill="#fff">30 km DEEP</text>
              <Everest x={300} base={gy + 170} k={K2} />
              <text x={300} y={gy + 210} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={26} fill="#eef3f8">EVEREST, TO SCALE</text>
            </g>
          </svg>
        </AbsoluteFill>
      )}

      {/* ---------------- the blast wind ---------------- */}
      {sWind > 0.001 && (
        <AbsoluteFill style={{ opacity: sWind }}>
          <SpaceBg />
          <GlobeView id="wind" cx={540} cy={1020} R={620} lon0={CHX.lon} lat0={CHX.lat} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {(() => { const p = proj(CHX.lon, CHX.lat, CHX.lon, CHX.lat, 540, 1020, 620); return (
              <g>
                <circle cx={p.x} cy={p.y} r={50} fill="#fff3c4" opacity={0.9 * (1 - wt)} />
                {[0, 0.2, 0.4, 0.6].map((d) => {
                  const t = Math.max(0, Math.min(1, wt * 1.4 - d));
                  return <circle key={d} cx={p.x} cy={p.y} r={40 + 520 * t} fill="none" stroke="#ffb347" strokeWidth={14 * (1 - t) + 2} opacity={1 - t} />;
                })}
                {Array.from({ length: 24 }, (_, i) => {
                  const a = (i / 24) * Math.PI * 2; const d = 80 + ((f * 9 + i * 37) % 420);
                  return <line key={i} x1={p.x + Math.cos(a) * d} y1={p.y + Math.sin(a) * d} x2={p.x + Math.cos(a) * (d + 60)}
                    y2={p.y + Math.sin(a) * (d + 60)} stroke="#fff" strokeWidth={4} opacity={0.6} />;
                })}
              </g>
            ); })()}
          </svg>
          <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#ffb199' }}>WINDS NEAR THE BLAST</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 120, color: '#fff', textShadow: '0 6px 30px #000' }}>1,000+ km/h</div>
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- three in four species ---------------- */}
      {sExt > 0.001 && (
        <AbsoluteFill style={{ opacity: sExt, background: 'linear-gradient(#2a1a12 0%, #120c09 100%)' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {Array.from({ length: 20 }, (_, i) => {
              const col = i % 4; const row = Math.floor(i / 4);
              const x = 90 + col * 240; const y = 520 + row * 170;
              const dead = (i * 7) % 20 < 15;              // 15 of 20, scattered
              const g = dead ? die : 0;
              return (
                <g key={i} transform={`translate(${x} ${y + g * 30}) scale(1.6)`} opacity={1 - g * 0.45}>
                  {i % 2 === 0
                    ? <path d={DINO} fill={dead && g > 0.5 ? '#6a5f55' : '#7fbf6a'} />
                    : <path d={FERN} stroke={dead && g > 0.5 ? '#6a5f55' : '#5fbf5a'} strokeWidth={5} strokeLinecap="round" fill="none" />}
                </g>
              );
            })}
          </svg>
          <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 140, color: '#fff', textShadow: '0 6px 30px #000' }}>
              {Math.round(75 * die)}%</div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 38, color: ALERT }}>OF PLANT AND ANIMAL SPECIES GONE</div>
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- buried; found by an oil survey ---------------- */}
      {sBur > 0.001 && (
        <AbsoluteFill style={{ opacity: sBur, background: 'linear-gradient(#5d9bd6 0%, #a8cdea 34%, #000 35%)' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <Defs />
            {/* today's ground: younger rock laid over the crater */}
            <rect x={0} y={668} width={W} height={H} fill="#b89a6a" />
            {[['#a88a5c', 760], ['#97794e', 860], ['#86693f', 960]].map(([c, y]) => (
              <rect key={String(y)} x={0} y={Number(y)} width={W} height={H} fill={String(c)} />
            ))}
            <rect x={0} y={660} width={W} height={14} fill="#5f8f3a" />
            {Array.from({ length: 9 }, (_, i) => (
              <g key={i}><rect x={60 + i * 120} y={620} width={8} height={44} fill="#5a3d2a" /><circle cx={64 + i * 120} cy={612} r={24} fill="#3f7f3a" /></g>
            ))}
            {/* the old crater, about 1 km down */}
            <path d="M 60 1060 Q 540 1460 1020 1060" fill="#3a2a1d" stroke="#ff7a1a" strokeWidth={6} strokeDasharray="16 10" />
            <line x1={980} y1={674} x2={980} y2={1050} stroke="#fff" strokeWidth={4} />
            <text x={960} y={880} textAnchor="end" fontFamily={MONO} fontWeight={700} fontSize={38} fill="#fff">~1 km</text>
            <text x={540} y={1200} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={40} fill="#ffb347">THE CRATER</text>
            {/* the survey plane and its magnetic map */}
            {f >= cue(at.oil) && (
              <>
                <g transform={`translate(${lerp(-150, 1230, fly)} 330) scale(1.2)`}>
                  <path d="M -60 0 L 50 -6 L 70 0 L 50 6 Z" fill="#eef3f8" />
                  <path d="M -6 0 L -26 -40 L -12 -40 L 18 0 L -12 40 L -26 40 Z" fill="#cfd8e3" />
                  <path d="M -60 0 L -72 -18 L -62 -18 L -48 0 Z" fill="#cfd8e3" />
                </g>
                {[0, 1, 2, 3].map((i) => (
                  <ellipse key={i} cx={540} cy={1180} rx={140 + i * 110} ry={50 + i * 40} fill="none" stroke={ROUTE} strokeWidth={4}
                    opacity={found * (1 - i * 0.18)} />
                ))}
              </>
            )}
            <Rig x={150} gy={668} s={0.55} />
          </svg>
          {f < cue(at.oil) && <Card top="BURIED UNDER THE YUCATÁN" color="#ffb347" y={1360} o={EASE_OUT(within(at.buried, 0.15, 0.4))} />}
          {f >= cue(at.oil) && <Card top="FOUND HUNTING FOR OIL" sub="a magnetic survey showed a bullseye" color={ROUTE} y={1340} o={found} />}
        </AbsoluteFill>
      )}

      {loopT > 0.001 && <AbsoluteFill style={{ opacity: loopT }}>{scaleScene(0, 0)}</AbsoluteFill>}

      {(() => {
        const o = Math.max(1 - prog(f, cue(at.size) - 6, cue(at.size) + 8), prog(f, END - 22, END - 4));
        return (
          <>
            <div style={{ position: 'absolute', top: 160, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
              fontSize: 96, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.9)', opacity: o }}>
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
      <Captions lines={vo} y={1560} accent={ROUTE} maxWords={3} size={58} plate />
    </AbsoluteFill>
  );
};

export default DinoRock;
