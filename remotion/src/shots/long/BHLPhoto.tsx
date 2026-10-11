import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import { Atlas } from '../geo/Atlas';
import { BHShader } from '../geo/BHShader';
import { ALERT, MONO, ROUTE, SANS, lerp } from '../geo/parts';
import { Flash, Scene } from '../geo/Trans';
import { Counter, GlobeAt, Headline, LH, LW, LongFrame, LongProps, Stars, timeline } from './LongKit';

// Chapter 5 - we heard them, then saw them: a century of nobody seeing one;
// 14 Sep 2015, the first gravitational waves (36 + 29 Suns -> 62, three Suns of
// mass into the ripple); 10 Apr 2019, the first image (M87, 53 million ly) by a
// planet-sized telescope; 2022, Sagittarius A*. The images are our recreations.
export const compositionConfig = {
  id: 'BHLPhoto',
  durationInSeconds: 59,
  fps: 30,
  width: 1920,
  height: 1080,
};

const RAD = Math.PI / 180;
const proj = (lon: number, lat: number, lon0: number, lat0: number, cx: number, cy: number, R: number) => {
  const p = lat * RAD; const dl = (lon - lon0) * RAD; const s0 = Math.sin(lat0 * RAD); const c0 = Math.cos(lat0 * RAD);
  return { x: cx + R * Math.cos(p) * Math.sin(dl), y: cy - R * (c0 * Math.sin(p) - s0 * Math.cos(p) * Math.cos(dl)),
    vis: s0 * Math.sin(p) + c0 * Math.cos(p) * Math.cos(dl) > 0 };
};
// a few of the radio observatories that have taken part (illustrative positions)
const SITES: [number, number][] = [[-155.5, 19.8], [-109.9, 32.7], [-97.3, 19.0], [-67.8, -23.0], [-3.4, 37.1], [-68.7, 76.5], [0, -89]];

const Polaroid: React.FC<{ x: number; y: number; w: number; label: string; t: number; rot: number }> = ({ x, y, w, label, t, rot }) => (
  <div style={{ position: 'absolute', left: x - w / 2, top: y, width: w, opacity: EASE_OUT(Math.min(1, t * 2)),
    transform: `rotate(${rot}deg) scale(${lerp(1.3, 1, EASE_OUT(Math.min(1, t * 2)))})`, background: '#f4f1ea', padding: '18px 18px 70px', borderRadius: 6, boxShadow: '0 24px 60px #000' }}>
    <div style={{ position: 'relative', width: w - 36, height: w - 36, background: '#000', overflow: 'hidden' }}>
      <BHShader x={0} y={0} w={w - 36} h={w - 36} res={200} tilt={1.4} dist={21} photo={1} blur={10} />
    </div>
    <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 30, color: '#222' }}>{label}</div>
  </div>
);

