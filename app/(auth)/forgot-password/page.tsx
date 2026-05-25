"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { requestPasswordResetAction } from "@/src/actions/forgot-password.actions";

const initialState = {} as { error?: string; ok?: string };

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);

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
              RECUPERAR CONTRASEÑA
            </h1>
            <p className="mt-1 text-xs tracking-widest text-text-muted uppercase">
              Introduce tu correo registrado
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          {state.ok ? (
            <div className="space-y-4">
              <p className="text-sm text-emerald-400 font-medium leading-relaxed">
                {state.ok}
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="btn-primary flex w-full justify-center rounded-lg px-4 py-2.5 text-sm"
                >
                  Volver a iniciar sesión
                </Link>
              </div>
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold tracking-wider text-text-muted uppercase">
                  Email / Correo electrónico
                </span>
                <input
                  required
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="glass-input w-full rounded-lg px-4 py-3 text-sm outline-none"
                  placeholder="tu-correo@rivashockey.es"
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
                {pending ? "Enviando enlace..." : "Enviar enlace de recuperación"}
              </button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-accent-cyan hover:underline transition-all"
                >
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-text-muted/60">
          CP Rivas Las Lagunas · Rivas Hockey TV
        </p>
      </div>
    </main>
  );
}
