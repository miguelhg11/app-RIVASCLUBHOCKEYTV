"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { assignExternalBroadcastAction, type AssignExternalBroadcastState } from "@/src/actions/broadcast.actions";
import type { UnassignedExternalBroadcastRow } from "@/src/lib/broadcast/queries";
import type { TeamRow, StreamKeyRow, PlaylistRow } from "@/src/lib/admin/queries";

type Props = {
  externalBroadcast: UnassignedExternalBroadcastRow;
  teams: TeamRow[];
  streamKeys: StreamKeyRow[];
  playlists: PlaylistRow[];
};

const initialState: AssignExternalBroadcastState = {};

export function AssignBroadcastForm({ externalBroadcast, teams, streamKeys, playlists }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(assignExternalBroadcastAction, initialState);

  // Pre-calculate initial values from props
  const parsedTitle = (() => {
    const title = externalBroadcast.title;
    const match = title.match(/(.+?)\s+(?:vs|VS|-)\s+(.+)/);
    if (match) {
      const home = match[1].trim();
      const rest = match[2].trim();
      
      let away = rest;
      let comp = "OK Liga Plata";
      
      const compMatch = rest.split("|");
      if (compMatch.length >= 2) {
        away = compMatch[0].trim();
        comp = compMatch[1].trim();
      }
      return { home, away, comp };
    }
    return { home: title || "CP Rivas", away: "Rival", comp: "OK Liga Plata" };
  })();

  const initialStreamKeyId = (() => {
    if (externalBroadcast.youtubeBoundStreamId) {
      const matchedKey = streamKeys.find(
        (sk) => sk.youtube_live_stream_id === externalBroadcast.youtubeBoundStreamId
      );
      return matchedKey ? matchedKey.id : "";
    }
    return "";
  })();

  const [teamId, setTeamId] = useState("");
  const [streamKeyId, setStreamKeyId] = useState(initialStreamKeyId);
  const [playlistId, setPlaylistId] = useState("");
  const [homeTeamName, setHomeTeamName] = useState(parsedTitle.home);
  const [awayTeamName, setAwayTeamName] = useState(parsedTitle.away);
  const [competitionName, setCompetitionName] = useState(parsedTitle.comp);
  const [venue, setVenue] = useState("Polideportivo Cerro del Telégrafo");

  // Pre-fill Home Team Name when a team is selected
  const handleTeamChange = (id: string) => {
    setTeamId(id);
    const selectedTeam = teams.find((t) => t.id === id);
    if (selectedTeam) {
      // If homeTeamName is empty or a generic default, set it to selected team name
      if (!homeTeamName || homeTeamName === "CP Rivas" || homeTeamName.includes("MOCK")) {
        setHomeTeamName(selectedTeam.display_name || selectedTeam.name);
      }
    }
  };

  useEffect(() => {
    if (state.ok) {
      router.push("/admin/broadcasts");
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form action={formAction} className="glass-panel rounded-xl p-6 space-y-5 max-w-2xl">
      <input type="hidden" name="externalBroadcastId" value={externalBroadcast.id} />
      
      <div className="border-b border-white/10 pb-3">
        <h2 className="text-sm font-semibold tracking-wide text-text-muted uppercase">
          DETALLES DEL DIRECTO DETECTADO
        </h2>
        <p className="mt-1 text-base font-semibold text-white">{externalBroadcast.title}</p>
        <p className="text-xs text-text-muted mt-1">
          YouTube ID: <span className="font-mono text-accent-cyan">{externalBroadcast.youtubeBroadcastId}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Team Dropdown */}
        <div>
          <label htmlFor="teamId" className="block text-xs font-semibold tracking-wider text-text-muted uppercase mb-1.5">
            Equipo Destinatario *
          </label>
          <select
            id="teamId"
            name="teamId"
            required
            value={teamId}
            onChange={(e) => handleTeamChange(e.target.value)}
            className="glass-input w-full rounded-lg px-3 py-2 text-sm outline-none"
          >
            <option value="">-- Selecciona un equipo --</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.display_name || t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stream Key Dropdown */}
        <div>
          <label htmlFor="streamKeyId" className="block text-xs font-semibold tracking-wider text-text-muted uppercase mb-1.5">
            Clave de Emisión (Stream Key) *
          </label>
          <select
            id="streamKeyId"
            name="streamKeyId"
            required
            value={streamKeyId}
            onChange={(e) => setStreamKeyId(e.target.value)}
            className="glass-input w-full rounded-lg px-3 py-2 text-sm outline-none"
          >
            <option value="">-- Selecciona clave --</option>
            {streamKeys.map((sk) => (
              <option key={sk.id} value={sk.id}>
                {sk.name} {sk.youtube_live_stream_id === externalBroadcast.youtubeBoundStreamId ? "(Coincidencia)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Playlist Dropdown */}
        <div>
          <label htmlFor="playlistId" className="block text-xs font-semibold tracking-wider text-text-muted uppercase mb-1.5">
            Playlist Vinculada
          </label>
          <select
            id="playlistId"
            name="playlistId"
            value={playlistId}
            onChange={(e) => setPlaylistId(e.target.value)}
            className="glass-input w-full rounded-lg px-3 py-2 text-sm outline-none"
          >
            <option value="">-- Ninguna --</option>
            {playlists.map((pl) => (
              <option key={pl.id} value={pl.id}>
                {pl.name}
              </option>
            ))}
          </select>
        </div>

        {/* Competition Name */}
        <div>
          <label htmlFor="competitionName" className="block text-xs font-semibold tracking-wider text-text-muted uppercase mb-1.5">
            Competición *
          </label>
          <input
            id="competitionName"
            name="competitionName"
            type="text"
            required
            value={competitionName}
            onChange={(e) => setCompetitionName(e.target.value)}
            className="glass-input w-full rounded-lg px-3 py-2 text-sm outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Home Team Name */}
        <div>
          <label htmlFor="homeTeamName" className="block text-xs font-semibold tracking-wider text-text-muted uppercase mb-1.5">
            Equipo Local *
          </label>
          <input
            id="homeTeamName"
            name="homeTeamName"
            type="text"
            required
            value={homeTeamName}
            onChange={(e) => setHomeTeamName(e.target.value)}
            className="glass-input w-full rounded-lg px-3 py-2 text-sm outline-none"
          />
        </div>

        {/* Away Team Name */}
        <div>
          <label htmlFor="awayTeamName" className="block text-xs font-semibold tracking-wider text-text-muted uppercase mb-1.5">
            Equipo Visitante *
          </label>
          <input
            id="awayTeamName"
            name="awayTeamName"
            type="text"
            required
            value={awayTeamName}
            onChange={(e) => setAwayTeamName(e.target.value)}
            className="glass-input w-full rounded-lg px-3 py-2 text-sm outline-none"
          />
        </div>
      </div>

      {/* Venue */}
      <div>
        <label htmlFor="venue" className="block text-xs font-semibold tracking-wider text-text-muted uppercase mb-1.5">
          Pista / Pabellón
        </label>
        <input
          id="venue"
          name="venue"
          type="text"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          className="glass-input w-full rounded-lg px-3 py-2 text-sm outline-none"
        />
      </div>

      <div className="pt-2 border-t border-white/5 flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="btn-primary rounded-lg px-6 py-2.5 text-xs font-semibold tracking-wider"
        >
          {pending ? "Asignando..." : "Confirmar y Vincular"}
        </button>
        
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-ghost rounded-lg px-4 py-2.5 text-xs text-text-muted hover:text-white"
        >
          Cancelar
        </button>
      </div>

      {state.error && <p className="text-sm text-accent-red font-semibold animate-pulse">{state.error}</p>}
      {state.ok && <p className="text-sm text-emerald-400 font-semibold">{state.ok}</p>}
    </form>
  );
}
