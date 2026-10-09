import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { Card } from './BlackHole';
import { EndCard } from './EndCard';
import { SpaceBg } from './Globe';
import { ALERT, H, MONO, ROUTE, SANS, W, lerp } from './parts';

// =============================================================================
// "How big is the Sun, really?" Everything here is drawn to scale unless marked:
// the Moon's orbit (384,400 km out) inside a 1,391,400 km Sun - twice over,
// almost; 109 Earths across it; the disk filling with Earths (~1.3 million by
// volume); a balance tipped by 99.86% of the Solar System's mass; the 0.14% left
// over, magnified (mostly Jupiter); then the Sun shrinking to a dot beside
// Betelgeuse (640-764 times its radius) and Betelgeuse, set in the Sun's place,
// swallowing the orbits out past Mars. Script and sources: make_whatif.py "sunsize".
// =============================================================================
export const compositionConfig = {
  id: 'SunSize',
  durationInSeconds: 42,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string; badge: string };
  at: { wide: number; fill: number; mass: number; rest: number; small: number; betel: number; swallow: number };
  durationInSeconds: number;
};

const SR = 470;                                  // the Sun's radius on screen
const CX = 540; const CY = 1000;
const KM = SR / 695700;                          // px per km
const ORBIT = 384400 * KM;                       // the Moon's orbit radius
const ER = SR / 109;                             // Earth's radius

