import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { EndCard } from './EndCard';
import { GlobeView, SpaceBg } from './Globe';
import { ALERT, H, MONO, Pin, ROUTE, SANS, W, lerp, rng } from './parts';
import { Flash } from './Trans';

// =============================================================================
// River story (the Amazon swim): the globe dives onto the river; the river
// fills with flowing water ("#1 by water"); a bridge icon struck out ("0
// bridges"); a swimmer sets off from his real start town and swims to the sea
// with km + days counting; a school of piranhas and the blood drops; the finish
// pin; and the per-day average. Overlays punch in (zoom) instead of fading.
// Script and sources: make_whatif.py "amazon".
// =============================================================================
export const compositionConfig = {
  id: 'RiverStory',
  durationInSeconds: 30,
  fps: 30,
  width: 1080,
  height: 1920,
};

type P = { name: string; lon: number; lat: number };
type River = { name: string; line: [number, number][]; start: P; finish: P; swimmer: string; year: number; km: number; days: number;
  view: { lon: number; lat: number } };
type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string; badge: string };
  at: { water: number; bridge: number; swim: number; piranha: number; months: number; perday: number };
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
      <circle r={36} fill="#bfe6ff" opacity={0.3 + 0.15 * Math.sin(f / 3)} />
      <path d={`M -28 8 Q 0 ${-6 + a * 4} 28 8`} stroke="#e6f6ff" strokeWidth={4} fill="none" />
      <circle cx={0} cy={-6} r={11} fill="#ff6b3d" stroke="#000" strokeWidth={1.5} />
      <path d={`M -4 0 Q -22 ${-24 * a} -30 ${-6 - 16 * a}`} stroke="#ffd2b0" strokeWidth={7} strokeLinecap="round" fill="none" />
      <path d={`M 4 0 Q 22 ${24 * a} 30 ${-6 + 16 * a}`} stroke="#ffd2b0" strokeWidth={7} strokeLinecap="round" fill="none" />
    </g>
  );
};

const Piranha: React.FC<{ x: number; y: number; s: number; flip?: boolean }> = ({ x, y, s, flip }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <path d="M -22 0 Q -10 -16 14 -8 L 26 -14 L 22 0 L 26 14 L 14 8 Q -10 16 -22 0 Z" fill="#8a9aa8" stroke="#000" strokeWidth={2} />
    <path d="M -22 0 Q -8 6 6 4" stroke="#c0392b" strokeWidth={3} fill="none" />
    <path d="M -20 -2 L -16 2 L -12 -2 L -8 2" stroke="#fff" strokeWidth={1.5} fill="none" />
    <circle cx={-12} cy={-5} r={2.5} fill="#ffeb3b" stroke="#000" strokeWidth={1} />
  </g>
);

