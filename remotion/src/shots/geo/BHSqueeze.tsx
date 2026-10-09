import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { Card, LensedStars, Sun } from './BlackHole';
import { EndCard } from './EndCard';
import { Gargantua } from './Gargantua';
import { GlobeView, SpaceBg } from './Globe';
import { Moon } from './MoonGone';
import { ALERT, H, MONO, ROUTE, SANS, W, lerp, rng } from './parts';

// =============================================================================
// "Crush Earth into a black hole and it fits in your hand." The globe implodes
// into an 18 mm black hole floating over a palm; at macro scale beside a ruler
// and a marble; the Moon still circling it; the Moon crushed to a sand-grain
// black hole (0.2 mm) under a magnifier; you, crushed, in a powers-of-ten dive
// past a proton; why everything isn't a black hole (a giant star collapsing);
// and the twist: the biggest ones are less dense than the Sun on average.
// Script and sources: make_whatif.py "squeeze".
// =============================================================================
export const compositionConfig = {
  id: 'BHSqueeze',
  durationInSeconds: 34,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string; badge: string };
  at: { size: number; moon: number; sand: number; you: number; proton: number; why: number; star: number; density: number };
  durationInSeconds: number;
};

const SKIN = '#e9b68c'; const SKIN2 = '#c98d63';
const Hand: React.FC<{ dy: number }> = ({ dy }) => (
  <g transform={`translate(0 ${dy - 250})`}>
    <rect x={432} y={1420} width={236} height={600} rx={60} fill={SKIN} />
    <path d="M 392 1500 L 392 1210 Q 392 1140 462 1140 L 640 1140 Q 712 1140 712 1210 L 712 1500 Q 712 1560 640 1560 L 462 1560 Q 392 1560 392 1500 Z" fill={SKIN} />
    {[[430, 930], [505, 880], [580, 895], [652, 960]].map(([x, top], i) => (
      <g key={i}>
        <rect x={x - 32} y={top} width={64} height={1200 - top} rx={32} fill={SKIN} />
        <path d={`M ${x - 20} ${top + 110} Q ${x} ${top + 118} ${x + 20} ${top + 110}`} stroke={SKIN2} strokeWidth={4} fill="none" />
        <path d={`M ${x - 20} ${top + 200} Q ${x} ${top + 208} ${x + 20} ${top + 200}`} stroke={SKIN2} strokeWidth={4} fill="none" />
      </g>
    ))}
    <rect x={360} y={1190} width={74} height={270} rx={37} fill={SKIN} transform="rotate(-35 397 1440)" />
    <path d="M 450 1330 Q 540 1290 650 1320" stroke={SKIN2} strokeWidth={5} fill="none" opacity={0.7} />
    <path d="M 440 1420 Q 520 1380 600 1440" stroke={SKIN2} strokeWidth={5} fill="none" opacity={0.7} />
  </g>
);

