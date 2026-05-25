import { CategoryCreateForm } from "@/src/components/admin/category-create-form";
import { CategoryEditForm } from "@/src/components/admin/category-edit-form";
import { CategoryDeleteForm } from "@/src/components/admin/category-delete-form";
import { listCategories } from "@/src/lib/admin/queries";
import { getSupabaseSchemaStatus } from "@/src/lib/supabase/schema-diagnostics";

export default async function AdminCategoriesPage() {
  const [categories, schema] = await Promise.all([listCategories(), getSupabaseSchemaStatus()]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-wide text-white">Admin · Categorias</h1>
      {!schema.categoriesSortOrder ? (
        <section className="mt-3 rounded border border-amber-600/50 bg-amber-500/10 p-3 text-xs text-amber-100">
          Supabase sin columna <code>categories.sort_order</code>. El orden personalizado puede no persistir hasta aplicar migraciones.
        </section>
      ) : null}
      <div className="mt-4">
        <CategoryCreateForm />
      </div>

      <section className="mt-4 glass-panel rounded-xl p-5">
        <h2 className="font-display text-sm font-semibold tracking-wider text-text-muted uppercase">Categorias ({categories.length})</h2>
        <ul className="mt-2 space-y-2">
          {categories.map((category, index) => (
            <li key={category.id} className="glass-card rounded-lg px-4 py-3 text-sm">
              <p>{index + 1}. {category.name}</p>
              <CategoryEditForm id={category.id} name={category.name} sortOrder={category.sort_order} />
              <CategoryDeleteForm id={category.id} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
