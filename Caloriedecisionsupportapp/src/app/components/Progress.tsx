import { MochiAnimated } from './Mochi';

const WEEK_DATA = [
  { day: 'Mon', cal: 1420, goal: 1500 },
  { day: 'Tue', cal: 1680, goal: 1500 },
  { day: 'Wed', cal: 1350, goal: 1500 },
  { day: 'Thu', cal: 1500, goal: 1500 },
  { day: 'Fri', cal: 1290, goal: 1500 },
  { day: 'Sat', cal: 1750, goal: 1500 },
  { day: 'Sun', cal: 0, goal: 1500 },
];

function WeekChart({ data }: { data: typeof WEEK_DATA }) {
  const max = Math.max(...data.map(d => d.cal), data[0].goal);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
      {data.map((d, i) => {
        const isToday = i === 6;
        const pct = d.cal > 0 ? d.cal / max : 0;
        const over = d.cal > d.goal;
        const empty = d.cal === 0;
        return (
          <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', borderRadius: 8, overflow: 'hidden', background: '#FFE8E0', position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 0, right: 0,
                bottom: `${(d.goal / max) * 100}%`,
                height: 1.5, background: 'rgba(255,139,122,0.3)', zIndex: 2,
              }} />
              <div style={{
                width: '100%', height: `${pct * 100}%`,
                background: empty ? 'transparent' : over
                  ? 'linear-gradient(180deg, #FFD166, #FFBE44)'
                  : 'linear-gradient(180deg, #FF8B7A, #FFB5A7)',
                borderRadius: '6px 6px 0 0',
                minHeight: empty ? 0 : 6,
                transition: 'height 0.8s ease',
                border: isToday ? '2px solid #FF8B7A' : 'none',
              }} />
            </div>
            <span style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 11, fontWeight: isToday ? 800 : 600,
              color: isToday ? '#FF8B7A' : '#C4A89A',
            }}>{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ label, value, unit, emoji, color = '#FF8B7A' }: {
  label: string; value: string | number; unit: string; emoji: string; color?: string;
}) {
  return (
    <div style={{
      flex: 1, background: '#fff', borderRadius: 22, padding: '18px 16px',
      boxShadow: '0 4px 16px rgba(255,140,120,0.07)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    }}>
      <div style={{ fontSize: 24 }}>{emoji}</div>
      <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: '#C4A89A', fontWeight: 600 }}>{unit}</div>
      <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: '#9B7E7E', fontWeight: 600, textAlign: 'center' }}>{label}</div>
    </div>
  );
}

function MochiGrowthStage() {
  const stages = [
    { label: 'Seedling', emoji: '🌱', done: true },
    { label: 'Sprout', emoji: '🌿', done: true },
    { label: 'Bloom', emoji: '🌸', done: false, current: true },
    { label: 'Glow', emoji: '✨', done: false },
    { label: 'Legend', emoji: '⭐', done: false },
  ];
  return (
    <div>
      <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 800, color: '#3D2020', marginBottom: 16 }}>
        Mochi's Growth
      </div>
      <div style={{ background: '#fff', borderRadius: 24, padding: '20px 16px', boxShadow: '0 4px 16px rgba(255,140,120,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{
            position: 'absolute', top: '50%', left: '10%', right: '10%',
            height: 2, background: '#FFE8E0', transform: 'translateY(-50%)', zIndex: 0,
          }} />
          {stages.map((s, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: s.done ? '#FF8B7A' : s.current ? '#FFF0EB' : '#FFE8E0',
                border: s.current ? '3px solid #FF8B7A' : '2px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: s.done ? 20 : s.current ? 22 : 18,
                boxShadow: s.current ? '0 0 0 6px rgba(255,139,122,0.15)' : 'none',
              }}>{s.emoji}</div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 700, color: s.current ? '#FF8B7A' : '#C4A89A', textAlign: 'center' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, background: '#FFF5F0', borderRadius: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <MochiAnimated state="happy" size={52} />
          <div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: '#3D2020' }}>
              Mochi is in Bloom stage 🌸
            </div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: '#C4A89A', marginTop: 3 }}>
              15 more days until Glow!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProgressScreen() {
  const daysOnTrack = WEEK_DATA.filter(d => d.cal > 0 && d.cal <= d.goal).length;

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#FDF6F0', fontFamily: "'Nunito', sans-serif", paddingBottom: 20 }}>
      <div style={{ padding: '60px 20px 0' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#3D2020', marginBottom: 4 }}>Your Progress</div>
        <div style={{ fontSize: 14, color: '#C4A89A' }}>You and Mochi are growing together 🌱</div>
      </div>

      <div style={{ margin: '20px 20px 0', display: 'flex', gap: 12 }}>
        <StatCard label="Day streak" value="5" unit="days" emoji="🔥" color="#FF8B7A" />
        <StatCard label="On target" value={daysOnTrack} unit="/ 7 days" emoji="🎯" color="#FFB5A7" />
        <StatCard label="Avg calories" value="1,498" unit="kcal/day" emoji="📊" color="#FFD166" />
      </div>

      <div style={{ margin: '16px 20px 0', background: '#fff', borderRadius: 24, padding: '20px', boxShadow: '0 4px 16px rgba(255,140,120,0.07)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#3D2020' }}>This week</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: '#FF8B7A' }} />
              <span style={{ fontSize: 11, color: '#C4A89A' }}>On track</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: '#FFD166' }} />
              <span style={{ fontSize: 11, color: '#C4A89A' }}>Over</span>
            </div>
          </div>
        </div>
        <WeekChart data={WEEK_DATA} />
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: '#C4A89A' }}>
          Goal: 1,500 kcal / day
        </div>
      </div>

      <div style={{ margin: '16px 20px 0' }}>
        <MochiGrowthStage />
      </div>

      <div style={{ margin: '16px 20px 0', background: 'linear-gradient(135deg, #FFF0F8, #FFE0F0)', borderRadius: 24, padding: '18px 20px' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#CC6699', marginBottom: 6 }}>
          Saturday was a little over — and that's okay 💕
        </div>
        <div style={{ fontSize: 13, color: '#CC88AA', lineHeight: 1.5 }}>
          One day doesn't define your journey. Mochi still thinks you're doing amazing. Keep going!
        </div>
      </div>
    </div>
  );
}
