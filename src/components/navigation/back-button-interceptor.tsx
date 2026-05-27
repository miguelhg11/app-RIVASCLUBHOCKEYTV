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
      window.history.pushState({ dashboard: true }, "", window.location.href);

      const handlePopState = (event: PopStateEvent) => {
        const confirmExit = window.confirm("¿Seguro que quieres salir de la aplicación?");
        if (confirmExit) {
          // If confirmed, navigate to /login which handles session cleaning
          router.push("/login");
        } else {
          // Re-push state to keep the interceptor active for the next back button click
          window.history.pushState({ dashboard: true }, "", window.location.href);
        }
      };

      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    } else {
      // Any subpage (e.g. /dashboard/new, /admin, etc.): Intercept back to go up to /dashboard
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
