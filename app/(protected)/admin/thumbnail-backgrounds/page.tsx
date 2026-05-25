import { ThumbnailBackgroundCreateForm } from "@/src/components/admin/thumbnail-background-create-form";
import { ActiveToggleForm } from "@/src/components/admin/active-toggle-form";
import { ThumbnailBackgroundEditForm } from "@/src/components/admin/thumbnail-background-edit-form";
import { listThumbnailBackgrounds } from "@/src/lib/admin/queries";

export default async function AdminThumbnailBackgroundsPage() {
  const items = await listThumbnailBackgrounds();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-wide text-white">Admin · Fondos miniatura</h1>
      <div className="mt-4">
        <ThumbnailBackgroundCreateForm />
      </div>
      <section className="mt-4 glass-panel rounded-xl p-5">
        <h2 className="font-display text-sm font-semibold tracking-wider text-text-muted uppercase">Fondos ({items.length})</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.id} className="glass-card rounded-lg px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p>
                  <strong>{item.name}</strong> · {item.url_path} · {item.active ? "activo" : "inactivo"}
                </p>
                <ActiveToggleForm target="thumbnail_background" id={item.id} active={item.active} />
              </div>
              <ThumbnailBackgroundEditForm id={item.id} name={item.name} urlPath={item.url_path} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
