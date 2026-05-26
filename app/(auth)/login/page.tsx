import Image from "next/image";
import { LoginForm } from "@/src/components/forms/login-form";

export default function LoginPage() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full flex-col items-center justify-center px-4">
      <div className="atmosphere-bg" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Image
            src="/imagenes/RIVASHOCKEYTV.png"
            alt="Rivas Hockey TV"
            width={380}
            height={114}
            priority
            className="logo-glow h-auto w-72 sm:w-80"
          />
          <div>
            <h1 className="font-display text-xl font-semibold tracking-wide text-white">
              ACCESO AL ESTUDIO
            </h1>
            <p className="mt-1 text-xs tracking-widest text-text-muted uppercase">
              Autenticación requerida
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-text-muted/60">
          CP Rivas Las Lagunas · Hockey en Directo
        </p>
      </div>
    </main>
  );
}
