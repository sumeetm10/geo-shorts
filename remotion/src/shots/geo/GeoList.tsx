import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { EndCard } from './EndCard';

// =============================================================================
// "Does your country...?" — a question that stays on screen, and a quick zoom
// to each answer: the country wearing its flag, its neighbour beside it.
//
// The facts are a curated, checked list (topics.py) and the narration is built
// from them by template, not written by a model — a list of countries is exactly
// the kind of thing a model gets confidently, quietly wrong.
// =============================================================================
export const compositionConfig = {
  id: 'GeoList',
  durationInSeconds: 20,
  fps: 30,
  width: 1080,
  height: 1920,
};

const FPS = 30;
const W = 1080;
const H = 1920;
const GOLD = '#ffe14d';

export type ListItem = {
  id: string;
  image: string;
  from: number;
  flags: { file: string; d: string; main: boolean }[];
  labels: { name: string; x: number; y: number; main: boolean }[];
  // countries too small to see from orbit (Vatican, Monaco) get a pin instead
  pins?: { x: number; y: number }[];
  note?: string;
};

export type ListProps = {
  items: ListItem[];
  vo: VoLine[];
  title: string;
  cta?: { fromLine: number; text: string };
  durationInSeconds: number;
};

const ItemView: React.FC<{ item: ListItem; t: number; zoom: number }> = ({ item, t, zoom }) => (
  <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
    <Img src={staticFile(item.image)} style={{ width: W, height: H, objectFit: 'cover' }} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
      {item.flags.map((fl, i) => (
        <g key={i} opacity={EASE_OUT(prog(t, fl.main ? 0 : 0.2, fl.main ? 0.2 : 0.45))}>
          <defs>
            <clipPath id={`clip-${item.id}-${i}`}>
              <path d={fl.d} />
            </clipPath>
          </defs>
          <image href={staticFile(fl.file)} x={-200} y={-200} width={W + 400} height={H + 400}
            preserveAspectRatio="xMidYMid slice" clipPath={`url(#clip-${item.id}-${i})`}
            opacity={fl.main ? 0.72 : 0.42} />
          <path d={fl.d} fill="none" stroke={fl.main ? GOLD : 'rgba(255,255,255,0.7)'}
            strokeWidth={fl.main ? 5 : 3} />
        </g>
      ))}
      {(item.pins ?? []).map((pn, i) => (
        <g key={`pin-${i}`} opacity={EASE_OUT(prog(t, 0.05, 0.25))}>
          <circle cx={pn.x} cy={pn.y} r={34} fill="none" stroke={GOLD} strokeWidth={5} />
          <circle cx={pn.x} cy={pn.y} r={11} fill={GOLD} />
        </g>
      ))}
    </svg>
    {item.labels.map((lb) => (
      <div key={lb.name} style={{
        position: 'absolute', left: lb.x, top: lb.y, transform: 'translate(-50%,-50%)',
        background: lb.main ? 'rgba(12,12,14,0.9)' : 'rgba(8,10,14,0.75)',
        border: `2px solid ${lb.main ? GOLD : 'rgba(255,255,255,0.35)'}`,
        borderRadius: 10, padding: lb.main ? '8px 18px' : '5px 12px',
        fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700,
        fontSize: lb.main ? 38 : 26, color: '#fff', whiteSpace: 'nowrap',
        opacity: EASE_OUT(prog(t, lb.main ? 0.05 : 0.25, lb.main ? 0.25 : 0.5)),
      }}>{lb.name}</div>
    ))}
  </AbsoluteFill>
);

const GeoList: React.FC<Partial<ListProps>> = ({ items = [], vo = [], title = '', cta, durationInSeconds = 20 }) => {
  const f = useCurrentFrame();
  const END = Math.round(durationInSeconds * FPS);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * FPS);
  const starts = items.map((it) => cue(it.from));
  const ends = starts.map((s, i) => (i + 1 < starts.length ? starts[i + 1] : END));
  const count = items.filter((_, i) => f >= starts[i]).length;

  return (
    <AbsoluteFill style={{ backgroundColor: '#05070b' }}>
      {items.map((item, i) => {
        const inAt = starts[i];
        const outAt = ends[i];
        if (f < inAt - 12 || f > outAt + 6) return null;
        const o = i === 0 ? 1 - prog(f, outAt - 6, outAt + 4)
          : prog(f, inAt - 10, inAt + 3) * (1 - prog(f, outAt - 6, outAt + 4));
        const t = EASE_INOUT(prog(f, inAt, Math.max(inAt + 15, outAt - 4)));
        return (
          <AbsoluteFill key={item.id} style={{ opacity: o }}>
            <ItemView item={item} t={t} zoom={1.03 + 0.08 * prog(f, inAt - 8, outAt)} />
          </AbsoluteFill>
        );
      })}

      {/* the question never leaves: it is what the viewer is answering */}
      <div style={{
        position: 'absolute', top: 150, left: 50, right: 50, textAlign: 'center',
        fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 70, lineHeight: 1.08,
        color: '#fff', textShadow: '0 6px 28px rgba(0,0,0,0.9)',
        background: 'rgba(5,7,11,0.55)', borderRadius: 22, padding: '18px 22px',
      }}>{title}</div>

      {count > 0 && count <= items.length && (
        <div style={{
          position: 'absolute', top: 1335, right: 60,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 34, color: GOLD,
          background: 'rgba(5,7,11,0.75)', borderRadius: 12, padding: '6px 16px',
        }}>{Math.min(count, items.length)} / {items.length}</div>
      )}

      {cta && <EndCard from={cue(cta.fromLine)} text={cta.text} />}

      <Captions lines={vo} y={1560} accent={GOLD} maxWords={3} size={58} plate />
    </AbsoluteFill>
  );
};

export default GeoList;
