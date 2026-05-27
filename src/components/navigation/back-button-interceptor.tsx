"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

function getParentPath(pathname: string): string {
  // Level 4 -> Level 3
  if (pathname.startsWith("/admin/broadcasts/assign/")) {
    return "/admin/broadcasts";
  }

  // Level 3 -> Level 2 (Admin sub-pages)
  if (pathname.startsWith("/admin/") && pathname !== "/admin") {
    return "/admin";
  }

  // Level 3 -> Level 2 (Dashboard: broadcast detail pages)
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

    // Push a dummy entry on top of the current stack so the browser
    // MUST fire a popstate event before it can navigate away.
    window.history.pushState({ preventBack: pathname }, "", window.location.href);

    const handlePopState = () => {
      if (pathname === "/dashboard") {
        // Root of the app: ask before exiting
        const confirmExit = window.confirm("¿Seguro que quieres salir de la aplicación?");
        if (confirmExit) {
          window.location.href = "/login";
        } else {
          // Re-insert blocker so the next back press also gets intercepted
          window.history.pushState({ preventBack: pathname }, "", window.location.href);
        }
      } else {
        // Subpage: push a FRESH blocker BEFORE navigating so the browser
        // never runs out of intercepted states while Next.js loads the parent.
        // This is the critical fix that prevents the app from exiting
        // during the React navigation transition.
        window.history.pushState({ preventBack: "transition" }, "", window.location.href);
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
