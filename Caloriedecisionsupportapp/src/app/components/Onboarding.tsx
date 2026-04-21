import { useState, useEffect } from 'react';
import { MochiAnimated, MochiState } from './Mochi';

interface OnboardingData {
  name: string;
  goal: number;
}

export function OnboardingScreen({ onComplete }: { onComplete: (data: OnboardingData) => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState(1500);
  const [mochiState, setMochiState] = useState<MochiState>('happy');

  useEffect(() => {
    if (step === 1) setMochiState('excited');
    else if (step === 2) setMochiState('happy');
    else if (step === 3) setMochiState('proud');
    else setMochiState('happy');
  }, [step]);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onComplete({ name: name || 'you', goal });
  };

  const slides = [
    {
      title: 'Meet Mochi 🍡',
      body: "Your little wellness companion. Mochi grows with you — not a tracker, not a judge. Just a friend on your journey.",
      visual: (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 180 }}>
          <MochiAnimated state="happy" size={140} />
        </div>
      ),
      cta: 'Say hello →',
    },
    {
      title: "What's your name?",
      body: "Mochi would love to know who they're growing with.",
      visual: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <MochiAnimated state="excited" size={100} />
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name…"
            style={{
              width: '100%', padding: '14px 18px', boxSizing: 'border-box',
              border: '2px solid #FFD5C8', borderRadius: 18,
              fontFamily: "'Nunito', sans-serif", fontSize: 18,
              color: '#3D2020', background: '#FFF8F5',
              outline: 'none', textAlign: 'center',
            }}
          />
        </div>
      ),
      cta: name ? `Nice to meet you, ${name}! →` : 'Skip for now →',
    },
    {
      title: 'Set your daily goal',
      body: "No pressure — this is just a gentle target. You can change it any time.",
      visual: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <MochiAnimated state="happy" size={90} />
          <div style={{
            background: '#FFF0EB', borderRadius: 24, padding: '20px 28px',
            width: '100%', boxSizing: 'border-box', textAlign: 'center',
          }}>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 42, fontWeight: 800, color: '#FF8B7A', lineHeight: 1 }}>
              {goal.toLocaleString()}
            </div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, color: '#C4A89A', marginTop: 4 }}>
              calories / day
            </div>
            <input
              type="range" min="1000" max="3000" step="50"
              value={goal}
              onChange={e => setGoal(Number(e.target.value))}
              style={{ width: '100%', marginTop: 16 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Nunito', sans-serif", fontSize: 12, color: '#C4A89A', marginTop: 4 }}>
              <span>1,000</span><span>2,000</span><span>3,000</span>
            </div>
          </div>
        </div>
      ),
      cta: 'Looks good! →',
    },
    {
      title: "You're all set! 🎉",
      body: `Mochi is so excited to start this journey with ${name || 'you'}. Remember — every small step counts.`,
      visual: (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 180, position: 'relative' }}>
          <div style={{
            position: 'absolute',
            width: 160, height: 160,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #FFD5C8 0%, transparent 70%)',
          }} />
          <MochiAnimated state="proud" size={140} />
        </div>
      ),
      cta: "Let's begin →",
    },
  ];

  const slide = slides[step];

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg, #FFF5F0 0%, #FDF6F0 100%)',
      padding: '0 24px', paddingTop: 60, paddingBottom: 40,
      fontFamily: "'Nunito', sans-serif",
      overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 40 }}>
        {slides.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 24 : 8, height: 8,
            borderRadius: 4,
            background: i === step ? '#FF8B7A' : '#FFD5C8',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      <div style={{ marginBottom: 28 }}>{slide.visual}</div>

      <div style={{ textAlign: 'center', flex: 1 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#3D2020', margin: '0 0 12px', lineHeight: 1.2 }}>
          {slide.title}
        </h1>
        <p style={{ fontSize: 16, color: '#9B7E7E', lineHeight: 1.6, margin: 0 }}>
          {slide.body}
        </p>
      </div>

      <button
        onClick={handleNext}
        style={{
          marginTop: 32,
          width: '100%', padding: '18px 0',
          background: 'linear-gradient(135deg, #FF8B7A, #FFB5A7)',
          border: 'none', borderRadius: 24, cursor: 'pointer',
          fontFamily: "'Nunito', sans-serif", fontSize: 17, fontWeight: 800,
          color: '#fff',
          boxShadow: '0 8px 24px rgba(255,139,122,0.35)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
        onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {slide.cta}
      </button>
    </div>
  );
}
