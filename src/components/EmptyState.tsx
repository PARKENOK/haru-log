export default function EmptyState({ emoji, title, children }: {
  emoji: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-card px-6 py-14 text-center">
      <div className="text-4xl">{emoji}</div>
      <p className="mt-3 font-hand text-2xl">{title}</p>
      {children && <p className="mt-2 text-sm text-ink-soft">{children}</p>}
    </div>
  );
}
