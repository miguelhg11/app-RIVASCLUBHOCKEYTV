/* eslint-disable @next/next/no-img-element, react-hooks/set-state-in-effect */
"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { updateBroadcastAction, type UpdateBroadcastState } from "@/src/actions/broadcast.actions";
import { useRouter } from "next/navigation";
import { THUMBNAIL_CATEGORY_SHORT_LABELS } from "@/src/lib/thumbnails/rivas-thumbnail-style";
import { CustomDatePicker } from "@/src/components/ui/custom-date-picker";

type Option = { id: string; name: string };
type BlockedOption = { id: string; name: string; reason: string };

const initialState: UpdateBroadcastState = {};

export function EditBroadcastForm({
  broadcast,
  teams,
  streamKeys,
  blockedStreamKeys,
  playlists,
  teamResourcesMap = {},
  categorizedBadges,
  thumbnailBackgrounds = [],
  isAdmin = false,
}: {
  broadcast: any;
  teams: Option[];
  streamKeys: Option[];
  blockedStreamKeys: BlockedOption[];
  playlists: Option[];
  teamResourcesMap?: Record<string, { streamKeys: string[]; playlists: string[] }>;
  categorizedBadges?: {
    fmp: { canonical_name: string; logo_url: string; normalized_aliases: string[] }[];
    rfep: { canonical_name: string; logo_url: string; normalized_aliases: string[] }[];
    selecciones: { canonical_name: string; logo_url: string; normalized_aliases: string[] }[];
  };
  thumbnailBackgrounds?: Array<{ id: string; name: string; url_path: string; is_default: boolean; base64_data: string | null }>;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateBroadcastAction, initialState);

  // Parse existing scheduled start (from ISO to datetime-local input format "YYYY-MM-DDTHH:mm")
  const defaultScheduledStart = useMemo(() => {
    if (!broadcast.scheduled_start) return "";
    const date = new Date(broadcast.scheduled_start);
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  }, [broadcast.scheduled_start]);

  // Main Form States
  const [selectedTeamId, setSelectedTeamId] = useState(broadcast.team_id || "");
  const [selectedStreamKeyId, setSelectedStreamKeyId] = useState(broadcast.stream_key_id || "");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(broadcast.playlist_id || "");
  const [competitionName, setCompetitionName] = useState(broadcast.competition_name || "");
  const [homeTeamName, setHomeTeamName] = useState(broadcast.home_team_name || "");
  const [awayTeamName, setAwayTeamName] = useState(broadcast.away_team_name || "");
  const [venue, setVenue] = useState(broadcast.venue || "");
  const [description, setDescription] = useState(broadcast.description || "");
  const [scheduledStart, setScheduledStart] = useState(defaultScheduledStart);
  const [datePart, setDatePart] = useState(() => {
    if (!defaultScheduledStart) return "";
    return defaultScheduledStart.split("T")[0] || "";
  });
  const [timePart, setTimePart] = useState(() => {
    if (!defaultScheduledStart) return "";
    return (defaultScheduledStart.split("T")[1] || "").slice(0, 5);
  });

  const handleDateTimeChange = (date: string, time: string) => {
    setDatePart(date);
    setTimePart(time);
    if (date && time && time.length === 5) {
      setScheduledStart(`${date}T${time}`);
    } else {
      setScheduledStart("");
    }
  };

  const sanitizeTimeInput = (value: string) => {
    return value.replace(/[^0-9:]/g, "").slice(0, 5);
  };

  const normalizeTimeOnBlur = (value: string) => {
    if (!value) return "";
    
    let val = value;
    if (val.length === 4 && !val.includes(":")) {
      val = val.slice(0, 2) + ":" + val.slice(2);
    }
    
    let parts = val.split(":");
    let h = parts[0] || "";
    let m = parts[1] || "";
    
    if (h) {
      const hNum = Math.min(23, Math.max(0, Number(h)));
      h = String(hNum).padStart(2, "0");
    } else {
      h = "00";
    }
    
    if (m) {
      const mNum = Math.min(59, Math.max(0, Number(m)));
      m = String(mNum).padStart(2, "0");
    } else {
      m = "00";
    }
    
    return `${h}:${m}`;
  };

  // Crests
  const [localLogo, setLocalLogo] = useState(broadcast.home_crest_url || "/badges/fmp/rivas.png");
  const [visitorLogo, setVisitorLogo] = useState(broadcast.away_crest_url || "/badges/fmp/rivas.png");

  // Thumbnail overrides & payload
  const [shortTitle, setShortTitle] = useState(broadcast.thumbnail_payload?.shortTitle || "");
  const [competitionLine, setCompetitionLine] = useState(broadcast.thumbnail_payload?.competitionLine || "");
  const [bottomLine, setBottomLine] = useState(broadcast.thumbnail_payload?.bottomLine || "");

  // Track edits
  const [userEditedShortTitle, setUserEditedShortTitle] = useState(Boolean(broadcast.thumbnail_overrides?.shortTitle));
  const [userEditedCompetitionLine, setUserEditedCompetitionLine] = useState(Boolean(broadcast.thumbnail_overrides?.competitionLine));
  const [userEditedBottomLine, setUserEditedBottomLine] = useState(Boolean(broadcast.thumbnail_overrides?.bottomLine));

  const [previewTick, setPreviewTick] = useState(0);

  // Background gallery
  const defaultBg = useMemo(() => {
    const plantillaFallback = thumbnailBackgrounds.find((bg) => {
      const name = bg.name.toLowerCase();
      const path = (bg.url_path || "").toLowerCase();
      return name.includes("plantilla") || path.includes("/thumbnails/plantilla") || path.includes("plantilla.png");
    });
    if (plantillaFallback) return plantillaFallback;

    const markedDefault = thumbnailBackgrounds.find((bg) => bg.is_default);
    if (markedDefault) return markedDefault;

    return thumbnailBackgrounds[0] || null;
  }, [thumbnailBackgrounds]);

  const [selectedBackgroundId, setSelectedBackgroundId] = useState(broadcast.thumbnail_background_id || "");
  const [backgroundPickerOpen, setBackgroundPickerOpen] = useState(false);
  const [backgroundSearch, setBackgroundSearch] = useState("");

  // Crest picker modal state
  const [badgePickerSide, setBadgePickerSide] = useState<"local" | "visitor" | null>(null);
  const [badgePickerTab, setBadgePickerTab] = useState<"fmp" | "rfep" | "selecciones">("fmp");
  const [badgePickerSearch, setBadgePickerSearch] = useState("");

  // Auto-generate helper calculations
  const displayShortTitle = useMemo(() => {
    if (userEditedShortTitle) return shortTitle;
    let category = "OTROS";
    const compUpper = competitionName.toUpperCase();
    for (const key of Object.keys(THUMBNAIL_CATEGORY_SHORT_LABELS)) {
      if (compUpper.includes(key.toUpperCase())) {
        category = THUMBNAIL_CATEGORY_SHORT_LABELS[key];
        break;
      }
    }
    return category;
  }, [competitionName, shortTitle, userEditedShortTitle]);

  const displayCompetitionLine = useMemo(() => {
    if (userEditedCompetitionLine) return competitionLine;
    let label = competitionName.toUpperCase();
    if (!label.startsWith("COMPETICH") && label.includes("|")) {
      const parts = label.split("|");
      label = parts[parts.length - 1].trim();
    }
    return label;
  }, [competitionName, competitionLine, userEditedCompetitionLine]);

  const displayBottomLine = useMemo(() => {
    if (userEditedBottomLine) return bottomLine;
    if (!scheduledStart) return "";
    const date = new Date(scheduledStart);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} · ${hours}:${minutes} H.`;
  }, [scheduledStart, bottomLine, userEditedBottomLine]);

  const [previewUrl, setPreviewUrl] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    let active = true;
    async function updatePreview() {
      setLoadingPreview(true);
      try {
        const res = await fetch("/api/thumbnail/render", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shortTitle: displayShortTitle,
            competitionLine: displayCompetitionLine,
            localName: homeTeamName || "Local",
            visitorName: awayTeamName || "Visitante",
            bottomLine: displayBottomLine,
            localLogo: localLogo,
            visitorLogo: visitorLogo,
            backgroundId: selectedBackgroundId,
          }),
        });
        if (!res.ok) throw new Error("Render failed");
        const blob = await res.blob();
        if (active) {
          setPreviewUrl((prev) => {
            if (prev && prev.startsWith("blob:")) {
              URL.revokeObjectURL(prev);
            }
            return URL.createObjectURL(blob);
          });
        }
      } catch (err) {
        console.error("Failed to generate preview:", err);
      } finally {
        if (active) setLoadingPreview(false);
      }
    }

    const timer = setTimeout(updatePreview, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    displayShortTitle,
    displayCompetitionLine,
    homeTeamName,
    awayTeamName,
    displayBottomLine,
    localLogo,
    visitorLogo,
    selectedBackgroundId,
    previewTick,
  ]);

  useEffect(() => {
    return () => {
      setPreviewUrl((prev) => {
        if (prev && prev.startsWith("blob:")) {
          URL.revokeObjectURL(prev);
        }
        return "";
      });
    };
  }, []);

  // Resource lists filtering based on team association
  const filteredKeys = useMemo(() => {
    if (!selectedTeamId) return [];
    const resourceMap = teamResourcesMap[selectedTeamId];
    if (!resourceMap) return streamKeys;
    return streamKeys.filter((sk) => resourceMap.streamKeys.includes(sk.id));
  }, [selectedTeamId, streamKeys, teamResourcesMap]);

  const filteredBlockedKeys = useMemo(() => {
    if (!selectedTeamId) return [];
    const resourceMap = teamResourcesMap[selectedTeamId];
    if (!resourceMap) return [];
    return blockedStreamKeys.filter((sk) => resourceMap.streamKeys.includes(sk.id));
  }, [selectedTeamId, blockedStreamKeys, teamResourcesMap]);

  const filteredPlaylists = useMemo(() => {
    if (!selectedTeamId) return [];
    const resourceMap = teamResourcesMap[selectedTeamId];
    if (!resourceMap) return playlists;
    return playlists.filter((pl) => resourceMap.playlists.includes(pl.id));
  }, [selectedTeamId, playlists, teamResourcesMap]);

  useEffect(() => {
    if (state.ok) {
      router.push(isAdmin ? "/admin/broadcasts" : "/dashboard/broadcasts");
      router.refresh();
    }
  }, [state.ok, router, isAdmin]);

  // Background filter list
  const filteredBackgrounds = useMemo(() => {
    if (!backgroundSearch) return thumbnailBackgrounds;
    const search = backgroundSearch.toLowerCase();
    return thumbnailBackgrounds.filter((bg) => bg.name.toLowerCase().includes(search));
  }, [thumbnailBackgrounds, backgroundSearch]);

  const getBackgroundPreviewSrc = (bg: { id: string; url_path: string; base64_data: string | null }) => {
    if (bg.base64_data) return bg.base64_data;

    const raw = (bg.url_path || "").trim();
    if (!raw) return `/api/thumbnail/background?id=${bg.id}`;
    if (raw.startsWith("data:image/")) return raw;
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    if (raw.startsWith("/")) return raw;
    return `/${raw}`;
  };

  // Badge list logic
  const activeBadgesList = useMemo(() => {
    if (!categorizedBadges) return [];
    const rawList = categorizedBadges[badgePickerTab] || [];
    if (!badgePickerSearch) return rawList;
    const search = badgePickerSearch.toUpperCase();
    return rawList.filter((badge) => {
      const matchesName = badge.canonical_name.toUpperCase().includes(search);
      const matchesAlias = badge.normalized_aliases?.some((alias) => alias.toUpperCase().includes(search));
      return matchesName || matchesAlias;
    });
  }, [categorizedBadges, badgePickerTab, badgePickerSearch]);

  return (
    <form action={formAction} className="glass-panel rounded-xl p-6 space-y-6 max-w-4xl">
      <input type="hidden" name="id" value={broadcast.id} />
      <input type="hidden" name="homeCrestUrl" value={localLogo} />
      <input type="hidden" name="awayCrestUrl" value={visitorLogo} />
      <input type="hidden" name="thumbnailBackgroundId" value={selectedBackgroundId} />

      <input
        type="hidden"
        name="thumbnailPayload"
        value={JSON.stringify({
          shortTitle: displayShortTitle,
          competitionLine: displayCompetitionLine,
          bottomLine: displayBottomLine,
        })}
      />

      <input
        type="hidden"
        name="thumbnailOverrides"
        value={JSON.stringify({
          shortTitle: userEditedShortTitle ? shortTitle : undefined,
          competitionLine: userEditedCompetitionLine ? competitionLine : undefined,
          bottomLine: userEditedBottomLine ? bottomLine : undefined,
        })}
      />

      <div className="border-b border-white/10 pb-4">
        <h2 className="text-xl font-bold tracking-wide text-white uppercase font-rajdhani">
          EDITAR PROGRAMACIÓN: {broadcast.title}
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          Edita todos los detalles y vuelve a sincronizarlos con la API de YouTube.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Team Select */}
        <label className="text-sm">
          <span className="mb-1 block text-text-muted">Equipo Responsable</span>
          <select
            name="teamId"
            required
            value={selectedTeamId}
            onChange={(e) => {
              setSelectedTeamId(e.target.value);
              setSelectedStreamKeyId("");
              setSelectedPlaylistId("");
            }}
            className="w-full rounded-lg border border-white/10 bg-[#12121a] px-3 py-2 text-white focus:border-accent-cyan focus:outline-none"
          >
            <option value="">-- Selecciona equipo --</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        {/* Scheduled Start */}
        <div className="text-sm space-y-1">
          <span className="mb-1 block text-text-muted">Fecha y Hora Programada</span>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-grow">
              <CustomDatePicker
                value={datePart}
                onChange={(date) => handleDateTimeChange(date, timePart)}
                placeholder="Fecha del partido"
              />
            </div>
            
            <div className="flex items-center gap-2 bg-[#12121a] border border-white/10 rounded-lg px-3 py-2 w-full sm:w-auto shrink-0 justify-center">
              <svg className="h-4 w-4 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <input
                type="text"
                maxLength={5}
                placeholder="HH:MM"
                value={timePart}
                onChange={(e) => {
                  const val = sanitizeTimeInput(e.target.value);
                  handleDateTimeChange(datePart, val);
                }}
                onBlur={() => {
                  const normalized = normalizeTimeOnBlur(timePart);
                  if (normalized !== timePart) {
                    handleDateTimeChange(datePart, normalized);
                  }
                }}
                className="w-16 bg-transparent text-center text-sm font-semibold text-white focus:outline-none placeholder-white/20 border-b border-white/10 focus:border-accent-cyan"
              />
            </div>
          </div>
          <input type="hidden" name="scheduledStart" value={scheduledStart} required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Stream Key Select */}
        <label className="text-sm">
          <span className="mb-1 block text-text-muted">Clave de Emisión (Stream Key)</span>
          <select
            name="streamKeyId"
            required
            value={selectedStreamKeyId}
            onChange={(e) => setSelectedStreamKeyId(e.target.value)}
            disabled={!selectedTeamId}
            className="w-full rounded-lg border border-white/10 bg-[#12121a] px-3 py-2 text-white focus:border-accent-cyan focus:outline-none disabled:opacity-50"
          >
            <option value="">
              {!selectedTeamId ? "Selecciona un equipo primero" : "Selecciona stream key"}
            </option>
            {filteredKeys.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
            {filteredBlockedKeys.map((k) => (
              <option key={k.id} value={k.id} disabled>
                {k.name} (Ocupada: {k.reason})
              </option>
            ))}
          </select>
        </label>

        {/* Playlist Select */}
        <label className="text-sm">
          <span className="mb-1 block text-text-muted">Playlist Vinculada</span>
          <select
            name="playlistId"
            required
            value={selectedPlaylistId}
            onChange={(e) => setSelectedPlaylistId(e.target.value)}
            disabled={!selectedTeamId}
            className="w-full rounded-lg border border-white/10 bg-[#12121a] px-3 py-2 text-white focus:border-accent-cyan focus:outline-none disabled:opacity-50"
          >
            <option value="">
              {!selectedTeamId ? "Selecciona un equipo primero" : "Selecciona playlist"}
            </option>
            {filteredPlaylists.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Competition Name */}
        <label className="text-sm">
          <span className="mb-1 block text-text-muted">Competición</span>
          <input
            type="text"
            name="competitionName"
            required
            value={competitionName}
            onChange={(e) => setCompetitionName(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#12121a] px-3 py-2 text-white focus:border-accent-cyan focus:outline-none"
          />
        </label>

        {/* Home Team */}
        <label className="text-sm">
          <span className="mb-1 block text-text-muted">Equipo Local</span>
          <div className="flex gap-2">
            <input
              type="text"
              name="homeTeamName"
              required
              value={homeTeamName}
              onChange={(e) => setHomeTeamName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#12121a] px-3 py-2 text-white focus:border-accent-cyan focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setBadgePickerSide("local")}
              className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-lg hover:bg-white/10"
              title="Seleccionar Escudo"
            >
              🛡️
            </button>
          </div>
        </label>

        {/* Away Team */}
        <label className="text-sm">
          <span className="mb-1 block text-text-muted">Equipo Visitante</span>
          <div className="flex gap-2">
            <input
              type="text"
              name="awayTeamName"
              required
              value={awayTeamName}
              onChange={(e) => setAwayTeamName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#12121a] px-3 py-2 text-white focus:border-accent-cyan focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setBadgePickerSide("visitor")}
              className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-lg hover:bg-white/10"
              title="Seleccionar Escudo"
            >
              🛡️
            </button>
          </div>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Venue */}
        <label className="text-sm">
          <span className="mb-1 block text-text-muted">Lugar / Pista</span>
          <input
            type="text"
            name="venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#12121a] px-3 py-2 text-white focus:border-accent-cyan focus:outline-none"
          />
        </label>

        {/* Description */}
        <label className="text-sm">
          <span className="mb-1 block text-text-muted">Descripción del Directo</span>
          <textarea
            name="description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#12121a] px-3 py-2 text-white focus:border-accent-cyan focus:outline-none"
          />
        </label>
      </div>

      {/* --- SECCIÓN MINIATURA --- */}
      <div className="mt-6 border-t border-white/10 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider font-rajdhani text-neon-cyan">
              Miniatura del Partido (YouTube)
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Personaliza el fondo, escudos y textos sobre la miniatura.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPreviewTick((t) => t + 1)}
            className="rounded bg-white/5 border border-white/15 px-2.5 py-1 text-xs text-accent-cyan hover:bg-white/10 font-mono"
          >
            Actualizar Preview
          </button>
        </div>

        {/* Background picker button */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-black/20 p-4 border border-white/5 rounded-xl text-sm">
          <div>
            <span className="block font-bold text-white uppercase tracking-wider text-xs">Fondo de miniatura</span>
            <span className="text-xs text-text-muted mt-0.5">
              {thumbnailBackgrounds.find((bg) => bg.id === selectedBackgroundId)?.name || "plantilla.png (por defecto)"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setBackgroundPickerOpen(true);
              setBackgroundSearch("");
            }}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-bold text-accent-cyan uppercase tracking-wider transition-all"
          >
            <span>🖼️</span>
            <span>CAMBIAR FONDO</span>
          </button>
        </div>

        {/* Preview image */}
        <div className="flex justify-center bg-black/40 border border-white/5 rounded-xl p-4 relative">
          <img
            src={previewUrl || "/thumbnails/plantilla.png"}
            alt="Previsualización miniatura"
            className={`w-full max-w-lg aspect-video rounded-lg border border-white/10 shadow-2xl object-cover bg-slate-900 transition-all duration-300 ${
              loadingPreview ? "opacity-60" : "opacity-100"
            }`}
          />
          {loadingPreview && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-accent-cyan border border-accent-cyan/20 animate-pulse flex items-center gap-2">
                <svg className="animate-spin h-3.5 w-3.5 text-accent-cyan" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generando...
              </div>
            </div>
          )}
        </div>

        {/* Custom overrides */}
        <div className="grid gap-4 sm:grid-cols-2 bg-black/20 p-4 border border-white/5 rounded-xl text-sm">
          <label className="text-xs font-semibold text-text-muted">
            Categoría (Título Corto)
            <input
              type="text"
              value={displayShortTitle}
              onChange={(e) => {
                setShortTitle(e.target.value);
                setUserEditedShortTitle(true);
              }}
              className="mt-1 w-full rounded-lg border border-white/20 bg-[#12121a] px-3 py-2 text-white text-xs focus:border-accent-cyan focus:outline-none"
            />
          </label>
          <label className="text-xs font-semibold text-text-muted">
            Línea Competición / Jornada
            <input
              type="text"
              value={displayCompetitionLine}
              onChange={(e) => {
                setCompetitionLine(e.target.value);
                setUserEditedCompetitionLine(true);
              }}
              className="mt-1 w-full rounded-lg border border-white/20 bg-[#12121a] px-3 py-2 text-white text-xs focus:border-accent-cyan focus:outline-none"
            />
          </label>
          <label className="text-xs font-semibold text-text-muted sm:col-span-2">
            Línea Inferior (Fecha · Hora · Pista)
            <input
              type="text"
              value={displayBottomLine}
              onChange={(e) => {
                setBottomLine(e.target.value);
                setUserEditedBottomLine(true);
              }}
              className="mt-1 w-full rounded-lg border border-white/20 bg-[#12121a] px-3 py-2 text-white text-xs focus:border-accent-cyan focus:outline-none"
            />
          </label>
        </div>
      </div>

      {state.error && (
        <p className="text-sm font-semibold text-rose-400 bg-accent-red/10 border border-rose-900/30 rounded-lg p-3">
          ⚠ {state.error}
        </p>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent-cyan-soft text-accent-cyan border border-accent-cyan/20 px-4 py-3.5 font-bold transition-all hover:bg-accent-cyan/20 active:scale-[0.99] disabled:opacity-50"
        >
          {pending ? "Guardando cambios..." : "Guardar y Actualizar"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg bg-white/5 border border-white/10 px-6 py-3.5 font-semibold text-text-muted hover:text-white"
        >
          Cancelar
        </button>
      </div>

      {/* Selector de Escudo Modal */}
      {badgePickerSide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setBadgePickerSide(null)}
        >
          <div
            className="glass-panel w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border border-white/10 bg-[#0e0e16]/95 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 p-4 bg-black/20">
              <div>
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                  Seleccionar Escudo: {badgePickerSide === "local" ? "Local" : "Visitante"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBadgePickerSide(null)}
                className="text-text-muted hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Tabs & Search */}
            <div className="p-4 border-b border-white/10 flex flex-wrap gap-4 items-center justify-between bg-black/10">
              <div className="flex gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
                {(["fmp", "rfep", "selecciones"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setBadgePickerTab(tab);
                      setBadgePickerSearch("");
                    }}
                    className={`rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                      badgePickerTab === tab ? "bg-accent-cyan/20 text-accent-cyan" : "text-text-muted hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Buscar escudo..."
                value={badgePickerSearch}
                onChange={(e) => setBadgePickerSearch(e.target.value)}
                className="w-full sm:w-64 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white placeholder-text-muted/50 focus:border-accent-cyan focus:outline-none"
              />
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {activeBadgesList.length === 0 ? (
                <div className="col-span-full py-12 text-center text-text-muted text-xs">
                  No se encontraron escudos en esta categoría.
                </div>
              ) : (
                activeBadgesList.map((badge, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (badgePickerSide === "local") {
                        setLocalLogo(badge.logo_url);
                      } else {
                        setVisitorLogo(badge.logo_url);
                      }
                      setBadgePickerSide(null);
                      setPreviewTick((t) => t + 1);
                    }}
                    className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center transition-all hover:bg-white/5 hover:border-accent-cyan/30 group"
                  >
                    <img
                      src={badge.logo_url}
                      alt={badge.canonical_name}
                      className="h-12 w-12 object-contain group-hover:scale-105 transition-transform"
                    />
                    <span className="mt-2 text-[10px] text-text-muted line-clamp-2 leading-tight group-hover:text-white">
                      {badge.canonical_name}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selector de Fondo Modal */}
      {backgroundPickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setBackgroundPickerOpen(false)}
        >
          <div
            className="glass-panel w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border border-white/10 bg-[#0e0e16]/95 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 p-4 bg-black/20">
              <div>
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                  Seleccionar Fondo de Miniatura
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBackgroundPickerOpen(false)}
                className="text-text-muted hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-white/10 flex items-center justify-end bg-black/10">
              <input
                type="text"
                placeholder="Buscar fondo por nombre..."
                value={backgroundSearch}
                onChange={(e) => setBackgroundSearch(e.target.value)}
                className="w-full sm:w-64 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white placeholder-text-muted/50 focus:border-accent-cyan focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredBackgrounds.map((bg) => {
                const isSelected = selectedBackgroundId
                  ? bg.id === selectedBackgroundId
                  : defaultBg?.id === bg.id;
                return (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => {
                      setSelectedBackgroundId(bg.id);
                      setBackgroundPickerOpen(false);
                      setPreviewTick((t) => t + 1);
                    }}
                    className={`flex flex-col rounded-xl overflow-hidden border transition-all ${
                      isSelected
                        ? "border-accent-cyan bg-accent-cyan/10 shadow-lg shadow-accent-cyan/10 scale-[1.02]"
                        : "border-white/5 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div className="aspect-video w-full relative bg-slate-900">
                      <img
                        src={getBackgroundPreviewSrc(bg)}
                        alt={bg.name}
                        className="w-full h-full object-cover"
                        onError={(event) => {
                          const next = `/api/thumbnail/background?id=${bg.id}`;
                          if (event.currentTarget.src.endsWith(next)) return;
                          event.currentTarget.src = next;
                        }}
                      />
                    </div>
                    <div className="p-2 text-left">
                      <span className="block text-[11px] font-bold text-white truncate">{bg.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
