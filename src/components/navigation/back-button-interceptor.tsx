"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

function getParentPath(pathname: string): string {
  // Level 4 -> Level 3
  if (pathname.startsWith("/admin/broadcasts/assign/")) {
    return "/admin/broadcasts";
  }

  // Level 3 -> Level 2 (Admin area)
  if (pathname.startsWith("/admin/") && pathname !== "/admin") {
    return "/admin";
  }

  // Level 3 -> Level 2 (Dashboard area)
  // Matches /dashboard/broadcasts/[id]/edit or [id]/success
  if (pathname.match(/^\/dashboard\/broadcasts\/[^/]+\/(edit|success)$/)) {
    return "/dashboard/broadcasts";
  }

  // Level 2 -> Level 1
  if (pathname === "/admin") {
    return "/dashboard";
  }
  if (pathname.startsWith("/dashboard/") && pathname !== "/dashboard") {
    return "/dashboard";
  }

  return "/dashboard";
}

export function BackButtonInterceptor() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Only intercept protected routes
    if (
      pathname === "/login" ||
      pathname === "/forgot-password" ||
      pathname === "/forgot-password/reset" ||
      pathname === "/"
    ) {
      return;
    }

    // Push a dummy state with the current URL so we can intercept popstate without changing the address bar URL
    window.history.pushState({ preventBack: pathname }, "", window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      if (pathname === "/dashboard") {
        // Main dashboard: Intercept back to show confirm exit dialog
        const confirmExit = window.confirm("¿Seguro que quieres salir de la aplicación?");
        if (confirmExit) {
          window.location.href = "/login";
        } else {
          // Re-push blocker state to keep the interceptor active
          window.history.pushState({ preventBack: pathname }, "", window.location.href);
        }
      } else {
        // Any subpage: Intercept back and navigate hierarchically up
        const parentPath = getParentPath(pathname);
        router.push(parentPath);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [pathname, router]);

  return null;
}
