import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { EndCard } from './EndCard';

// =============================================================================
// "Can you walk from X to Y?" — one template for every route.
//
// Nothing about a particular journey lives in this file. make_walk.py computes
// the route from real borders (routes.py), frames the legs, crops the NASA
// imagery, projects every outline to pixels and writes the narration; all of it
// arrives here as props. Geometry is precomputed on purpose: projecting the 10m
// outlines inside the component once meant redoing ~52,000 points on every
// frame, and a 142 s render never finished.
// =============================================================================
export const compositionConfig = {
  id: 'GeoWalk',
  durationInSeconds: 40,
  fps: 30,
  width: 1080,
  height: 1920,
};

const FPS = 30;
const W = 1080;
const H = 1920;
const ROUTE = '#ffe14d';
const ALERT = '#ff3b30';

type Mood = 'walk' | 'hot' | 'cold' | 'stop' | 'tired' | 'cheer';
type Sticker = { kind: 'mountain' | 'pine' | 'floe' | 'dune'; x: number; y: number; s: number };

export type WalkLeg = {
  id: string;
  image: string;                                  // path under media/, via staticFile
  from: number;                                   // VO line this leg starts on
  flags: { file: string; d: string }[];           // d is already in pixels
  labels: { name: string; x: number; y: number }[];
  path: [number, number][];                       // pixels
  props: Sticker[];
  snow: number;
  mood: Mood;
};

export type WalkProps = {
  legs: WalkLeg[];
  vo: VoLine[];
  hook: { top: string; bottom: string };
  card?: { title: string; sub: string; fromLine: number; toLine: number };
  cta?: { fromLine: number; text: string };
  durationInSeconds: number;
};

// =============================================================================
// STICKERS — drawn, not photographed: two-tone faces and a ground shadow do the
// 3D reading, and nothing has to be licensed.
// =============================================================================
const Mountain: React.FC<{ x: number; y: number; s: number; o: number }> = ({ x, y, s, o }) => {
  const w = 120 * s;
  const h = 96 * s;
  return (
    <g opacity={o}>
      <ellipse cx={x} cy={y + 4 * s} rx={w * 0.62} ry={9 * s} fill="rgba(0,0,0,0.38)" />
      <path d={`M ${x} ${y - h} L ${x + w * 0.62} ${y} L ${x - w * 0.62} ${y} Z`} fill="#6c6f77" />
      <path d={`M ${x} ${y - h} L ${x + w * 0.62} ${y} L ${x} ${y} Z`} fill="#4a4d55" />
      <path d={`M ${x} ${y - h} L ${x + w * 0.22} ${y - h * 0.5}
                Q ${x + w * 0.05} ${y - h * 0.62} ${x} ${y - h * 0.48}
                Q ${x - w * 0.08} ${y - h * 0.6} ${x - w * 0.2} ${y - h * 0.52} Z`} fill="#f3f7fb" />
      <path d={`M ${x} ${y - h} L ${x + w * 0.22} ${y - h * 0.5} L ${x} ${y - h * 0.48} Z`} fill="#d7e2ee" />
    </g>
  );
};

const PineTree: React.FC<{ x: number; y: number; s: number; o: number }> = ({ x, y, s, o }) => {
  const w = 34 * s;
  const h = 62 * s;
  const tier = (k: number, top: number, spread: number) => (
    <g key={k}>
      <path d={`M ${x} ${y - h * top} L ${x + w * spread} ${y - h * (top - 0.3)} L ${x - w * spread} ${y - h * (top - 0.3)} Z`}
        fill="#2f6b3d" />
      <path d={`M ${x} ${y - h * top} L ${x + w * spread} ${y - h * (top - 0.3)} L ${x} ${y - h * (top - 0.3)} Z`}
        fill="#24532f" />
    </g>
  );
  return (
    <g opacity={o}>
      <ellipse cx={x} cy={y + 2 * s} rx={w * 0.7} ry={5 * s} fill="rgba(0,0,0,0.35)" />
      <rect x={x - 3 * s} y={y - h * 0.22} width={6 * s} height={h * 0.22} fill="#4a3526" />
      {tier(0, 0.45, 0.9)}
      {tier(1, 0.72, 0.68)}
      {tier(2, 1.0, 0.46)}
    </g>
  );
};

const IceFloe: React.FC<{ x: number; y: number; s: number; o: number }> = ({ x, y, s, o }) => (
  <g opacity={o}>
    <ellipse cx={x} cy={y} rx={52 * s} ry={22 * s} fill="#e8f3fb" />
    <ellipse cx={x + 30 * s} cy={y + 10 * s} rx={30 * s} ry={14 * s} fill="#dceaf6" />
    <ellipse cx={x - 26 * s} cy={y + 8 * s} rx={24 * s} ry={11 * s} fill="#f2f9ff" />
    <ellipse cx={x} cy={y + 3 * s} rx={52 * s} ry={22 * s} fill="none" stroke="#a9cbe4" strokeWidth={2} />
  </g>
);

