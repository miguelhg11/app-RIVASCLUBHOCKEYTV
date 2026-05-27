/* eslint-disable @next/next/no-img-element, react-hooks/set-state-in-effect */
"use client";

import { useActionState, useEffect, useMemo, useRef, useState, DragEvent, ChangeEvent } from "react";
import { createBroadcastAction, type CreateBroadcastState } from "@/src/actions/broadcast.actions";
import type { UnifiedFederationMatch } from "@/src/lib/federations/shared/federation-match";
import { getCategorySortOrder, getUnifiedCategoryLabel } from "@/src/lib/federations/shared/match-sorting";
import { THUMBNAIL_CATEGORY_SHORT_LABELS } from "@/src/lib/thumbnails/rivas-thumbnail-style";
import { CustomDatePicker } from "@/src/components/ui/custom-date-picker";

type Option = { id: string; name: string };
type BlockedOption = { id: string; name: string; reason: string };

const initialState: CreateBroadcastState = {};

// Helper para extraer la letra del equipo
function getRivasLetter(match: UnifiedFederationMatch): "A" | "B" | "C" | "D" | null {
  if ("rivasTeamLetter" in match) return (match as { rivasTeamLetter: "A" | "B" | "C" | "D" | null }).rivasTeamLetter;
  if ("rivasTeamKey" in match) {
    const key = (match as { rivasTeamKey: string }).rivasTeamKey;
    const parts = key.split("-");
    const last = parts[parts.length - 1];
    if (last === "A" || last === "B" || last === "C" || last === "D") return last as "A" | "B" | "C" | "D";
  }
  return null;
}

function getSubGroupKey(match: UnifiedFederationMatch): string {
  const base = match.categoryKey || "otros";
  const letter = getRivasLetter(match);
  return letter ? `${base}-${letter}` : base;
}

function getSubGroupLabel(match: UnifiedFederationMatch, categoryLabel: string): string {
  const letter = getRivasLetter(match);
  if (letter) return `${categoryLabel} ${letter}`;
  return categoryLabel;
}

