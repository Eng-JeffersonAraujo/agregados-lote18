/* Agregados · Lote 18 — service worker
   A cada publicação, aumente VERSAO (e APP_VERSION no index.html) para os celulares receberem a atualização. */
const VERSAO = "1.1.0";
const CACHE = "agr18-app-" + VERSAO;
const FONTES = "agr18-fontes";
const ARQUIVOS = ["./", "index.html", "qrcode.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)));
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes.filter(n => n.startsWith("agr18-app-") && n !== CACHE).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", e => { if (e.data === "skipWaiting") self.skipWaiting(); });

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // fontes do Google: guarda a primeira cópia e usa sem rede depois
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(FONTES).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      try { const r = await fetch(req); if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }
      catch (err) { return new Response("", { status: 504 }); }
    }));
    return;
  }

  if (url.origin !== self.location.origin) return;

  // páginas: abre a versão guardada (funciona sem sinal)
  if (req.mode === "navigate") {
    e.respondWith(caches.match("index.html").then(hit => hit || fetch(req)));
    return;
  }

  // demais arquivos do app: cache primeiro, rede como reserva
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
});
