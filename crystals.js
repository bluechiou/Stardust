/* ============================================================
   星塵夢汐 — 水晶模組 Crystals Module（畫面與互動）
   知識庫資料（CRYSTAL_DB、脈輪、用途、常見功效）在 crystal-data.js，
   前台與後台（admin.html）共用；想編修水晶內容請改那支。
   ============================================================ */

/* ============================================================
   復古礦物版畫風插圖（程序化 SVG）
   模仿 19 世紀 Minéralogie 博物圖鑑：墨線輪廓＋分面填色＋斜線陰影
   ============================================================ */
const INK = "#4a3a2c"; /* 版畫墨線色 */
let _svgSeq = 0;

/* 以字串種子產生確定性亂數（同一顆水晶每次長一樣） */
function crystalRng(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
const _pts = a => a.map(p => p.join(",")).join(" ");
function _poly(pts, fill, extra = "") { return `<polygon points="${_pts(pts)}" fill="${fill}" ${extra}/>`; }

/* 單根晶柱（六方柱＋錐頂的側視三面）；供 point/cluster 重用 */
function _pointAt(cx, baseY, h, w, pal, rot = 0, needles = 0, rng = Math.random) {
  const topY = baseY - h, shY = topY + h * 0.28; /* 錐頂肩線 */
  const L = cx - w / 2, R = cx + w / 2, l = cx - w / 6, r = cx + w / 6;
  const faces =
    _poly([[L, baseY], [L, shY], [cx, topY], [l, shY - h * 0.06], [l, baseY]], pal[1]) +
    _poly([[l, baseY], [l, shY - h * 0.06], [cx, topY], [r, shY - h * 0.06], [r, baseY]], pal[0]) +
    _poly([[r, baseY], [r, shY - h * 0.06], [cx, topY], [R, shY], [R, baseY]], pal[2]) +
    `<line x1="${l}" y1="${shY - h * 0.06}" x2="${l}" y2="${baseY}" stroke="${INK}" stroke-width=".5" opacity=".5"/>` +
    `<line x1="${r}" y1="${shY - h * 0.06}" x2="${r}" y2="${baseY}" stroke="${INK}" stroke-width=".5" opacity=".5"/>`;
  let needleLines = "";
  for (let i = 0; i < needles; i++) {
    const nx = L + w * (0.15 + rng() * 0.7), ny = baseY - h * (0.1 + rng() * 0.3);
    needleLines += `<line x1="${nx}" y1="${ny}" x2="${nx + (rng() - 0.3) * w * 0.5}" y2="${ny - h * (0.3 + rng() * 0.35)}" stroke="#b8860b" stroke-width="1" opacity=".8"/>`;
  }
  return `<g transform="rotate(${rot} ${cx} ${baseY})">${faces}${needleLines}</g>`;
}

/* 底部圍岩基座 */
function _matrix(rng, y = 100, wide = 66) {
  const cx = 60, pts = [];
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const x = cx - wide / 2 + (wide / n) * i;
    pts.push([x, y - (i === 0 || i === n ? 0 : 4 + rng() * 7)]);
  }
  pts.push([cx + wide / 2, y + 6], [cx - wide / 2, y + 6]);
  return _poly(pts, "#8c7f6d", `stroke="${INK}" stroke-width="1"`) +
    `<ellipse cx="60" cy="${y + 7}" rx="${wide / 2 + 4}" ry="3.5" fill="${INK}" opacity=".14"/>`;
}

