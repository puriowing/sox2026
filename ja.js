(() => {
  const NAMES = Object.assign({}, window.NAMES_JA_MORE || {}, window.NAMES_JA || {});
  const people = (window.SEASON && window.SEASON.people) || {};
  const short = n => (/^[一-龯]/.test(n) ? n.slice(0, 2) : n.split("・").pop());
  const surnameCount = {};
  Object.keys(people).forEach(id => { const n = NAMES[id]; if (n) surnameCount[short(n)] = (surnameCount[short(n)] || 0) + 1; });
  const byName = Object.entries(people)
    .map(([id, en]) => ({ en, ja: NAMES[id] ? (surnameCount[short(NAMES[id])] > 1 ? NAMES[id] : short(NAMES[id])) : en }))
    .sort((a, b) => b.en.length - a.en.length);

  const BASE = { "1st": "一塁", "2nd": "二塁", "3rd": "三塁", home: "本塁" };
  const POS = {
    "left fielder": "レフト", "center fielder": "センター", "right fielder": "ライト", shortstop: "ショート",
    "second baseman": "セカンド", "third baseman": "サード", "first baseman": "ファースト", pitcher: "ピッチャー", catcher: "キャッチャー",
  };
  const FIELD = { "left field": "レフト", "left center field": "左中間", "center field": "センター", "right center field": "右中間", "right field": "ライト" };
  const OF = new Set(["レフト", "センター", "ライト"]);
  const posRe = Object.keys(POS).sort((a, b) => b.length - a.length).join("|");
  const fieldRe = Object.keys(FIELD).sort((a, b) => b.length - a.length).join("|");
  const P = "(⟦\\d+⟧)";

  const pos = s => { const m = s.match(new RegExp(posRe)); return m ? POS[m[0]] : ""; };
  const ball = s => (/line drive/.test(s) ? "ライナー" : /ground ball/.test(s) ? "ゴロ" : /pop up/.test(s) ? "小フライ" : /fly ball/.test(s) ? "フライ" : "");

  function main(s) {
    let m;
    const ord = n => (n ? `${n}号` : "");
    if ((m = s.match(new RegExp(`^${P} hits a grand slam \\((\\d+)\\) to (${fieldRe})`)))) return [`${m[1]}が${FIELD[m[3]]}へ満塁本塁打（${ord(m[2])}）`, "hr4"];
    if ((m = s.match(new RegExp(`^${P} homers \\((\\d+)\\) on an? (?:[a-z ]+?) to (${fieldRe})`)))) return [`${m[1]}が${FIELD[m[3]]}へ${ord(m[2])}`, "hr"];
    if ((m = s.match(new RegExp(`^${P} (singles|doubles|triples)(?: \\((\\d+)\\))? on an? ([a-z ]+?) to (${posRe})`)))) {
      const d = POS[m[5]], b = m[4];
      if (/bunt/.test(b)) return [`${m[1]}が${d}へのバントヒット`];
      if (m[2] === "singles") return [`${m[1]}が${OF.has(d) ? d + "前ヒット" : d + "への内野安打"}`];
      return [`${m[1]}が${d}への${m[2] === "doubles" ? "ツーベース" : "スリーベース"}`];
    }
    if ((m = s.match(new RegExp(`^${P} (doubles|triples) \\(\\d+\\) on a ([a-z ]+?) (?:down the )?(left|right)-field line`)))) return [`${m[1]}が${m[3] === "left" ? "レフト" : "ライト"}線へ${m[2] === "doubles" ? "ツーベース" : "スリーベース"}`];
    if ((m = s.match(new RegExp(`^${P} (?:hits a )?ground-rule double \\(\\d+\\)`)))) return [`${m[1]}がエンタイトルツーベース`];
    if ((m = s.match(new RegExp(`^${P} strikes out swinging`)))) return [`${m[1]}は空振り三振`];
    if ((m = s.match(new RegExp(`^${P} called out on strikes`)))) return [`${m[1]}は見逃し三振`];
    if ((m = s.match(new RegExp(`^${P} strikes out on a foul tip`)))) return [`${m[1]}は三振（ファウルチップ）`];
    if ((m = s.match(new RegExp(`^${P} strikes out on a (?:foul|missed) bunt`)))) return [`${m[1]}はスリーバント失敗で三振`];
    if ((m = s.match(new RegExp(`^${P} strikes out`)))) return [`${m[1]}は三振`];
    if ((m = s.match(new RegExp(`^${P} hits an inside-the-park home run \\((\\d+)\\)`)))) return [`${m[1]}がランニング本塁打（${m[2]}号）`, "hr4"];
    if ((m = s.match(new RegExp(`^${P} (?:bunt )?(lines|flies|pops|grounds) into an? (?:unassisted |sacrifice )?double play, (?:fielded by )?(${posRe})`)))) return [`${m[1]}は${POS[m[3]]}${{ lines: "ライナー", flies: "フライ", pops: "フライ", grounds: "ゴロ" }[m[2]]}併殺`];
    if ((m = s.match(new RegExp(`^${P} ground bunts into a (double play|force out), (${posRe})`)))) return [`${m[1]}のバントは${POS[m[3]]}が処理し${m[2] === "double play" ? "併殺" : "封殺"}`];
    if ((m = s.match(new RegExp(`^${P} (lines|flies|pops) into a force out, (${posRe})`)))) return [`${m[1]}は${POS[m[3]]}${m[2] === "lines" ? "ライナー" : "フライ"}（封殺）`];
    if ((m = s.match(new RegExp(`^${P} bunt (?:grounds|pops|lines) out(?: softly)?(?:,| to) (${posRe})`)))) return [`${m[1]}のバントは${POS[m[2]]}が処理しアウト`];
    if ((m = s.match(new RegExp(`^${P} lines out(?: sharply| softly)?, (${posRe})`)))) return [`${m[1]}は${POS[m[2]]}ライナー`];
    if ((m = s.match(new RegExp(`^${P} (pops|flies) out(?: sharply| softly)?, (${posRe})`)))) return [`${m[1]}は${POS[m[3]]}フライ`];
    if ((m = s.match(new RegExp(`^${P} called out on a swinging pitchout`)))) return [`${m[1]}は空振り三振`];
    if ((m = s.match(new RegExp(`^${P} hits a sacrifice bunt`)))) return [`${m[1]}が送りバント`];
    if ((m = s.match(new RegExp(`^${P} out on a sacrifice fly$`)))) return [`${m[1]}が犠牲フライ`];
    if ((m = s.match(new RegExp(`^(?:pitcher |catcher )?${P} picks off ${P} at (1st|2nd|3rd)`)))) return [`${m[1]}のけん制で${m[2]}が${BASE[m[3]]}アウト`];
    if ((m = s.match(new RegExp(`^${P} intentionally walks`)))) return [`${m[1]}は敬遠`];
    if ((m = s.match(new RegExp(`^${P} walks`)))) return [`${m[1]}が四球を選ぶ`];
    if ((m = s.match(new RegExp(`^${P} hit by pitch`)))) return [`${m[1]}が死球`];
    if ((m = s.match(new RegExp(`^${P} grounds into a double play, (${posRe})`)))) return [`${m[1]}は${POS[m[2]]}ゴロ併殺打`];
    if ((m = s.match(new RegExp(`^${P} grounds into a force out, (?:fielded by )?(${posRe})`)))) return [`${m[1]}は${POS[m[2]]}ゴロ（封殺）`];
    if ((m = s.match(new RegExp(`^${P} grounds into a fielder's choice`))) || (m = s.match(new RegExp(`^${P} reaches on a fielder's choice`)))) return [`${m[1]}はフィルダースチョイスで出塁`];
    if ((m = s.match(new RegExp(`^${P} (lines|flies|pops) into a double play, (${posRe})`)))) return [`${m[1]}は${POS[m[3]]}${m[2] === "lines" ? "ライナー" : "フライ"}併殺`];
    if ((m = s.match(new RegExp(`^${P} grounds out(?: softly| sharply)?, (${posRe})`))) || (m = s.match(new RegExp(`^${P} grounds out(?: softly| sharply)? to (${posRe})`)))) return [`${m[1]}は${POS[m[2]]}ゴロ`];
    if ((m = s.match(new RegExp(`^${P} (flies|lines|pops) out(?: sharply| softly)? to (${posRe})[^.]*?(in foul territory)?$`)))) {
      const kind = m[2] === "lines" ? "ライナー" : "フライ";
      return [`${m[1]}は${m[4] ? "ファウルフライ（" + POS[m[3]] + "）" : POS[m[3]] + kind}`];
    }
    if ((m = s.match(new RegExp(`^${P} (?:hits a |out on a )?sacrifice fly to (${posRe})`)))) return [`${m[1]}が${POS[m[2]]}へ犠牲フライ`];
    if ((m = s.match(new RegExp(`^${P} (?:out on a )?sacrifice bunt`)))) return [`${m[1]}が送りバント`];
    if ((m = s.match(new RegExp(`^${P} reaches on an? (throwing|fielding|missed catch) error by (${posRe})`)))) return [`${m[1]}は${POS[m[3]]}の${m[2] === "throwing" ? "悪送球" : m[2] === "missed catch" ? "捕球ミス" : "失策"}で出塁`];
    if ((m = s.match(new RegExp(`^${P} reaches on catcher interference`)))) return [`${m[1]}は打撃妨害で出塁`];
    if ((m = s.match(new RegExp(`^${P} steals \\((\\d+)\\) (1st|2nd|3rd|home)`)))) return [`${m[1]}が${BASE[m[3]] === "本塁" ? "ホームスチール" : BASE[m[3]].replace("塁", "") + "盗"}成功`];
    if ((m = s.match(new RegExp(`^${P} caught stealing (2nd|3rd|home)`)))) return [`${m[1]}が${BASE[m[2]]}への盗塁失敗`];
    if ((m = s.match(new RegExp(`^${P} picked off and caught stealing (2nd|3rd|home)`)))) return [`${m[1]}がけん制で${BASE[m[2]]}アウト`];
    if ((m = s.match(new RegExp(`^Wild pitch by pitcher ${P}`)))) return [`${m[1]}の暴投`];
    if ((m = s.match(new RegExp(`^Passed ball by catcher ${P}`)))) return [`${m[1]}の捕逸`];
    if ((m = s.match(new RegExp(`^(?:Pitcher )?${P} (?:picks off|pickoff)`)))) return [`${m[1]}のけん制`];
    if ((m = s.match(new RegExp(`^${P} hits a ground-rule`)))) return [`${m[1]}がエンタイトルツーベース`];
    return null;
  }

  function runner(s) {
    let m;
    if ((m = s.match(new RegExp(`^${P} scores$`)))) return [`${m[1]}が生還`, "score"];
    if ((m = s.match(new RegExp(`^${P} to (1st|2nd|3rd)$`)))) return [`${m[1]}は${BASE[m[2]]}へ`];
    if ((m = s.match(new RegExp(`^${P} advances to (1st|2nd|3rd)`)))) return [`${m[1]}は${BASE[m[2]]}へ進塁`];
    if ((m = s.match(new RegExp(`^${P} (?:doubled off|out at) (1st|2nd|3rd|home)`)))) return [`${m[1]}は${BASE[m[2]]}でアウト`];
    if ((m = s.match(new RegExp(`^${P} out on batter interference`)))) return [`${m[1]}は守備妨害でアウト`];
    if ((m = s.match(new RegExp(`^(Throwing|Fielding|Missed catch) error by (${posRe})`)))) return [`${POS[m[2]]}の${m[1] === "Throwing" ? "悪送球" : m[1] === "Fielding" ? "失策" : "捕球ミス"}`];
    if (/^(?:Deflected|Assist)/.test(s)) return [""];
    if ((m = s.match(new RegExp(`^${P} (?:to 2nd|to 3rd)\\s*$`)))) return [`${m[1]}が進塁`];
    return null;
  }

  function translatePlay(desc) {
    if (!desc) return "";
    let s = desc.trim();
    const ids = [];
    for (const n of byName) {
      if (s.includes(n.en)) { s = s.split(n.en).join(`⟦${ids.length}⟧`); ids.push(n.ja); }
    }
    let prefix = "";
    let m = s.match(/^(Umpire reviewed|⟦\d+⟧|[A-Za-z. ]+?) (?:challenged )?\(([^)]+)\), call on the field was (upheld|overturned|confirmed|stands)[:.]\s*/);
    if (m) {
      const tok = m[1].match(/⟦(\d+)⟧/);
      const who = m[1] === "Umpire reviewed" ? "審判のリプレー検証" : tok ? `${ids[+tok[1]]}のチャレンジ` : `${/White Sox/.test(m[1]) ? "ホワイトソックス" : "相手チーム"}のチャレンジ`;
      const what = m[2] === "pitch result" ? "ABS・投球判定" : m[2].replace(/play at (1st|2nd|3rd|home)/, (_, b) => BASE[b] + "でのプレー").replace("tag play", "タッチプレー").replace("force play", "フォースプレー").replace("hit by pitch", "死球かどうか").replace("fair/foul", "フェアかファウルか").replace("catch/drop", "捕球").replace("fair or foul in outfield", "外野のフェアかファウルか").replace("home run", "本塁打かどうか").replace("rules check", "ルール確認").replace("home-plate collision", "本塁での衝突").replace("slide interference", "スライディングの妨害");
      prefix = `【${who}（${what}）：判定${m[3] === "overturned" ? "が覆る" : "どおり"}】`;
      s = s.slice(m[0].length);
      const m2 = s.match(/^(⟦\d+⟧|[A-Za-z. ]+?) (?:challenged )?\(([^)]+)\), call on the field was (upheld|overturned|confirmed|stands)[:.]\s*/);
      if (m2) s = s.slice(m2[0].length);
    }
    s = s.replace(/^⟦\d+⟧ batting, /, "");
    const sentences = s.split(/\.\s+|\.$/).map(x => x.trim()).filter(Boolean);
    const out = [];
    let ok = true, scores = 0, kind = null;
    sentences.forEach((x, i) => {
      x = x.replace(/,\s*(?:assist|assists).*$/, "").trim();
      const r = i === 0 ? main(x) || runner(x) : runner(x) || main(x);
      if (!r) { ok = false; return; }
      if (i === 0) kind = r[1];
      if (r[1] === "score") scores++;
      if (r[0]) out.push(r[0]);
    });
    if (!ok) return null;
    for (let i = out.length - 2; i >= 0; i--) if (out[i + 1].startsWith(out[i]) && out[i + 1] !== out[i]) out.splice(i, 1);
    if (kind === "hr") out[0] = out[0].replace(/(\d+号)$/, `$1${["ソロ本塁打", "2ラン", "3ラン"][scores] || ""}`);
    if (kind === "hr" || kind === "hr4") out.splice(1);
    let text = out.join("。") + "。";
    if (scores && kind !== "hr" && kind !== "hr4") text = text.replace(/^([^。]+)/, `$1（${scores}点）`);
    return prefix + text.replace(/⟦(\d+)⟧/g, (_, k) => ids[+k]);
  }

  window.translatePlay = d => translatePlay(d) ?? d;
  window.translatePlayStrict = translatePlay;
  window.nameJa = (id, en) => NAMES[id] || en;
})();

