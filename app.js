const S = window.SEASON;
const SOX = 145;
const $app = document.getElementById("app");
const games = S.games;
const reg = games.filter(g => g.type === "R");
const post = games.filter(g => g.type !== "R");
const GD = (window.GAME_DETAIL = window.GAME_DETAIL || {});
const FEATURED = new Set(Object.keys(window.MOMENTS_JA || {}).map(Number));
const mom = pk => {
  const a = (window.MOMENTS_AUTO || {})[pk], h = (window.MOMENTS_JA || {})[pk];
  return h || a ? { ...(a || {}), ...(h || {}), story: (a || {}).story } : null;
};
const byPk = Object.fromEntries(games.map(g => [g.pk, g]));
function loadGame(pk) {
  if (GD[pk]) return Promise.resolve(GD[pk]);
  return new Promise((ok, ng) => {
    const sc = document.createElement("script");
    sc.src = `data/games/${pk}.js`;
    sc.onload = () => ok(GD[pk]);
    sc.onerror = ng;
    document.head.appendChild(sc);
  });
}
const DOW = ["日", "月", "火", "水", "木", "金", "土"];
const SERIES_JA = { "AL Wild Card Series": "ワイルドカードシリーズ", "AL Division Series": "地区シリーズ", "AL Championship Series": "リーグ優勝決定シリーズ", "World Series": "ワールドシリーズ" };
const TEAM_JA = { 108: "エンゼルス", 109: "ダイヤモンドバックス", 110: "オリオールズ", 111: "レッドソックス", 112: "カブス", 113: "レッズ", 114: "ガーディアンズ", 115: "ロッキーズ", 116: "タイガース", 117: "アストロズ", 118: "ロイヤルズ", 119: "ドジャース", 120: "ナショナルズ", 121: "メッツ", 133: "アスレチックス", 134: "パイレーツ", 135: "パドレス", 136: "マリナーズ", 137: "ジャイアンツ", 138: "カージナルス", 139: "レイズ", 140: "レンジャーズ", 141: "ブルージェイズ", 142: "ツインズ", 143: "フィリーズ", 144: "ブレーブス", 145: "ホワイトソックス", 146: "マーリンズ", 147: "ヤンキース", 158: "ブルワーズ" };

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ja = (id, name) => (window.NAMES_JA || {})[id] || (window.NAMES_JA_MORE || {})[id] || name || "";
const tja = id => TEAM_JA[id] || S.teams[id]?.name || "";
const head = id => `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_120,q_auto:best/v1/people/${id}/headshot/67/current`;
const logo = id => `https://www.mlbstatic.com/team-logos/team-cap-on-dark/${id}.svg`;
const d8 = s => new Date(s + "T12:00:00");
const fdate = s => { const d = d8(s); return `${d.getMonth() + 1}月${d.getDate()}日(${DOW[d.getDay()]})`; };
const pct = (w, l) => (w + l ? (w / (w + l)).toFixed(3).replace(/^0/, "") : ".000");
const gbTxt = gb => (gb === "-" || gb === "0.0" ? "首位" : `${gb}差`);
const firstImg = pk => byPk[pk]?.img || "";

function rk(rank, val) {
  if (val === 0 || val === "0") return `<span class="rk">—</span>`;
  if (!rank) return `<span class="rk">規定未満</span>`;
  return `<span class="rk ${rank <= 10 ? "top" : ""}">リーグ${rank}位</span>`;
}
function plCell(id, name, sub) {
  return `<td class="pl"><img src="${head(id)}" loading="lazy" alt=""><a href="#/player/${id}"><div>${esc(ja(id, name))}</div><div class="en">${esc(name)}${sub ? " · " + esc(sub) : ""}</div></a></td>`;
}
function seriesStatus(g) {
  const same = post.filter(x => x.series === g.series && x.date <= g.date);
  const w = same.filter(x => x.win).length, l = same.length - w;
  return `${SERIES_JA[g.series] || g.series} 第${g.seriesGame}戦 · シリーズ${w}勝${l}敗`;
}
function gamesBefore(date) { return reg.filter(g => g.date < date).length; }
function gameLabel(g) {
  return g.type === "R" ? `第${g.no}戦` : `${SERIES_JA[g.series] || g.series} 第${g.seriesGame}戦`;
}

