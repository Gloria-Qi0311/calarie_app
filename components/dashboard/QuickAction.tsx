import Link from 'next/link';

type QuickActionProps = {
  href: string;
  title: string;
  description: string;
};

export function QuickAction({ href, title, description }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="block rounded-xxl border border-slate-200/70 bg-white p-5 shadow-card transition-shadow hover:shadow-md"
    >
      <h3 className="text-xl font-semibold text-brandNavy">{title}</h3>
      <p className="mt-2 text-base text-bodyMuted">{description}</p>
    </Link>
  );
}
