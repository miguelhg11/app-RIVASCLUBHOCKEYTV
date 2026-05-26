import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/src/actions/auth.actions";
import { requireSession } from "@/src/lib/auth/guards";
import { ROLES } from "@/src/lib/auth/roles";
import { SeasonSelector } from "@/src/components/navigation/season-selector";
import { getSelectedSeason, listAllSeasons } from "@/src/lib/seasons/utils";
import { countUnassignedExternalBroadcasts } from "@/src/lib/broadcast/queries";
import { countLiveBroadcastsForSession } from "@/src/lib/broadcast/queries";
import { RealtimeSyncPulse } from "@/src/components/sync/realtime-sync-pulse";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  const [seasons, activeSeason, unassignedCount, liveCount] = await Promise.all([
    listAllSeasons(),
    getSelectedSeason(),
    session.role === ROLES.admin ? countUnassignedExternalBroadcasts() : 0,
    countLiveBroadcastsForSession(),
  ]);

  const userLinks = [
    { href: "/dashboard/agenda", label: "Programa agenda" },
    { href: "/dashboard/new", label: "Programa manual" },
    { href: "/dashboard/broadcasts", label: "Programaciones pendientes" },
    { href: "/dashboard/finished-events", label: "Programaciones finalizadas" },
    { href: "/dashboard/account", label: "Perfil" },
  ];

  if (liveCount > 0) {
    userLinks.splice(2, 0, { href: "/dashboard/live", label: `LIVE (${liveCount})` });
  }

  return (
    <div className="relative min-h-screen">
      <div className="atmosphere-bg" />

      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#08090d]/95 px-3 pb-2 pt-2 shadow-black/40 backdrop-blur-sm sm:px-4 sm:pb-3 sm:pt-3">
        <div className="mx-auto w-full max-w-6xl rounded-xl border border-white/5 bg-[#0f1014] px-3 py-2 shadow-inner shadow-white/[0.02] sm:px-4">
          <div className="flex items-center justify-between gap-2">
            <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
              <Image
                src="/imagenes/RIVASHOCKEYTV.png"
                alt="Rivas Hockey TV"
                width={160}
                height={48}
                className="logo-glow h-auto w-28 sm:w-40"
              />
            </Link>

            <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
              <nav className="flex flex-1 flex-wrap items-center gap-1.5 sm:gap-2">
                {userLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="btn-ghost px-2.5 py-1.5 text-xs font-medium tracking-wide text-text-muted hover:text-white sm:text-sm"
                  >
                    <span className="inline-flex items-center gap-1">
                      {link.href === "/dashboard/live" ? <span className="h-1.5 w-1.5 rounded-full bg-accent-red live-dot" /> : null}
                      {link.label}
                    </span>
                  </Link>
                ))}
                {session.role === ROLES.admin ? (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 rounded-md bg-accent-red/10 px-2.5 py-1.5 text-xs font-semibold tracking-wide text-accent-red ring-1 ring-inset ring-accent-red/20 hover:bg-accent-red/20 sm:text-sm"
                  >
                    <span>Admin</span>
                    {unassignedCount > 0 && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-red opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-red live-dot"></span>
                      </span>
                    )}
                  </Link>
                ) : null}
              </nav>
              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                <SeasonSelector seasons={seasons} activeSeasonId={activeSeason.id} />
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="btn-ghost px-2.5 py-1.5 text-xs text-text-muted hover:text-white"
                  >
                    Salir
                  </button>
                </form>
              </div>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="btn-ghost px-2 py-1 text-[11px] text-text-muted hover:text-white"
                >
                  Salir
                </button>
              </form>
              <details className="relative">
                <summary className="list-none cursor-pointer rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white">
                  Menu
                </summary>
                <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-white/10 bg-[#101118] p-3 shadow-2xl shadow-black/60">
                  <div className="mb-3">
                    <SeasonSelector seasons={seasons} activeSeasonId={activeSeason.id} />
                  </div>
                  <nav className="grid gap-1.5">
                    {userLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs font-medium tracking-wide text-text-muted hover:text-white"
                      >
                        <span className="inline-flex items-center gap-1">
                          {link.href === "/dashboard/live" ? <span className="h-1.5 w-1.5 rounded-full bg-accent-red live-dot" /> : null}
                          {link.label}
                        </span>
                      </Link>
                    ))}
                    {session.role === ROLES.admin ? (
                      <Link
                        href="/admin"
                        className="mt-1 flex items-center justify-between rounded-lg border border-accent-red/20 bg-accent-red/10 px-3 py-2 text-xs font-semibold tracking-wide text-accent-red"
                      >
                        <span>Admin</span>
                        {unassignedCount > 0 ? <span className="text-[10px]">{unassignedCount} pendiente(s)</span> : null}
                      </Link>
                    ) : null}
                  </nav>
                </div>
              </details>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-12 pt-6">
        <RealtimeSyncPulse />
        {children}
      </main>
    </div>
  );
}
