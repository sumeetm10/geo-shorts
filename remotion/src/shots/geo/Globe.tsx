import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, Img, continueRender, delayRender, staticFile, useCurrentFrame } from 'remotion';
import { EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import { Pin, ROUTE, SANS, W, H, lerp, rng } from './parts';

// =============================================================================
// A spinning 3D Earth that flies down to a place - drawn pixel by pixel on a
// canvas (no WebGL, so it renders the same on a laptop CPU and on GitHub).
// For every screen pixel inside the globe the inverse orthographic projection
// gives a latitude/longitude, which is looked up in NASA's Blue Marble; then
// sunlight (Lambert), a glint on the oceans, a blue limb and an atmosphere glow.
// At the end it cross-fades to a full-resolution flat crop of the same place,
// so the zoom lands sharp.
// =============================================================================
export const compositionConfig = {
  id: 'Globe',
  durationInSeconds: 10,
  fps: 30,
  width: 1080,
  height: 1920,
};

type GlobeProps = {
  texture: string;                 // equirectangular image under media/
  target: { lon: number; lat: number; label: string };
  flat?: { image: string; x: number; y: number };   // full-res crop centred on the target
  hook?: { top: string; bottom: string };
  durationInSeconds: number;
};

type Tex = { w: number; h: number; px: Uint8ClampedArray };
const cache: Record<string, Tex> = {};

const useTexture = (src: string) => {
  const [tex, setTex] = useState<Tex | null>(cache[src] ?? null);
  const [handle] = useState(() => (cache[src] ? null : delayRender(`texture ${src}`)));
  useEffect(() => {
    if (cache[src]) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      cache[src] = { w: img.width, h: img.height, px: ctx.getImageData(0, 0, img.width, img.height).data };
      setTex(cache[src]);
      if (handle !== null) continueRender(handle);
    };
    img.src = staticFile(src);
  }, [src, handle]);
  return tex;
};

const STARS = (() => {
  const r = rng(424242);
  return Array.from({ length: 420 }, () => ({ x: r() * W, y: r() * H, s: 0.4 + r() * 1.8, a: 0.25 + r() * 0.75, p: r() * 6 }));
})();

// sun from the upper left, a little in front
const L = (() => { const v = [-0.55, 0.45, 0.7]; const n = Math.hypot(...v); return v.map((x) => x / n); })();
const Hv = (() => { const v = [L[0], L[1], L[2] + 1]; const n = Math.hypot(...v); return v.map((x) => x / n); })();
const RAD = Math.PI / 180;

// Optional overlays for the "Earth split in 4" video: the Equator and the
// Greenwich meridian as glowing lines, each quarter tinted, one picked out.
export type GlobeOverlay = { lines?: number; tint?: number; focus?: 'NE' | 'NW' | 'SE' | 'SW' | null; focusAmt?: number };
const ZONE_RGB: Record<string, [number, number, number]> = {
  NE: [255, 196, 60], NW: [255, 92, 92], SE: [60, 220, 190], SW: [176, 124, 255],
};

