import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import { BHShader } from '../geo/BHShader';
import { ALERT, MONO, ROUTE, SANS, lerp, rng } from '../geo/parts';
import { Flash, Scene } from '../geo/Trans';
import { Counter, Headline, LH, LW, LongFrame, LongProps, Stars, timeline } from './LongKit';

// Chapter 2 - the invisible monster: Cygnus X-1 (found by a rocket in 1964, 21 Suns,
// orbiting a blue supergiant), then the Milky Way's centre: Sagittarius A*, the
// S-stars, S2's 16-year orbit and 7,650 km/s, the 2020 Nobel Prize.
export const compositionConfig = {
  id: 'BHLFind',
  durationInSeconds: 50,
  fps: 30,
  width: 1920,
  height: 1080,
};

const kepler = (M: number, e: number, a: number) => {
  let E = M;
  for (let i = 0; i < 8; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return { x: a * (Math.cos(E) - e), y: a * Math.sqrt(1 - e * e) * Math.sin(E) };
};
const ARMS = (() => { const r = rng(26000); return Array.from({ length: 1600 }, (_, i) => { const arm = i % 4; const k = r();
  const rad = 40 + k * 460; const th = arm * (Math.PI / 2) + Math.log(rad / 40) * 2.4 + (r() - 0.5) * 0.5;
  return [Math.cos(th) * rad + (r() - 0.5) * 30, Math.sin(th) * rad + (r() - 0.5) * 30, r()]; }); })();

const BHLFind: React.FC<Partial<LongProps>> = ({ vo = [], at, durationInSeconds = 50, chapter = 2, chapterName = '' }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const { cue, within, END } = timeline(f, vo, durationInSeconds);
  const C = { x: LW / 2, y: 520 };
  const s2T = within(at.s2, 0.02, 0.6);
  const s2pos = (M: number) => { const p = kepler(M, 0.88, 300); const c = Math.cos(-0.5), s = Math.sin(-0.5);
    return { x: C.x + p.x * c - p.y * s, y: C.y + (p.x * s + p.y * c) * 0.9 }; };

  return (
    <LongFrame vo={vo} dur={durationInSeconds} chapter={chapter} name={chapterName}>
      {/* 1964: a rocket finds an X-ray source */}
      <Scene f={f} a={0} b={cue(at.companion)} kind="zoom">
        <AbsoluteFill style={{ background: `linear-gradient(#02030a 0%, #0b1736 ${lerp(70, 40, within(0, 0, 1))}%, #1a2b52 100%)` }} />
        <Stars drift={f * 0.2} o={0.8} tint="#02030a" />
        <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <radialGradient id="limb" cx="0.5" cy="0.5" r="0.5"><stop offset="0.93" stopColor="#1d4f8f" /><stop offset="0.985" stopColor="#6fb7ff" /><stop offset="1" stopColor="#6fb7ff" stopOpacity={0} /></radialGradient>
            <linearGradient id="land" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#24527a" /><stop offset="0.45" stopColor="#3c6b3a" /><stop offset="0.7" stopColor="#7a6b48" /><stop offset="1" stopColor="#24527a" /></linearGradient>
          </defs>
          <circle cx={LW / 2} cy={2500} r={1640} fill="url(#limb)" />
          <circle cx={LW / 2} cy={2500} r={1600} fill="url(#land)" opacity={0.9} />
          {(() => { const t = EASE_INOUT(within(0, 0, 0.75)); const x = lerp(900, 1180, t); const y = lerp(820, 300, t);
            return <g>
              {Array.from({ length: 14 }, (_, k) => <circle key={k} cx={lerp(900, x, k / 14)} cy={lerp(900, y + 90, k / 14)} r={10 + k * 1.5} fill="#e9edf2" opacity={0.08 + 0.02 * k} />)}
              <g transform={`translate(${x} ${y}) rotate(${lerp(0, 22, t)}) scale(2.2)`}>
                <path d={`M -14 70 L 0 ${70 + 90 + 25 * Math.sin(f)} L 14 70 Z`} fill="#ffb347" />
                <rect x={-18} y={-60} width={36} height={130} rx={8} fill="#e9edf2" stroke="#000" strokeWidth={3} />
                <path d="M -18 -60 L 0 -110 L 18 -60 Z" fill="#c94a3a" stroke="#000" strokeWidth={3} />
              </g>
            </g>; })()}
          {/* the X-ray source in Cygnus, pulsing from the start */}
          {[0, 1, 2, 3].map((k) => { const r = ((f * 1.6 + k * 40) % 160);
            return <circle key={k} cx={1500} cy={260} r={20 + r} fill="none" stroke="#c7a6ff" strokeWidth={4} opacity={0.7 * (1 - r / 160)} />; })}
          <circle cx={1500} cy={260} r={16} fill="#e7dcff" />
          <text x={1500} y={150} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={30} fill="#c7a6ff">X-RAYS</text>
        </svg>
        {within(0, 0.4, 0.5) <= 0 ? <Headline text="THE FIRST ONE WE FOUND" top={160} size={72} align="left" left={120} /> :
          <Headline text="CYGNUS X-1" sub="FOUND IN 1964, ON A ROCKET FLIGHT" top={160} size={92} align="left" left={120} o={EASE_OUT(within(0, 0.4, 0.55))} />}
      </Scene>

      {/* 21 Suns, orbiting a blue supergiant */}
      <Scene f={f} a={cue(at.companion)} b={cue(at.home)} kind="push">
        <Stars drift={f * 0.2} />
        <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
          <defs><radialGradient id="bss"><stop offset="0" stopColor="#ffffff" /><stop offset="0.45" stopColor="#9cc8ff" /><stop offset="1" stopColor="#2f6bd9" stopOpacity={0} /></radialGradient></defs>
          <circle cx={600} cy={520} r={330} fill="url(#bss)" />
          {Array.from({ length: 40 }, (_, i) => { const t = ((f / 60 + i / 40) % 1);
            const a = t * Math.PI * 1.4; const x = lerp(820, 1300, t) + Math.cos(a * 3) * 40 * (1 - t); const y = 520 + Math.sin(a * 3) * 60 * (1 - t);
            return <circle key={i} cx={x} cy={y} r={8 * (1 - t) + 2} fill="#bcd8ff" opacity={0.7 * (1 - t)} />; })}
        </svg>
        <BHShader x={1300 - 190} y={520 - 190} w={380} h={380} res={200} tilt={0.35} dist={18} round />
        <Counter value="21 SUNS" label="THE BLACK HOLE" x={1300} y={760} size={70} />
        <Counter value="BLUE SUPERGIANT" label="ITS COMPANION" x={600} y={760} size={52} color="#cfe6ff" />
      </Scene>

      {/* our own galaxy's centre */}
      <Scene f={f} a={cue(at.home)} b={cue(at.stars)} kind="zoom">
        <Stars drift={f * 0.1} />
        <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
          {(() => { const z = EASE_INOUT(within(at.home, 0.3, 1)) * (f < cue(at.sgr) ? 0.6 : 1) + (f >= cue(at.sgr) ? 0.4 * EASE_INOUT(within(at.sgr, 0, 0.4)) : 0);
            const s = lerp(1, 2.6, z);
            return <g transform={`translate(${C.x} ${C.y}) rotate(${f * 0.05}) scale(${s} ${s * 0.6})`}>
              <defs><radialGradient id="core"><stop offset="0" stopColor="#fff3d6" /><stop offset="0.4" stopColor="#ffcf8a" stopOpacity={0.6} /><stop offset="1" stopColor="#ffcf8a" stopOpacity={0} /></radialGradient></defs>
              {ARMS.map(([x, y, b], i) => <circle key={i} cx={x} cy={y} r={1 + b * 2.2} fill={b > 0.8 ? '#ffe7c4' : '#b9cfff'} opacity={0.35 + b * 0.5} />)}
              <circle r={140} fill="url(#core)" />
              {f < cue(at.sgr) && <circle cx={300 * Math.cos(2.3)} cy={300 * Math.sin(2.3)} r={9} fill={ROUTE} stroke="#000" strokeWidth={2} />}
            </g>; })()}
        </svg>
        {f < cue(at.sgr) && <Headline text="THE CENTRE OF OUR GALAXY" top={80} size={64} o={EASE_OUT(within(at.home, 0.2, 0.4))} />}
        {f >= cue(at.sgr) && <>
          <Headline text="SAGITTARIUS A*" top={70} size={84} />
          <Counter value="4 MILLION" label="TIMES THE SUN'S MASS" x={480} y={740} size={76} o={EASE_OUT(within(at.sgr, 0.3, 0.45))} />
          <Counter value="26,000" label="LIGHT-YEARS AWAY" x={1440} y={740} size={76} o={EASE_OUT(within(at.sgr, 0.6, 0.75))} />
        </>}
      </Scene>

      {/* the stars around it; S2 */}
      <Scene f={f} a={cue(at.stars)} b={cue(at.nobel)} kind="whip">
        <AbsoluteFill style={{ background: '#000' }} />
        <Stars drift={0} o={0.5} />
        <BHShader x={C.x - 150} y={C.y - 150} w={300} h={300} res={180} tilt={1.25} dist={22} round />
        <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
          {[[0.6, 220, 1.1, 0.3], [0.75, 260, 2.4, 0.8], [0.4, 190, -0.9, 0.55], [0.82, 330, 0.2, 0.1], [0.5, 380, 1.9, 0.4]].map(([e, a, rot, ph], i) => {
            const pts = Array.from({ length: 80 }, (_, k) => { const p = kepler(k / 79 * Math.PI * 2, e, a); return `${C.x + p.x * Math.cos(rot) - p.y * Math.sin(rot)},${C.y + (p.x * Math.sin(rot) + p.y * Math.cos(rot)) * 0.9}`; }).join(' ');
            const p = kepler((f / 30 * 0.25 + ph) * Math.PI * 2, e, a);
            return <g key={i}><polyline points={pts} fill="none" stroke="#7f8fb5" strokeWidth={2} opacity={0.35} />
              <circle cx={C.x + p.x * Math.cos(rot) - p.y * Math.sin(rot)} cy={C.y + (p.x * Math.sin(rot) + p.y * Math.cos(rot)) * 0.9} r={7} fill="#cfe0ff" /></g>;
          })}
          {f >= cue(at.s2) && <g>
            <polyline points={Array.from({ length: 120 }, (_, k) => { const q = s2pos(k / 119 * Math.PI * 2); return `${q.x},${q.y}`; }).join(' ')} fill="none" stroke={ROUTE} strokeWidth={4} opacity={0.6} />
            {Array.from({ length: 14 }, (_, k) => { const q = s2pos((s2T - k * 0.006) * Math.PI * 2); return <circle key={k} cx={q.x} cy={q.y} r={14 - k * 0.8} fill={ROUTE} opacity={0.9 - k * 0.06} />; })}
            {(() => { const q = s2pos(s2T * Math.PI * 2); return <text x={q.x + 26} y={q.y - 20} fontFamily={SANS} fontWeight={800} fontSize={40} fill="#fff" stroke="#000" strokeWidth={1.5}>S2</text>; })()}
          </g>}
        </svg>
        {f < cue(at.s2) && <Headline text="INVISIBLE" sub="BUT THE STARS AROUND IT AREN'T" top={70} size={84} o={EASE_OUT(within(at.stars, 0.1, 0.3))} />}
        {f >= cue(at.s2) && <>
          <Counter value={`${Math.floor(16 * s2T)} YEARS`} label="ONE ORBIT OF S2" x={330} y={180} size={72} />
          <Counter value={`${Math.round(7650 * EASE_OUT(within(at.s2, 0.55, 0.85))).toLocaleString('en-US')}`} label="KM PER SECOND AT ITS CLOSEST" x={1590} y={180} size={72}
            color={within(at.s2, 0.55, 0.6) > 0 ? '#fff' : '#555'} />
        </>}
      </Scene>
      <Flash f={f} at={Math.round(lerp(cue(at.s2), cue(at.nobel), 0.58))} len={5} />

      {/* the Nobel Prize */}
      <Scene f={f} a={cue(at.nobel)} b={cue(at.small)} kind="zoom">
        <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 50%, #3a2a08 0%, #050505 60%)' }} />
        <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
          <g transform={`translate(${C.x} ${C.y}) rotate(${6 * Math.sin(f / 10)}) scale(${lerp(0.6, 1, EASE_OUT(within(at.nobel, 0.3, 0.55)))})`}>
            {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2 + f / 40; return <line key={i} x1={0} y1={0} x2={Math.cos(a) * 700} y2={Math.sin(a) * 700} stroke="#ffd36b" strokeWidth={36} opacity={0.06} />; })}
            <circle r={250} fill="#d4a21a" stroke="#7a5a08" strokeWidth={14} />
            <circle r={205} fill="none" stroke="#f6d36b" strokeWidth={6} />
            <text y={-10} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={92} fill="#5a3f05">2020</text>
            <text y={60} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={46} fill="#5a3f05">PHYSICS</text>
          </g>
        </svg>
        <Headline text="INCREDIBLY HEAVY. INCREDIBLY SMALL." top={70} size={60} o={EASE_OUT(within(at.nobel, 0.0, 0.2))} />
        <Headline text="NOBEL PRIZE" top={880 - 100} size={70} color="#ffd36b" o={EASE_OUT(within(at.nobel, 0.5, 0.65))} />
      </Scene>

      {/* not even a big one */}
      <Scene f={f} a={cue(at.small)} b={END + 30} kind="push">
        <AbsoluteFill style={{ background: '#000' }} />
        <Stars drift={f * 0.2} o={0.6} />
        {(() => { const s = EASE_INOUT(within(at.small, 0.2, 0.9)); const size = lerp(520, 60, s);
          return <BHShader x={C.x - size / 2} y={C.y - size / 2} w={size} h={size} res={200} tilt={0.3} dist={18} round />; })()}
        <Headline text="AND IT ISN'T EVEN" sub="A BIG ONE" top={70} size={76} subColor={ALERT} />
      </Scene>
    </LongFrame>
  );
};

export default BHLFind;