const Person: React.FC<{ x: number; y: number; h: number; sx?: number; sy?: number; o?: number }> = ({ x, y, h, sx = 1, sy = 1, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${(h / 200) * sx} ${(h / 200) * sy})`} opacity={o} fill="#cfe6ff">
    <circle cx={0} cy={-80} r={20} />
    <rect x={-26} y={-56} width={52} height={70} rx={18} />
    <rect x={-40} y={-52} width={14} height={62} rx={7} /><rect x={26} y={-52} width={14} height={62} rx={7} />
    <rect x={-22} y={10} width={18} height={80} rx={8} /><rect x={4} y={10} width={18} height={80} rx={8} />
  </g>
);

const GRAINS = (() => {
  const r = rng(5150);
  return Array.from({ length: 9 }, (_, i) => {
    const cx = [230, 830, 300, 860, 520, 180, 760, 420, 640][i]; const cy = [640, 700, 1180, 1220, 1340, 900, 960, 560, 560][i];
    const R = 70 + r() * 110; const n = 9;
    const pts = Array.from({ length: n }, (_, k) => {
      const a = (k / n) * Math.PI * 2 + r() * 0.3; const rr = R * (0.72 + r() * 0.28);
      return `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`;
    }).join(' ');
    return { cx, cy, R, pts, c: ['#c9a46a', '#b08a52', '#d8bb85'][i % 3] };
  });
})();
const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
const sup = (s: string) => s.split('').map((c) => SUP[c] ?? c).join('');

const BHSqueeze: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '', badge: '' }, at, durationInSeconds = 34 }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const span = (a: number, b: number) => prog(f, cue(a) - 6, cue(a) + 8) * (1 - prog(f, cue(b) - 8, cue(b) + 6));
  const last = vo.length - 1;
  const spin = 20 - f * 0.6;

  // ---- hook: Earth implodes into an 18 mm black hole over a palm
  const sHook = 1 - prog(f, cue(at.size) - 6, cue(at.size) + 8);
  const hookScene = (key: string, crush: number, hand: number, lon: number) => {
    const R = 380 * Math.pow(1 - crush, 2);
    const flash = crush > 0.96 ? prog(crush, 0.96, 1) : 0;
    const bh = prog(crush, 0.9, 1);
    return (
      <>
        <SpaceBg />
        {R > 2 && <GlobeView id={key} cx={540} cy={980} R={R} lon0={lon} lat0={12} />}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {crush > 0.05 && crush < 0.97 && Array.from({ length: 40 }, (_, i) => {
            const a = (i / 40) * Math.PI * 2; const d = R + 40 + ((i * 53 + f * 25) % 260);
            return <line key={i} x1={540 + Math.cos(a) * d} y1={980 + Math.sin(a) * d} x2={540 + Math.cos(a) * (d + 70)}
              y2={980 + Math.sin(a) * (d + 70)} stroke="#9fd0ff" strokeWidth={3} opacity={0.6} />;
          })}
          <Hand dy={lerp(1300, 0, hand)} />
          {bh > 0 && <Gargantua id={`h-${key}`} x={548} y={1050} rs={32} f={f} o={bh} />}
          {flash > 0 && flash < 1 && <circle cx={548} cy={1050} r={60 + 500 * flash} fill="#fff" opacity={0.8 * (1 - flash)} />}
        </svg>
      </>
    );
  };
  const crush0 = EASE_INOUT(within(0, 0.15, 0.6));
  const hand0 = EASE_OUT(within(0, 0.55, 0.95));

  // ---- 18 mm, beside a ruler and a marble (300 px = 18 mm)
  const sSize = span(at.size, at.moon);
  const PX = 300 / 18;
  const ruler = EASE_OUT(within(at.size, 0.2, 0.5));

  // ---- the Moon keeps circling
  const sMoon = span(at.moon, at.sand);
  const ma = (f - cue(at.moon)) / 22;

  // ---- the Moon crushed: a sand-grain black hole
  const sSand = span(at.sand, at.you);
  const mcrush = EASE_INOUT(within(at.sand, 0.05, 0.35));
  const mag = EASE_OUT(within(at.sand, 0.35, 0.6));

  // ---- you; the dive past a proton
  const sYou = span(at.you, at.why);
  const squash = EASE_INOUT(within(at.you, 0.4, 1));
  const n = 25 * Math.pow(EASE_INOUT(within(at.proton, 0, 0.92)), 1.1);   // zoom: 10^-n metres
  const iconScale = (ni: number) => Math.pow(10, n - ni);

  // ---- why not everything; the dying star; density
  const sWhy = span(at.why, at.star);
  const sStar = span(at.star, at.density);
  const swellT = within(at.star, 0, 0.35);
  const fallT = EASE_INOUT(within(at.star, 0.35, 0.55));
  const boom = within(at.star, 0.52, 0.85);
  const born = EASE_OUT(within(at.star, 0.6, 0.85));
  const sDen = span(at.density, last);
  const loopT = EASE_INOUT(prog(f, cue(last), END - 4));

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      {sHook > 0.001 && <AbsoluteFill style={{ opacity: sHook }}>{hookScene('hook', crush0, hand0, spin)}</AbsoluteFill>}

      {/* ---------------- 18 mm ---------------- */}
      {sSize > 0.001 && (
        <AbsoluteFill style={{ opacity: sSize, background: '#000' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <radialGradient id="marble" cx="0.38" cy="0.32" r="0.75">
                <stop offset="0" stopColor="#ffffff" stopOpacity={0.9} /><stop offset="0.25" stopColor="#9fd8ff" stopOpacity={0.55} />
                <stop offset="1" stopColor="#1f5fae" stopOpacity={0.85} />
              </radialGradient>
            </defs>
            <LensedStars lx={540} ly={760} tE={260} o={1} />
            <Gargantua id="size" x={540} y={760} rs={150} f={f} />
            <g opacity={ruler}>
              <line x1={390} y1={960} x2={690} y2={960} stroke={ROUTE} strokeWidth={5} />
              <line x1={390} y1={944} x2={390} y2={976} stroke={ROUTE} strokeWidth={5} />
              <line x1={690} y1={944} x2={690} y2={976} stroke={ROUTE} strokeWidth={5} />
              <rect x={190} y={1030} width={700} height={70} rx={8} fill="#e9dcc0" />
              {Array.from({ length: 41 }, (_, i) => (
                <line key={i} x1={200 + i * PX} x2={200 + i * PX} y1={1030} y2={1030 + (i % 10 === 0 ? 40 : i % 5 === 0 ? 28 : 16)}
                  stroke="#3a2f22" strokeWidth={i % 5 === 0 ? 3 : 2} />
              ))}
              {[0, 1, 2, 3, 4].map((c) => (
                <text key={c} x={200 + c * 10 * PX} y={1092} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={22}
                  fill="#3a2f22">{c}</text>
              ))}
              <text x={880} y={1092} textAnchor="end" fontFamily={MONO} fontWeight={700} fontSize={22} fill="#3a2f22">cm</text>
            </g>
            <g opacity={EASE_OUT(within(at.size, 0.5, 0.8))}>
              <circle cx={540} cy={1300} r={8 * PX} fill="url(#marble)" />
              <path d={`M ${540 - 90} 1340 C ${540 - 40} 1230, ${540 + 30} 1380, ${540 + 95} 1260`} stroke="#ffcf5c" strokeWidth={22} fill="none" opacity={0.45} />
              <circle cx={540 - 50} cy={1300 - 60} r={22} fill="#fff" opacity={0.7} />
              <text x={540 + 8 * PX + 20} y={1310} fontFamily={SANS} fontWeight={700} fontSize={32} fill="#cfe6ff">A MARBLE</text>
            </g>
          </svg>
          <div style={{ position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#9fc8ea' }}>EARTH'S MASS, EDGE TO EDGE</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 130, color: '#fff', textShadow: '0 6px 30px #000' }}>18 mm</div>
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- the Moon keeps circling ---------------- */}
      {sMoon > 0.001 && (
        <AbsoluteFill style={{ opacity: sMoon }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <circle cx={540} cy={980} r={420} fill="none" stroke="#8b93a6" strokeWidth={3} strokeDasharray="10 12" />
            <path d={`M ${540 + 420 * Math.cos(ma - 2.2)} ${980 + 420 * Math.sin(ma - 2.2)} A 420 420 0 0 1 ${540 + 420 * Math.cos(ma)} ${980 + 420 * Math.sin(ma)}`}
              stroke={ROUTE} strokeWidth={6} fill="none" opacity={0.85} />
            <Gargantua id="moonbh" x={540} y={980} rs={10} f={f} />
            <circle cx={540} cy={980} r={44} fill="none" stroke="#3d7fe0" strokeWidth={3} strokeDasharray="6 8" opacity={0.8} />
            <text x={600} y={1060} fontFamily={SANS} fontWeight={700} fontSize={28} fill="#9fc8ea">WHERE EARTH WAS</text>
            <text x={1040} y={1470} textAnchor="end" fontFamily={SANS} fontWeight={700} fontSize={24} fill="#8b93a6">NOT TO SCALE</text>
            <Moon id="orb" x={540 + 420 * Math.cos(ma)} y={980 + 420 * Math.sin(ma)} r={34} glow={0.4} />
          </svg>
          <Card top="SAME MASS · SAME ORBIT" color={ROUTE} y={220} o={EASE_OUT(within(at.moon, 0.2, 0.45))} />
        </AbsoluteFill>
      )}

      {/* ---------------- the Moon, crushed: a grain of sand ---------------- */}
      {sSand > 0.001 && (
        <AbsoluteFill style={{ opacity: sSand, background: mag > 0 ? '#1d1710' : '#000' }}>
          {mag <= 0 && <SpaceBg />}
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {mag <= 0 && <Moon id="crush" x={540} y={960} r={260 * (1 - mcrush) + 1} glow={0.5} />}
            {mag > 0 && (
              <g opacity={mag}>
                {GRAINS.map((g, i) => (
                  <g key={i}>
                    <polygon points={g.pts} fill={g.c} stroke="#7a5f3a" strokeWidth={3} />
                    <ellipse cx={g.cx - g.R * 0.25} cy={g.cy - g.R * 0.3} rx={g.R * 0.25} ry={g.R * 0.12} fill="#fff4dc" opacity={0.35} />
                  </g>
                ))}
                <Gargantua id="sand" x={540} y={950} rs={45} f={f} />
                <line x1={495} y1={1040} x2={585} y2={1040} stroke={ROUTE} strokeWidth={4} />
                <text x={540} y={1086} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={36} fill={ROUTE}>0.2 mm</text>
                <circle cx={540} cy={960} r={520} fill="none" stroke="#0b0d10" strokeWidth={120} />
                <circle cx={540} cy={960} r={462} fill="none" stroke="#9aa6b2" strokeWidth={10} />
              </g>
            )}
          </svg>
          <Card top={mag > 0.5 ? 'A GRAIN OF SAND' : 'NOW THE MOON'} sub={mag > 0.5 ? 'the Moon, as a black hole' : undefined}
            color="#d8bb85" y={200} o={1} />
        </AbsoluteFill>
      )}

      {/* ---------------- you, then the dive past a proton ---------------- */}
      {sYou > 0.001 && (
        <AbsoluteFill style={{ opacity: sYou, background: '#02040a' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {f < cue(at.proton) ? (
              <Person x={540} y={1000} h={720} sx={lerp(1, 0.02, squash)} sy={lerp(1, 0.02, squash)} />
            ) : (
              <g>
                {/* the tunnel: rings rushing outward as we shrink */}
                {Array.from({ length: 16 }, (_, k) => {
                  const ph = (n * 1.6) % 1; const r = 30 * Math.pow(1.35, k + ph);
                  return r < 1400 ? <circle key={k} cx={540} cy={960} r={r} fill="none" stroke="#3d7fe0" strokeWidth={2}
                    opacity={Math.min(0.6, r / 300) * (1 - r / 1400)} /> : null;
                })}
                {/* YOU (1 m) and PROTON (10^-15 m) rush past; your black hole waits at 10^-25 m */}
                {iconScale(0) < 40 && <Person x={540} y={1000} h={520 * iconScale(0)} o={Math.max(0, 1 - n / 1.2)} />}
                {(() => {
                  const s = iconScale(15); if (s < 0.01 || s > 30) return null;
                  const o = Math.min(1, s * 8) * (s > 3 ? Math.max(0, 1 - (s - 3) / 6) : 1);
                  return (
                    <g opacity={o}>
                      <circle cx={540} cy={960} r={150 * s} fill="#d9603a" opacity={0.85} />
                      {[[-0.35, -0.2, '#ffd34d'], [0.35, -0.2, '#4fc3ff'], [0, 0.38, '#7fbf6a']].map(([dx, dy, c], i) => (
                        <circle key={i} cx={540 + Number(dx) * 150 * s} cy={960 + Number(dy) * 150 * s} r={34 * s} fill={String(c)} />
                      ))}
                      {s > 0.4 && s < 3 && <text x={540} y={960 + 150 * s + 50} textAnchor="middle" fontFamily={SANS} fontWeight={700}
                        fontSize={40} fill="#ffd0b0">A PROTON</text>}
                    </g>
                  );
                })()}
                {n > 23.5 && <Gargantua id="you" x={540} y={960} rs={70 * Math.min(1, iconScale(25))} f={f} o={prog(n, 23.5, 24.6)} />}
              </g>
            )}
          </svg>
          <div style={{ position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center' }}>
            {f < cue(at.proton)
              ? <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 80, color: '#fff', textShadow: '0 6px 30px #000' }}>NOW, YOU</div>
              : (
                <>
                  <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#9fc8ea' }}>SHRINKING TO</div>
                  <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 130, color: '#fff', textShadow: '0 6px 30px #000' }}>
                    10{sup(`-${Math.round(n)}`)} m</div>
                </>
              )}
          </div>
          {f >= cue(at.proton) && <Card top="BILLIONS OF TIMES SMALLER" sub="than a single proton" color={ALERT} y={1340}
            o={EASE_OUT(within(at.proton, 0.82, 0.97))} />}
        </AbsoluteFill>
      )}

      {/* ---------------- why isn't everything a black hole? ---------------- */}
      {sWhy > 0.001 && (
        <AbsoluteFill style={{ opacity: sWhy }}>
          <SpaceBg />
          <GlobeView id="why" cx={240} cy={1000} R={120} lon0={spin} lat0={12} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <Moon id="why" x={560} y={1000} r={80} glow={0.3} />
            <Person x={860} y={1010} h={220} />
            {[240, 560, 860].map((x, i) => (
              <text key={x} x={x} y={800 + Math.sin(f / 5 + i) * 10} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={110}
                fill={ROUTE}>?</text>
            ))}
          </svg>
          <Card top="WHY ISN'T EVERYTHING" sub="a black hole?" color={ROUTE} y={230} o={1} />
        </AbsoluteFill>
      )}

      {/* ---------------- a dying giant star collapses ---------------- */}
      {sStar > 0.001 && (
        <AbsoluteFill style={{ opacity: sStar }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <radialGradient id="giantStar" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor="#ffffff" /><stop offset="0.35" stopColor="#cfe0ff" /><stop offset="0.8" stopColor="#6f95ff" />
                <stop offset="1" stopColor="#2a4fd8" stopOpacity={0.6} />
              </radialGradient>
            </defs>
            {born > 0 && <LensedStars lx={540} ly={960} tE={190 * born} o={born} />}
            {fallT < 1 && (() => {
              const r = 360 * (1 + 0.04 * Math.sin(f / 3) * (1 - fallT) + 0.06 * swellT) * Math.pow(1 - fallT, 1.6) + 2;
              return (
                <g>
                  <circle cx={540} cy={960} r={r * 1.35} fill="#6f95ff" opacity={0.2} />
                  <circle cx={540} cy={960} r={r} fill="url(#giantStar)" />
                </g>
              );
            })()}
            {boom > 0 && boom < 1 && (
              <g>
                <circle cx={540} cy={960} r={40 + 900 * boom} fill="none" stroke="#fff" strokeWidth={60 * (1 - boom)} opacity={1 - boom} />
                <circle cx={540} cy={960} r={200 * (1 - boom)} fill="#fff" opacity={0.9 * (1 - boom)} />
                {Array.from({ length: 24 }, (_, i) => {
                  const a = (i / 24) * Math.PI * 2; const d = 100 + 800 * boom;
                  return <line key={i} x1={540 + Math.cos(a) * d * 0.6} y1={960 + Math.sin(a) * d * 0.6} x2={540 + Math.cos(a) * d}
                    y2={960 + Math.sin(a) * d} stroke="#cfe0ff" strokeWidth={6} opacity={1 - boom} />;
                })}
              </g>
            )}
            {born > 0 && <Gargantua id="born" x={540} y={960} rs={95} f={f} o={born} />}
          </svg>
          <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
            fontSize: 70, color: '#fff', textShadow: '0 6px 30px #000' }}>
            {born > 0.3 ? 'A BLACK HOLE' : fallT > 0.05 ? 'COLLAPSE!' : 'A DYING GIANT STAR'}</div>
        </AbsoluteFill>
      )}

      {/* ---------------- less dense than the Sun ---------------- */}
      {sDen > 0.001 && (
        <AbsoluteFill style={{ opacity: sDen, background: '#000' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <LensedStars lx={540} ly={1050} tE={460} o={1} />
            <Gargantua id="den" x={540} y={1050} rs={lerp(200, 270, EASE_OUT(within(at.density, 0, 1)))} f={f} />
            <g opacity={EASE_OUT(within(at.density, 0.45, 0.65))}>
              <Sun x={900} y={560} r={34} />
              <text x={900} y={640} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={28} fill="#ffd38a">OUR SUN</text>
            </g>
          </svg>
          <div style={{ position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#ffb199' }}>THE BIGGEST BLACK HOLES</div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 76, color: '#fff', textShadow: '0 6px 30px #000', lineHeight: 1.05 }}>
              LESS DENSE<br />THAN THE SUN</div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 30, color: '#9fc8ea', marginTop: 8 }}>ON AVERAGE, INSIDE THE EDGE</div>
          </div>
        </AbsoluteFill>
      )}

      {loopT > 0.001 && <AbsoluteFill style={{ opacity: loopT }}>{hookScene('loop', 0, 0, 20 - (END - f) * 0.6 + END * 0)}</AbsoluteFill>}

      {(() => {
        const o = Math.max(sHook, prog(f, END - 22, END - 4));
        return (
          <>
            <div style={{ position: 'absolute', top: 160, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
              fontSize: 86, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.9)', opacity: o }}>
              {hook.top}<br /><span style={{ color: ROUTE }}>{hook.bottom}</span>
            </div>
            <div style={{ position: 'absolute', top: 1410, left: 0, right: 0, textAlign: 'center', opacity: o,
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

export default BHSqueeze;
