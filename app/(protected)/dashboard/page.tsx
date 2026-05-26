import Link from "next/link";
import { logoutAction } from "@/src/actions/auth.actions";
import { requireSession } from "@/src/lib/auth/guards";
import { ROLES } from "@/src/lib/auth/roles";
import { countLiveBroadcastsForSession } from "@/src/lib/broadcast/queries";
import { ReactiveSyncHandler } from "@/src/components/ui/reactive-sync-handler";

export default async function DashboardPage() {
  const session = await requireSession();
  const isAdmin = session.role === ROLES.admin;
  const liveCount = await countLiveBroadcastsForSession();

  return (
    <div className="space-y-8">
      <ReactiveSyncHandler />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-white">
            DASHBOARD
          </h1>
          <p className="mt-1 text-xs tracking-widest text-text-muted uppercase">
            Panel de control de emisiones
          </p>
        </div>
        <form action={logoutAction} className="hidden sm:block">
          <button type="submit" className="btn-ghost px-4 py-2 text-xs">
            Cerrar sesión
          </button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {liveCount > 0 && (
          <Link href="/dashboard/live" className="group relative overflow-hidden rounded-xl border border-accent-red/35 bg-gradient-to-r from-[#2a0f13] to-[#1a1d28] p-6 shadow-lg shadow-accent-red/20">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-accent-red/20 blur-2xl transition-all group-hover:bg-accent-red/35" />
            <div className="relative">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent-red/30 bg-accent-red/15 px-3 py-1 text-[11px] font-bold tracking-widest text-accent-red uppercase animate-pulse">
                <span className="h-2 w-2 rounded-full bg-accent-red live-dot" />
                Live
              </div>
              <h2 className="font-display text-lg font-semibold tracking-wide text-white">Programaciones LIVE ({liveCount})</h2>
              <p className="mt-1 text-xs leading-relaxed text-red-100/80">
                Emisiones en curso. Ver, compartir o finalizar en tiempo real.
              </p>
            </div>
          </Link>
        )}

        {/* Programa agenda */}
        <Link href="/dashboard/agenda" className="glass-card group relative overflow-hidden rounded-xl p-6">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl transition-all group-hover:bg-emerald-500/20" />
          <div className="relative">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <h2 className="font-display text-lg font-semibold tracking-wide text-white">Programa agenda</h2>
            <p className="mt-1 text-xs leading-relaxed text-text-muted">
              Retransmite partidos oficiales de la agenda de competiciones.
            </p>
          </div>
        </Link>

        {/* Programa manual */}
        <Link href="/dashboard/new" className="glass-card group relative overflow-hidden rounded-xl p-6">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-accent-red/10 blur-2xl transition-all group-hover:bg-accent-red/20" />
          <div className="relative">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-red/10 text-accent-red ring-1 ring-inset ring-accent-red/20">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V7.5A2.25 2.25 0 014.5 5.25H12m0 0l3.75 3.75M12 5.25l-3.75 3.75" />
              </svg>
            </div>
            <h2 className="font-display text-lg font-semibold tracking-wide text-white">Programa manual</h2>
            <p className="mt-1 text-xs leading-relaxed text-text-muted">
              Crea una emisión personalizada introduciendo los datos manualmente.
            </p>
          </div>
        </Link>

        {/* Programaciones pendientes */}
        <Link href="/dashboard/broadcasts" className="glass-card group relative overflow-hidden rounded-xl p-6">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-accent-cyan/10 blur-2xl transition-all group-hover:bg-accent-cyan/20" />
          <div className="relative">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-cyan/10 text-accent-cyan ring-1 ring-inset ring-accent-cyan/20">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-8.625 0V13.5m0 4.875v-2.625M20.625 19.5V13.5m0 4.875v-2.625M3.375 19.5l3.375-8.25m13.5 8.25l-3.375-8.25M12 11.25v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 11.25h1.5m-1.5 0h-1.5m1.5-1.125v-1.5m0 1.5c0 .621.504 1.125 1.125 1.125M12 4.5v1.5m0-1.5c0-.621-.504-1.125-1.125-1.125M12 4.5h1.5m-1.5 0h-1.5" />
              </svg>
            </div>
            <h2 className="font-display text-lg font-semibold tracking-wide text-white">Programaciones pendientes</h2>
            <p className="mt-1 text-xs leading-relaxed text-text-muted">
              Gestiona tus próximas emisiones programadas y obtén los enlaces de directo.
            </p>
          </div>
        </Link>

        {/* Programaciones finalizadas */}
        <Link href="/dashboard/finished-events" className="glass-card group relative overflow-hidden rounded-xl p-6">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl transition-all group-hover:bg-violet-500/20" />
          <div className="relative">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 ring-1 ring-inset ring-violet-500/20">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="font-display text-lg font-semibold tracking-wide text-white">Programaciones finalizadas</h2>
            <p className="mt-1 text-xs leading-relaxed text-text-muted">
              Historial de retransmisiones grabadas de tus equipos y temporadas vinculadas.
            </p>
          </div>
        </Link>

        {/* Perfil */}
        <Link href="/dashboard/account" className="glass-card group relative overflow-hidden rounded-xl p-6">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl transition-all group-hover:bg-blue-500/20" />
          <div className="relative">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-500/20">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h2 className="font-display text-lg font-semibold tracking-wide text-white">Perfil</h2>
            <p className="mt-1 text-xs leading-relaxed text-text-muted">
              Modifica tus datos de contacto, contraseña y configuraciones de cuenta.
            </p>
          </div>
        </Link>

        {/* Admin (condicional) */}
        {isAdmin && (
          <Link href="/admin" className="glass-card group relative overflow-hidden rounded-xl p-6 border-accent-red/20 hover:border-accent-red/40">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-rose-500/10 blur-2xl transition-all group-hover:bg-rose-500/20" />
            <div className="relative">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/20">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h2 className="font-display text-lg font-semibold tracking-wide text-white">Panel Admin</h2>
              <p className="mt-1 text-xs leading-relaxed text-text-muted">
                Accede a las herramientas de administración, reportes, usuarios y equipos.
              </p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
