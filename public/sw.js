self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {
      try {
        return await fetch(event.request);
      } catch {
        const cached = await caches.match(event.request);
        if (cached) return cached;

        if (event.request.mode === "navigate") {
          return Response.redirect("/", 302);
        }

        return new Response("", { status: 204 });
      }
    })(),
  );
});
