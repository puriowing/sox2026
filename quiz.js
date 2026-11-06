(() => {
  const S = window.SEASON, SOX = 145;
  const games = S.games, reg = games.filter(g => g.type === "R");
  const P = window.PLAYERS || {};
  const NAMES = Object.assign({}, window.NAMES_JA_MORE || {}, window.NAMES_JA || {});
  const MURA = 808959;
  const DOW = ["日", "月", "火", "水", "木", "金", "土"];
  const TEAM_JA = { 108: "エンゼルス", 109: "ダイヤモンドバックス", 110: "オリオールズ", 111: "レッドソックス", 112: "カブス", 113: "レッズ", 114: "ガーディアンズ", 115: "ロッキーズ", 116: "タイガース", 117: "アストロズ", 118: "ロイヤルズ", 119: "ドジャース", 120: "ナショナルズ", 121: "メッツ", 133: "アスレチックス", 134: "パイレーツ", 135: "パドレス", 136: "マリナーズ", 137: "ジャイアンツ", 138: "カージナルス", 139: "レイズ", 140: "レンジャーズ", 141: "ブルージェイズ", 142: "ツインズ", 143: "フィリーズ", 144: "ブレーブス", 146: "マーリンズ", 147: "ヤンキース", 158: "ブルワーズ" };
  const nm = id => NAMES[id] || (P[id] || {}).name || S.people[id] || "";
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const d8 = s => new Date(s + "T12:00:00");
  const fdate = s => { const d = d8(s); return `${d.getMonth() + 1}月${d.getDate()}日(${DOW[d.getDay()]})`; };
  const mon = s => `${d8(s).getMonth() + 1}月`;
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const mom = pk => ({ ...((window.MOMENTS_AUTO || {})[pk] || {}), ...((window.MOMENTS_JA || {})[pk] || {}) });
  const last = r => r[r.length - 1];

  function numChoices(ans, spread = 3, min = 0, fmt = x => x) {
    const set = new Set([ans]);
    let guard = 0;
    while (set.size < 4 && guard++ < 200) {
      const d = (rnd(spread) + 1) * (Math.random() < 0.5 ? -1 : 1);
      if (ans + d >= min) set.add(ans + d);
    }
    return { choices: shuffle([...set]).map(fmt), answer: fmt(ans) };
  }
  function nameChoices(ansId, poolIds) {
    const others = shuffle([...new Set(poolIds.filter(id => id !== ansId && nm(id) && nm(id) !== nm(ansId)))]).slice(0, 3);
    return { choices: shuffle([ansId, ...others]).map(nm), answer: nm(ansId) };
  }

  const batters = Object.entries(P).filter(([, p]) => p.bat.length && last(p.bat)[6] >= 250).map(([id, p]) => ({ id: +id, r: last(p.bat) }));
  const starters = Object.entries(P).filter(([, p]) => p.pit.length && last(p.pit)[11] >= 10).map(([id, p]) => ({ id: +id, r: last(p.pit) }));
  const batIds = batters.map(b => b.id), pitIds = starters.map(p => p.id);

  const gens = {
    photoScore() {
      const g = pick(games.filter(x => x.img));
      const m = mom(g.pk);
      const fmt = ([a, b]) => `${a}-${b}`;
      const set = new Map([[fmt([g.rs, g.ra]), 1]]);
      while (set.size < 4) {
        const a = Math.max(0, g.rs + rnd(5) - 2), b = Math.max(0, g.ra + rnd(5) - 2);
        if (a !== b) set.set(fmt([a, b]), 1);
      }
      return {
        cat: "試合の記憶", img: g.img,
        q: `${fdate(g.date)}、${g.home ? "本拠地" : "敵地"}での${TEAM_JA[g.opp]}戦。ホワイトソックスから見たスコアは？`,
        choices: shuffle([...set.keys()]), answer: fmt([g.rs, g.ra]),
        why: `${g.win ? "勝利" : "敗戦"}。${m.title || ""}`, pk: g.pk,
      };
    },
    headlineMonth() {
      const g = pick(reg.filter(x => mom(x.pk).title));
      const months = ["3月", "4月", "5月", "6月", "7月", "8月", "9月"];
      const ans = mon(g.date);
      const ch = shuffle([ans, ...shuffle(months.filter(m => m !== ans)).slice(0, 3)]);
      return { cat: "試合の記憶", img: g.img, q: `「${mom(g.pk).title}」。これは何月の試合？`, choices: ch, answer: ans, why: `${fdate(g.date)}、第${g.no}戦の${TEAM_JA[g.opp]}戦でした。`, pk: g.pk };
    },
    headlineOpp() {
      const g = pick(games.filter(x => mom(x.pk).story));
      const m = mom(g.pk);
      const story = m.story.replace(new RegExp(TEAM_JA[g.opp], "g"), "〇〇");
      const opps = [...new Set(games.map(x => x.opp))].filter(o => o !== g.opp);
      const ch = shuffle([g.opp, ...shuffle(opps).slice(0, 3)]).map(o => TEAM_JA[o]);
      return { cat: "試合の記憶", q: `この試合の相手はどこ？\n「${story.slice(0, 110)}…」`, choices: ch, answer: TEAM_JA[g.opp], why: `${fdate(g.date)}の${TEAM_JA[g.opp]}戦（${g.rs}-${g.ra}で${g.win ? "勝利" : "敗戦"}）。`, pk: g.pk };
    },
    winningPitcher() {
      const g = pick(games.filter(x => x.win && x.wpId && pitIds.length));
      const pool = [...new Set(games.filter(x => x.win).map(x => x.wpId))];
      const c = nameChoices(g.wpId, pool);
      return { cat: "試合の記憶", img: g.img, q: `${fdate(g.date)}の${TEAM_JA[g.opp]}戦（${g.rs}-${g.ra}で勝利）。勝利投手は？`, ...c, why: `勝利投手は${nm(g.wpId)}。${mom(g.pk).title || ""}`, pk: g.pk };
    },
    teamLeader() {
      const k = pick([["本塁打", 2], ["打点", 3], ["盗塁", 5], ["打率", 1]]);
      const pool = k[1] === 1 ? batters.filter(b => b.r[6] >= 502) : batters;
      const top = [...pool].sort((a, b) => +b.r[k[1]] - +a.r[k[1]])[0];
      const c = nameChoices(top.id, pool.map(b => b.id));
      return { cat: "選手の記録", q: `2026年、チームで${k[0] === "打率" ? "最も打率が高かった（規定打席到達）" : `${k[0]}が最も多かった`}のは？`, ...c, why: `${nm(top.id)}が${top.r[k[1]]}${k[0] === "打率" ? "" : k[0] === "本塁打" ? "本" : k[0] === "打点" ? "打点" : "盗塁"}でチームトップ。`, player: top.id };
    },
    pitchLeader() {
      const k = pick([["勝利", 1], ["奪三振", 5]]);
      const top = [...starters].sort((a, b) => +b.r[k[1]] - +a.r[k[1]])[0];
      const c = nameChoices(top.id, pitIds);
      return { cat: "選手の記録", q: `先発投手で${k[0]}が最も多かったのは？`, ...c, why: `${nm(top.id)}が${top.r[k[1]]}${k[0] === "勝利" ? "勝" : "奪三振"}。`, player: top.id };
    },
    playerHR() {
      const b = pick(batters.filter(x => x.r[2] >= 5));
      const c = numChoices(b.r[2], 4, 0, x => `${x}本`);
      return { cat: "選手の記録", q: `${nm(b.id)}の2026年の本塁打数は？`, ...c, why: `${b.r[2]}本塁打・${b.r[3]}打点・打率${b.r[1]}（ア・リーグ本塁打${b.r[8]}位）。`, player: b.id };
    },
    muraMilestone() {
      const p = P[MURA]; if (!p) return null;
      const n = pick([10, 20, 25, 30]);
      const row = p.bat.find(r => r[2] >= n); if (!row) return null;
      const g = reg[row[0] - 1];
      const months = ["4月", "5月", "6月", "7月", "8月", "9月"];
      const ans = mon(g.date);
      const ch = shuffle([ans, ...shuffle(months.filter(m => m !== ans)).slice(0, 3)]);
      return { cat: "村上宗隆", q: `村上がシーズン${n}本目の本塁打に到達したのは何月？`, choices: ch, answer: ans, why: `${fdate(g.date)}、第${g.no}戦の${TEAM_JA[g.opp]}戦で到達しました。`, pk: g.pk };
    },
    muraStat() {
      const p = P[MURA]; if (!p) return null;
      const r = last(p.bat);
      const k = pick([["本塁打", 2, "本"], ["打点", 3, ""], ["盗塁", 5, ""]]);
      const c = numChoices(+r[k[1]], k[1] === 5 ? 2 : 4, 0, x => `${x}${k[2] || k[0]}`);
      return { cat: "村上宗隆", q: `村上のメジャー1年目、レギュラーシーズンの${k[0]}は？`, ...c, why: `打率${r[1]}・${r[2]}本塁打・${r[3]}打点・OPS ${r[4]}。`, player: MURA };
    },
    longestStreak() {
      let best = 0, c = 0, worst = 0, d = 0;
      reg.forEach(g => { c = g.win ? c + 1 : 0; d = g.win ? 0 : d + 1; best = Math.max(best, c); worst = Math.max(worst, d); });
      const lose = Math.random() < 0.4;
      const ans = lose ? worst : best;
      return { cat: "チームの記録", q: `レギュラーシーズンの最長${lose ? "連敗" : "連勝"}は？`, ...numChoices(ans, 3, 2, x => `${x}${lose ? "連敗" : "連勝"}`), why: `最長連勝は${best}、最長連敗は${worst}でした。` };
    },
    bestMonth() {
      const m = {};
      reg.forEach(g => { const k = mon(g.date); m[k] = m[k] || { w: 0, l: 0 }; g.win ? m[k].w++ : m[k].l++; });
      const arr = Object.entries(m).filter(([k]) => k !== "3月").map(([k, v]) => ({ k, p: v.w / (v.w + v.l), v }));
      const best = arr.sort((a, b) => b.p - a.p)[0];
      const ch = shuffle([best.k, ...shuffle(arr.filter(a => a.k !== best.k)).slice(0, 3).map(a => a.k)]);
      return { cat: "チームの記録", q: `月間の勝率が最も高かったのは何月？（3月を除く）`, choices: ch, answer: best.k, why: `${best.k}は${best.v.w}勝${best.v.l}敗。` };
    },
    favoriteOpp() {
      const m = {};
      reg.forEach(g => { m[g.opp] = m[g.opp] || { w: 0, l: 0 }; g.win ? m[g.opp].w++ : m[g.opp].l++; });
      const arr = Object.entries(m).map(([k, v]) => ({ k: +k, v })).sort((a, b) => b.v.w - a.v.w || a.v.l - b.v.l);
      const top = arr[0];
      if (arr[1] && arr[1].v.w === top.v.w) return null;
      const ch = shuffle([top.k, ...shuffle(arr.slice(1, 8)).slice(0, 3).map(a => a.k)]).map(k => TEAM_JA[k]);
      return { cat: "チームの記録", q: `レギュラーシーズンで最も多く勝った相手は？`, choices: ch, answer: TEAM_JA[top.k], why: `${TEAM_JA[top.k]}に${top.v.w}勝${top.v.l}敗。` };
    },
    extraInnings() {
      const ex = reg.filter(g => g.innings > 9);
      const w = ex.filter(g => g.win).length;
      return { cat: "チームの記録", q: `延長戦の成績は？（レギュラーシーズン）`, ...numChoices(w, 2, 0, x => `${x}勝${ex.length - x}敗`), why: `延長戦は${ex.length}試合で${w}勝${ex.length - w}敗。` };
    },
    firstPlace() {
      const g = reg.find(x => x.divRank === 1 && x.no > 10);
      if (!g) return null;
      const months = ["4月", "5月", "6月", "7月", "8月"];
      const ans = mon(g.date);
      if (!months.includes(ans)) return null;
      const ch = shuffle([ans, ...shuffle(months.filter(m => m !== ans)).slice(0, 3)]);
      return { cat: "チームの記録", q: `開幕11戦目以降で、初めて地区首位に立ったのは何月？`, choices: ch, answer: ans, why: `${fdate(g.date)}の第${g.no}戦後に地区1位（${g.w}勝${g.l}敗）。`, pk: g.pk };
    },
    trade() {
      const t = pick(S.transactions.filter(x => x.label === "トレード加入" && nm(x.pid) && x.date >= "2026-06-01" && x.date <= "2026-08-10"));
      if (!t) return null;
      const pool = [...new Set(S.transactions.filter(x => x.label === "トレード放出" || x.label === "昇格").map(x => x.pid))];
      const c = nameChoices(t.pid, pool);
      return { cat: "選手の出入り", q: `${fdate(t.date)}、トレードでホワイトソックスに加わったのは？`, ...c, why: `${nm(t.pid)}が${TEAM_JA[t.other] || "他球団"}から加入しました。` };
    },
  };

  const STATIC = [
    { cat: "村上宗隆", q: "村上がホワイトソックスと結んだ契約は？", choices: ["2年総額3400万ドル", "3年総額5000万ドル", "1年1500万ドル", "4年総額8000万ドル"], answer: "2年総額3400万ドル", why: "2025年12月21日に合意。オプトアウトはなく、2027年シーズン後にFAとなります。" },
    { cat: "村上宗隆", q: "村上のメジャー初安打は？", choices: ["本塁打", "二塁打", "内野安打", "タイムリー"], answer: "本塁打", why: "開幕戦（3月26日・ブルワーズ戦）の9回にソロ。初安打が初本塁打でした。" },
    { cat: "村上宗隆", q: "村上が4月に記録した、MLB新人タイ記録は？", choices: ["5試合連続本塁打", "4打席連続本塁打", "10試合連続打点", "1試合3本塁打"], answer: "5試合連続本塁打", why: "4月22日のダイヤモンドバックス戦で5試合連続弾。球団タイ記録でもあります。" },
    { cat: "村上宗隆", q: "村上が5月末に負傷で離脱した原因は？", choices: ["右太もも裏の肉離れ", "左手首の骨折", "腰痛", "脳振とう"], answer: "右太もも裏の肉離れ", why: "5月30日のタイガース戦で走塁中に負傷。7月10日に復帰し、同じ日にオールスターに選ばれました。" },
    { cat: "村上宗隆", q: "村上のホームランダービーの結果は？", choices: ["1回戦敗退", "準決勝敗退", "準優勝", "優勝"], answer: "1回戦敗退", why: "9本を放つも、地元フィラデルフィアのシュワーバー（10本）に1本届きませんでした。" },
    { cat: "村上宗隆", q: "9月5日に村上が達成した「日本出身選手で史上初」の記録は？", choices: ["新人シーズン30本塁打", "シーズン100打点", "サイクル安打", "1試合4本塁打"], answer: "新人シーズン30本塁打", why: "ツインズ戦で逆方向への30号2ラン。モンゴメリー、バルガスと30本トリオになりました。" },
    { cat: "チームの記録", q: "6月26日のロイヤルズ戦の22得点は、球団史上何位？", choices: ["2位タイ", "1位", "5位", "10位"], answer: "2位タイ", why: "球団最多は1955年の29点。22得点は1970年以来の多さでした。" },
    { cat: "チームの記録", q: "7月10日、アスレチックス戦でサイクル安打を達成したのは？", choices: ["トリスタン・ピーターズ", "ミゲル・バルガス", "チェイス・メイドロス", "コルソン・モンゴメリー"], answer: "トリスタン・ピーターズ", why: "球団では2017年のアブレイユ以来、史上7人目。翌日にはオールスターにも選ばれました。" },
    { cat: "チームの記録", q: "2026年のオールスターに選ばれなかったのは？", choices: ["コルソン・モンゴメリー", "ミゲル・バルガス", "村上宗隆", "トリスタン・ピーターズ"], answer: "コルソン・モンゴメリー", why: "選ばれたのはバルガス（選手投票）、村上とピーターズ（代替選出）の3人。全員が初選出でした。" },
    { cat: "チームの記録", q: "ポストシーズン進出が「MLB史上初」と言われた理由は？", choices: ["3年連続100敗からの進出", "前年最下位からの地区優勝", "開幕10連敗からの進出", "新人監督1年目の進出"], answer: "3年連続100敗からの進出", why: "9月24日のロイヤルズ戦の勝利で進出が決まりました。2021年以来のポストシーズンです。" },
    { cat: "ポストシーズン", q: "ワイルドカードシリーズ突破は、何年以来のシリーズ勝利？", choices: ["2005年", "2008年", "2021年", "1993年"], answer: "2005年", why: "アストロズに2連勝。シリーズ勝利はワールドシリーズを制した2005年以来でした。" },
    { cat: "ポストシーズン", q: "地区シリーズ第5戦で、ガーディアンズ投手陣が記録したポストシーズン最多記録は？", choices: ["21奪三振", "10者連続三振", "ノーヒットノーラン", "被安打1"], answer: "21奪三振", why: "9回試合のポストシーズン最多記録。0-2で敗れ、2連勝からの3連敗で敗退しました。" },
    { cat: "ポストシーズン", q: "地区シリーズ第1戦、先制の2ランを放ったのは？", choices: ["村上宗隆", "チェイス・メイドロス", "ミゲル・バルガス", "カイル・ティール"], answer: "村上宗隆", why: "4回に先制2ラン。投手5人の継投で3-0の完封勝ちでした。" },
    { cat: "フロント・球団", q: "2026年のドラフト全体1位でホワイトソックスが指名したのは？", choices: ["ロック・チョロウスキー", "ランドン・トーミ", "ノア・シュルツ", "ヘイゲン・スミス"], answer: "ロック・チョロウスキー", why: "UCLAの遊撃手。球団の全体1位指名は1977年のハロルド・ベインズ以来です。" },
    { cat: "フロント・球団", q: "ホワイトソックスの監督は？", choices: ["ウィル・ベナブル", "スティーブン・ボート", "ペドロ・グリフォル", "オジー・ギーエン"], answer: "ウィル・ベナブル", why: "就任2年目。ア・リーグ最優秀監督の最終候補3人に選ばれました。" },
    { cat: "フロント・球団", q: "8月2日、マリナーズからトレードで獲得した先発投手は？", choices: ["ルイス・カスティーヨ", "ホセ・ウルキディ", "エリック・フェディ", "アンソニー・ケイ"], answer: "ルイス・カスティーヨ", why: "移籍後は不振で、9月24日に右肩のインピンジメントで故障者リスト入りしました。" },
  ];

  const MODES = {
    mix: { pk: 849846, name: "ミックス10問", desc: "試合・選手・チーム・ニュースからランダムに", gens: ["photoScore", "headlineMonth", "headlineOpp", "winningPitcher", "teamLeader", "pitchLeader", "playerHR", "muraMilestone", "muraStat", "longestStreak", "bestMonth", "favoriteOpp", "extraInnings", "firstPlace", "trade", "static", "static", "static", "static"] },
    games: { pk: 824582, name: "試合の記憶", desc: "写真と振り返り文から、169試合を思い出す", gens: ["photoScore", "headlineMonth", "headlineOpp", "winningPitcher"] },
    mura: { pk: 823812, name: "村上宗隆クイズ", desc: "メジャー1年目の歩みをどこまで覚えてる？", gens: ["muraMilestone", "muraStat", "staticMura"] },
  };

  function buildRound(mode) {
    const qs = [], used = new Set();
    const stat = shuffle(STATIC);
    const statMura = shuffle(STATIC.filter(s => s.cat === "村上宗隆"));
    let guard = 0;
    while (qs.length < 10 && guard++ < 300) {
      const g = pick(MODES[mode].gens);
      let q = g === "static" ? stat.pop() : g === "staticMura" ? statMura.pop() : gens[g]();
      if (!q) continue;
      if (g === "static" || g === "staticMura") q = { ...q, choices: shuffle(q.choices) };
      if (used.has(q.q)) continue;
      used.add(q.q);
      qs.push(q);
    }
    return qs;
  }

  const TITLES = [[10, "サウスサイドの生き字引"], [8, "レート・フィールドの常連"], [6, "立派なソックスファン"], [4, "これからが楽しみなファン"], [0, "まずは試合一覧から振り返ろう"]];
  const bestKey = m => `wsx-quiz-best-${m}`;
  const getBest = m => { try { return +localStorage.getItem(bestKey(m)) || 0; } catch (e) { return 0; } };
  const setBest = (m, v) => { try { localStorage.setItem(bestKey(m), v); } catch (e) {} };

  window.quizBuildRound = buildRound;
  window.pageQuiz = function pageQuiz() {
    const app = document.getElementById("app");
    app.innerHTML = `<h2 class="sec" style="margin-top:0">2026 ホワイトソックス・クイズ <small>毎回ちがう問題が出ます。全10問</small></h2>
      <div class="grid g3">${Object.entries(MODES).map(([k, m]) => `<button class="panel quiz-mode" data-m="${k}">
        <div class="qmimg" style="background-image:url('${esc((games.find(g => g.pk === m.pk) || {}).img || "")}')"></div>
        <div style="font-size:18px;font-weight:700">${m.name}</div><div class="muted" style="margin-top:4px">${m.desc}</div>
        <div class="chip gold" style="margin-top:10px">自己ベスト ${getBest(k)} / 10</div></button>`).join("")}</div>`;
    app.querySelectorAll(".quiz-mode").forEach(b => b.onclick = () => play(b.dataset.m));
  };

  function play(mode) {
    const app = document.getElementById("app");
    const qs = buildRound(mode);
    let i = 0, score = 0;
    const show = () => {
      const q = qs[i];
      app.innerHTML = `<div class="quiz">
        <div class="row" style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
          <span class="chip">${esc(q.cat)}</span><span class="muted">第${i + 1}問 / 10　正解 ${score}</span></div>
        <div class="qbar"><i style="width:${(i / 10) * 100}%"></i></div>
        ${q.img ? `<img class="qimg" src="${esc(q.img)}" alt="">` : ""}
        <h2 class="qq">${esc(q.q).replace(/\n/g, "<br>")}</h2>
        <div class="qch">${q.choices.map(c => `<button data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div>
        <div id="qres"></div></div>`;
      app.querySelectorAll(".qch button").forEach(b => b.onclick = () => {
        const ok = b.dataset.c === q.answer;
        if (ok) score++;
        app.querySelectorAll(".qch button").forEach(x => { x.disabled = true; if (x.dataset.c === q.answer) x.classList.add("ok"); else if (x === b) x.classList.add("ng"); });
        document.getElementById("qres").innerHTML = `<div class="panel qexp ${ok ? "ok" : "ng"}"><b>${ok ? "正解！" : `残念… 正解は「${esc(q.answer)}」`}</b><p style="margin:6px 0 0">${esc(q.why)}</p>
          ${q.pk ? `<a class="chip gold" href="#/game/${q.pk}" target="_blank">この試合を振り返る →</a>` : ""}${q.player ? `<a class="chip gold" href="#/player/${q.player}" target="_blank">選手ページへ →</a>` : ""}
          <div style="margin-top:12px"><button class="qnext">${i < 9 ? "次の問題へ" : "結果を見る"}</button></div></div>`;
        app.querySelector(".qnext").onclick = () => { i++; i < 10 ? show() : result(); };
        app.querySelector(".qnext").focus();
      });
      scrollTo(0, 0);
    };
    const result = () => {
      const best = Math.max(getBest(mode), score);
      const isNew = score > getBest(mode);
      setBest(mode, best);
      const title = TITLES.find(([n]) => score >= n)[1];
      app.innerHTML = `<div class="quiz" style="text-align:center">
        <div class="muted">${MODES[mode].name}</div>
        <div class="hero-score num">${score}<span>/10</span></div>
        <h2>${title}</h2>${isNew ? `<p class="chip gold">自己ベスト更新！</p>` : `<p class="muted">自己ベスト ${best} / 10</p>`}
        <div style="display:flex;gap:10px;justify-content:center;margin-top:18px;flex-wrap:wrap">
          <button class="qnext" id="again">もう一度（別の問題）</button><a class="qnext alt" href="#/quiz">ほかのクイズ</a></div></div>`;
      document.getElementById("again").onclick = () => play(mode);
    };
    show();
  }
})();
