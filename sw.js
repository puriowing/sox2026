const VERSION = "sox2026-v12";
const SHELL = [
"./",
"index.html",
"style.css",
"app.js",
"ja.js",
"quiz.js",
"story.js",
"manifest.webmanifest",
"icons/icon-192.png",
"icons/apple-touch-icon.png",
"data/moments_auto_part1.js",
"data/moments_auto_part2.js",
"data/moments_auto_part3.js",
"data/moments_auto_part4.js",
"data/moments_auto_part5.js",
"data/moments_auto_part6.js",
"data/moments_ja.js",
"data/names_ja.js",
"data/names_ja_more.js",
"data/names_ja_part1.js",
"data/names_ja_part2.js",
"data/names_ja_part3.js",
"data/news.js",
"data/players.js",
"data/season.js",
"data/titles_ja.js",
"data/titles_ja_part1.js",
"data/titles_ja_part2.js",
"data/titles_ja_part3.js",
"data/titles_ja_part4.js",
"data/story/ch00.js",
"data/story/ch01.js",
"data/story/ch02.js",
"data/story/ch03.js",
"data/story/ch04.js",
"data/story/ch05.js",
"data/story/ch06.js",
"data/story/ch07.js",
"data/story/ch08.js",
"data/story/ch09.js",
"data/story/ch10.js",
"data/story/ch11.js"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== "sox-media").map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (/\.mp4($|\?)/.test(url.pathname)) return;
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  if (/mlbstatic\.com|fonts\.(googleapis|gstatic)\.com/.test(url.host)) {
    e.respondWith(caches.open("sox-media").then(c => c.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok || res.type === "opaque") c.put(req, res.clone()); return res; }))));
  }
});
