type EditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditBroadcastPage({ params }: EditPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-wide text-white">Editar broadcast</h1>
      <p className="mt-2 text-sm text-text-muted">Placeholder Fase 1 para broadcast {id}.</p>
    </div>
  );
}
