import { FeatureCard } from '@/components/ui/FeatureCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { BoltIcon, HeartIcon, TargetIcon } from '@/components/ui/Icons';

const features = [
  {
    title: 'Smart Decisions',
    description: 'Quick answers to "what can I eat?"',
    icon: <TargetIcon />,
    iconBgClass: 'bg-[#f5debe]',
  },
  {
    title: 'Minimal Effort',
    description: 'Log meals in seconds, not minutes',
    icon: <BoltIcon />,
    iconBgClass: 'bg-[#f7dce3]',
  },
  {
    title: 'Supportive Guidance',
    description: 'Meal suggestions that fit your day',
    icon: <HeartIcon />,
    iconBgClass: 'bg-[#f6e7b7]',
  },
];

export function OnboardingContent() {
  return (
    <section className="mx-auto mt-10 max-w-[760px]">
      <header className="text-center">
        <h1 className="text-[3.5rem] font-bold tracking-tight text-brandNavy sm:text-[4.25rem]">Welcome to NourishFlow</h1>
        <p className="mx-auto mt-5 max-w-[700px] text-[2rem] leading-relaxed text-bodyMuted sm:text-[2.15rem]">
          Your calorie decision assistant that helps you eat with confidence. No complicated logging, just simple
          guidance.
        </p>
      </header>

      <div className="mt-12 space-y-5 sm:mt-14 sm:space-y-6">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>

      <div className="mt-12 sm:mt-14">
        <GradientButton href="/dashboard" label="Get Started" />
      </div>
    </section>
  );
}
