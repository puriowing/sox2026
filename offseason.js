(() => {
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const NAMES = Object.assign({}, window.NAMES_JA_MORE || {}, window.NAMES_JA || {});
  const nm = (id, en) => NAMES[id] || en;
  const POS_JA = { C: "捕手", "1B": "一塁", "2B": "二塁", "3B": "三塁", SS: "遊撃", LF: "左翼", CF: "中堅", RF: "右翼", DH: "指名打者" };
  const COLORS = ["#c4ced4", "#7f8a92", "#e3b54a", "#6aa8e8", "#3fb37f", "#b07fd8", "#555b61"];
  const f3 = v => (v >= 1 ? v.toFixed(3) : v.toFixed(3).replace(/^0/, ""));
  const GRADE = { A: ["強み", "w"], B: ["平均以上", "w"], C: ["平均並み", ""], D: ["補強候補", "l"], E: ["最優先", "l"] };

  function bar(rows, key = "share") {
    let acc = 0;
    return `<div class="os-bar">${rows.map((r, i) => {
      const w = r[key]; acc += w;
      return `<i style="width:${w}%;background:${COLORS[i % COLORS.length]}" title="${esc(r.label)} ${w}%"></i>`;
    }).join("")}${acc < 99.5 ? `<i style="width:${100 - acc}%;background:var(--panel2)" title="その他"></i>` : ""}</div>
    <div class="os-leg">${rows.map((r, i) => `<span><b style="background:${COLORS[i % COLORS.length]}"></b>${esc(r.label)} <span class="num">${r[key]}%</span></span>`).join("")}</div>`;
  }

  window.pageOffseason = function () {
    const D = window.OFFSEASON;
    const app = document.getElementById("app");
    if (!D) return (app.innerHTML = `<p>分析データを読み込めませんでした。</p>`);
    const A = D.analysis;
    const posCard = p => {
      const c = D.comments[p.pos] || {};
      const diff = p.sox.ops - p.al.ops;
      const rows = p.players.slice(0, 6).map(r => ({ label: nm(r.id, r.name), share: r.share }));
      return `<div class="panel os-pos" id="pos-${p.pos}">
        <div class="os-head"><h3>${POS_JA[p.pos]} <small class="muted">${p.pos}</small></h3>
          ${c.grade ? `<span class="chip ${GRADE[c.grade][1]}">${GRADE[c.grade][0]}</span>` : ""}</div>
        <div class="os-ops"><div><span class="muted">ソックスOPS</span><b class="num">${f3(p.sox.ops)}</b></div>
          <div><span class="muted">ア・リーグ平均</span><b class="num">${f3(p.al.ops)}</b></div>
          <div><span class="muted">差</span><b class="num ${diff >= 0 ? "w" : "l"}">${diff >= 0 ? "+" : ""}${f3(diff)}</b></div>
          <div><span class="muted">本塁打</span><b class="num">${p.sox.hr}</b></div></div>
        <div class="muted" style="font-size:12px;margin:10px 0 4px">${p.pos === "DH" ? "先発出場の占有率" : "守備イニングの占有率"}</div>
        ${bar(rows)}
        ${c.text ? `<p class="os-txt">${esc(c.text)}</p>` : ""}
        ${c.next ? `<p class="os-next"><b>来季の見通し：</b>${esc(c.next)}</p>` : ""}
      </div>`;
    };
    app.innerHTML = `
      <h2 class="sec" style="margin-top:0">2027年に向けた補強分析 <small>2026年のポジション別占有率と成績から</small></h2>
      <div class="panel os-sum"><h3 style="margin-bottom:8px">結論：補強の優先順位</h3>
        <ol>${D.priorities.map(p => `<li><b>${esc(p.title)}</b><span class="muted">　${esc(p.why)}</span></li>`).join("")}</ol>
        ${D.summary ? `<p style="margin:10px 0 0">${esc(D.summary)}</p>` : ""}</div>

      <h2 class="sec">野手：ポジション別の占有率と成績 <small>OPSはそのポジションで出場した打席の合計</small></h2>
      <div class="os-heat panel tbl"><table><thead><tr><th>ポジション</th><th>主な選手（占有率）</th><th>OPS</th><th>リーグ平均との差</th><th>評価</th></tr></thead><tbody>
        ${A.positions.map(p => { const d = p.sox.ops - p.al.ops; const c = D.comments[p.pos] || {}; return `<tr><td><a href="#/offseason" data-jump="${p.pos}">${POS_JA[p.pos]}</a></td>
          <td style="text-align:left;white-space:normal">${p.players.slice(0, 2).map(r => `${esc(nm(r.id, r.name))} ${r.share}%`).join("、")}</td>
          <td class="num">${f3(p.sox.ops)}</td><td class="num ${d >= 0 ? "w" : "l"}">${d >= 0 ? "+" : ""}${f3(d)}</td>
          <td>${c.grade ? `<span class="chip ${GRADE[c.grade][1]}">${GRADE[c.grade][0]}</span>` : ""}</td></tr>`; }).join("")}
      </tbody></table></div>
      <div class="grid g2" style="margin-top:14px">${A.positions.map(posCard).join("")}</div>

      <h2 class="sec">投手：先発ローテーションと救援陣</h2>
      <div class="grid g4">
        <div class="stat"><div class="k">先発の防御率</div><div class="v l">${A.sp.era.toFixed(2)}</div><div class="s">ア・リーグ ${A.sp.eraRank}位 / 15（平均 ${A.sp.alAvgEra}）</div></div>
        <div class="stat"><div class="k">先発の投球回</div><div class="v">${Math.round(A.sp.ip)}</div><div class="s">ア・リーグ平均 ${Math.round(A.sp.alAvgIp)}回</div></div>
        <div class="stat"><div class="k">救援の防御率</div><div class="v w">${A.rp.era.toFixed(2)}</div><div class="s">ア・リーグ ${A.rp.eraRank}位 / 15（平均 ${A.rp.alAvgEra}）</div></div>
        <div class="stat"><div class="k">救援の投球回</div><div class="v">${Math.round(A.rp.ip)}</div><div class="s">ア・リーグ平均 ${Math.round(A.rp.alAvgIp)}回</div></div>
      </div>
      <div class="panel os-pos" style="margin-top:14px"><div class="os-head"><h3>先発ローテーション <small class="muted">先発試合数の占有率</small></h3>${D.comments.SP?.grade ? `<span class="chip ${GRADE[D.comments.SP.grade][1]}">${GRADE[D.comments.SP.grade][0]}</span>` : ""}</div>
        ${bar(A.rotation.slice(0, 7).map(r => ({ label: nm(r.id, r.name), share: r.share })))}
        <div class="tbl" style="margin-top:10px"><table><thead><tr><th>投手</th><th>先発</th><th>投球回</th><th>勝敗</th><th>防御率</th><th>WHIP</th><th>奪三振</th></tr></thead><tbody>
          ${A.rotation.slice(0, 9).map(r => `<tr><td><a href="#/player/${r.id}">${esc(nm(r.id, r.name))}</a></td><td>${r.gs}</td><td>${r.ip}</td><td>${r.w}勝${r.l}敗</td><td>${r.era}</td><td>${r.whip}</td><td>${r.so}</td></tr>`).join("")}
        </tbody></table></div>
        ${D.comments.SP?.text ? `<p class="os-txt">${esc(D.comments.SP.text)}</p>` : ""}${D.comments.SP?.next ? `<p class="os-next"><b>来季の見通し：</b>${esc(D.comments.SP.next)}</p>` : ""}</div>
      <div class="panel os-pos" style="margin-top:14px"><div class="os-head"><h3>救援陣</h3>${D.comments.RP?.grade ? `<span class="chip ${GRADE[D.comments.RP.grade][1]}">${GRADE[D.comments.RP.grade][0]}</span>` : ""}</div>
        <div class="tbl"><table><thead><tr><th>投手</th><th>登板</th><th>投球回</th><th>防御率</th><th>セーブ</th><th>ホールド</th><th>救援失敗</th></tr></thead><tbody>
          ${A.bullpen.slice(0, 10).map(r => `<tr><td><a href="#/player/${r.id}">${esc(nm(r.id, r.name))}</a></td><td>${r.g}</td><td>${r.ip}</td><td>${r.era}</td><td>${r.sv}</td><td>${r.hld}</td><td>${r.bs}</td></tr>`).join("")}
        </tbody></table></div>
        ${D.comments.RP?.text ? `<p class="os-txt">${esc(D.comments.RP.text)}</p>` : ""}${D.comments.RP?.next ? `<p class="os-next"><b>来季の見通し：</b>${esc(D.comments.RP.next)}</p>` : ""}</div>

      ${D.contracts?.length ? `<h2 class="sec">2027年の契約状況 <small>11月6日時点</small></h2>
      <div class="panel tbl"><table><thead><tr><th>選手</th><th>守備</th><th>来季の状況</th><th style="text-align:left">補足</th></tr></thead><tbody>
        ${D.contracts.map(c => `<tr><td>${esc(c.name)}</td><td>${esc(c.pos)}</td><td><span class="chip ${/FA|退団|放出/.test(c.status2027) ? "l" : ""}">${esc(c.status2027)}</span></td><td style="text-align:left;white-space:normal;font-size:12px">${esc(c.detail || "")}${c.source ? ` <a class="muted" href="${esc(c.source)}" target="_blank" rel="noopener" style="text-decoration:underline">出典</a>` : ""}</td></tr>`).join("")}
      </tbody></table></div>` : ""}

      ${D.prospects?.length ? `<h2 class="sec">来季に台頭しうる有望株</h2><div class="grid g3">${D.prospects.map(p => `<div class="panel"><b>${esc(p.name)}</b> <span class="chip">${esc(p.pos)}</span><div class="muted" style="font-size:12px;margin-top:4px">${esc(p.level2026 || "")}${p.eta ? ` · メジャー昇格の見込み：${esc(p.eta)}` : ""}</div><p style="margin:6px 0 0;font-size:13px">${esc(p.note || "")}</p></div>`).join("")}</div>` : ""}

      <h2 class="sec">この分析の作り方</h2>
      <div class="panel muted" style="font-size:13px"><ul style="margin:0;padding-left:1.2em">${D.method.map(m => `<li>${esc(m)}</li>`).join("")}</ul></div>`;
    app.querySelectorAll("[data-jump]").forEach(a => a.onclick = e => { e.preventDefault(); document.getElementById("pos-" + a.dataset.jump)?.scrollIntoView({ behavior: "smooth", block: "start" }); });
  };
})();
