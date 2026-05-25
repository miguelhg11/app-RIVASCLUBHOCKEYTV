"use client";

import Link from "next/link";
import { useState } from "react";

// ─── Section definitions with logical setup order ───────────────────────────
const sections = [
  {
    step: 1,
    label: "Temporadas",
    href: "/admin/seasons",
    icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
    color: "text-accent-cyan",
    bg: "bg-accent-cyan/10",
    ring: "ring-accent-cyan/20",
    subtitle: "Paso 1 — Punto de partida",
    description: `Una Temporada es el contenedor principal del que depende todo lo demás.

Debes crear una temporada antes que nada (ejemplo: "Temporada 2025-2026").

Cada equipo, stream key y playlist queda vinculado a una temporada. El sistema usa la temporada "seleccionada actualmente" para filtrar todos los recursos.

⚠️ Si cambias de temporada activa, los equipos y recursos de la temporada anterior quedan inactivos para los usuarios. Puedes tener varias temporadas en la BD pero solo una activa al mismo tiempo.`,
  },
  {
    step: 2,
    label: "Categorías",
    href: "/admin/categories",
    icon: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
    color: "text-white",
    bg: "bg-white/5",
    ring: "ring-white/10",
    subtitle: "Paso 2 — Clasificación de equipos",
    description: `Las categorías definen los grupos deportivos: Benjamín, Alevín, Infantil, Cadete, Juvenil, Senior, etc.

Estos se usan para clasificar los equipos dentro de una temporada y para ordenar los partidos en la agenda.

Las categorías son opcionales en sentido estricto pero recomendadas para mantener el orden cuando hay múltiples equipos Rivas (A, B, C...).

Crea las categorías antes de crear los equipos para poder asignarlas.`,
  },
  {
    step: 3,
    label: "Equipos",
    href: "/admin/teams",
    icon: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
    color: "text-accent-red",
    bg: "bg-accent-red/10",
    ring: "ring-accent-red/20",
    subtitle: "Paso 3 — Grupos que van a emitir",
    description: `Crea aquí cada equipo de Rivas que vaya a emitir en directo durante la temporada (ej. "Rivas Hockey A", "Rivas Hockey B"...).

Un Equipo es la unidad central de organización. A cada equipo se le asignan:
  • Una o varias Stream Keys (para transmitir)
  • Una o varias Playlists de YouTube (donde se guardan los VODs)
  • Uno o varios Usuarios que pueden gestionarlo

Los equipos quedan ligados a la temporada activa. Si creas el equipo sin temporada seleccionada correctamente, no aparecerá en la lista de los usuarios.

⚠️ Si el panel de Usuarios dice "Equipos de la temporada (0)", es porque no has creado equipos aún para la temporada activa.`,
  },
  {
    step: 4,
    label: "Stream Keys",
    href: "/admin/stream-keys",
    icon: "M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z",
    color: "text-accent-cyan",
    bg: "bg-accent-cyan/10",
    ring: "ring-accent-cyan/20",
    subtitle: "Paso 4 — Credenciales de emisión YouTube",
    description: `Las Stream Keys son las credenciales técnicas de YouTube que permiten enviar el vídeo desde el codificador (OBS, hardware encoder, etc.) al canal.

Cada Stream Key de YouTube corresponde a una clave de ingestión. En el panel puedes:
  • Añadir claves con su nombre descriptivo
  • Activar/desactivar claves
  • Asignarlas a equipos

Una Stream Key solo puede usarse en un directo a la vez. El sistema detecta automáticamente si una clave está ocupada por una emisión activa o pendiente y lo indica al usuario que intenta programar.

⚠️ Para obtener una Stream Key ve a YouTube Studio → Directo → Gestionar → Clave de stream.`,
  },
  {
    step: 5,
    label: "Playlists",
    href: "/admin/playlists",
    icon: "M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z",
    color: "text-white",
    bg: "bg-white/5",
    ring: "ring-white/10",
    subtitle: "Paso 5 — Listas de reproducción YouTube",
    description: `Las Playlists son listas de reproducción de YouTube donde se van almacenando automáticamente los VODs de los directos completados.

Cada equipo puede tener una playlist asignada, por ejemplo:
  • "Rivas Hockey A — Temporada 2025/26"
  • "Rivas Hockey B — Temporada 2025/26"

Cuando se crea un directo en YouTube desde nuestra app, el VOD se añade automáticamente a la playlist asignada al equipo.

Para obtener el ID de una playlist de YouTube: abre la playlist en YouTube y copia el parámetro "list=..." de la URL.`,
  },
  {
    step: 6,
    label: "Usuarios",
    href: "/admin/users",
    icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
    color: "text-accent-cyan",
    bg: "bg-accent-cyan/10",
    ring: "ring-accent-cyan/20",
    subtitle: "Paso 6 — Acceso y permisos",
    description: `Gestiona quién puede acceder al sistema y qué equipos puede gestionar.

Roles disponibles:
  • Administrador: acceso total a todos los menús, equipos y programaciones.
  • Usuario estándar: solo puede ver y crear directos para los equipos que le hayas asignado.

Para asignar equipos a un usuario:
  1. Haz clic en "Editar Usuario y Equipos" dentro de la tarjeta del usuario
  2. Marca los equipos que puede gestionar
  3. Guarda cambios

El sistema asigna automáticamente al usuario las stream keys y playlists de esos equipos. Solo verá lo que le corresponde.

⚠️ Si un usuario dice que no tiene stream keys disponibles, comprueba que el equipo tiene stream keys asignadas en el panel de Equipos.`,
  },
  {
    step: 7,
    label: "Fondos miniatura",
    href: "/admin/thumbnail-backgrounds",
    icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 6v12a2.25 2.25 0 002.25 2.25zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
    color: "text-accent-red",
    bg: "bg-accent-red/10",
    ring: "ring-accent-red/20",
    subtitle: "Paso 7 — Diseño de miniaturas YouTube",
    description: `Gestiona las imágenes de fondo que se usan para generar las miniaturas automáticas de los directos de YouTube.

Puedes subir plantillas de imagen (1280×720px recomendado) que el sistema usará como base para componer la miniatura con:
  • Escudos de los equipos (local y visitante)
  • Nombre de la competición
  • Fecha, hora y pista
  • Título corto de la categoría

Puedes subir varias plantillas y elegir cuál está activa por defecto. Arrastra y suelta directamente desde tu PC. El sistema reescala automáticamente las imágenes al formato correcto.

Hay una plantilla por defecto incluida con el branding de Rivas TV.`,
  },
  {
    step: 8,
    label: "Federaciones",
    href: "/admin/federations",
    icon: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.991 8.991 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A11.959 11.959 0 013.53 14.25M3.53 14.25A8.991 8.991 0 013 12c0-.778.099-1.533.284-2.253m0 0A11.959 11.959 0 0120.47 5.75",
    color: "text-accent-cyan",
    bg: "bg-accent-cyan/10",
    ring: "ring-accent-cyan/20",
    subtitle: "Configuración — Integración FMP/RFEP",
    description: `Configura la integración con las webs de las federaciones para importar automáticamente los partidos de la agenda.

La app conecta con:
  • FMP (Federación de Hockey de Madrid) — partidos autonómicos
  • RFEP (Real Federación Española de Patinaje) — partidos nacionales

Con esta integración, la sección "Agenda" del formulario de programación muestra automáticamente los próximos partidos de Rivas en los próximos 7 días, con equipos, fechas, horas y pistas ya rellenados.

Aquí puedes gestionar los identificadores de equipo de Rivas en cada federación para que el scraper los reconozca correctamente.`,
  },
  {
    step: 9,
    label: "Programaciones",
    href: "/admin/broadcasts",
    icon: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V7.5A2.25 2.25 0 014.5 5.25H12m0 0l3.75 3.75M12 5.25l-3.75 3.75",
    color: "text-accent-red",
    bg: "bg-accent-red/10",
    ring: "ring-accent-red/20",
    subtitle: "Operaciones — Gestión de directos",
    description: `Visión completa de todos los directos programados, activos y terminados de todos los equipos.

Como administrador puedes:
  • Ver todos los directos de todos los equipos y temporadas
  • Asignar directos externos de YouTube Studio a programaciones de la app
  • Cancelar o eliminar directos erróneos
  • Ver el estado de cada emisión en tiempo real

⚡ El punto rojo pulsante en la tarjeta indica que hay directos externos de YouTube pendientes de asignar a un equipo/temporada.

Los usuarios estándar solo ven sus propios directos en su panel personal.`,
  },
  {
    step: 10,
    label: "Links Eventos",
    href: "/admin/event-links",
    icon: "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244",
    color: "text-accent-cyan",
    bg: "bg-accent-cyan/10",
    ring: "ring-accent-cyan/20",
    subtitle: "Operaciones — URLs externas de eventos",
    description: `Gestiona enlaces externos asociados a eventos: webs de la competición, resultados en vivo, actas arbitrales, etc.

Estos links se pueden asociar a programaciones concretas para facilitar el acceso rápido a información complementaria del partido.

Útil para retransmisiones con cobertura amplia donde se quiere ofrecer contexto adicional al espectador o al equipo técnico.`,
  },
  {
    step: 11,
    label: "Reportes",
    href: "/admin/reports",
    icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
    color: "text-accent-cyan",
    bg: "bg-accent-cyan/10",
    ring: "ring-accent-cyan/20",
    subtitle: "Análisis — Estadísticas y actividad",
    description: `Consulta estadísticas generales de la actividad del sistema:
  • Número de directos por equipo y temporada
  • Histórico de emisiones completadas
  • Uso de stream keys y playlists
  • Actividad de usuarios

Útil para reportar a la directiva del club o para planificar la gestión de recursos de la siguiente temporada.`,
  },
  {
    step: 12,
    label: "Logs",
    href: "/admin/logs",
    icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "text-white",
    bg: "bg-white/5",
    ring: "ring-white/10",
    subtitle: "Sistema — Registro de actividad técnica",
    description: `Registro técnico de todas las acciones realizadas en el sistema: creaciones, modificaciones, errores de la API de YouTube, intentos de acceso fallidos, etc.

Útil para:
  • Depurar problemas cuando un directo no se crea correctamente en YouTube
  • Auditar quién hizo qué y cuándo
  • Detectar errores recurrentes en integraciones

Solo visible para administradores.`,
  },
] as const;

