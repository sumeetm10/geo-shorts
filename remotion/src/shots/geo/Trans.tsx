import React from 'react';
import { AbsoluteFill } from 'remotion';
import { EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';

// =============================================================================
// Scene transitions for the quality-first Shorts (2026-10-09): scenes no longer
// just cross-fade. <Scene> shows its children between frames `a` and `b` with a
// cut-in and a cut-out of the chosen kind:
//   zoom  punches in from 118% with a blur, leaves shrinking slightly
//   push  slides up in from below, leaves upward
//   whip  swipes in from the right with motion blur, leaves to the left
// <Flash> is a short white flash for a big reveal.
// =============================================================================
export type Kind = 'zoom' | 'push' | 'whip';
const IN = 9; const OUT = 7;

export const Scene: React.FC<{ f: number; a: number; b: number; kind?: Kind; out?: Kind; children: React.ReactNode; bg?: string }> = ({
  f, a, b, kind = 'zoom', out, children, bg }) => {
  if (f < a - 1 || f > b + OUT) return null;
  const tin = EASE_OUT(prog(f, a - 1, a + IN));          // 0 -> 1 entering
  const tout = EASE_INOUT(prog(f, b - 1, b + OUT));      // 0 -> 1 leaving
  const ko = out ?? kind;
  let tf = ''; let blur = 0; let op = 1;
  if (tin < 1) {
    if (kind === 'zoom') { tf += ` scale(${1.18 - 0.18 * tin})`; blur += 12 * (1 - tin); op *= tin; }
    if (kind === 'push') { tf += ` translateY(${(1 - tin) * 420}px)`; op *= 0.4 + 0.6 * tin; }
    if (kind === 'whip') { tf += ` translateX(${(1 - tin) * 1080}px)`; blur += 18 * (1 - tin); }
  }
  if (tout > 0) {
    if (ko === 'zoom') { tf += ` scale(${1 - 0.1 * tout})`; blur += 8 * tout; op *= 1 - tout; }
    if (ko === 'push') { tf += ` translateY(${-tout * 420}px)`; op *= 1 - 0.6 * tout; }
    if (ko === 'whip') { tf += ` translateX(${-tout * 1080}px)`; blur += 18 * tout; }
  }
  return (
    <AbsoluteFill style={{ transform: tf || undefined, filter: blur > 0.3 ? `blur(${blur}px)` : undefined, opacity: op, background: bg }}>
      {children}
    </AbsoluteFill>
  );
};

export const Flash: React.FC<{ f: number; at: number; len?: number; color?: string }> = ({ f, at, len = 8, color = '#fff' }) => {
  const t = prog(f, at - 1, at + len);
  if (t <= 0 || t >= 1) return null;
  return <AbsoluteFill style={{ background: color, opacity: 0.85 * (1 - t) * Math.min(1, t * 6) }} />;
};
