import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { Card } from './BlackHole';
import { EndCard } from './EndCard';
import { MONO, ROUTE, SANS, W, H, lerp } from './parts';

// =============================================================================
// "Is Russia really bigger than Africa?" - NASA Blue Marble in the Mercator
// projection (make_truesize.py), with Russia's and Greenland's real outlines
// slid to the Equator by ROTATING them on the sphere (so they keep their true
// size) and re-projected every frame - they shrink as the map stops stretching.
// =============================================================================
export const compositionConfig = {
  id: 'TrueSize',
  durationInSeconds: 30,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Ring = [number, number][];
type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string };
  at: { looks: number; stretch: number; slide: number; russia: number; africa: number; greenland: number; trick: number };
  map: { image: string; w: number; h: number; lon0: number; lon1: number; lat1: number };
  russia: Ring[]; africa: Ring[]; greenland: Ring[];
  from: { russia: [number, number]; greenland: [number, number] };
  to: { russia: [number, number]; greenland: [number, number] };
  labels: { russia: string; africa: string; greenland: string };
  durationInSeconds: number;
};

const RAD = Math.PI / 180;
const vec = (lon: number, lat: number): [number, number, number] =>
  [Math.cos(lat * RAD) * Math.cos(lon * RAD), Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD)];
const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// Move a shape from `from` to `to` keeping north up (as thetruesize.com does):
// spin the globe east-west (a rotation about the poles), then slide the shape
// straight down its meridian (a rotation about a horizontal axis). Both are true
// rotations of the sphere, so the shape keeps its real size and shape. The
// shortest-path rotation also keeps size, but it turned Russia on its side.
const rotator = (from: [number, number], to: [number, number], t: number) => {
  const dLon = (to[0] - from[0]) * t;
  const lonC = from[0] + dLon;
  const k = vec(lonC + 90, 0);
  const th = (from[1] - to[1]) * t * RAD;           // about k by +th lowers latitude by th
  const c = Math.cos(th); const s = Math.sin(th);
  return (lon: number, lat: number): [number, number] => {
    const v = vec(lon + dLon, lat);
    const kv = cross(k, v);
    const kd = dot(k, v);
    const r = [0, 1, 2].map((i) => v[i] * c + kv[i] * s + k[i] * kd * (1 - c));
    let lo = Math.atan2(r[1], r[0]) / RAD;
    lo = lonC + ((((lo - lonC) % 360) + 540) % 360) - 180;       // one piece around the centre
    return [lo, Math.asin(Math.max(-1, Math.min(1, r[2]))) / RAD];
  };
};

