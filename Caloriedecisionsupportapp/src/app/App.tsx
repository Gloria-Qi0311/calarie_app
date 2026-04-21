import { useState, useMemo, useEffect, useCallback } from 'react';
import { MochiState } from './components/Mochi';
import { NavBar, Screen } from './components/Nav';
import { OnboardingScreen } from './components/Onboarding';
import { HomeScreen } from './components/Home';
import { FoodLogScreen, MealEntryScreen, Food } from './components/FoodLog';
import { ProgressScreen } from './components/Progress';
import { SettingsScreen } from './components/Settings';
import { api, Profile, IntakeEntry } from '../lib/api';

function getUserId(): string {
  let id = localStorage.getItem('fitty_user_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('fitty_user_id', id);
  }
  return id;
}

interface Meal {
  id?: string;
  name: string;
  calories: number;
}

export default function App() {
  const userId = useMemo(getUserId, []);

  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('fitty_onboarded') === 'true');
  const [screen, setScreen] = useState<Screen>(() => (localStorage.getItem('fitty_screen') as Screen) || 'home');
  const [userName, setUserName] = useState('you');
  const [calorieGoal, setCalorieGoal] = useState(1500);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [profileRes, todayRes] = await Promise.all([
        api.getProfile(userId),
        api.getToday(userId),
      ]);
      setUserName(profileRes.profile.name || 'you');
      setCalorieGoal(profileRes.profile.dailyCalorieTarget || 1500);
      const entries: IntakeEntry[] = todayRes.intakeEntries || [];
      setMeals(entries.map(e => ({ id: e.id, name: e.description, calories: e.calories })));
    } catch {
      // first time user — no profile yet, fall back to onboarding
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (onboarded) loadData();
    else setLoading(false);
  }, [onboarded, loadData]);

  const consumed = meals.reduce((a, m) => a + m.calories, 0);

  const mochiState = useMemo((): MochiState => {
    const pct = consumed / calorieGoal;
    if (pct === 0) return 'neutral';
    if (pct < 0.5) return 'happy';
    if (pct <= 1.0) return 'excited';
    return 'proud';
  }, [consumed, calorieGoal]);

  const navigate = (s: Screen) => {
    setScreen(s);
    localStorage.setItem('fitty_screen', s);
  };

  const handleOnboardingComplete = async ({ name, goal }: { name: string; goal: number }) => {
    try {
      await api.updateProfile(userId, {
        name,
        dailyCalorieTarget: goal,
      });
    } catch { /* ignore, save locally */ }
    setUserName(name);
    setCalorieGoal(goal);
    localStorage.setItem('fitty_onboarded', 'true');
    setOnboarded(true);
    navigate('home');
  };

  const handleAddFood = async (food: Food & { servings: number }) => {
    try {
      const res = await api.createIntake(userId, {
        description: food.name,
        calories: food.cal,
        mealTag: 'dinner',
      });
      setMeals(prev => [...prev, { id: res.entry.id, name: food.name, calories: food.cal }]);
    } catch {
      setMeals(prev => [...prev, { name: food.name, calories: food.cal }]);
    }
    setTimeout(() => { setSelectedFood(null); navigate('home'); }, 900);
  };

  const handleLogout = () => {
    localStorage.clear();
    setOnboarded(false);
    setScreen('home');
    setUserName('you');
    setCalorieGoal(1500);
    setMeals([]);
    setSelectedFood(null);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#FDF6F0',
        fontFamily: "'Nunito', sans-serif", fontSize: 16, color: '#C4A89A',
      }}>
        Loading…
      </div>
    );
  }

  const renderScreen = () => {
    if (!onboarded) return <OnboardingScreen onComplete={handleOnboardingComplete} />;
    switch (screen) {
      case 'home': return (
        <HomeScreen
          userName={userName}
          mochiState={mochiState}
          meals={meals}
          calorieGoal={calorieGoal}
          onLogMeal={() => navigate('foodlog')}
          onSelectMeal={() => navigate('foodlog')}
        />
      );
      case 'foodlog': return selectedFood
        ? <MealEntryScreen food={selectedFood} onAdd={handleAddFood} onBack={() => setSelectedFood(null)} mealType="Dinner" />
        : <FoodLogScreen onSelectFood={setSelectedFood} />;
      case 'progress': return <ProgressScreen userId={userId} calorieGoal={calorieGoal} />;
      case 'settings': return <SettingsScreen userName={userName} calorieGoal={calorieGoal} onLogout={handleLogout} />;
      default: return null;
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh',
    }}>
      <div style={{
        width: '100%', maxWidth: 430,
        height: '100dvh', maxHeight: 900,
        display: 'flex', flexDirection: 'column',
        background: '#FDF6F0',
        overflow: 'hidden',
        boxShadow: '0 0 60px rgba(0,0,0,0.1)',
      }}>
        <div style={{ flex: 1, overflow: 'hidden' }}>{renderScreen()}</div>
        {onboarded && !selectedFood && (
          <NavBar screen={screen} setScreen={(s) => { setSelectedFood(null); navigate(s); }} />
        )}
      </div>
    </div>
  );
}