const RiverStory: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '', badge: '' }, at, river, durationInSeconds = 30 }) => {
  const f = useCurrentFrame();
  if (!at || !river) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const last = vo.length - 1;
  const line = river.line;

  const cum = React.useMemo(() => {
    const c = [0];
    for (let i = 1; i < line.length; i++) c.push(c[i - 1] + Math.hypot((line[i][0] - line[i - 1][0]) * Math.cos(line[i][1] * RAD), line[i][1] - line[i - 1][1]));
    return c.map((v) => v / c[c.length - 1]);
  }, [line]);
  const at01 = (t: number): [number, number] => {
    let i = 1; while (i < cum.length - 1 && cum[i] < t) i++;
    const k = (t - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]);
    return [lerp(line[i - 1][0], line[i][0], k), lerp(line[i - 1][1], line[i][1], k)];
  };
  // where the swimmer started: the nearest point on the line to his start town
  const startT = React.useMemo(() => {
    let best = 0; let bd = 1e9;
    line.forEach(([lo, la], i) => { const d = Math.hypot(lo - river.start.lon, la - river.start.lat); if (d < bd) { bd = d; best = i; } });
    return cum[best];
  }, [line, cum, river.start.lon, river.start.lat]);

  // ---- camera: dive in during the hook; hold; push to the finish at the end
  const dive = EASE_INOUT(within(0, 0, 0.8));
  const RMAP = 1900;
  let lon0 = lerp(river.view.lon + 60, river.view.lon, dive); let lat0 = lerp(15, river.view.lat, dive);
  let R = logLerp(430, RMAP, dive);
  const toEnd = f >= cue(at.perday) && f < cue(last) ? EASE_INOUT(within(at.perday, 0, 0.7)) : 0;
  if (toEnd > 0) { lon0 = lerp(river.view.lon, river.finish.lon - 2, toEnd); lat0 = lerp(river.view.lat, river.finish.lat - 1, toEnd); R = logLerp(RMAP, RMAP * 2, toEnd); }
  const loopT = EASE_INOUT(prog(f, cue(last), END - 2));
  if (f >= cue(last)) { lon0 = lerp(river.finish.lon - 2, river.view.lon + 60, loopT); lat0 = lerp(river.finish.lat - 1, 15, loopT); R = logLerp(RMAP * 2, 430, loopT); }
  const P = (lon: number, lat: number) => proj(lon, lat, lon0, lat0, 540, 980, R);

  // ---- river drawn, then the swim
  const drawn = f < cue(at.water) ? 0 : EASE_INOUT(within(at.water, 0, 0.7));
  const swimT = f < cue(at.swim) ? -1 : lerp(startT, 1, EASE_INOUT(prog(f, cue(at.swim), cue(at.perday))));
  const swimFrac = swimT < 0 ? 0 : (swimT - startT) / (1 - startT);
  const pts = line.map(([lo, la]) => P(lo, la));
  const poly = (a: number, b: number) => {
    const out: string[] = [];
    const s = at01(a); const sp = P(s[0], s[1]); out.push(`${sp.x},${sp.y}`);
    for (let i = 0; i < line.length; i++) if (cum[i] > a && cum[i] < b) out.push(`${pts[i].x},${pts[i].y}`);
    const e = at01(b); const ep = P(e[0], e[1]); out.push(`${ep.x},${ep.y}`);
    return out.join(' ');
  };
  const sw = swimT >= 0 ? (() => { const [lo, la] = at01(swimT); return P(lo, la); })() : null;
  const start = P(river.start.lon, river.start.lat); const fin = P(river.finish.lon, river.finish.lat);

  // overlay helpers: punch-in cards
  const punch = (i: number) => EASE_OUT(within(i, 0, 0.18)) * (1 - prog(f, lineEnd(i) - 6, lineEnd(i) + 2));
  const hookO = Math.max(1 - prog(f, cue(at.water) - 6, cue(at.water) + 6), prog(f, END - 18, END - 2));

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <SpaceBg />
      <GlobeView id="rs" cx={540} cy={980} R={R} lon0={lon0} lat0={lat0} />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <defs><filter id="rsGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7" /></filter></defs>
        {drawn > 0 && (
          <g>
            <polyline points={poly(0, drawn)} fill="none" stroke="#4fc3ff" strokeWidth={26} opacity={0.65} filter="url(#rsGlow)" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={poly(0, drawn)} fill="none" stroke="#bfe9ff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
            {/* the flow: particles drifting down the river */}
            {Array.from({ length: 40 }, (_, i) => {
              const t = ((i / 40) + f * 0.004) % 1; if (t > drawn) return null;
              const [lo, la] = at01(t); const q = P(lo, la);
              return <circle key={i} cx={q.x} cy={q.y} r={4} fill="#fff" opacity={0.85} />;
            })}
          </g>
        )}
        {swimT >= 0 && <polyline points={poly(startT, Math.max(startT + 0.001, swimT))} fill="none" stroke={ROUTE} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />}
        {f >= cue(at.piranha) && f < cue(at.months) + 20 && sw && Array.from({ length: 9 }, (_, i) => {
          const a = i * 0.7 + f * 0.08; const d = 70 + (i % 3) * 30;
          const o = Math.min(1, within(at.piranha, 0, 0.2) * 1.5) * (1 - prog(f, cue(at.months), cue(at.months) + 20));
          return <g key={i} opacity={o}><Piranha x={sw.x + Math.cos(a) * d} y={sw.y + Math.sin(a) * d * 0.7} s={1.3} flip={Math.cos(a + 1.57) < 0} /></g>;
        })}
        {f >= cue(at.piranha) && f < cue(at.months) && sw && Array.from({ length: 6 }, (_, i) => {
          const t = ((f * 0.03 + i / 6) % 1); const r = rng(i + 11);
          return <circle key={`b${i}`} cx={sw.x + (r() - 0.5) * 160} cy={sw.y + 40 + t * 60} r={9 * (1 - t)} fill={ALERT} opacity={1 - t} />;
        })}
        {sw && <Swimmer x={sw.x} y={sw.y} f={f} s={1.15} />}
      </svg>
      {f >= cue(at.swim) && f < cue(at.piranha) && <Pin p={start} o={punch(at.swim)} label="START" color={ROUTE} />}
      {f >= cue(at.perday) && f < cue(last) && <Pin p={fin} o={EASE_OUT(within(at.perday, 0.4, 0.7))} label={`FINISH: ${river.finish.name}`} color={ROUTE} />}

      {/* punch-in overlays */}
      <AbsoluteFill style={{ background: 'linear-gradient(rgba(0,0,0,0.65) 0px, rgba(0,0,0,0) 470px)' }} />
      {f >= cue(at.water) && f < cue(at.bridge) && (
        <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center', transform: `scale(${0.7 + 0.3 * punch(at.water)})`, opacity: punch(at.water) }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#9fe0ff' }}>THE {river.name}</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 150, color: '#fff', textShadow: '0 6px 30px #000' }}>#1</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: '#4fc3ff' }}>MOST WATER OF ANY RIVER</div>
        </div>
      )}
      {f >= cue(at.bridge) && f < cue(at.swim) && (
        <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center', transform: `scale(${0.6 + 0.4 * punch(at.bridge)})`, opacity: punch(at.bridge) }}>
          <svg width={460} height={230} viewBox="0 0 460 230">
            <path d="M 20 170 Q 230 30 440 170" stroke="#cfd8e3" strokeWidth={16} fill="none" />
            <line x1={20} y1={170} x2={440} y2={170} stroke="#cfd8e3" strokeWidth={12} />
            {[80, 150, 230, 310, 380].map((x) => <line key={x} x1={x} y1={170} x2={x} y2={x === 230 ? 100 : 130} stroke="#cfd8e3" strokeWidth={6} />)}
            <line x1={60} y1={210} x2={400} y2={20} stroke={ALERT} strokeWidth={20} strokeLinecap="round" />
          </svg>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 110, color: '#fff', textShadow: '0 6px 30px #000' }}>0 BRIDGES</div>
        </div>
      )}
      {f >= cue(at.swim) && f < cue(at.perday) && (
        <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#ffd38a' }}>{river.year} · {river.swimmer}</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 120, color: '#fff', textShadow: '0 6px 30px #000' }}>
            {Math.round(river.km * swimFrac).toLocaleString('en-US')} km</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: ROUTE }}>DAY {Math.max(1, Math.round(river.days * swimFrac))}</div>
          {f >= cue(at.piranha) && f < cue(at.months) && (
            <div style={{ marginTop: 16, display: 'inline-block', background: ALERT, color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 52,
              padding: '8px 26px', borderRadius: 16, border: '4px solid #fff', transform: `rotate(-4deg) scale(${0.6 + 0.4 * punch(at.piranha)})` }}>PIRANHAS!</div>
          )}
        </div>
      )}
      {f >= cue(at.perday) && f < cue(last) && (
        <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center', transform: `scale(${0.7 + 0.3 * punch(at.perday)})` }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#ffd38a' }}>EVERY SINGLE DAY</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 140, color: '#fff', textShadow: '0 6px 30px #000' }}>≈ 80 km</div>
        </div>
      )}
      <Flash f={f} at={cue(at.bridge)} len={7} />
      <Flash f={f} at={cue(at.piranha)} len={7} color="#ff6b6b" />

      <div style={{ position: 'absolute', top: 170, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
        fontSize: 96, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.9)', opacity: hookO }}>
        {hook.top}<br /><span style={{ color: '#4fc3ff', fontSize: 66 }}>{hook.bottom}</span>
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

export default RiverStory;
