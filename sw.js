/* Agregados · Lote 18 — service worker
   A cada publicação, aumente VERSAO (e APP_VERSION no index.html) para os celulares receberem a atualização. */
const VERSAO = "1.3.0";
const CACHE = "agr18-app-" + VERSAO;
const FONTES = "agr18-fontes";
const ARQUIVOS = ["./", "index.html", "qrcode.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png"];
const FONTES_CSS = "https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";

// Guarda as fontes do Lote 18 já na instalação (só o conjunto "latin", que cobre o português).
// Se falhar (sem sinal), o app funciona com as fontes do celular e tenta de novo depois.
async function guardaFontes() {
  try {
    const c = await caches.open(FONTES);
    if (await c.match("fontes-ok")) return;
    const r = await fetch(FONTES_CSS, { mode: "cors" });
    if (!r.ok) return;
    const css = await r.clone().text();
    const urls = [];
    css.split("/*").forEach(bloco => {
      const nome = (bloco.match(/^\s*([a-z-]+)\s*\*\//) || [])[1];
      if (nome !== "latin") return;
      const u = (bloco.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/) || [])[1];
      if (u) urls.push(u);
    });
    const ok = await Promise.all(urls.map(async u => {
      if (await c.match(u)) return true;
      const f = await fetch(u, { mode: "cors" });
      if (f.ok) { await c.put(u, f); return true; }
      return false;
    }));
    if (ok.length && ok.every(Boolean)) { await c.put(FONTES_CSS, r); await c.put("fontes-ok", new Response(String(ok.length))); }
  } catch (e) {}
}

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(ARQUIVOS);
    await guardaFontes();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes.filter(n => n.startsWith("agr18-app-") && n !== CACHE).map(n => caches.delete(n)));
    await self.clients.claim();
    guardaFontes();
  })());
});

/* ===== fila de e-mail (mesmo banco IndexedDB do app: "agr18" / "fotos") ===== */
function bdAbre() {
  return new Promise((res, rej) => { const r = indexedDB.open("agr18", 1); r.onupgradeneeded = () => r.result.createObjectStore("fotos"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
async function bd(modo, fn) {
  const db = await bdAbre();
  return new Promise((res, rej) => { const t = db.transaction("fotos", modo); const q = fn(t.objectStore("fotos")); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); });
}
const bdGet = k => bd("readonly", s => s.get(k));
const bdSet = (k, v) => bd("readwrite", s => s.put(v, k));
const bdDel = k => bd("readwrite", s => s.delete(k));
const bdChaves = pre => bd("readonly", s => s.getAllKeys(IDBKeyRange.bound(pre, pre + "￿")));
async function base64(blob) {
  const u = new Uint8Array(await blob.arrayBuffer()); let s = "";
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(s);
}
let enviando = null;
function enviarPendentes() {
  if (enviando) return enviando;
  enviando = (async () => {
    let ok = 0, falha = 0;
    for (const k of await bdChaves("mail:")) {
      const m = await bdGet(k); if (!m || !m.url) continue;
      try {
        const img = await bdGet("img:" + m.id), fotos = (await bdGet("p:" + m.id)) || [];
        const corpo = JSON.stringify(Object.assign({}, m.dados, { imagem: img ? await base64(img) : "", fotos: await Promise.all(fotos.map(base64)) }));
        const r = await fetch(m.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: corpo, redirect: "follow" });
        const j = await r.json().catch(() => null);
        if (r.ok && j && j.ok) { await bdSet("mailok:" + m.id, Date.now()); await bdDel(k); ok++; }
        else { m.erro = (j && j.erro) || ("HTTP " + r.status); m.tentativas = (m.tentativas || 0) + 1; await bdSet(k, m); falha++; }
      } catch (err) { falha++; }
    }
    const pendentes = (await bdChaves("mail:")).length;
    (await self.clients.matchAll({ includeUncontrolled: true })).forEach(c => c.postMessage({ tipo: "email", ok, falha, pendentes }));
    return { ok, falha, pendentes };
  })().finally(() => { enviando = null; });
  return enviando;
}

self.addEventListener("sync", e => {
  if (e.tag === "agr18-email") e.waitUntil(enviarPendentes().then(r => { if (r.pendentes) throw new Error("e-mails pendentes"); }));
});

self.addEventListener("message", e => {
  if (e.data === "skipWaiting") self.skipWaiting();
  if (e.data === "fontes") e.waitUntil(guardaFontes());
  if (e.data === "email") e.waitUntil(enviarPendentes());
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // fontes do Google: usa a cópia guardada; sem cópia, busca e guarda
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(FONTES).then(async c => {
      const hit = await c.match(req.url);
      if (hit) return hit;
      try { const r = await fetch(req); if (r.ok || r.type === "opaque") c.put(req.url, r.clone()); return r; }
      catch (err) { return new Response("", { status: 504 }); }
    }));
    return;
  }

  if (url.origin !== self.location.origin) return;

  // abrir o app: sempre a versão guardada (abre na hora, com ou sem sinal)
  if (req.mode === "navigate") {
    e.respondWith(caches.open(CACHE).then(c => c.match("index.html")).then(hit => hit || fetch(req)));
    return;
  }

  // demais arquivos do app: cache primeiro, rede como reserva
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
});