// A sand dune: a soft mound with a lit face, for the hot legs.
const Dune: React.FC<{ x: number; y: number; s: number; o: number }> = ({ x, y, s, o }) => {
  const w = 130 * s;
  const h = 40 * s;
  return (
    <g opacity={o}>
      <ellipse cx={x} cy={y + 3 * s} rx={w * 0.55} ry={7 * s} fill="rgba(0,0,0,0.3)" />
      <path d={`M ${x - w / 2} ${y} Q ${x - w * 0.1} ${y - h * 1.6} ${x + w / 2} ${y} Z`} fill="#d9a55a" />
      <path d={`M ${x - w * 0.12} ${y - h * 0.78} Q ${x + w * 0.18} ${y - h * 0.5} ${x + w / 2} ${y}
                L ${x + w * 0.05} ${y} Z`} fill="#b98640" />
    </g>
  );
};

const SnowFall: React.FC<{ n: number; o: number; seed: number }> = ({ n, o, seed }) => {
  const f = useCurrentFrame();
  const flakes = [];
  for (let i = 0; i < n; i++) {
    const r = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
    const rx = r - Math.floor(r);
    const r2 = Math.sin(i * 39.3468 + seed * 11.135) * 24634.6345;
    const ry = r2 - Math.floor(r2);
    const speed = 40 + ry * 90;
    const x = rx * W + Math.sin(f / 26 + i) * 22;
    const y = ((ry * H + (f / FPS) * speed) % (H + 60)) - 30;
    flakes.push(<circle key={i} cx={x} cy={y} r={1.4 + ry * 3.2} fill="#fff" opacity={0.28 + ry * 0.34} />);
  }
  return <g opacity={o}>{flakes}</g>;
};

// The walker reacts to each place: sweat in the desert, shivering in the cold,
// a dead stop at the water, a trudge after it, arms up at the finish.
const Walker: React.FC<{ x: number; y: number; s: number; mood: Mood }> = ({ x, y, s, mood }) => {
  const f = useCurrentFrame();
  const moving = mood !== 'stop' && mood !== 'cheer';
  const swing = moving ? Math.sin(f / 3.2) * 0.5 : 0;
  const cx = x + (mood === 'cold' ? Math.sin(f * 2.1) * 1.6 * s : 0);
  const c = '#fff';
  const lw = 7 * s;
  const headR = 13 * s;
  const headY = y - 46 * s;
  const eyeY = headY - headR * 0.18;
  const eyeDx = headR * 0.38;
  const ink = '#12161c';
  const eyeR = mood === 'stop' ? 3.4 * s : mood === 'cold' || mood === 'tired' ? 1.5 * s : 2.4 * s;
  const browTilt = mood === 'stop' ? -16 : mood === 'hot' || mood === 'tired' ? 12 : mood === 'cold' ? 16 : 0;
  const browY = eyeY - headR * 0.52;
  const browW = headR * 0.42;
  const my = headY + headR * 0.46;
  const mouth = mood === 'stop' ? { rx: 4.2 * s, ry: 5.2 * s }
    : mood === 'hot' || mood === 'tired' ? { rx: 4.6 * s, ry: 3.0 * s } : null;
  const armUp = mood === 'cheer' || mood === 'stop';
  const armY = armUp ? y - 44 * s : y - 16 * s;
  const armX = armUp ? 12 * s : 14 * s;
  const tilt = (browTilt * Math.PI) / 180;

  return (
    <g style={{ filter: `drop-shadow(0 0 10px ${ALERT}) drop-shadow(0 0 22px ${ALERT})` }}>
      <circle cx={cx} cy={headY} r={headR} fill={c} />
      {[-1, 1].map((side) => (
        <line key={side}
          x1={cx + side * eyeDx - browW / 2} y1={browY + (Math.sin(tilt) * browW * side) / 2}
          x2={cx + side * eyeDx + browW / 2} y2={browY - (Math.sin(tilt) * browW * side) / 2}
          stroke={ink} strokeWidth={1.8 * s} strokeLinecap="round" />
      ))}
      <circle cx={cx - eyeDx} cy={eyeY} r={eyeR} fill={ink} />
      <circle cx={cx + eyeDx} cy={eyeY} r={eyeR} fill={ink} />
      {mouth ? (
        <ellipse cx={cx} cy={my} rx={mouth.rx} ry={mouth.ry} fill={ink} />
      ) : (
        <path d={mood === 'cheer'
          ? `M ${cx - 5 * s} ${my - 1.4 * s} Q ${cx} ${my + 4 * s} ${cx + 5 * s} ${my - 1.4 * s}`
          : `M ${cx - 4.4 * s} ${my} L ${cx + 4.4 * s} ${my}`}
          fill="none" stroke={ink} strokeWidth={1.9 * s} strokeLinecap="round" />
      )}
      <line x1={cx} y1={y - 33 * s} x2={cx} y2={y - 12 * s} stroke={c} strokeWidth={lw} strokeLinecap="round" />
      <line x1={cx} y1={y - 28 * s} x2={cx + armX * (armUp ? 1 : Math.cos(swing))} y2={armY}
        stroke={c} strokeWidth={lw} strokeLinecap="round" />
      <line x1={cx} y1={y - 28 * s} x2={cx - armX * (armUp ? 1 : Math.cos(swing))} y2={armY}
        stroke={c} strokeWidth={lw} strokeLinecap="round" />
      <line x1={cx} y1={y - 12 * s} x2={cx + 12 * s * Math.sin(swing)} y2={y} stroke={c} strokeWidth={lw} strokeLinecap="round" />
      <line x1={cx} y1={y - 12 * s} x2={cx - 12 * s * Math.sin(swing)} y2={y} stroke={c} strokeWidth={lw} strokeLinecap="round" />
      {mood === 'hot' && [0, 1].map((i) => {
        const t = ((f + i * 22) % 44) / 44;
        return (
          <path key={i}
            d={`M ${cx + (i ? 15 : -15) * s} ${headY - 4 * s + t * 22 * s}
                c ${2.4 * s} ${3 * s} ${2.4 * s} ${5 * s} 0 ${5 * s}
                c ${-2.4 * s} 0 ${-2.4 * s} ${-2 * s} 0 ${-5 * s} Z`}
            fill="#9ad8ff" opacity={(1 - t) * 0.9} />
        );
      })}
      {mood === 'cold' && [0, 1, 2].map((i) => (
        <text key={i} x={cx + (i - 1) * 11 * s} y={headY - 17 * s - ((f / 2 + i * 9) % 18) * s}
          fontSize={9 * s} fill="#cfe9ff" opacity={0.75} textAnchor="middle">*</text>
      ))}
      {mood === 'stop' && (
        <text x={cx} y={headY - 19 * s} fontSize={20 * s} fill={ALERT} textAnchor="middle"
          style={{ fontWeight: 700 }}>!</text>
      )}
    </g>
  );
};