// a big Sun: limb-darkened disk with turbulence for granulation
const BigSun: React.FC<{ x: number; y: number; r: number; id: string; red?: boolean }> = ({ x, y, r, id, red = false }) => (
  <g>
    <defs>
      <radialGradient id={`bs-${id}`} cx="0.5" cy="0.5" r="0.5">
        {red ? (
          <>
            <stop offset="0" stopColor="#ffb07a" /><stop offset="0.6" stopColor="#e8582a" />
            <stop offset="0.9" stopColor="#a8261a" /><stop offset="1" stopColor="#6e1410" />
          </>
        ) : (
          <>
            <stop offset="0" stopColor="#fff7d0" /><stop offset="0.55" stopColor="#ffc23d" />
            <stop offset="0.88" stopColor="#ff8a1a" /><stop offset="1" stopColor="#d9500c" />
          </>
        )}
      </radialGradient>
      <radialGradient id={`bg-${id}`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0.75" stopColor={red ? '#ff5a2a' : '#ffb347'} stopOpacity={0.55} />
        <stop offset="1" stopColor={red ? '#ff5a2a' : '#ffb347'} stopOpacity={0} />
      </radialGradient>
      <filter id={`gr-${id}`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency={red ? 0.006 : 0.03} numOctaves={2} seed={red ? 9 : 3} />
        <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.92  0 0 0 0 0.6  1.8 0 0 0 -0.75" />
        <feComposite in2="SourceGraphic" operator="in" />
      </filter>
    </defs>
    <circle cx={x} cy={y} r={r * 1.3} fill={`url(#bg-${id})`} />
    <circle cx={x} cy={y} r={r} fill={`url(#bs-${id})`} />
    <circle cx={x} cy={y} r={r} fill="#fff" filter={`url(#gr-${id})`} opacity={red ? 0.3 : 0.35} />
  </g>
);

const Planet: React.FC<{ x: number; y: number; r: number; c: string; bands?: boolean; rings?: boolean }> = ({ x, y, r, c, bands, rings }) => (
  <g>
    {rings && <ellipse cx={x} cy={y} rx={r * 2.1} ry={r * 0.5} fill="none" stroke="#d9c79a" strokeWidth={r * 0.22} opacity={0.85} />}
    <circle cx={x} cy={y} r={r} fill={c} />
    {bands && [-0.5, -0.2, 0.15, 0.45].map((k, i) => (
      <rect key={i} x={x - r * Math.sqrt(1 - k * k)} y={y + k * r - r * 0.06} width={2 * r * Math.sqrt(1 - k * k)} height={r * 0.12}
        fill={i % 2 ? '#a8754a' : '#e8d2b0'} opacity={0.7} />
    ))}
    {rings && <path d={`M ${x - r * 2.1} ${y} A ${r * 2.1} ${r * 0.5} 0 0 0 ${x + r * 2.1} ${y}`} fill="none" stroke="#d9c79a"
      strokeWidth={r * 0.22} opacity={0.85} />}
    <circle cx={x} cy={y} r={r} fill="url(#shade)" />
  </g>
);

const SunSize: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '', badge: '' }, at, durationInSeconds = 42 }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const span = (a: number, b: number) => prog(f, cue(a) - 6, cue(a) + 8) * (1 - prog(f, cue(b) - 8, cue(b) + 6));
  const last = vo.length - 1;
  const moonA = f / 18;

  // ---- hook: the Moon's orbit inside the Sun, then two of them side by side
  const sHook = 1 - prog(f, cue(at.wide) - 6, cue(at.wide) + 8);
  const split = EASE_INOUT(within(0, 0.45, 0.85));
  const orbitScene = (key: string, sp: number) => (
    <>
      <SpaceBg />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <BigSun x={CX} y={CY} r={SR} id={key} />
        {[-1, 1].map((side) => {
          const ox = CX + side * ORBIT * sp;
          if (side === 1 && sp < 0.02) return null;
          return (
            <g key={side}>
              <circle cx={ox} cy={CY} r={ORBIT} fill="none" stroke="#fff" strokeWidth={4} strokeDasharray="12 10" />
              <circle cx={ox} cy={CY} r={ER} fill="#3d7fe0" stroke="#bfe0ff" strokeWidth={2} />
              <circle cx={ox + ORBIT * Math.cos(moonA)} cy={CY + ORBIT * Math.sin(moonA)} r={4} fill="#e6e6e6" />
            </g>
          );
        })}
        <text x={CX} y={CY + 40} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={30} fill="#3a1a00" opacity={1 - sp}>EARTH</text>
        <text x={CX} y={CY - ORBIT - 16} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={30} fill="#3a1a00" opacity={1 - sp}>
          THE MOON'S ORBIT</text>
      </svg>
    </>
  );

  // ---- 109 Earths across
  const sSun = span(at.wide, at.mass);
  const row = Math.round(109 * EASE_INOUT(within(at.wide, 0.1, 0.8)));
  const fillR = SR * EASE_INOUT(within(at.fill, 0.05, 0.85));
  const millions = 1.3 * Math.pow(fillR / SR, 3);

  // ---- 99.86% of the mass
  const sMass = span(at.mass, at.rest);
  const tilt = 24 * EASE_OUT(within(at.mass, 0.1, 0.5));
  const pct = 99.86 * EASE_OUT(within(at.mass, 0.1, 0.6));
  const sRest = span(at.rest, at.small);
  const lens = EASE_OUT(within(at.rest, 0.05, 0.35));

  // ---- the Sun is a small star; Betelgeuse
  const sSmall = span(at.small, at.swallow);
  const shrink = EASE_INOUT(within(at.small, 0, 1));
  const smallR = lerp(SR, 1.4, shrink);
  const grow = EASE_INOUT(within(at.betel, 0, 0.6));

  // ---- Betelgeuse in the Sun's place (85 px per AU)
  const sSw = span(at.swallow, last);
  const AU = 85;
  const bR = 3.4 * AU * EASE_INOUT(within(at.swallow, 0.15, 0.75));
  const ORBITS = [{ n: 'MERCURY', a: 0.39 }, { n: 'VENUS', a: 0.72 }, { n: 'EARTH', a: 1 }, { n: 'MARS', a: 1.52 }, { n: 'JUPITER', a: 5.2 }];
  const loopT = EASE_INOUT(prog(f, cue(last), END - 4));

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      {sHook > 0.001 && <AbsoluteFill style={{ opacity: sHook }}>{orbitScene('hook', split)}</AbsoluteFill>}

      {/* ---------------- 109 Earths across; 1.3 million inside ---------------- */}
      {sSun > 0.001 && (
        <AbsoluteFill style={{ opacity: sSun }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <pattern id="earths" width={ER * 2.15} height={ER * 2.15} patternUnits="userSpaceOnUse">
                <circle cx={ER * 1.07} cy={ER * 1.07} r={ER} fill="#3d7fe0" />
              </pattern>
            </defs>
            <BigSun x={CX} y={CY} r={SR} id="wide" />
            {f < cue(at.fill) && Array.from({ length: row }, (_, i) => (
              <circle key={i} cx={CX - SR + ER + i * 2 * ER} cy={CY} r={ER} fill="#3d7fe0" stroke="#bfe0ff" strokeWidth={0.8} />
            ))}
            {f >= cue(at.fill) && <circle cx={CX} cy={CY} r={fillR} fill="url(#earths)" />}
          </svg>
          <div style={{ position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#ffd38a' }}>
              {f < cue(at.fill) ? '1,391,400 KM WIDE' : 'FILL IT WITH EARTHS'}</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 116, color: '#fff', textShadow: '0 6px 30px #000' }}>
              {f < cue(at.fill) ? `${row} EARTHS` : `${millions.toFixed(1)} MILLION`}</div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 36, color: '#9fd0ff' }}>
              {f < cue(at.fill) ? 'SIDE BY SIDE' : 'EARTHS INSIDE (NOT ALL SHOWN)'}</div>
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- 99.86% of the mass ---------------- */}
      {sMass > 0.001 && (
        <AbsoluteFill style={{ opacity: sMass }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <radialGradient id="shade" cx="0.35" cy="0.35" r="0.75">
                <stop offset="0.5" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.55} />
              </radialGradient>
            </defs>
            {(() => {
              const a = (tilt * Math.PI) / 180; const px = 540; const py = 760; const L = 380;
              const lx = px - L * Math.cos(a); const ly = py + L * Math.sin(a);
              const rx = px + L * Math.cos(a); const ry = py - L * Math.sin(a);
              return (
                <g>
                  <path d="M 540 760 L 470 1360 L 610 1360 Z" fill="#3a4357" />
                  <rect x={400} y={1360} width={280} height={24} rx={8} fill="#2a3242" />
                  <line x1={lx} y1={ly} x2={rx} y2={ry} stroke="#c9ced8" strokeWidth={14} strokeLinecap="round" />
                  <circle cx={px} cy={py} r={16} fill="#e8edf2" />
                  {[[lx, ly], [rx, ry]].map(([x, y], i) => (
                    <g key={i}>
                      <line x1={x} y1={y} x2={x - 90} y2={y + 220} stroke="#8b93a6" strokeWidth={3} />
                      <line x1={x} y1={y} x2={x + 90} y2={y + 220} stroke="#8b93a6" strokeWidth={3} />
                      <path d={`M ${x - 120} ${y + 220} Q ${x} ${y + 270} ${x + 120} ${y + 220} Z`} fill="#5f6b85" />
                    </g>
                  ))}
                  <BigSun x={lx} y={ly + 120} r={100} id="pan" />
                  {[[-40, 6, '#c9b08a'], [-12, 4, '#e8c37a'], [10, 3, '#3d7fe0'], [28, 2.5, '#d9603a']].map(([dx, r, c], i) => (
                    <circle key={i} cx={rx + Number(dx)} cy={ry + 208 - Number(r)} r={Number(r)} fill={String(c)} />
                  ))}
                </g>
              );
            })()}
          </svg>
          <div style={{ position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#ffd38a' }}>OF THE SOLAR SYSTEM'S MASS</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 130, color: '#fff', textShadow: '0 6px 30px #000' }}>{pct.toFixed(2)}%</div>
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- the 0.14% left over ---------------- */}
      {sRest > 0.001 && (
        <AbsoluteFill style={{ opacity: sRest }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <radialGradient id="shade" cx="0.35" cy="0.35" r="0.75">
                <stop offset="0.5" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.55} />
              </radialGradient>
            </defs>
            <rect x={90} y={520} width={900} height={50} rx={10} fill={ROUTE} />
            <rect x={988} y={520} width={2} height={50} fill="#3d7fe0" />
            <text x={90} y={500} fontFamily={MONO} fontWeight={700} fontSize={34} fill={ROUTE}>SUN 99.86%</text>
            <g opacity={lens}>
              <line x1={989} y1={570} x2={540 + 330 * Math.cos(-0.5)} y2={1040 + 330 * Math.sin(-0.5)} stroke="#9fd0ff" strokeWidth={3} />
              <line x1={989} y1={570} x2={540 - 330 * Math.cos(-0.6)} y2={1040 + 330 * Math.sin(-0.6) - 40} stroke="#9fd0ff" strokeWidth={3} />
              <circle cx={989} cy={545} r={30} fill="none" stroke="#9fd0ff" strokeWidth={4} />
              <circle cx={540} cy={1040} r={340} fill="#060a14" stroke="#9fd0ff" strokeWidth={8} />
              <Planet x={470} y={960} r={120} c="#d9b38c" bands />
              <Planet x={720} y={1160} r={62} c="#e8d2a0" rings />
              <Planet x={380} y={1200} r={34} c="#9fe0e8" />
              <Planet x={520} y={1250} r={32} c="#4f7fe8" />
              {[[690, 900, 11, '#e8c37a'], [740, 950, 11, '#3d7fe0'], [660, 1000, 6, '#d9603a'], [770, 1010, 4, '#b9a99a']].map(([x, y, r, c], i) => (
                <Planet key={i} x={Number(x)} y={Number(y)} r={Number(r)} c={String(c)} />
              ))}
              {Array.from({ length: 30 }, (_, i) => (
                <circle key={i} cx={300 + ((i * 97) % 480)} cy={830 + ((i * 53) % 420)} r={1.5 + (i % 3)} fill="#8b93a6" opacity={0.7} />
              ))}
            </g>
          </svg>
          <div style={{ position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 4, color: '#9fd0ff' }}>EVERY PLANET, MOON AND ASTEROID</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 110, color: '#fff', textShadow: '0 6px 30px #000' }}>0.14%</div>
          </div>
          <Card top="MOSTLY JUPITER" color="#d9b38c" y={1410} o={EASE_OUT(within(at.rest, 0.45, 0.7))} />
        </AbsoluteFill>
      )}

      {/* ---------------- a small star; Betelgeuse ---------------- */}
      {sSmall > 0.001 && (
        <AbsoluteFill style={{ opacity: sSmall }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {f >= cue(at.betel) && <BigSun x={540} y={lerp(2600, 1700, grow)} r={820} id="betel" red />}
            {smallR > 3 ? <BigSun x={540} y={lerp(CY, 640, shrink)} r={smallR} id="small" />
              : (
                <g>
                  <circle cx={540} cy={640} r={2.5} fill="#fff3c4" />
                  <circle cx={540} cy={640} r={26} fill="none" stroke={ROUTE} strokeWidth={4} />
                  <text x={580} y={650} fontFamily={SANS} fontWeight={700} fontSize={34} fill={ROUTE}>THE SUN</text>
                </g>
              )}
            {/* Orion, with Betelgeuse marked */}
            {f >= cue(at.betel) && (
              <g opacity={EASE_OUT(within(at.betel, 0.4, 0.7))} transform="translate(820 380)">
                {[[-60, -90, 7, '#ff8a5c'], [60, -80, 4, '#cfe0ff'], [-14, 0, 4, '#cfe0ff'], [4, 6, 4, '#cfe0ff'], [22, 12, 4, '#cfe0ff'],
                  [-50, 100, 4, '#cfe0ff'], [70, 96, 6, '#cfe0ff']].map(([x, y, r, c], i) => (
                  <circle key={i} cx={Number(x)} cy={Number(y)} r={Number(r)} fill={String(c)} />
                ))}
                <path d="M -60 -90 L -14 0 M 60 -80 L 22 12 M -14 0 L -50 100 M 22 12 L 70 96" stroke="#5f6b85" strokeWidth={2} />
                <circle cx={-60} cy={-90} r={18} fill="none" stroke="#ff8a5c" strokeWidth={3} />
                <text x={0} y={150} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={26} fill="#9fb3c8">ORION</text>
              </g>
            )}
          </svg>
          <div style={{ position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center' }}>
            {f < cue(at.betel)
              ? <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 72, color: '#fff', textShadow: '0 6px 30px #000' }}>NOT A BIG STAR</div>
              : (
                <>
                  <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#ffb199' }}>BETELGEUSE IS</div>
                  <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 116, color: '#fff', textShadow: '0 6px 30px #000' }}>
                    {Math.round(600 * grow)}×+</div>
                  <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 36, color: ALERT }}>WIDER THAN THE SUN</div>
                </>
              )}
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- Betelgeuse in the Sun's place ---------------- */}
      {sSw > 0.001 && (
        <AbsoluteFill style={{ opacity: sSw }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {/* the asteroid belt, roughly 2.2-3.2 AU */}
            {Array.from({ length: 220 }, (_, i) => {
              const a = (i / 220) * Math.PI * 2 + f / 400; const d = (2.2 + ((i * 37) % 100) / 100) * AU;
              return <circle key={i} cx={CX + d * Math.cos(a)} cy={960 + d * Math.sin(a)} r={1.6} fill="#8b93a6" opacity={0.7} />;
            })}
            {ORBITS.map(({ n, a }, i) => {
              const r = a * AU; const eaten = bR > r;
              const pa = f / (30 * Math.pow(a, 1.5)) + i;
              return (
                <g key={n}>
                  <circle cx={CX} cy={960} r={r} fill="none" stroke={eaten ? ALERT : '#5f6b85'} strokeWidth={2.5} />
                  <circle cx={CX + r * Math.cos(pa)} cy={960 + r * Math.sin(pa)} r={a > 5 ? 10 : 6} fill={eaten ? '#ff8a5c' : '#cfe0ff'} />
                </g>
              );
            })}
            {bR > 2 ? <BigSun x={CX} y={960} r={bR} id="swallow" red /> : <circle cx={CX} cy={960} r={5} fill="#fff3c4" />}
            {ORBITS.map(({ n, a }, i) => {
              // one quadrant each, so the inner labels don't pile up
              const ang = [135, 45, -135, -45, -90][i] * Math.PI / 180; const r = a * AU + 12;
              const x = CX + r * Math.cos(ang); const y = 960 + r * Math.sin(ang) + (Math.sin(ang) > 0 ? 22 : -6);
              return (
                <text key={n} x={x} y={y} textAnchor={Math.cos(ang) < -0.1 ? 'end' : Math.cos(ang) > 0.1 ? 'start' : 'middle'}
                  fontFamily={SANS} fontWeight={700} fontSize={26} fill={bR > a * AU ? '#ffd0b0' : '#cfe0ff'}>{n}</text>
              );
            })}
          </svg>
          <div style={{ position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 4, color: '#ffb199' }}>BETELGEUSE IN THE SUN'S PLACE</div>
          </div>
          <Card top="MERCURY TO MARS: GONE" color={ALERT} y={1380} o={EASE_OUT(within(at.swallow, 0.6, 0.85))} />
        </AbsoluteFill>
      )}

      {loopT > 0.001 && <AbsoluteFill style={{ opacity: loopT }}>{orbitScene('loop', 0)}</AbsoluteFill>}

      {(() => {
        const o = Math.max(sHook, prog(f, END - 22, END - 4));
        return (
          <>
            <div style={{ position: 'absolute', top: 160, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
              fontSize: 84, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.9)', opacity: o }}>
              {hook.top}<br /><span style={{ color: ROUTE }}>{hook.bottom}</span>
            </div>
            <div style={{ position: 'absolute', top: 1420, left: 0, right: 0, textAlign: 'center', opacity: o,
              transform: `rotate(-3deg) scale(${1 + 0.04 * Math.sin(f / 5)})` }}>
              <span style={{ display: 'inline-block', background: '#ff2d2d', color: '#fff', fontFamily: SANS, fontWeight: 800,
                fontSize: 62, padding: '10px 30px', borderRadius: 18, border: '5px solid #fff' }}>{hook.badge}</span>
            </div>
          </>
        );
      })()}

      <EndCard from={cue(last)} to={END - 14} text="" compact />
      <Captions lines={vo} y={1560} accent={ROUTE} maxWords={3} size={58} plate />
    </AbsoluteFill>
  );
};

export default SunSize;
