export function LoadingState({ label = "Загрузка" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm font-semibold text-[var(--text-muted)]">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-fuchsia-400 shadow-[0_0_16px_rgba(217,70,239,.8)]" />
      {label}
    </div>
  );
}
