"use client";

import { useActionState, useState, ChangeEvent } from "react";
import { createThumbnailBackgroundAction } from "@/src/actions/admin.actions";

const initialState = {} as { error?: string; ok?: string };

export function ThumbnailBackgroundCreateForm() {
  const [state, formAction, pending] = useActionState(createThumbnailBackgroundAction, initialState);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
            // Resize to 1280x720 for optimal thumbnail background size
            canvas.width = 1280;
            canvas.height = 720;
            ctx.drawImage(img, 0, 0, 1280, 720);
            const base64 = canvas.toDataURL("image/jpeg", 0.85); // JPEG compression
            setBase64Data(base64);
            setPreviewUrl(base64);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form action={formAction} className="glass-panel rounded-xl p-5 space-y-4">
      <h2 className="font-display text-sm font-semibold tracking-wider text-text-muted uppercase">Nuevo fondo de miniatura</h2>
      
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Nombre descriptivo</label>
            <input required name="name" placeholder="Ej. Fondo Hockey Pista Azul" className="w-full glass-card rounded-lg px-4 py-2.5 text-white" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Seleccionar archivo de fondo (1280x720 sugerido)</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-xs text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/5 file:text-accent-cyan hover:file:bg-white/10 cursor-pointer" />
            <input type="hidden" name="base64Data" value={base64Data} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">O usar ruta URL / local externa (opcional si subes archivo)</label>
            <input name="urlPath" placeholder="/images/fondo.png" className="w-full glass-card rounded-lg px-4 py-2.5 text-white" />
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-text-muted">
            <input type="checkbox" name="isDefault" value="true" className="rounded border-white/10 bg-black/30" />
            <span>Establecer como fondo por defecto para nuevas emisiones</span>
          </label>
        </div>

        <div className="flex flex-col items-center justify-center border border-white/10 rounded-lg p-3 bg-black/40 min-h-[160px]">
          {previewUrl ? (
            <div className="w-full space-y-2">
              <span className="block text-center text-[10px] uppercase font-bold text-text-muted">Previsualización</span>
              <img src={previewUrl} alt="Preview" className="w-full aspect-video rounded border border-white/10 object-cover" />
            </div>
          ) : (
            <span className="text-xs text-text-muted">Ningún fondo seleccionado o cargado</span>
          )}
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn-primary rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider">
        {pending ? "Guardando..." : "Crear fondo"}
      </button>
      {state.error ? <p className="mt-2 text-sm text-accent-red">⚠ {state.error}</p> : null}
      {state.ok ? <p className="mt-2 text-sm text-emerald-300">✓ {state.ok}</p> : null}
    </form>
  );
}
