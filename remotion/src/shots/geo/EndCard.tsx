import React from 'react';
import { useCurrentFrame } from 'remotion';
import { EASE_OUT, prog } from '../../lib/shorts';

// The Subscribe card over the closing line. Everything is drawn - no emoji and
// no icon font - because the Linux machine that renders in the cloud has
// neither (it already dropped the arrow in the hook once).
const Bell: React.FC = () => (
  <svg width={58} height={58} viewBox="0 0 24 24">
    <path d="M12 3c-3.3 0-5 2.6-5 5.6V13l-2 3h14l-2-3V8.6C17 5.6 15.3 3 12 3z" fill="#fff" />
    <circle cx={12} cy={18.6} r={1.9} fill="#fff" />
  </svg>
);

export const EndCard: React.FC<{ from: number; text: string }> = ({ from, text }) => {
  const f = useCurrentFrame();
  if (f < from) return null;
  const t = EASE_OUT(prog(f, from, from + 12));
  const pulse = 1 + 0.035 * Math.sin((f - from) / 4.5);
  return (
    <>
    {/* dim the map so the card reads over any flag or label */}
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(3,5,9,0.5)', opacity: t }} />
    <div style={{
      position: 'absolute', left: 0, right: 0, top: 930,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      opacity: t, transform: `scale(${(0.82 + 0.18 * t) * pulse})`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 22, background: '#FF0033',
        borderRadius: 999, padding: '24px 58px', boxShadow: '0 18px 50px rgba(0,0,0,0.55)',
      }}>
        <Bell />
        <span style={{
          fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 66,
          color: '#fff', letterSpacing: 3,
        }}>SUBSCRIBE</span>
      </div>
      <div style={{
        marginTop: 24, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 48,
        color: '#fff', background: 'rgba(5,7,11,0.78)', borderRadius: 16, padding: '8px 22px',
      }}>{text}</div>
    </div>
    </>
  );
};
