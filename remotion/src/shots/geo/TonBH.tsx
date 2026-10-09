import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Captions, EASE_INOUT, EASE_OUT, prog } from '../../lib/shorts';
import type { VoLine } from '../../lib/shorts';
import { Card, LensedStars, Sun } from './BlackHole';
import { EndCard } from './EndCard';
import { Gargantua } from './Gargantua';
import { GlobeView, SpaceBg } from './Globe';
import { ALERT, H, MONO, ROUTE, SANS, W, lerp, rng } from './parts';

// =============================================================================
// "TON 618: our solar system is a speck next to it." A scale zoom with every
// step to scale: the Sun; Sagittarius A*'s event horizon, ~18 Suns across; the
// solar system out to Neptune; then TON 618's horizon (816 AU radius at 40.7
// billion Suns) swallowing the frame, with 27 Neptune orbits laid across it;
// light taking 9+ days to cross; and its light setting off 10.8 billion years
// ago, before Earth formed. Script and sources: make_whatif.py "ton618".
// =============================================================================
export const compositionConfig = {
  id: 'TonBH',
  durationInSeconds: 39,
  fps: 30,
  width: 1080,
  height: 1920,
};

type Props = {
  vo: VoLine[];
  hook: { top: string; bottom: string; badge: string };
  at: { name: number; sun: number; sgr: number; solar: number; edge: number; light: number; past: number; before: number };
  durationInSeconds: number;
};

const SGR_AU = 0.0863;                         // Sgr A* Schwarzschild radius, AU (4.297e6 x 3.0 km)
const TON_AU = 816;                            // TON 618 at 40.7 billion Suns, AU
const SUN_AU = 0.00465;                        // the Sun's radius, AU
const ORBITS = [{ n: 'MERCURY', a: 0.39 }, { n: 'VENUS', a: 0.72 }, { n: 'EARTH', a: 1 }, { n: 'MARS', a: 1.52 },
  { n: 'JUPITER', a: 5.2 }, { n: 'SATURN', a: 9.58 }, { n: 'URANUS', a: 19.2 }, { n: 'NEPTUNE', a: 30.1 }];
const logLerp = (a: number, b: number, t: number) => Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * t);

const SUNS = (() => { const r = rng(4040); return Array.from({ length: 260 }, () => ({ a: r() * Math.PI * 2, d: 0.2 + r(), s: 1 + r() * 3, p: r() })); })();
const GALAXIES = (() => { const r = rng(808); return Array.from({ length: 26 }, () => ({ x: r() * W, y: r() * 1500, rx: 6 + r() * 26, rot: r() * 180, c: r() > 0.5 ? '#cfd8ff' : '#ffe0c0' })); })();

