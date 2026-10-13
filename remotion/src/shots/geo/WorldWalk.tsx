import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { Atlas } from './Atlas';
import { EndCard } from './EndCard';
import { GlobeView, SpaceBg } from './Globe';
import { ALERT, H, MONO, ROUTE, SANS, W, lerp } from './parts';
import { PlanetShader } from './PlanetShader';
import { Flash, Scene } from './Trans';

// =============================================================================
// Atlas on other worlds (make_world.py): "Can you walk around Mars?" / "What
// would you weigh on the Moon?". The planet is PlanetShader. Around: frame 0 is
// the spinning world with Atlas on top and a dashed ring drawing round it; he
// lands, the ruler gives the width and the distance round, he bounces in the low
// gravity, a feature card, then he walks the ring while km and days count up.
// Weigh: a bathroom scale on Earth reads 70, on the world it drops; same Atlas,
// less pull; the jump. Both loop back to the opening frame.
// =============================================================================
export const compositionConfig = {
  id: 'WorldWalk',
  durationInSeconds: 30,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Props = {
  vo: VoLine[]; durationInSeconds: number; type: 'around' | 'weigh' | 'to'; world: string; look: string;
  hook: { top: string; badge: string }; at: Record<string, number>;
  nums: { diameter?: number; around?: number; days?: number; kgEarth?: number; kgThere?: number; jump?: number; ratio?: number; distance?: number; years?: string; nonstop?: string };
  extraLabel: string; gravityLabel: string;
};

const SKY: Record<string, string> = { mars: '#2a1410', moon: '#000000', mercury: '#050404', titan: '#3a2508' };

const Scale: React.FC<{ x: number; y: number; kg: number; s?: number }> = ({ x, y, kg, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-170} y={-40} width={340} height={80} rx={24} fill="#e9edf2" stroke="#000" strokeWidth={5} />
    <rect x={-90} y={-26} width={180} height={52} rx={10} fill="#0b1224" />
    <text x={0} y={16} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={40} fill="#5dff8a">{kg}</text>
    <text x={120} y={14} fontFamily={SANS} fontWeight={800} fontSize={26} fill="#333">kg</text>
  </g>
);

const WorldWalk: React.FC<Partial<Props>> = (p) => {
  const f = useCurrentFrame();
  const { vo = [], durationInSeconds = 30, type = 'around', world = 'MARS', look = 'mars', hook = { top: '', badge: '' }, at, nums = {} } = p;
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const last = vo.length - 1;
  const C = { x: 540, y: 1000 };
  const bounce = (k: number) => -Math.abs(Math.sin(f / 9)) * 70 * k;

  // trips ("walk from Earth to the Moon"): Earth bottom-left, the world top-right, a road between
  const E = { x: 280, y: 1500, R: 230 }; const T = { x: 820, y: 560, size: 760 };
  const R0 = { x: E.x + 150, y: E.y - 175 }; const R1 = { x: T.x - 120, y: T.y + 120 };
  const onRoad = (k: number) => ({ x: lerp(R0.x, R1.x, k), y: lerp(R0.y, R1.y, k) });
  const yearsNum = parseFloat(String(nums.years ?? '0').replace(/,/g, ''));
  const tripBase = (k: number, id: string) => (
    <>
      <SpaceBg />
      <GlobeView id={id} cx={E.x} cy={E.y} R={E.R} lon0={80 - f * 0.3} lat0={20} />
      <PlanetShader x={T.x} y={T.y} size={T.size} look={look} spin={0.08} res={300} />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <line x1={R0.x} y1={R0.y} x2={R1.x} y2={R1.y} stroke="#ffffff" strokeWidth={4} strokeDasharray="10 14" opacity={0.35} />
        <line x1={R0.x} y1={R0.y} x2={onRoad(k).x} y2={onRoad(k).y} stroke={ROUTE} strokeWidth={9} strokeDasharray="18 12" strokeLinecap="round" />
      </svg>
    </>
  );

  // the opening frame (also the loop's last frame): spinning world, Atlas on top, the ring drawing
  const hookScene = (t: number) => type === 'to' ? (
    <>
      {tripBase(EASE_OUT(Math.min(1, t * 1.6)), 'th')}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {(() => { const q = onRoad(0.06 * Math.min(1, t)); return <g transform={`translate(${q.x} ${q.y})`}><Atlas x={0} y={0} s={1.2} t={f} walking={1} mood="walk" /></g>; })()}
      </svg>
    </>
  ) : (
    <>
      <SpaceBg />
      <PlanetShader x={C.x} y={1080} size={2000} look={look} spin={0.08} res={400} />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {type === 'around' ? (() => { const k = EASE_OUT(Math.min(1, t)); const rx = 425, ry = 100; const C = { x: 540, y: 1080 };
          const pts = Array.from({ length: 80 }, (_, i) => { const a = Math.PI / 2 + (i / 79) * Math.PI * 2 * k; return `${C.x + Math.cos(a) * rx},${C.y + Math.sin(a) * ry}`; }).join(' ');
          return <g>
            <polyline points={pts} fill="none" stroke={ROUTE} strokeWidth={8} strokeDasharray="18 12" strokeLinecap="round" />
            <circle cx={C.x} cy={C.y + ry} r={14} fill={ROUTE} stroke="#000" strokeWidth={3} />
          </g>; })() : (
          <g transform={`rotate(${-6 + 4 * Math.sin(f / 6)} ${C.x} 1250)`}><Scale x={C.x} y={1250} kg={Math.round(lerp(70, 0, (Math.sin(f / 5) + 1) / 2)) || 0} s={1.3} /></g>
        )}
        <g transform={`translate(${C.x} ${1080 - 420 + bounce(0.4)})`}><Atlas x={0} y={0} s={1.5} t={f} walking={1} mood="walk" /></g>
      </svg>
    </>
  );

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <Scene f={f} a={0} b={cue(1)} kind="zoom">{hookScene(prog(f, 0, cue(1)))}</Scene>

      {type === 'around' ? <>
        {/* he lands */}
        <Scene f={f} a={cue(at.land)} b={cue(at.size)} kind="zoom">
          <AbsoluteFill style={{ background: `linear-gradient(#000 0%, ${SKY[look] ?? '#000'} 100%)` }} />
          <SpaceBg starsO={look === 'titan' ? 0.15 : 0.8} />
          <PlanetShader x={C.x} y={2900} size={3600} radius={0.95} ground look={look} spin={0.01} res={460} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {(() => { const t = EASE_OUT(within(at.land, 0, 0.45)); const y = lerp(300, 1180, t);
              const puff = prog(within(at.land, 0.4, 0.75), 0, 1);
              return <g>
                {t < 1 && <path d={`M ${C.x - 40} ${y - 120} L ${C.x} ${y - 260} L ${C.x + 40} ${y - 120} Z`} fill="#ffb347" opacity={0.6} />}
                {puff > 0 && puff < 1 && [-1, 1].map((d) => <ellipse key={d} cx={C.x + d * 120 * puff} cy={1195} rx={80 * puff} ry={24 * puff} fill="#c9b9a8" opacity={0.6 * (1 - puff)} />)}
                <g transform={`translate(${C.x} ${y})`}><Atlas x={0} y={0} s={2.6} t={f} walking={t < 1 ? 0 : 0.3} mood={t < 1 ? 'shocked' : 'wave'} /></g>
              </g>; })()}
          </svg>
          <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 36, letterSpacing: 6, color: ROUTE }}>WELCOME TO</div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 120, color: '#fff', textShadow: '0 6px 30px #000' }}>{world}</div>
          </div>
        </Scene>

        {/* how big: the width, then the way round */}
        <Scene f={f} a={cue(at.size)} b={cue(at.gravity)} kind="push">
          <SpaceBg />
          <PlanetShader x={C.x} y={C.y} size={2000} look={look} spin={0.08} res={400} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {(() => { const w = EASE_OUT(within(at.size, 0.05, 0.4)); const ring = EASE_INOUT(within(at.size, 0.5, 0.95));
              return <g>
                <line x1={C.x - 420 * w} y1={C.y} x2={C.x + 420 * w} y2={C.y} stroke="#fff" strokeWidth={6} />
                {w > 0.95 && [-1, 1].map((d) => <line key={d} x1={C.x + d * 420} y1={C.y - 26} x2={C.x + d * 420} y2={C.y + 26} stroke="#fff" strokeWidth={6} />)}
                <polyline points={Array.from({ length: 80 }, (_, i) => { const a = Math.PI / 2 + (i / 79) * Math.PI * 2 * ring; return `${C.x + Math.cos(a) * 425},${C.y + Math.sin(a) * 100}`; }).join(' ')}
                  fill="none" stroke={ROUTE} strokeWidth={8} strokeDasharray="18 12" />
              </g>; })()}
          </svg>
          <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 96, color: '#fff', textShadow: '0 6px 30px #000' }}>
              {Math.round((nums.diameter ?? 0) * EASE_OUT(within(at.size, 0.05, 0.4))).toLocaleString('en-US')} km</div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 36, letterSpacing: 4, color: '#cfd6e3' }}>WIDE</div>
          </div>
          {within(at.size, 0.5, 0.6) > 0 && (
            <div style={{ position: 'absolute', top: 1310, left: 0, right: 0, textAlign: 'center', transform: `scale(${lerp(1.4, 1, EASE_OUT(within(at.size, 0.5, 0.65)))})` }}>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 84, color: ROUTE, textShadow: '0 6px 30px #000' }}>{(nums.around ?? 0).toLocaleString('en-US')} km</div>
              <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 34, letterSpacing: 4, color: '#fff' }}>ALL THE WAY AROUND</div>
            </div>
          )}
        </Scene>

        {/* gravity: he bounces */}
        <Scene f={f} a={cue(at.gravity)} b={cue(at.extra)} kind="whip">
          <AbsoluteFill style={{ background: `linear-gradient(#000 0%, ${SKY[look] ?? '#000'} 100%)` }} />
          <SpaceBg starsO={look === 'titan' ? 0.15 : 0.8} />
          <PlanetShader x={C.x - (f - cue(at.gravity)) * 0.5} y={2900} size={3600} radius={0.95} ground look={look} spin={0.015} res={460} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {(() => { const hop = Math.abs(Math.sin(f / 11)); return <g>
              <ellipse cx={C.x} cy={1200} rx={80 * (1 - hop * 0.6)} ry={16} fill="#000" opacity={0.3} />
              <g transform={`translate(${C.x} ${1180 - hop * 260})`}><Atlas x={0} y={0} s={2.6} t={f} walking={1} mood="cheer" /></g>
            </g>; })()}
          </svg>
          {p.gravityLabel ? <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 36, letterSpacing: 5, color: ROUTE }}>GRAVITY</div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 80, color: '#fff', textShadow: '0 6px 30px #000' }}>{p.gravityLabel}</div>
          </div> : null}
        </Scene>

        {/* the feature card */}
        <Scene f={f} a={cue(at.extra)} b={cue(at.days)} kind="zoom">
          <AbsoluteFill style={{ background: `linear-gradient(#000 0%, ${SKY[look] ?? '#000'} 100%)` }} />
          <SpaceBg starsO={look === 'titan' ? 0.15 : 0.8} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {look === 'mars' && (() => { const k = EASE_OUT(within(at.extra, 0, 0.5)); const top = lerp(1300, 760, k);
              return <g>
                <defs><linearGradient id="olym" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#a8532e" /><stop offset="0.55" stopColor="#8a4126" /><stop offset="1" stopColor="#5a2a18" /></linearGradient></defs>
                <path d={`M -260 1330 C 60 1300 240 ${top + 140} 400 ${top + 10} L 450 ${top} L 470 ${top + 22} L 610 ${top + 22} L 630 ${top} L 680 ${top + 10} C 840 ${top + 140} 1020 1300 1340 1330 Z`} fill="url(#olym)" stroke="#3a1a0e" strokeWidth={5} />
                <ellipse cx={540} cy={top + 14} rx={86} ry={14} fill="#3a1a0e" opacity={0.7} />
                {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M ${300 + i * 90} ${top + 120 + i * 25} q 30 60 10 140`} stroke="#5a2a18" strokeWidth={4} fill="none" opacity={0.5} />)}
              </g>; })()}
            {look === 'titan' && Array.from({ length: 3 }, (_, i) => <ellipse key={i} cx={260 + i * 300} cy={1380 + (i % 2) * 60} rx={170} ry={46} fill="#2b2a3a" stroke="#c98a3a" strokeWidth={4} opacity={EASE_OUT(within(at.extra, 0.1 + i * 0.1, 0.4 + i * 0.1))} />)}
            {(look === 'moon' || look === 'mercury') && Array.from({ length: 5 }, (_, i) => <ellipse key={i} cx={140 + i * 200} cy={1360 + (i % 2) * 70} rx={90 + (i % 3) * 30} ry={26} fill="#000" opacity={0.35 * EASE_OUT(within(at.extra, 0.1, 0.5))} />)}
          </svg>
          <PlanetShader x={C.x} y={3050} size={3600} radius={0.95} ground look={look} spin={0.01} res={460} />
          <div style={{ position: 'absolute', top: 280, left: 40, right: 40, textAlign: 'center', transform: `scale(${lerp(1.3, 1, EASE_OUT(within(at.extra, 0.15, 0.4)))})`,
            opacity: EASE_OUT(within(at.extra, 0.15, 0.35)) }}>
            <span style={{ display: 'inline-block', background: 'rgba(8,10,14,0.85)', border: `5px solid ${ROUTE}`, borderRadius: 20, padding: '14px 30px',
              fontFamily: SANS, fontWeight: 800, fontSize: 60, color: '#fff' }}>{p.extraLabel}</span>
          </div>
        </Scene>

        {/* the answer: walk the ring, count it up */}
        <Scene f={f} a={cue(at.days)} b={cue(last)} kind="push">
          <SpaceBg />
          <PlanetShader x={C.x} y={C.y} size={2000} look={look} spin={0.08} res={400} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {(() => { const k = EASE_INOUT(within(at.days, 0.05, 0.75)); const rx = 425, ry = 100;
              const pts = Array.from({ length: 90 }, (_, i) => { const a = Math.PI / 2 + (i / 89) * Math.PI * 2 * k; return `${C.x + Math.cos(a) * rx},${C.y + Math.sin(a) * ry}`; }).join(' ');
              const a = Math.PI / 2 + Math.PI * 2 * k; const front = Math.sin(a) > -0.2;
              return <g>
                <ellipse cx={C.x} cy={C.y} rx={rx} ry={ry} fill="none" stroke="#ffffff" strokeWidth={3} strokeDasharray="8 12" opacity={0.4} />
                <polyline points={pts} fill="none" stroke={ROUTE} strokeWidth={10} strokeLinecap="round" />
                <g opacity={front ? 1 : 0.35} transform={`translate(${C.x + Math.cos(a) * rx} ${C.y + Math.sin(a) * ry})`}><Atlas x={0} y={0} s={1.1} t={f} walking={1} mood="walk" left={Math.cos(a + 0.01) > Math.cos(a)} /></g>
              </g>; })()}
          </svg>
          <div style={{ position: 'absolute', top: 210, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 30 }}>
            {[[`${Math.round((nums.around ?? 0) * EASE_INOUT(within(at.days, 0.05, 0.75))).toLocaleString('en-US')}`, 'KM WALKED'],
              [`${Math.round((nums.days ?? 0) * EASE_INOUT(within(at.days, 0.05, 0.75)))}`, 'DAYS ON FOOT']].map(([v, l]) => (
              <div key={l} style={{ background: 'rgba(8,10,14,0.8)', borderRadius: 18, padding: '10px 26px', textAlign: 'center', minWidth: 300 }}>
                <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 70, color: '#fff' }}>{v}</div>
                <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: ROUTE }}>{l}</div>
              </div>))}
          </div>
          {within(at.days, 0.75, 0.85) > 0 && (
            <div style={{ position: 'absolute', top: 1320, left: 0, right: 0, textAlign: 'center', transform: `rotate(-4deg) scale(${lerp(1.5, 1, EASE_OUT(within(at.days, 0.75, 0.88)))})` }}>
              <span style={{ display: 'inline-block', background: '#1fa55a', color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 74, padding: '10px 34px',
                borderRadius: 18, border: '5px solid #fff' }}>{nums.days} DAYS</span>
            </div>
          )}
          <div style={{ position: 'absolute', top: 400, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 24, color: '#9fb3c8' }}>at 5 km/h, 8 hours a day</div>
        </Scene>
        <Flash f={f} at={Math.round(lerp(cue(at.days), lineEnd(at.days), 0.75))} len={6} />
      </> : type === 'to' ? <>
        {/* a road through space */}
        <Scene f={f} a={cue(at.road)} b={cue(at.dist)} kind="zoom">
          <SpaceBg />
          <PlanetShader x={540} y={500} size={360} look={look} spin={0.08} res={240} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <defs><linearGradient id="road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1b2233" stopOpacity={0.2} /><stop offset="1" stopColor="#2c3650" /></linearGradient></defs>
            <polygon points="510,580 570,580 980,1920 100,1920" fill="url(#road)" />
            <line x1={510} y1={580} x2={100} y2={1920} stroke={ROUTE} strokeWidth={5} opacity={0.8} />
            <line x1={570} y1={580} x2={980} y2={1920} stroke={ROUTE} strokeWidth={5} opacity={0.8} />
            {Array.from({ length: 12 }, (_, i) => { const z = ((i / 12) + f / 45) % 1; const y = lerp(600, 1920, z * z); const w = lerp(3, 26, z * z);
              return <rect key={i} x={540 - w / 2} y={y} width={w} height={lerp(8, 90, z * z)} fill="#fff" opacity={0.75} />; })}
            <g transform={`translate(540 ${1330 - Math.abs(Math.sin(f / 6)) * 12})`}><Atlas x={0} y={0} s={3.0} t={f} walking={1} mood="walk" /></g>
          </svg>
          <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: 5, color: ROUTE }}>IMAGINE</div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 80, color: '#fff', textShadow: '0 6px 30px #000' }}>A ROAD IN SPACE</div>
          </div>
        </Scene>

        {/* how far */}
        <Scene f={f} a={cue(at.dist)} b={cue(at.extra)} kind="push">
          {tripBase(1, 'td')}
          <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: (nums.distance ?? 0) > 9999999 ? 84 : 104, color: '#fff', textShadow: '0 6px 30px #000' }}>
              {Math.round((nums.distance ?? 0) * EASE_OUT(within(at.dist, 0.05, 0.6))).toLocaleString('en-US')} km</div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 36, letterSpacing: 4, color: ROUTE }}>{(nums.distance ?? 0) > 9999999 ? 'AT ITS CLOSEST' : 'AWAY'}</div>
          </div>
        </Scene>

        {/* the comparison */}
        <Scene f={f} a={cue(at.extra)} b={cue(at.years)} kind="zoom">
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <defs><radialGradient id="mini"><stop offset="0" stopColor="#8fd0ff" /><stop offset="1" stopColor="#1d5fa8" /></radialGradient></defs>
            {look === 'moon' ? (() => { const n = Math.min(30, Math.floor(31 * EASE_INOUT(within(at.extra, 0.05, 0.85))));
              return <g>
                {Array.from({ length: n }, (_, i) => <circle key={i} cx={75 + i * 30} cy={1000} r={14} fill="url(#mini)" stroke="#0b2a4a" strokeWidth={2} />)}
                <circle cx={1010} cy={1000} r={4} fill="#c9c9c9" />
                <text x={1010} y={970} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={26} fill="#c9c9c9">MOON</text>
                <text x={75} y={1060} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={26} fill="#8fd0ff">EARTH</text>
                <text x={540} y={1160} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={90} fill={ROUTE}>×{n}</text>
              </g>; })() : (() => { const x0 = 120, x1 = 960; const mx = (v: number) => lerp(x0, x1, v / 110); const k = (Math.sin(f / 20) + 1) / 2;
              return <g>
                <line x1={x0} y1={1000} x2={x1} y2={1000} stroke="#cfd6e3" strokeWidth={6} />
                <circle cx={x0} cy={1000} r={22} fill="url(#mini)" />
                <text x={x0} y={1060} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={26} fill="#8fd0ff">EARTH</text>
                <rect x={mx(54)} y={984} width={mx(103) - mx(54)} height={32} rx={16} fill={ALERT} opacity={0.5 * EASE_OUT(within(at.extra, 0.1, 0.4))} />
                {[54, 103].map((v) => <g key={v}><line x1={mx(v)} y1={960} x2={mx(v)} y2={1040} stroke="#fff" strokeWidth={5} />
                  <text x={mx(v)} y={940} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={34} fill="#fff">{v}M km</text></g>)}
                <circle cx={lerp(mx(54), mx(103), k)} cy={1000} r={18} fill="#c1440e" stroke="#000" strokeWidth={3} />
              </g>; })()}
          </svg>
          <div style={{ position: 'absolute', top: 280, left: 40, right: 40, textAlign: 'center', opacity: EASE_OUT(within(at.extra, 0.0, 0.2)) }}>
            <span style={{ display: 'inline-block', background: 'rgba(8,10,14,0.85)', border: `5px solid ${ROUTE}`, borderRadius: 20, padding: '14px 30px',
              fontFamily: SANS, fontWeight: 800, fontSize: 60, color: '#fff' }}>{p.extraLabel}</span>
          </div>
        </Scene>

        {/* 8 hours a day: the years tick by */}
        <Scene f={f} a={cue(at.years)} b={cue(at.nonstop)} kind="whip">
          {(() => { const k = EASE_INOUT(within(at.years, 0.05, 0.85)); const q = onRoad(k);
            return <>
              {tripBase(k, 'ty')}
              <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
                <g transform={`translate(${q.x} ${q.y})`}><Atlas x={0} y={0} s={1.2} t={f} walking={1} mood="walk" /></g>
              </svg>
              <div style={{ position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center' }}>
                <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 120, color: '#fff', textShadow: '0 6px 30px #000' }}>{Math.round(yearsNum * k).toLocaleString('en-US')}</div>
                <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, letterSpacing: 4, color: ROUTE }}>YEARS · 8 HOURS A DAY</div>
              </div>
            </>; })()}
          {within(at.years, 0.85, 0.9) > 0 && (
            <div style={{ position: 'absolute', top: 1330, left: 0, right: 0, textAlign: 'center', transform: `rotate(-4deg) scale(${lerp(1.5, 1, EASE_OUT(within(at.years, 0.85, 0.97)))})` }}>
              <span style={{ display: 'inline-block', background: '#1fa55a', color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 74, padding: '10px 34px',
                borderRadius: 18, border: '5px solid #fff' }}>{nums.years} YEARS</span>
            </div>
          )}
        </Scene>
        <Flash f={f} at={Math.round(lerp(cue(at.years), lineEnd(at.years), 0.86))} len={6} />

        {/* non-stop: day and night */}
        <Scene f={f} a={cue(at.nonstop)} b={cue(last)} kind="zoom">
          {(() => { const day = (Math.sin(f / 4) + 1) / 2;
            return <AbsoluteFill style={{ background: `rgb(${lerp(5, 40, day)}, ${lerp(8, 70, day)}, ${lerp(20, 120, day)})` }} />; })()}
          <SpaceBg starsO={0.6} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <g transform="translate(540 1000)">
              <circle r={260} fill="#0b1224" stroke={ROUTE} strokeWidth={12} />
              {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <line key={i} x1={Math.sin(a) * 200} y1={-Math.cos(a) * 200} x2={Math.sin(a) * 235} y2={-Math.cos(a) * 235} stroke="#cfd6e3" strokeWidth={8} />; })}
              <line x1={0} y1={0} x2={Math.sin(f * 0.9) * 200} y2={-Math.cos(f * 0.9) * 200} stroke={ROUTE} strokeWidth={14} strokeLinecap="round" />
              <line x1={0} y1={0} x2={Math.sin(f * 0.075) * 130} y2={-Math.cos(f * 0.075) * 130} stroke="#fff" strokeWidth={18} strokeLinecap="round" />
              <circle r={16} fill="#fff" />
            </g>
          </svg>
          <div style={{ position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 36, letterSpacing: 5, color: ROUTE }}>NON-STOP, DAY AND NIGHT</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 120, color: '#fff', textShadow: '0 6px 30px #000' }}>{nums.nonstop}</div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 44, color: '#fff' }}>YEARS</div>
          </div>
        </Scene>
      </> : <>
        {/* weigh: 70 kg on Earth */}
        <Scene f={f} a={cue(at.earth)} b={cue(at.gravity)} kind="zoom">
          <SpaceBg />
          <GlobeView id="we" cx={C.x} cy={2350} R={1500} lon0={30 - f * 0.05} lat0={20} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <Scale x={C.x} y={1060} kg={Math.round((nums.kgEarth ?? 70) * EASE_OUT(within(at.earth, 0.1, 0.5)))} s={1.4} />
            <g transform={`translate(${C.x} ${990})`}><Atlas x={0} y={0} s={2.4} t={8} walking={0} mood="wave" /></g>
          </svg>
          <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 90, color: '#fff', textShadow: '0 6px 30px #000' }}>ON EARTH</div>
        </Scene>

        {/* the world's gravity */}
        <Scene f={f} a={cue(at.gravity)} b={cue(at.scale)} kind="whip">
          <SpaceBg />
          <PlanetShader x={C.x} y={C.y} size={2000} look={look} spin={0.08} res={400} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <rect x={140} y={1420} width={800} height={60} rx={30} fill="#111827" stroke="#fff" strokeWidth={4} />
            <rect x={146} y={1426} width={788 * (nums.ratio ?? 0.38) * EASE_OUT(within(at.gravity, 0.2, 0.7))} height={48} rx={24} fill={ROUTE} />
            <text x={940} y={1530} textAnchor="end" fontFamily={SANS} fontWeight={800} fontSize={30} fill="#cfd6e3">EARTH = FULL BAR</text>
          </svg>
          <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 36, letterSpacing: 5, color: ROUTE }}>GRAVITY ON {world}</div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 76, color: '#fff', textShadow: '0 6px 30px #000' }}>{p.gravityLabel}</div>
          </div>
        </Scene>

        {/* the scale drops; same you, less pull */}
        <Scene f={f} a={cue(at.scale)} b={cue(at.jump)} kind="zoom">
          <AbsoluteFill style={{ background: `linear-gradient(#000 0%, ${SKY[look] ?? '#000'} 100%)` }} />
          <SpaceBg starsO={0.8} />
          <PlanetShader x={C.x} y={2900} size={3600} radius={0.95} ground look={look} spin={0.01} res={460} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <Scale x={C.x} y={1110} s={1.4} kg={Math.round(lerp(nums.kgEarth ?? 70, nums.kgThere ?? 27, EASE_INOUT(within(at.scale, 0.1, 0.7))))} />
            <g transform={`translate(${C.x} ${1040})`}><Atlas x={0} y={0} s={2.4} t={8} walking={0} mood="shocked" /></g>
          </svg>
          <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 130, color: '#5dff8a', textShadow: '0 6px 30px #000' }}>
              {Math.round(lerp(nums.kgEarth ?? 70, nums.kgThere ?? 27, EASE_INOUT(within(at.scale, 0.1, 0.7))))} kg</div>
            {f >= cue(at.same) && <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 52, color: '#fff', opacity: EASE_OUT(within(at.same, 0.1, 0.3)) }}>SAME YOU. LESS PULL.</div>}
          </div>
        </Scene>

        {/* the jump */}
        <Scene f={f} a={cue(at.jump)} b={cue(last)} kind="push">
          <AbsoluteFill style={{ background: `linear-gradient(#000 0%, ${SKY[look] ?? '#000'} 100%)` }} />
          <SpaceBg starsO={0.8} />
          <PlanetShader x={C.x} y={2900} size={3600} radius={0.95} ground look={look} spin={0.01} res={460} />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {(() => { const hop = Math.abs(Math.sin(f / 16)); const top = 1180 - 120 * (nums.jump ?? 2.6);
              return <g>
                <line x1={180} y1={1180} x2={180} y2={1180 - 120} stroke="#9fd0ff" strokeWidth={10} />
                <text x={200} y={1080} fontFamily={SANS} fontWeight={800} fontSize={30} fill="#9fd0ff">EARTH</text>
                <line x1={900} y1={1180} x2={900} y2={top} stroke={ROUTE} strokeWidth={10} />
                <text x={880} y={top - 16} textAnchor="end" fontFamily={SANS} fontWeight={800} fontSize={30} fill={ROUTE}>{world}</text>
                <g transform={`translate(${C.x} ${1180 - hop * 120 * (nums.jump ?? 2.6)})`}><Atlas x={0} y={0} s={2.4} t={f} walking={0.4} mood="cheer" /></g>
              </g>; })()}
          </svg>
          <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 120, color: ROUTE, textShadow: '0 6px 30px #000' }}>×{nums.jump}</div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 44, color: '#fff' }}>HIGHER JUMPS</div>
          </div>
        </Scene>
      </>}

      <Scene f={f} a={cue(last)} b={END + 30} kind="zoom">{hookScene(0.05)}</Scene>

      {(() => {
        const o = Math.max(1 - prog(f, cue(1) - 6, cue(1) + 6), prog(f, END - 20, END - 4));
        return <>
          <div style={{ position: 'absolute', top: 150, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
            fontSize: hook.top.length > 16 ? 84 : 96, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.95)', opacity: o }}>
            {hook.top.split(' ').slice(0, -1).join(' ')}<br /><span style={{ color: ROUTE }}>{hook.top.split(' ').slice(-1)[0]}</span>
          </div>
          <div style={{ position: 'absolute', top: 1420, left: 0, right: 0, textAlign: 'center', opacity: o, transform: `rotate(-3deg) scale(${1 + 0.05 * Math.sin(f / 4)})` }}>
            <span style={{ display: 'inline-block', background: ALERT, color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 52,
              padding: '10px 28px', borderRadius: 18, border: '5px solid #fff' }}>{hook.badge}</span>
          </div>
        </>;
      })()}

      <EndCard from={cue(last)} to={END - 10} text="" compact />
      <Captions lines={vo} y={1600} accent={ROUTE} maxWords={3} size={58} plate />
    </AbsoluteFill>
  );
};

export default WorldWalk;
