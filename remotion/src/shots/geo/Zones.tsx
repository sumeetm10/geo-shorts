import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { EndCard } from './EndCard';
import { GlobeView, SpaceBg } from './Globe';
import type { GlobeOverlay } from './Globe';
import { MONO, ROUTE, SANS, W, lerp } from './parts';

// =============================================================================
// "What if Earth were split into 4 countries?" - the 3D globe cut by the
// Equator and the Greenwich meridian, each quarter tinted and visited in turn.
// Every number arrives as props from make_zones.py (zones.py counts them from
// Natural Earth).
// =============================================================================
export const compositionConfig = {
  id: 'Zones',
  durationInSeconds: 32,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Zone = 'NE' | 'NW' | 'SE' | 'SW';
type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string };
  at: { cut: number; ne: number; nw: number; se: number; sw: number; split: number; land: number };
  zones: Record<Zone, { name: string; people: string; ratio: string }>;
  land: { land: number; people: number };          // the north-east's shares, 0..1
  durationInSeconds: number;
};

const COLOR: Record<Zone, string> = { NE: '#ffc43c', NW: '#ff5c5c', SE: '#3cdcbe', SW: '#b07cff' };
const VIEW: Record<Zone, [number, number]> = { NE: [70, 30], NW: [-75, 30], SE: [115, -25], SW: [-60, -25] };

const ease = (t: number) => EASE_INOUT(Math.max(0, Math.min(1, t)));
const lonLerp = (a: number, b: number, t: number) => {
  let d = ((b - a + 540) % 360) - 180;                // the short way round
  return a + d * t;
};