const TonBH: React.FC<Partial<Props>> = ({ vo = [], hook = { top: '', bottom: '', badge: '' }, at, durationInSeconds = 39 }) => {
  const f = useCurrentFrame();
  if (!at) return <AbsoluteFill style={{ background: '#000' }} />;
  const END = Math.round(durationInSeconds * 30);
  const cue = (i: number) => Math.round(((vo[i]?.start) ?? durationInSeconds) * 30);
  const lineEnd = (i: number) => (i + 1 < vo.length ? cue(i + 1) : END);
  const within = (i: number, a: number, b: number) => prog(f, lerp(cue(i), lineEnd(i), a), lerp(cue(i), lineEnd(i), b));
  const span = (a: number, b: number) => prog(f, cue(a) - 6, cue(a) + 8) * (1 - prog(f, cue(b) - 8, cue(b) + 6));
  const last = vo.length - 1;
  const CX = 540; const CY = 1000;

  // ---- hook: the solar system, a speck beside TON 618
  const sHook = 1 - prog(f, cue(at.name) - 6, cue(at.name) + 8);
  const hookScene = (key: string) => (
    <>
      <AbsoluteFill style={{ background: '#000' }} />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <LensedStars lx={CX} ly={1180} tE={560} o={1} />
        <Gargantua id={`h-${key}`} x={CX} y={1180} rs={330} f={f} />
        <circle cx={230} cy={560} r={6} fill="none" stroke="#9fd0ff" strokeWidth={2} />
        <circle cx={230} cy={560} r={1.5} fill="#ffd34d" />
        <circle cx={230} cy={560} r={30 + 8 * Math.sin(f / 6)} fill="none" stroke={ROUTE} strokeWidth={4} />
        <line x1={262} y1={575} x2={400} y2={640} stroke={ROUTE} strokeWidth={4} />
        <text x={410} y={655} fontFamily={SANS} fontWeight={800} fontSize={40} fill={ROUTE}>OUR SOLAR SYSTEM</text>
      </svg>
    </>
  );

  // ---- 40-66 billion Suns pouring in
  const sName = span(at.name, at.sun);
  const count = EASE_OUT(within(at.name, 0.05, 0.6));

  // ---- the zoom: px per AU
  const sZoom = span(at.sun, at.light);
  let S: number;
  if (f < cue(at.sgr)) S = 260 / SUN_AU;                                                       // the Sun 260 px
  else if (f < cue(at.solar)) S = logLerp(260 / SUN_AU, 14.4 / SUN_AU, EASE_INOUT(within(at.sgr, 0, 0.6)));
  else if (f < cue(at.edge)) S = logLerp(14.4 / SUN_AU, 420 / 30.1, EASE_INOUT(within(at.solar, 0, 0.7)));
  else S = logLerp(420 / 30.1, 367 / TON_AU, EASE_INOUT(within(at.edge, 0, 0.45)));
  const sunR = SUN_AU * S;
  // Sagittarius A* sits beside the Sun while it matters, then fades
  const sgrO = f < cue(at.sgr) ? 0 : f < cue(at.edge) ? EASE_OUT(within(at.sgr, 0.1, 0.5)) * (1 - prog(f, cue(at.solar) - 6, cue(at.solar) + 8)) : 0;
  const sgrX = CX + 60; const sgrY = CY + 120;
  const sunX = f < cue(at.sgr) ? CX : lerp(CX, 220, EASE_INOUT(within(at.sgr, 0, 0.6)));
  const sunY = f < cue(at.sgr) ? CY : lerp(CY, 560, EASE_INOUT(within(at.sgr, 0, 0.6)));
  const solarO = f < cue(at.solar) ? 0 : 1;
  const tonO = f < cue(at.edge) ? 0 : 1;
  const tonR = TON_AU * S;
  const row = f >= cue(at.edge) ? Math.round(27 * EASE_INOUT(within(at.edge, 0.5, 0.85))) : 0;

  // ---- light crossing
  const sLight = span(at.light, at.past);
  const cross = EASE_INOUT(within(at.light, 0.05, 0.9));

  // ---- 10.8 billion years
  const sPast = span(at.past, last);
  const beam = EASE_INOUT(within(at.past, 0.05, 0.95));
  const tl = EASE_INOUT(within(at.before, 0, 0.8));
  const loopT = EASE_INOUT(prog(f, cue(last), END - 4));

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      {sHook > 0.001 && <AbsoluteFill style={{ opacity: sHook }}>{hookScene('hook')}</AbsoluteFill>}

      {/* ---------------- 40 to 66 billion Suns ---------------- */}
      {sName > 0.001 && (
        <AbsoluteFill style={{ opacity: sName, background: '#000' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <LensedStars lx={CX} ly={1080} tE={420} o={1} />
            {SUNS.map((s, i) => {
              const t = ((f - cue(at.name)) * 0.006 * (0.6 + s.p) + s.p) % 1;     // spiral in
              const d = (1 - t) * 900 * s.d + 150; const a = s.a + t * 5;
              return <circle key={i} cx={CX + Math.cos(a) * d} cy={1080 + Math.sin(a) * d * 0.55} r={s.s * (1 - t * 0.6)} fill="#ffd34d"
                opacity={0.9 * Math.min(1, (1 - t) * 3)} />;
            })}
            <Gargantua id="name" x={CX} y={1080} rs={200} f={f} />
          </svg>
          <div style={{ position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 76, color: '#fff', textShadow: '0 6px 30px #000' }}>TON 618</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 96, color: ROUTE, textShadow: '0 6px 30px #000' }}>
              {Math.round(40 * count)}–{Math.round(66 * count)} BILLION</div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, color: '#ffd38a' }}>TIMES THE SUN'S MASS</div>
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- the zoom: Sun -> Sgr A* -> solar system -> TON 618 ---------------- */}
      {sZoom > 0.001 && (
        <AbsoluteFill style={{ opacity: sZoom, background: '#000' }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {/* TON 618, centred, coming into view as the camera pulls back */}
            {tonO > 0 && (
              tonR < 2600
                ? <><LensedStars lx={CX} ly={CY} tE={tonR * 1.6} o={1} /><Gargantua id="ton" x={CX} y={CY} rs={tonR} f={f} /></>
                : <circle cx={CX} cy={CY} r={tonR} fill="#000" />
            )}
            {/* the solar system */}
            {solarO > 0 && ORBITS.map(({ n, a }) => {
              const r = a * S; if (r > 2400 || r < 0.6) return null;
              const pa = f / (25 * Math.pow(a, 0.8)) + a;
              return (
                <g key={n}>
                  <circle cx={CX} cy={CY} r={r} fill="none" stroke={n === 'NEPTUNE' ? '#9fd0ff' : '#5f6b85'} strokeWidth={n === 'NEPTUNE' ? 3 : 2} />
                  {r > 30 && <circle cx={CX + r * Math.cos(pa)} cy={CY + r * Math.sin(pa)} r={n === 'EARTH' ? 6 : 5} fill={n === 'EARTH' ? '#4fa3ff' : '#cfe0ff'} />}
                  {r > 60 && r < 700 && (n === 'EARTH' || n === 'JUPITER' || n === 'NEPTUNE') && (
                    <text x={CX} y={CY - r - 10} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={26} fill="#cfe0ff">{n}</text>
                  )}
                </g>
              );
            })}
            {/* the Sun */}
            {sunR > 0.8 ? <Sun x={solarO ? CX : sunX} y={solarO ? CY : sunY} r={sunR} /> : <circle cx={CX} cy={CY} r={1.5} fill="#ffd34d" />}
            {f < cue(at.sgr) && (
              <g opacity={EASE_OUT(within(at.sun, 0.2, 0.5))}>
                <circle cx={CX + 330} cy={CY} r={2.4} fill="#4fa3ff" />
                <line x1={CX + 330} y1={CY - 10} x2={CX + 360} y2={CY - 90} stroke="#9fd0ff" strokeWidth={3} />
                <text x={CX + 370} y={CY - 100} fontFamily={SANS} fontWeight={700} fontSize={30} fill="#9fd0ff">EARTH</text>
              </g>
            )}
            {/* Sagittarius A* */}
            {sgrO > 0 && <Gargantua id="sgr" x={sgrX} y={sgrY} rs={Math.max(1.5, SGR_AU * S)} f={f} o={sgrO} />}
            {tonO > 0 && row === 0 && tonR < 2600 && (
              <g opacity={EASE_OUT(within(at.edge, 0.3, 0.45))}>
                <line x1={CX + 14} y1={CY - 14} x2={CX + 160} y2={CY - 160} stroke={ROUTE} strokeWidth={4} />
                <text x={CX + 170} y={CY - 170} fontFamily={SANS} fontWeight={800} fontSize={34} fill={ROUTE}>OUR SOLAR SYSTEM</text>
              </g>
            )}
            {/* 27 Neptune orbits across TON 618 */}
            {row > 0 && Array.from({ length: row }, (_, i) => {
              const d = 60.2 * S; const x0 = CX - 27 * d / 2 + d / 2;
              return <circle key={i} cx={x0 + i * d} cy={CY} r={d / 2 - 0.5} fill="none" stroke="#9fd0ff" strokeWidth={2.5} />;
            })}
          </svg>
          <div style={{ position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center' }}>
            {f < cue(at.sgr) && (
              <>
                <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#ffd38a' }}>OUR SUN</div>
                <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 90, color: '#fff', textShadow: '0 6px 30px #000' }}>1,391,400 km</div>
              </>
            )}
            {f >= cue(at.sgr) && f < cue(at.solar) && (
              <>
                <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: '#ffb199' }}>OUR GALAXY'S BLACK HOLE · SGR A*</div>
                <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 120, color: '#fff', textShadow: '0 6px 30px #000' }}>
                  {Math.max(1, Math.round(18 * EASE_OUT(within(at.sgr, 0.2, 0.7))))}× WIDER</div>
                <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, color: '#9fc8ea' }}>EVENT HORIZON vs THE SUN</div>
              </>
            )}
            {f >= cue(at.solar) && f < cue(at.edge) && (
              <>
                <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#9fc8ea' }}>THE WHOLE SOLAR SYSTEM</div>
                <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 100, color: '#fff', textShadow: '0 6px 30px #000' }}>TO NEPTUNE</div>
              </>
            )}
            {f >= cue(at.edge) && (
              <>
                <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#ffb199' }}>
                  {row > 0 ? "NEPTUNE'S ORBIT, SIDE BY SIDE" : "TON 618'S EVENT HORIZON"}</div>
                <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 130, color: '#fff', textShadow: '0 6px 30px #000' }}>
                  {row > 0 ? `× ${row}` : 'TON 618'}</div>
              </>
            )}
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- light crossing: 9+ days ---------------- */}
      {sLight > 0.001 && (
        <AbsoluteFill style={{ opacity: sLight, background: '#000' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <LensedStars lx={CX} ly={CY} tE={590} o={1} />
            <Gargantua id="light" x={CX} y={CY} rs={367} f={f} />
            <line x1={CX - 367} y1={CY} x2={lerp(CX - 367, CX + 367, cross)} y2={CY} stroke="#fff3c4" strokeWidth={4} strokeDasharray="4 10" />
            <circle cx={lerp(CX - 367, CX + 367, cross)} cy={CY} r={26} fill="#fff3c4" opacity={0.35} />
            <circle cx={lerp(CX - 367, CX + 367, cross)} cy={CY} r={10} fill="#fff" />
          </svg>
          <div style={{ position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#ffd38a' }}>LIGHT CROSSING IT</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 130, color: '#fff', textShadow: '0 6px 30px #000' }}>
              {(9.4 * cross).toFixed(1)} DAYS</div>
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- 10.8 billion years; before Earth ---------------- */}
      {sPast > 0.001 && (
        <AbsoluteFill style={{ opacity: sPast, background: '#000' }}>
          <SpaceBg />
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {GALAXIES.map((g, i) => (
              <ellipse key={i} cx={g.x} cy={g.y} rx={g.rx} ry={g.rx * 0.4} transform={`rotate(${g.rot} ${g.x} ${g.y})`} fill={g.c} opacity={0.25} />
            ))}
            {/* the quasar */}
            <circle cx={CX} cy={520} r={70} fill="#cfe0ff" opacity={0.25} />
            <circle cx={CX} cy={520} r={14} fill="#fff" />
            <line x1={CX - 90} y1={520} x2={CX + 90} y2={520} stroke="#fff" strokeWidth={3} opacity={0.7} />
            <line x1={CX} y1={430} x2={CX} y2={610} stroke="#fff" strokeWidth={3} opacity={0.7} />
            <text x={CX + 40} y={480} fontFamily={SANS} fontWeight={700} fontSize={30} fill="#cfe0ff">TON 618</text>
            {f < cue(at.before) && (
              <>
                <line x1={CX} y1={540} x2={CX} y2={lerp(540, 1330, beam)} stroke="#fff3c4" strokeWidth={5} strokeDasharray="6 10" />
                <circle cx={CX} cy={lerp(540, 1330, beam)} r={12} fill="#fff" />
              </>
            )}
          </svg>
          {f < cue(at.before) && <GlobeView id="past" cx={CX} cy={1420} R={90} lon0={20 - f * 0.6} lat0={12} />}
          {f < cue(at.before) && (
            <div style={{ position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center' }}>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: '#9fc8ea' }}>ITS LIGHT HAS BEEN TRAVELLING</div>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 96, color: '#fff', textShadow: '0 6px 30px #000' }}>
                {(10.8 * beam).toFixed(1)} BILLION YRS</div>
            </div>
          )}
          {f >= cue(at.before) && (
            <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
              <line x1={110} y1={1060} x2={970} y2={1060} stroke="#3a4357" strokeWidth={14} strokeLinecap="round" />
              <line x1={110} y1={1060} x2={lerp(110, 970, tl)} y2={1060} stroke={ROUTE} strokeWidth={14} strokeLinecap="round" />
              <circle cx={110} cy={1060} r={18} fill="#fff" />
              <text x={110} y={1000} fontFamily={SANS} fontWeight={700} fontSize={28} fill="#fff">LIGHT LEAVES</text>
              <text x={110} y={1120} fontFamily={MONO} fontWeight={700} fontSize={28} fill="#9fc8ea">10.8 BN YRS AGO</text>
              {(() => { const x = 110 + 860 * (1 - 4.5 / 10.8); const o = prog(tl, 1 - 4.5 / 10.8 - 0.05, 1 - 4.5 / 10.8 + 0.02); return (
                <g opacity={o}>
                  <circle cx={x} cy={1060} r={28} fill="#3d7fe0" stroke="#bfe0ff" strokeWidth={4} />
                  <text x={x} y={990} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={32} fill="#4fc3ff">EARTH FORMS</text>
                  <text x={x} y={1130} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={28} fill="#9fc8ea">4.5 BN YRS AGO</text>
                </g>
              ); })()}
              <g opacity={prog(tl, 0.95, 1)}>
                <circle cx={970} cy={1060} r={18} fill={ROUTE} />
                <text x={970} y={1000} textAnchor="end" fontFamily={SANS} fontWeight={700} fontSize={28} fill={ROUTE}>ARRIVES TODAY</text>
              </g>
            </svg>
          )}
          {f >= cue(at.before) && <Card top="OLDER THAN EARTH" color={ALERT} y={1300} o={EASE_OUT(within(at.before, 0.5, 0.8))} />}
        </AbsoluteFill>
      )}

      {loopT > 0.001 && <AbsoluteFill style={{ opacity: loopT }}>{hookScene('loop')}</AbsoluteFill>}

      {(() => {
        const o = Math.max(sHook, prog(f, END - 22, END - 4));
        return (
          <>
            <div style={{ position: 'absolute', top: 160, left: 30, right: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
              fontSize: 92, lineHeight: 1.0, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.9)', opacity: o }}>
              {hook.top}<br /><span style={{ color: ROUTE, fontSize: 76 }}>{hook.bottom}</span>
            </div>
            <div style={{ position: 'absolute', top: 1420, left: 0, right: 0, textAlign: 'center', opacity: o,
              transform: `rotate(-3deg) scale(${1 + 0.04 * Math.sin(f / 5)})` }}>
              <span style={{ display: 'inline-block', background: '#ff2d2d', color: '#fff', fontFamily: SANS, fontWeight: 800,
                fontSize: 58, padding: '10px 30px', borderRadius: 18, border: '5px solid #fff' }}>{hook.badge}</span>
            </div>
          </>
        );
      })()}

      <EndCard from={cue(last)} to={END - 14} text="" compact />
      <Captions lines={vo} y={1600} accent={ROUTE} maxWords={3} size={58} plate />
    </AbsoluteFill>
  );
};

export default TonBH;