const BHLPhoto: React.FC<Partial<LongProps>> = ({ vo = [], at, durationInSeconds = 59, chapter = 5, chapterName = '' }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const { cue, within, END } = timeline(f, vo, durationInSeconds);
  const C = { x: LW / 2, y: 520 };

  return (
    <LongFrame vo={vo} dur={durationInSeconds} chapter={chapter} name={chapterName}>
      {/* a century, unseen */}
      <Scene f={f} a={0} b={cue(at.ripple)} kind="zoom">
        <Stars drift={f * 0.2} />
        <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
          <line x1={200} y1={560} x2={1720} y2={560} stroke="#cfd6e3" strokeWidth={6} />
          {(() => { const t = EASE_INOUT(within(0, 0.1, 0.95)); return <g>
            <line x1={200} y1={560} x2={lerp(200, 1720, t)} y2={560} stroke={ROUTE} strokeWidth={8} />
            <circle cx={lerp(200, 1720, t)} cy={560} r={14} fill={ROUTE} />
          </g>; })()}
          <text x={200} y={630} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={40} fill="#fff">1916</text>
          <text x={1720} y={630} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={40} fill={ALERT}>?</text>
        </svg>
        <Counter value={`${Math.round(lerp(1916, 2015, EASE_INOUT(within(0, 0.1, 0.95))))}`} label="NOBODY HAS EVER SEEN ONE" x={C.x} y={260} size={110} />
      </Scene>

      {/* 14 Sep 2015: a ripple */}
      <Scene f={f} a={cue(at.ripple)} b={cue(at.merge)} kind="push">
        <AbsoluteFill style={{ background: 'linear-gradient(#0b1428, #04060c)' }} />
        <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
          {(() => { const w = Math.sin(f / 2.2) * 14 * EASE_OUT(within(at.ripple, 0.3, 0.6)) * (1 - prog(f, cue(at.merge) - 20, cue(at.merge)));
            return <g transform="translate(760 840) scale(0.8)">
              <rect x={-30} y={-30} width={60} height={60} fill="#cfd6e3" stroke="#000" strokeWidth={3} />
              <rect x={30} y={-12} width={720 + w} height={24} fill="#8a93a6" />
              <rect x={-12} y={-30 - 520 - w} width={24} height={520 + w} fill="#8a93a6" />
              <circle cx={760 + w} cy={0} r={22} fill="#cfd6e3" /><circle cx={0} cy={-560 - w} r={22} fill="#cfd6e3" />
            </g>; })()}
          {Array.from({ length: 6 }, (_, k) => { const r = ((f * 6 + k * 120) % 720);
            return <circle key={k} cx={1500} cy={300} r={r} fill="none" stroke="#9fd0ff" strokeWidth={3} opacity={0.5 * (1 - r / 720)} />; })}
        </svg>
        <Headline text="14 SEPTEMBER 2015" sub="A TINY RIPPLE IN SPACE ITSELF" top={70} size={80} align="left" left={120} />
      </Scene>

      {/* two black holes merge */}
      <Scene f={f} a={cue(at.merge)} b={cue(at.later)} kind="zoom">
        <Stars drift={f * 0.15} />
        <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
          {(() => {
            const t = EASE_INOUT(within(at.merge, 0, 0.85)); const done = f >= cue(at.three);
            const r = lerp(360, 0, t); const a = Math.pow(t, 1.5) * 26;
            const A = { x: C.x + Math.cos(a) * r * 29 / 65, y: C.y + Math.sin(a) * r * 0.45 * 29 / 65 };
            const B = { x: C.x - Math.cos(a) * r * 36 / 65, y: C.y - Math.sin(a) * r * 0.45 * 36 / 65 };
            return <g>
              {Array.from({ length: 7 }, (_, k) => { const rr = ((f * (4 + 10 * t) + k * 110) % 800);
                return <ellipse key={k} cx={C.x} cy={C.y} rx={rr} ry={rr * 0.45} fill="none" stroke="#9fd0ff" strokeWidth={3} opacity={0.45 * (1 - rr / 800)} />; })}
              {!done && t < 1 && <>
                <circle cx={A.x} cy={A.y} r={52} fill="#000" stroke="#ffb46b" strokeWidth={5} />
                <circle cx={B.x} cy={B.y} r={60} fill="#000" stroke="#ffb46b" strokeWidth={5} />
                <text x={A.x} y={A.y - 76} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={36} fill="#fff">29</text>
                <text x={B.x} y={B.y - 84} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={36} fill="#fff">36</text>
              </>}
              {(t >= 1 || done) && <circle cx={C.x} cy={C.y} r={80} fill="#000" stroke="#ffb46b" strokeWidth={6} />}
            </g>;
          })()}
        </svg>
        {f < cue(at.three) ? <Headline text="TWO BLACK HOLES" sub="36 AND 29 TIMES THE SUN" top={70} size={76} /> : (
          <div style={{ position: 'absolute', top: 70, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 92, color: '#fff' }}>
            36 + 29 → <span style={{ color: ROUTE }}>62</span>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 48, color: '#9fd0ff', opacity: EASE_OUT(within(at.three, 0.45, 0.65)) }}>3 SUNS OF MASS BECAME THE RIPPLE</div>
          </div>
        )}
      </Scene>
      <Flash f={f} at={Math.round(lerp(cue(at.merge), cue(at.three), 0.85))} len={7} color="#d8ecff" />

      {/* heard before seen */}
      <Scene f={f} a={cue(at.later)} b={cue(at.image)} kind="whip">
        <AbsoluteFill style={{ background: '#05070d' }} />
        <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
          <polyline fill="none" stroke={ROUTE} strokeWidth={5} points={Array.from({ length: 400 }, (_, i) => { const x = i / 399; const k = Math.pow(x, 3);
            return `${160 + x * 1600},${540 + Math.sin(x * 40 + k * 120) * 30 * (0.3 + 3 * k) * (x < 0.97 ? 1 : 0.2) * EASE_OUT(within(at.later, 0, 0.5))}`; }).join(' ')} />
        </svg>
        <Headline text="WE HEARD THEM" sub="BEFORE WE SAW THEM" top={110} size={84} />
      </Scene>

      {/* 10 April 2019 */}
      <Scene f={f} a={cue(at.image)} b={cue(at.eht)} kind="zoom">
        <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 50%, #1a1208 0%, #030303 70%)' }} />
        <Polaroid x={1240} y={130} w={600} label="M87* · 10 APRIL 2019" t={within(at.image, 0.05, 0.6)} rot={3} />
        <Headline text="THE FIRST IMAGE" sub="OF A BLACK HOLE" top={260} size={84} align="left" left={140} />
        <div style={{ position: 'absolute', left: 140, top: 560, fontFamily: SANS, fontWeight: 800, fontSize: 40, color: '#cfd6e3', opacity: EASE_OUT(within(at.image, 0.55, 0.75)) }}>
          53 MILLION LIGHT-YEARS AWAY</div>
        <div style={{ position: 'absolute', left: 140, top: 630, fontFamily: SANS, fontWeight: 700, fontSize: 26, color: '#7d8799' }}>recreated in code</div>
      </Scene>
      <Flash f={f} at={cue(at.image)} len={8} />

      {/* a telescope the size of the Earth */}
      <Scene f={f} a={cue(at.eht)} b={cue(at.sgr)} kind="push">
        <Stars drift={f * 0.15} />
        {(() => { const lon0 = -70 + f * 0.25; const lat0 = 15; const R = 380;
          const pts = SITES.map(([lo, la]) => proj(lo, la, lon0, lat0, C.x, C.y, R));
          const link = EASE_OUT(within(at.eht, 0.45, 0.8));
          return <>
            <GlobeAt x={C.x} y={C.y} R={R} lon0={lon0} lat0={lat0} id="eht" />
            <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
              {pts.map((p, i) => p.vis && pts.slice(i + 1).map((q, j) => q.vis && <line key={`${i}-${j}`} x1={p.x} y1={p.y} x2={lerp(p.x, q.x, link)} y2={lerp(p.y, q.y, link)} stroke={ROUTE} strokeWidth={2.5} opacity={0.7} />))}
              {pts.map((p, i) => p.vis && <g key={i} transform={`translate(${p.x} ${p.y})`}>
                <path d="M -16 -4 Q 0 14 16 -4 Z" fill="#e9edf2" stroke="#000" strokeWidth={2} /><line x1={0} y1={6} x2={0} y2={18} stroke="#e9edf2" strokeWidth={3} />
              </g>)}
            </svg>
          </>; })()}
        <Headline text="A TELESCOPE AS BIG AS THE EARTH" top={60} size={64} />
      </Scene>

      {/* 2022: Sagittarius A* */}
      <Scene f={f} a={cue(at.sgr)} b={cue(at.fall)} kind="zoom">
        <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 50%, #1a1208 0%, #030303 70%)' }} />
        <Polaroid x={640} y={150} w={520} label="M87* · 2019" t={1} rot={-4} />
        <Polaroid x={1280} y={170} w={520} label="SAGITTARIUS A* · 2022" t={within(at.sgr, 0.1, 0.6)} rot={4} />
        <div style={{ position: 'absolute', right: 60, bottom: 180, fontFamily: SANS, fontWeight: 700, fontSize: 24, color: '#7d8799' }}>both recreated in code</div>
      </Scene>

      {/* what happens if you fall in? */}
      <Scene f={f} a={cue(at.fall)} b={END + 30} kind="zoom">
        <AbsoluteFill style={{ background: '#000' }} />
        <BHShader x={0} y={0} w={LW} h={LH} res={340} tilt={0.13} dist={20} />
        <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0 }}>
          <g transform={`translate(${lerp(300, 420, within(at.fall, 0, 1))} 700) rotate(-8)`}><Atlas x={0} y={0} s={2.2} t={f * 0.4} walking={0.5} mood="shocked" /></g>
        </svg>
        <Headline text="SO... WHAT IF" sub="YOU FALL IN?" top={70} size={92} o={EASE_OUT(within(at.fall, 0.3, 0.5))} />
      </Scene>
    </LongFrame>
  );
};

export default BHLPhoto;
