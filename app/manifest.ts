import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Rivas Hockey TV · Manager",
    short_name: "Rivas TV",
    description: "Gestor seguro de directos YouTube para CP Rivas Las Lagunas",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#08090d",
    theme_color: "#0c0d12",
    lang: "es",
    icons: [
      {
        src: "/imagenes/pwa-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/imagenes/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/imagenes/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
