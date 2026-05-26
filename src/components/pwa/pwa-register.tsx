"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") return;

    let reloaded = false;

    void navigator.serviceWorker.register("/sw.js").then((registration) => {
      void registration.update();

      if (registration.waiting) {
        registration.waiting.postMessage("SKIP_WAITING");
      }

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            registration.waiting?.postMessage("SKIP_WAITING");
          }
        });
      });

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloaded) return;
        reloaded = true;
        window.location.reload();
      });
    }).catch((error) => {
      console.error("SW registration failed:", error);
    });
  }, []);

  return null;
}