function LetterBadge({ letter }: { letter: "A" | "B" | "C" | "D" | null }) {
  if (!letter) return null;
  const colors: Record<string, string> = {
    A: "bg-accent-red text-white",
    B: "bg-violet-500 text-white",
    C: "bg-amber-500 text-white",
    D: "bg-rose-500 text-white",
  };
  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-extrabold ${colors[letter] ?? "bg-slate-600 text-white"}`}>
      {letter}
    </span>
  );
}

export function NewBroadcastForm({
  mode,
  agendaOnly,
  initialMatchId,
  teams,
  streamKeys,
  blockedStreamKeys,
  playlists,
  teamResourcesMap = {},
  categorizedBadges,
  thumbnailBackgrounds = [],
}: {
  mode: "agenda" | "manual";
  agendaOnly?: boolean;
  initialMatchId?: string;
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
}) {
  const [state, formAction, pending] = useActionState(createBroadcastAction, initialState);
  const [matches, setMatches] = useState<UnifiedFederationMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [reloadTick, setReloadTick] = useState(0);

  const [competitionName, setCompetitionName] = useState("");
  const [scheduledStart, setScheduledStart] = useState("");
  const [datePart, setDatePart] = useState("");
  const [timePart, setTimePart] = useState("");
  const [homeTeamName, setHomeTeamName] = useState("");
  const [awayTeamName, setAwayTeamName] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");

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

  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [federationSource, setFederationSource] = useState("manual");
  const [federationMatchId, setFederationMatchId] = useState("");
  const [federationTeamKey, setFederationTeamKey] = useState("");
  const preselectedFromQueryRef = useRef(false);

  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedStreamKeyId, setSelectedStreamKeyId] = useState("");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");

  // --- Thumbnail / Miniatura States ---
  const [shortTitle, setShortTitle] = useState("");
  const [competitionLine, setCompetitionLine] = useState("");
  const [bottomLine, setBottomLine] = useState("");
  
  const [localLogo, setLocalLogo] = useState("/badges/fmp/rivas.png");
  const [visitorLogo, setVisitorLogo] = useState("/badges/fmp/rivas.png");

  // Selectors for teams
  const [localSelection, setLocalSelection] = useState("");
  const [visitorSelection, setVisitorSelection] = useState("");

  // Base64 uploads
  const [localLogoBase64, setLocalLogoBase64] = useState("");
  const [visitorLogoBase64, setVisitorLogoBase64] = useState("");

  // Drag states
  const [localDragActive, setLocalDragActive] = useState(false);
  const [visitorDragActive, setVisitorDragActive] = useState(false);

  // Track if thumbnail fields have been manually modified
  const [userEditedShortTitle, setUserEditedShortTitle] = useState(false);
  const [userEditedCompetitionLine, setUserEditedCompetitionLine] = useState(false);
  const [userEditedBottomLine, setUserEditedBottomLine] = useState(false);

  // Tick to force preview image reload
  const [previewTick, setPreviewTick] = useState(0);

  // Badge picker modal state
  const [badgePickerSide, setBadgePickerSide] = useState<"local" | "visitor" | null>(null);
  const [badgePickerTab, setBadgePickerTab] = useState<"fmp" | "rfep" | "selecciones">("fmp");
  const [badgePickerSearch, setBadgePickerSearch] = useState("");

  // --- Backgrounds Gallery States ---
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

  const [selectedBackgroundId, setSelectedBackgroundId] = useState("");
  const [backgroundPickerOpen, setBackgroundPickerOpen] = useState(false);
  const [backgroundSearch, setBackgroundSearch] = useState("");
  const [agendaNowTs] = useState(() => Date.now());


  // ========================================================================
  // STATIC FMP LOOKUP TABLE (offline fallback — always available)
  // Source: codigo.txt + club_badges_seed.json
  // ========================================================================
  const STATIC_FMP_BADGES: { aliases: string[]; logo_url: string }[] = [
    { aliases: ["ALAMEDA OSUNA", "AOA", "ALAMEDA DE OSUNA", "COLEGIO ALAMEDA DE OSUNA"], logo_url: "/badges/fmp/alameda.png" },
    { aliases: ["ALCALA", "ALCA", "CP ALCALA"], logo_url: "/badges/fmp/alcala.png" },
    { aliases: ["ALCOBENDAS", "ALB", "CP ALCOBENDAS"], logo_url: "/badges/fmp/alcobendas.png" },
    { aliases: ["ALCORCON", "ALCR", "CP ALCORCON"], logo_url: "/badges/fmp/alcorcon.png" },
    { aliases: ["ALDOVEA", "ALD"], logo_url: "/badges/fmp/aldovea.png" },
    { aliases: ["ALUCHE", "ALU", "CHP ALUCHE", "GESTAS DE ESPANA CHP ALUCHE"], logo_url: "/badges/fmp/aluche.png" },
    { aliases: ["CASAR", "CAS", "CDE EL CASAR", "EL CASAR"], logo_url: "/badges/fmp/casar.png" },
    { aliases: ["COSLADA", "COS", "CP COSLADA"], logo_url: "/badges/fmp/coslada.png" },
    { aliases: ["GREDOS", "GRD", "GREDOS SAN DIEGO"], logo_url: "/badges/fmp/gredos.png" },
    { aliases: ["LAS ROZAS", "ROZ", "CP LAS ROZAS"], logo_url: "/badges/fmp/lasrozas.png" },
    { aliases: ["MAJADAHONDA", "MJH", "CHP MAJADAHONDA"], logo_url: "/badges/fmp/majadahonda.png" },
    { aliases: ["RETAMAR", "RET"], logo_url: "/badges/fmp/retamar.png" },
    { aliases: ["SANSE", "SANS", "SAN SEBASTIAN DE LOS REYES", "CP SANSE"], logo_url: "/badges/fmp/sanse.png" },
    { aliases: ["STA MARIA DEL PILAR", "STAMARIA DEL PILAR", "SMP", "SANTA MARIA DEL PILAR", "CP PILAR", "PILAR"], logo_url: "/badges/fmp/pilar.png" },
    { aliases: ["STA MARIA LA BLANCA", "STAMARIA LA BLANCA", "SMB", "SANTA MARIA LA BLANCA", "LA BLANCA"], logo_url: "/badges/fmp/lablanca.png" },
    { aliases: ["TRES CANTOS", "TCS", "TRES CANTOS IBERCENTER PC"], logo_url: "/badges/fmp/trescantos.png" },
    { aliases: ["VETONIA", "VET"], logo_url: "/badges/fmp/vetonia.png" },
    { aliases: ["VIRGEN DE EUROPA", "CVE", "CLUB VIRGEN DE EUROPA", "VDE"], logo_url: "/badges/fmp/vdeuropa.png" },
    { aliases: ["VIEJAS GLORIAS", "VIEJAS GLORIAS VDE", "VIEJAS GLORIAS VIRGEN DE EUROPA"], logo_url: "/badges/fmp/viejasgloriasVDE.png" },
  ];

  // ========================================================================
  // CLIENT-SIDE CREST RESOLVER — 4-tier matching
  // ========================================================================
  const findCrestUrl = useMemo(() => {
    /** Normalize a team name for comparison: uppercase, strip accents, dots, extra whitespace */
    const normalize = (str: string): string => {
      if (!str) return "";
      return str
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")  // strip accents
        .replace(/\./g, "")               // strip dots (Sta.Maria → StaMaria)
        .replace(/ª/g, "A")
        .replace(/º/g, "O")
        .replace(/[^A-Z0-9 ]/g, " ")      // non-alphanum → space
        .replace(/\s+/g, " ")
        .trim();
    };

    /** Words that carry no team-identity meaning */
    const NOISE_WORDS = new Set(["CP", "CHP", "CDE", "HC", "CLUB", "DE", "LA", "EL", "LOS", "LAS", "DEL", "Y", "A", "B", "C", "D", "HOCKEY"]);

    /** Extract significant words (≥3 chars and not noise) */
    const significantWords = (text: string): string[] =>
      text.split(" ").filter(w => w.length >= 3 && !NOISE_WORDS.has(w));

    // Build flat list from categorizedBadges (Supabase) — includes normalized_aliases
    const supabaseBadges = categorizedBadges
      ? [...categorizedBadges.fmp, ...categorizedBadges.rfep, ...categorizedBadges.selecciones]
      : [];

    return (teamName: string): string => {
      if (!teamName) return "/badges/fmp/rivas.png";
      const input = normalize(teamName);

      // ── TIER 0: Rivas detection (word-boundary, exclude Rozas / UP Rivas / Velocidad Rivas) ──
      const isRivas = /\bRIVAS\b/.test(input)
        && !/\bROZAS\b/.test(input)
        && !/\bUP RIVAS\b/.test(input)
        && !/\bVELOCIDAD RIVAS\b/.test(input);
      if (isRivas) return "/badges/fmp/rivas.png";

      // ── TIER 1: Exact alias match from Supabase normalized_aliases ──
      for (const badge of supabaseBadges) {
        // Skip Rivas badge for non-Rivas teams
        if (badge.canonical_name.toUpperCase().includes("RIVAS")) continue;

        const canonicalNorm = normalize(badge.canonical_name);
        if (canonicalNorm === input) return badge.logo_url;

        if (badge.normalized_aliases && badge.normalized_aliases.length > 0) {
          for (const alias of badge.normalized_aliases) {
            if (alias === input) return badge.logo_url;
          }
        }
      }

      // ── TIER 2: Exact alias match from STATIC FMP table (offline fallback) ──
      for (const entry of STATIC_FMP_BADGES) {
        for (const alias of entry.aliases) {
          if (alias === input) return entry.logo_url;
        }
      }

      // ── TIER 3: Significant-word scoring ──
      // Find the badge whose aliases share the most significant words with the input
      const inputWords = significantWords(input);
      if (inputWords.length > 0) {
        let bestMatch: string | null = null;
        let bestScore = 0;

        // Score Supabase badges
        for (const badge of supabaseBadges) {
          if (badge.canonical_name.toUpperCase().includes("RIVAS")) continue;
          const allTexts = [normalize(badge.canonical_name), ...(badge.normalized_aliases || [])];
          for (const text of allTexts) {
            const badgeWords = significantWords(text);
            let score = 0;
            for (const iw of inputWords) {
              if (badgeWords.some(bw => bw === iw)) score += 2; // exact word match
              else if (badgeWords.some(bw => bw.includes(iw) || iw.includes(bw))) score += 1; // partial
            }
            if (score > bestScore) {
              bestScore = score;
              bestMatch = badge.logo_url;
            }
          }
        }

        // Score static FMP badges
        for (const entry of STATIC_FMP_BADGES) {
          for (const alias of entry.aliases) {
            const badgeWords = significantWords(alias);
            let score = 0;
            for (const iw of inputWords) {
              if (badgeWords.some(bw => bw === iw)) score += 2;
              else if (badgeWords.some(bw => bw.includes(iw) || iw.includes(bw))) score += 1;
            }
            if (score > bestScore) {
              bestScore = score;
              bestMatch = entry.logo_url;
            }
          }
        }

        // Only accept if at least one full significant word matched
        if (bestMatch && bestScore >= 2) return bestMatch;
      }

      // ── TIER 4: No match — return Rivas as universal fallback ──
      // (In practice this should rarely happen for known FMP/RFEP teams)
      console.warn(`[findCrestUrl] No badge found for team: "${teamName}" (normalized: "${input}")`);
      return "/badges/fmp/rivas.png";
    };
  }, [categorizedBadges]);

  // Pre-sort badge lists alphabetically
  const sortedBadges = useMemo(() => {
    if (!categorizedBadges) return { fmp: [], rfep: [], selecciones: [] };
    return {
      fmp: [...categorizedBadges.fmp].sort((a, b) => a.canonical_name.localeCompare(b.canonical_name)),
      rfep: [...categorizedBadges.rfep].sort((a, b) => a.canonical_name.localeCompare(b.canonical_name)),
      selecciones: [...categorizedBadges.selecciones].sort((a, b) => a.canonical_name.localeCompare(b.canonical_name)),
    };
  }, [categorizedBadges]);

  // Filter sorted badges based on active tab and search query
  const filteredBadgesForTab = useMemo(() => {
    if (!badgePickerSide || !badgePickerTab) return [];
    const list = sortedBadges[badgePickerTab] || [];
    if (!badgePickerSearch) return list;
    const searchNorm = badgePickerSearch.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return list.filter(badge => {
      const nameNorm = badge.canonical_name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const matchesName = nameNorm.includes(searchNorm);
      const matchesAliases = badge.normalized_aliases && badge.normalized_aliases.some(alias => {
        const aliasNorm = alias.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return aliasNorm.includes(searchNorm);
      });
      return matchesName || matchesAliases;
    });
  }, [sortedBadges, badgePickerSide, badgePickerTab, badgePickerSearch]);

  const filteredBackgrounds = useMemo(() => {
    if (!backgroundSearch) return thumbnailBackgrounds;
    const search = backgroundSearch.toLowerCase();
    return thumbnailBackgrounds.filter(bg => bg.name.toLowerCase().includes(search));
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

  // Dynamic calculations for thumbnail overrides (reactive to inputs when not manually edited)
  const displayShortTitle = useMemo(() => {
    if (userEditedShortTitle) return shortTitle;
    return shortTitle || "RIVAS HOCKEY";
  }, [shortTitle, userEditedShortTitle]);

  const displayCompetitionLine = useMemo(() => {
    if (userEditedCompetitionLine) return competitionLine;
    return competitionLine || (competitionName ? competitionName.toUpperCase() : "PARTIDO AMISTOSO");
  }, [competitionLine, competitionName, userEditedCompetitionLine]);

  const displayBottomLine = useMemo(() => {
    if (userEditedBottomLine) return bottomLine;
    if (bottomLine) return bottomLine;
    const dateParts = scheduledStart ? scheduledStart.split("T") : ["", ""];
    const dateStr = dateParts[0] ? dateParts[0].split("-").reverse().join("/") : "";
    const timeStr = dateParts[1] || "";
    const venueStr = venue || "Ubicación no informada";
    return [dateStr, timeStr, venueStr.toUpperCase()].filter(Boolean).join(" · ");
  }, [bottomLine, scheduledStart, venue, userEditedBottomLine]);

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

  // Filtrado de stream keys y playlists basado en el equipo seleccionado
  const { filteredKeys, filteredBlockedKeys, filteredPlaylists } = useMemo(() => {
    if (!selectedTeamId) {
      return { filteredKeys: [], filteredBlockedKeys: [], filteredPlaylists: [] };
    }
    const resources = teamResourcesMap[selectedTeamId] || { streamKeys: [], playlists: [] };
    const fKeys = streamKeys.filter((sk) => resources.streamKeys.includes(sk.id));
    const fBlockedKeys = blockedStreamKeys.filter((sk) => resources.streamKeys.includes(sk.id));
    const fPlaylists = playlists.filter((pl) => resources.playlists.includes(pl.id));

    return { filteredKeys: fKeys, filteredBlockedKeys: fBlockedKeys, filteredPlaylists: fPlaylists };
  }, [selectedTeamId, streamKeys, blockedStreamKeys, playlists, teamResourcesMap]);

  // Autofill form from selected match
  const fillFromMatch = useMemo(() => {
    return (selected: UnifiedFederationMatch) => {
      setSelectedMatchId(selected.id);
      setFederationSource(selected.source);
      setFederationMatchId(selected.id);
      setFederationTeamKey(selected.rivasTeamKey);
      setCompetitionName(selected.competitionName);
      setHomeTeamName(selected.localTeam);
      setAwayTeamName(selected.visitorTeam);
      setVenue(selected.location || "");
      if (selected.datetimeIso) {
        const localDt = toLocalDateTimeInput(selected.datetimeIso); // "YYYY-MM-DDTHH:mm"
        const [d, t] = localDt.split("T");
        setDatePart(d || "");
        setTimePart(t || "");
        setScheduledStart(localDt);
      } else {
        setDatePart("");
        setTimePart("");
        setScheduledStart("");
      }

      const letter = getRivasLetter(selected);
      const teamLabel = letter ? `${selected.categoryLabel} ${letter}` : selected.categoryLabel;
      const desc = [
        `${selected.localTeam} vs ${selected.visitorTeam}`,
        `${selected.competitionName}${teamLabel ? ` · ${teamLabel}` : ""}`,
        selected.location ? `Pista: ${selected.location}` : null,
        selected.date && selected.time ? `Fecha y hora: ${selected.date} ${selected.time}` : null,
        "Retransmision oficial del club.",
      ].filter(Boolean).join("\n");
      setDescription(desc);

      // Auto-resolve shields
      const localCrest = findCrestUrl(selected.localTeam);
      const visitorCrest = findCrestUrl(selected.visitorTeam);
      setLocalLogo(localCrest);
      setVisitorLogo(visitorCrest);
      
      const isRivasTeamLocal = /\bRIVAS\b/.test(selected.localTeam.toUpperCase()) && !/\bROZAS\b/.test(selected.localTeam.toUpperCase());
      const isRivasTeamVisitor = /\bRIVAS\b/.test(selected.visitorTeam.toUpperCase()) && !/\bROZAS\b/.test(selected.visitorTeam.toUpperCase());
      
      // Intentamos buscar el nombre canónico correspondiente al escudo resuelto
      let localSelVal = "OTROS";
      if (localCrest === "/badges/fmp/rivas.png" && categorizedBadges) {
        const allList = [...categorizedBadges.fmp, ...categorizedBadges.rfep, ...categorizedBadges.selecciones];
        const rivasBadge = allList.find((b) => b.logo_url === "/badges/fmp/rivas.png")
          || allList.find((b) => b.canonical_name.toUpperCase().includes("RIVAS"));
        localSelVal = rivasBadge?.canonical_name || "OTROS";
      } else if (categorizedBadges) {
        const allList = [...categorizedBadges.fmp, ...categorizedBadges.rfep, ...categorizedBadges.selecciones];
        const matchBadge = allList.find(b => b.logo_url === localCrest);
        if (matchBadge) localSelVal = matchBadge.canonical_name;
      }
      setLocalSelection(localSelVal);

      let visitorSelVal = "OTROS";
      if (visitorCrest === "/badges/fmp/rivas.png" && categorizedBadges) {
        const allList = [...categorizedBadges.fmp, ...categorizedBadges.rfep, ...categorizedBadges.selecciones];
        const rivasBadge = allList.find((b) => b.logo_url === "/badges/fmp/rivas.png")
          || allList.find((b) => b.canonical_name.toUpperCase().includes("RIVAS"));
        visitorSelVal = rivasBadge?.canonical_name || "OTROS";
      } else if (categorizedBadges) {
        const allList = [...categorizedBadges.fmp, ...categorizedBadges.rfep, ...categorizedBadges.selecciones];
        const matchBadge = allList.find(b => b.logo_url === visitorCrest);
        if (matchBadge) visitorSelVal = matchBadge.canonical_name;
      }
      setVisitorSelection(visitorSelVal);

      // Auto-resolve thumbnail text fields
      const { abbreviateCategoryName } = require("@/src/lib/thumbnails/rivas-thumbnail-style");
      const categoryShort = selected.categoryKey 
        ? THUMBNAIL_CATEGORY_SHORT_LABELS[selected.categoryKey] || abbreviateCategoryName(selected.categoryLabel || "HOCKEY") 
        : abbreviateCategoryName(selected.categoryLabel || "HOCKEY");
      const titleShort = letter ? `${categoryShort} ${letter}` : categoryShort;
      setShortTitle(titleShort.toUpperCase());
      setCompetitionLine(selected.competitionName.toUpperCase());

      const dateStr = selected.date || "";
      const timeStr = selected.time || "";
      const venueStr = selected.location || "Pista no informada";
      setBottomLine(`${dateStr} · ${timeStr} · ${venueStr.toUpperCase()}`);
      
      setUserEditedShortTitle(true);
      setUserEditedCompetitionLine(true);
      setUserEditedBottomLine(true);
      setPreviewTick(t => t + 1);
    };
  }, [findCrestUrl]);

  // Load matches from API
  useEffect(() => {
    const shouldLoadMatches = mode === "agenda" || Boolean(initialMatchId);
    if (!shouldLoadMatches) return;

    let cancelled = false;
    async function load() {
      setLoadingMatches(true);
      setMatchError(null);
      try {
        const response = await fetch("/api/federations/upcoming", {
          method: "GET",
          cache: "no-store",
        });
        if (cancelled) return;
        if (!response.ok) {
          const errorJson = await response.json().catch(() => ({}));
          setMatchError(errorJson.error || "Las webs de las federaciones (FMP/RFEP) no responden o van demasiado lentas en este momento. La app no tiene la culpa. Puedes volver a intentarlo o introducir los datos manualmente abajo.");
          setLoadingMatches(false);
          return;
        }
        const json = (await response.json()) as { matches?: UnifiedFederationMatch[] };
        if (cancelled) return;
        const parsed = Array.isArray(json.matches) ? json.matches : [];
        setMatches(parsed);
        if (initialMatchId && !preselectedFromQueryRef.current) {
          const preselected = parsed.find((m) => m.id === initialMatchId);
          if (preselected) {
            fillFromMatch(preselected);
            preselectedFromQueryRef.current = true;
          }
        }
        if (parsed.length === 0) {
          setMatchError("No se han encontrado partidos de Hockey Rivas en los próximos 7 días.");
        }
      } catch {
        if (!cancelled) setMatchError("Las webs de las federaciones (FMP/RFEP) no responden o van demasiado lentas en este momento. La app no tiene la culpa. Puedes volver a intentarlo o introducir los datos manualmente abajo.");
      } finally {
        if (!cancelled) setLoadingMatches(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [mode, initialMatchId, fillFromMatch, reloadTick]);

  function applyImportedMatch(matchId: string) {
    const selected = matches.find((m) => m.id === matchId);
    if (!selected) return;

    fillFromMatch(selected);

    if (typeof window !== "undefined") {
      if (agendaOnly) {
        const url = `/dashboard/new?matchId=${encodeURIComponent(selected.id)}`;
        window.location.assign(url);
        return;
      }
      window.setTimeout(() => {
        document.getElementById("broadcast-form-fields")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 30);
    }
  }

  // Group matches for agenda listing
  const groupedMatches = useMemo(() => {
    type SubGroup = { subKey: string; label: string; letter: "A" | "B" | "C" | "D" | null; matches: UnifiedFederationMatch[] };
    type Group = { key: string; label: string; order: number; subGroups: SubGroup[] };

    const groupsMap = new Map<string, Group>();
    const now = agendaNowTs;

    for (const match of matches) {
      if (match.datetimeIso && new Date(match.datetimeIso).getTime() < now) {
        continue;
      }
      const catKey = match.categoryKey || "otros";
      const catLabel = getUnifiedCategoryLabel(catKey, match.categoryLabel || "Otras Competiciones");
      const order = getCategorySortOrder(catKey);
      const subKey = getSubGroupKey(match);
      const letter = getRivasLetter(match);

      if (!groupsMap.has(catKey)) {
        groupsMap.set(catKey, { key: catKey, label: catLabel, order, subGroups: [] });
      }
      const group = groupsMap.get(catKey)!;

      let sub = group.subGroups.find((s) => s.subKey === subKey);
      if (!sub) {
        sub = { subKey, label: getSubGroupLabel(match, catLabel), letter, matches: [] };
        group.subGroups.push(sub);
      }
      sub.matches.push(match);
    }

    return Array.from(groupsMap.values())
      .sort((a, b) => a.order - b.order)
      .map((g) => ({
        ...g,
        subGroups: g.subGroups.sort((a, b) => {
          if (a.letter === b.letter) return 0;
          if (a.letter === null) return 1;
          if (b.letter === null) return -1;
          return a.letter.localeCompare(b.letter);
        }),
      }));
  }, [matches, agendaNowTs]);

  const filteredGroups = useMemo(() => {
    if (!selectedCategory) return groupedMatches;
    return groupedMatches.filter((g) => g.key === selectedCategory);
  }, [groupedMatches, selectedCategory]);

  // Image resizing handler (240x240 pixels max normalisation)
  const resizeBadgeFile = (file: File, side: "local" | "visitor") => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = 240;
          canvas.height = 240;

          // Scale and center inside 240x240
          const scale = Math.min(240 / img.width, 240 / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          const x = (240 - w) / 2;
          const y = (240 - h) / 2;

          ctx.clearRect(0, 0, 240, 240);
          ctx.drawImage(img, x, y, w, h);

          const base64 = canvas.toDataURL("image/png");
          if (side === "local") {
            setLocalLogoBase64(base64);
            setLocalLogo(base64);
          } else {
            setVisitorLogoBase64(base64);
            setVisitorLogo(base64);
          }
          setPreviewTick(t => t + 1);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Drag & Drop handlers
  const handleDrag = (e: DragEvent, side: "local" | "visitor", active: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (side === "local") setLocalDragActive(active);
    else setVisitorDragActive(active);
  };

  const handleDrop = (e: DragEvent, side: "local" | "visitor") => {
    e.preventDefault();
    e.stopPropagation();
    if (side === "local") setLocalDragActive(false);
    else setVisitorDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      resizeBadgeFile(e.dataTransfer.files[0], side);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, side: "local" | "visitor") => {
    if (e.target.files && e.target.files[0]) {
      resizeBadgeFile(e.target.files[0], side);
    }
  };

  // Team select handles
  const handleTeamSelectionChange = (val: string, side: "local" | "visitor") => {
    if (side === "local") {
      setLocalSelection(val);
      if (val === "OTROS") {
        setHomeTeamName("");
        setLocalLogo("/badges/fmp/rivas.png");
        setLocalLogoBase64("");
      } else if (val) {
        setHomeTeamName(val);
        const crest = findCrestUrl(val);
        setLocalLogo(crest);
        setLocalLogoBase64("");
      }
    } else {
      setVisitorSelection(val);
      if (val === "OTROS") {
        setAwayTeamName("");
        setVisitorLogo("/badges/fmp/rivas.png");
        setVisitorLogoBase64("");
      } else if (val) {
        setAwayTeamName(val);
        const crest = findCrestUrl(val);
        setVisitorLogo(crest);
        setVisitorLogoBase64("");
      }
    }
    setPreviewTick(t => t + 1);
  };

  // Generate thumbnail payload and overrides for JSON fields
  const thumbnailPayloadJson = useMemo(() => {
    return JSON.stringify({
      shortTitle: displayShortTitle,
      competitionLine: displayCompetitionLine,
      bottomLine: displayBottomLine,
      localLogo: localLogoBase64 || localLogo,
      visitorLogo: visitorLogoBase64 || visitorLogo,
    });
  }, [displayShortTitle, displayCompetitionLine, displayBottomLine, localLogo, visitorLogo, localLogoBase64, visitorLogoBase64]);

  const thumbnailOverridesJson = useMemo(() => {
    return JSON.stringify({
      shortTitle: displayShortTitle,
      competitionLine: displayCompetitionLine,
      bottomLine: displayBottomLine,
      localLogoUrl: localLogoBase64 || localLogo,
      visitorLogoUrl: visitorLogoBase64 || visitorLogo,
    });
  }, [displayShortTitle, displayCompetitionLine, displayBottomLine, localLogo, visitorLogo, localLogoBase64, visitorLogoBase64]);

  return (
    <form action={formAction} className="mt-4 space-y-5 rounded-2xl border border-white/20 bg-[#12121a] p-6 shadow-2xl shadow-black/60">
      <input type="hidden" name="federationSource" value={federationSource} />
      <input type="hidden" name="federationMatchId" value={federationMatchId} />
      <input type="hidden" name="federationTeamKey" value={federationTeamKey} />
      <input type="hidden" name="homeCrestUrl" value={localLogoBase64 || localLogo} />
      <input type="hidden" name="awayCrestUrl" value={visitorLogoBase64 || visitorLogo} />
      <input type="hidden" name="thumbnailPayload" value={thumbnailPayloadJson} />
      <input type="hidden" name="thumbnailOverrides" value={thumbnailOverridesJson} />
      <input type="hidden" name="thumbnailBackgroundId" value={selectedBackgroundId} />
      {categorizedBadges && localSelection !== "OTROS" && (
        <input type="hidden" name="homeTeamName" value={homeTeamName} />
      )}
      {categorizedBadges && visitorSelection !== "OTROS" && (
        <input type="hidden" name="awayTeamName" value={awayTeamName} />
      )}

      {mode === "agenda" ? (
        <section className="glass-panel rounded-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <h2 className="font-display text-sm font-semibold tracking-wider text-text-muted uppercase">Agenda competiciones · próximos 7 días</h2>
              <p className="mt-1 text-xs text-text-muted">FMP (autonómica) + RFEP (nacional) · actualizado en tiempo real</p>
            </div>
            {loadingMatches ? (
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />Cargando…
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                {matches.length} {matches.length === 1 ? "partido" : "partidos"}
              </span>
            )}
          </div>

          {matchError && !loadingMatches && (
            <div className="mt-3 rounded-lg border border-rose-900/30 bg-[#2d1215] p-3.5 text-xs font-medium text-rose-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <span className="leading-relaxed flex-1">⚠ {matchError}</span>
                <button
                  type="button"
                  onClick={() => setReloadTick((t) => t + 1)}
                  className="flex items-center justify-center gap-1.5 shrink-0 rounded-lg bg-accent-red/20 px-3.5 py-2 text-xs font-semibold text-rose-300 ring-1 ring-inset ring-rose-500/30 hover:bg-accent-red/35 transition-all"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3" />
                  </svg>
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {loadingMatches && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="animate-pulse agenda-card rounded-lg p-4 space-y-3">
                  <div className="h-3 w-1/3 rounded bg-white/5" />
                  <div className="h-4 w-3/4 rounded bg-white/5" />
                  <div className="h-4 w-1/2 rounded bg-white/5" />
                  <div className="h-3 w-2/3 rounded bg-white/5" />
                </div>
              ))}
            </div>
          )}

          {matches.length > 0 && !loadingMatches && (
            <div className="mt-4 space-y-5">
              {groupedMatches.length > 1 && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-text-muted shrink-0">Filtrar:</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="glass-input cursor-pointer rounded-lg px-3 py-1.5 text-xs text-white focus:border-accent-cyan focus:outline-none"
                  >
                    <option value="">Todas las categorías</option>
                    {groupedMatches.map((g) => (
                      <option key={g.key} value={g.key}>
                        {g.label} ({g.subGroups.reduce((s, sg) => s + sg.matches.length, 0)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {filteredGroups.map((group) => (
                <div key={group.key} className="space-y-4">
                  <div className="mb-1 flex items-center gap-3">
                    <span className="h-7 w-1 shrink-0 rounded-full bg-accent-red" />
                    <h3 className="text-xl font-extrabold uppercase tracking-wider text-accent-cyan">{group.label}</h3>
                    <span className="h-px flex-1 bg-white/5" />
                  </div>

                  {group.subGroups.map((sub) => (
                    <div key={sub.subKey} className="space-y-2 pl-1">
                      {group.subGroups.length > 1 && (
                        <div className="flex items-center gap-2 mb-2">
                          <LetterBadge letter={sub.letter} />
                          <span className="text-sm font-semibold text-text-muted">{sub.label}</span>
                          <span className="text-xs text-text-muted/70">({sub.matches.length})</span>
                        </div>
                      )}

                      <div className="grid gap-3 sm:grid-cols-2">
                        {sub.matches.map((match) => {
                          const isSelected = selectedMatchId === match.id;
                          const letter = getRivasLetter(match);
                          const displayDateTime = `${match.date} · ${match.time || "Hora por confirmar"}`;
                          const displayVenue = match.location || "Pista por confirmar";

                          return (
                            <div
                              key={match.id}
                              onClick={() => applyImportedMatch(match.id)}
                              className={`cursor-pointer rounded-xl p-5 transition-all duration-200 hover:scale-[1.01] ${
                                isSelected ? "agenda-card-selected" : "agenda-card"
                              }`}
                            >
                              <div className="flex items-center justify-between text-sm font-semibold text-accent-cyan">
                                <span>{displayDateTime}</span>
                                <div className="flex items-center gap-1.5">
                                  {letter && <LetterBadge letter={letter} />}
                                  <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-text-muted uppercase font-mono tracking-wider">
                                    {match.source}
                                  </span>
                                </div>
                              </div>

                              <h3 className="mt-3 text-base font-extrabold uppercase tracking-wide text-white leading-snug line-clamp-2">
                                {match.competitionName}
                              </h3>

                              <p className="mt-3 text-sm font-bold uppercase tracking-wide text-text-muted leading-snug line-clamp-1">
                                {match.localTeam}
                                <span className="mx-1.5 text-text-muted/50 font-bold">vs</span>
                                {match.visitorTeam}
                              </p>

                              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-text-muted/70">
                                <span className="line-clamp-1 flex-1 pr-2">📍 {displayVenue}</span>
                                <span className="shrink-0 font-mono">
                                  {match.score ? `Marcador: ${match.score}` : "Pendiente"}
                                </span>
                              </div>

                              <div className="mt-5">
                                <button
                                  type="button"
                                  className={`w-full rounded-lg py-2 text-sm font-semibold transition-all ${
                                    isSelected ? "btn-primary" : "btn-ghost hover:bg-white/10"
                                  }`}
                                >
                                  {isSelected ? "Programacion preparada ✓" : "Programar emision"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {!agendaOnly ? (
        <>
          <div id="broadcast-form-fields" className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              <span className="mb-1 block text-text-muted">Competición</span>
              <input name="competitionName" required value={competitionName} onChange={(e) => setCompetitionName(e.target.value)}
                className="w-full rounded-lg border border-white/25 bg-[#1a1a24] px-3 py-2.5 text-white focus:border-accent-cyan focus:outline-none" />
            </label>
            <div className="text-sm font-medium space-y-1">
              <span className="mb-1 block text-text-muted">Fecha y hora</span>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-grow">
                  <CustomDatePicker
                    value={datePart}
                    onChange={(date) => handleDateTimeChange(date, timePart)}
                    placeholder="Fecha del partido"
                  />
                </div>
                
                <div className="flex items-center gap-2 bg-[#1a1a24] border border-white/25 rounded-lg px-3 py-2 w-full sm:w-auto shrink-0 justify-center">
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

            {/* --- Equipo Local (Dropdown o Input de "Otros") --- */}
            <div className="text-sm font-medium space-y-2">
              <span className="mb-1 block text-text-muted font-semibold">Equipo local</span>
              {categorizedBadges ? (
                <select
                  value={localSelection}
                  onChange={(e) => handleTeamSelectionChange(e.target.value, "local")}
                  className="w-full rounded-lg border border-white/25 bg-[#1a1a24] px-3 py-2.5 text-white focus:border-accent-cyan focus:outline-none"
                >
                  <option value="">Selecciona club...</option>
                  <optgroup label="Equipos FMP (Madrid)">
                    {categorizedBadges.fmp.map((b) => (
                      <option key={b.canonical_name} value={b.canonical_name}>{b.canonical_name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Equipos RFEP (Nacionales)">
                    {categorizedBadges.rfep.map((b) => (
                      <option key={b.canonical_name} value={b.canonical_name}>{b.canonical_name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Selecciones Autonómicas">
                    {categorizedBadges.selecciones.map((b) => (
                      <option key={b.canonical_name} value={b.canonical_name}>{b.canonical_name}</option>
                    ))}
                  </optgroup>
                  <option value="OTROS" className="text-accent-cyan font-bold">★ OTROS (Configurar a mano)...</option>
                </select>
              ) : (
                <input name="homeTeamName" required value={homeTeamName} onChange={(e) => setHomeTeamName(e.target.value)}
                  className="w-full rounded-lg border border-white/25 bg-[#1a1a24] px-3 py-2.5 text-white focus:border-accent-cyan focus:outline-none" />
              )}

              {categorizedBadges && (
                <button
                  type="button"
                  onClick={() => {
                    setBadgePickerSide("local");
                    setBadgePickerTab("fmp");
                    setBadgePickerSearch("");
                  }}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25 px-3 py-2 text-xs font-bold text-accent-cyan uppercase tracking-wider transition-all active:scale-[0.98]"
                >
                  <span>🛡️</span>
                  <span>CAMBIAR ESCUDO</span>
                </button>
              )}





              {/* Input manual + Drag&Drop si selecciona "OTROS" */}
              {localSelection === "OTROS" && (
                <div className="space-y-3 p-3 border border-white/10 bg-black/30 rounded-xl">
                  <label className="block text-xs text-text-muted">
                    Nombre del club local
                    <input
                      type="text"
                      name="homeTeamName"
                      required
                      value={homeTeamName}
                      onChange={(e) => setHomeTeamName(e.target.value)}
                      placeholder="Escribe el nombre del club..."
                      className="mt-1 w-full rounded-lg border border-white/20 bg-[#12121a] px-3 py-2 text-white text-xs focus:border-accent-cyan focus:outline-none"
                    />
                  </label>

                  {/* Drag and Drop Zone */}
                  <div
                    onDragEnter={(e) => handleDrag(e, "local", true)}
                    onDragOver={(e) => handleDrag(e, "local", true)}
                    onDragLeave={(e) => handleDrag(e, "local", false)}
                    onDrop={(e) => handleDrop(e, "local")}
                    className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                      localDragActive
                        ? "border-accent-cyan bg-accent-cyan/10"
                        : localLogoBase64
                        ? "border-emerald-500/50 bg-emerald-500/5"
                        : "border-white/20 hover:border-white/40 bg-[#12121a]"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/png"
                      onChange={(e) => handleFileChange(e, "local")}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {localLogoBase64 ? (
                      <div className="flex items-center gap-2">
                        <img src={localLogoBase64} alt="Escudo subido" className="w-8 h-8 object-contain" />
                        <span className="text-xs text-emerald-300 font-semibold">Escudo local listo ✓</span>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs text-white/70">Arrastra o pega aquí el escudo local</span>
                        <span className="text-[10px] text-text-muted mt-1">(PNG transparente recomendado)</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* --- Equipo Visitante (Dropdown o Input de "Otros") --- */}
            <div className="text-sm font-medium space-y-2">
              <span className="mb-1 block text-text-muted font-semibold">Equipo visitante</span>
              {categorizedBadges ? (
                <select
                  value={visitorSelection}
                  onChange={(e) => handleTeamSelectionChange(e.target.value, "visitor")}
                  className="w-full rounded-lg border border-white/25 bg-[#1a1a24] px-3 py-2.5 text-white focus:border-accent-cyan focus:outline-none"
                >
                  <option value="">Selecciona club...</option>
                  <optgroup label="Equipos FMP (Madrid)">
                    {categorizedBadges.fmp.map((b) => (
                      <option key={b.canonical_name} value={b.canonical_name}>{b.canonical_name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Equipos RFEP (Nacionales)">
                    {categorizedBadges.rfep.map((b) => (
                      <option key={b.canonical_name} value={b.canonical_name}>{b.canonical_name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Selecciones Autonómicas">
                    {categorizedBadges.selecciones.map((b) => (
                      <option key={b.canonical_name} value={b.canonical_name}>{b.canonical_name}</option>
                    ))}
                  </optgroup>
                  <option value="OTROS" className="text-accent-cyan font-bold">★ OTROS (Configurar a mano)...</option>
                </select>
              ) : (
                <input name="awayTeamName" required value={awayTeamName} onChange={(e) => setAwayTeamName(e.target.value)}
                  className="w-full rounded-lg border border-white/25 bg-[#1a1a24] px-3 py-2.5 text-white focus:border-accent-cyan focus:outline-none" />
              )}

              {categorizedBadges && (
                <button
                  type="button"
                  onClick={() => {
                    setBadgePickerSide("visitor");
                    setBadgePickerTab("fmp");
                    setBadgePickerSearch("");
                  }}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25 px-3 py-2 text-xs font-bold text-accent-cyan uppercase tracking-wider transition-all active:scale-[0.98]"
                >
                  <span>🛡️</span>
                  <span>CAMBIAR ESCUDO</span>
                </button>
              )}





              {/* Input manual + Drag&Drop si selecciona "OTROS" */}
              {visitorSelection === "OTROS" && (
                <div className="space-y-3 p-3 border border-white/10 bg-black/30 rounded-xl">
                  <label className="block text-xs text-text-muted">
                    Nombre del club visitante
                    <input
                      type="text"
                      name="awayTeamName"
                      required
                      value={awayTeamName}
                      onChange={(e) => setAwayTeamName(e.target.value)}
                      placeholder="Escribe el nombre del club..."
                      className="mt-1 w-full rounded-lg border border-white/20 bg-[#12121a] px-3 py-2 text-white text-xs focus:border-accent-cyan focus:outline-none"
                    />
                  </label>

                  {/* Drag and Drop Zone */}
                  <div
                    onDragEnter={(e) => handleDrag(e, "visitor", true)}
                    onDragOver={(e) => handleDrag(e, "visitor", true)}
                    onDragLeave={(e) => handleDrag(e, "visitor", false)}
                    onDrop={(e) => handleDrop(e, "visitor")}
                    className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                      visitorDragActive
                        ? "border-accent-cyan bg-accent-cyan/10"
                        : visitorLogoBase64
                        ? "border-emerald-500/50 bg-emerald-500/5"
                        : "border-white/20 hover:border-white/40 bg-[#12121a]"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/png"
                      onChange={(e) => handleFileChange(e, "visitor")}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {visitorLogoBase64 ? (
                      <div className="flex items-center gap-2">
                        <img src={visitorLogoBase64} alt="Escudo subido" className="w-8 h-8 object-contain" />
                        <span className="text-xs text-emerald-300 font-semibold">Escudo visitante listo ✓</span>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs text-white/70">Arrastra o pega aquí el escudo visitante</span>
                        <span className="text-[10px] text-text-muted mt-1">(PNG transparente recomendado)</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <label className="text-sm font-medium sm:col-span-2">
              <span className="mb-1 block text-text-muted">Pista / lugar</span>
              <input name="venue" value={venue} onChange={(e) => setVenue(e.target.value)}
                className="w-full rounded-lg border border-white/25 bg-[#1a1a24] px-3 py-2.5 text-white focus:border-accent-cyan focus:outline-none" />
            </label>
            <label className="text-sm font-medium">
              <span className="mb-1 block text-text-muted">Equipo asignado</span>
              <select
                name="teamId"
                required
                value={selectedTeamId}
                onChange={(e) => {
                  const newTeam = e.target.value;
                  setSelectedTeamId(newTeam);
                  setSelectedStreamKeyId("");
                  setSelectedPlaylistId("");
                }}
                className="w-full rounded-lg border border-white/25 bg-[#1a1a24] px-3 py-2.5 text-white focus:border-accent-cyan focus:outline-none"
              >
                <option value="">Selecciona equipo</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium">
              <span className="mb-1 block text-text-muted">Stream key asignada</span>
              <select
                name="streamKeyId"
                required
                value={selectedStreamKeyId}
                onChange={(e) => setSelectedStreamKeyId(e.target.value)}
                disabled={!selectedTeamId}
                className="w-full rounded-lg border border-white/25 bg-[#1a1a24] px-3 py-2.5 text-white focus:border-accent-cyan focus:outline-none disabled:opacity-50"
              >
                <option value="">
                  {!selectedTeamId
                    ? "Selecciona un equipo primero"
                    : filteredKeys.length === 0 && filteredBlockedKeys.length === 0
                    ? "No hay claves asignadas a este equipo"
                    : "Selecciona stream key"}
                </option>
                {filteredKeys.map((sk) => <option key={sk.id} value={sk.id}>{sk.name}</option>)}
                {filteredBlockedKeys.length > 0 ? <option value="" disabled>---</option> : null}
                {filteredBlockedKeys.map((sk) => (
                  <option key={sk.id} value="" disabled>
                    {sk.name} (ocupada)
                  </option>
                ))}
              </select>
              {selectedTeamId && filteredKeys.length === 0 && filteredBlockedKeys.length === 0 ? (
                <p className="mt-1 text-xs text-accent-red">
                  ⚠ Este equipo no tiene claves de emisión asignadas en el panel de Admin.
                </p>
              ) : null}
              {filteredBlockedKeys.length > 0 ? (
                <p className="mt-1 text-xs text-amber-300">
                  Hay {filteredBlockedKeys.length} stream key(s) ocupadas por emisiones pendientes/activas.
                </p>
              ) : null}
              {filteredBlockedKeys.length > 0 ? (
                <ul className="mt-1 space-y-1 text-[11px] text-text-muted">
                  {filteredBlockedKeys.slice(0, 3).map((item) => (
                    <li key={item.id}>- {item.name}: {item.reason}</li>
                  ))}
                  {filteredBlockedKeys.length > 3 ? <li>- ...y {filteredBlockedKeys.length - 3} mas.</li> : null}
                </ul>
              ) : null}
            </label>
            <label className="text-sm font-medium sm:col-span-2">
              <span className="mb-1 block text-text-muted">Playlist asignada</span>
              <select
                name="playlistId"
                required
                value={selectedPlaylistId}
                onChange={(e) => setSelectedPlaylistId(e.target.value)}
                disabled={!selectedTeamId}
                className="w-full rounded-lg border border-white/25 bg-[#1a1a24] px-3 py-2.5 text-white focus:border-accent-cyan focus:outline-none disabled:opacity-50"
              >
                <option value="">
                  {!selectedTeamId
                    ? "Selecciona un equipo primero"
                    : filteredKeys.length === 0 && filteredBlockedKeys.length === 0
                    ? "No hay claves asignadas a este equipo"
                    : "Selecciona stream key"}
                </option>
                {filteredPlaylists.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {selectedTeamId && filteredPlaylists.length === 0 ? (
                <p className="mt-1 text-xs text-accent-red">
                  ⚠ Este equipo no tiene playlists asignadas en el panel de Admin.
                </p>
              ) : null}
            </label>
            <label className="text-sm font-medium sm:col-span-2">
              <span className="mb-1 block text-text-muted">Descripción del directo</span>
              <textarea name="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-white focus:border-accent-cyan focus:outline-none" />
            </label>
          </div>

          {/* --- SECCIÓN MINIATURA DINÁMICA --- */}
          <div className="mt-6 border-t border-white/10 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">Miniatura del partido (YouTube)</h3>
                <p className="text-xs text-text-muted mt-0.5">Previsualiza y personaliza la miniatura oficial 1280x720p.</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTick(t => t + 1)}
                className="rounded bg-white/5 border border-white/15 px-2.5 py-1 text-xs text-accent-cyan hover:bg-white/10 font-mono"
              >
                Actualizar Preview
              </button>
            </div>

            {/* Selector de fondo */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-black/20 p-4 border border-white/5 rounded-xl text-sm">
              <div>
                <span className="block font-bold text-white uppercase tracking-wider text-xs">Fondo de miniatura</span>
                <span className="text-xs text-text-muted mt-0.5">
                  {thumbnailBackgrounds.find(bg => bg.id === selectedBackgroundId)?.name || "plantilla.png (por defecto)"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBackgroundPickerOpen(true);
                  setBackgroundSearch("");
                }}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25 px-3 py-2 text-xs font-bold text-accent-cyan uppercase tracking-wider transition-all active:scale-[0.98]"
              >
                <span>🖼️</span>
                <span>CAMBIAR FONDO</span>
              </button>
            </div>

            {/* Thumbnail Live Image */}
            <div className="flex justify-center bg-black/40 border border-white/5 rounded-xl p-4 relative">
              <img
                src={previewUrl || "/thumbnails/plantilla.png"}
                alt="Previsualización miniatura YouTube"
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

            {/* Editable Thumbnail Overrides */}
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

          <label className="flex items-start gap-3 text-sm text-text-muted bg-black/20 border border-white/8 rounded-lg p-3 mt-6">
            <input name="confirmedLegalBasis" type="checkbox" required className="mt-1 accent-cyan-500" />
            <span>Confirmo que el club dispone de autorización/base jurídica suficiente para la grabación y emisión del encuentro, especialmente si participan menores.</span>
          </label>

          {state.error && (
            <p className="text-sm font-semibold text-rose-400 bg-accent-red/10 border border-rose-900/30 rounded-lg p-3 mt-4">⚠ {state.error}</p>
          )}

          <button type="submit" disabled={pending}
            className="w-full rounded-lg bg-accent-red px-4 py-3.5 font-bold text-white transition-all hover:bg-accent-red/80 active:scale-[0.99] disabled:opacity-50 mt-4">
            {pending ? "Creando en YouTube..." : "Crear directo"}
          </button>
        </>
      ) : null}

      {/* Selector Visual de Escudos (Modal) */}
      {badgePickerSide && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md transition-opacity duration-300"
          onClick={() => setBadgePickerSide(null)}
        >
          <div 
            className="glass-panel w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border border-white/10 bg-[#0e0e16]/95 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div className="flex items-center justify-between border-b border-white/10 p-4 bg-black/20">
              <div>
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                  Seleccionar Escudo: Equipo {badgePickerSide === "local" ? "Local" : "Visitante"}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">Elige visualmente el escudo de nuestro inventario para el club.</p>
              </div>
              <button
                type="button"
                onClick={() => setBadgePickerSide(null)}
                className="rounded-full bg-white/5 p-1.5 text-text-muted hover:bg-white/10 hover:text-white transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Barra de búsqueda */}
            <div className="p-4 border-b border-white/5 bg-black/10">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar club por nombre o siglas (ej. Aluche, Pilar, ALC)..."
                  value={badgePickerSearch}
                  onChange={(e) => setBadgePickerSearch(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-[#161622] pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-accent-cyan focus:outline-none"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/35">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Tabs por grupos */}
            <div className="flex border-b border-white/5 bg-black/20 text-xs sm:text-sm">
              <button
                type="button"
                onClick={() => setBadgePickerTab("fmp")}
                className={`flex-1 py-3.5 text-center font-bold tracking-wider uppercase border-b-2 transition-all ${
                  badgePickerTab === "fmp"
                    ? "border-accent-cyan text-accent-cyan bg-accent-cyan/5"
                    : "border-transparent text-text-muted hover:text-white hover:bg-white/5"
                }`}
              >
                FMP (Madrid)
              </button>
              <button
                type="button"
                onClick={() => setBadgePickerTab("rfep")}
                className={`flex-1 py-3.5 text-center font-bold tracking-wider uppercase border-b-2 transition-all ${
                  badgePickerTab === "rfep"
                    ? "border-accent-cyan text-accent-cyan bg-accent-cyan/5"
                    : "border-transparent text-text-muted hover:text-white hover:bg-white/5"
                }`}
              >
                RFEP (Nacional)
              </button>
              <button
                type="button"
                onClick={() => setBadgePickerTab("selecciones")}
                className={`flex-1 py-3.5 text-center font-bold tracking-wider uppercase border-b-2 transition-all ${
                  badgePickerTab === "selecciones"
                    ? "border-accent-cyan text-accent-cyan bg-accent-cyan/5"
                    : "border-transparent text-text-muted hover:text-white hover:bg-white/5"
                }`}
              >
                Selecciones Autonómicas
              </button>
            </div>

            {/* Grid de escudos */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#09090f] custom-scrollbar">
              {filteredBadgesForTab.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-text-muted">
                  <svg className="w-12 h-12 text-white/10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm">No se encontraron clubes con esos filtros.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {filteredBadgesForTab.map((badge) => {
                    const isSelected = badgePickerSide === "local"
                      ? localLogo === badge.logo_url
                      : visitorLogo === badge.logo_url;

                    return (
                      <div
                        key={badge.canonical_name}
                        onClick={() => {
                          if (badgePickerSide === "local") {
                            setLocalLogo(badge.logo_url);
                            setLocalLogoBase64("");
                          } else {
                            setVisitorLogo(badge.logo_url);
                            setVisitorLogoBase64("");
                          }
                          setPreviewTick(t => t + 1);
                          setBadgePickerSide(null);
                        }}
                        className={`cursor-pointer group flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${
                          isSelected
                            ? "bg-accent-cyan/10 border-accent-cyan shadow-lg shadow-accent-cyan/5"
                            : "bg-[#12121a]/60 border-white/5 hover:border-white/20 hover:bg-[#1a1a26]"
                        }`}
                      >
                        <div className="w-16 h-16 flex items-center justify-center bg-black/20 rounded-lg p-2">
                          <img
                            src={badge.logo_url}
                            alt={badge.canonical_name}
                            className="w-full h-full object-contain filter group-hover:drop-shadow-[0_0_6px_rgba(34,211,238,0.45)] transition-all"
                            loading="lazy"
                          />
                        </div>
                        <span className="text-[11px] font-bold text-center mt-3 leading-tight line-clamp-2 text-white/90 group-hover:text-accent-cyan transition-colors uppercase tracking-wide">
                          {badge.canonical_name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 p-3 bg-black/25 flex justify-end">
              <button
                type="button"
                onClick={() => setBadgePickerSide(null)}
                className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-text-muted hover:bg-white/10 hover:text-white transition-all active:scale-[0.98]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selector Visual de Fondos (Modal) */}
      {backgroundPickerOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md transition-opacity duration-300"
          onClick={() => setBackgroundPickerOpen(false)}
        >
          <div 
            className="glass-panel w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border border-white/10 bg-[#0e0e16]/95 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div className="flex items-center justify-between border-b border-white/10 p-4 bg-black/20">
              <div>
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                  Seleccionar Fondo de Miniatura
                </h3>
                <p className="text-xs text-text-muted mt-0.5">Elige uno de los fondos oficiales cargados en el sistema.</p>
              </div>
              <button
                type="button"
                onClick={() => setBackgroundPickerOpen(false)}
                className="rounded-full bg-white/5 p-1.5 text-text-muted hover:bg-white/10 hover:text-white transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Barra de búsqueda */}
            <div className="p-4 border-b border-white/5 bg-black/10">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar fondo por nombre..."
                  value={backgroundSearch}
                  onChange={(e) => setBackgroundSearch(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-[#161622] pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-accent-cyan focus:outline-none"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/35">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Grid de fondos */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#09090f] custom-scrollbar">
              {filteredBackgrounds.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-text-muted">
                  <svg className="w-12 h-12 text-white/10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm">No se encontraron fondos con esos filtros.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredBackgrounds.map((bg) => {
                    const isSelected = selectedBackgroundId
                      ? selectedBackgroundId === bg.id
                      : defaultBg?.id === bg.id;

                    return (
                      <div
                        key={bg.id}
                        onClick={() => {
                          setSelectedBackgroundId(bg.id);
                          setPreviewTick(t => t + 1);
                          setBackgroundPickerOpen(false);
                        }}
                        className={`cursor-pointer group flex flex-col rounded-xl border overflow-hidden transition-all duration-200 hover:scale-[1.02] ${
                          isSelected
                            ? "bg-accent-cyan/10 border-accent-cyan shadow-lg shadow-accent-cyan/5"
                            : "bg-[#12121a]/60 border-white/5 hover:border-white/20 hover:bg-[#1a1a26]"
                        }`}
                      >
                        {/* Preview del fondo */}
                        <div className="aspect-video w-full flex items-center justify-center bg-black/40 relative overflow-hidden">
                          <img
                            src={getBackgroundPreviewSrc(bg)}
                            alt={bg.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(event) => {
                              const next = `/api/thumbnail/background?id=${bg.id}`;
                              if (event.currentTarget.src.endsWith(next)) return;
                              event.currentTarget.src = next;
                            }}
                          />
                          {bg.is_default && (
                            <span className="absolute top-2 left-2 rounded bg-accent-cyan px-1.5 py-0.5 text-[9px] font-extrabold text-black uppercase">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="p-3">
                          <span className="text-[11px] font-bold block leading-tight truncate text-white/90 group-hover:text-accent-cyan transition-colors uppercase tracking-wide">
                            {bg.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 p-3 bg-black/25 flex justify-end">
              <button
                type="button"
                onClick={() => setBackgroundPickerOpen(false)}
                className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-text-muted hover:bg-white/10 hover:text-white transition-all active:scale-[0.98]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </form>

  );
}

function toLocalDateTimeInput(valueIso: string) {
  const date = new Date(valueIso);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
