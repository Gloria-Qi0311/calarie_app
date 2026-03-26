type MetricCardProps = {
  label: string;
  value: string;
  helper: string;
};

export function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <article className="rounded-xxl border border-slate-200/70 bg-white p-5 shadow-card">
      <p className="text-sm font-medium uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-3 text-4xl font-semibold text-brandNavy">{value}</p>
      <p className="mt-2 text-base text-bodyMuted">{helper}</p>
    </article>
  );
}
