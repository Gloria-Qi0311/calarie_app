import { useState } from 'react';

export interface Food {
  name: string;
  cal: number;
  carbs: number;
  protein: number;
  fat: number;
  emoji: string;
}

const FOODS_DB: Food[] = [
  { name: 'Avocado Toast', cal: 320, carbs: 30, protein: 9, fat: 18, emoji: '🥑' },
  { name: 'Greek Yogurt', cal: 150, carbs: 12, protein: 17, fat: 3, emoji: '🫙' },
  { name: 'Banana', cal: 105, carbs: 27, protein: 1, fat: 0, emoji: '🍌' },
  { name: 'Chicken Salad', cal: 380, carbs: 12, protein: 40, fat: 18, emoji: '🥗' },
  { name: 'Brown Rice (1 cup)', cal: 216, carbs: 45, protein: 5, fat: 2, emoji: '🍚' },
  { name: 'Oatmeal', cal: 158, carbs: 27, protein: 6, fat: 3, emoji: '🥣' },
  { name: 'Scrambled Eggs', cal: 200, carbs: 2, protein: 14, fat: 15, emoji: '🍳' },
  { name: 'Salmon (150g)', cal: 280, carbs: 0, protein: 39, fat: 13, emoji: '🐟' },
  { name: 'Apple', cal: 95, carbs: 25, protein: 0, fat: 0, emoji: '🍎' },
  { name: 'Almond Butter', cal: 190, carbs: 7, protein: 7, fat: 16, emoji: '🥜' },
  { name: 'Latte (oat milk)', cal: 120, carbs: 18, protein: 4, fat: 3, emoji: '☕' },
  { name: 'Sweet Potato', cal: 130, carbs: 30, protein: 2, fat: 0, emoji: '🍠' },
];

function FoodItem({ food, onSelect }: { food: Food; onSelect: (f: Food) => void }) {
  return (
    <div onClick={() => onSelect(food)} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '13px 16px', cursor: 'pointer',
      borderBottom: '1px solid #FFF0EB',
      transition: 'background 0.15s ease',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = '#FFF8F5')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 14,
          background: '#FFF0EB', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>{food.emoji}</div>
        <div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700, color: '#3D2020' }}>{food.name}</div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: '#C4A89A', marginTop: 2 }}>
            {food.carbs}g carbs · {food.protein}g protein · {food.fat}g fat
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700, color: '#FF8B7A' }}>{food.cal}</span>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: '#C4A89A' }}>kcal</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 4l4 4-4 4" stroke="#D4BEB8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

export function FoodLogScreen({ onSelectFood }: { onSelectFood: (f: Food) => void }) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Breakfast');
  const mealTabs = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
  const filtered = query ? FOODS_DB.filter(f => f.name.toLowerCase().includes(query.toLowerCase())) : FOODS_DB;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#FDF6F0', fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ padding: '60px 20px 16px', background: '#FDF6F0' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#3D2020', marginBottom: 4 }}>Log Food</div>
        <div style={{ fontSize: 14, color: '#C4A89A' }}>What did Mochi eat with you today? 🍽</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {mealTabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              flexShrink: 0, padding: '8px 16px',
              borderRadius: 20, border: 'none', cursor: 'pointer',
              fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700,
              background: activeTab === t ? '#FF8B7A' : '#FFE0D0',
              color: activeTab === t ? '#fff' : '#C4A89A',
              transition: 'all 0.2s ease',
            }}>{t}</button>
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#FFF5F0', borderRadius: 18,
            padding: '12px 16px', border: '2px solid #FFE0D0',
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="8" cy="8" r="6" stroke="#C4A89A" strokeWidth="1.8" />
              <path d="M13 13l3 3" stroke="#C4A89A" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search foods…" style={{
              flex: 1, border: 'none', background: 'transparent',
              fontFamily: "'Nunito', sans-serif", fontSize: 16,
              color: '#3D2020', outline: 'none',
            }} />
            {query && (
              <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" fill="#FFD5C8" />
                  <path d="M5 5l6 6M11 5l-6 6" stroke="#FF8B7A" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!query && (
          <div style={{ padding: '4px 20px 8px', fontSize: 13, fontWeight: 700, color: '#C4A89A', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Recent
          </div>
        )}
        {query && filtered.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 40 }}>🥺</div>
            <div style={{ fontSize: 16, color: '#C4A89A', marginTop: 12 }}>Mochi couldn't find that food</div>
            <div style={{ fontSize: 14, color: '#D4BEB8', marginTop: 4 }}>Try a different name</div>
          </div>
        )}
        <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', overflow: 'hidden' }}>
          {filtered.map((food, i) => <FoodItem key={i} food={food} onSelect={onSelectFood} />)}
        </div>
      </div>
    </div>
  );
}

