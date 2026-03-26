import { FeatureCard } from '@/components/ui/FeatureCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { BoltIcon, HeartIcon, TargetIcon } from '@/components/ui/Icons';

const features = [
  {
    title: 'Smart Decisions',
    description: 'Quick answers to "what can I eat?"',
    icon: <TargetIcon />,
    iconBgClass: 'bg-amber-100',
  },
  {
    title: 'Minimal Effort',
    description: 'Log meals in seconds, not minutes',
    icon: <BoltIcon />,
    iconBgClass: 'bg-pink-100',
  },
  {
    title: 'Supportive Guidance',
    description: 'Meal suggestions that fit your day',
    icon: <HeartIcon />,
    iconBgClass: 'bg-amber-100',
  },
];

export function OnboardingContent() {
  return (
    <section className="mx-auto max-w-3xl">
      <header className="text-center">
        <h1 className="mt-10 text-5xl font-bold tracking-tight text-brandNavy sm:text-6xl">Welcome to NourishFlow</h1>
        <p className="mx-auto mt-5 max-w-2xl text-2xl leading-relaxed text-bodyMuted sm:text-3xl">
          Your calorie decision assistant that helps you eat with confidence. No complicated logging, just simple guidance.
        </p>
      </header>

      <div className="mt-12 space-y-4 sm:space-y-5">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>

      <div className="mt-12">
        <GradientButton href="/dashboard" label="Get Started" />
      </div>
    </section>
  );
}
