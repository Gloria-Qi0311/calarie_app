import { ReactNode } from 'react';

type FeatureCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  iconBgClass: string;
};

export function FeatureCard({ icon, title, description, iconBgClass }: FeatureCardProps) {
  return (
    <article className="flex items-center gap-4 rounded-xxl border border-slate-200/70 bg-white px-4 py-5 shadow-card sm:gap-5 sm:px-6 sm:py-6">
      <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${iconBgClass}`}>{icon}</div>
      <div>
        <h3 className="text-3xl/none font-semibold tracking-tight text-brandNavy sm:text-[2.05rem]">{title}</h3>
        <p className="mt-2 text-xl text-bodyMuted sm:text-[1.9rem]">{description}</p>
      </div>
    </article>
  );
}