const CRYSTAL_FORMS = {
  point(pal, rng) {
    return _matrix(rng) + _pointAt(60, 101, 66, 30, pal, (rng() - 0.5) * 8) +
      _pointAt(41, 101, 30, 15, pal, -16 - rng() * 6) + _pointAt(80, 101, 26, 13, pal, 15 + rng() * 6);
  },
  cluster(pal, rng) {
    let s = _matrix(rng, 100, 78);
    const spots = [[32, -30], [46, -14], [60, 0], [74, 12], [88, 28], [53, -22], [67, 20]];
    for (const [x, rot] of spots) {
      const h = 26 + rng() * 30, w = 9 + rng() * 9;
      s += _pointAt(x, 97, h, w, pal, rot * 0.8 + (rng() - 0.5) * 10);
    }
    return s;
  },
  geode(pal, rng) {
    const teeth = [];
    const n = 15, cx = 60, cy = 66, R = 40;
    let inner = "";
    for (let i = 0; i <= n; i++) {
      const a = Math.PI + (i / n) * Math.PI; /* 上半弧 */
      const x1 = cx + Math.cos(a) * R * 0.78, y1 = cy + Math.sin(a) * R * 0.72;
      const a2 = Math.PI + ((i + 0.5) / n) * Math.PI;
      const x2 = cx + Math.cos(a2) * R * 0.45, y2 = cy + Math.sin(a2) * R * 0.42;
      const a3 = Math.PI + ((i + 1) / n) * Math.PI;
      const x3 = cx + Math.cos(a3) * R * 0.78, y3 = cy + Math.sin(a3) * R * 0.72;
      inner += _poly([[x1, y1], [x2, y2], [x3, y3]], i % 2 ? pal[0] : pal[2], `stroke="${INK}" stroke-width=".4"`);
      teeth.push(0);
    }
    return `<ellipse cx="${cx}" cy="${cy + 32}" rx="46" ry="4" fill="${INK}" opacity=".14"/>
      <path d="M ${cx - R} ${cy} A ${R} ${R * 0.92} 0 0 1 ${cx + R} ${cy} L ${cx + R} ${cy + 26} A ${R} ${R * 0.3} 0 0 1 ${cx - R} ${cy + 26} Z" fill="#9a8d7c" stroke="${INK}" stroke-width="1.2"/>
      <path d="M ${cx - R * 0.86} ${cy} A ${R * 0.86} ${R * 0.8} 0 0 1 ${cx + R * 0.86} ${cy} L ${cx - R * 0.86} ${cy} Z" fill="${pal[1]}"/>
      ${inner}
      <path d="M ${cx - R} ${cy} L ${cx + R} ${cy}" stroke="${INK}" stroke-width="1"/>`;
  },
  tumbled(pal, rng) {
    let speck = "";
    for (let i = 0; i < 16; i++) {
      const a = rng() * Math.PI * 2, r = rng() * 26;
      speck += `<circle cx="${60 + Math.cos(a) * r * 1.15}" cy="${62 + Math.sin(a) * r * 0.78}" r="${0.7 + rng() * 1.4}" fill="${i % 3 ? pal[1] : pal[2]}" opacity=".8"/>`;
    }
    return `<ellipse cx="60" cy="97" rx="38" ry="4.5" fill="${INK}" opacity=".14"/>
      <path d="M 26 62 C 26 38, 44 28, 62 29 C 84 30, 95 44, 94 63 C 93 82, 78 93, 58 92 C 38 91, 26 80, 26 62 Z"
        fill="${pal[0]}" stroke="${INK}" stroke-width="1.3"/>
      ${speck}
      <path d="M 36 48 C 42 38, 54 34, 64 35" fill="none" stroke="${pal[2]}" stroke-width="3.5" stroke-linecap="round" opacity=".7"/>`;
  },
  cab(pal, rng) {
    return `<ellipse cx="60" cy="96" rx="36" ry="4.5" fill="${INK}" opacity=".14"/>
      <ellipse cx="60" cy="62" rx="34" ry="30" fill="${pal[0]}" stroke="${INK}" stroke-width="1.3"/>
      <ellipse cx="60" cy="62" rx="34" ry="30" fill="url(#cabgrad${_svgSeq})"/>
      <path d="M 34 55 C 44 40, 70 36, 84 48" fill="none" stroke="${pal[2]}" stroke-width="4.5" stroke-linecap="round" opacity=".85"/>
      <path d="M 40 74 C 52 82, 72 80, 80 70" fill="none" stroke="${pal[1]}" stroke-width="3" stroke-linecap="round" opacity=".5"/>
      <defs><radialGradient id="cabgrad${_svgSeq}" cx="38%" cy="32%" r="80%">
        <stop offset="0%" stop-color="${pal[2]}" stop-opacity=".9"/><stop offset="55%" stop-color="${pal[0]}" stop-opacity="0"/>
        <stop offset="100%" stop-color="${pal[1]}" stop-opacity=".55"/></radialGradient></defs>`;
  },
  slab(pal, rng) {
    const shape = "M 24 66 C 22 44, 38 30, 62 30 C 86 30, 98 44, 96 64 C 94 84, 80 94, 56 93 C 34 92, 26 82, 24 66 Z";
    let bands = "";
    for (let i = 0; i < 5; i++) {
      const y = 38 + i * 12, wob = () => (rng() - 0.5) * 8;
      bands += `<path d="M 20 ${y} C 45 ${y + wob()}, 75 ${y + wob()}, 100 ${y + (rng() - 0.5) * 6}
        L 100 ${y + 7} C 75 ${y + 7 + wob()}, 45 ${y + 7 + wob()}, 20 ${y + 7} Z"
        fill="${[pal[2], pal[0], pal[1]][i % 3]}" clip-path="url(#slabclip${_svgSeq})"/>`;
    }
    return `<ellipse cx="60" cy="97" rx="38" ry="4.5" fill="${INK}" opacity=".14"/>
      <defs><clipPath id="slabclip${_svgSeq}"><path d="${shape}"/></clipPath></defs>
      <path d="${shape}" fill="${pal[0]}"/>${bands}
      <path d="${shape}" fill="none" stroke="${INK}" stroke-width="1.3"/>`;
  },
  rough(pal, rng) {
    const cx = 60, cy = 62, pts = [];
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2, r = 26 + rng() * 12;
      pts.push([cx + Math.cos(a) * r * 1.15, cy + Math.sin(a) * r * 0.95]);
    }
    const facets = pts.map((p, i) =>
      _poly([[cx, cy], p, pts[(i + 1) % n]], [pal[0], pal[2], pal[1]][i % 3], `stroke="${INK}" stroke-width=".45" stroke-opacity=".6"`)).join("");
    return `<ellipse cx="60" cy="98" rx="36" ry="4.5" fill="${INK}" opacity=".14"/>${facets}
      <polygon points="${_pts(pts)}" fill="none" stroke="${INK}" stroke-width="1.3"/>`;
  },
  cube(pal, rng) {
    const cube = (x, y, s) => `
      <polygon points="${x},${y} ${x + s},${y - s * 0.4} ${x + s * 2},${y} ${x + s},${y + s * 0.4}" fill="${pal[2]}" stroke="${INK}" stroke-width="1"/>
      <polygon points="${x},${y} ${x + s},${y + s * 0.4} ${x + s},${y + s * 1.5} ${x},${y + s * 1.1}" fill="${pal[1]}" stroke="${INK}" stroke-width="1"/>
      <polygon points="${x + s},${y + s * 0.4} ${x + s * 2},${y} ${x + s * 2},${y + s * 1.1} ${x + s},${y + s * 1.5}" fill="${pal[0]}" stroke="${INK}" stroke-width="1"/>
      ${[0.35, 0.6, 0.85].map(q => `<line x1="${x + s + 2}" y1="${y + s * 0.4 + (s * 1.1) * q}" x2="${x + s * 2 - 2}" y2="${y + (s * 1.1) * q}" stroke="${INK}" stroke-width=".5" opacity=".45"/>`).join("")}`;
    return _matrix(rng, 102, 72) + cube(30, 62, 17) + cube(56, 48, 22) + cube(50, 80, 12);
  },
  octa(pal, rng) {
    const cx = 60, top = 22, bot = 96, mid = 59, w = 33;
    return `<ellipse cx="60" cy="99" rx="30" ry="4" fill="${INK}" opacity=".14"/>
      ${_poly([[cx, top], [cx - w, mid], [cx, bot]], pal[1])}
      ${_poly([[cx, top], [cx + w, mid], [cx, bot]], pal[0])}
      ${_poly([[cx, top], [cx - w * 0.28, mid + 4], [cx, bot]], pal[2], `opacity=".85"`)}
      <line x1="${cx - w}" y1="${mid}" x2="${cx + w}" y2="${mid}" stroke="${INK}" stroke-width=".7" opacity=".6"/>
      <polygon points="${_pts([[cx, top], [cx - w, mid], [cx, bot], [cx + w, mid]])}" fill="none" stroke="${INK}" stroke-width="1.3"/>`;
  },
  blade(pal, rng) {
    const blade = (x, y, len, w, rot) => `<g transform="rotate(${rot} ${x} ${y})">
      <polygon points="${x},${y} ${x + w},${y - 4} ${x + w},${y - len} ${x},${y - len + 6}" fill="${pal[0]}" stroke="${INK}" stroke-width="1.1"/>
      <polygon points="${x + w},${y - 4} ${x + w + 5},${y - 8} ${x + w + 5},${y - len - 3} ${x + w},${y - len}" fill="${pal[1]}" stroke="${INK}" stroke-width="1.1"/>
      ${[0.3, 0.55, 0.8].map(q => `<line x1="${x + w * q}" y1="${y - 2 - q * 3}" x2="${x + w * q}" y2="${y - len + 5 - q * 2}" stroke="${pal[2]}" stroke-width="1.2" opacity=".7"/>`).join("")}
    </g>`;
    return _matrix(rng, 102, 62) +
      blade(42, 100, 62, 15, -10 + rng() * 4) + blade(64, 100, 46, 12, 12 + rng() * 5);
  },
};

/* 產生一張復古插圖 SVG（含斜線陰影 overlay） */
function crystalSVG(c, cls = "") {
  const rng = crystalRng(c.id);
  const seq = ++_svgSeq;
  const body = (CRYSTAL_FORMS[c.form] || CRYSTAL_FORMS.tumbled)(c.pal, rng);
  return `<svg class="${cls}" viewBox="0 0 120 120" role="img" aria-label="${esc(c.zh)}插圖" stroke-linejoin="round">
    <defs><pattern id="hatch${seq}" width="4" height="4" patternTransform="rotate(38)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="4" stroke="${INK}" stroke-width=".55"/></pattern></defs>
    ${body}
    <rect x="0" y="0" width="120" height="120" fill="url(#hatch${seq})" opacity=".13" style="mix-blend-mode:multiply"/>
  </svg>`;
}

/* ============================================================
   月相 × 水晶搭配
   ============================================================ */