const LegView: React.FC<{ leg: WalkLeg; t: number; zoom: number }> = ({ leg, t, zoom }) => {
  const pts = leg.path;
  const segLens = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  const total = Math.max(1, segLens.reduce((a, b) => a + b, 0));
  const drawn = total * t;
  let walk: [number, number] = pts[0] ?? [W / 2, H / 2];
  let acc = 0;
  for (let i = 0; i < segLens.length; i++) {
    if (acc + segLens[i] >= drawn) {
      const k = segLens[i] ? (drawn - acc) / segLens[i] : 0;
      walk = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
      break;
    }
    acc += segLens[i];
    walk = pts[i + 1];
  }
  const line = pts.map((q, i) => `${i ? 'L' : 'M'} ${q[0]} ${q[1]}`).join(' ');

  return (
    <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
      <Img src={staticFile(leg.image)} style={{ width: W, height: H, objectFit: 'cover' }} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
        {leg.flags.map((fl, i) => (
          <g key={i} opacity={EASE_OUT(prog(t, 0, 0.18))}>
            <defs>
              <clipPath id={`clip-${leg.id}-${i}`}>
                <path d={fl.d} />
              </clipPath>
            </defs>
            <image href={staticFile(fl.file)} x={-200} y={-200} width={W + 400} height={H + 400}
              preserveAspectRatio="xMidYMid slice" clipPath={`url(#clip-${leg.id}-${i})`} opacity={0.5} />
            <path d={fl.d} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={3} />
          </g>
        ))}
        {leg.props.map((pr, i) => {
          const o = EASE_OUT(prog(t, 0.08 + i * 0.06, 0.35 + i * 0.06));
          if (pr.kind === 'mountain') return <Mountain key={i} x={pr.x} y={pr.y} s={pr.s} o={o} />;
          if (pr.kind === 'pine') return <PineTree key={i} x={pr.x} y={pr.y} s={pr.s} o={o} />;
          if (pr.kind === 'dune') return <Dune key={i} x={pr.x} y={pr.y} s={pr.s} o={o} />;
          return <IceFloe key={i} x={pr.x} y={pr.y} s={pr.s} o={o} />;
        })}
        {leg.snow ? <SnowFall n={leg.snow} o={EASE_OUT(prog(t, 0, 0.25))} seed={leg.from + 1} /> : null}
        {pts.length > 1 && (
          <>
            <path d={line} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={16} strokeLinecap="round"
              strokeLinejoin="round" strokeDasharray={total} strokeDashoffset={total * (1 - t)} />
            <path d={line} fill="none" stroke={ROUTE} strokeWidth={9} strokeLinecap="round"
              strokeLinejoin="round" strokeDasharray={total} strokeDashoffset={total * (1 - t)} />
          </>
        )}
        <Walker x={walk[0]} y={walk[1]} s={2.5} mood={leg.mood} />
      </svg>
      {leg.labels.map((lb) => (
        <div key={lb.name} style={{
          position: 'absolute', left: lb.x, top: lb.y, transform: 'translate(-50%,-50%)',
          background: 'rgba(8,10,14,0.82)', border: '2px solid rgba(255,255,255,0.35)',
          borderRadius: 10, padding: '6px 14px', fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 700, fontSize: 30, color: '#fff', letterSpacing: 1, whiteSpace: 'nowrap',
          opacity: EASE_OUT(prog(t, 0.05, 0.3)),
        }}>{lb.name}</div>
      ))}
    </AbsoluteFill>
  );
};

