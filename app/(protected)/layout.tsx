import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/src/actions/auth.actions";
import { requireSession } from "@/src/lib/auth/guards";
import { ROLES } from "@/src/lib/auth/roles";
import { SeasonSelector } from "@/src/components/navigation/season-selector";
import { getSelectedSeason, listAllSeasons } from "@/src/lib/seasons/utils";
import { countUnassignedExternalBroadcasts } from "@/src/lib/broadcast/queries";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  const [seasons, activeSeason, unassignedCount] = await Promise.all([
    listAllSeasons(),
    getSelectedSeason(),
    session.role === ROLES.admin ? countUnassignedExternalBroadcasts() : 0,
  ]);

  const userLinks = [
    { href: "/dashboard/agenda", label: "Programa agenda" },
    { href: "/dashboard/new", label: "Programa manual" },
    { href: "/dashboard/broadcasts", label: "Programaciones pendientes" },
    { href: "/dashboard/finished-events", label: "Programaciones finalizadas" },
    { href: "/dashboard/account", label: "Perfil" },
  ];

  return (
    <div className="relative min-h-screen">
      <div className="atmosphere-bg" />

      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#08090d]/95 px-4 pb-3 pt-3  shadow-black/40 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 rounded-xl border border-white/5 bg-[#0f1014] px-3 py-2 shadow-inner shadow-white/[0.02] sm:gap-3 sm:px-4">
          <Link href="/dashboard" className="mr-2 flex shrink-0 items-center gap-2">
            <Image
              src="/imagenes/RIVASHOCKEYTV.png"
              alt="Rivas Hockey TV"
              width={100}
              height={30}
              className="logo-glow h-auto w-20 sm:w-24"
            />
          </Link>

          <nav className="flex flex-1 flex-wrap items-center gap-1.5 sm:gap-2">
            {userLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="btn-ghost px-2.5 py-1.5 text-xs font-medium tracking-wide text-text-muted hover:text-white sm:text-sm"
              >
                {link.label}
              </Link>
            ))}
            {session.role === ROLES.admin ? (
              <Link
                href="/admin"
                className="rounded-md bg-accent-red/10 px-2.5 py-1.5 text-xs font-semibold tracking-wide text-accent-red ring-1 ring-inset ring-accent-red/20 hover:bg-accent-red/20 sm:text-sm flex items-center gap-1.5"
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
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-12 pt-6">
        {children}
      </main>
    </div>
  );
}