function drawGlobe(ctx: CanvasRenderingContext2D, tex: Tex, cx: number, cy: number, R: number, lon0: number, lat0: number,
  ov: GlobeOverlay = {}) {
  const lines = ov.lines ?? 0;
  const tint = ov.tint ?? 0;
  const focus = ov.focus ?? null;
  const focusAmt = ov.focusAmt ?? 0;
  const lineW = 2.6 / R;                         // ~5 px wide on screen, in radians
  const x0 = Math.max(0, Math.floor(cx - R));
  const x1 = Math.min(W, Math.ceil(cx + R));
  const y0 = Math.max(0, Math.floor(cy - R));
  const y1 = Math.min(H, Math.ceil(cy + R));
  if (x1 <= x0 || y1 <= y0) return;
  const img = ctx.createImageData(x1 - x0, y1 - y0);
  const out = img.data;
  const s0 = Math.sin(lat0 * RAD);
  const c0 = Math.cos(lat0 * RAD);
  const { w: tw, h: th, px } = tex;
  const invR = 1 / R;
  for (let y = y0; y < y1; y++) {
    const yy = (cy - y) * invR;
    for (let x = x0; x < x1; x++) {
      const xx = (x - cx) * invR;
      const rho2 = xx * xx + yy * yy;
      if (rho2 > 1) continue;
      const z = Math.sqrt(1 - rho2);
      // inverse orthographic projection
      const lat = Math.asin(z * s0 + yy * c0);
      const lon = lon0 * RAD + Math.atan2(xx, z * c0 - yy * s0);
      let u = ((lon / (2 * Math.PI)) + 0.5) % 1;
      if (u < 0) u += 1;
      const v = 0.5 - lat / Math.PI;
      const ti = ((Math.min(th - 1, (v * th) | 0) * tw) + ((u * tw) | 0)) * 4;
      let r = px[ti];
      let g = px[ti + 1];
      let b = px[ti + 2];
      // light: day side lit, night side dim, a soft terminator
      const ndl = xx * L[0] + yy * L[1] + z * L[2];
      const day = Math.min(1, Math.max(0, ndl * 1.6 + 0.25));
      const shade = 0.1 + 0.95 * day;
      r *= shade; g *= shade; b *= shade;
      // sun glint on water
      if (b > r + 12 && b > g) {
        const ndh = Math.max(0, xx * Hv[0] + yy * Hv[1] + z * Hv[2]);
        const spec = Math.pow(ndh, 110) * 140 * day;
        r += spec * 0.9; g += spec * 0.95; b += spec;
      }
      // blue haze towards the edge (thicker air at the limb)
      if (tint > 0 || lines > 0) {
        let ln = lon % (2 * Math.PI);
        if (ln > Math.PI) ln -= 2 * Math.PI;
        if (ln < -Math.PI) ln += 2 * Math.PI;
        const zone = (lat >= 0 ? 'N' : 'S') + (ln >= 0 ? 'E' : 'W');
        if (tint > 0) {
          const [zr, zg, zb] = ZONE_RGB[zone];
          const a = 0.42 * tint;
          r = r * (1 - a) + zr * a * shade; g = g * (1 - a) + zg * a * shade; b = b * (1 - a) + zb * a * shade;
          if (focus && zone !== focus) {
            const d = 1 - 0.62 * focusAmt;
            r *= d; g *= d; b *= d;
          }
        }
        if (lines > 0) {
          // distance to the Equator, and to Greenwich, measured along the surface
          const dEq = Math.abs(lat);
          const dGr = Math.abs(Math.sin(ln)) * Math.cos(lat) < Math.sin(lineW) && Math.abs(ln) < Math.PI / 2 ? 0 : 1;
          if (dEq < lineW || dGr === 0) {
            const a = lines;
            r = r * (1 - a) + 255 * a; g = g * (1 - a) + 225 * a; b = b * (1 - a) + 77 * a;
          }
        }
      }
      const limb = Math.pow(1 - z, 2.2) * (0.35 + 0.65 * day);
      r = r * (1 - limb) + 110 * limb;
      g = g * (1 - limb) + 170 * limb;
      b = b * (1 - limb) + 255 * limb;
      const o = ((y - y0) * (x1 - x0) + (x - x0)) * 4;
      out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = 255;
    }
  }
  ctx.putImageData(img, x0, y0);
}

