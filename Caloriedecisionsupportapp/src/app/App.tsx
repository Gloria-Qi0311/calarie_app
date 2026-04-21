import { useState, useMemo } from 'react';
import { MochiState } from './components/Mochi';
import { NavBar, Screen } from './components/Nav';
import { OnboardingScreen } from './components/Onboarding';
import { HomeScreen } from './components/Home';
import { FoodLogScreen, MealEntryScreen, Food } from './components/FoodLog';
import { ProgressScreen } from './components/Progress';
import { SettingsScreen } from './components/Settings';

interface Meal {
  name: string;
  calories: number;
}

export default function App() {
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('fitty_onboarded') === 'true');
  const [screen, setScreen] = useState<Screen>(() => (localStorage.getItem('fitty_screen') as Screen) || 'home');
  const [userName, setUserName] = useState(() => localStorage.getItem('fitty_name') || 'you');
  const [calorieGoal, setCalorieGoal] = useState(() => Number(localStorage.getItem('fitty_goal') || 1500));
  const [meals, setMeals] = useState<Meal[]>([
    { name: 'Breakfast', calories: 320 },
    { name: 'Lunch', calories: 480 },
    { name: 'Dinner', calories: 0 },
  ]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);

  const consumed = meals.reduce((a, m) => a + m.calories, 0);

  const mochiState = useMemo((): MochiState => {
    const pct = consumed / calorieGoal;
    if (pct === 0) return 'neutral';
    if (pct < 0.5) return 'happy';
    if (pct <= 1.0) return 'excited';
    return 'proud';
  }, [consumed, calorieGoal]);

  const handleLogout = () => {
    localStorage.clear();
    setOnboarded(false);
    setScreen('home');
    setUserName('you');
    setCalorieGoal(1500);
    setMeals([
      { name: 'Breakfast', calories: 320 },
      { name: 'Lunch', calories: 480 },
      { name: 'Dinner', calories: 0 },
    ]);
    setSelectedFood(null);
  };

  const navigate = (s: Screen) => {
    setScreen(s);
    localStorage.setItem('fitty_screen', s);
  };

  const handleOnboardingComplete = ({ name, goal }: { name: string; goal: number }) => {
    setUserName(name);
    setCalorieGoal(goal);
    localStorage.setItem('fitty_name', name);
    localStorage.setItem('fitty_goal', String(goal));
    localStorage.setItem('fitty_onboarded', 'true');
    setOnboarded(true);
    navigate('home');
  };

  const handleAddFood = (food: Food & { servings: number }) => {
    setMeals(prev => {
      const updated = [...prev];
      const dinner = updated.find(m => m.name === 'Dinner');
      if (dinner && dinner.calories === 0) {
        dinner.calories = food.cal;
      } else {
        updated.push({ name: food.name, calories: food.cal });
      }
      return updated;
    });
    setTimeout(() => { setSelectedFood(null); navigate('home'); }, 900);
  };

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
      case 'progress': return <ProgressScreen />;
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
