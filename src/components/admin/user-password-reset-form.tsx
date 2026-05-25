"use client";

import { useActionState } from "react";
import { resetUserPasswordAction } from "@/src/actions/admin.actions";

const initialState = {} as { error?: string; ok?: string };

export function UserPasswordResetForm({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(resetUserPasswordAction, initialState);

  return (
    <form action={formAction} className="mt-1.5 flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-accent-red/10 px-3 py-1.5 text-xs font-semibold text-accent-red ring-1 ring-inset ring-accent-red/20 hover:bg-accent-red/20 disabled:opacity-50 transition-all"
      >
        {pending ? "Restableciendo..." : "Restablecer y enviar por email"}
      </button>
      {state.error ? <span className="text-xs text-accent-red font-medium">{state.error}</span> : null}
      {state.ok ? <span className="text-xs text-emerald-400 font-medium">{state.ok}</span> : null}
    </form>
  );
}
