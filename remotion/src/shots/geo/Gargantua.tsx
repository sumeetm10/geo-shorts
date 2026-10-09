import React from 'react';
import { rng } from './parts';

// =============================================================================
// A cinematic black hole for the black-hole series: the shadow, a thin photon
// ring, and an accretion disk seen nearly edge-on - its near side passing in
// front of the shadow, its far side bent up over the top (and faintly under the
// bottom) by lensing, the way the far disk shows in simulations. Gas streams
// round at Keplerian speed (inner rings faster) and the approaching side is
// brighter (Doppler beaming). Pure SVG, so it renders on the CPU.
//
//   <Gargantua id="a" x={540} y={900} rs={120} f={frame} />
// rs = shadow radius in px; tilt = how open the disk looks (0.12 edge-on .. 0.4).
// =============================================================================

const RINGS = 24;
const DASH = (() => {
  const r = rng(616);
  return Array.from({ length: RINGS }, () => ({ a: 6 + r() * 40, b: 3 + r() * 26, c: 2 + r() * 12, d: 4 + r() * 30, o: r() }));
})();

// colour of the gas from the hot inner edge (t=0) to the cool outside (t=1)
const gas = (t: number) => {
  const stops: [number, [number, number, number]][] = [
    [0, [255, 255, 246]], [0.15, [255, 238, 186]], [0.4, [255, 192, 92]], [0.7, [242, 122, 40]], [1, [150, 50, 15]],
  ];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1]; const [t1, c1] = stops[i];
      const k = (t - t0) / (t1 - t0);
      return `rgb(${c0.map((v, j) => Math.round(v + (c1[j] - v) * k)).join(',')})`;
    }
  }
  return 'rgb(110,30,8)';
};

