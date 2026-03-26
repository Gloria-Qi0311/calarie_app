import { GradientButton } from '@/components/ui/GradientButton';
import { MetricCard } from './MetricCard';
import { QuickAction } from './QuickAction';

const metrics = [
  { label: 'Calories left', value: '640', helper: 'You are on track for today.' },
  { label: 'Protein', value: '78g', helper: '22g to hit your target.' },
  { label: 'Streak', value: '6 days', helper: 'Consistency builds confidence.' },
];

const actions = [
  { href: '#', title: 'What can I eat right now?', description: 'Get instant meal ideas that fit your remaining calories.' },
  { href: '#', title: 'Log a quick meal', description: 'Capture what you ate in seconds with minimal effort.' },
  { href: '#', title: 'Plan dinner', description: 'Build a balanced dinner around your goals.' },
];

export function DashboardContent() {
  return (
    <section className="mx-auto max-w-5xl">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">NourishFlow</p>
        <h1 className="mt-3 text-4xl font-bold text-brandNavy sm:text-5xl">Home Dashboard</h1>
        <p className="mt-3 max-w-2xl text-lg text-bodyMuted">
          A calm snapshot of your day with quick actions to make confident food decisions.
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="mt-8 rounded-xxl border border-slate-200/70 bg-white p-5 shadow-card sm:p-6">
        <h2 className="text-2xl font-semibold text-brandNavy">Quick Actions</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {actions.map((action) => (
            <QuickAction key={action.title} {...action} />
          ))}
        </div>
      </div>

      <div className="mt-8 max-w-sm">
        <GradientButton href="/" label="Back to Onboarding" />
      </div>
    </section>
  );
}
