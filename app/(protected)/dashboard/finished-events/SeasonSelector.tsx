"use client";

import { useRouter } from "next/navigation";

type Props = {
  seasons: Array<{ id: string; name: string }>;
  selectedSeasonId: string;
};

export function SeasonSelector({ seasons, selectedSeasonId }: Props) {
  const router = useRouter();

  return (
    <div className="w-full max-w-xs">
      <label htmlFor="season-select" className="block text-xs font-semibold tracking-wider text-text-muted uppercase mb-1.5">
        Seleccionar Temporada
      </label>
      <select
        id="season-select"
        value={selectedSeasonId}
        onChange={(e) => {
          router.push(`/dashboard/finished-events?seasonId=${e.target.value}`);
        }}
        className="glass-input w-full rounded-lg px-3 py-2 text-sm outline-none"
      >
        {seasons.map((s) => (
          <option key={s.id} value={s.id}>
            Temporada {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