const TrueSize: React.FC<Partial<Props>> = (p) => {
  const f = useCurrentFrame();
  const { vo = [], hook = { top: '', bottom: '' }, at, map, durationInSeconds = 30 } = p;
  if (!at || !map || !p.russia || !p.africa || !p.greenland || !p.from || !p.to || !p.labels) {
    return <AbsoluteFill style={{ background: '#000' }} />;
  }
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const last = vo.length - 1;

  // ---- Mercator pixels of the background image
  const S = map.w / ((map.lon1 - map.lon0) * RAD);
  const ytop = Math.log(Math.tan(Math.PI / 4 + (map.lat1 * RAD) / 2));
  const px = (lon: number, lat: number): [number, number] => {
    const la = Math.max(-84, Math.min(84, lat));
    return [((lon - map.lon0) / (map.lon1 - map.lon0)) * map.w, (ytop - Math.log(Math.tan(Math.PI / 4 + (la * RAD) / 2))) * S];
  };

  // ---- camera: the whole map, then in on Africa while Russia arrives, out for Greenland
  const fit = W / map.w;
  const [ax, ay] = px(21, 3);
  const zIn = EASE_INOUT(within(at.slide, 0.2, 0.9)) * (1 - EASE_INOUT(within(at.greenland, 0, 0.35)) * 0.45);
  const zoom = lerp(fit, fit * 2.1, zIn);
  const camX = lerp(map.w / 2, ax, zIn);
  const camY = lerp(map.h * 0.5, ay, zIn);
  const loopT = EASE_INOUT(prog(f, cue(last), END - 4));
  const sx = (x: number) => (x - camX) * zoom + W / 2;
  const sy = (y: number) => (y - camY) * zoom + H / 2;
  const path = (rings: Ring[], rot?: (lo: number, la: number) => [number, number]) => rings.map((r) =>
    r.map(([lo, la], i) => {
      const [a, b] = rot ? rot(lo, la) : [lo, la];
      const [x, y] = px(a, b);
      return `${i ? 'L' : 'M'}${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`;
    }).join(' ') + 'Z').join(' ');

  const slideT = EASE_INOUT(within(at.slide, 0.1, 0.95));
  const gT = EASE_INOUT(within(at.greenland, 0.15, 0.85));
  const rot = rotator(p.from.russia, p.to.russia, slideT);
  const grot = rotator(p.from.greenland, p.to.greenland, gT);
  const hookO = Math.max(1 - prog(f, cue(at.looks) - 8, cue(at.looks) + 4), prog(f, END - 22, END - 4));
  const showGreen = f >= cue(at.greenland) - 4;

  // equal circles in real life, unequal on this map (the stretch)
  const tissot = [0, 30, 55, 70].map((lat, i) => {
    const [x, y] = px(10 + i * 38, lat);
    const r = (700 / 6371) * S / Math.cos(lat * RAD);
    return { x: sx(x), y: sy(y), r: r * zoom };
  });
  const tissotO = f >= cue(at.stretch) ? EASE_OUT(within(at.stretch, 0.1, 0.4)) * (1 - prog(f, cue(at.slide) - 6, cue(at.slide) + 6)) : 0;

  const mapLayer = (z: number, cx: number, cy: number) => (
    <Img src={staticFile(map.image)} style={{
      position: 'absolute', left: (0 - cx) * z + W / 2, top: (0 - cy) * z + H / 2, width: map.w * z, height: map.h * z,
    }} />
  );

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(#050b16, #02050a)', overflow: 'hidden' }}>
      {mapLayer(zoom, camX, camY)}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <path d={path(p.africa)} fill="rgba(255,196,60,0.28)" stroke="#ffd34d" strokeWidth={4} fillRule="evenodd" />
        {/* Russia where the map puts it, then sliding at true size */}
        <path d={path(p.russia)} fill="rgba(255,70,70,0.12)" stroke="rgba(255,120,120,0.6)" strokeWidth={2}
          strokeDasharray="8 8" fillRule="evenodd" opacity={slideT > 0 ? 1 : 0} />
        <path d={path(p.russia, rot)} fill="rgba(255,60,60,0.45)" stroke="#ff5c5c" strokeWidth={4} fillRule="evenodd"
          opacity={1 - EASE_OUT(within(at.greenland, 0, 0.2)) * 0.75} />
        {showGreen && (
          <>
            <path d={path(p.greenland)} fill="rgba(120,220,255,0.12)" stroke="rgba(150,220,255,0.6)" strokeWidth={2}
              strokeDasharray="8 8" fillRule="evenodd" />
            <path d={path(p.greenland, grot)} fill="rgba(90,200,255,0.5)" stroke="#7fd6ff" strokeWidth={4} fillRule="evenodd" />
          </>
        )}
        {tissotO > 0.01 && tissot.map((c, i) => (
          <g key={i} opacity={tissotO}>
            <circle cx={c.x} cy={c.y} r={c.r} fill="rgba(255,255,255,0.18)" stroke="#fff" strokeWidth={3} />
          </g>
        ))}
      </svg>

      {tissotO > 0.01 && <Card top="SAME SIZE IN REAL LIFE" sub="the map stretches them" o={tissotO} y={250} />}
      {f >= cue(at.russia) && f < cue(at.greenland) && (
        <div style={{ position: 'absolute', top: 240, left: 40, right: 40, textAlign: 'center', background: 'rgba(5,8,14,0.82)',
          borderRadius: 18, padding: '12px 0' }}>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 66, color: '#ff7a7a', textShadow: '0 4px 18px #000',
            opacity: EASE_OUT(within(at.russia, 0.1, 0.35)) }}>RUSSIA {p.labels.russia}</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 66, color: '#ffd34d', textShadow: '0 4px 18px #000',
            opacity: f >= cue(at.africa) ? EASE_OUT(within(at.africa, 0.1, 0.35)) : 0 }}>AFRICA {p.labels.africa}</div>
        </div>
      )}
      {f >= cue(at.greenland) && f < cue(at.trick) && (
        <Card top={p.labels.greenland} color="#7fd6ff" o={EASE_OUT(within(at.greenland, 0.4, 0.65))} y={250} />
      )}
      {f >= cue(at.trick) && f < cue(last) && (
        <Card top="THE MERCATOR TRICK" sub="most world maps use it" o={EASE_OUT(within(at.trick, 0.1, 0.35))} y={250} />
      )}

      {/* loop: back to the frame-0 map */}
      {loopT > 0.001 && (
        <AbsoluteFill style={{ opacity: loopT, background: 'linear-gradient(#050b16, #02050a)' }}>
          {mapLayer(fit, map.w / 2, map.h * 0.5)}
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {(() => {
              const sx0 = (x: number) => (x - map.w / 2) * fit + W / 2;
              const sy0 = (y: number) => (y - map.h * 0.5) * fit + H / 2;
              const d0 = (rings: Ring[]) => rings.map((r) => r.map(([lo, la], i) => {
                const [x, y] = px(lo, la); return `${i ? 'L' : 'M'}${sx0(x).toFixed(1)} ${sy0(y).toFixed(1)}`;
              }).join(' ') + 'Z').join(' ');
              return (
                <>
                  <path d={d0(p.africa)} fill="rgba(255,196,60,0.28)" stroke="#ffd34d" strokeWidth={4} fillRule="evenodd" />
                  <path d={d0(p.russia)} fill="rgba(255,60,60,0.45)" stroke="#ff5c5c" strokeWidth={4} fillRule="evenodd" />
                </>
              );
            })()}
          </svg>
        </AbsoluteFill>
      )}

      {/* thumbnail-style title */}
      <div style={{ position: 'absolute', top: 160, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
        fontSize: 104, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.9)', opacity: hookO }}>
        {hook.top}
      </div>
      <div style={{ position: 'absolute', top: 1360, left: 0, right: 0, textAlign: 'center', opacity: hookO,
        transform: `rotate(-3deg) scale(${1 + 0.04 * Math.sin(f / 5)})` }}>
        <span style={{ display: 'inline-block', background: '#ff2d2d', color: '#fff', fontFamily: SANS, fontWeight: 800,
          fontSize: 70, padding: '10px 32px', borderRadius: 18, border: '5px solid #fff' }}>{hook.bottom}</span>
      </div>

      <EndCard from={cue(last)} to={END - 14} text="" compact />
      <Captions lines={vo} y={1560} accent={ROUTE} maxWords={3} size={58} plate />
    </AbsoluteFill>
  );
};

export default TrueSize;
