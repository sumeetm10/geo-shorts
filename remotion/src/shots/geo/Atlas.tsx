import React from 'react';
import { ROUTE } from './parts';

// =============================================================================
// Atlas - AtlasOnFoot's own walker. Safari hat with the channel's yellow band,
// red backpack with a rolled map, teal shirt. A real walk cycle (thigh + shin,
// knee bends on the forward swing; arms swing against the legs; the body bobs
// on each step), eyes that blink, and a face that acts:
//   mood "wave"    big smile, one arm waving (the start)
//   mood "walk"    content smile, looking ahead
//   mood "shocked" round mouth, raised brows, a sweat drop (the sea in the way)
//   mood "cheer"   grin, both arms up (made it)
// `t` is the frame; `walking` 0..1 blends from standing to the full stride.
// `left` turns him to face the way he is going.
// =============================================================================
export type Mood = 'wave' | 'walk' | 'shocked' | 'cheer';

const SKIN = '#e9b68c'; const PANTS = '#2b3a55'; const SHIRT = '#1fa58f'; const BOOT = '#5a3a22';

const Limb: React.FC<{ x: number; y: number; a1: number; a2: number; l1: number; l2: number; w: number; color: string; foot?: boolean }> = ({
  x, y, a1, a2, l1, l2, w, color, foot }) => {
  // angles in degrees from straight down; positive swings toward +x (forward)
  const r1 = (a1 * Math.PI) / 180; const r2 = ((a1 + a2) * Math.PI) / 180;
  const kx = x + Math.sin(r1) * l1; const ky = y + Math.cos(r1) * l1;
  const fx = kx + Math.sin(r2) * l2; const fy = ky + Math.cos(r2) * l2;
  return (
    <g>
      <path d={`M ${x} ${y} L ${kx} ${ky} L ${fx} ${fy}`} stroke="#000" strokeWidth={w + 4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M ${x} ${y} L ${kx} ${ky} L ${fx} ${fy}`} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {foot && <ellipse cx={fx + 4} cy={fy + 1} rx={8} ry={5} fill={BOOT} stroke="#000" strokeWidth={2} />}
      {!foot && <circle cx={fx} cy={fy} r={w * 0.6} fill={SKIN} stroke="#000" strokeWidth={1.5} />}
    </g>
  );
};

export const Atlas: React.FC<{ x: number; y: number; s: number; t: number; walking?: number; mood?: Mood; left?: boolean }> = ({
  x, y, s, t, walking = 1, mood = 'walk', left = false }) => {
  const ph = t * 0.42;                                   // stride phase
  const sw = Math.sin(ph) * walking;
  const knee = (p: number) => 38 * Math.max(0, Math.cos(p)) * walking;  // bend while the leg swings forward
  const bob = -3.5 * Math.abs(Math.sin(ph)) * walking + 1.5 * walking;
  const blink = (t % 95) < 4;
  const hipY = -36 + bob; const shY = -70 + bob;
  const armA = (p: number) => -26 * Math.sin(p) * walking;
  return (
    <g transform={`translate(${x} ${y}) scale(${left ? -s : s} ${s})`}>
      <ellipse cx={0} cy={2} rx={22} ry={6} fill="#000" opacity={0.35} />
      {/* far leg and arm (darker) */}
      <Limb x={-2} y={hipY} a1={-26 * Math.sin(ph + Math.PI) * walking} a2={-knee(ph + Math.PI)} l1={18} l2={18} w={8} color="#1f2a40" foot />
      {mood === 'cheer'
        ? <Limb x={-8} y={shY + 4} a1={-160} a2={-15} l1={14} l2={13} w={6} color="#c99872" />
        : <Limb x={-4} y={shY + 4} a1={armA(ph + Math.PI)} a2={14} l1={14} l2={13} w={6} color="#c99872" />}
      {/* backpack with a rolled map */}
      <rect x={-27} y={shY - 4} width={20} height={34} rx={7} fill="#e2452b" stroke="#000" strokeWidth={2} />
      <rect x={-29} y={shY - 12} width={24} height={9} rx={4.5} fill="#f2e2b8" stroke="#000" strokeWidth={2} />
      {/* body */}
      <rect x={-12} y={shY - 4} width={24} height={40} rx={10} fill={SHIRT} stroke="#000" strokeWidth={2} />
      {/* near leg */}
      <Limb x={2} y={hipY} a1={-26 * Math.sin(ph) * walking} a2={-knee(ph)} l1={18} l2={18} w={8} color={PANTS} foot />
      {/* near arm: walking swing, a wave, or up in a cheer */}
      {mood === 'wave' && <Limb x={4} y={shY + 4} a1={150 + 18 * Math.sin(t * 0.5)} a2={20 * Math.sin(t * 0.5)} l1={14} l2={13} w={6} color={SKIN} />}
      {mood === 'shocked' && <Limb x={4} y={shY + 4} a1={120} a2={60} l1={14} l2={13} w={6} color={SKIN} />}
      {mood === 'walk' && <Limb x={4} y={shY + 4} a1={armA(ph)} a2={14} l1={14} l2={13} w={6} color={SKIN} />}
      {/* head */}
      <g transform={`translate(2 ${shY - 18 + (mood === 'shocked' ? -2 : 0)})`}>
        <circle cx={0} cy={0} r={14} fill={SKIN} stroke="#000" strokeWidth={2} />
        {/* eyes: blink; wide when shocked */}
        {[-1, 5].map((ex, i) => (
          <ellipse key={i} cx={ex + 4} cy={-2} rx={mood === 'shocked' ? 2.6 : 2} ry={blink ? 0.4 : mood === 'shocked' ? 3.4 : 2.6} fill="#000" />
        ))}
        {/* brows */}
        <path d={mood === 'shocked' ? 'M 0 -9 L 6 -10 M 8 -10 L 13 -9' : 'M 0 -7 L 6 -7.5 M 8 -7.5 L 13 -7'} stroke="#3a2414" strokeWidth={1.6} fill="none" />
        {/* mouth */}
        {mood === 'shocked' && <ellipse cx={7} cy={7} rx={3} ry={4} fill="#5a1d14" stroke="#000" strokeWidth={1.2} />}
        {mood === 'walk' && <path d="M 3 6 Q 7 9 11 6" stroke="#5a1d14" strokeWidth={2} fill="none" strokeLinecap="round" />}
        {(mood === 'wave' || mood === 'cheer') && <path d="M 2 5 Q 7 12 12 5 Z" fill="#5a1d14" stroke="#000" strokeWidth={1.2} />}
        <circle cx={11} cy={3} r={2.4} fill="#ff8a8a" opacity={0.5} />
        {mood === 'shocked' && <path d={`M -12 ${-4 + (t % 30) * 0.3} q 3 -6 5 0 q -2 4 -5 0 Z`} fill="#9fd8ff" stroke="#000" strokeWidth={1} />}
        {/* safari hat with the yellow channel band */}
        <ellipse cx={0} cy={-10} rx={21} ry={5} fill="#c9a66b" stroke="#000" strokeWidth={2} />
        <path d="M -11 -11 Q 0 -30 12 -11 Z" fill="#c9a66b" stroke="#000" strokeWidth={2} />
        <rect x={-11} y={-15} width={23} height={4} fill={ROUTE} />
      </g>
      {mood === 'cheer' && <Limb x={8} y={shY + 4} a1={160} a2={15} l1={14} l2={13} w={6} color={SKIN} />}
    </g>
  );
};
