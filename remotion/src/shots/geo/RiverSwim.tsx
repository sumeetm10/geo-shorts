import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { Card } from './BlackHole';
import { EndCard } from './EndCard';
import { GlobeView, SpaceBg } from './Globe';
import { ALERT, H, MONO, Pin, ROUTE, SANS, W, lerp } from './parts';

// =============================================================================
// River journeys: "Could you swim <river> to the sea?" The globe turns and dives
// onto the river (Natural Earth line from rivers.py, drawn to scale on the 3D
// globe); the river flows source -> sea with its length counting up; its world
// rank; a landmark on it (here the Three Gorges Dam, with a drawn dam); a real
// swimmer's journey animated along it; the days counted; the whole river at that
// pace; and the finish. Script and sources: make_whatif.py "yangtze".
// =============================================================================
export const compositionConfig = {
  id: 'RiverSwim',
  durationInSeconds: 40,
  fps: 30,
  width: 1080,
  height: 1920,
};

type P = { name: string; lon: number; lat: number };
type River = {
  name: string; length: number; swum: number; line: [number, number][]; source: string; mouth: string;
  dam: P; finish: P; view: { lon: number; lat: number };
};
type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string; badge: string };
  at: { length: number; third: number; dam: number; strel: number; days: number; whole: number; finish: number };
  river: River;
  durationInSeconds: number;
};

const RAD = Math.PI / 180;
const proj = (lon: number, lat: number, lon0: number, lat0: number, cx: number, cy: number, R: number) => {
  const p = lat * RAD; const dl = (lon - lon0) * RAD; const s0 = Math.sin(lat0 * RAD); const c0 = Math.cos(lat0 * RAD);
  return { x: cx + R * Math.cos(p) * Math.sin(dl), y: cy - R * (c0 * Math.sin(p) - s0 * Math.cos(p) * Math.cos(dl)) };
};
const logLerp = (a: number, b: number, t: number) => Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * t);

const Swimmer: React.FC<{ x: number; y: number; f: number; s?: number }> = ({ x, y, f, s = 1 }) => {
  const a = Math.sin(f / 4);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx={0} cy={0} r={34} fill="#bfe6ff" opacity={0.35 + 0.15 * Math.sin(f / 3)} />
      <path d={`M -26 ${8} Q 0 ${-6 + a * 4} 26 ${8}`} stroke="#e6f6ff" strokeWidth={4} fill="none" opacity={0.8} />
      <circle cx={0} cy={-6} r={11} fill="#ff6b3d" />
      <path d={`M -4 0 Q ${-22} ${-24 * a} ${-30} ${-6 - 16 * a}`} stroke="#ffd2b0" strokeWidth={7} strokeLinecap="round" fill="none" />
      <path d={`M 4 0 Q ${22} ${24 * a} ${30} ${-6 + 16 * a}`} stroke="#ffd2b0" strokeWidth={7} strokeLinecap="round" fill="none" />
    </g>
  );
};

