"use client";

import { useActionState } from "react";
import { loginAction, type LoginActionState } from "@/src/actions/auth.actions";

const initialState: LoginActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold tracking-wider text-text-muted uppercase">
          Email
        </span>
        <input
          required
          name="email"
          type="email"
          autoComplete="email"
          className="glass-input w-full rounded-lg px-4 py-3 text-sm outline-none"
          placeholder="usuario@rivas.es"
        />
      </label>

      <label className="block">
        <div className="flex items-center justify-between mb-1.5">
          <span className="block text-xs font-semibold tracking-wider text-text-muted uppercase">
            Contraseña
          </span>
          <a
            href="/forgot-password"
            className="text-[11px] font-medium text-accent-cyan hover:underline transition-all"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>
        <input
          required
          name="password"
          type="password"
          autoComplete="current-password"
          className="glass-input w-full rounded-lg px-4 py-3 text-sm outline-none"
          placeholder="········"
        />
      </label>

      {state.error ? (
        <p className="text-xs font-medium text-accent-red">{state.error}</p>
      ) : null}

      <button
        disabled={pending}
        type="submit"
        className="btn-primary w-full rounded-lg px-4 py-3 text-sm disabled:opacity-50"
      >
        {pending ? "Entrando..." : "Entrar al estudio"}
      </button>
    </form>
  );
}
