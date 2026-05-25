"use client";

import { useActionState } from "react";
import { createCategoryAction } from "@/src/actions/admin.actions";

const initialState = {} as { error?: string; ok?: string };

export function CategoryCreateForm() {
  const [state, formAction, pending] = useActionState(createCategoryAction, initialState);

  return (
    <form action={formAction} className="glass-panel rounded-xl p-5">
      <h2 className="font-display text-sm font-semibold tracking-wider text-text-muted uppercase">Nueva categoria</h2>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          required
          name="name"
          placeholder="Ej. Benjamin"
          className="w-full glass-card rounded-lg px-4 py-3 text-sm"
        />
        <input
          required
          type="number"
          name="sortOrder"
          min={0}
          max={9999}
          placeholder="Orden"
          className="w-full glass-card rounded-lg px-4 py-3 text-sm sm:max-w-32"
        />
        <button
          type="submit"
          disabled={pending}
          className="btn-primary rounded-lg px-4 py-2 text-xs disabled:opacity-50"
        >
          {pending ? "Guardando..." : "Crear"}
        </button>
      </div>
      {state.error ? <p className="mt-2 text-sm text-accent-red">{state.error}</p> : null}
      {state.ok ? <p className="mt-2 text-sm text-emerald-300">{state.ok}</p> : null}
    </form>
  );
}
