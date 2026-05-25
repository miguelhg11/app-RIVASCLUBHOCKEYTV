export function AdminPlaceholder({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-wide text-white">{title}</h1>
      <p className="mt-2 text-sm text-text-muted">CRUD base se implementa en iteracion siguiente de Fase 1.</p>
    </div>
  );
}