(() => {
  const POSJ = { RHP: "右投手", LHP: "左投手", P: "投手", C: "捕手", "1B": "一塁手", "2B": "二塁手", "3B": "三塁手", SS: "遊撃手", LF: "左翼手", CF: "中堅手", RF: "右翼手", OF: "外野手", IF: "内野手", DH: "指名打者", UT: "ユーティリティ" };
  const INJ = {
    "Tommy John surgery recovery": "トミー・ジョン手術からのリハビリ", Concussion: "脳振とう",
    "Fifth metacarpal fracture in his left hand": "左手第5中手骨の骨折", "Right middle finger blister": "右手中指のマメ",
  };
  const PART = { elbow: "ひじ", hamstring: "太もも裏", hamstrain: "太もも裏", ankle: "足首", hip: "股関節", shoulder: "肩", pectoral: "胸筋", calf: "ふくらはぎ", calif: "ふくらはぎ", lat: "広背筋", knee: "ひざ", flexor: "前腕の屈筋", oblique: "脇腹", wrist: "手首", back: "背中", forearm: "前腕", thumb: "親指", groin: "股関節内転筋", quad: "太もも前", foot: "足", hand: "手" };
  const KIND = { sprain: "捻挫", strain: "張り（肉離れ）", "impingement syndrome": "インピンジメント症候群", impingement: "インピンジメント", inflammation: "炎症", dislocation: "脱臼", "patellar tendinitis": "膝蓋腱炎", tendinitis: "腱炎", fracture: "骨折", contusion: "打撲", soreness: "痛み", spasms: "けいれん" };
  function injury(s) {
    if (INJ[s]) return INJ[s];
    const m = s.match(/^(Right|Left)\s+(\w+)\s+(.+)$/);
    if (m && PART[m[2]] && KIND[m[3]]) return `${m[1] === "Right" ? "右" : "左"}${PART[m[2]]}の${KIND[m[3]]}`;
    return "";
  }
  const MILB = { "Charlotte Knights": "3Aシャーロット", "Birmingham Barons": "2Aバーミングハム", "Winston-Salem Dash": "A+ウィンストンセーラム", "Kannapolis Cannon Ballers": "Aカナポリス" };
  window.txDetail = (t, tja) => {
    const d = t.desc || "";
    const pm = d.match(/\b(RHP|LHP|C|1B|2B|3B|SS|LF|CF|RF|OF|IF|DH|UT|P)\b/);
    const parts = [];
    if (pm) parts.push(POSJ[pm[1]]);
    const im = d.match(/(\d+)-day injured list/);
    if (im) parts.push(`${im[1]}日間の故障者リスト`);
    const inj = d.match(/injured list(?: retroactive to [^.]+)?\.\s*(.+?)\.?$/);
    if (inj && injury(inj[1])) parts.push(injury(inj[1]));
    if (t.other) {
      const nm = tja(t.other) || MILB[t.otherName] || t.otherName;
      if (t.kind === "in" && t.label !== "昇格" && t.label !== "メジャー契約") parts.push(`${nm}から`);
      else if (t.label === "昇格" || t.label === "メジャー契約") parts.push(`${MILB[t.otherName] || nm}から`);
      else parts.push(`${MILB[t.otherName] || nm}へ`);
    }
    return parts.join("・");
  };
  const POSA = { P: "投", C: "捕", "1B": "一", "2B": "二", "3B": "三", SS: "遊", LF: "左", CF: "中", RF: "右", DH: "指", PH: "代打", PR: "代走", TWP: "投打" };
  window.posJa = p => (p || "").split("-").map(x => POSA[x] || x).join("・");
  window.titleJa = t => ((window.TITLES_JA || {})[(t || "").trim()] || t);
  window.venueJa = v => ({ "Rate Field": "レート・フィールド", "American Family Field": "アメリカンファミリー・フィールド", "Daikin Park": "ダイキン・パーク", "Progressive Field": "プログレッシブ・フィールド", "Angel Stadium": "エンゼル・スタジアム", "Busch Stadium": "ブッシュ・スタジアム", "Chase Field": "チェイス・フィールド", "Citizens Bank Park": "シチズンズ・バンク・パーク", "Comerica Park": "コメリカ・パーク", "Fenway Park": "フェンウェイ・パーク", "Globe Life Field": "グローブライフ・フィールド", "Kauffman Stadium": "カウフマン・スタジアム", "Oracle Park": "オラクル・パーク", "Oriole Park at Camden Yards": "オリオール・パーク・アット・カムデンヤーズ", "Petco Park": "ペトコ・パーク", "Rogers Centre": "ロジャース・センター", "Sutter Health Park": "サター・ヘルス・パーク", "T-Mobile Park": "Tモバイル・パーク", "Target Field": "ターゲット・フィールド", "Tropicana Field": "トロピカーナ・フィールド", "Wrigley Field": "リグレー・フィールド", "Yankee Stadium": "ヤンキー・スタジアム", "loanDepot park": "ローンデポ・パーク" }[v] || v);
  window.summaryJa = s => {
    if (!s) return "";
    let m = s.match(/^(\d+)-(\d+) \| ?(.*)$/);
    const MAP = { HR: "本塁打", "2B": "二塁打", "3B": "三塁打", BB: "四球", K: "三振", RBI: "打点", R: "得点", SB: "盗塁", HBP: "死球", SF: "犠飛", CS: "盗塁死", IBB: "敬遠", GIDP: "併殺打" };
    const item = x => { const k = x.trim().match(/^(?:(\d+) )?(.+)$/); const lab = MAP[k[2]] || k[2]; return k[1] ? `${k[1]}${lab}` : lab; };
    if (m) return `${m[2]}打数${m[1]}安打` + (m[3] ? "・" + m[3].split(",").map(item).join("・") : "");
    m = s.match(/^([\d.]+) IP, (\d*) ?ER, (\d+) K, (\d+) BB/);
    if (m) return `${m[1]}回・自責点${m[2] || 1}・${m[3]}奪三振・${m[4]}四球`;
    return s;
  };
  window.noteJa = n => (n || "").replace(/\((W|L|S|H|BS), ([\d-]+)\)/g, (_, k, v) => `（${{ W: "勝", L: "敗", S: "S", H: "H", BS: "救援失敗" }[k]} ${v}）`);
})();