const RiverSwim: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '', badge: '' }, at, river, durationInSeconds = 40 }) => {
  const f = useCurrentFrame();
  if (!at || !river) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const last = vo.length - 1;
  const line = river.line;

  // cumulative distance along the drawn line, 0..1
  const cum = React.useMemo(() => {
    const c = [0];
    for (let i = 1; i < line.length; i++) c.push(c[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], (line[i][1] - line[i - 1][1])));
    return c.map((v) => v / c[c.length - 1]);
  }, [line]);
  const at01 = (t: number) => {
    let i = 1; while (i < cum.length - 1 && cum[i] < t) i++;
    const k = (t - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]);
    return [lerp(line[i - 1][0], line[i][0], k), lerp(line[i - 1][1], line[i][1], k)] as [number, number];
  };

  // ---- camera: the globe dives in during the hook, then holds over the river; zooms to the finish at the end
  const dive = EASE_INOUT(within(0, 0.05, 0.85));
  const RMAP = 2300;
  let lon0 = lerp(river.view.lon - 70, river.view.lon, dive); let lat0 = lerp(10, river.view.lat, dive);
  let R = logLerp(420, RMAP, dive); let cy = lerp(1050, 950, dive);
  const toFinish = f >= cue(at.finish) && f < cue(last) ? EASE_INOUT(within(at.finish, 0, 0.8)) : 0;
  if (toFinish > 0) {
    lon0 = lerp(river.view.lon, river.finish.lon - 1.5, toFinish); lat0 = lerp(river.view.lat, river.finish.lat, toFinish);
    R = logLerp(RMAP, RMAP * 2.1, toFinish);
  }
  const loopT = EASE_INOUT(prog(f, cue(last), END - 4));
  if (f >= cue(last)) { lon0 = lerp(river.finish.lon - 1.5, river.view.lon - 70, loopT); lat0 = lerp(river.finish.lat, 10, loopT);
    R = logLerp(RMAP * 2.1, 420, loopT); cy = lerp(950, 1050, loopT); }
  const P = (lon: number, lat: number) => proj(lon, lat, lon0, lat0, 540, cy, R);

  // ---- how much river is drawn, and where the swimmer is
  const drawn = f < cue(at.length) ? 0.06 * prog(dive, 0.85, 1) : Math.max(0.06, EASE_INOUT(within(at.length, 0.05, 0.85)));
  const startS = 1 - river.swum / river.length;                     // the swim ended at the sea
  const swim = f < cue(at.strel) ? -1 : f < cue(at.finish) ? lerp(startS, 1, EASE_INOUT(within(at.strel, 0.1, 1) * 0.6 +
    (f >= cue(at.days) ? 0.4 * within(at.days, 0, 1) : 0) + (f >= cue(at.whole) ? 0 : 0))) : 1;
  const swimT = f >= cue(at.whole) ? 1 : swim;
  const km = Math.round(river.length * drawn);
  const pts = line.map(([lo, la]) => P(lo, la));
  const upto = (t: number) => {
    const out: string[] = [];
    for (let i = 0; i < line.length; i++) {
      if (cum[i] > t) { const [lo, la] = at01(t); const q = P(lo, la); out.push(`${q.x},${q.y}`); break; }
      out.push(`${pts[i].x},${pts[i].y}`);
    }
    return out.join(' ');
  };
  const between = (a: number, b: number) => {
    const out: string[] = [];
    const [lo0, la0] = at01(a); const q0 = P(lo0, la0); out.push(`${q0.x},${q0.y}`);
    for (let i = 0; i < line.length; i++) if (cum[i] > a && cum[i] < b) out.push(`${pts[i].x},${pts[i].y}`);
    const [lo1, la1] = at01(b); const q1 = P(lo1, la1); out.push(`${q1.x},${q1.y}`);
    return out.join(' ');
  };
  const src = P(line[0][0], line[0][1]); const mouth = P(line[line.length - 1][0], line[line.length - 1][1]);
  const dam = P(river.dam.lon, river.dam.lat); const fin = P(river.finish.lon, river.finish.lat);
  const sw = swimT >= 0 ? (() => { const [lo, la] = at01(Math.max(0, Math.min(1, swimT))); return P(lo, la); })() : null;

  // ---- overlays
  const sThird = f >= cue(at.third) && f < cue(at.dam) ? EASE_OUT(within(at.third, 0, 0.3)) * (1 - prog(f, cue(at.dam) - 8, cue(at.dam))) : 0;
  const sDam = f >= cue(at.dam) && f < cue(at.strel) ? EASE_OUT(within(at.dam, 0.1, 0.35)) * (1 - prog(f, cue(at.strel) - 8, cue(at.strel))) : 0;
  const day = Math.round(40 * EASE_INOUT(within(at.days, 0.05, 0.9)));
  const wholeDays = Math.round(62 * EASE_INOUT(within(at.whole, 0.05, 0.8)));
  const hookO = Math.max(1 - prog(f, cue(at.length) - 6, cue(at.length) + 8), prog(f, END - 22, END - 4));

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <SpaceBg />
      <GlobeView id="river" cx={540} cy={cy} R={R} lon0={lon0} lat0={lat0} />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <filter id="riverGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>
        {/* the river: glow + core, drawn up to `drawn` */}
        {drawn > 0 && (
          <g opacity={Math.min(1, R / 1500)}>
            <polyline points={upto(drawn)} fill="none" stroke="#4fc3ff" strokeWidth={22} strokeLinejoin="round" strokeLinecap="round"
              filter="url(#riverGlow)" opacity={0.7} />
            <polyline points={upto(drawn)} fill="none" stroke="#bfe9ff" strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
          </g>
        )}
        {/* the swum part */}
        {swimT >= 0 && <polyline points={between(startS, Math.max(startS + 0.001, swimT))} fill="none" stroke={ROUTE} strokeWidth={9}
          strokeLinejoin="round" strokeLinecap="round" />}
        {sw && <Swimmer x={sw.x} y={sw.y} f={f} s={1.1} />}
        {/* ends */}
        {f >= cue(at.length) && f < cue(at.strel) && (
          <g fontFamily={SANS} fontWeight={800} fontSize={30}>
            <circle cx={src.x} cy={src.y} r={10} fill="#fff" />
            <text x={src.x + 10} y={src.y - 26} fill="#fff" opacity={EASE_OUT(within(at.length, 0.05, 0.25))}>{river.source}</text>
            <circle cx={mouth.x} cy={mouth.y} r={10} fill="#4fc3ff" opacity={prog(drawn, 0.97, 1)} />
            <text x={mouth.x - 10} y={mouth.y + 50} textAnchor="end" fill="#9fe0ff" opacity={prog(drawn, 0.97, 1)}>{river.mouth}</text>
          </g>
        )}
      </svg>
      {f >= cue(at.dam) && f < cue(at.strel) && <Pin p={dam} o={sDam} label={river.dam.name} color={ALERT} />}
      {f >= cue(at.finish) && f < cue(last) && <Pin p={fin} o={EASE_OUT(within(at.finish, 0.5, 0.8))} label={`FINISH: ${river.finish.name}`} color={ROUTE} />}

      {/* the third-longest: a medal */}
      {sThird > 0 && (
        <AbsoluteFill style={{ background: `rgba(0,0,0,${0.55 * sThird})` }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: sThird }}>
            <path d="M 470 640 L 430 480 L 500 480 L 540 600 L 580 480 L 650 480 L 610 640 Z" fill="#c0392b" />
            <circle cx={540} cy={800} r={170} fill="#cd7f32" stroke="#f0b27a" strokeWidth={14} />
            <circle cx={540} cy={800} r={130} fill="none" stroke="#8a5420" strokeWidth={5} />
            <text x={540} y={850} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={150} fill="#fff4e0">3</text>
          </svg>
          <Card top="3RD-LONGEST RIVER" sub="on the whole planet" color="#cd7f32" y={1050} o={sThird} />
        </AbsoluteFill>
      )}

      {/* the dam, drawn */}
      {sDam > 0 && (
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: sDam }}>
          <g transform="translate(140 1080)">
            <rect x={0} y={0} width={800} height={300} rx={24} fill="rgba(6,10,18,0.9)" stroke={ALERT} strokeWidth={4} />
            <rect x={30} y={70} width={250} height={180} fill="#1f6fae" />
            <path d={`M 30 ${80 + Math.sin(f / 6) * 3} Q 150 ${70 + Math.sin(f / 5) * 4} 280 ${80 + Math.sin(f / 7) * 3} L 280 250 L 30 250 Z`} fill="#2a86cc" />
            <path d="M 280 60 L 330 60 L 380 250 L 280 250 Z" fill="#b8bec7" />
            {Array.from({ length: 6 }, (_, i) => (
              <rect key={i} x={300 + i * 4} y={80 + i * 26} width={30} height={14} fill="#dfe6ee" opacity={0.6} />
            ))}
            {Array.from({ length: 10 }, (_, i) => {
              const t = ((f * 0.04 + i / 10) % 1);
              return <circle key={i} cx={390 + t * 380} cy={238 - Math.sin(t * 3) * 6} r={6} fill="#bfe9ff" opacity={1 - t} />;
            })}
            <rect x={380} y={238} width={400} height={12} fill="#2a86cc" />
            <text x={560} y={120} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={34} fill="#fff">WORLD'S BIGGEST</text>
            <text x={560} y={164} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={34} fill={ROUTE}>HYDROPOWER STATION</text>
          </g>
        </svg>
      )}

      {/* counters, on a dark fade so they read over snow */}
      <AbsoluteFill style={{ background: 'linear-gradient(rgba(0,0,0,0.65) 0px, rgba(0,0,0,0) 460px)' }} />
      <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center' }}>
        {f >= cue(at.length) && f < cue(at.third) && (
          <>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#9fe0ff' }}>THE {river.name}</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 130, color: '#fff', textShadow: '0 6px 30px #000' }}>
              {km.toLocaleString('en-US')} km</div>
          </>
        )}
        {f >= cue(at.strel) && f < cue(at.days) && (
          <>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#ffd38a' }}>2004 · MARTIN STREL SWAM</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 130, color: '#fff', textShadow: '0 6px 30px #000' }}>
              {Math.round(river.swum * EASE_INOUT(within(at.strel, 0.1, 1))).toLocaleString('en-US')} km</div>
          </>
        )}
        {f >= cue(at.days) && f < cue(at.whole) && (
          <>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#ffd38a' }}>DAY</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 150, color: '#fff', textShadow: '0 6px 30px #000' }}>{day} / 40</div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 44, color: ROUTE }}>≈ 100 KM A DAY</div>
          </>
        )}
        {f >= cue(at.whole) && f < cue(at.finish) && (
          <>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#9fe0ff' }}>THE WHOLE RIVER, AT HIS PACE</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 150, color: '#fff', textShadow: '0 6px 30px #000' }}>≈ {wholeDays} DAYS</div>
          </>
        )}
      </div>

      {/* thumbnail-style title + badge on the hook and the last frames */}
      <div style={{ position: 'absolute', top: 160, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
        fontSize: 90, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.9)', opacity: hookO }}>
        {hook.top}<br /><span style={{ color: '#4fc3ff', fontSize: 74 }}>{hook.bottom}</span>
      </div>
      <div style={{ position: 'absolute', top: 1420, left: 0, right: 0, textAlign: 'center', opacity: hookO,
        transform: `rotate(-3deg) scale(${1 + 0.04 * Math.sin(f / 5)})` }}>
        <span style={{ display: 'inline-block', background: '#ff2d2d', color: '#fff', fontFamily: SANS, fontWeight: 800,
          fontSize: 62, padding: '10px 30px', borderRadius: 18, border: '5px solid #fff' }}>{hook.badge}</span>
      </div>

      <EndCard from={cue(last)} to={END - 14} text="" compact />
      <Captions lines={vo} y={1600} accent={ROUTE} maxWords={3} size={58} plate />
    </AbsoluteFill>
  );
};

export default RiverSwim;