// ---------------- charts ----------------
function trendChart(cur) {
  const W = 1000, H = 220, P = 30;
  let v = 0;
  const pts = reg.map(g => (v += g.win ? 1 : -1));
  const max = Math.max(...pts, 5), min = Math.min(...pts, -5);
  const x = i => P + (i / (reg.length - 1)) * (W - P * 2);
  const y = val => P + ((max - val) / (max - min)) * (H - P * 2);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p).toFixed(1)}`).join("");
  const area = `${path}L${x(pts.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;
  const months = [];
  reg.forEach((g, i) => { const m = d8(g.date).getMonth(); if (!months.length || months[months.length - 1].m !== m) months.push({ m, i }); });
  const marks = reg.map((g, i) => (FEATURED.has(g.pk) ? `<circle cx="${x(i)}" cy="${y(pts[i])}" r="5" fill="var(--gold)" stroke="var(--bg)" stroke-width="2"/>` : "")).join("");
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;cursor:crosshair" id="trend">
    <defs><linearGradient id="ga" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#c4ced4" stop-opacity=".25"/><stop offset="1" stop-color="#c4ced4" stop-opacity="0"/></linearGradient></defs>
    ${months.map(o => `<line x1="${x(o.i)}" x2="${x(o.i)}" y1="${P}" y2="${H - P}" stroke="var(--line)"/><text x="${x(o.i) + 4}" y="${H - 10}" fill="var(--muted)" font-size="12">${o.m + 1}月</text>`).join("")}
    <line x1="${P}" x2="${W - P}" y1="${y(0)}" y2="${y(0)}" stroke="var(--muted)" stroke-dasharray="4 4"/>
    <text x="${W - P}" y="${y(0) - 6}" fill="var(--muted)" font-size="11" text-anchor="end">勝率5割</text>
    <path d="${area}" fill="url(#ga)"/><path d="${path}" fill="none" stroke="var(--silver)" stroke-width="2.2"/>
    ${marks}
    ${cur != null ? `<line x1="${x(cur)}" x2="${x(cur)}" y1="${P - 10}" y2="${H - P}" stroke="var(--text)" stroke-width="1.5"/><circle cx="${x(cur)}" cy="${y(pts[cur])}" r="6" fill="var(--text)"/>` : ""}
    <text x="${P}" y="${P - 10}" fill="var(--muted)" font-size="12">貯金 ${max > 0 ? "+" + max : max}</text>
  </svg>`;
}
function bindTrend(onPick) {
  const svg = document.getElementById("trend");
  if (!svg) return;
  svg.addEventListener("click", e => {
    const r = svg.getBoundingClientRect();
    const fx = ((e.clientX - r.left) / r.width) * 1000;
    const i = Math.round(((fx - 30) / 940) * (reg.length - 1));
    onPick(Math.max(0, Math.min(reg.length - 1, i)));
  });
}
function wpChart(d, soxHome) {
  const wp = d.wp;
  if (!wp.length) return `<p class="muted">データなし</p>`;
  const W = 1000, H = 240, P = 30;
  const x = i => P + (i / (wp.length - 1)) * (W - P * 2);
  const y = v => P + ((100 - v) / 100) * (H - P * 2);
  const vals = wp.map(p => (soxHome ? p.hwp : 100 - p.hwp));
  const path = vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const big = wp.map((p, k) => ({ ...p, k })).sort((a, b) => b.added - a.added).slice(0, 3).sort((a, b) => a.k - b.k);
  const inn = [];
  wp.forEach((p, i) => { if (p.h === "t" && (!inn.length || inn[inn.length - 1].n !== p.i)) inn.push({ n: p.i, i }); });
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">
    ${inn.map(o => `<line x1="${x(o.i)}" x2="${x(o.i)}" y1="${P}" y2="${H - P}" stroke="var(--line)"/><text x="${x(o.i) + 3}" y="${H - 10}" fill="var(--muted)" font-size="12">${o.n}回</text>`).join("")}
    <line x1="${P}" x2="${W - P}" y1="${y(50)}" y2="${y(50)}" stroke="var(--muted)" stroke-dasharray="4 4"/>
    <text x="${P}" y="${P - 10}" fill="var(--muted)" font-size="12">ホワイトソックスの勝利確率 100%</text>
    <path d="${path}" fill="none" stroke="var(--silver)" stroke-width="2.4"/>
    ${big.map((b, n) => `<circle cx="${x(b.k)}" cy="${y(vals[b.k])}" r="8" fill="var(--gold)"/><text x="${x(b.k)}" y="${y(vals[b.k]) + 4}" text-anchor="middle" font-size="11" fill="#000">${n + 1}</text>`).join("")}
  </svg>
  <ol class="muted" style="font-size:13px;margin:8px 0 0;padding-left:1.4em">${big.map(b => `<li>${b.i}回${b.h === "t" ? "表" : "裏"}（勝利確率 ±${b.added}%）: ${esc(translatePlay(b.d))}</li>`).join("")}</ol>`;
}

// ---------------- tables ----------------
function batTable(b) {
  return `<div class="tbl"><table><thead><tr><th>打者</th><th>試合</th><th>打席</th><th>打率</th><th>本塁打</th><th>打点</th><th>OPS</th><th>盗塁</th></tr></thead><tbody>
  ${b.map(p => `<tr>${plCell(p.id, p.name, posJa(p.pos))}<td>${p.gamesPlayed}</td><td>${p.plateAppearances}</td>
    <td>${p.avg}${rk(p.rank.avg)}</td><td>${p.homeRuns}${rk(p.rank.homeRuns, p.homeRuns)}</td><td>${p.rbi}${rk(p.rank.rbi, p.rbi)}</td>
    <td>${p.ops}${rk(p.rank.ops)}</td><td>${p.stolenBases}${rk(p.rank.stolenBases, p.stolenBases)}</td></tr>`).join("")}
  </tbody></table></div>`;
}
function pitTable(ps) {
  return `<div class="tbl"><table><thead><tr><th>先発投手</th><th>先発</th><th>投球回</th><th>勝敗</th><th>防御率</th><th>WHIP</th><th>奪三振</th></tr></thead><tbody>
  ${ps.map(p => `<tr>${plCell(p.id, p.name)}<td>${p.gamesStarted}</td><td>${p.inningsPitched}</td>
    <td>${p.wins}勝${p.losses}敗${rk(p.rank.wins, p.wins)}</td><td>${p.era}${rk(p.rank.era)}</td><td>${p.whip}${rk(p.rank.whip)}</td>
    <td>${p.strikeOuts}${rk(p.rank.strikeOuts, p.strikeOuts)}</td></tr>`).join("")}
  </tbody></table></div>`;
}
function teamTiles(t) {
  const lab = { avg: "打率", homeRuns: "本塁打", rbi: "打点", ops: "OPS", stolenBases: "盗塁", era: "防御率", whip: "WHIP", strikeOuts: "奪三振" };
  const tile = (k, o, pk) => `<div class="stat"><div class="k">${pk === "pit" && k === "avg" ? "被打率" : lab[k]}</div><div class="v">${o.v}</div><div class="s" style="${o.rank <= 3 ? "color:var(--gold)" : ""}">ア・リーグ ${o.rank}位 / ${o.of}球団</div></div>`;
  return `<h3 style="font-size:15px;margin:4px 0 10px">チーム打撃</h3><div class="grid g4">${Object.entries(t.hit).map(([k, o]) => tile(k, o, "hit")).join("")}</div>
  <h3 style="font-size:15px;margin:20px 0 10px">チーム投手</h3><div class="grid g4">${Object.entries(t.pit).map(([k, o]) => tile(k, o, "pit")).join("")}</div>`;
}
function divTable(div) {
  return `<div class="tbl"><table><thead><tr><th>ア・リーグ中地区</th><th>勝</th><th>敗</th><th>勝率</th><th>差</th></tr></thead><tbody>
  ${div.map((t, i) => `<tr class="${t.id === SOX ? "me" : ""}"><td>${i + 1}. ${tja(t.id)}</td><td>${t.w}</td><td>${t.l}</td><td>${t.pct}</td><td>${t.gb}</td></tr>`).join("")}</tbody></table></div>`;
}
function txList(list, withGames) {
  if (!list.length) return `<p class="muted">この期間の動きはありません。</p>`;
  let html = "", lastN = -1;
  for (const t of list) {
    const n = gamesBefore(t.date);
    if (withGames && n !== lastN) {
      html += `<div class="gm">${n === 0 ? "開幕前" : n >= reg.length ? "レギュラーシーズン終了後" : `第${n}戦終了後（${reg[n - 1].w}勝${reg[n - 1].l}敗）`}</div>`;
      lastN = n;
    }
    html += `<div class="it ${t.kind}"><div class="when">${fdate(t.date)}</div><b>${esc(ja(t.pid, t.name))}</b> <span class="chip">${t.label}</span><div class="muted" style="font-size:12px">${esc(txDetail(t, tja))}</div></div>`;
  }
  return `<div class="tl">${html}</div>`;
}

// ---------------- pages ----------------
function pageHome() {
  const last = reg[reg.length - 1];
  const finalSnap = { team: S.finalTeam };
  const rs = reg.reduce((a, g) => a + g.rs, 0), ra = reg.reduce((a, g) => a + g.ra, 0);
  let best = 0, c = 0; reg.forEach(g => { c = g.win ? c + 1 : 0; best = Math.max(best, c); });
  const heroImg = "https://img.mlbstatic.com/mlb-images/image/upload/w_1920,h_810,f_jpg,c_fill,g_auto/v1790389163/mlb/w8tp52rc6tvzqpxs4vm7.jpg";
  const months = {};
  reg.forEach(g => { const m = d8(g.date).getMonth() + 1; months[m] = months[m] || { w: 0, l: 0 }; g.win ? months[m].w++ : months[m].l++; });
  const series = {};
  post.forEach(g => (series[g.series] = series[g.series] || []).push(g));

  $app.innerHTML = `
  <section class="hero hero-top"><img src="${heroImg}" alt="ダッグアウトでチームメイトとハイタッチする村上宗隆"><div class="body">
    <span class="chip gold">3年連続100敗からのポストシーズン進出はMLB史上初</span> <span class="chip gold">2005年以来のシリーズ突破</span>
    <div class="big" style="margin-top:10px">${last.w}勝${last.l}敗</div>
    <h1 style="margin-top:6px">ア・リーグ中地区2位・ワイルドカードで5年ぶりのポストシーズンへ</h1>
    <p class="muted" style="margin:6px 0 0">ワイルドカードシリーズでアストロズに2連勝、地区シリーズはガーディアンズに2勝3敗で惜敗。</p>
  </div></section>

  <div class="grid g4" style="margin-top:14px">
    <div class="stat"><div class="k">勝率</div><div class="v">${pct(last.w, last.l)}</div><div class="s">MLB全体 ${last.mlbRank}位</div></div>
    <div class="stat"><div class="k">地区順位</div><div class="v">${last.divRank}位</div><div class="s">首位と${last.gb}ゲーム差</div></div>
    <div class="stat"><div class="k">得点 / 失点</div><div class="v">${rs} / ${ra}</div><div class="s">得失点差 ${rs - ra > 0 ? "+" : ""}${rs - ra}</div></div>
    <div class="stat"><div class="k">チーム本塁打</div><div class="v">${finalSnap ? finalSnap.team.hit.homeRuns.v : "-"}</div><div class="s">ア・リーグ ${finalSnap ? finalSnap.team.hit.homeRuns.rank : "-"}位</div></div>
    <div class="stat"><div class="k">最長連勝</div><div class="v">${best}</div><div class="s">連勝</div></div>
  </div>

  <h2 class="sec">シーズンをさかのぼる <small>スライダーを動かすか、グラフをクリック。金色の点は名場面に選んだ試合</small></h2>
  <div class="slider">
    <div id="trendBox"></div>
    <input type="range" min="1" max="${reg.length}" value="${reg.length}" id="slide">
    <div id="slideInfo"></div>
  </div>

  <h2 class="sec">ポストシーズン</h2>
  <div class="grid g2">${Object.entries(series).map(([name, gs]) => {
    const w = gs.filter(g => g.win).length, l = gs.length - w;
    return `<div class="panel"><div style="display:flex;justify-content:space-between;align-items:center"><h3>${SERIES_JA[name] || name}</h3><span class="chip ${w > l ? "w" : "l"}">${w}勝${l}敗 ${w > l ? "突破" : "敗退"}</span></div>
      <p class="muted" style="margin:4px 0 10px">対 ${tja(gs[0].opp)}</p>
      ${gs.map(g => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid var(--line)"><span>第${g.seriesGame}戦 ${fdate(g.date)} ${g.home ? "ホーム" : "敵地"}</span><span><b class="${g.win ? "w" : "l"}">${g.win ? "勝" : "負"}</b> <span class="num">${g.rs}-${g.ra}</span> <a href="#/game/${g.pk}" class="chip gold">振り返る</a></span></div>`).join("")}
    </div>`;
  }).join("")}</div>

  <h2 class="sec">名場面で振り返る</h2>
  <div class="grid g3">${games.filter(g => FEATURED.has(g.pk)).map(gameCard).join("")}</div>

  <h2 class="sec">月別成績</h2>
  <div class="panel tbl"><table><thead><tr><th>月</th><th>勝</th><th>敗</th><th>勝率</th><th></th></tr></thead><tbody>
    ${Object.entries(months).map(([m, o]) => `<tr><td>${m}月</td><td>${o.w}</td><td>${o.l}</td><td>${pct(o.w, o.l)}</td><td style="width:45%"><div style="display:flex;height:10px;border-radius:5px;overflow:hidden"><div style="background:var(--win);width:${(o.w / (o.w + o.l)) * 100}%"></div><div style="background:var(--loss);flex:1"></div></div></td></tr>`).join("")}
  </tbody></table></div>

  ${finalSnap ? `<h2 class="sec">チーム最終成績 <small>レギュラーシーズン終了時点</small></h2><div class="panel">${teamTiles(finalSnap.team)}</div>` : ""}
  `;

  const slide = document.getElementById("slide");
  const draw = n => {
    const g = reg[n - 1];
    document.getElementById("trendBox").innerHTML = trendChart(n - 1);
    bindTrend(i => { slide.value = i + 1; draw(i + 1); });
    const moves = S.transactions.filter(t => t.date <= g.date && t.date > (reg[n - 2]?.date || "2026-03-01"));
    document.getElementById("slideInfo").innerHTML = `
      <div class="row" style="margin-top:10px">
        <div><span class="muted">${fdate(g.date)} · 第${g.no}戦 · ${g.home ? "vs" : "@"} ${tja(g.opp)}</span>
          <div style="font-size:20px;margin-top:2px"><b class="${g.win ? "w" : "l"}">${g.win ? "勝" : "負"}</b> <span class="num">${g.rs}-${g.ra}</span>${g.innings > 9 ? ` <span class="chip">延長${g.innings}回</span>` : ""}
          ${g.wp ? `<span class="muted" style="font-size:13px"> 勝:${esc(ja(g.wpId, g.wp))} 敗:${esc(ja(g.lpId, g.lp))}${g.sv ? " S:" + esc(ja(g.svId, g.sv)) : ""}</span>` : ""}</div></div>
        <a class="chip gold" href="#/game/${g.pk}">この試合を振り返る →</a>
      </div>
      <div class="grid g4" style="margin-top:12px">
        <div class="stat"><div class="k">この時点の成績</div><div class="v">${g.w}勝${g.l}敗</div><div class="s">勝率 ${pct(g.w, g.l)}</div></div>
        <div class="stat"><div class="k">ア・リーグ中地区</div><div class="v">${g.divRank}位</div><div class="s">${gbTxt(g.gb)}</div></div>
        <div class="stat"><div class="k">MLB全体</div><div class="v">${g.mlbRank}位</div><div class="s">/ 30球団</div></div>
        <div class="stat"><div class="k">連勝・連敗</div><div class="v">${(g.streak || "").replace("W", "") }${g.streak?.startsWith("W") ? "連勝" : "連敗"}</div><div class="s">ワイルドカード ${g.wcGb && g.wcGb !== "-" ? g.wcGb + "差" : "圏内"}</div></div>
      </div>
      ${moves.length ? `<div style="margin-top:12px;font-size:13px"><span class="muted">前の試合からの選手の動き：</span>${moves.map(t => `<span class="chip" style="margin:2px">${t.kind === "in" || t.kind === "back" ? "IN" : "OUT"} ${esc(ja(t.pid, t.name))}（${t.label}）</span>`).join("")}</div>` : ""}`;
  };
  slide.addEventListener("input", () => draw(+slide.value));
  draw(reg.length);
}

function gameCard(g) {
  const m = mom(g.pk) || {};
  return `<a class="gcard" href="#/game/${g.pk}"><div class="img" style="background-image:url('${firstImg(g.pk) || ""}')"><span class="chip">${m.tag || gameLabel(g)}</span></div>
    <div class="b"><div class="muted" style="font-size:12px">${fdate(g.date)} · ${gameLabel(g)}</div>
    <div class="sc"><b class="${g.win ? "w" : "l"}">${g.win ? "勝" : "負"}</b> ${g.rs}-${g.ra} <span style="font-size:15px">${g.home ? "vs" : "@"} ${tja(g.opp)}</span></div>
    <h3>${esc(m.title || "")}</h3></div></a>`;
}

function pageGames(view = "cal") {
  const months = {};
  games.forEach(g => { const k = g.date.slice(0, 7); (months[k] = months[k] || []).push(g); });
  const cal = Object.entries(months).map(([k, gs]) => {
    const [y, m] = k.split("-").map(Number);
    const first = new Date(y, m - 1, 1).getDay(), days = new Date(y, m, 0).getDate();
    const byDay = {}; gs.forEach(g => (byDay[+g.date.slice(8)] = byDay[+g.date.slice(8)] || []).push(g));
    const w = gs.filter(g => g.type === "R" && g.win).length, l = gs.filter(g => g.type === "R" && !g.win).length;
    let cells = DOW.map(d => `<div class="dow">${d}</div>`).join("") + Array(first).fill(`<div class="d empty"></div>`).join("");
    for (let d = 1; d <= days; d++) {
      const g = (byDay[d] || [])[0];
      cells += g ? `<div class="d g ${g.win ? "win" : "loss"} ${g.type !== "R" ? "post" : ""}" data-pk="${g.pk}"><span class="dn">${d}</span>${FEATURED.has(g.pk) ? `<span class="star">★</span>` : ""}
        <div class="opp"><span>${g.home ? "vs" : "@"}</span><img src="${logo(g.opp)}" alt="${esc(tja(g.opp))}" title="${esc(tja(g.opp))}"></div><div class="s ${g.win ? "w" : "l"}">${g.rs}-${g.ra}</div></div>` : `<div class="d"><span class="dn">${d}</span></div>`;
    }
    return `<div class="month"><h3>${m}月 <span class="muted" style="font-weight:400;font-size:13px">${w + l ? `${w}勝${l}敗` : ""}</span></h3><div class="cal">${cells}</div></div>`;
  }).join("");
  const list = `<div class="panel tbl"><table><thead><tr><th>試合</th><th>日付</th><th>相手</th><th>スコア</th><th>成績</th><th>地区</th><th>勝利投手</th><th>敗戦投手</th><th>セーブ</th><th style="text-align:left">振り返り</th></tr></thead><tbody>
    ${games.map(g => `<tr><td>${g.type === "R" ? g.no : (SERIES_JA[g.series] || "").replace("シリーズ", "") + g.seriesGame}</td><td>${fdate(g.date)}</td><td><span class="optm"><span class="muted">${g.home ? "vs" : "@"}</span><img src="${logo(g.opp)}" alt="">${tja(g.opp)}</span></td>
      <td><b class="${g.win ? "w" : "l"}">${g.win ? "勝" : "負"}</b> ${g.rs}-${g.ra}${g.innings > 9 ? `<span class="muted">(${g.innings}回)</span>` : ""}</td>
      <td>${g.w != null ? `${g.w}-${g.l}` : ""}</td><td>${g.divRank ? g.divRank + "位" : ""}</td>
      <td>${esc(ja(g.wpId, g.wp))}</td><td>${esc(ja(g.lpId, g.lp))}</td><td>${esc(ja(g.svId, g.sv))}</td>
      <td style="white-space:normal;min-width:220px;text-align:left"><a href="#/game/${g.pk}" style="text-decoration:underline">${esc((mom(g.pk) || {}).title || "振り返る")}</a></td></tr>`).join("")}
  </tbody></table></div>`;
  $app.innerHTML = `<h2 class="sec" style="margin-top:0">全${games.length}試合 <small>日付をクリックすると、その試合の振り返りへ。★は名場面に選んだ試合</small></h2>
    <div class="tabs"><button data-v="cal" class="${view === "cal" ? "on" : ""}">カレンダー</button><button data-v="list" class="${view === "list" ? "on" : ""}">リスト</button></div>
    <div class="legend" style="margin-bottom:12px"><span><i style="background:var(--win)"></i>勝ち</span><span><i style="background:var(--loss)"></i>負け</span><span><i style="background:var(--gold)"></i>ポストシーズン</span></div>
    ${view === "cal" ? cal : list}`;
  $app.querySelectorAll(".tabs button").forEach(b => b.onclick = () => pageGames(b.dataset.v));
  $app.querySelectorAll(".cal .d.g").forEach(el => el.onclick = () => (location.hash = `#/game/${el.dataset.pk}`));
}
function autoMoments(g, d) {
  const soxHome = d.home.id === SOX, sox = soxHome ? "home" : "away";
  const opp = tja(g.opp);
  const mine = sp => (sp.half === "top") === !soxHome;
  const sp0 = d.box[sox].pit[0];
  const soxPlays = d.scoring.filter(mine);
  const lastPlay = d.scoring[d.scoring.length - 1];
  const walkoff = g.win && soxHome && lastPlay && lastPlay.half === "bottom" && lastPlay.inning >= 9 && mine(lastPlay);
  const hrs = soxPlays.map(sp => ({ sp, m: sp.desc.match(/^(.+?) (?:homers|hits a grand slam) \((\d+)\)/) })).filter(x => x.m);
  const hitters = [...d.box[sox].bat].sort((a, b) => (b.hr * 4 + b.rbi * 2 + b.h) - (a.hr * 4 + a.rbi * 2 + a.h));
  const star = hitters[0];
  const sn = (id, n) => { const j = ja(id, n); return /^[一-龯]/.test(j) ? j.slice(0, 2) : j.split("・").pop(); };
  let title, tag;
  if (walkoff) { title = `${sn(lastPlay.batterId, lastPlay.batter)}のサヨナラ${/homers|grand slam/.test(lastPlay.desc) ? "本塁打" : "打"}で${opp}に勝利`; tag = "サヨナラ"; }
  else if (g.win && g.ra === 0) { title = `${sn(sp0.id, sp0.name)}ら投手陣が${opp}を完封`; tag = "完封勝ち"; }
  else if (g.win && g.rs - g.ra >= 7) { title = `${g.rs}得点の猛攻で${opp}に大勝`; tag = "大勝"; }
  else if (g.win && g.innings > 9) { title = `延長${g.innings}回の接戦を制し${opp}に勝利`; tag = "延長戦"; }
  else if (g.win) { title = `${sn(star.id, star.name)}の活躍で${opp}に${g.rs}-${g.ra}で勝利`; tag = "勝利"; }
  else if (g.rs === 0) { title = `${opp}投手陣に抑えられ完封負け`; tag = "完封負け"; }
  else if (g.ra - g.rs >= 7) { title = `${opp}に${g.rs}-${g.ra}で大敗`; tag = "敗戦"; }
  else if (g.ra - g.rs === 1) { title = `${opp}に1点差で惜敗`; tag = "惜敗"; }
  else { title = `${opp}に${g.rs}-${g.ra}で敗戦`; tag = "敗戦"; }
  if (g.type !== "R") tag = `${(SERIES_JA[g.series] || "").replace("シリーズ", "")}第${g.seriesGame}戦`;
  const points = [];
  if (sp0) points.push(`先発の${ja(sp0.id, sp0.name)}は${sp0.ip}回${sp0.er}失点・${sp0.so}奪三振${/\((W|L),/.test(sp0.note) ? (/\(W,/.test(sp0.note) ? "で勝利投手に" : "で敗戦投手に") : ""}。`);
  if (hrs.length) points.push(`本塁打：${hrs.map(({ sp, m }) => `${sn(sp.batterId, sp.batter)}（${m[2]}号・${sp.inning}回）`).join("、")}。`);
  const big = d.wp.map(p => p).sort((a, b) => b.added - a.added)[0];
  if (big && big.added >= 15) points.push(`試合の分かれ目は${big.i}回${big.h === "t" ? "表" : "裏"}。${translatePlay(big.d)}`);
  if (star && (star.h >= 2 || star.rbi >= 2)) points.push(`${ja(star.id, star.name)}が${star.ab}打数${star.h}安打${star.hr ? `・${star.hr}本塁打` : ""}${star.rbi ? `・${star.rbi}打点` : ""}。`);
  if (g.type === "R") points.push(`この試合で${g.w}勝${g.l}敗、地区${g.divRank}位（${gbTxt(g.gb)}）。`);
  return { title, tag, points };
}

async function pageGame(pk) {
  const g = byPk[pk];
  if (!g) return ($app.innerHTML = `<p>試合が見つかりません。</p>`);
  $app.innerHTML = `<p class="muted">読み込み中…</p>`;
  let d;
  try { d = await loadGame(pk); } catch (e) { d = null; }
  if (!d) return ($app.innerHTML = `<p>この試合のデータを読み込めませんでした。</p>`);
  if (location.hash !== `#/game/${pk}`) return;
  const m = mom(pk) || autoMoments(g, d);
  const soxHome = d.home.id === SOX;
  const sox = soxHome ? "home" : "away";
  const hl = [...d.highlights].sort((a, b) => (b.sox - a.sox) || (a.condensed - b.condensed));
  const snap = d.snapshot;
  const prevGame = games[games.indexOf(g) - 1];
  const moves = S.transactions.filter(t => t.date <= g.date && t.date > (prevGame?.date || "2026-02-01"));
  const gi = games.indexOf(g);
  const navTitle = x => esc((mom(x.pk) || {}).title || `${x.win ? "勝" : "負"} ${x.rs}-${x.ra} ${x.home ? "vs" : "@"} ${tja(x.opp)}`);
  const decision = (k, lab) => d.decisions[k] ? `<span class="chip ${k === "winner" ? "w" : k === "loser" ? "l" : "gold"}">${lab} ${esc(ja(d.decisions[k].id, d.decisions[k].name))}</span>` : "";
  const status = g.type === "R"
    ? `この試合終了時点：<b>${g.w}勝${g.l}敗</b>（勝率${pct(g.w, g.l)}）· ア・リーグ中地区<b>${g.divRank}位</b>（${gbTxt(g.gb)}）· MLB全体<b>${g.mlbRank}位</b>`
    : `${seriesStatus(g)}`;

  $app.innerHTML = `
  <section class="hero" style="min-height:300px"><img src="${firstImg(pk) || ""}" alt=""><div class="body">
    <div class="muted">${fdate(g.date)} · ${gameLabel(g)} · ${esc(venueJa(d.venue))}${d.info?.attendance ? ` · 観客${d.info.attendance.toLocaleString()}人` : ""}</div>
    <h1 style="margin-top:4px">${esc(m.title || "")}</h1>
  </div></section>

  <div class="panel score-hero" style="margin-top:14px">
    <div class="teams">
      <div class="team"><img src="${logo(d.away.id)}" alt=""><div><div class="runs">${d.totals.away.runs}</div><div class="n">${tja(d.away.id)}</div></div></div>
      <div class="muted" style="font-size:24px">-</div>
      <div class="team"><img src="${logo(d.home.id)}" alt=""><div><div class="runs">${d.totals.home.runs}</div><div class="n">${tja(d.home.id)}</div></div></div>
      <div style="flex:1;min-width:280px" class="tbl"><table class="linescore"><thead><tr><th></th>${d.line.map(i => `<th>${i.n}</th>`).join("")}<th>R</th><th>H</th><th>E</th></tr></thead><tbody>
        ${["away", "home"].map(s => `<tr class="${s === sox ? "me" : ""}"><td>${d[s].abbr}</td>${d.line.map(i => `<td>${i[s[0]] ?? "x"}</td>`).join("")}<td><b>${d.totals[s].runs}</b></td><td>${d.totals[s].hits}</td><td>${d.totals[s].errors}</td></tr>`).join("")}
      </tbody></table></div>
    </div>
    <div class="dec">${decision("winner", "勝")}${decision("loser", "敗")}${decision("save", "S")}</div>
    <p style="margin:12px 0 0">${status}</p>
  </div>

  <div class="grid g2" style="margin-top:14px">
    <div class="panel moments">${m.story ? `<h3>試合の振り返り</h3><p class="story">${esc(m.story)}</p>` : ""}<h3${m.story ? ' style="margin-top:16px"' : ""}>この試合のモーメント</h3><ol>${(m.points || []).map(p => `<li>${esc(p)}</li>`).join("")}</ol>
      <h3 style="margin-top:16px;font-size:14px" class="muted">活躍した選手</h3>
      <div style="display:grid;gap:8px;margin-top:8px">${d.top.map(t => `<div style="display:flex;gap:10px;align-items:center"><img src="${head(t.id)}" style="width:38px;height:38px;border-radius:50%" alt=""><div><b>${esc(ja(t.id, t.name))}</b> ${[...d.box[sox].bat, ...d.box[sox].pit].some(x => x.id === t.id) ? `<span class="chip">ホワイトソックス</span>` : `<span class="chip">相手</span>`}<div class="muted" style="font-size:12px">${esc(summaryJa(t.summary))}</div></div></div>`).join("")}</div>
    </div>
    <div class="panel"><h3>勝利確率の推移</h3>${wpChart(d, soxHome)}</div>
  </div>

  <h2 class="sec">ハイライト動画 <small>${hl.length}本</small></h2>
  <div class="grid" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr)" id="vwrap">
    <div><video id="vid" controls playsinline poster="${hl[0]?.img || ""}" src="${hl[0]?.mp4 || ""}"></video><p id="vtitle" style="margin:8px 0 0">${esc(titleJa(hl[0]?.title))}</p></div>
    <div class="vlist">${hl.map((h, i) => `<div class="vitem ${i ? "" : "on"}" data-i="${i}"><img src="${h.img}" loading="lazy" alt=""><div class="t">${esc(titleJa(h.title))}<small>${h.dur ? h.dur.replace(/^00:/, "") : ""}${h.condensed ? " · ダイジェスト" : ""}</small></div></div>`).join("")}</div>
  </div>

  <h2 class="sec">得点経過</h2>
  <div class="panel"><ul class="plays">${d.scoring.map(sp => {
    const mine = (sp.half === "top") === !soxHome;
    return `<li class="${mine ? "sox" : "opp"}"><span>${sp.inning}回${sp.half === "top" ? "表" : "裏"}</span><span class="num">${sp.away}-${sp.home}</span><span>${mine ? "🟢 " : ""}${esc(translatePlay(sp.desc))}</span></li>`;
  }).join("")}</ul></div>

  <h2 class="sec">${d.snapshotFinal ? "レギュラーシーズン最終成績" : "この試合終了時点の成績"} <small>順位はア・リーグ内。打率・OPS・防御率・WHIPは規定到達者のみ</small></h2>
  <div class="tabs" id="snapTabs"><button data-t="std" class="on">順位</button><button data-t="bat">打者</button><button data-t="pit">先発投手</button><button data-t="team">チーム成績</button></div>
  <div class="panel" id="snapBody"></div>

  <h2 class="sec">ボックススコア（ホワイトソックス）</h2>
  <div class="grid g2">
    <div class="panel tbl"><table><thead><tr><th>打者</th><th>打数</th><th>得点</th><th>安打</th><th>打点</th><th>本塁打</th><th>四球</th><th>三振</th></tr></thead><tbody>
      ${d.box[sox].bat.map(b => `<tr>${plCell(b.id, b.name, posJa(b.pos))}<td>${b.ab}</td><td>${b.r}</td><td>${b.h}</td><td>${b.rbi}</td><td>${b.hr}</td><td>${b.bb}</td><td>${b.so}</td></tr>`).join("")}
    </tbody></table></div>
    <div class="panel tbl"><table><thead><tr><th>投手</th><th>回</th><th>安</th><th>失</th><th>自責</th><th>四球</th><th>三振</th><th>球数</th></tr></thead><tbody>
      ${d.box[sox].pit.map(p => `<tr>${plCell(p.id, p.name, noteJa(p.note))}<td>${p.ip}</td><td>${p.h}</td><td>${p.r}</td><td>${p.er}</td><td>${p.bb}</td><td>${p.so}</td><td>${p.np}</td></tr>`).join("")}
    </tbody></table></div>
  </div>

  <h2 class="sec">フォトギャラリー</h2>
  <div class="gallery">${hl.filter(h => h.img).map(h => `<img src="${h.img}" alt="${esc(titleJa(h.title))}" title="${esc(titleJa(h.title))}" loading="lazy">`).join("")}</div>

  <h2 class="sec">前の試合からの選手の動き</h2>
  <div class="panel">${txList(moves, false)}</div>

  <div class="nav-games">
    ${gi > 0 ? `<a class="panel" href="#/game/${games[gi - 1].pk}"><span class="muted">← 前の試合</span><div>${fdate(games[gi - 1].date)} ${navTitle(games[gi - 1])}</div></a>` : "<span></span>"}
    ${gi < games.length - 1 ? `<a class="panel" style="text-align:right" href="#/game/${games[gi + 1].pk}"><span class="muted">次の試合 →</span><div>${fdate(games[gi + 1].date)} ${navTitle(games[gi + 1])}</div></a>` : "<span></span>"}
  </div>`;

  const vid = document.getElementById("vid");
  $app.querySelectorAll(".vitem").forEach(el => el.onclick = () => {
    const h = hl[+el.dataset.i];
    vid.src = h.mp4; vid.poster = h.img; vid.play();
    document.getElementById("vtitle").textContent = titleJa(h.title);
    $app.querySelectorAll(".vitem").forEach(x => x.classList.toggle("on", x === el));
  });
  $app.querySelectorAll(".gallery img").forEach(img => img.onclick = () => {
    const lb = document.createElement("div"); lb.className = "lightbox";
    lb.innerHTML = `<img src="${img.src.replace(/w_\d+,h_\d+/, "w_1920,h_1080")}">`;
    lb.onclick = () => lb.remove(); document.body.appendChild(lb);
  });
  const body = document.getElementById("snapBody");
  const tab = t => {
    $app.querySelectorAll("#snapTabs button").forEach(b => b.classList.toggle("on", b.dataset.t === t));
    body.innerHTML = t === "std" ? `${divTable(snap.division)}<p class="muted" style="margin:10px 0 0;font-size:13px">${g.type === "R" ? `MLB全体 ${g.mlbRank}位 · ア・リーグ ${g.alRank}位 · ワイルドカード ${g.wcGb && g.wcGb !== "-" ? g.wcGb + "ゲーム差" : "圏内"}` : "レギュラーシーズン最終順位"}</p>`
      : t === "bat" ? batTable(snap.batters) : t === "pit" ? pitTable(snap.starters) : teamTiles(snap.team);
  };
  $app.querySelectorAll("#snapTabs button").forEach(b => b.onclick = () => tab(b.dataset.t));
  tab("std");
  if (innerWidth < 760) document.getElementById("vwrap").style.gridTemplateColumns = "1fr";
}

async function pagePlayers(no) {
  no = no || reg.length;
  const g = reg[no - 1];
  $app.innerHTML = `<p class="muted">読み込み中…</p>`;
  const snap = (await loadGame(g.pk)).snapshot;
  if (!location.hash.startsWith("#/players")) return;
  $app.innerHTML = `<h2 class="sec" style="margin-top:0">選手成績 <small>時点を選ぶと、その試合終了時点の成績とア・リーグ内順位に切り替わります</small></h2>
    <div class="slider"><div class="row"><b>第${g.no}戦終了時点（${fdate(g.date)}）</b><span class="muted">${g.w}勝${g.l}敗 · 規定打席 ${Math.ceil(snap.teamGames * 3.1)} / 規定投球回 ${snap.teamGames}</span></div>
      <input type="range" min="1" max="${reg.length}" value="${no}" id="pslide">
      <div class="tabs" style="margin:6px 0 0">${[["開幕10戦", 10], ["4月末", reg.filter(x => x.date <= "2026-04-30").length], ["前半戦終了", reg.filter(x => x.date <= "2026-07-12").length], ["8月末", reg.filter(x => x.date <= "2026-08-31").length], ["最終", reg.length]].map(([l, n]) => `<button data-n="${n}" class="${n === no ? "on" : ""}">${l}</button>`).join("")}</div></div>
    <h2 class="sec">打者</h2><div class="panel">${batTable(snap.batters)}</div>
    <h2 class="sec">先発投手</h2><div class="panel">${pitTable(snap.starters)}</div>
    <h2 class="sec">チーム成績</h2><div class="panel">${teamTiles(snap.team)}</div>`;
  const sl = document.getElementById("pslide");
  sl.onchange = () => pagePlayers(+sl.value);
  $app.querySelectorAll(".tabs button").forEach(b => b.onclick = () => pagePlayers(+b.dataset.n));
}

function trendLine(rows, idx, label, lowerBetter) {
  if (rows.length < 2) return "";
  const W = 1000, H = 200, P = 30;
  const vals = rows.map(r => +r[idx]);
  const max = Math.max(...vals), min = Math.min(...vals, 0);
  const x = n => P + ((n - 1) / (reg.length - 1)) * (W - P * 2);
  const y = v => P + ((max - v) / ((max - min) || 1)) * (H - P * 2);
  const path = rows.map((r, i) => `${i ? "L" : "M"}${x(r[0]).toFixed(1)},${y(vals[i]).toFixed(1)}`).join("");
  const months = [];
  reg.forEach(g => { const m = d8(g.date).getMonth(); if (!months.length || months[months.length - 1].m !== m) months.push({ m, n: g.no }); });
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">
    ${months.map(o => `<line x1="${x(o.n)}" x2="${x(o.n)}" y1="${P}" y2="${H - P}" stroke="var(--line)"/><text x="${x(o.n) + 4}" y="${H - 10}" fill="var(--muted)" font-size="12">${o.m + 1}月</text>`).join("")}
    <path d="${path}" fill="none" stroke="var(--silver)" stroke-width="2.4"/>
    <text x="${P}" y="${P - 10}" fill="var(--muted)" font-size="12">${label}（最大 ${rows[vals.indexOf(max)][idx]}）</text>
  </svg>`;
}

const BAT_KEYS = [["打率", 1, 7], ["本塁打", 2, 8], ["打点", 3, 9], ["OPS", 4, 10], ["盗塁", 5, 11]];
const PIT_KEYS = [["勝利", 1, 7], ["防御率", 3, 8], ["WHIP", 4, 9], ["奪三振", 5, 10]];
function playerTrend(pl, kind, el, sel = 0) {
  const keys = kind === "bat" ? BAT_KEYS : PIT_KEYS, rows = pl[kind];
  const [lab, vi] = keys[sel];
  const monthEnd = rows.filter((r, i) => i === rows.length - 1 || reg[rows[i + 1][0] - 1].date.slice(5, 7) !== reg[r[0] - 1].date.slice(5, 7));
  el.innerHTML = `<div class="tabs">${keys.map(([l], i) => `<button data-i="${i}" class="${i === sel ? "on" : ""}">${l}</button>`).join("")}</div>
    ${trendLine(rows, vi, lab)}
    <div class="tbl"><table><thead><tr><th>時点</th>${kind === "bat" ? "<th>打席</th>" : "<th>先発</th><th>投球回</th>"}${keys.map(([l]) => `<th>${l}</th>`).join("")}</tr></thead><tbody>
    ${monthEnd.map(r => { const g = reg[r[0] - 1]; return `<tr><td>${d8(g.date).getMonth() + 1}月末（第${g.no}戦）</td>${kind === "bat" ? `<td>${r[6]}</td>` : `<td>${r[11]}</td><td>${r[6]}</td>`}${keys.map(([, v, ri]) => `<td>${kind === "pit" && v === 1 ? `${r[1]}勝${r[2]}敗` : r[v]}${rk(r[ri], r[v])}</td>`).join("")}</tr>`; }).join("")}</tbody></table></div>`;
  el.querySelectorAll(".tabs button").forEach(b => b.onclick = () => playerTrend(pl, kind, el, +b.dataset.i));
}

function pagePlayer(id) {
  const pl = (window.PLAYERS || {})[id];
  const name = pl?.name || S.people[id] || S.transactions.find(t => t.pid === id)?.name || "";
  const moves = S.transactions.filter(t => t.pid === id);
  const last = r => r[r.length - 1];
  $app.innerHTML = `<div class="panel" style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">
      <img src="${head(id).replace("w_120", "w_240")}" style="width:110px;height:110px;border-radius:50%;object-fit:cover;background:var(--panel2)" alt="">
      <div><h1>${esc(ja(id, name))}</h1><div class="muted">${esc(name)}</div>
      ${pl?.bat.length ? `<div style="margin-top:6px">打率${last(pl.bat)[1]} · ${last(pl.bat)[2]}本塁打 · ${last(pl.bat)[3]}打点 · OPS ${last(pl.bat)[4]} · ${last(pl.bat)[5]}盗塁</div>` : ""}
      ${pl?.pit.length ? `<div style="margin-top:6px">${last(pl.pit)[1]}勝${last(pl.pit)[2]}敗 · 防御率${last(pl.pit)[3]} · WHIP ${last(pl.pit)[4]} · ${last(pl.pit)[5]}奪三振</div>` : ""}</div></div>
    ${pl?.bat.length ? `<h2 class="sec">打撃成績の推移 <small>各試合終了時点・ア・リーグ内順位</small></h2><div class="panel" id="tBat"></div>` : ""}
    ${pl?.pit.length ? `<h2 class="sec">先発投手としての成績の推移</h2><div class="panel" id="tPit"></div>` : ""}
    <h2 class="sec">在籍の動き</h2><div class="panel">${txList(moves, true)}</div>`;
  if (pl?.bat.length) playerTrend(pl, "bat", document.getElementById("tBat"));
  if (pl?.pit.length) playerTrend(pl, "pit", document.getElementById("tPit"));
}

function pageRoster(filter = "all") {
  const list = S.transactions.filter(t => filter === "all" || t.kind === filter || (filter === "il" && t.kind === "back"));
  const cnt = k => S.transactions.filter(t => t.kind === k).length;
  $app.innerHTML = `<h2 class="sec" style="margin-top:0">選手の出入り（IN / OUT） <small>どの試合の後に起きたかを表示</small></h2>
    <div class="tabs">${[["all", "すべて"], ["in", `IN（加入・昇格）${cnt("in")}`], ["out", `OUT（放出・降格）${cnt("out")}`], ["il", `故障者リスト ${cnt("il") + cnt("back")}`]].map(([k, l]) => `<button data-f="${k}" class="${k === filter ? "on" : ""}">${l}</button>`).join("")}</div>
    <div class="legend" style="margin-bottom:12px"><span><i style="background:var(--win)"></i>IN</span><span><i style="background:var(--loss)"></i>OUT</span><span><i style="background:var(--gold)"></i>故障者リスト入り</span><span><i style="background:#6aa8e8"></i>復帰</span></div>
    <div class="panel">${txList(list, true)}</div>`;
  $app.querySelectorAll(".tabs button").forEach(b => b.onclick = () => pageRoster(b.dataset.f));
}

function pageNews() {
  const N = window.NEWS;
  if (!N) return ($app.innerHTML = `<div class="panel">ニュースは現在とりまとめ中です。</div>`);
  const cats = [...new Set(N.items.map(n => n.category))];
  const draw = c => {
    $app.innerHTML = `<h2 class="sec" style="margin-top:0">シーズン中のチームニュース</h2>
    <div class="tabs"><button data-c="" class="${!c ? "on" : ""}">すべて</button>${cats.map(k => `<button data-c="${k}" class="${k === c ? "on" : ""}">${k}</button>`).join("")}</div>
    <div class="tl">${N.items.filter(n => !c || n.category === c).map(n => {
      const k = gamesBefore(n.date);
      return `<div class="it"><div class="when">${fdate(n.date)} · ${k === 0 ? "開幕前" : k >= reg.length ? "レギュラーシーズン後" : `第${k}戦終了時点（${reg[k - 1].w}勝${reg[k - 1].l}敗）`}</div>
      <span class="chip">${esc(n.category)}</span> <b>${esc(n.title)}</b><div class="muted" style="font-size:13px">${esc(n.body)}</div>
      ${n.source ? `<a href="${esc(n.source)}" target="_blank" rel="noopener" class="muted" style="font-size:12px;text-decoration:underline">出典</a>` : ""}</div>`;
    }).join("")}</div>`;
    $app.querySelectorAll(".tabs button").forEach(b => b.onclick = () => draw(b.dataset.c));
  };
  draw("");
}

function pageGuide() {
  const F = (window.NEWS || {}).facts;
  const muraId = 808959;
  const mp = (window.PLAYERS || {})[muraId];
  const fr = mp ? mp.bat[mp.bat.length - 1] : null;
  const fin = fr && { homeRuns: fr[2], rbi: fr[3], ops: fr[4], rank: { homeRuns: fr[8], ops: fr[10] } };
  $app.innerHTML = `
  <section class="hero" style="min-height:280px"><img src="${firstImg(823812)}" alt=""><div class="body"><span class="chip gold">特集</span><h1 style="margin-top:8px">村上宗隆、メジャー1年目</h1>
    ${fin ? `<p style="margin:6px 0 0">${fin.homeRuns}本塁打（ア・リーグ${fin.rank.homeRuns}位）· ${fin.rbi}打点 · OPS ${fin.ops}（同${fin.rank.ops}位）</p>` : ""}</div></section>
  ${mp ? `<div class="panel" style="margin-top:14px" id="muraT"></div><p style="margin:8px 0 0"><a class="chip gold" href="#/player/${muraId}">村上の選手ページへ →</a></p>` : ""}
  ${F ? `<h2 class="sec">チームの基本情報</h2><div class="grid g3">
      ${[["監督", F.manager], ["編成トップ", F.gm], ["本拠地", F.ballpark], ["村上の契約", F.murakamiContract], ["前回のポストシーズン（2026年以前）", F.lastPostseasonBefore2026], ["前回のシリーズ突破（2026年以前）", F.lastSeriesWinBefore2026]].filter(x => x[1]).map(([k, v]) => `<div class="panel"><div class="muted" style="font-size:12px">${k}</div><div style="margin-top:4px">${esc(v)}</div></div>`).join("")}
    </div>
    ${(F.allStars || []).length ? `<h2 class="sec">オールスター選出</h2><div class="panel">${F.allStars.map(a => `<span class="chip" style="margin:3px">${esc(a)}</span>`).join("")}</div>` : ""}
    ${(F.awards || []).length ? `<h2 class="sec">表彰</h2><div class="panel"><ul style="margin:0;padding-left:1.2em">${F.awards.map(a => `<li>${esc(a)}</li>`).join("")}</ul></div>` : ""}
    <h2 class="sec">ファンとして知っておきたいこと</h2><div class="panel"><ul style="margin:0;padding-left:1.2em">${(F.other || []).map(a => `<li style="margin-bottom:6px">${esc(a)}</li>`).join("")}</ul></div>`
  : `<div class="panel" style="margin-top:14px">チーム情報は現在とりまとめ中です。</div>`}`;
  if (mp) playerTrend(mp, "bat", document.getElementById("muraT"), 1);
}

// ---------------- router ----------------
function route() {
  document.querySelector(".pop")?.remove();
  const [, r = "", arg] = location.hash.split("/");
  document.querySelectorAll("nav.main a").forEach(a => a.classList.toggle("on", a.dataset.r === (r === "game" ? "games" : r === "player" ? "players" : r)));
  ({ "": pageHome, games: () => pageGames(), game: () => pageGame(+arg), players: () => pagePlayers(), player: () => pagePlayer(+arg), roster: () => pageRoster(), quiz: () => pageQuiz(), story: () => pageStory(arg === undefined ? null : +arg), news: pageNews, guide: pageGuide }[r] || pageHome)();
  scrollTo(0, 0);
}
addEventListener("hashchange", route);
route();
