import { FederationsSettingsForm } from "@/src/components/admin/federations-settings-form";
import { getFederationSourcesConfig } from "@/src/lib/federations/settings";

export default async function AdminFederationsPage() {
  const sources = await getFederationSourcesConfig();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">Admin · Federaciones</h1>
      <p className="mt-2 text-sm text-text-muted">
        Esta seccion es solo para configuracion tecnica de fuentes y diagnostico.
        La agenda de competiciones para uso diario esta en `Agenda competiciones` del menu principal.
      </p>
      <div className="mt-4">
        <FederationsSettingsForm sources={sources} />
      </div>
    </div>
  );
}
