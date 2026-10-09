import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { Atlas } from './Atlas';
import { EndCard } from './EndCard';
import { GlobeView, SpaceBg } from './Globe';
import { ALERT, H, MONO, ROUTE, SANS, W, lerp } from './parts';

// =============================================================================
// Walk Shorts v2: "Can you walk from X to Y?" on the 3D globe. The globe spins
// onto the start in the first second (big hook + YES OR NO? badge); a camera
// follows Atlas - the channel's own walker: safari hat with the yellow band, red
// backpack with a rolled map - along a glowing route; a flag pops up at each
// border; km walked and days on foot (5.0 km/h, 8 h a day) count up; at a sea
// the water pulses, waves roll and Atlas splashes to a stop; then the camera
// pulls back to the opening shot so the Short loops. Data: make_walk2.py.
// =============================================================================
export const compositionConfig = {
  id: 'GlobeWalk',
  durationInSeconds: 26,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Border = { name: string; frac: number; flag: string | null };
type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string };
  origin: string; dest: string;
  path: [number, number][]; path2: [number, number][]; walkTo: number;
  borders: Border[]; km: number; days: number; walkable: boolean;
  gap: { a: [number, number]; b: [number, number]; km: number; water: string; what: string } | null;
  durationInSeconds: number;
};

const RAD = Math.PI / 180;
const proj = (lon: number, lat: number, lon0: number, lat0: number, cx: number, cy: number, R: number) => {
  const p = lat * RAD; const dl = (lon - lon0) * RAD; const s0 = Math.sin(lat0 * RAD); const c0 = Math.cos(lat0 * RAD);
  const cosc = s0 * Math.sin(p) + c0 * Math.cos(p) * Math.cos(dl);
  return { x: cx + R * Math.cos(p) * Math.sin(dl), y: cy - R * (c0 * Math.sin(p) - s0 * Math.cos(p) * Math.cos(dl)), vis: cosc > 0 };
};
const logLerp = (a: number, b: number, t: number) => Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * t);
const lonLerp = (a: number, b: number, t: number) => { let d = b - a; if (d > 180) d -= 360; if (d < -180) d += 360; return a + d * t; };

