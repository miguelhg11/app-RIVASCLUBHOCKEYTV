"use client";

import { useSearchParams } from "next/navigation";
import { useActionState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { resetPasswordWithTokenAction } from "@/src/actions/forgot-password.actions";

const initialState = {} as { error?: string; ok?: string };

function ResetPasswordFormInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";
  
  const [state, formAction, pending] = useActionState(resetPasswordWithTokenAction, initialState);

  if (!token || !email) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-accent-red font-medium leading-relaxed">
          Enlace de recuperación inválido. Por favor, solicita uno nuevo.
        </p>
        <div className="pt-2">
          <Link
            href="/forgot-password"
            className="btn-primary flex w-full justify-center rounded-lg px-4 py-2.5 text-sm"
          >
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={email} />

      <div className="rounded bg-white/[0.02] border border-white/5 p-3 text-xs text-text-muted">
        Restableciendo contraseña para: <span className="text-white font-medium">{email}</span>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold tracking-wider text-text-muted uppercase">
          Nueva Contraseña
        </span>
        <input
          required
          name="newPassword"
          type="password"
          minLength={8}
          autoComplete="new-password"
          className="glass-input w-full rounded-lg px-4 py-3 text-sm outline-none"
          placeholder="Mínimo 8 caracteres"
        />
      </label>

      {state.error ? (
        <p className="text-xs font-medium text-accent-red">{state.error}</p>
      ) : null}

      {state.ok ? (
        <div className="space-y-3">
          <p className="text-xs font-medium text-emerald-400">{state.ok}</p>
          <Link
            href="/login"
            className="btn-primary flex w-full justify-center rounded-lg px-4 py-2.5 text-sm"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      ) : (
        <button
          disabled={pending}
          type="submit"
          className="btn-primary w-full rounded-lg px-4 py-3 text-sm disabled:opacity-50"
        >
          {pending ? "Restableciendo..." : "Guardar nueva contraseña"}
        </button>
      )}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full flex-col items-center justify-center px-4">
      <div className="atmosphere-bg" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Link href="/login">
            <Image
              src="/imagenes/RIVASHOCKEYTV.png"
              alt="Rivas Hockey TV"
              width={280}
              height={84}
              priority
              className="logo-glow h-auto w-56 cursor-pointer"
            />
          </Link>
          <div>
            <h1 className="font-display text-xl font-semibold tracking-wide text-white">
              RESTABLECER CONTRASEÑA
            </h1>
            <p className="mt-1 text-xs tracking-widest text-text-muted uppercase">
              Introduce tu nueva contraseña
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <Suspense fallback={<p className="text-center text-sm text-text-muted">Cargando...</p>}>
            <ResetPasswordFormInner />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-text-muted/60">
          CP Rivas Las Lagunas · Rivas Hockey TV
        </p>
      </div>
    </main>
  );
}
