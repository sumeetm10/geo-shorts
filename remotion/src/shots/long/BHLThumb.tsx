import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Atlas } from '../geo/Atlas';
import { BHShader } from '../geo/BHShader';
import { ALERT, ROUTE, SANS } from '../geo/parts';

// 16:9 thumbnail for the long black-hole video: the ray-traced hole, Atlas falling
// in, one big question and the "two answers" hook. Rendered as a still.
export const compositionConfig = {
  id: 'BHLThumb',
  durationInSeconds: 1,
  fps: 30,
  width: 1280,
  height: 720,
};

const BHLThumb: React.FC = () => (
  <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
    <BHShader x={260} y={40} w={1180} h={720} res={420} tilt={0.13} dist={15} />
    <AbsoluteFill style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 38%, rgba(0,0,0,0) 62%)' }} />
    <svg width={1280} height={720} style={{ position: 'absolute', inset: 0 }}>
      <g transform="translate(1000 230) rotate(-35)"><Atlas x={0} y={60} s={1.5} t={14} walking={0.4} mood="shocked" /></g>
    </svg>
    <div style={{ position: 'absolute', left: 50, top: 70, width: 640 }}>
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 92, lineHeight: 0.98, color: '#fff', textShadow: '0 6px 24px #000' }}>
        WHAT IF YOU<br /><span style={{ color: ROUTE }}>FALL IN?</span></div>
      <div style={{ marginTop: 34, display: 'inline-block', background: ALERT, color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 50,
        padding: '8px 22px', borderRadius: 14, border: '5px solid #fff', transform: 'rotate(-3deg)' }}>2 ANSWERS. BOTH TRUE.</div>
    </div>
  </AbsoluteFill>
);

export default BHLThumb;
