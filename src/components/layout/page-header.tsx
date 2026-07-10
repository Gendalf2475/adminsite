export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-extrabold uppercase tracking-[.18em] text-fuchsia-200">{eyebrow}</p> : null}
        <h1 className="mt-2 font-display text-3xl font-semibold text-white md:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm text-[var(--text-muted)] md:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
