import { ReactNode } from 'react';

type FeatureCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  iconBgClass: string;
};

export function FeatureCard({ icon, title, description, iconBgClass }: FeatureCardProps) {
  return (
    <article className="flex items-center gap-4 rounded-xxl border border-slate-200/90 bg-[#fafafa] px-5 py-5 shadow-card sm:gap-5 sm:px-7 sm:py-6">
      <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${iconBgClass}`}>{icon}</div>
      <div>
        <h3 className="text-2xl font-semibold tracking-tight text-brandNavy sm:text-[2.75rem]">{title}</h3>
        <p className="mt-1.5 text-xl text-bodyMuted sm:text-[2.05rem]">{description}</p>
      </div>
    </article>
  );
}
