"use client";

import { useTransition } from "react";
import { changeActiveSeasonAction } from "@/src/actions/season.actions";
import type { Season } from "@/src/lib/seasons/utils";

export function SeasonSelector({
  seasons,
  activeSeasonId,
}: {
  seasons: Season[];
  activeSeasonId: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = e.target.value;
    startTransition(async () => {
      await changeActiveSeasonAction(nextId);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-[10px] font-bold tracking-widest text-text-muted uppercase sm:block">
        Temp.
      </span>
      <select
        value={activeSeasonId}
        onChange={handleSeasonChange}
        disabled={isPending}
        className="glass-input cursor-pointer rounded-md px-2 py-1.5 text-xs text-white outline-none focus:border-accent-red/50 sm:text-sm"
      >
        {seasons.map((season) => (
          <option key={season.id} value={season.id}>
            {season.name}
          </option>
        ))}
      </select>
      {isPending ? (
        <span className="live-dot inline-block h-2 w-2 rounded-full bg-accent-red" />
      ) : null}
    </div>
  );
}