// ------------------------------------------------------------ reusable pieces
// deep space behind everything; stars fade as the camera dives
export const SpaceBg: React.FC<{ starsO?: number }> = ({ starsO = 1 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 40%, #0a1430 0%, #03060f 55%, #000 100%)' }}>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {starsO > 0.01 && STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#fff"
            opacity={s.a * (0.75 + 0.25 * Math.sin(f / 9 + s.p)) * starsO} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

// the lit globe and its atmosphere, centred at (cx, cy) with radius R
export const GlobeView: React.FC<{
  texture?: string; cx: number; cy: number; R: number; lon0: number; lat0: number; id?: string; overlay?: GlobeOverlay;
}> = ({ texture = 'globe/earth4k.jpg', cx, cy, R, lon0, lat0, id = 'g', overlay }) => {
  const tex = useTexture(texture);
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c || !tex) return;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    drawGlobe(ctx, tex, cx, cy, R, lon0, lat0, overlay);
  }, [tex, cx, cy, R, lon0, lat0, overlay?.lines, overlay?.tint, overlay?.focus, overlay?.focusAmt]);
  const glow = R * 1.12;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <radialGradient id={`atmo-${id}`} cx="0.5" cy="0.5" r="0.5">
            <stop offset={R / glow - 0.01} stopColor="#6fb7ff" stopOpacity={0.9} />
            <stop offset={(R / glow + 1) / 2} stopColor="#3d7fe0" stopOpacity={0.35} />
            <stop offset="1" stopColor="#1d3f8a" stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={glow} fill={`url(#atmo-${id})`} />
      </svg>
      <canvas ref={ref} width={W} height={H} style={{ position: 'absolute', inset: 0 }} />
    </AbsoluteFill>
  );
};

// the intro camera: t 0..1 spins the globe, turns it to the target and dives in
export const introCamera = (t: number, lon: number, lat: number) => {
  const spin = 1 - EASE_INOUT(Math.min(1, t / 0.62));
  const dive = EASE_INOUT(prog(t, 0.45, 0.86));
  return {
    lon0: lon - 230 * spin,
    lat0: lerp(12, lat, EASE_INOUT(prog(t, 0.25, 0.7))),
    R: 420 * Math.pow(5.2, dive),                          // 420 px -> about 2,200 px
    cx: W / 2,
    cy: lerp(1000, H / 2, dive),
    dive,
  };
};

const Globe: React.FC<Partial<GlobeProps>> = ({
  texture = 'globe/earth4k.jpg', target = { lon: 86.93, lat: 27.99, label: 'MOUNT EVEREST' },
  flat, hook, durationInSeconds = 10,
}) => {
  const f = useCurrentFrame();
  const END = Math.round(durationInSeconds * 30);
  const cam = introCamera(f / END, target.lon, target.lat);
  const flatO = flat ? EASE_INOUT(prog(f, END * 0.8, END * 0.9)) : 0;
  return (
    <AbsoluteFill>
      <SpaceBg starsO={1 - EASE_OUT(cam.dive)} />
      <GlobeView texture={texture} cx={cam.cx} cy={cam.cy} R={cam.R} lon0={cam.lon0} lat0={cam.lat0} />
      {flat && flatO > 0.001 && (
        <AbsoluteFill style={{ opacity: flatO }}>
          <Img src={staticFile(flat.image)} style={{ width: W, height: H, objectFit: 'cover' }} />
        </AbsoluteFill>
      )}
      <Pin p={{ x: flat && flatO > 0.5 ? flat.x : cam.cx, y: flat && flatO > 0.5 ? flat.y : cam.cy }}
        o={EASE_OUT(prog(f, END * 0.84, END * 0.92))} label={target.label} />
      {hook && (
        <div style={{
          position: 'absolute', top: 200, left: 50, right: 50, textAlign: 'center', fontFamily: SANS,
          fontWeight: 700, fontSize: 70, lineHeight: 1.1, color: '#fff',
          textShadow: '0 6px 30px rgba(0,0,0,0.85)', opacity: 1 - prog(f, END * 0.4, END * 0.5),
        }}>
          {hook.top}<br /><span style={{ color: ROUTE }}>{hook.bottom}</span>
        </div>
      )}
    </AbsoluteFill>
  );
};

export default Globe;
