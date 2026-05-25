import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full flex-col items-center justify-center gap-8 px-4">
      <div className="atmosphere-bg" />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        <div className="relative">
          <Image
            src="/imagenes/RIVASHOCKEYTV.png"
            alt="Rivas Hockey TV"
            width={400}
            height={120}
            priority
            className="logo-glow h-auto w-72 sm:w-96"
          />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold tracking-wide text-white sm:text-4xl">
            CONTROL DE EMISIONES
          </h1>
          <p className="text-sm font-medium tracking-widest text-text-muted uppercase">
            CP Rivas Las Lagunas · Hockey en Directo
          </p>
        </div>

        <Link
          href="/login"
          className="btn-primary mt-4 px-8 py-4 text-sm font-display tracking-wider"
        >
          ENTRAR AL ESTUDIO
        </Link>
      </div>

      <div className="absolute bottom-6 left-0 right-0 z-10 text-center text-xs tracking-widest text-text-muted/60">
        TEMPORADA 2025-2026
      </div>
    </main>
  );
}
