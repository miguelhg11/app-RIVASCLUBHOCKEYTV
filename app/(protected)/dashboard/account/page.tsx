import { requireSession } from "@/src/lib/auth/guards";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";
import { ChangePasswordForm } from "@/src/components/account/change-password-form";

export default async function AccountPage() {
  const session = await requireSession();
  const supabase = getSupabaseServerClient();
  const { data: user } = await supabase.from("users").select("name,email,phone").eq("id", session.userId).maybeSingle();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-wide text-white">Mi perfil</h1>
      <section className="mt-4 glass-panel rounded-xl p-5 text-sm">
        <p><strong>Nombre:</strong> {user?.name ?? "-"}</p>
        <p><strong>Email:</strong> {user?.email ?? "-"}</p>
        <p><strong>Telefono:</strong> {user?.phone ?? "-"}</p>
      </section>
      <div className="mt-4">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
