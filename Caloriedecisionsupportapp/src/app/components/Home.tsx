import { MochiAnimated, MochiState } from './Mochi';

interface Meal {
  name: string;
  calories: number;
}

function CalorieRing({ consumed, goal, size = 200 }: { consumed: number; goal: number; size?: number }) {
  const r = (size - 24) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(consumed / goal, 1);
  const dash = pct * circ;
  const remaining = Math.max(goal - consumed, 0);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#FFE8E0" strokeWidth="14" />
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={pct >= 1 ? '#FFB5A7' : '#FF8B7A'}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Nunito', sans-serif",
      }}>
        <div style={{ fontSize: 11, color: '#C4A89A', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>remaining</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#3D2020', lineHeight: 1.1 }}>
          {remaining.toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: '#C4A89A', fontWeight: 600 }}>kcal</div>
      </div>
    </div>
  );
}

function MacroBar({ label, current, max, color }: { label: string; current: number; max: number; color: string }) {
  const pct = Math.min(current / max, 1);
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontFamily: "'Nunito', sans-serif" }}>
        <span style={{ fontSize: 12, color: '#9B7E7E', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 12, color: '#3D2020', fontWeight: 700 }}>{current}g</span>
      </div>
      <div style={{ height: 6, borderRadius: 6, background: '#FFE8E0', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct * 100}%`,
          background: color, borderRadius: 6,
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  );
}

function MealSummaryRow({ meal, calories, onTap }: { meal: string; calories: number; onTap: () => void }) {
  const emoji = meal === 'Breakfast' ? '🌅' : meal === 'Lunch' ? '☀️' : meal === 'Dinner' ? '🌙' : meal === 'Snacks' ? '🍎' : '🍽';
  return (
    <div onClick={onTap} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', cursor: 'pointer',
      borderBottom: '1px solid #FFF0EB',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: '#FFF0EB', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>{emoji}</div>
        <div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700, color: '#3D2020' }}>{meal}</div>
          {calories > 0
            ? <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: '#C4A89A' }}>{calories} kcal logged</div>
            : <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: '#D4BEB8' }}>Nothing yet</div>
          }
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {calories > 0 && <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700, color: '#FF8B7A' }}>{calories}</span>}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 4l4 4-4 4" stroke="#D4BEB8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

export function HomeScreen({ userName, mochiState, meals, calorieGoal, onLogMeal, onSelectMeal }: {
  userName: string;
  mochiState: MochiState;
  meals: Meal[];
  calorieGoal: number;
  onLogMeal: () => void;
  onSelectMeal: (m: Meal) => void;
}) {
  const consumed = meals.reduce((acc, m) => acc + m.calories, 0);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const mochiMessage = () => {
    const pct = consumed / calorieGoal;
    if (pct === 0) return "Log your first meal and let's get going! 🌱";
    if (pct < 0.5) return "Great start! Keep nourishing yourself 💛";
    if (pct < 0.9) return "You're doing amazing — almost there! ✨";
    if (pct <= 1.0) return "Right on track today! I'm so proud of you 🎉";
    return "A little over — that's totally okay! Tomorrow is fresh 🌸";
  };

  const streak = 5;

  return (
    <div style={{
      height: '100%', overflowY: 'auto', overflowX: 'hidden',
      background: '#FDF6F0', fontFamily: "'Nunito', sans-serif",
      paddingBottom: 20,
    }}>
      <div style={{ padding: '60px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 14, color: '#C4A89A', fontWeight: 600 }}>{greeting()},</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#3D2020' }}>{userName} 👋</div>
          </div>
          <div style={{
            background: '#FFF0EB', borderRadius: 16, padding: '8px 14px',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 18 }}>🔥</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#FF8B7A', lineHeight: 1 }}>{streak}</div>
              <div style={{ fontSize: 10, color: '#C4A89A', fontWeight: 600 }}>day streak</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        margin: '20px 20px 0',
        background: 'linear-gradient(145deg, #FFF5F0, #FFE8E0)',
        borderRadius: 32, padding: '24px 20px 20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
          width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(255,180,160,0.3) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <MochiAnimated state={mochiState} size={130} style={{ position: 'relative' }} />
        <div style={{
          marginTop: 12, background: '#fff',
          borderRadius: 20, borderBottomLeftRadius: 6,
          padding: '12px 18px', maxWidth: 280,
          boxShadow: '0 4px 16px rgba(255,140,120,0.12)',
        }}>
          <p style={{ margin: 0, fontSize: 14, color: '#9B7E7E', lineHeight: 1.5, textAlign: 'center' }}>
            {mochiMessage()}
          </p>
        </div>
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 20, width: '100%' }}>
          <CalorieRing consumed={consumed} goal={calorieGoal} size={130} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <MacroBar label="Carbs" current={Math.round(consumed * 0.5 / 4)} max={Math.round(calorieGoal * 0.5 / 4)} color="#FFB5A7" />
            <MacroBar label="Protein" current={Math.round(consumed * 0.25 / 4)} max={Math.round(calorieGoal * 0.25 / 4)} color="#FF8B7A" />
            <MacroBar label="Fat" current={Math.round(consumed * 0.25 / 9)} max={Math.round(calorieGoal * 0.25 / 9)} color="#FFD166" />
          </div>
        </div>
      </div>

      <div style={{ margin: '16px 20px 0' }}>
        <button onClick={onLogMeal} style={{
          width: '100%', padding: '16px 20px',
          background: 'linear-gradient(135deg, #FF8B7A, #FFB5A7)',
          border: 'none', borderRadius: 22, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 6px 20px rgba(255,139,122,0.3)',
          transition: 'transform 0.15s ease',
        }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="10" fill="rgba(255,255,255,0.25)" />
            <path d="M11 6v10M6 11h10" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 17, fontWeight: 800, color: '#fff' }}>
            Log a meal
          </span>
        </button>
      </div>

      <div style={{ margin: '20px 20px 0' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#3D2020', marginBottom: 12 }}>Today's meals</div>
        <div style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 20px rgba(255,140,120,0.08)' }}>
          {meals.map((m, i) => (
            <MealSummaryRow key={i} meal={m.name} calories={m.calories} onTap={() => onSelectMeal(m)} />
          ))}
          <MealSummaryRow meal="Snacks" calories={0} onTap={onLogMeal} />
        </div>
      </div>

      <div style={{
        margin: '16px 20px 0',
        background: 'linear-gradient(135deg, #E8F4FF, #D4EAFF)',
        borderRadius: 24, padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ fontSize: 28 }}>💧</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#3D6080' }}>Stay hydrated!</div>
          <div style={{ fontSize: 13, color: '#7BA8C8', marginTop: 2 }}>Mochi reminds you to drink water 🌊</div>
        </div>
      </div>
    </div>
  );
}