(() => {
  const NAMES = Object.assign({}, window.NAMES_JA_MORE || {}, window.NAMES_JA || {});
  const people = (window.SEASON && window.SEASON.people) || {};
  const short = n => (/^[一-龯]/.test(n) ? n.slice(0, 2) : n.split("・").pop());
  const en2ja = {};
  Object.entries(people).forEach(([id, en]) => { if (NAMES[id]) en2ja[en] = short(NAMES[id]); });
  const names = Object.keys(en2ja).sort((a, b) => b.length - a.length);
  const TEAM = { CWS: "ホワイトソックス", MIL: "ブルワーズ", MIA: "マーリンズ", TOR: "ブルージェイズ", BAL: "オリオールズ", KC: "ロイヤルズ", TB: "レイズ", ATH: "アスレチックス", AZ: "ダイヤモンドバックス", WSH: "ナショナルズ", LAA: "エンゼルス", SD: "パドレス", SEA: "マリナーズ", CHC: "カブス", SF: "ジャイアンツ", MIN: "ツインズ", DET: "タイガース", PHI: "フィリーズ", ATL: "ブレーブス", LAD: "ドジャース", NYY: "ヤンキース", CLE: "ガーディアンズ", BOS: "レッドソックス", TEX: "レンジャーズ", HOU: "アストロズ", CIN: "レッズ", NYM: "メッツ", PIT: "パイレーツ", STL: "カージナルス", COL: "ロッキーズ" };
  const HIT = { "solo home run": "ソロ本塁打", "solo homer": "ソロ本塁打", "two-run home run": "2ラン", "two-run homer": "2ラン", "three-run home run": "3ラン", "three-run homer": "3ラン", "grand slam": "満塁本塁打", "home run": "本塁打", homer: "本塁打", "RBI single": "タイムリー", "RBI double": "タイムリー二塁打", "RBI triple": "タイムリー三塁打", "two-run single": "2点タイムリー", "two-run double": "2点タイムリー二塁打", "three-run double": "走者一掃の二塁打", "bases-clearing double": "走者一掃の二塁打", "two-run triple": "2点タイムリー三塁打", "sacrifice fly": "犠牲フライ", "RBI walk": "押し出し四球", "RBI groundout": "内野ゴロの間の打点", "walk-off single": "サヨナラ打", "walk-off home run": "サヨナラ本塁打", "walk-off homer": "サヨナラ本塁打", "walk-off walk": "サヨナラ押し出し", "RBI fielder's choice": "フィルダースチョイスの間の打点", "two-run home run off the foul pole": "ポール直撃の2ラン", "inside-the-park home run": "ランニング本塁打", "stolen base": "盗塁", "diving catch": "ダイビングキャッチ", "great catch": "好捕", "leaping catch": "ジャンピングキャッチ", "sliding catch": "スライディングキャッチ", "diving stop": "ダイビング好捕", "strong throw": "好返球", "first home run of the season": "今季1号", "first career home run": "メジャー初本塁打", "first Major League home run": "メジャー初本塁打", "game-tying homer": "同点本塁打", "game-tying home run": "同点本塁打", "go-ahead homer": "勝ち越し本塁打", "go-ahead home run": "勝ち越し本塁打", "go-ahead single": "勝ち越しタイムリー", "go-ahead double": "勝ち越しタイムリー二塁打", "game-tying single": "同点タイムリー", "game-tying double": "同点タイムリー二塁打", "RBI single to center": "センターへのタイムリー" };
  const hitRe = Object.keys(HIT).sort((a, b) => b.length - a.length).map(x => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  function nm(s) {
    const t = s.trim();
    return en2ja[t] || null;
  }
  function rule(t) {
    let m;
    t = t.replace(/\s+/g, " ").trim();
    if ((m = t.match(/^Condensed Game: ([A-Z]+)@([A-Z]+) - (?:(\d+)\/(\d+)\/\d+|Game (\d+))$/))) return `ダイジェスト：${TEAM[m[1]] || m[1]}対${TEAM[m[2]] || m[2]}${m[5] ? `（第${m[5]}戦）` : `（${m[3]}/${m[4]}）`}`;
    if ((m = t.match(/^Field View: (.+)$/))) { const r = rule(m[1]); return r ? `フィールドビュー：${r}` : null; }
    if ((m = t.match(/^(?:Radio|Japanese) call of (.+)$/))) { const r = rule(m[1]); return r ? `${/^Japanese/.test(t) ? "日本語実況" : "ラジオ実況"}：${r}` : null; }
    if ((m = t.match(/^(Ball|Strike)(?: (\d))? (?:is )?(confirmed|overturned)(?: after| by| with| on)?(?: an?)? ABS(?: [Cc]hallenge)?$/))) return `ABSチャレンジで${m[1] === "Ball" ? "ボール" : "ストライク"}判定が${m[3] === "confirmed" ? "確定" : "覆る"}`;
    if ((m = t.match(new RegExp(`^(.+?)'s? (${hitRe})(?: \\((\\d+)\\))?$`)))) { const n = nm(m[1]); if (n) return `${n}の${m[3] ? m[3] + "号" : ""}${HIT[m[2]]}`; }
    if ((m = t.match(/^(.+?) (?:strikes out|K's|fans) (\d+|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?: .*)?$/))) { const n = nm(m[1]); const k = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 }[m[2]] || m[2]; if (n) return `${n}が${k}奪三振`; }
    if ((m = t.match(/^(.+?) (?:strikes out|K's|fans) (.+)$/))) { const a = nm(m[1]), b = nm(m[2]); if (a && b) return `${a}が${b}から三振を奪う`; }
    if ((m = t.match(/^(.+?)'s? (\d)-hit game$/))) { const n = nm(m[1]); if (n) return `${n}が${m[2]}安打の活躍`; }
    if ((m = t.match(/^(.+?) steals (second|third|home)(?: base)?$/))) { const n = nm(m[1]); if (n) return `${n}が${{ second: "二盗", third: "三盗", home: "本盗" }[m[2]]}`; }
    if ((m = t.match(/^(.+?) scores on (?:an? )?(error|wild pitch|passed ball|sacrifice fly)$/))) { const n = nm(m[1]); if (n) return `${n}が${{ error: "失策", "wild pitch": "暴投", "passed ball": "捕逸", "sacrifice fly": "犠牲フライ" }[m[2]]}の間に生還`; }
    return null;
  }
  window.titleJa = t => (window.TITLES_JA || {})[(t || "").trim()] || rule(t || "") || t;
  window.titleRule = rule;
})();