export function MealEntryScreen({ food, onAdd, onBack, mealType = 'Breakfast' }: {
  food: Food;
  onAdd: (f: Food & { servings: number }) => void;
  onBack: () => void;
  mealType?: string;
}) {
  const [servings, setServings] = useState(1);
  const [added, setAdded] = useState(false);

  const cal = Math.round(food.cal * servings);
  const carbs = Math.round(food.carbs * servings);
  const protein = Math.round(food.protein * servings);
  const fat = Math.round(food.fat * servings);

  const handleAdd = () => {
    setAdded(true);
    setTimeout(() => onAdd({ ...food, cal, servings }), 800);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#FDF6F0', fontFamily: "'Nunito', sans-serif", overflowY: 'auto' }}>
      <div style={{ padding: '60px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{
          background: '#FFF0EB', border: 'none', borderRadius: 14,
          width: 40, height: 40, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
            <path d="M8 2L2 8l6 6" stroke="#FF8B7A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#3D2020' }}>Add to {mealType}</div>
      </div>

      <div style={{ margin: '20px 20px 0', background: '#fff', borderRadius: 28, padding: 24, boxShadow: '0 4px 20px rgba(255,140,120,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'linear-gradient(135deg, #FFF0EB, #FFD5C8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32,
          }}>{food.emoji}</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#3D2020' }}>{food.name}</div>
            <div style={{ fontSize: 14, color: '#C4A89A', marginTop: 2 }}>per serving</div>
          </div>
        </div>
        <div style={{
          textAlign: 'center', margin: '24px 0 20px',
          background: 'linear-gradient(135deg, #FFF5F0, #FFE8E0)',
          borderRadius: 22, padding: '20px 0',
        }}>
          <div style={{ fontSize: 52, fontWeight: 800, color: '#FF8B7A', lineHeight: 1 }}>{cal}</div>
          <div style={{ fontSize: 15, color: '#C4A89A', marginTop: 4 }}>calories</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{ label: 'Carbs', val: carbs, color: '#FFB5A7' }, { label: 'Protein', val: protein, color: '#FF8B7A' }, { label: 'Fat', val: fat, color: '#FFD166' }].map(m => (
            <div key={m.label} style={{ flex: 1, textAlign: 'center', background: '#FFF8F5', borderRadius: 16, padding: '12px 0' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: m.color }}>{m.val}g</div>
              <div style={{ fontSize: 12, color: '#C4A89A', marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ margin: '16px 20px 0', background: '#fff', borderRadius: 24, padding: '20px' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#3D2020', marginBottom: 14 }}>Servings</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => setServings(Math.max(0.5, servings - 0.5))} style={{
            width: 44, height: 44, borderRadius: 14, border: 'none',
            background: '#FFF0EB', cursor: 'pointer',
            fontSize: 22, color: '#FF8B7A', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>−</button>
          <div style={{ flex: 1, textAlign: 'center', fontSize: 28, fontWeight: 800, color: '#3D2020' }}>{servings}</div>
          <button onClick={() => setServings(servings + 0.5)} style={{
            width: 44, height: 44, borderRadius: 14, border: 'none',
            background: '#FF8B7A', cursor: 'pointer',
            fontSize: 22, color: '#fff', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>+</button>
        </div>
      </div>

      <div style={{ padding: '20px 20px' }}>
        <button onClick={handleAdd} disabled={added} style={{
          width: '100%', padding: '18px 0',
          background: added ? 'linear-gradient(135deg, #B5E8C8, #9AD9B0)' : 'linear-gradient(135deg, #FF8B7A, #FFB5A7)',
          border: 'none', borderRadius: 24, cursor: added ? 'default' : 'pointer',
          fontFamily: "'Nunito', sans-serif", fontSize: 17, fontWeight: 800,
          color: '#fff',
          boxShadow: added ? '0 6px 20px rgba(100,200,130,0.3)' : '0 6px 20px rgba(255,139,122,0.3)',
          transition: 'all 0.4s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          {added ? (
            <>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" fill="rgba(255,255,255,0.3)" />
                <path d="M5 10l4 4 6-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Added! Mochi is happy 🎉
            </>
          ) : `Add ${cal} kcal to ${mealType}`}
        </button>
      </div>
    </div>
  );
}
