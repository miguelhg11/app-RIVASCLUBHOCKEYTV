"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function BackButtonInterceptor() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Only intercept protected routes
    if (pathname === "/login" || pathname === "/forgot-password" || pathname === "/forgot-password/reset" || pathname === "/") {
      return;
    }

    if (pathname === "/dashboard") {
      // Main dashboard: Intercept back to show confirm exit dialog
      window.history.pushState({ preventExit: true }, "", window.location.href);

      const handlePopState = (event: PopStateEvent) => {
        const confirmExit = window.confirm("¿Seguro que quieres salir de la aplicación?");
        if (confirmExit) {
          window.location.href = "/login";
        } else {
          // Re-push state to keep the interceptor active
          window.history.pushState({ preventExit: true }, "", window.location.href);
        }
      };

      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    } else {
      // Rewrite history stack so the immediately preceding page is always /dashboard
      window.history.replaceState({ parent: true }, "", "/dashboard");
      window.history.pushState({ subpage: true }, "", window.location.href);

      const handlePopState = (event: PopStateEvent) => {
        router.push("/dashboard");
      };

      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [pathname, router]);

  return null;
}