const Zones: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '' }, at, zones, land, durationInSeconds = 32 }) => {
  const f = useCurrentFrame();
  if (!at || !zones || !land) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const last = vo.length - 1;

  // ---- camera keyframes: [frame, lon, lat, R]
  const spin0 = 20;
  const keys: [number, number, number, number][] = [
    [0, spin0, 12, 420],
    [cue(at.cut), spin0 - cue(at.cut) * 0.9, 12, 420],
    [lerp(cue(at.cut), lineEnd(at.cut), 0.7), 0, 0, 470],
    ...(['ne', 'nw', 'se', 'sw'] as const).map((k) => {
      const z = k.toUpperCase() as Zone;
      return [lerp(cue(at[k]), lineEnd(at[k]), 0.45), VIEW[z][0], VIEW[z][1], 440] as [number, number, number, number];
    }),
    [lerp(cue(at.split), lineEnd(at.split), 0.25), -48, -4, 760],     // Brazil, cut by the Equator
    [lerp(cue(at.split), lineEnd(at.split), 0.75), -2, 50, 1100],     // London, on the meridian
    [lerp(cue(at.land), lineEnd(at.land), 0.4), 40, 18, 400],
  ];
  let cam = { lon: spin0 - f * 0.9, lat: 12, R: 420 };
  if (f >= keys[1][0]) {
    let i = 1;
    while (i + 1 < keys.length && f >= keys[i + 1][0]) i++;
    if (i + 1 >= keys.length) {
      cam = { lon: keys[i][1], lat: keys[i][2], R: keys[i][3] };
    } else {
      const [fa, la, ta, ra] = keys[i];
      const [fb, lb, tb, rb] = keys[i + 1];
      const t = ease((f - fa) / Math.max(1, fb - fa));
      cam = { lon: lonLerp(la, lb, t), lat: lerp(ta, tb, t), R: lerp(ra, rb, t) };
    }
  }

  // ---- overlays
  const order: Zone[] = ['NE', 'NW', 'SE', 'SW'];
  const zoneLine = (z: Zone) => at[z.toLowerCase() as 'ne' | 'nw' | 'se' | 'sw'];
  const current = order.find((z) => f >= cue(zoneLine(z)) && f < lineEnd(zoneLine(z))) ?? null;
  // frame 0 is the thumbnail: the four colours and both lines are already there
  const ov: GlobeOverlay = {
    lines: 1,
    tint: 1,
    focus: current ?? (f >= cue(at.land) && f < cue(last) ? 'NE' : null),
    focusAmt: current ? EASE_OUT(within(zoneLine(current), 0, 0.2))
      : f >= cue(at.land) ? EASE_OUT(within(at.land, 0, 0.3)) * (1 - prog(f, cue(last) - 6, cue(last))) : 0,
  };
  const loopT = EASE_INOUT(prog(f, cue(last), END - 4));
  const hookO = Math.max(1 - prog(f, cue(at.cut) - 8, cue(at.cut) + 4), prog(f, END - 22, END - 4));
  const splitHalf = f >= cue(at.split) && f < lineEnd(at.split) ? (within(at.split, 0, 1) < 0.5 ? 0 : 1) : -1;
  const landO = f >= cue(at.land) ? EASE_OUT(within(at.land, 0.15, 0.4)) * (1 - prog(f, cue(last) - 6, cue(last))) : 0;
  const bar = EASE_OUT(within(at.land, 0.25, 0.75));

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <SpaceBg starsO={1 - prog(cam.R, 500, 900)} />
      <GlobeView id="z" cx={540} cy={1000} R={cam.R} lon0={cam.lon} lat0={cam.lat} overlay={ov} />

      {loopT > 0.001 && (
        <AbsoluteFill style={{ opacity: loopT }}>
          <SpaceBg starsO={1} />
          <GlobeView id="loop" cx={540} cy={1000} R={420} lon0={spin0 + (END - f) * 0.9} lat0={12} overlay={{ lines: 1, tint: 1 }} />
        </AbsoluteFill>
      )}

      {/* the zone being visited */}
      {current && (() => {
        const z = zones[current];
        const o = EASE_OUT(within(zoneLine(current), 0.05, 0.25)) * (1 - prog(f, lineEnd(zoneLine(current)) - 8, lineEnd(zoneLine(current))));
        return (
          <div style={{ position: 'absolute', top: 170, left: 40, right: 40, textAlign: 'center', opacity: o }}>
            <div style={{ display: 'inline-block', padding: '8px 26px', borderRadius: 14, background: 'rgba(8,10,14,0.75)',
              border: `3px solid ${COLOR[current]}`, fontFamily: SANS, fontWeight: 700, fontSize: 52, color: COLOR[current],
              letterSpacing: 2 }}>{z.name}</div>
            <div style={{ marginTop: 18, fontFamily: MONO, fontWeight: 700, fontSize: 92, color: '#fff',
              textShadow: '0 6px 26px #000' }}>{z.people}</div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 46, color: ROUTE, textShadow: '0 4px 16px #000' }}>{z.ratio}</div>
          </div>
        );
      })()}

      {/* the lines named */}
      {f >= cue(at.cut) && f < lineEnd(at.cut) && (
        <div style={{ position: 'absolute', top: 200, left: 40, right: 40, textAlign: 'center', opacity: EASE_OUT(within(at.cut, 0.3, 0.55)),
          fontFamily: SANS, fontWeight: 700, fontSize: 48, color: '#ffe14d', textShadow: '0 4px 18px #000', lineHeight: 1.3 }}>
          THE EQUATOR<br />+ THE GREENWICH LINE
        </div>
      )}

      {/* Brazil, then London */}
      {splitHalf >= 0 && (
        <div style={{ position: 'absolute', top: 220, left: 40, right: 40, textAlign: 'center' }}>
          <div style={{ display: 'inline-block', padding: '10px 26px', borderRadius: 14, background: 'rgba(8,10,14,0.78)',
            border: '3px solid #ffe14d', fontFamily: SANS, fontWeight: 700, fontSize: 56, color: '#fff' }}>
            {splitHalf === 0 ? 'BRAZIL: CUT IN TWO' : 'LONDON: ON THE BORDER'}</div>
        </div>
      )}

      {/* less than half the land, three quarters of the people */}
      {landO > 0.01 && (
        <div style={{ position: 'absolute', top: 170, left: 80, right: 80, opacity: landO }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 48, color: COLOR.NE, textAlign: 'center', marginBottom: 18 }}>
            {zones.NE.name}</div>
          {[['LAND', land.land], ['PEOPLE', land.people]].map(([label, v]) => (
            <div key={label as string} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontWeight: 700, fontSize: 38,
                color: '#fff', textShadow: '0 3px 12px #000' }}>
                <span>{label}</span><span>{Math.round((v as number) * 100 * bar)}%</span>
              </div>
              <div style={{ height: 30, borderRadius: 15, background: 'rgba(255,255,255,0.15)' }}>
                <div style={{ height: 30, borderRadius: 15, width: `${(v as number) * 100 * bar}%`,
                  background: label === 'PEOPLE' ? COLOR.NE : '#8fb8de' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* thumbnail-style title: big, outlined, two colours, and a question badge */}
      <div style={{
        position: 'absolute', top: 170, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
        fontSize: 118, lineHeight: 1.0, color: '#fff', opacity: hookO, letterSpacing: -1,
        WebkitTextStroke: '6px #000', paintOrder: 'stroke', textShadow: '0 10px 40px rgba(0,0,0,0.9)',
      }}>
        {hook.top}<br /><span style={{ color: ROUTE }}>{hook.bottom}</span>
      </div>
      <div style={{
        position: 'absolute', top: 1330, left: 0, right: 0, textAlign: 'center', opacity: hookO,
        transform: `rotate(-4deg) scale(${1 + 0.04 * Math.sin(f / 5)})`,
      }}>
        <span style={{ display: 'inline-block', background: '#ff2d2d', color: '#fff', fontFamily: SANS, fontWeight: 800,
          fontSize: 76, padding: '10px 34px', borderRadius: 18, border: '5px solid #fff',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}>WHO WINS?</span>
      </div>

      <EndCard from={cue(last)} to={END - 14} text="" compact />
      <Captions lines={vo} y={1560} accent={ROUTE} maxWords={3} size={58} plate />
    </AbsoluteFill>
  );
};

export default Zones;
