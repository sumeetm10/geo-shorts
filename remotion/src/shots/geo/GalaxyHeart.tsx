import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { BHShader } from './BHShader';
import { EndCard } from './EndCard';
import { SpaceBg } from './Globe';
import { ALERT, H, MONO, ROUTE, SANS, W, lerp, rng } from './parts';
import { Flash, Scene } from './Trans';

// =============================================================================
// "At the centre of our galaxy hides a black hole 4 million times heavier than
// the Sun." The ray-traced black hole (BHShader) in close-up; the Milky Way
// from above with the 26,000 light-year line to the centre; an empty, dark
// centre - so how do we know?; the S-stars on their orbits with S2 going round
// every 16 years (a Kepler orbit, fastest at the close pass); its 7,650 km/s
// pass; the 2020 Nobel Prize; and the camera tilting over the hole until it
// becomes the orange ring of the 2022 image (recreated in code).
// Script and sources: make_whatif.py "sgra".
// =============================================================================
export const compositionConfig = {
  id: 'GalaxyHeart',
  durationInSeconds: 35,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string; badge: string };
  at: { name: number; see: number; s2: number; speed: number; nobel: number; photo: number };
  durationInSeconds: number;
};

// position on a Kepler ellipse (focus at the origin) for mean anomaly M
const kepler = (M: number, e: number, a: number) => {
  let E = M;
  for (let i = 0; i < 8; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return { x: a * (Math.cos(E) - e), y: a * Math.sqrt(1 - e * e) * Math.sin(E) };
};

const ARMS = (() => {
  const r = rng(26000); const pts: [number, number, number][] = [];
  for (let i = 0; i < 1400; i++) {
    const arm = i % 4; const k = r();
    const rad = 40 + k * 420; const th = arm * (Math.PI / 2) + Math.log(rad / 40) * 2.4 + (r() - 0.5) * 0.5;
    pts.push([Math.cos(th) * rad + (r() - 0.5) * 30, Math.sin(th) * rad + (r() - 0.5) * 30, r()]);
  }
  return pts;
})();

const Galaxy: React.FC<{ cx: number; cy: number; rot: number; s: number }> = ({ cx, cy, rot, s }) => (
  <g transform={`translate(${cx} ${cy}) rotate(${rot}) scale(${s} ${s * 0.62})`}>
    <defs>
      <radialGradient id="gcore"><stop offset="0" stopColor="#fff3d6" /><stop offset="0.35" stopColor="#ffcf8a" stopOpacity={0.7} /><stop offset="1" stopColor="#ffcf8a" stopOpacity={0} /></radialGradient>
    </defs>
    <circle r={480} fill="#3a4b8a" opacity={0.12} />
    {ARMS.map(([x, y, b], i) => <circle key={i} cx={x} cy={y} r={1.2 + b * 2.4} fill={b > 0.8 ? '#ffe7c4' : '#b9cfff'} opacity={0.35 + b * 0.55} />)}
    <circle r={150} fill="url(#gcore)" />
  </g>
);

const GalaxyHeart: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '', badge: '' }, at, durationInSeconds = 35 }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const last = vo.length - 1;

  const hookScene = (t: number) => (
    <>
      <AbsoluteFill style={{ background: '#000' }} />
      <BHShader x={0} y={0} w={W} h={H} res={520} tilt={0.13} dist={lerp(30, 17, t)} />
    </>
  );

  // S2: one full orbit across its line, 16 years
  const e = 0.88; const A = 270; const OC = { x: 540, y: 1000 };
  const s2T = within(at.s2, 0.05, 1);
  const years = 16 * s2T;
  const s2pos = (M: number) => { const p = kepler(M, e, A); const c = Math.cos(-0.5), s = Math.sin(-0.5);
    return { x: OC.x + p.x * c - p.y * s, y: OC.y + p.x * s + p.y * c }; };
  const OTHERS = [[0.6, 220, 1.1, 0.3], [0.75, 260, 2.4, 0.8], [0.4, 180, -0.9, 0.55], [0.82, 300, 0.2, 0.1]];
  const speed = 7650 * EASE_OUT(within(at.speed, 0.05, 0.45));
  const tiltT = EASE_INOUT(within(at.photo, 0.0, 0.7));

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <Scene f={f} a={0} b={cue(at.name)} kind="zoom">{hookScene(EASE_OUT(prog(f, 0, cue(at.name) + 6)))}</Scene>

      {/* the Milky Way from above: you are here */}
      <Scene f={f} a={cue(at.name)} b={cue(at.see)} kind="zoom">
        <SpaceBg />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <Galaxy cx={540} cy={1060} rot={f * 0.06} s={lerp(1.15, 1.0, within(at.name, 0, 1))} />
          {(() => {
            const sun = { x: 540 + 300 * Math.cos(2.3), y: 1060 + 300 * 0.62 * Math.sin(2.3) };
            const d = EASE_INOUT(within(at.name, 0.35, 0.8));
            return <g>
              <line x1={sun.x} y1={sun.y} x2={lerp(sun.x, 540, d)} y2={lerp(sun.y, 1060, d)} stroke={ROUTE} strokeWidth={5} strokeDasharray="12 10" />
              <circle cx={sun.x} cy={sun.y} r={10 + 3 * Math.sin(f / 4)} fill={ROUTE} stroke="#000" strokeWidth={3} />
              <text x={sun.x - 20} y={sun.y + 54} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={34} fill="#fff" stroke="#000" strokeWidth={1.5}>YOU ARE HERE</text>
              {d > 0.95 && <circle cx={540} cy={1060} r={26 + 6 * Math.sin(f / 3)} fill="none" stroke={ALERT} strokeWidth={6} />}
            </g>;
          })()}
        </svg>
        <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 92, color: '#fff', textShadow: '0 6px 30px #000' }}>SAGITTARIUS A*</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 54, color: ROUTE, opacity: EASE_OUT(within(at.name, 0.45, 0.6)) }}>26,000 LIGHT-YEARS</div>
        </div>
      </Scene>

      {/* invisible: how do we know? */}
      <Scene f={f} a={cue(at.see)} b={cue(at.s2)} kind="push">
        <SpaceBg />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <circle cx={540} cy={1000} r={260} fill="#000" />
          <circle cx={540} cy={1000} r={260} fill="none" stroke="#ffffff" strokeWidth={3} strokeDasharray="6 12" opacity={0.4} />
          <text x={540} y={1080} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={260} fill={ROUTE} opacity={EASE_OUT(within(at.see, 0.4, 0.6))}
            transform={`rotate(${6 * Math.sin(f / 5)} 540 1000)`}>?</text>
        </svg>
        <div style={{ position: 'absolute', top: 260, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 96, color: '#fff', textShadow: '0 6px 30px #000' }}>INVISIBLE</div>
        </div>
      </Scene>

      {/* the S-stars: S2 every 16 years */}
      <Scene f={f} a={cue(at.s2)} b={cue(at.speed)} kind="zoom">
        <AbsoluteFill style={{ background: '#000' }} />
        <BHShader x={OC.x - 170} y={OC.y - 170} w={340} h={340} res={200} tilt={1.3} dist={22} round />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {OTHERS.map(([ee, aa, rot, ph], i) => {
            const pts = Array.from({ length: 80 }, (_, k) => { const p = kepler(k / 79 * Math.PI * 2, ee, aa);
              return `${OC.x + p.x * Math.cos(rot) - p.y * Math.sin(rot)},${OC.y + p.x * Math.sin(rot) + p.y * Math.cos(rot)}`; }).join(' ');
            const p = kepler((s2T * 1.6 + ph) * Math.PI * 2, ee, aa);
            return <g key={i}><polyline points={pts} fill="none" stroke="#7f8fb5" strokeWidth={2} opacity={0.4} />
              <circle cx={OC.x + p.x * Math.cos(rot) - p.y * Math.sin(rot)} cy={OC.y + p.x * Math.sin(rot) + p.y * Math.cos(rot)} r={7} fill="#cfe0ff" /></g>;
          })}
          <polyline points={Array.from({ length: 120 }, (_, k) => { const q = s2pos(k / 119 * Math.PI * 2); return `${q.x},${q.y}`; }).join(' ')} fill="none" stroke={ROUTE} strokeWidth={3} opacity={0.5} />
          {Array.from({ length: 14 }, (_, k) => { const q = s2pos((s2T - k * 0.006) * Math.PI * 2);
            return <circle key={k} cx={q.x} cy={q.y} r={13 - k * 0.8} fill={ROUTE} opacity={0.9 - k * 0.06} />; })}
          {(() => { const q = s2pos(s2T * Math.PI * 2); return <text x={q.x + 26} y={q.y - 20} fontFamily={SANS} fontWeight={800} fontSize={40} fill="#fff" stroke="#000" strokeWidth={1.5}>S2</text>; })()}
        </svg>
        <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: 5, color: '#9fd0ff' }}>ONE ORBIT OF S2</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 120, color: '#fff', textShadow: '0 6px 30px #000' }}>{Math.floor(years)} <span style={{ fontSize: 56 }}>YEARS</span></div>
        </div>
      </Scene>

      {/* the close pass: 7,650 km/s */}
      <Scene f={f} a={cue(at.speed)} b={cue(at.nobel)} kind="whip">
        <AbsoluteFill style={{ background: '#000' }} />
        <BHShader x={-180} y={760} w={760} h={760} res={300} tilt={0.5} dist={18} round />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {(() => { const t = within(at.speed, 0, 1); const a = lerp(-1.3, 1.3, EASE_INOUT(t));
            const x = 200 + Math.cos(a) * 560; const y = 1140 + Math.sin(a) * 440;
            return <g>
              {Array.from({ length: 10 }, (_, k) => { const b = a - k * 0.035; return <circle key={k} cx={200 + Math.cos(b) * 560} cy={1140 + Math.sin(b) * 440} r={34 - k * 2.6} fill={ROUTE} opacity={0.5 - k * 0.045} />; })}
              <circle cx={x} cy={y} r={52} fill="#fff6d0" opacity={0.35} />
              <circle cx={x} cy={y} r={34} fill="#fffbe8" stroke={ROUTE} strokeWidth={4} />
            </g>; })()}
        </svg>
        <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: 5, color: '#ffd38a' }}>S2 AT ITS CLOSEST</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 120, color: '#fff', textShadow: '0 6px 30px #000' }}>{Math.round(speed).toLocaleString('en-US')}</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 44, color: ROUTE }}>KM PER SECOND</div>
        </div>
        {within(at.speed, 0.5, 0.6) > 0 && (
          <div style={{ position: 'absolute', top: 1330, left: 90, right: 90 }}>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: '#fff', textAlign: 'center', marginBottom: 12 }}>ALMOST 3% OF LIGHT SPEED</div>
            <div style={{ height: 34, borderRadius: 17, border: '4px solid #fff', overflow: 'hidden', background: '#111' }}>
              <div style={{ width: `${3 * EASE_OUT(within(at.speed, 0.55, 0.8))}%`, minWidth: 14, height: '100%', background: ROUTE }} />
            </div>
          </div>
        )}
      </Scene>

      {/* the Nobel Prize */}
      <Scene f={f} a={cue(at.nobel)} b={cue(at.photo)} kind="zoom">
        <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 52%, #3a2a08 0%, #050505 60%)' }} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <g transform={`translate(540 1000) rotate(${8 * Math.sin(f / 10)}) scale(${lerp(0.6, 1, EASE_OUT(within(at.nobel, 0, 0.3)))})`}>
            {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2 + f / 40; return <line key={i} x1={0} y1={0} x2={Math.cos(a) * 520} y2={Math.sin(a) * 520} stroke="#ffd36b" strokeWidth={30} opacity={0.06} />; })}
            <circle r={250} fill="#d4a21a" stroke="#7a5a08" strokeWidth={14} />
            <circle r={205} fill="none" stroke="#f6d36b" strokeWidth={6} />
            {[-1, 1].map((d) => Array.from({ length: 7 }, (_, i) => { const a = Math.PI / 2 + d * (0.35 + i * 0.28);
              return <ellipse key={`${d}${i}`} cx={Math.cos(a) * 165} cy={Math.sin(a) * 165} rx={30} ry={13} fill="#a77d10" transform={`rotate(${a * 180 / Math.PI + 90 * d} ${Math.cos(a) * 165} ${Math.sin(a) * 165})`} />; }))}
            <text y={-10} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={92} fill="#5a3f05">2020</text>
            <text y={60} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={46} fill="#5a3f05">PHYSICS</text>
          </g>
        </svg>
        <div style={{ position: 'absolute', top: 260, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 100, color: '#ffd36b', textShadow: '0 6px 30px #000' }}>NOBEL PRIZE</div>
        </div>
      </Scene>

      {/* 2022: the picture - the camera tilts over the hole into the ring */}
      <Scene f={f} a={cue(at.photo)} b={cue(last)} kind="zoom">
        <AbsoluteFill style={{ background: '#000' }} />
        <BHShader x={0} y={260} w={W} h={1400} res={420} tilt={lerp(0.13, 1.4, tiltT)} dist={lerp(17, 21, tiltT)}
          photo={EASE_INOUT(within(at.photo, 0.45, 0.8))} blur={18 * EASE_INOUT(within(at.photo, 0.45, 0.8))} />
        {within(at.photo, 0.55, 0.7) > 0 && (
          <AbsoluteFill style={{ opacity: EASE_OUT(within(at.photo, 0.55, 0.7)) }}>
            <div style={{ position: 'absolute', left: 90, right: 90, top: 520, height: 900, border: '22px solid #f4f1ea', borderBottomWidth: 120, borderRadius: 6, boxShadow: '0 20px 60px #000' }} />
            <div style={{ position: 'absolute', top: 1318, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 52, color: '#222' }}>MAY 12, 2022</div>
          </AbsoluteFill>
        )}
        <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 84, color: '#fff', textShadow: '0 6px 30px #000' }}>THE FIRST PHOTO</div>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 28, color: '#9aa3b5', opacity: EASE_OUT(within(at.photo, 0.6, 0.75)) }}>RECREATED IN CODE</div>
        </div>
      </Scene>
      <Flash f={f} at={Math.round(lerp(cue(at.photo), lineEnd(at.photo), 0.55))} len={6} />

      <Scene f={f} a={cue(last)} b={END + 30} kind="zoom">{hookScene(0.05)}</Scene>

      {(() => {
        const o = Math.max(1 - prog(f, cue(at.name) - 6, cue(at.name) + 6), prog(f, END - 22, END - 4));
        return (
          <>
            <div style={{ position: 'absolute', top: 170, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
              fontSize: 94, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.9)', opacity: o }}>
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

export default GalaxyHeart;
