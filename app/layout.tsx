import type { Metadata, Viewport } from "next";
import { Inter, Rajdhani } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/src/components/pwa/pwa-register";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const rajdhani = Rajdhani({ weight: ["400", "600", "700"], subsets: ["latin"], variable: "--font-rajdhani" });

export const metadata: Metadata = {
  title: "Rivas Hockey TV · Manager",
  description: "Gestor seguro de directos YouTube para CP Rivas Las Lagunas",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Rivas TV",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0d12",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${rajdhani.variable}`}>
      <body className="font-sans antialiased">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
