import Link from 'next/link';

type GradientButtonProps = {
  href: string;
  label: string;
};

export function GradientButton({ href, label }: GradientButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex h-16 w-full items-center justify-center gap-3 rounded-3xl bg-warm px-6 text-4xl font-semibold text-white shadow-card transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/60 sm:h-18"
    >
      {label}
      <span aria-hidden="true" className="text-5xl leading-none">›</span>
    </Link>
  );
}
