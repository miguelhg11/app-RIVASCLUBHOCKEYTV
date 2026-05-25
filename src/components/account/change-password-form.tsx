"use client";

import { useActionState } from "react";
import { changeOwnPasswordAction, type AccountPasswordState } from "@/src/actions/account.actions";

const initialState: AccountPasswordState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changeOwnPasswordAction, initialState);

  return (
    <form action={formAction} className="glass-panel rounded-xl p-5">
      <h2 className="font-display text-sm font-semibold tracking-wider text-text-muted uppercase">Cambiar password</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <input
          required
          type="password"
          name="currentPassword"
          placeholder="Password actual"
          className="glass-card rounded-lg px-4 py-3"
        />
        <input
          required
          type="password"
          name="newPassword"
          placeholder="Nueva password"
          className="glass-card rounded-lg px-4 py-3"
        />
        <input
          required
          type="password"
          name="confirmPassword"
          placeholder="Confirmar nueva"
          className="glass-card rounded-lg px-4 py-3"
        />
      </div>
      <button type="submit" disabled={pending} className="mt-3 btn-primary rounded-lg px-4 py-2 text-xs">
        {pending ? "Guardando..." : "Actualizar password"}
      </button>
      {state.error ? <p className="mt-2 text-sm text-accent-red">{state.error}</p> : null}
      {state.ok ? <p className="mt-2 text-sm text-emerald-300">{state.ok}</p> : null}
    </form>
  );
}