function crystalsForMoon(kind, limit = 6) {
  const key = kind === "new" ? "nm" : "fm";
  return [...CRYSTAL_DB].sort((a, b) => b[key] - a[key] || a.zh.localeCompare(b.zh)).filter(c => c[key] >= 2).slice(0, limit);
}
function crystalOfTheDay() {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  return CRYSTAL_DB[(dayOfYear * 7 + now.getFullYear()) % CRYSTAL_DB.length];
}
/* 顯化儀式裡的水晶建議（app.js 的 openManifestRitual 會呼叫） */
function crystalRitualHintHTML() {
  const info = moonInfo(new Date());
  const isWaxing = info.age <= SYNODIC / 2; /* 新月→滿月屬「種下」，滿月→新月屬「釋放感恩」 */
  const picks = crystalsForMoon(isWaxing ? "new" : "full", 3);
  return `<p class="muted small">${info.e} ${esc(info.n)}・適合搭配的水晶：${picks.map(c =>
    `<a href="#" class="crystal-hint-link" data-cid="${c.id}">${esc(c.zh)}</a>`).join("・")}
    <br>手邊若有，握在左手（傳統上左進右出）一起進行儀式。</p>`;
}

/* ============================================================
   許願 × 水晶儀式教學
   ============================================================ */
const CRYSTAL_RITUALS = {
  newmoon: { icon: "🌑", name: "新月許願 × 水晶", when: "新月當天起 48 小時內",
    crystals: ["citrine", "green-phantom", "rose-quartz", "rhodochrosite", "clear-quartz", "blue-apatite"],
    steps: [
      "淨化空間與水晶（薰香繞三圈，或提前一晚放晶簇上）",
      "依願望挑水晶：財富事業＝黃水晶／綠幽靈；感情＝粉晶／紅紋石；目標清單＝藍磷灰石；不確定就用白水晶",
      "在紙上寫下 2～10 個願望，用現在式肯定句（「我正在……」「我已經……」）",
      "把水晶壓在願望紙上，握手成杯狀罩著它，閉眼觀想每個願望實現的畫面各 30 秒",
      "說「這個或更好的，正以最高善的方式來到我身上」，把紙折好與水晶一起放到下個滿月",
    ] },
  fullmoon: { icon: "🌕", name: "滿月感恩・釋放 × 水晶", when: "滿月前後各一天",
    crystals: ["moonstone", "obsidian", "smoky-quartz", "black-tourmaline", "labradorite", "lepidolite"],
    steps: [
      "回顧上個新月的願望紙：實現的說謝謝，未實現的問自己「還想要嗎？」",
      "拿一顆釋放系水晶（黑曜石／煙晶／黑碧璽），寫下想放下的人事物或情緒",
      "握著水晶把清單讀一遍，深呼吸三次，想像它們隨吐氣離開身體",
      "把清單撕掉丟棄或燒掉；水晶用月光淨化一夜，象徵一切歸零",
      "結尾寫三件感恩的事—滿月是收成，感恩讓豐盛循環",
    ] },
  charge: { icon: "🌝", name: "滿月消磁・充能月光浴", when: "滿月夜（陰天也有效，月光穿雲）",
    crystals: ["clear-quartz", "moonstone", "selenite", "amethyst", "super-seven", "herkimer"],
    steps: [
      "把常戴的水晶取下，用軟布輕拭灰塵與皮脂",
      "檢查禁忌：怕水的（透石膏／孔雀石／黃鐵礦／天使石）跳過流水，直接曬月光",
      "放在窗台或陽台（窗戶玻璃內側也可），托盤鋪白布或放透石膏板上加乘",
      "月光浴一夜；日出前收回（怕曬的紫晶、粉晶請避開陽光直射）",
      "收回時握在手心說一句感謝，重新設定它接下來一個月的任務（意圖）",
    ] },
  grid: { icon: "✨", name: "顯化水晶陣 Crystal Grid", when: "任何想加強顯化的時刻，新月尤佳",
    crystals: ["clear-quartz", "citrine", "rutilated-quartz", "rose-quartz", "amethyst", "green-aventurine"],
    steps: [
      "選一個主題（財富／愛情／健康），中心放一顆主水晶（原石或晶柱最佳，能量指向宇宙）",
      "外圈以 6 或 8 顆小水晶對稱圍繞（幾何對稱＝意圖聚焦），可墊神聖幾何陣布",
      "把寫好的願望紙折小放在主水晶原石下方",
      "用一根白水晶柱從外圈依序「畫線」連到中心，像接通電路、連接宇宙訊號",
      "放在不受打擾的角落至少一個月相週期（約 29.5 天），每逢新月滿月靜心一分鐘重新觀想",
    ] },
};

/* ============================================================
   主畫面：水晶分頁
   ============================================================ */
let _crystalFilter = { use: "", moon: "", q: "" };

/* 對外連結（想換直接改這兩行） */
const SOURCING_LINE_URL = "https://lin.ee/NhElh5L";              // Blue 的 LINE 官方帳號
const VAULT_IG_URL = "https://www.instagram.com/blueicn/";        // Blue 的原礦寶庫 IG

