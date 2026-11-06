(() => {
  const ST = (window.STORY = window.STORY || {});
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const games = window.SEASON.games;
  const byPk = Object.fromEntries(games.map(g => [g.pk, g]));
  const TEAM_JA = { 108: "エンゼルス", 109: "ダイヤモンドバックス", 110: "オリオールズ", 111: "レッドソックス", 112: "カブス", 113: "レッズ", 114: "ガーディアンズ", 115: "ロッキーズ", 116: "タイガース", 117: "アストロズ", 118: "ロイヤルズ", 119: "ドジャース", 120: "ナショナルズ", 121: "メッツ", 133: "アスレチックス", 134: "パイレーツ", 135: "パドレス", 136: "マリナーズ", 137: "ジャイアンツ", 138: "カージナルス", 139: "レイズ", 140: "レンジャーズ", 141: "ブルージェイズ", 142: "ツインズ", 143: "フィリーズ", 144: "ブレーブス", 146: "マーリンズ", 147: "ヤンキース", 158: "ブルワーズ" };
  const DOW = ["日", "月", "火", "水", "木", "金", "土"];
  const fdate = s => { const d = new Date(s + "T12:00:00"); return `${d.getMonth() + 1}月${d.getDate()}日(${DOW[d.getDay()]})`; };
  const N = 12;
  const pad = n => String(n).padStart(2, "0");

  function load(n) {
    if (ST[n]) return Promise.resolve(ST[n]);
    return new Promise((ok, ng) => {
      const sc = document.createElement("script");
      sc.src = `data/story/ch${pad(n)}.js?v=1`;
      sc.onload = () => ok(ST[n]);
      sc.onerror = ng;
      document.head.appendChild(sc);
    });
  }
  const readKey = "wsx-story-read";
  const getRead = () => { try { return JSON.parse(localStorage.getItem(readKey) || "{}"); } catch (e) { return {}; } };
  const markRead = n => { try { const r = getRead(); r[n] = 1; localStorage.setItem(readKey, JSON.stringify(r)); } catch (e) {} };

  function gameCard(pk) {
    const g = byPk[pk];
    if (!g) return "";
    const m = { ...((window.MOMENTS_AUTO || {})[pk] || {}), ...((window.MOMENTS_JA || {})[pk] || {}) };
    return `<a class="st-game" href="#/game/${pk}">
      ${g.img ? `<img src="${esc(g.img)}" alt="" loading="lazy">` : ""}
      <div><div class="muted" style="font-size:12px">${fdate(g.date)} · ${g.home ? "vs" : "@"} ${TEAM_JA[g.opp] || ""}</div>
      <div><b class="${g.win ? "w" : "l"}">${g.win ? "勝" : "負"}</b> <span class="num">${g.rs}-${g.ra}</span> ${esc(m.title || "")}</div>
      <div class="muted" style="font-size:12px">試合の振り返りを見る →</div></div></a>`;
  }
  function para(t) {
    const m = t.match(/^\[\[game:(\d+)\]\]$/);
    if (m) return gameCard(+m[1]);
    if (/^■/.test(t)) return `<h3 class="st-h">${esc(t.slice(1).trim())}</h3>`;
    if (/^＊+$|^\*\*\*$/.test(t.trim())) return `<div class="st-sep">＊</div>`;
    return `<p>${esc(t).replace(/\[\[game:(\d+)\|([^\]]+)\]\]/g, (_, pk, label) => `<a class="st-link" href="#/game/${pk}">${label}</a>`)}</p>`;
  }

  window.pageStory = async function pageStory(n) {
    const app = document.getElementById("app");
    if (n == null || isNaN(n)) {
      app.innerHTML = `<p class="muted">読み込み中…</p>`;
      const chs = await Promise.all([...Array(N).keys()].map(i => load(i).catch(() => null)));
      if (location.hash !== "#/story") return;
      const read = getRead();
      const cover = chs[1]?.imgPk && byPk[chs[1].imgPk]?.img;
      app.innerHTML = `<section class="hero st-cover"><img src="${esc(byPk[849846]?.img || cover || "")}" alt=""><div class="body">
          <div class="muted">ノンフィクション・ノベル</div>
          <h1 class="st-title">サウスサイドの夏<br><small>2026 シカゴ・ホワイトソックス物語</small></h1>
          <p style="margin:10px 0 0;max-width:640px">121敗から2年。日本から来た大砲、若き内野陣、そして毎晩レート・フィールドに通った人たち。開幕前の冬から、10月の最後の夜まで。</p>
          <a class="qnext" style="margin-top:14px" href="#/story/0">${Object.keys(read).length ? "続きから読む" : "最初から読む"}</a></div></section>
        <h2 class="sec">目次</h2>
        <div class="st-toc">${chs.map((c, i) => c ? `<a href="#/story/${i}" class="st-toc-item ${read[i] ? "read" : ""}">
            <div class="st-toc-img" style="background-image:url('${esc((byPk[c.imgPk] || {}).img || "")}')"></div>
            <div><div class="muted" style="font-size:12px">${esc(c.label)} · ${esc(c.period || "")}${read[i] ? " · 読了" : ""}</div>
            <div class="st-toc-t">${esc(c.title)}</div><div class="muted" style="font-size:13px">${esc(c.subtitle || "")}</div>
            ${c.record ? `<div class="chip" style="margin-top:6px">${esc(c.record)}</div>` : ""}</div></a>` : `<div class="st-toc-item muted">第${i}章（準備中）</div>`).join("")}</div>`;
      const cont = app.querySelector(".st-cover .qnext");
      const firstUnread = [...Array(N).keys()].find(i => !read[i]);
      if (cont && firstUnread != null) cont.href = `#/story/${firstUnread}`;
      return;
    }
    app.innerHTML = `<p class="muted">読み込み中…</p>`;
    let c;
    try { c = await load(n); } catch (e) { c = null; }
    if (location.hash !== `#/story/${n}`) return;
    if (!c) return (app.innerHTML = `<p>この章は準備中です。</p><a href="#/story">目次へ</a>`);
    const img = (byPk[c.imgPk] || {}).img;
    app.innerHTML = `<div class="st-progress"><i id="stbar"></i></div>
      <article class="st">
        ${img ? `<img class="st-hero" src="${esc(img)}" alt="">` : ""}
        <div class="muted st-label">${esc(c.label)} · ${esc(c.period || "")}</div>
        <h1 class="st-title">${esc(c.title)}</h1>
        ${c.subtitle ? `<p class="st-sub">${esc(c.subtitle)}</p>` : ""}
        ${c.record ? `<div class="chip" style="margin-bottom:18px">${esc(c.record)}</div>` : ""}
        <div class="st-body">${c.paras.map(para).join("")}</div>
        ${c.sources?.length ? `<details class="st-src"><summary>この章の出典（${c.sources.length}件）</summary><ul>${c.sources.map(u => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(u)}</a></li>`).join("")}</ul></details>` : ""}
        <div class="nav-games">
          ${n > 0 ? `<a class="panel" href="#/story/${n - 1}"><span class="muted">← 前の章</span><div>${esc(ST[n - 1]?.title || "")}</div></a>` : `<a class="panel" href="#/story"><span class="muted">← 目次</span></a>`}
          ${n < N - 1 ? `<a class="panel" style="text-align:right" href="#/story/${n + 1}"><span class="muted">次の章 →</span><div id="nextT"></div></a>` : `<a class="panel" style="text-align:right" href="#/story"><span class="muted">目次へ →</span></a>`}
        </div>
      </article>`;
    if (n < N - 1) load(n + 1).then(x => { const el = document.getElementById("nextT"); if (el && x) el.textContent = x.title; }).catch(() => {});
    const bar = document.getElementById("stbar");
    const onScroll = () => {
      if (!document.body.contains(bar)) return removeEventListener("scroll", onScroll);
      const h = document.documentElement.scrollHeight - innerHeight;
      const p = h > 0 ? scrollY / h : 1;
      bar.style.width = `${Math.min(100, p * 100)}%`;
      if (p > 0.92) markRead(n);
    };
    addEventListener("scroll", onScroll);
  };
})();