// ─── Info Modal Component ────────────────────────────────────────────────────
function InfoModal({
  section,
  onClose,
}: {
  section: (typeof sections)[number];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e0e16]/98 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-5">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${section.bg} ${section.color} ring-1 ring-inset ${section.ring}`}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
            </svg>
          </div>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${section.color}`}>
              {section.subtitle}
            </p>
            <h2 className="text-lg font-extrabold text-white tracking-wide">{section.label}</h2>
          </div>
          <button
            onClick={onClose}
            className="ml-auto rounded-full bg-white/5 p-1.5 text-text-muted hover:bg-white/10 hover:text-white transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="rounded-xl bg-black/30 border border-white/5 p-4 text-sm text-white/80 leading-relaxed whitespace-pre-line font-mono text-xs">
          {section.description}
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/15 bg-white/5 px-5 py-2 text-xs font-bold text-white hover:bg-white/10 transition-all active:scale-[0.98]"
          >
            ← Volver
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Client Component ───────────────────────────────────────────────────
export function AdminPageClient({ unassignedCount }: { unassignedCount: number }) {
  const [infoSection, setInfoSection] = useState<(typeof sections)[number] | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wide text-white font-rajdhani">
          PANEL DE CONTROL
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Sigue el orden numérico para configurar el sistema por primera vez.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          const isBroadcasts = section.label === "Programaciones";
          const showPulse = isBroadcasts && unassignedCount > 0;

          return (
            <div key={section.href} className="relative group">
              <Link
                href={section.href}
                className={`glass-card flex items-center gap-4 rounded-xl p-4 transition-all pr-12 ${
                  showPulse ? "ring-1 ring-accent-red/30 bg-accent-red/[0.02]" : ""
                }`}
              >
                {/* Step badge */}
                <div className="absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-text-muted">
                  {section.step}
                </div>

                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${section.bg} ${section.color} ring-1 ring-inset ${section.ring}`}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-sm font-semibold tracking-wide text-white">
                      {section.label}
                    </h2>
                    {showPulse && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-red opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-red live-dot"></span>
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-text-muted/70 mt-0.5 uppercase tracking-wider font-semibold">
                    {section.subtitle}
                  </p>
                  {showPulse && (
                    <p className="text-[10px] text-accent-red font-semibold uppercase tracking-wider animate-pulse mt-0.5">
                      {unassignedCount} por asignar
                    </p>
                  )}
                </div>
              </Link>

              {/* Info button */}
              <button
                type="button"
                onClick={() => setInfoSection(section)}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[10px] font-extrabold text-text-muted hover:border-accent-cyan/50 hover:bg-accent-cyan/10 hover:text-accent-cyan transition-all z-10"
                title={`Información sobre ${section.label}`}
              >
                i
              </button>
            </div>
          );
        })}
      </div>

      {/* Info Modal */}
      {infoSection && (
        <InfoModal section={infoSection} onClose={() => setInfoSection(null)} />
      )}
    </div>
  );
}
