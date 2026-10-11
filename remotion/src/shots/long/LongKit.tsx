import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { GlobeView } from '../geo/Globe';
import { MONO, ROUTE, SANS, lerp, rng } from '../geo/parts';

// =============================================================================
// Shared pieces for the 16:9 long-form chapters (make_long.py). Each chapter is
// its own composition; this kit gives them the same frame: starfield, chapter
// tag, headline style, captions and a short fade in/out so the joins between
// chapters are soft.
// =============================================================================
export const LW = 1920;
export const LH = 1080;
export const longConfig = (id: string, secs: number) => ({ id, durationInSeconds: secs, fps: 30, width: LW, height: LH });

export type LongProps = {
  vo: VoLine[]; at: Record<string, number>; durationInSeconds: number; chapter: number; chapterName: string;
};

export const timeline = (f: number, vo: VoLine[], dur: number) => {
  const END = Math.round(dur * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? dur) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  return { END, cue, lineEnd, within, last: vo.length - 1 };
};

const STARS = (() => { const r = rng(1916); return Array.from({ length: 420 }, () => [r() * LW, r() * LH, 0.4 + r() * 1.6, 0.25 + r() * 0.75]); })();
export const Stars: React.FC<{ drift?: number; o?: number; tint?: string }> = ({ drift = 0, o = 1, tint = '#0a1430' }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 55%, ${tint} 0%, #02030a 70%)` }}>
    <svg width={LW} height={LH} style={{ position: 'absolute', inset: 0, opacity: o }}>
      {STARS.map(([x, y, r, a], i) => <circle key={i} cx={((x - drift * r * 0.6) % LW + LW) % LW} cy={y} r={r} fill="#fff" opacity={a} />)}
    </svg>
  </AbsoluteFill>
);

// GlobeView draws on a 1080x1920 canvas; place that canvas so the globe's centre lands at (x, y)
export const GlobeAt: React.FC<{ x: number; y: number; R: number; lon0: number; lat0: number; id: string; night?: number; frost?: number }> = ({
  x, y, R, lon0, lat0, id, night = 0, frost = 0 }) => (
  <div style={{ position: 'absolute', left: x - 540, top: y - 960, width: 1080, height: 1920 }}>
    <GlobeView id={id} cx={540} cy={960} R={R} lon0={lon0} lat0={lat0} overlay={night || frost ? { night, frost } : undefined} />
  </div>
);

export const Headline: React.FC<{ text: string; sub?: string; top?: number; size?: number; color?: string; subColor?: string; o?: number; align?: 'center' | 'left'; left?: number }> = ({
  text, sub, top = 70, size = 76, color = '#fff', subColor = ROUTE, o = 1, align = 'center', left = 0 }) => (
  <div style={{ position: 'absolute', top, left: align === 'center' ? 0 : left, right: align === 'center' ? 0 : undefined, textAlign: align, opacity: o }}>
    <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: size, color, lineHeight: 1.05, textShadow: '0 6px 30px #000' }}>{text}</div>
    {sub && <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: size * 0.48, color: subColor, marginTop: 8, textShadow: '0 4px 20px #000' }}>{sub}</div>}
  </div>
);

export const Counter: React.FC<{ value: string; label: string; x: number; y: number; color?: string; size?: number; o?: number }> = ({
  value, label, x, y, color = '#fff', size = 96, o = 1 }) => (
  <div style={{ position: 'absolute', left: x - 400, width: 800, top: y, textAlign: 'center', opacity: o }}>
    <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: size, color, textShadow: '0 6px 30px #000' }}>{value}</div>
    <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: size * 0.32, letterSpacing: 4, color: ROUTE }}>{label}</div>
  </div>
);

export const Stamp: React.FC<{ text: string; t: number; color?: string; top?: number; size?: number; rot?: number }> = ({
  text, t, color = '#5dff8a', top = 420, size = 72, rot = -6 }) => t <= 0 ? null : (
  <div style={{ position: 'absolute', top, left: 0, right: 0, textAlign: 'center', opacity: EASE_OUT(Math.min(1, t * 3)),
    transform: `rotate(${rot}deg) scale(${lerp(1.5, 1, EASE_OUT(Math.min(1, t * 2)))})` }}>
    <span style={{ display: 'inline-block', border: `9px solid ${color}`, color, fontFamily: SANS, fontWeight: 800, fontSize: size,
      padding: '4px 26px', borderRadius: 14, background: 'rgba(0,0,0,0.55)' }}>{text}</span>
  </div>
);

// the frame every chapter sits in: fade in/out, chapter tag, captions
export const LongFrame: React.FC<{ vo: VoLine[]; dur: number; chapter: number; name: string; children: React.ReactNode }> = ({
  vo, dur, chapter, name, children }) => {
  const f = useCurrentFrame();
  const END = Math.round(dur * 30);
  const fade = Math.min(prog(f, 0, 10), 1 - prog(f, END - 10, END));
  const tag = Math.min(EASE_OUT(prog(f, 4, 18)), 1 - prog(f, 100, 115));
  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <AbsoluteFill style={{ opacity: fade }}>
        {children}
        {chapter > 0 && tag > 0 && (
          <div style={{ position: 'absolute', left: 60, top: 54, opacity: tag, transform: `translateX(${(1 - tag) * -60}px)` }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 24, letterSpacing: 6, color: ROUTE }}>CHAPTER {chapter}</div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: '#fff', textShadow: '0 4px 20px #000' }}>{name.toUpperCase()}</div>
          </div>
        )}
        <Captions lines={vo} y={930} accent={ROUTE} maxWords={6} size={44} plate />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