const GlobeWalk: React.FC<Partial<Props>> = (props) => {
  const f = useCurrentFrame();
  const { vo = [], hook = { top: '', bottom: '' }, path, borders = [], gap, durationInSeconds = 26 } = props;
  if (!path || path.length < 2 || props.walkTo === undefined) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const last = vo.length - 1;
  const walkTo = props.walkTo;

  // cumulative distance along the path (0..1)
  const cum = React.useMemo(() => {
    const c = [0];
    for (let i = 1; i < path.length; i++) {
      const dx = (path[i][0] - path[i - 1][0]) * Math.cos(path[i][1] * RAD); const dy = path[i][1] - path[i - 1][1];
      c.push(c[i - 1] + Math.hypot(dx, dy));
    }
    return c.map((v) => v / c[c.length - 1]);
  }, [path]);
  const at01 = (t: number): [number, number] => {
    let i = 1; while (i < cum.length - 1 && cum[i] < t) i++;
    const k = (t - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]);
    return [lonLerp(path[i - 1][0], path[i][0], k), lerp(path[i - 1][1], path[i][1], k)];
  };

  // ---- the walk: from the second line to the line that names the answer
  const walkStart = cue(1); const walkEnd = cue(walkTo);
  const p = f < walkStart ? 0 : f >= walkEnd ? 1 : EASE_INOUT(prog(f, walkStart, walkEnd));
  const [wl, wa] = at01(p);
  const atSea = !!gap && f >= walkEnd;
  const loopT = EASE_INOUT(prog(f, cue(last), END - 2));

  // ---- camera
  const o = path[0];
  const hookT = EASE_INOUT(prog(f, 0, Math.max(20, cue(1) - 4)));
  const R0 = 430; const RW = 1500;
  let lon0: number; let lat0: number; let R: number;
  if (f < walkStart) {
    lon0 = lonLerp(o[0] - 90, o[0], hookT); lat0 = lerp(10, o[1] - 6, hookT); R = logLerp(R0, RW, hookT);
  } else {
    // follow the walker, looking a little ahead
    const [ll, la] = at01(Math.min(1, p + 0.05));
    lon0 = lonLerp(wl, ll, 0.5); lat0 = lerp(wa, la, 0.5) - 6; R = RW;
    if (atSea && gap) { const t = EASE_INOUT(prog(f, walkEnd, walkEnd + 25));
      lon0 = lonLerp(lon0, (gap.a[0] + gap.b[0]) / 2, t); lat0 = lerp(lat0, (gap.a[1] + gap.b[1]) / 2 - 1.5, t); R = logLerp(RW, 4200, t); }
  }
  if (f >= cue(last)) {
    lon0 = lonLerp(lon0, o[0] - 90, loopT); lat0 = lerp(lat0, 10, loopT); R = logLerp(R, R0, loopT);
  }
  const cx = 540; const cy = 1020;
  const P = (lon: number, lat: number) => proj(lon, lat, lon0, lat0, cx, cy, R);

  // the travelled part and the part still ahead
  const pts = path.map(([lo, la]) => P(lo, la));
  const done: string[] = []; const ahead: string[] = [];
  for (let i = 0; i < path.length; i++) {
    const q = pts[i]; if (!q.vis) continue;
    (cum[i] <= p ? done : ahead).push(`${q.x},${q.y}`);
  }
  const me = P(wl, wa);
  done.push(`${me.x},${me.y}`); ahead.unshift(`${me.x},${me.y}`);
  const crossed = borders.filter((b) => b.frac <= p + 1e-6);
  const cur = crossed[crossed.length - 1];
  const popT = cur ? prog(p, cur.frac, cur.frac + 0.03) : 0;
  const kmNow = Math.round((props.km ?? 0) * p); const dayNow = Math.round((props.days ?? 0) * p);
  const answerT = prog(f, walkEnd, walkEnd + 10);
  const hookO = Math.max(1 - prog(f, cue(1) - 4, cue(1) + 6), prog(f, END - 18, END - 2));

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <SpaceBg />
      <GlobeView id="walk" cx={cx} cy={cy} R={R} lon0={lon0} lat0={lat0} />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7" /></filter>
        </defs>
        {/* the route ahead, faint; the route walked, glowing */}
        <polyline points={ahead.join(' ')} fill="none" stroke="#ffffff" strokeWidth={4} strokeDasharray="10 12" opacity={0.45} />
        <polyline points={done.join(' ')} fill="none" stroke={ROUTE} strokeWidth={22} opacity={0.55} filter="url(#routeGlow)" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={done.join(' ')} fill="none" stroke={ROUTE} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
        {/* the sea in the way */}
        {gap && atSea && (() => {
          const A = P(gap.a[0], gap.a[1]); const B = P(gap.b[0], gap.b[1]);
          const pulse = 0.5 + 0.5 * Math.sin(f / 4);
          return (
            <g>
              <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={ALERT} strokeWidth={10 + 6 * pulse} strokeDasharray="18 14" strokeLinecap="round" />
              {Array.from({ length: 7 }, (_, i) => {
                const t = (i + 1) / 8; const x = lerp(A.x, B.x, t); const y = lerp(A.y, B.y, t) + Math.sin(f / 5 + i) * 10;
                return <path key={i} d={`M ${x - 40} ${y} q 20 -18 40 0 t 40 0`} stroke="#bfe9ff" strokeWidth={5} fill="none" opacity={0.8} />;
              })}
              {Array.from({ length: 8 }, (_, i) => {
                const t = ((f * 0.05 + i / 8) % 1);
                return <circle key={`s${i}`} cx={A.x + Math.cos(i) * 40 * t} cy={A.y - 50 * t + 30 * t * t} r={6 * (1 - t)} fill="#e6f6ff" opacity={1 - t} />;
              })}
            </g>
          );
        })()}
        {/* Atlas */}
        {me.vis && (() => {
          // face the way he is heading on screen
          const [nl, na] = at01(Math.min(1, p + 0.01)); const nx = P(nl, na).x;
          const mood = f < walkStart ? 'wave' : atSea ? 'shocked' : f >= walkEnd ? 'cheer' : 'walk';
          return <Atlas x={me.x} y={me.y} s={1.7} t={f} walking={f >= walkStart && f < walkEnd ? 1 : 0} mood={mood}
            left={f >= walkStart && nx < me.x - 0.5} />;
        })()}
      </svg>

      {/* flag pop at each border */}
      {cur && f >= walkStart && !atSea && f < cue(last) && (
        <div style={{ position: 'absolute', top: 470, left: 0, right: 0, textAlign: 'center',
          transform: `scale(${0.6 + 0.4 * EASE_OUT(popT) + 0.12 * Math.sin(Math.PI * popT)})` }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 18, background: 'rgba(8,10,14,0.85)', border: `4px solid ${ROUTE}`,
            borderRadius: 20, padding: '12px 26px' }}>
            {cur.flag && <Img src={staticFile(cur.flag)} style={{ height: 64, borderRadius: 6, border: '2px solid #fff' }} />}
            <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 56, color: '#fff' }}>{cur.name}</span>
          </span>
        </div>
      )}

      {/* counters */}
      {f >= walkStart && f < cue(last) && (
        <div style={{ position: 'absolute', top: 210, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 26 }}>
          {[[`${kmNow.toLocaleString('en-US')}`, 'KM WALKED'], [`${dayNow}`, 'DAYS ON FOOT'], [`${crossed.length}`, 'COUNTRIES']].map(([v, l]) => (
            <div key={l} style={{ background: 'rgba(8,10,14,0.8)', borderRadius: 18, padding: '10px 20px', textAlign: 'center', minWidth: 230 }}>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 58, color: '#fff' }}>{v}</div>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 22, letterSpacing: 3, color: ROUTE }}>{l}</div>
            </div>
          ))}
        </div>
      )}
      {f >= walkStart && f < cue(last) && (
        <div style={{ position: 'absolute', top: 380, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 700,
          fontSize: 24, color: '#9fb3c8' }}>at 5 km/h, 8 hours a day</div>
      )}

      {/* the answer */}
      {f >= walkEnd && f < cue(last) && (
        <div style={{ position: 'absolute', top: 470, left: 0, right: 0, textAlign: 'center', opacity: answerT,
          transform: `scale(${lerp(1.6, 1, EASE_OUT(answerT))}) rotate(-4deg)` }}>
          <span style={{ display: 'inline-block', background: gap ? ALERT : '#1fa55a', color: '#fff', fontFamily: SANS, fontWeight: 800,
            fontSize: 70, padding: '10px 34px', borderRadius: 18, border: '5px solid #fff' }}>
            {gap ? `NO · ${gap.km} KM OF ${gap.what.toUpperCase()}` : `YES · ${props.dest}!`}</span>
          {gap && <div style={{ marginTop: 14, fontFamily: SANS, fontWeight: 800, fontSize: 52, color: '#bfe9ff', textShadow: '0 4px 20px #000' }}>{gap.water}</div>}
        </div>
      )}

      {/* hook */}
      <div style={{ position: 'absolute', top: 170, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
        fontSize: 104, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.95)', opacity: hookO }}>
        {hook.top}<br /><span style={{ color: ROUTE }}>{hook.bottom}</span>
      </div>
      <div style={{ position: 'absolute', top: 1400, left: 0, right: 0, textAlign: 'center', opacity: hookO,
        transform: `rotate(-3deg) scale(${1 + 0.05 * Math.sin(f / 4)})` }}>
        <span style={{ display: 'inline-block', background: '#ff2d2d', color: '#fff', fontFamily: SANS, fontWeight: 800,
          fontSize: 64, padding: '10px 30px', borderRadius: 18, border: '5px solid #fff' }}>YES OR NO?</span>
      </div>

      <EndCard from={cue(last)} to={END - 10} text="" compact />
      <Captions lines={vo} y={1600} accent={ROUTE} maxWords={3} size={58} plate />
    </AbsoluteFill>
  );
};

export default GlobeWalk;
