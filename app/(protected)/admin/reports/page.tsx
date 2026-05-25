import Link from "next/link";
import { requireAdmin } from "@/src/lib/auth/guards";
import { SharePdfButton } from "@/src/components/admin/share-pdf-button";
import { getWeeklyBroadcastRows } from "@/src/lib/reports/weekly";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminReportsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();

  const params = await searchParams;
  const now = new Date();
  const defaultFrom = toDateInput(now);
  const to = new Date(now);
  to.setDate(to.getDate() + 7);
  const defaultTo = toDateInput(to);

  const from = typeof params.from === "string" ? params.from : defaultFrom;
  const until = typeof params.to === "string" ? params.to : defaultTo;

  const fromIso = `${from}T00:00:00.000Z`;
  const toIso = `${until}T23:59:59.999Z`;
  const rows = await getWeeklyBroadcastRows({ fromIso, toIso });

  const pdfHref = `/api/admin/reports/weekly?from=${encodeURIComponent(from)}&to=${encodeURIComponent(until)}`;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-wide text-white">Admin · Reportes semanales</h1>
      <p className="mt-1 text-sm text-text-muted">
        Solo administradores. Incluye emisiones de la app y programaciones detectadas en YouTube Studio.
      </p>

      <form className="mt-4 grid gap-3 glass-panel rounded-xl p-5 sm:grid-cols-4" method="GET">
        <label className="text-sm font-medium">
          <span className="mb-1 block text-text-muted">Desde</span>
          <input type="date" name="from" defaultValue={from} className="w-full glass-card rounded-lg px-4 py-3" />
        </label>
        <label className="text-sm font-medium">
          <span className="mb-1 block text-text-muted">Hasta</span>
          <input type="date" name="to" defaultValue={until} className="w-full glass-card rounded-lg px-4 py-3" />
        </label>
        <div className="flex items-end gap-2 sm:col-span-2">
          <button type="submit" className="btn-primary rounded-lg px-4 py-2 text-xs">
            Filtrar
          </button>
          <a href={pdfHref} className="rounded border border-accent-cyan px-4 py-2 font-medium text-accent-cyan">
            Descargar PDF
          </a>
          <SharePdfButton pdfHref={pdfHref} />
        </div>
      </form>

      <section className="mt-4 glass-panel rounded-xl p-5">
        <h2 className="font-display text-sm font-semibold tracking-wider text-text-muted uppercase">Programaciones ({rows.length})</h2>
        <div className="mt-3 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-text-muted">
                <th className="px-2 py-2">PARTIDO</th>
                <th className="px-2 py-2">FECHA</th>
                <th className="px-2 py-2">HORA</th>
                <th className="px-2 py-2">LINK YOUTUBE</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.source}-${row.scheduledStart}-${row.title}`} className="border-b border-white/8">
                  <td className="px-2 py-2 font-medium text-white">{row.title}</td>
                  <td className="px-2 py-2 text-text-muted">{row.dateLabel}</td>
                  <td className="px-2 py-2 text-text-muted">{row.timeLabel}</td>
                  <td className="px-2 py-2">
                    {row.watchUrl ? (
                      <a href={row.watchUrl} target="_blank" rel="noreferrer" className="text-accent-cyan hover:underline break-all">
                        {row.watchUrl}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-4 text-sm">
        <Link href="/admin" className="text-accent-cyan underline">
          Volver a Admin
        </Link>
      </div>
    </div>
  );
}

function toDateInput(value: Date) {
  const y = value.getUTCFullYear();
  const m = String(value.getUTCMonth() + 1).padStart(2, "0");
  const d = String(value.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
