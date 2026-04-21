export type Screen = 'home' | 'foodlog' | 'progress' | 'settings';

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H5a1 1 0 01-1-1V10.5z"
        fill={active ? '#FF8B7A' : 'none'}
        stroke={active ? '#FF8B7A' : '#C4A89A'} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 22V12h6v10" stroke={active ? '#fff' : '#C4A89A'} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function LogIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="3" width="16" height="18" rx="3"
        fill={active ? '#FF8B7A' : 'none'}
        stroke={active ? '#FF8B7A' : '#C4A89A'} strokeWidth="1.8" />
      <path d="M8 8h8M8 12h8M8 16h5"
        stroke={active ? '#fff' : '#C4A89A'} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ProgressIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {active && <circle cx="12" cy="12" r="9" fill="#FF8B7A" opacity="0.15" />}
      <path d="M3 17l5-5 4 3 5-6 4 3"
        stroke={active ? '#fff' : '#C4A89A'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4"
        fill={active ? '#FF8B7A' : 'none'}
        stroke={active ? '#FF8B7A' : '#C4A89A'} strokeWidth="1.8" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
        stroke={active ? '#FF8B7A' : '#C4A89A'} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const TABS: { id: Screen; label: string; Icon: React.FC<{ active: boolean }> }[] = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'foodlog', label: 'Log', Icon: LogIcon },
  { id: 'progress', label: 'Progress', Icon: ProgressIcon },
  { id: 'settings', label: 'Me', Icon: MeIcon },
];

export function NavBar({ screen, setScreen }: { screen: Screen; setScreen: (s: Screen) => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      background: '#fff',
      borderTop: '1px solid rgba(255,180,160,0.15)',
      paddingBottom: 20, paddingTop: 10,
      boxShadow: '0 -4px 20px rgba(255,140,120,0.06)',
    }}>
      {TABS.map(({ id, label, Icon }) => {
        const active = screen === id;
        return (
          <button key={id} onClick={() => setScreen(id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 4, padding: '4px 16px', borderRadius: 16,
            transform: active ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.2s ease',
          }}>
            <Icon active={active} />
            <span style={{
              fontSize: 11, fontFamily: "'Nunito', sans-serif",
              fontWeight: active ? 700 : 500,
              color: active ? '#FF8B7A' : '#C4A89A',
              letterSpacing: 0.2,
            }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