function renderCrystal() {
  const el = $("#view-crystal");
  const cod = crystalOfTheDay();
  const info = moonInfo(new Date());
  const isWaxing = info.age <= SYNODIC / 2;
  const moonPicks = crystalsForMoon(isWaxing ? "new" : "full", 4);
  const col = store.data.crystals || [];
  const brc = store.data.bracelets || [];

  el.innerHTML = `
    <div class="card">
      <h2>💎 今日水晶 <span class="sub">${info.e} ${esc(info.n)}・月亮 ${info.illum}%</span></h2>
      <button type="button" class="cod-row" data-cid="${cod.id}">
        <div class="cod-fig">${crystalSVG(cod)}</div>
        <div class="cod-txt">
          <b>${esc(cod.zh)}</b> <span class="cod-en">${esc(cod.en)}</span>
          <p class="muted small">${esc(cod.fx[0])}・${esc(cod.fx[1] || "")}</p>
          <p class="small cod-lore">${esc(cod.lore)}</p>
        </div>
      </button>
      <p class="muted small" style="margin-top:8px">${info.e} ${isWaxing ? "月亮漸盈，適合「種下意圖」的水晶：" : "月亮漸虧，適合「感恩釋放・充能」的水晶："}
        ${moonPicks.map(c => `<a href="#" class="crystal-hint-link" data-cid="${c.id}">${esc(c.zh)}</a>`).join("・")}</p>
    </div>

    <div class="card bracelet-card">
      <h2>💫 訂製你的專屬水晶手鍊</h2>
      <p class="muted small">由 Crystibee 1:1 客製化，依你的命盤五行設計最適合你的水晶飾品。</p>
      <div class="btn-row">
        <a class="btn bracelet-btn" href="https://crystibee.cashier.ecpay.com.tw/product/000000000562210" target="_blank" rel="noopener">✨ 前往 Crystibee 訂製</a>
      </div>
    </div>

    <div class="card">
      <h2>🗄 我的水晶原礦收藏架 <span class="sub">${col.length} 顆</span></h2>
      <p class="muted small">拍下你買回家的原礦，記錄日期・地點・價格，蒐集成一張自己的博物圖鑑海報。
      放進來的種類，會在下方圖鑑裡自動加上金色外框。</p>
      <div id="crystal-shelf"></div>
      <div class="btn-row">
        <button class="btn" id="col-add">📷 收藏一顆新原礦</button>
        ${col.length ? `<button class="btn secondary" id="col-stats">📊 收藏統計</button>` : ""}
      </div>
    </div>

    <div class="card">
      <h2>📿 我的客製化個人水晶手鍊收藏庫 <span class="sub">${brc.length} 條</span></h2>
      <p class="muted small">Crystibee 為您訂製的，別的地方買的也可以放進來。</p>
      <div id="bracelet-shelf"></div>
      <div class="btn-row">
        <button class="btn" id="brc-add">📷 收藏一條手鍊</button>
        ${brc.length ? `<button class="btn secondary" id="brc-stats">📊 手鍊統計</button>` : ""}
      </div>
    </div>

    <div class="card">
      <h2>📖 水晶圖鑑 <span class="sub">Minéralogie・${CRYSTAL_DB.length} 種</span></h2>
      <input type="search" id="cf-q" placeholder="搜尋中英文名稱、功效…" value="${esc(_crystalFilter.q)}">
      <div class="crystal-filters" id="cf-use">
        ${Object.entries(CRYSTAL_USES).map(([k, e]) => `<button type="button" class="chip ${_crystalFilter.use === k ? "on" : ""}" data-v="${k}">${e} ${k}</button>`).join("")}
      </div>
      <div class="crystal-filters" id="cf-moon">
        <button type="button" class="chip ${_crystalFilter.moon === "new" ? "on" : ""}" data-v="new">🌑 新月許願</button>
        <button type="button" class="chip ${_crystalFilter.moon === "full" ? "on" : ""}" data-v="full">🌕 滿月釋放充能</button>
      </div>
      <div id="crystal-poster"></div>
    </div>

    <div class="card">
      <h2>🕯 許願 × 水晶教學</h2>
      <p class="muted small">跟著月亮的呼吸使用水晶：新月種下、滿月收成與放下。</p>
      <div class="btn-col">
        ${Object.entries(CRYSTAL_RITUALS).map(([k, r]) =>
          `<button class="btn secondary ritual-open" data-rk="${k}">${r.icon} ${esc(r.name)}</button>`).join("")}
      </div>
    </div>

    <div class="card">
      <h2>🔎 想入手原礦嗎？Blue 可以幫你代尋</h2>
      <p class="muted small">還能為您確認能量，詳情請洽 LINE 官方帳號。</p>
      <div class="btn-row">
        <a class="btn" href="${SOURCING_LINE_URL}" target="_blank" rel="noopener">💬 用 LINE 找 Blue 代尋</a>
      </div>
    </div>

    <div class="card">
      <h2>🏛 Blue 親自挑選的原礦寶庫在等你</h2>
      <p class="muted small">每一顆都由 Blue 親手挑過、確認過能量，在 Instagram 陸續上架。</p>
      <div class="btn-row">
        <a class="btn secondary" href="${VAULT_IG_URL}" target="_blank" rel="noopener">📸 前往 Instagram 逛寶庫</a>
      </div>
    </div>

    <p class="disclaimer">水晶功效為各文化民俗與能量傳統之整理，屬心靈儀式與自我紀錄用途，非科學實證、不能替代醫療。</p>`;

  renderCrystalShelf();
  renderBraceletShelf();
  renderCrystalPoster();

  $(".cod-row", el).addEventListener("click", () => openCrystalDetail(cod.id));
  $("#col-add", el).addEventListener("click", () => openCollectForm({}));
  $("#col-stats", el)?.addEventListener("click", openCollectionStats);
  $("#brc-add", el).addEventListener("click", () => openBraceletForm({}));
  $("#brc-stats", el)?.addEventListener("click", openBraceletStats);
  $("#cf-q", el).addEventListener("input", e => { _crystalFilter.q = e.target.value.trim(); renderCrystalPoster(); });
  $("#cf-use", el).addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    _crystalFilter.use = _crystalFilter.use === b.dataset.v ? "" : b.dataset.v;
    $$(".chip", $("#cf-use", el)).forEach(c => c.classList.toggle("on", c.dataset.v === _crystalFilter.use));
    renderCrystalPoster();
  });
  $("#cf-moon", el).addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    _crystalFilter.moon = _crystalFilter.moon === b.dataset.v ? "" : b.dataset.v;
    $$(".chip", $("#cf-moon", el)).forEach(c => c.classList.toggle("on", c.dataset.v === _crystalFilter.moon));
    renderCrystalPoster();
  });
  $$(".ritual-open", el).forEach(b => b.addEventListener("click", () => openCrystalRitual(b.dataset.rk)));
}

/* 圖鑑海報（Minéralogie 復古排版） */
function filteredCrystals() {
  const { use, moon, q } = _crystalFilter;
  return CRYSTAL_DB.filter(c => {
    if (use && !c.uses.includes(use)) return false;
    if (moon === "new" && c.nm < 2) return false;
    if (moon === "full" && c.fm < 2) return false;
    if (q) {
      const hay = [c.zh, c.en, c.alias, c.family, ...c.fx, ...(c.common || []), ...c.uses].join(" ").toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });
}
function renderCrystalPoster() {
  const box = $("#crystal-poster");
  if (!box) return;
  const list = filteredCrystals();
  const showSuggest = !_crystalFilter.q && !_crystalFilter.use && !_crystalFilter.moon;
  // 收藏架上已經有的種類 → 圖鑑對應那格加金色外框，一眼看出自己蒐集到哪了
  const ownedIds = new Set((store.data.crystals || []).map(x => x.crystalId).filter(Boolean));
  box.innerHTML = `
    <div class="mineral-poster">
      <div class="mp-title">MINÉRALOGIE</div>
      <div class="mp-subtitle">— 水晶礦石圖鑑 —</div>
      ${ownedIds.size ? `<p class="mp-owned-note">✦ 金框 ${ownedIds.size} 種＝你的收藏架上已經有了</p>` : ""}
      <div class="mp-grid">
        ${list.map(c => `
          <button type="button" class="mp-item ${ownedIds.has(c.id) ? "mp-owned" : ""}" data-cid="${c.id}"
            ${ownedIds.has(c.id) ? `title="收藏架上已有${esc(c.zh)}"` : ""}>
            <span class="mp-num">${CRYSTAL_DB.indexOf(c) + 1}.</span>
            <span class="mp-fig">${crystalSVG(c)}</span>
            <span class="mp-name">${esc(c.zh)}<small>${esc(c.en)}</small></span>
          </button>`).join("") || `<p class="muted small" style="grid-column:1/-1;text-align:center">沒有符合的水晶，換個條件試試 ✨</p>`}
        ${showSuggest ? `
          <button type="button" class="mp-item mp-suggest" id="mp-suggest">
            <span class="mp-num">${CRYSTAL_DB.length + 1}.</span>
            <span class="mp-fig"><span class="mp-suggest-glyph">＋</span></span>
            <span class="mp-name">新水晶種類建議<small>Suggest a new one</small></span>
          </button>` : ""}
      </div>
      <div class="mp-footer">· ORDRE DES MATIÈRES ·<br>
        <span>${list.slice(0, 24).map((c, i) => `${CRYSTAL_DB.indexOf(c) + 1}. ${esc(c.en)}`).join(" — ")}${list.length > 24 ? " — …" : ""}</span>
      </div>
    </div>`;
  $$(".mp-item", box).forEach(b => {
    if (b.id === "mp-suggest") return;
    b.addEventListener("click", () => openCrystalDetail(b.dataset.cid));
  });
  $("#mp-suggest", box)?.addEventListener("click", openCrystalSuggestForm);
}

/* 新水晶種類建議：把使用者的想法送給 Blue（透過 /api/register 或本機收件匣） */
function openCrystalSuggestForm() {
  const m = modal(`
    <h3>＋ 新水晶種類建議</h3>
    <p class="muted small">想收藏但圖鑑裡還沒有？把它告訴 Blue，之後版本會補進來。</p>
    <label class="field">水晶中／英文名稱</label>
    <input type="text" id="cs-name" placeholder="例：拉利瑪、Ocean Jasper⋯">
    <label class="field">你想被記住的原因（選填）</label>
    <textarea id="cs-why" style="min-height:64px" placeholder="這顆水晶對你的意義、或為什麼想放進圖鑑⋯"></textarea>
    <div class="btn-row">
      <button class="btn" id="cs-send">送出 — 謝謝你的意見 🩵</button>
      <button class="btn secondary" id="cs-cancel">取消</button>
    </div>`);
  $("#cs-cancel", m).addEventListener("click", () => m.remove());
  $("#cs-send", m).addEventListener("click", async () => {
    const name = $("#cs-name", m).value.trim();
    const why = $("#cs-why", m).value.trim();
    if (!name) return toast("先告訴我水晶的名稱");
    // 本機收件匣（離線也不會遺失）
    store.data.settings.crystalSuggestions ||= [];
    store.data.settings.crystalSuggestions.push({ name, why, at: new Date().toISOString() });
    store.save();
    // 有帳號就順便寄回後端
    try {
      const email = (typeof Account !== "undefined" && Account.email)
        || store.data.settings.account?.email || "";   // 舊版本機帳號留下的 email，還在就一併帶上
      await fetch("api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, kind: "crystal-suggest", name, why }),
      });
    } catch {}
    m.remove();
    toast("已送出，謝謝你的意見 🩵 未來版本會補進圖鑑");
  });
}