// The arrow is drawn, not typed: the Linux machine that renders in the cloud
// has no font with "→", and the first cloud render read "India   USA".
const HookArrow: React.FC = () => (
  <svg viewBox="0 0 64 32" style={{
    width: '0.9em', height: '0.45em', margin: '0 0.2em', verticalAlign: '0.14em',
    overflow: 'visible', filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.85))',
  }}>
    <path d="M4 16 H54 M40 4 L58 16 L40 28" fill="none" stroke="currentColor"
      strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GeoWalk: React.FC<Partial<WalkProps>> = ({
  legs = [], vo = [], hook = { top: '', bottom: '' }, card, cta, durationInSeconds = 40,
}) => {
  const f = useCurrentFrame();
  const END = Math.round(durationInSeconds * FPS);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * FPS);

  const starts = legs.map((l) => cue(l.from));
  const ends = starts.map((s, i) => (i + 1 < starts.length ? starts[i + 1] : END));

  const cardIn = card ? cue(card.fromLine) : END;
  const cardOut = card ? cue(card.toLine) : END;
  const cardT = card ? EASE_OUT(prog(f, cardIn, cardIn + 16)) * (1 - prog(f, cardOut - 10, cardOut)) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#05070b' }}>
      {legs.map((leg, i) => {
        const inAt = starts[i];
        const outAt = ends[i];
        if (f < inAt - 14 || f > outAt + 6) return null;
        const o = prog(f, inAt - 12, inAt + 4) * (1 - prog(f, outAt - 8, outAt + 4));
        const t = EASE_INOUT(prog(f, inAt, Math.max(inAt + 20, outAt - 6)));
        const zoom = 1.04 + 0.1 * prog(f, inAt - 10, outAt);
        return (
          <AbsoluteFill key={leg.id} style={{ opacity: i === 0 ? 1 - prog(f, outAt - 8, outAt + 4) : o }}>
            <LegView leg={leg} t={t} zoom={zoom} />
          </AbsoluteFill>
        );
      })}

      {/* the question sits over the opening frame — frame 0 is the thumbnail */}
      <div style={{
        position: 'absolute', top: 210, left: 60, right: 60, textAlign: 'center',
        fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 86, lineHeight: 1.05,
        color: '#fff', textShadow: '0 6px 30px rgba(0,0,0,0.85)',
        opacity: 1 - prog(f, cue(1), cue(1) + 12),
      }}>
        {hook.top.split('→').map((part, i, all) => (
          <React.Fragment key={i}>{part.trim()}{i < all.length - 1 && <HookArrow />}</React.Fragment>
        ))}<br />
        <span style={{ color: ROUTE }}>{hook.bottom}</span>
      </div>

      {card && cardT > 0.01 && (
        <div style={{
          position: 'absolute', top: 250, left: 0, right: 0, textAlign: 'center',
          opacity: cardT, transform: `scale(${0.9 + 0.1 * cardT})`,
        }}>
          <div style={{
            display: 'inline-block', background: 'rgba(10,10,12,0.72)',
            border: `3px solid ${ALERT}`, borderRadius: 16, padding: '14px 28px',
            fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 72,
            color: '#fff', textShadow: `0 0 26px ${ALERT}`,
          }}>{card.title}</div>
          <div style={{
            marginTop: 14, fontFamily: 'JetBrains Mono, monospace', fontSize: 34,
            color: '#fff', textShadow: '0 4px 18px rgba(0,0,0,0.9)',
          }}>{card.sub}</div>
        </div>
      )}

      {cta && <EndCard from={cue(cta.fromLine)} text={cta.text} />}

      <Captions lines={vo} y={1560} accent={ROUTE} maxWords={3} size={58} plate />
    </AbsoluteFill>
  );
};

export default GeoWalk;
