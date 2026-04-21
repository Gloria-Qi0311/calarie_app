import { useState, useEffect, CSSProperties } from 'react';

export type MochiState = 'happy' | 'neutral' | 'sleepy' | 'excited' | 'proud' | 'sad';

const COLORS = {
  body: '#FFE0D0',
  bodyShade: '#F5C4B0',
  cheek: '#FFB5A7',
  eye: '#3D2020',
  shine: '#fff',
};

function MochiEyes({ state }: { state: MochiState }) {
  if (state === 'sleepy') return (
    <>
      <ellipse cx="34" cy="54" rx="6" ry="3" fill={COLORS.eye} />
      <ellipse cx="66" cy="54" rx="6" ry="3" fill={COLORS.eye} />
    </>
  );
  if (state === 'excited') return (
    <>
      <circle cx="34" cy="52" r="7" fill={COLORS.eye} />
      <circle cx="66" cy="52" r="7" fill={COLORS.eye} />
      <circle cx="36" cy="50" r="2.5" fill={COLORS.shine} />
      <circle cx="68" cy="50" r="2.5" fill={COLORS.shine} />
      <circle cx="32" cy="54" r="1.2" fill={COLORS.shine} />
      <circle cx="64" cy="54" r="1.2" fill={COLORS.shine} />
    </>
  );
  if (state === 'sad') return (
    <>
      <ellipse cx="34" cy="54" rx="5.5" ry="6" fill={COLORS.eye} />
      <ellipse cx="66" cy="54" rx="5.5" ry="6" fill={COLORS.eye} />
      <circle cx="36" cy="52" r="1.8" fill={COLORS.shine} />
      <circle cx="68" cy="52" r="1.8" fill={COLORS.shine} />
      <ellipse cx="34" cy="64" rx="3" ry="4" fill="#A8D4FF" opacity="0.8" />
      <ellipse cx="66" cy="64" rx="3" ry="4" fill="#A8D4FF" opacity="0.8" />
    </>
  );
  return (
    <>
      <ellipse cx="34" cy="52" rx="5.5" ry="6" fill={COLORS.eye} />
      <ellipse cx="66" cy="52" rx="5.5" ry="6" fill={COLORS.eye} />
      <circle cx="36" cy="50" r="1.8" fill={COLORS.shine} />
      <circle cx="68" cy="50" r="1.8" fill={COLORS.shine} />
    </>
  );
}

function MochiMouth({ state }: { state: MochiState }) {
  if (state === 'happy' || state === 'excited' || state === 'proud')
    return <path d="M38 66 Q50 78 62 66" stroke={COLORS.eye} strokeWidth="3" fill="none" strokeLinecap="round" />;
  if (state === 'sad')
    return <path d="M38 74 Q50 64 62 74" stroke={COLORS.eye} strokeWidth="3" fill="none" strokeLinecap="round" />;
  if (state === 'sleepy')
    return <path d="M40 70 Q50 74 60 70" stroke={COLORS.eye} strokeWidth="3" fill="none" strokeLinecap="round" />;
  return <path d="M40 68 Q50 72 60 68" stroke={COLORS.eye} strokeWidth="2.5" fill="none" strokeLinecap="round" />;
}

function MochiExtras({ state }: { state: MochiState }) {
  if (state === 'excited') return (
    <>
      <text x="6" y="22" fontSize="14" fill="#FFD166">✦</text>
      <text x="80" y="18" fontSize="10" fill="#FFB5A7">✦</text>
      <text x="76" y="88" fontSize="12" fill="#FFD166">✦</text>
    </>
  );
  if (state === 'proud')
    return <text x="76" y="28" fontSize="14" fill="#FFD166">⭐</text>;
  if (state === 'sleepy') return (
    <>
      <text x="74" y="26" fontSize="11" fill="#C9B8E8">z</text>
      <text x="82" y="16" fontSize="9" fill="#C9B8E8">z</text>
      <text x="88" y="8" fontSize="7" fill="#C9B8E8">z</text>
    </>
  );
  return null;
}

const SHAPES = [
  '58% 42% 55% 45% / 50% 58% 42% 50%',
  '45% 55% 60% 40% / 55% 45% 55% 45%',
  '55% 45% 48% 52% / 45% 52% 48% 55%',
];

export function Mochi({ state = 'happy', size = 100, style = {} }: {
  state?: MochiState;
  size?: number;
  style?: CSSProperties;
}) {
  const [morph, setMorph] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setMorph(m => (m + 1) % 3), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      width: size, height: size, position: 'relative',
      transform: state === 'excited' ? 'translateY(-4px)' : 'translateY(0)',
      transition: 'transform 0.3s ease',
      ...style,
    }}>
      <svg viewBox="0 0 100 100" width={size} height={size} style={{ overflow: 'visible' }}>
        <ellipse cx="50" cy="97" rx="30" ry="5" fill="rgba(0,0,0,0.08)" />
        <g style={{ transition: 'all 1.8s ease-in-out' }}>
          <ellipse cx="50" cy="55" rx="40" ry="37" fill={COLORS.body}
            style={{ transition: 'rx 1.8s ease, ry 1.8s ease' }} />
          <ellipse cx="50" cy="80" rx="30" ry="12" fill={COLORS.bodyShade} opacity="0.35" />
        </g>
        <ellipse cx="22" cy="65" rx="10" ry="7" fill={COLORS.cheek} opacity="0.5" />
        <ellipse cx="78" cy="65" rx="10" ry="7" fill={COLORS.cheek} opacity="0.5" />
        <MochiEyes state={state} />
        <MochiMouth state={state} />
        <MochiExtras state={state} />
      </svg>
      <div style={{
        position: 'absolute', inset: '10%',
        background: `radial-gradient(ellipse at 35% 35%, ${COLORS.shine} 0%, transparent 60%)`,
        borderRadius: SHAPES[morph],
        transition: 'border-radius 1.8s ease',
        pointerEvents: 'none',
        opacity: 0.25,
      }} />
    </div>
  );
}

export function MochiAnimated({ state = 'happy', size = 120, style = {} }: {
  state?: MochiState;
  size?: number;
  style?: CSSProperties;
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1800);
    return () => clearInterval(id);
  }, []);

  const isExcited = state === 'excited';
  const bounce = isExcited ? (tick % 2 === 0 ? -8 : 0) : 0;

  return (
    <div style={{
      transform: `translateY(${bounce}px)`,
      transition: isExcited ? 'transform 0.4s ease-in-out' : 'transform 0.6s ease',
      ...style,
    }}>
      <Mochi state={state} size={size} />
    </div>
  );
}