export const Gargantua: React.FC<{
  id: string; x: number; y: number; rs: number; f: number; tilt?: number; spin?: number; o?: number; disk?: number;
}> = ({ id, x, y, rs, f, tilt = 0.14, spin = 1, o = 1, disk = 1 }) => {
  const ri = rs * 1.55; const ro = rs * (1.55 + 2.6 * disk);
  const blur = Math.max(0.6, rs * 0.025);
  const rings = Array.from({ length: RINGS }, (_, i) => {
    const t = i / (RINGS - 1);
    const rx = ri + (ro - ri) * t;
    const w = ((ro - ri) / RINGS) * 1.5;
    const speed = spin * 2.2 * Math.pow(ri / rx, 1.5) * rs * 0.06;      // Keplerian: inner gas laps faster
    const d = DASH[i];
    const fade = Math.pow(1 - t, 1.1) * 0.9 + 0.1;
    return { t, rx, w, off: -f * speed * 4, dash: `${d.a * rs * 0.02 + 2} ${d.b * rs * 0.02 + 1} ${d.c * rs * 0.02 + 1} ${d.d * rs * 0.02 + 1}`, fade, col: gas(t) };
  });
  // the lensed image of the far disk: rings hugging the shadow
  const halo = Array.from({ length: 14 }, (_, i) => {
    const t = i / 13; const r = rs * (1.08 + 0.55 * t);
    return { t, r, w: rs * 0.06, col: gas(0.08 + t * 0.5), fade: Math.pow(1 - t, 1.5) * 0.95 + 0.05, off: -f * spin * rs * 0.05 * (1.4 - t), d: DASH[i] };
  });
  const ext = ro + rs * 0.5;
  const ids = { top: `gt-${id}`, bot: `gb-${id}`, dop: `gd-${id}`, blur: `gf-${id}`, bloom: `gl-${id}`, glow: `gg-${id}`, ring: `gr-${id}` };
  const diskEllipses = (half: 'top' | 'bot', extra = 0) => (
    <g clipPath={`url(#${half === 'top' ? ids.top : ids.bot})`}>
      {rings.map((r, i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx={r.rx} ry={r.rx * tilt} fill="none" stroke={r.col} strokeWidth={r.w + extra}
            opacity={r.fade * 0.75} />
          <ellipse cx={x} cy={y} rx={r.rx} ry={r.rx * tilt} fill="none" stroke={r.col} strokeWidth={r.w * 0.8 + extra}
            strokeDasharray={r.dash} strokeDashoffset={r.off} opacity={r.fade} />
        </g>
      ))}
    </g>
  );
  const haloRings = (half: 'top' | 'bot', scale: number) => (
    <g clipPath={`url(#${half === 'top' ? ids.top : ids.bot})`} opacity={scale}>
      {halo.map((h, i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx={h.r * (half === 'top' ? 1.02 : 1)} ry={h.r * (half === 'top' ? 0.98 : 0.92)} fill="none" stroke={h.col}
            strokeWidth={h.w} opacity={h.fade} />
          <ellipse cx={x} cy={y} rx={h.r * (half === 'top' ? 1.02 : 1)} ry={h.r * (half === 'top' ? 0.98 : 0.92)} fill="none" stroke={h.col}
            strokeWidth={h.w * 0.8} strokeDasharray={`${h.d.a * rs * 0.03 + 2} ${h.d.b * rs * 0.02 + 1}`} strokeDashoffset={h.off}
            opacity={h.fade * 0.35} />
        </g>
      ))}
    </g>
  );
  return (
    <g opacity={o}>
      <defs>
        <clipPath id={ids.top}><rect x={x - ext} y={y - ext} width={ext * 2} height={ext} /></clipPath>
        <clipPath id={ids.bot}><rect x={x - ext} y={y} width={ext * 2} height={ext} /></clipPath>
        {/* approaching (left) side brighter */}
        <linearGradient id={`${ids.dop}-g`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" /><stop offset="0.5" stopColor="#d6d6d6" /><stop offset="1" stopColor="#808080" />
        </linearGradient>
        <mask id={ids.dop} maskUnits="userSpaceOnUse" x={x - ext} y={y - ext} width={ext * 2} height={ext * 2}>
          <rect x={x - ext} y={y - ext} width={ext * 2} height={ext * 2} fill={`url(#${ids.dop}-g)`} />
        </mask>
        <filter id={ids.blur} x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation={blur} /></filter>
        <filter id={ids.bloom} x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation={rs * 0.18} /></filter>
        <radialGradient id={ids.glow} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.25" stopColor="#ffb347" stopOpacity={0.35} /><stop offset="1" stopColor="#ff7a1a" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={ro * 1.05} fill={`url(#${ids.glow})`} opacity={0.3 * disk} />
      <g mask={`url(#${ids.dop})`}>
        {/* bloom under everything bright */}
        <g filter={`url(#${ids.bloom})`} opacity={0.75}>{diskEllipses('top', rs * 0.05)}{haloRings('top', 1)}{diskEllipses('bot', rs * 0.05)}</g>
        {/* far side of the disk, behind the hole */}
        <g filter={`url(#${ids.blur})`}>{diskEllipses('top')}</g>
        {/* the far disk lensed up over the top of the shadow, and faintly under it */}
        <g filter={`url(#${ids.blur})`}>{haloRings('top', 1)}{haloRings('bot', 0.45)}</g>
      </g>
      {/* the shadow and its photon ring */}
      <circle cx={x} cy={y} r={rs} fill="#000" />
      <circle cx={x} cy={y} r={rs * 1.035} fill="none" stroke="#fff3d6" strokeWidth={Math.max(1, rs * 0.03)} opacity={0.95}
        filter={`url(#${ids.blur})`} />
      {/* near side of the disk, in front of the shadow */}
      <g mask={`url(#${ids.dop})`} filter={`url(#${ids.blur})`}>{diskEllipses('bot')}</g>
    </g>
  );
};

// a little astronaut, stretched (sy) and squeezed (sx) by the tide
export const Astronaut: React.FC<{ x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; tint?: string; o?: number }> = ({
  x, y, s, sx = 1, sy = 1, rot = 0, tint = '#f2f4f8', o = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * sx} ${s * sy})`} opacity={o}>
    <rect x={-22} y={-10} width={44} height={60} rx={16} fill={tint} />
    <rect x={-34} y={-4} width={14} height={44} rx={7} fill={tint} opacity={0.92} />
    <rect x={20} y={-4} width={14} height={44} rx={7} fill={tint} opacity={0.92} />
    <rect x={-18} y={46} width={15} height={40} rx={7} fill={tint} opacity={0.92} />
    <rect x={3} y={46} width={15} height={40} rx={7} fill={tint} opacity={0.92} />
    <circle cx={0} cy={-30} r={26} fill={tint} />
    <ellipse cx={4} cy={-30} rx={17} ry={13} fill="#1b2a44" />
    <ellipse cx={9} cy={-34} rx={5} ry={3} fill="#9fd0ff" opacity={0.8} />
    <rect x={-14} y={6} width={28} height={16} rx={4} fill="#ff6b3d" />
  </g>
);