/* 詳細頁 */
function openCrystalDetail(cid) {
  const c = CRYSTAL_BY_ID[cid];
  if (!c) return;
  const owned = (store.data.crystals || []).filter(x => x.crystalId === cid);
  const moonTags = [c.nm >= 2 ? "🌑 新月許願" : "", c.fm >= 2 ? "🌕 滿月釋放充能" : ""].filter(Boolean).join("・");
  const m = modal(`
    <div class="cd-head">
      <div class="cd-fig mineral-paper">${crystalSVG(c)}</div>
      <div>
        <h3 style="margin:0">${esc(c.zh)}</h3>
        <p class="cd-en">${esc(c.en)}</p>
        <p class="muted small">${esc(c.alias)}・${esc(c.family)}</p>
        <p class="small">${c.chakra.map(k => `<span class="chakra-dot" style="background:${CHAKRAS[k]?.c || "#999"}"></span>${esc(k)}`).join(" ")}
          ・${esc(c.element)}元素・硬度 ${esc(c.hard)}</p>
      </div>
    </div>
    <div class="socratic">${c.fx.map(f => `✦ ${esc(f)}`).join("<br>")}</div>
    ${c.common?.length ? `<p class="small"><b>🌟 最常見的功效</b></p>
      <div class="fx-tags">${c.common.map(f => `<span class="fx-tag">${esc(f)}</span>`).join("")}</div>` : ""}
    <p class="small"><b>🏷 用途</b>：${c.uses.map(u => `${CRYSTAL_USES[u]} ${u}`).join("・")}</p>
    ${moonTags ? `<p class="small"><b>🌙 月相搭配</b>：${moonTags}<br><span class="muted">${esc(c.moonNote)}</span></p>` : `<p class="small muted">${esc(c.moonNote)}</p>`}
    <p class="small"><b>🕊 淨化</b>：${c.cleanse.map(esc).join("・")}</p>
    ${c.avoid.length ? `<p class="small" style="color:var(--danger)"><b>⚠️ 保養禁忌</b>：${c.avoid.map(esc).join("；")}</p>` : ""}
    <p class="small"><b>⛰ 主要產地</b>：${esc(c.origin)}</p>
    <p class="small muted cod-lore">📜 ${esc(c.lore)}</p>
    ${owned.length ? `<p class="small">🗄 你的收藏裡有 ${owned.length} 顆${esc(c.zh)}</p>` : ""}
    <div class="btn-row">
      <button class="btn" id="cd-collect">📷 我買了一顆，收藏它</button>
      <button class="btn secondary" id="cd-close">關閉</button>
    </div>`);
  $("#cd-close", m).addEventListener("click", () => m.remove());
  $("#cd-collect", m).addEventListener("click", () => { m.remove(); openCollectForm({ crystalId: cid }); });
}

/* ============================================================
   虛擬收藏架
   ============================================================ */
function renderCrystalShelf() {
  const box = $("#crystal-shelf");
  if (!box) return;
  const col = [...(store.data.crystals || [])].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  if (!col.length) {
    box.innerHTML = `<div class="mineral-poster mp-empty">
      <div class="mp-title" style="font-size:1.05em">MY COLLECTION</div>
      <p class="muted small" style="text-align:center;padding:14px 10px">收藏架還空著。<br>把你的第一顆水晶放上來吧 💎</p>
    </div>`;
    return;
  }
  box.innerHTML = `
    <div class="mineral-poster">
      <div class="mp-title">MY COLLECTION</div>
      <div class="mp-subtitle">— 我的水晶收藏 —</div>
      <div class="mp-grid">
        ${col.map((it, i) => {
          const c = CRYSTAL_BY_ID[it.crystalId];
          return `<button type="button" class="mp-item" data-id="${it.id}">
            <span class="mp-num">${col.length - i}.</span>
            <span class="mp-fig">${it.photoId
              ? `<img class="shelf-photo" data-photo="${esc(it.photoId)}" alt="${esc(it.name)}">`
              : (c ? crystalSVG(c) : `<span class="shelf-noimg">💎</span>`)}</span>
            <span class="mp-name">${esc(it.name)}<small>${esc(c?.en || it.enName || "")}</small></span>
          </button>`;
        }).join("")}
      </div>
      <div class="mp-footer">· ${col.length} SPÉCIMENS ·</div>
    </div>`;
  $$(".shelf-photo", box).forEach(img => renderPhoto(img, img.dataset.photo));
  $$(".mp-item", box).forEach(b => b.addEventListener("click", () => openCollectionItem(b.dataset.id)));
}

function openCollectionItem(id) {
  const it = (store.data.crystals || []).find(x => x.id === id);
  if (!it) return;
  const c = CRYSTAL_BY_ID[it.crystalId];
  const m = modal(`
    <div class="cd-head">
      <div class="cd-fig mineral-paper">${it.photoId ? `<img class="shelf-photo big" alt="${esc(it.name)}">` : (c ? crystalSVG(c) : "💎")}</div>
      <div>
        <h3 style="margin:0">${esc(it.name)}</h3>
        ${c ? `<p class="cd-en">${esc(c.en)}</p>` : ""}
        <p class="muted small">${[it.date && `📅 ${esc(it.date)}`, it.place && `📍 ${esc(it.place)}`, it.price && `💰 ${esc(it.price)} ${esc(it.currency || "")}`].filter(Boolean).join("<br>") || "尚未填寫購買資訊"}</p>
      </div>
    </div>
    ${it.intent ? `<p class="small"><b>🎯 給它的任務</b>：${esc(it.intent)}</p>` : ""}
    ${it.note ? `<p class="small muted">${esc(it.note)}</p>` : ""}
    ${c ? `<p class="small muted">✦ ${esc(c.fx[0])}・淨化：${c.cleanse.slice(0, 3).map(esc).join("・")}${c.avoid.length ? `<br>⚠️ ${esc(c.avoid[0])}` : ""}</p>` : ""}
    <div class="btn-row">
      ${c ? `<button class="btn secondary" id="ci-info">📖 圖鑑資料</button>` : ""}
      <button class="btn secondary" id="ci-edit">✏️ 編輯</button>
      <button class="btn ghost" id="ci-del">🗑</button>
      <button class="btn secondary" id="ci-close">關閉</button>
    </div>`);
  if (it.photoId) renderPhoto($(".shelf-photo", m), it.photoId);
  $("#ci-close", m).addEventListener("click", () => m.remove());
  $("#ci-info", m)?.addEventListener("click", () => { m.remove(); openCrystalDetail(it.crystalId); });
  $("#ci-edit", m).addEventListener("click", () => { m.remove(); openCollectForm({ existing: it }); });
  $("#ci-del", m).addEventListener("click", async () => {
    if (!confirm(`把「${it.name}」從收藏架移除？`)) return;
    if (it.photoId) await idb.del(it.photoId);
    store.data.crystals = store.data.crystals.filter(x => x.id !== id);
    store.save(); m.remove();
    if (currentTab === "crystal") renderCrystal(); else renderCrystalShelf();
    toast("已從收藏架移除");
  });
}

function openCollectForm({ crystalId = "", existing = null } = {}) {
  const it = existing || { crystalId, name: "", date: todayStr(), place: "", price: "", currency: "TWD", note: "", intent: "", photoId: "" };
  let photoData = null; /* 新選的照片 dataURL */
  const opts = CRYSTAL_DB.map(c => `<option value="${c.id}" ${c.id === it.crystalId ? "selected" : ""}>${esc(c.zh)} ${esc(c.en)}</option>`).join("");
  const m = modal(`
    <h3>${existing ? "✏️ 編輯收藏" : "📷 收藏一顆新水晶"}</h3>
    <label class="field">水晶種類（找不到可選「其他」再自訂名稱）</label>
    <select id="cl-kind"><option value="">— 其他／自訂 —</option>${opts}</select>
    <label class="field">名稱（自動帶入，可自己改，如「阿嬤送的紫晶洞」）</label>
    <input type="text" id="cl-name" value="${esc(it.name)}" placeholder="這顆水晶的名字">
    <label class="field">照片</label>
    <div class="btn-row">
      <button class="btn secondary" id="cl-photo-btn">📷 拍照／選照片</button>
      <span class="muted small" id="cl-photo-hint">${it.photoId ? "已有照片，可重新選擇" : "沒拍也沒關係，會用復古插圖代替"}</span>
    </div>
    <input type="file" id="cl-photo" accept="image/*" capture="environment" class="hidden">
    <div class="field-row">
      <div><label class="field">購入日期</label><input type="date" id="cl-date" value="${esc(it.date)}"></div>
      <div><label class="field">地點</label><input type="text" id="cl-place" value="${esc(it.place)}" placeholder="店名／城市／網購"></div>
    </div>
    <div class="field-row">
      <div><label class="field">價格</label><input type="number" id="cl-price" value="${esc(it.price)}" placeholder="0" min="0" step="any"></div>
      <div><label class="field">幣別</label><select id="cl-cur">${["TWD", "USD", "JPY", "EUR", "CNY", "THB"].map(c => `<option ${c === (it.currency || "TWD") ? "selected" : ""}>${c}</option>`).join("")}</select></div>
    </div>
    <label class="field">給它的任務（意圖，選填）</label>
    <input type="text" id="cl-intent" value="${esc(it.intent)}" placeholder="例：守護我的新工作順利">
    <label class="field">筆記（選填）</label>
    <textarea id="cl-note" style="min-height:48px" placeholder="購買的故事、當下的心情…">${esc(it.note)}</textarea>
    <div class="btn-row">
      <button class="btn" id="cl-save">${existing ? "儲存" : "放上收藏架 🗄"}</button>
      <button class="btn secondary" id="cl-cancel">取消</button>
    </div>`);
  const kindSel = $("#cl-kind", m), nameInp = $("#cl-name", m);
  kindSel.addEventListener("change", () => {
    const c = CRYSTAL_BY_ID[kindSel.value];
    if (c && (!nameInp.value.trim() || CRYSTAL_DB.some(x => x.zh === nameInp.value.trim()))) nameInp.value = c.zh;
  });
  if (!existing && crystalId) kindSel.dispatchEvent(new Event("change"));
  $("#cl-photo-btn", m).addEventListener("click", () => $("#cl-photo", m).click());
  $("#cl-photo", m).addEventListener("change", async e => {
    const f = e.target.files[0];
    if (!f) return;
    photoData = await photoToDataURL(f);
    $("#cl-photo-hint", m).textContent = "照片已選好 ✓";
  });
  $("#cl-cancel", m).addEventListener("click", () => m.remove());
  $("#cl-save", m).addEventListener("click", async () => {
    const name = nameInp.value.trim() || CRYSTAL_BY_ID[kindSel.value]?.zh || "我的水晶";
    const rec = {
      id: it.id || uid(), crystalId: kindSel.value, name,
      enName: CRYSTAL_BY_ID[kindSel.value]?.en || "",
      date: $("#cl-date", m).value, place: $("#cl-place", m).value.trim(),
      price: $("#cl-price", m).value, currency: $("#cl-cur", m).value,
      intent: $("#cl-intent", m).value.trim(), note: $("#cl-note", m).value.trim(),
      photoId: it.photoId || "",
    };
    if (photoData) {
      rec.photoId = rec.photoId || "cph_" + uid();
      await idb.put(rec.photoId, photoData);
    }
    store.data.crystals ||= [];
    const i = store.data.crystals.findIndex(x => x.id === rec.id);
    if (i >= 0) store.data.crystals[i] = rec; else store.data.crystals.push(rec);
    store.save(); m.remove();
    if (currentTab === "crystal") renderCrystal(); else renderCrystalShelf();
    toast(existing ? "已更新 💎" : "已放上收藏架 🗄✨");
  });
}

/* ============================================================
   我的客製化個人水晶手鍊收藏庫
   與原礦收藏架分開存（store.data.bracelets）：一條手鍊通常由多種水晶組成，
   資料形狀跟「一顆原礦」不一樣，混在同一個清單裡統計會失真。
   ============================================================ */
const BRACELET_SOURCES = ["Crystibee 訂製", "其他店家", "自己串的", "朋友送的"];

function renderBraceletShelf() {
  const box = $("#bracelet-shelf");
  if (!box) return;
  const list = [...(store.data.bracelets || [])].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  if (!list.length) {
    box.innerHTML = `<div class="mineral-poster mp-empty">
      <div class="mp-title" style="font-size:1.05em">MES BRACELETS</div>
      <p class="muted small" style="text-align:center;padding:14px 10px">手鍊收藏庫還空著。<br>把你手上那條放上來吧 📿</p>
    </div>`;
    return;
  }
  box.innerHTML = `
    <div class="mineral-poster">
      <div class="mp-title">MES BRACELETS</div>
      <div class="mp-subtitle">— 我的水晶手鍊 —</div>
      <div class="mp-grid">
        ${list.map((it, i) => {
          // 沒拍照就用組成水晶的插圖代替；一種都沒選就給一顆珠串符號
          const beads = (it.crystalIds || []).map(id => CRYSTAL_BY_ID[id]).filter(Boolean);
          return `<button type="button" class="mp-item" data-bid="${esc(it.id)}">
            <span class="mp-num">${list.length - i}.</span>
            <span class="mp-fig">${it.photoId
              ? `<img class="brc-photo" data-photo="${esc(it.photoId)}" alt="${esc(it.name)}">`
              : (beads.length ? `<span class="brc-beads">${beads.slice(0, 3).map(c => crystalSVG(c)).join("")}</span>`
                              : `<span class="shelf-noimg">📿</span>`)}</span>
            <span class="mp-name">${esc(it.name)}<small>${esc(it.source || "")}</small></span>
          </button>`;
        }).join("")}
      </div>
      <div class="mp-footer">· ${list.length} BRACELETS ·</div>
    </div>`;
  $$(".brc-photo", box).forEach(img => renderPhoto(img, img.dataset.photo));
  $$(".mp-item", box).forEach(b => b.addEventListener("click", () => openBraceletItem(b.dataset.bid)));
}

function openBraceletItem(id) {
  const it = (store.data.bracelets || []).find(x => x.id === id);
  if (!it) return;
  const beads = (it.crystalIds || []).map(cid => CRYSTAL_BY_ID[cid]).filter(Boolean);
  const m = modal(`
    <div class="cd-head">
      <div class="cd-fig mineral-paper">${it.photoId ? `<img class="brc-photo big" alt="${esc(it.name)}">`
        : (beads.length ? crystalSVG(beads[0]) : "📿")}</div>
      <div>
        <h3 style="margin:0">${esc(it.name)}</h3>
        ${it.source ? `<p class="cd-en">${esc(it.source)}</p>` : ""}
        <p class="muted small">${[it.date && `📅 ${esc(it.date)}`, it.place && `📍 ${esc(it.place)}`,
          it.price && `💰 ${esc(it.price)} ${esc(it.currency || "")}`].filter(Boolean).join("<br>") || "尚未填寫購入資訊"}</p>
      </div>
    </div>
    ${beads.length ? `<p class="small"><b>📿 組成水晶</b></p>
      <div class="ritual-crystals">${beads.map(c =>
        `<button type="button" class="rc-chip" data-cid="${c.id}"><span class="rc-fig">${crystalSVG(c)}</span>${esc(c.zh)}</button>`).join("")}</div>` : ""}
    ${it.intent ? `<p class="small"><b>🎯 給它的任務</b>：${esc(it.intent)}</p>` : ""}
    ${it.note ? `<p class="small muted">${esc(it.note)}</p>` : ""}
    ${beads.some(c => c.avoid.length) ? `<p class="small" style="color:var(--danger)"><b>⚠️ 保養提醒</b>：
      整條手鍊要遷就最脆弱的那一顆——${esc(beads.filter(c => c.avoid.length).map(c => `${c.zh}：${c.avoid[0]}`).join("；"))}</p>` : ""}
    <div class="btn-row">
      <button class="btn secondary" id="bi-edit">✏️ 編輯</button>
      <button class="btn ghost" id="bi-del">🗑</button>
      <button class="btn secondary" id="bi-close">關閉</button>
    </div>`);
  if (it.photoId) renderPhoto($(".brc-photo", m), it.photoId);
  $("#bi-close", m).addEventListener("click", () => m.remove());
  $("#bi-edit", m).addEventListener("click", () => { m.remove(); openBraceletForm({ existing: it }); });
  $$(".rc-chip", m).forEach(b => b.addEventListener("click", () => { m.remove(); openCrystalDetail(b.dataset.cid); }));
  $("#bi-del", m).addEventListener("click", async () => {
    if (!confirm(`把「${it.name}」從手鍊收藏庫移除？`)) return;
    if (it.photoId) await idb.del(it.photoId);
    store.data.bracelets = store.data.bracelets.filter(x => x.id !== id);
    store.save(); m.remove();
    if (currentTab === "crystal") renderCrystal(); else renderBraceletShelf();
    toast("已從手鍊收藏庫移除");
  });
}

function openBraceletForm({ existing = null } = {}) {
  const it = existing || {
    name: "", source: BRACELET_SOURCES[0], crystalIds: [], date: todayStr(),
    place: "", price: "", currency: "TWD", intent: "", note: "", photoId: "",
  };
  let photoData = null;
  const m = modal(`
    <h3>${existing ? "✏️ 編輯手鍊" : "📷 收藏一條手鍊"}</h3>
    <label class="field">手鍊名稱</label>
    <input type="text" id="bl-name" value="${esc(it.name)}" placeholder="例：招財主戰手鍊、生日訂製款">
    <label class="field">來源</label>
    <select id="bl-source">${BRACELET_SOURCES.map(s =>
      `<option ${s === it.source ? "selected" : ""}>${esc(s)}</option>`).join("")}</select>
    <label class="field">用了哪些水晶（可複選，會自動彙整保養禁忌）</label>
    <div class="crystal-filters brc-pick" id="bl-beads">
      ${CRYSTAL_DB.map(c => `<button type="button" class="chip ${(it.crystalIds || []).includes(c.id) ? "on" : ""}" data-v="${c.id}">${esc(c.zh)}</button>`).join("")}
    </div>
    <label class="field">照片</label>
    <div class="btn-row">
      <button class="btn secondary" id="bl-photo-btn">📷 拍照／選照片</button>
      <span class="muted small" id="bl-photo-hint">${it.photoId ? "已有照片，可重新選擇" : "沒拍也沒關係，會用組成水晶的插圖代替"}</span>
    </div>
    <input type="file" id="bl-photo" accept="image/*" capture="environment" class="hidden">
    <div class="field-row">
      <div><label class="field">入手日期</label><input type="date" id="bl-date" value="${esc(it.date)}"></div>
      <div><label class="field">地點／通路</label><input type="text" id="bl-place" value="${esc(it.place)}" placeholder="Crystibee／店名／網購"></div>
    </div>
    <div class="field-row">
      <div><label class="field">價格</label><input type="number" id="bl-price" value="${esc(it.price)}" placeholder="0" min="0" step="any"></div>
      <div><label class="field">幣別</label><select id="bl-cur">${["TWD", "USD", "JPY", "EUR", "CNY", "THB"].map(c =>
        `<option ${c === (it.currency || "TWD") ? "selected" : ""}>${c}</option>`).join("")}</select></div>
    </div>
    <label class="field">給它的任務（意圖，選填）</label>
    <input type="text" id="bl-intent" value="${esc(it.intent)}" placeholder="例：今年談成三個大案子">
    <label class="field">筆記（選填）</label>
    <textarea id="bl-note" style="min-height:48px" placeholder="訂製的緣由、當時的心情、設計師怎麼說…">${esc(it.note)}</textarea>
    <div class="btn-row">
      <button class="btn" id="bl-save">${existing ? "儲存" : "放進收藏庫 📿"}</button>
      <button class="btn secondary" id="bl-cancel">取消</button>
    </div>`);
  const beadsBox = $("#bl-beads", m);
  beadsBox.onclick = e => {
    const c = e.target.closest(".chip");
    if (c) c.classList.toggle("on");
  };
  $("#bl-photo-btn", m).addEventListener("click", () => $("#bl-photo", m).click());
  $("#bl-photo", m).addEventListener("change", async e => {
    const f = e.target.files[0];
    if (!f) return;
    photoData = await photoToDataURL(f);
    $("#bl-photo-hint", m).textContent = "照片已選好 ✓";
  });
  $("#bl-cancel", m).addEventListener("click", () => m.remove());
  $("#bl-save", m).addEventListener("click", async () => {
    const rec = {
      id: it.id || uid(),
      name: $("#bl-name", m).value.trim() || "我的水晶手鍊",
      source: $("#bl-source", m).value,
      crystalIds: $$(".chip.on", beadsBox).map(c => c.dataset.v),
      date: $("#bl-date", m).value, place: $("#bl-place", m).value.trim(),
      price: $("#bl-price", m).value, currency: $("#bl-cur", m).value,
      intent: $("#bl-intent", m).value.trim(), note: $("#bl-note", m).value.trim(),
      photoId: it.photoId || "",
    };
    if (photoData) {
      rec.photoId = rec.photoId || "bph_" + uid();
      await idb.put(rec.photoId, photoData);
    }
    store.data.bracelets ||= [];
    const i = store.data.bracelets.findIndex(x => x.id === rec.id);
    if (i >= 0) store.data.bracelets[i] = rec; else store.data.bracelets.push(rec);
    store.save(); m.remove();
    if (currentTab === "crystal") renderCrystal(); else renderBraceletShelf();
    toast(existing ? "已更新 📿" : "已放進手鍊收藏庫 📿✨");
  });
}

function openBraceletStats() {
  const list = store.data.bracelets || [];
  const byCur = {};
  for (const it of list) {
    const p = parseFloat(it.price);
    if (!isNaN(p) && p > 0) byCur[it.currency || "TWD"] = (byCur[it.currency || "TWD"] || 0) + p;
  }
  const beadCount = {};
  for (const it of list) for (const id of it.crystalIds || []) beadCount[id] = (beadCount[id] || 0) + 1;
  const topBeads = Object.entries(beadCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const bySource = {};
  for (const it of list) bySource[it.source || "未分類"] = (bySource[it.source || "未分類"] || 0) + 1;
  const first = [...list].filter(x => x.date).sort((a, b) => a.date.localeCompare(b.date))[0];
  const m = modal(`
    <h3>📊 手鍊統計</h3>
    <div class="socratic">
      📿 共 <b>${list.length}</b> 條手鍊
      ${first ? `<br>📅 從 ${esc(first.date)} 開始（${esc(first.name)}）` : ""}
      ${Object.keys(byCur).length ? `<br>💰 累計投入：${Object.entries(byCur).map(([c, v]) => `${v.toLocaleString()} ${c}`).join("＋")}` : ""}
      ${Object.keys(bySource).length ? `<br>🏬 來源：${Object.entries(bySource).map(([s, n]) => `${esc(s)} ${n}`).join("・")}` : ""}
      ${topBeads.length ? `<br>💎 最常出現的水晶：${topBeads.map(([id, n]) => `${esc(CRYSTAL_BY_ID[id]?.zh || id)}（${n}）`).join("・")}` : ""}
    </div>
    ${topBeads.length ? `<p class="muted small">同一種水晶反覆出現，通常代表那是你這陣子最想補的能量。</p>` : ""}
    <div class="btn-row"><button class="btn secondary" id="bs-close">關閉</button></div>`);
  $("#bs-close", m).addEventListener("click", () => m.remove());
}

function openCollectionStats() {
  const col = store.data.crystals || [];
  const byCur = {};
  for (const it of col) {
    const p = parseFloat(it.price);
    if (!isNaN(p) && p > 0) byCur[it.currency || "TWD"] = (byCur[it.currency || "TWD"] || 0) + p;
  }
  const useCount = {};
  for (const it of col) for (const u of CRYSTAL_BY_ID[it.crystalId]?.uses || []) useCount[u] = (useCount[u] || 0) + 1;
  const topUses = Object.entries(useCount).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const first = [...col].filter(x => x.date).sort((a, b) => a.date.localeCompare(b.date))[0];
  const m = modal(`
    <h3>📊 收藏統計</h3>
    <div class="socratic">
      🗄 共 <b>${col.length}</b> 顆水晶
      ${first ? `<br>📅 收藏始於 ${esc(first.date)}（${esc(first.name)}）` : ""}
      ${Object.keys(byCur).length ? `<br>💰 累計投入：${Object.entries(byCur).map(([c, v]) => `${v.toLocaleString()} ${c}`).join("＋")}` : ""}
      ${topUses.length ? `<br>🏷 你最常收藏的能量：${topUses.map(([u, n]) => `${CRYSTAL_USES[u]} ${u}（${n}）`).join("・")}` : ""}
    </div>
    ${topUses.length ? `<p class="muted small">收藏會說話——你最近在為「${topUses[0][0]}」補充能量。也許可以逛逛圖鑑裡同類的其他夥伴？</p>` : ""}
    <div class="btn-row"><button class="btn secondary" id="cs-close">關閉</button></div>`);
  $("#cs-close", m).addEventListener("click", () => m.remove());
}

/* 儀式教學 modal */
function openCrystalRitual(key) {
  const r = CRYSTAL_RITUALS[key];
  if (!r) return;
  const m = modal(`
    <h3>${r.icon} ${esc(r.name)}</h3>
    <p class="muted small">⏰ 時機：${esc(r.when)}</p>
    <div class="ritual-crystals">${r.crystals.map(cid => {
      const c = CRYSTAL_BY_ID[cid];
      return `<button type="button" class="rc-chip" data-cid="${cid}"><span class="rc-fig">${crystalSVG(c)}</span>${esc(c.zh)}</button>`;
    }).join("")}</div>
    <ol class="ritual-steps">${r.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol>
    <div class="btn-row">
      ${key === "newmoon" || key === "fullmoon" ? `<button class="btn" id="rt-go">🕯 開始顯化儀式</button>` : ""}
      <button class="btn secondary" id="rt-close">關閉</button>
    </div>`);
  $("#rt-close", m).addEventListener("click", () => m.remove());
  $("#rt-go", m)?.addEventListener("click", () => { m.remove(); openManifestRitual(); });
  $$(".rc-chip", m).forEach(b => b.addEventListener("click", () => { m.remove(); openCrystalDetail(b.dataset.cid); }));
}

/* 全域：點任何「水晶提示連結」都開詳細頁（含顯化儀式 modal 內） */
document.addEventListener("click", e => {
  const a = e.target.closest(".crystal-hint-link");
  if (!a) return;
  e.preventDefault();
  openCrystalDetail(a.dataset.cid);
});
