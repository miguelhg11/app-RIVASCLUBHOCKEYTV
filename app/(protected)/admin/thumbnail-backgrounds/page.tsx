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
        <ul className="mt-2 space-y-3 text-sm">
          {items.map((item) => (
            <li key={item.id} className="glass-card rounded-lg p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-24 aspect-video rounded border border-white/10 bg-black/40 overflow-hidden shrink-0 flex items-center justify-center relative">
                  <img src={`/api/thumbnail/background?id=${item.id}`} alt={item.name} className="w-full h-full object-cover" />
                  {item.is_default && (
                    <span className="absolute top-1 left-1 rounded bg-accent-cyan px-1 py-0.5 text-[8px] font-extrabold text-black uppercase">
                      Default
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white truncate text-base">{item.name}</p>
                  <p className="text-xs text-text-muted truncate mt-0.5">Ruta: {item.url_path}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider mt-1 text-accent-cyan">
                    {item.active ? "Activo" : "Inactivo"} {item.is_default ? "· Fondo por defecto" : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <ThumbnailBackgroundEditForm id={item.id} name={item.name} urlPath={item.url_path} isDefault={!!item.is_default} />
                <ActiveToggleForm target="thumbnail_background" id={item.id} active={item.active} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
