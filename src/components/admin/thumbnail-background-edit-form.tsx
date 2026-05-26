"use client";

import { useActionState, useState, ChangeEvent } from "react";
import { updateThumbnailBackgroundAction } from "@/src/actions/admin.actions";

const initialState = {} as { error?: string; ok?: string };

export function ThumbnailBackgroundEditForm({
  id,
  name,
  urlPath,
  isDefault,
}: {
  id: string;
  name: string;
  urlPath: string;
  isDefault: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateThumbnailBackgroundAction, initialState);
  const [base64Data, setBase64Data] = useState<string>("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (ctx) {
            canvas.width = 1280;
            canvas.height = 720;
            ctx.drawImage(img, 0, 0, 1280, 720);
            const base64 = canvas.toDataURL("image/jpeg", 0.85);
            setBase64Data(base64);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form action={formAction} className="flex flex-col gap-2 p-3 bg-white/[0.02] border border-white/5 rounded-lg text-xs w-full sm:w-[480px]">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="base64Data" value={base64Data} />
      
      <div className="grid gap-2 grid-cols-2">
        <label className="text-[10px] text-text-muted">
          Nombre
          <input name="name" defaultValue={name} className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-white" />
        </label>
        <label className="text-[10px] text-text-muted">
          Ruta URL (Opcional)
          <input name="urlPath" defaultValue={urlPath} className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-white" />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
        <label className="text-[10px] text-text-muted cursor-pointer flex items-center gap-1.5">
          <input type="file" accept="image/*" onChange={handleFileChange} className="max-w-[150px] text-[9px] text-text-muted file:bg-white/5 file:border-0 file:px-2 file:py-1 file:rounded file:text-[9px] file:text-accent-cyan cursor-pointer" />
        </label>
        
        <label className="text-[10px] text-text-muted cursor-pointer flex items-center gap-1">
          <input type="checkbox" name="isDefault" value="true" defaultChecked={isDefault} className="rounded bg-black/30 border-white/10" />
          <span>Por defecto</span>
        </label>
      </div>

      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/5">
        <button type="submit" disabled={pending} className="btn-primary rounded px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
          {pending ? "Guardando..." : "Guardar cambios"}
        </button>
        {state.ok && <span className="text-emerald-400 font-medium">✓ Guardado</span>}
        {state.error && <span className="text-accent-red font-medium">⚠ {state.error}</span>}
      </div>
    </form>
  );
}
