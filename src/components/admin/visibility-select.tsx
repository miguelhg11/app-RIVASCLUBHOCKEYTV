"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateContentVisibilityAction } from "@/src/actions/update-visibility.action";

type Props = {
  id: string;
  type: "broadcast" | "video";
  initialStatus: "unlisted" | "public";
};

export function VisibilitySelect({ id, type, initialStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"unlisted" | "public">(initialStatus || "unlisted");
  const [loading, setLoading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as "unlisted" | "public";
    setLoading(true);
    try {
      const res = await updateContentVisibilityAction(type, id, newStatus);
      if (res.error) {
        alert(res.error);
        // Reset to previous status on error
        setStatus(status);
      } else {
        setStatus(newStatus);
        router.refresh();
      }
    } catch (err) {
      alert("Error inesperado al actualizar la visibilidad.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block text-xs">
      <select
        value={status}
        disabled={loading}
        onChange={handleChange}
        className={`rounded border px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-accent-cyan disabled:opacity-50 transition-all cursor-pointer ${
          status === "public"
            ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
            : "border-white/10 bg-[#12121a] text-white/80 hover:bg-white/[0.04]"
        }`}
      >
        <option value="unlisted">Oculto 🔒</option>
        <option value="public">Público 🌐</option>
      </select>
      {loading && (
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-cyan"></span>
        </span>
      )}
    </div>
  );
}
