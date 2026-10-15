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

/* 取到小數一位，讓 SVG 字串短一點 */
const _r1 = n => Math.round(n * 10) / 10;
let _incSeq = 0;

/* 單根晶柱（六方柱＋錐頂的側視三面）；供 point/cluster 重用。
   inc = { fn, rng, col }：要在晶體內部疊的紋理（鈦晶針、兔毛、幽靈層…），見 POINT_INC。 */
function _pointAt(cx, baseY, h, w, pal, rot = 0, needles = 0, rng = Math.random, inc = null) {
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
  let overlay = "";
  if (inc) {
    /* 紋理一律裁在晶體輪廓內，才不會長到石頭外面；clipPath 放在旋轉群組裡，會跟著晶柱一起傾斜 */
    const id = `pinc${_svgSeq}_${_incSeq++}`;
    overlay = `<clipPath id="${id}"><polygon points="${_pts([[L, baseY], [L, shY], [cx, topY], [R, shY], [R, baseY]])}"/></clipPath>` +
      `<g clip-path="url(#${id})">${inc.fn({ cx, baseY, h, w, topY, shY, L, R }, inc.rng, inc.col, id)}</g>`;
  }
  return `<g transform="rotate(${rot} ${cx} ${baseY})">${faces}${needleLines}${overlay}</g>`;
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

/* ============================================================
   紋理疊層：同一種形狀，靠「內含物／光澤」區分石種。
   資料端只要在 CRYSTAL_DB 條目上寫 tex（種類）與 texCol（顏色）；variants[i] 可以覆蓋
   pal／tex／texCol，詳細頁切換品種時整張插圖就跟著換色。
   全部使用 crystalRng(id + "|tex") 的確定性亂數，同一顆每次長一樣，
   而且和底圖用的亂數分開——加紋理不會讓既有水晶的形狀位移。
   ============================================================ */

/* 晶柱內部（POINT）：g = 晶柱幾何 { cx, baseY, h, w, topY, shY, L, R } */
const POINT_INC = {
  /* 鈦晶／髮晶：細直針由下往上略散開；col 輪流取色（例：金針＋暗金、銅紅＋深褐、銀黑＋銀光） */
  needles(g, rng, col = ["#b8860b", "#8a6414"]) {
    let s = "";
    const n = Math.round(10 + g.h * 0.3);
    for (let i = 0; i < n; i++) {
      const x = g.L + g.w * (0.08 + rng() * 0.84), y = g.baseY - g.h * (0.05 + rng() * 0.62);
      const a = (rng() - 0.5) * 1.2, len = g.h * (0.14 + rng() * 0.3);
      s += `<line x1="${_r1(x)}" y1="${_r1(y)}" x2="${_r1(x + Math.sin(a) * len)}" y2="${_r1(y - Math.cos(a) * len)}" ` +
        `stroke="${col[i % col.length]}" stroke-width="${(0.45 + rng() * 0.7).toFixed(2)}" stroke-linecap="round" opacity="${(0.6 + rng() * 0.35).toFixed(2)}"/>`;
    }
    return s;
  },
  /* 黑髮晶：較粗的黑色電氣石針，從底部扇形放射 */
  tourm(g, rng, col = ["#16161b", "#34343e"]) {
    let s = "";
    const n = Math.round(8 + g.h * 0.2);
    for (let i = 0; i < n; i++) {
      const x0 = g.cx + (rng() - 0.5) * g.w * 0.55, y0 = g.baseY - g.h * (0.02 + rng() * 0.22);
      const a = (rng() - 0.5) * 1.7, len = g.h * (0.3 + rng() * 0.42);
      s += `<line x1="${_r1(x0)}" y1="${_r1(y0)}" x2="${_r1(x0 + Math.sin(a) * len)}" y2="${_r1(y0 - Math.cos(a) * len)}" ` +
        `stroke="${col[i % col.length]}" stroke-width="${(0.8 + rng() * 0.9).toFixed(2)}" stroke-linecap="round" opacity=".92"/>`;
    }
    return s;
  },
  /* 兔毛：一團一團的絨毛（柔霧）＋從絨團向四周伸出的短捲細絲；col = [毛色, 柔霧邊緣色] */
  hair(g, rng, col = ["#ffffff", "#cfd6e0"], uid = "hair") {
    let s = `<defs><radialGradient id="${uid}g"><stop offset="0" stop-color="${col[0]}" stop-opacity=".95"/>` +
      `<stop offset=".55" stop-color="${col[1]}" stop-opacity=".5"/><stop offset="1" stop-color="${col[1]}" stop-opacity="0"/></radialGradient></defs>`;
    const puffs = [], np = g.h > 50 ? 5 : 3;
    for (let i = 0; i < np; i++) {
      const x = g.cx + (rng() - 0.5) * g.w * 0.55, y = g.baseY - g.h * (0.14 + rng() * 0.5), r = g.w * (0.2 + rng() * 0.16);
      puffs.push([x, y, r]);
      s += `<circle cx="${_r1(x)}" cy="${_r1(y)}" r="${_r1(r)}" fill="url(#${uid}g)" opacity=".9"/>`;
    }
    for (const [x, y, r] of puffs) {
      for (let k = 0; k < 9; k++) {
        const a = rng() * Math.PI * 2, l = r * (0.7 + rng() * 0.8);
        const qx = x + Math.cos(a) * l * 0.5 + (rng() - 0.5) * 3, qy = y + Math.sin(a) * l * 0.5 + (rng() - 0.5) * 3;
        s += `<path d="M${_r1(x)} ${_r1(y)} Q${_r1(qx)} ${_r1(qy)} ${_r1(x + Math.cos(a + 0.55) * l)} ${_r1(y + Math.sin(a + 0.55) * l)}" ` +
          `fill="none" stroke="${col[k % 2 ? 1 : 0]}" stroke-width="${(0.4 + rng() * 0.35).toFixed(2)}" stroke-linecap="round" opacity=".85"/>`;
      }
    }
    return s;
  },
  /* 幽靈：晶體生長暫停時被覆上一層礦物，再繼續長大；col = 由外到內每層的顏色（一個＝單色幽靈） */
  phantom(g, rng, col = ["#6aa56a"]) {
    const n = col.length;
    let s = "";
    for (let k = 0; k < n; k++) {
      const sc = n === 1 ? 0.62 : 0.9 - k * (0.56 / (n - 1));    // 由外到內逐層縮小
      const px = g.cx, py = g.baseY + g.h * 0.12;                 // 縮放中心略低於底邊，讓幽靈「浮」在晶體裡
      const P = (x, y) => [px + (x - px) * sc, py + (y - py) * sc];
      s += _poly([P(g.L, g.baseY), P(g.L, g.shY), P(g.cx, g.topY), P(g.R, g.shY), P(g.R, g.baseY)],
        col[k], `opacity=".66" stroke="${INK}" stroke-width=".4" stroke-opacity=".35"`);
    }
    return s;
  },
  /* 膠花：鐵質雲霧＋由底部散開的花瓣狀薄片；col 輪流取色（紅＋黃＝錦鯉） */
  cloud(g, rng, col = ["#c0452e", "#e07a4a"]) {
    let s = "";
    for (let i = 0; i < 6; i++) {
      const x = g.cx + (rng() - 0.5) * g.w * 0.7, y = g.baseY - g.h * (0.1 + rng() * 0.5);
      s += `<ellipse cx="${_r1(x)}" cy="${_r1(y)}" rx="${_r1(g.w * (0.14 + rng() * 0.16))}" ry="${_r1(g.h * (0.05 + rng() * 0.07))}" ` +
        `fill="${col[i % col.length]}" opacity="${(0.32 + rng() * 0.25).toFixed(2)}" transform="rotate(${_r1((rng() - 0.5) * 40)} ${_r1(x)} ${_r1(y)})"/>`;
    }
    const bx = g.cx + (rng() - 0.5) * g.w * 0.3, by = g.baseY - g.h * 0.04;
    for (let i = 0; i < 7; i++) {
      const a = (i - 3) * 0.28 + (rng() - 0.5) * 0.15, len = g.h * (0.2 + rng() * 0.26);
      const tx = bx + Math.sin(a) * len, ty = by - Math.cos(a) * len;
      const qx = bx + Math.sin(a) * len * 0.3 + (rng() - 0.5) * 4, qy = by - Math.cos(a) * len * 0.6;
      s += `<path d="M${_r1(bx)} ${_r1(by)} Q${_r1(qx)} ${_r1(qy)} ${_r1(tx)} ${_r1(ty)}" fill="none" stroke="${col[i % col.length]}" ` +
        `stroke-width="${(1.8 + rng() * 1.8).toFixed(1)}" stroke-linecap="round" opacity=".5"/>`;
    }
    return s;
  },
};
/* 這幾種是「整塊標本都有」的內含物，小的衛星晶柱也要有；幽靈、膠花只畫在主晶柱 */
const POINT_INC_ALL = new Set(["needles", "tourm", "hair"]);
function _pointInc(c, salt = "") {
  const fn = c.tex && POINT_INC[c.tex];
  if (!fn) return null;
  if (salt && !POINT_INC_ALL.has(c.tex)) return null;
  return { fn, rng: crystalRng(`${c.id}|tex${salt}`), col: c.texCol };
}

/* 蛋面（CAB，橢圓 cx60 cy62 rx34 ry30）：回傳要疊在底色上的 SVG；seq 用來產生唯一 id */
const CAB_TEX = {
  /* 虎眼：平行絲光帶＋一道亮線（貓眼效應）。texCol = [主, 深, 亮]；texCol2 有值＝下半換成第二組（黃藍共生）；
     eye:false 時不畫亮線（南紅、矽孔雀石這類只借用條帶） */
  bands(rng, c, seq) {
    const cols = c.texCol || ["#c98f3d", "#6e4a1c", "#ecc37a"];
    const bandSet = cs => {
      let b = "";
      for (let i = -3; i <= 9; i++) {
        const y = 14 + i * 7.2, th = 2.6 + rng() * 3.4;
        b += `<path d="M10 ${_r1(y)} C 40 ${_r1(y + 6)}, 80 ${_r1(y - 6)}, 110 ${_r1(y + 2)} L 110 ${_r1(y + th)} C 80 ${_r1(y - 6 + th)}, 40 ${_r1(y + 6 + th)}, 10 ${_r1(y + th)} Z" ` +
          `fill="${cs[i & 1 ? 1 : 2]}" opacity="${(0.55 + rng() * 0.3).toFixed(2)}"/>`;
      }
      return `<g transform="rotate(-22 60 62)">${b}</g>`;
    };
    // 先畫第一組；第二組裁在一條波浪線的下方（clip 放外層，旋轉放內層，裁切才不會跟著轉）
    let s = `<defs><clipPath id="cabclip${seq}"><ellipse cx="60" cy="62" rx="34" ry="30"/></clipPath>` +
      `<clipPath id="cabzone${seq}"><path d="M0 70 C 30 48, 62 86, 120 52 L120 120 L0 120 Z"/></clipPath></defs>` +
      `<g clip-path="url(#cabclip${seq})">${bandSet(cols)}`;
    // 第二組要先鋪一層自己的底色，不然會和第一組的黃褐色疊成髒髒的混色
    if (c.texCol2) s += `<g clip-path="url(#cabzone${seq})"><rect x="0" y="0" width="120" height="120" fill="${c.texCol2[0]}"/>${bandSet(c.texCol2)}</g>`;
    if (c.eye !== false) {
      s += `<path d="M30 66 Q60 52 92 60" fill="none" stroke="#fff6d8" stroke-width="5" stroke-linecap="round" opacity=".16"/>` +
        `<path d="M30 66 Q60 52 92 60" fill="none" stroke="#fff6d8" stroke-width="1.5" stroke-linecap="round" opacity=".85"/>`;
    }
    return s + `</g>`;
  },
  /* 彼得石「風暴」：三條被扯碎的螺旋臂＋金色碎纖維＋閃電折線。texCol = [電光藍, 金, 淡藍, 墨] */
  storm(rng, c, seq) {
    const [blue, gold, pale, ink] = c.texCol || ["#4f86e0", "#d9a63e", "#b9d3ff", "#0d1430"];
    const cx0 = 57, cy0 = 60;
    let s = `<defs><clipPath id="cabclip${seq}"><ellipse cx="60" cy="62" rx="34" ry="30"/></clipPath>` +
      `<radialGradient id="stg${seq}"><stop offset="0" stop-color="${blue}" stop-opacity=".85"/><stop offset="1" stop-color="${blue}" stop-opacity="0"/></radialGradient></defs>` +
      `<g clip-path="url(#cabclip${seq})">`;
    for (let i = 0; i < 5; i++) {   // 風暴雲團：幾團電光藍的柔光墊底，讓整顆像是烏雲裡透出電光
      s += `<circle cx="${_r1(32 + rng() * 52)}" cy="${_r1(36 + rng() * 48)}" r="${_r1(13 + rng() * 11)}" fill="url(#stg${seq})" opacity="${(0.5 + rng() * 0.35).toFixed(2)}"/>`;
    }
    for (let arm = 0; arm < 3; arm++) {
      const base = arm * (Math.PI * 2 / 3) + rng() * 0.4;
      let prev = null;
      for (let k = 0; k <= 26; k++) {
        const t = k / 26, th = base + t * Math.PI * 2.6, r = 4 + t * 38;
        const p = [cx0 + Math.cos(th) * r * 1.12, cy0 + Math.sin(th) * r * 0.92];
        if (prev && rng() > 0.16) {   // 隨機漏掉幾段，看起來像被扯碎的纖維
          s += `<line x1="${_r1(prev[0])}" y1="${_r1(prev[1])}" x2="${_r1(p[0])}" y2="${_r1(p[1])}" stroke="${[pale, blue, pale, gold][(k + arm) % 4]}" ` +
            `stroke-width="${(1.1 + t * 3.2 * (0.5 + rng() * 0.7)).toFixed(2)}" stroke-linecap="round" opacity="${(0.6 + rng() * 0.38).toFixed(2)}"/>`;
        }
        prev = p;
      }
    }
    for (let i = 0; i < 18; i++) {   // 碎裂的金色／墨色纖維
      const a = rng() * Math.PI * 2, r = 6 + rng() * 32, tang = a + Math.PI / 2 + (rng() - 0.5) * 0.9, len = 3 + rng() * 8;
      const x = cx0 + Math.cos(a) * r * 1.12, y = cy0 + Math.sin(a) * r * 0.92;
      s += `<line x1="${_r1(x)}" y1="${_r1(y)}" x2="${_r1(x + Math.cos(tang) * len)}" y2="${_r1(y + Math.sin(tang) * len)}" ` +
        `stroke="${i % 3 === 0 ? ink : i % 3 === 1 ? gold : pale}" stroke-width="${(0.7 + rng() * 1.2).toFixed(2)}" stroke-linecap="round" opacity=".85"/>`;
    }
    // 閃電：從右上劈向風暴眼
    s += `<polyline points="92,38 80,46 85,50 72,56 76,59 64,64" fill="none" stroke="${gold}" stroke-width="1.2" stroke-linejoin="miter" opacity=".9"/>` +
      `<polyline points="92,38 80,46 85,50 72,56 76,59 64,64" fill="none" stroke="#fff3c4" stroke-width=".45" opacity=".9"/>`;
    return s + `</g>`;
  },
  /* 水草瑪瑙：透明玉髓裡長出綠色樹枝狀（蕨葉般）內含物。texCol = [枝色, 枝色2] */
  moss(rng, c, seq) {
    const cols = c.texCol || ["#4f8a52", "#2f6a3e"];
    let s = `<defs><clipPath id="cabclip${seq}"><ellipse cx="60" cy="62" rx="34" ry="30"/></clipPath></defs><g clip-path="url(#cabclip${seq})">`;
    for (let k = 0; k < 8; k++) {
      const x = 28 + rng() * 64, y = 40 + rng() * 48, a0 = -Math.PI / 2 + (rng() - 0.5) * 1.2, len = 11 + rng() * 15;
      const x1 = x + Math.cos(a0) * len, y1 = y + Math.sin(a0) * len, col = cols[k % cols.length];
      s += `<line x1="${_r1(x)}" y1="${_r1(y)}" x2="${_r1(x1)}" y2="${_r1(y1)}" stroke="${col}" stroke-width="1.1" stroke-linecap="round" opacity=".9"/>`;
      for (let b = 1; b <= 4; b++) {
        const t = b / 5, bx = x + (x1 - x) * t, by = y + (y1 - y) * t, bl = len * 0.45 * (1 - t * 0.6);
        for (const sd of [-1, 1]) {
          const a = a0 + sd * (0.7 + rng() * 0.4);
          s += `<line x1="${_r1(bx)}" y1="${_r1(by)}" x2="${_r1(bx + Math.cos(a) * bl)}" y2="${_r1(by + Math.sin(a) * bl)}" stroke="${col}" stroke-width=".7" stroke-linecap="round" opacity=".85"/>`;
        }
      }
    }
    return s + `</g>`;
  },
  /* 海洋碧玉：同心圓球狀（orbicular）結構。texCol = 由外到內的環色 */
  orb(rng, c, seq) {
    const cols = c.texCol || ["#e9e2cf", "#5f7f66", "#2f4a3c", "#d9b8a0"];
    let s = `<defs><clipPath id="cabclip${seq}"><ellipse cx="60" cy="62" rx="34" ry="30"/></clipPath></defs><g clip-path="url(#cabclip${seq})">`;
    for (let k = 0; k < 10; k++) {
      const x = 28 + rng() * 64, y = 36 + rng() * 52, r = 5 + rng() * 6;
      cols.forEach((col, i) => {
        s += `<circle cx="${_r1(x)}" cy="${_r1(y)}" r="${_r1(r * (1 - i / cols.length))}" fill="${col}" opacity=".85" stroke="${INK}" stroke-width=".25" stroke-opacity=".4"/>`;
      });
    }
    return s + `</g>`;
  },
};

/* 滾石（TUMBLED）的光澤與內含物：回傳 SVG；形狀與 tumbled 本體同一條路徑，才裁得剛好 */
const TUMBLED_SHAPE = "M 26 62 C 26 38, 44 28, 62 29 C 84 30, 95 44, 94 63 C 93 82, 78 93, 58 92 C 38 91, 26 80, 26 62 Z";
const TUMBLED_TEX = {
  /* 金／銀／彩虹光澤：三團斜向、邊緣柔化的光暈（像光在玻璃裡被拉扁的氣泡層上流動）。
     texCol 兩色＝單色光澤；三色以上＝彩虹。柔邊用「放射漸層遮罩」做，不靠 blur filter，手機上才不吃效能。 */
  sheen(rng, c, seq) {
    const cols = c.texCol || ["#f4d58a", "#c9962f"];
    const rainbow = cols.length > 2;
    let defs = "", rib = "";
    [[46, -27, 42, 12], [62, -27, 46, 9], [77, -30, 38, 10]].forEach(([y, rot, rx, ry], i) => {
      const cx = _r1(60 + (rng() - 0.5) * 8), lg = `shn${seq}_${i}`, rg = `shr${seq}_${i}`, mk = `shk${seq}_${i}`;
      const stops = rainbow
        ? cols.map((col, j) => `<stop offset="${_r1(j / (cols.length - 1))}" stop-color="${col}"/>`).join("")
        : `<stop offset="0" stop-color="${cols[0]}"/><stop offset="1" stop-color="${cols[1]}"/>`;
      const shape = `<ellipse cx="${cx}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} 60 ${y})"`;
      defs += `<linearGradient id="${lg}" x1="0" x2="1" y1="0" y2="0">${stops}</linearGradient>` +
        `<radialGradient id="${rg}"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".55" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
        `<mask id="${mk}" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">${shape} fill="url(#${rg})"/></mask>`;
      rib += `<g mask="url(#${mk})">${shape} fill="url(#${lg})"/></g>`;
    });
    rib += `<path d="M34 71 Q58 51 90 45" fill="none" stroke="${cols[0]}" stroke-width=".8" stroke-linecap="round" opacity=".75"/>`;   // 最亮的一絲
    return `<defs><clipPath id="tmbclip${seq}"><path d="${TUMBLED_SHAPE}"/></clipPath>${defs}</defs><g clip-path="url(#tmbclip${seq})">${rib}</g>`;
  },
  /* 血滴：細小的紅褐色薄片散在石裡，外加幾點閃光。texCol = 薄片色 */
  flecks(rng, c, seq) {
    const cols = c.texCol || ["#c23a2c", "#e0654a"];
    let s = `<defs><clipPath id="tmbclip${seq}"><path d="${TUMBLED_SHAPE}"/></clipPath></defs><g clip-path="url(#tmbclip${seq})">`;
    for (let i = 0; i < 46; i++) {
      const a = rng() * Math.PI * 2, r = Math.sqrt(rng()) * 27;
      const x = 60 + Math.cos(a) * r * 1.2, y = 60 + Math.sin(a) * r * 0.8;
      s += `<ellipse cx="${_r1(x)}" cy="${_r1(y)}" rx="${(1.4 + rng() * 2.2).toFixed(1)}" ry="${(0.7 + rng() * 1.1).toFixed(1)}" fill="${cols[i % cols.length]}" ` +
        `opacity=".9" transform="rotate(${_r1(rng() * 180)} ${_r1(x)} ${_r1(y)})"/>`;
    }
    for (let i = 0; i < 6; i++) {
      s += `<circle cx="${_r1(40 + rng() * 40)}" cy="${_r1(42 + rng() * 34)}" r="${(0.6 + rng() * 0.6).toFixed(1)}" fill="#fff" opacity=".8"/>`;
    }
    return s + `</g>`;
  },
  /* 雪花：白色放射狀的方矽石斑塊。texCol = [雪色] */
  snow(rng, c, seq) {
    const col = (c.texCol || ["#f4f4f1"])[0];
    let s = `<defs><clipPath id="tmbclip${seq}"><path d="${TUMBLED_SHAPE}"/></clipPath></defs><g clip-path="url(#tmbclip${seq})">`;
    for (let i = 0; i < 8; i++) {
      const x = 36 + rng() * 48, y = 40 + rng() * 40, r = 2.6 + rng() * 2.6;
      s += `<circle cx="${_r1(x)}" cy="${_r1(y)}" r="${_r1(r)}" fill="${col}" opacity=".88"/>`;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + rng() * 0.3, l = r + 2 + rng() * 3;
        s += `<line x1="${_r1(x)}" y1="${_r1(y)}" x2="${_r1(x + Math.cos(a) * l)}" y2="${_r1(y + Math.sin(a) * l)}" stroke="${col}" stroke-width=".6" stroke-linecap="round" opacity=".8"/>`;
      }
    }
    return s + `</g>`;
  },
};

const CRYSTAL_FORMS = {
  point(pal, rng, c = {}) {
    return _matrix(rng) + _pointAt(60, 101, 66, 30, pal, (rng() - 0.5) * 8, 0, rng, _pointInc(c)) +
      _pointAt(41, 101, 30, 15, pal, -16 - rng() * 6, 0, rng, _pointInc(c, "1")) +
      _pointAt(80, 101, 26, 13, pal, 15 + rng() * 6, 0, rng, _pointInc(c, "2"));
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
  tumbled(pal, rng, c = {}) {
    let speck = "";
    for (let i = 0; i < 16; i++) {
      const a = rng() * Math.PI * 2, r = rng() * 26;
      speck += `<circle cx="${60 + Math.cos(a) * r * 1.15}" cy="${62 + Math.sin(a) * r * 0.78}" r="${0.7 + rng() * 1.4}" fill="${i % 3 ? pal[1] : pal[2]}" opacity=".8"/>`;
    }
    const tex = c.tex && TUMBLED_TEX[c.tex] ? TUMBLED_TEX[c.tex](crystalRng(c.id + "|tex"), c, _svgSeq) : "";
    return `<ellipse cx="60" cy="97" rx="38" ry="4.5" fill="${INK}" opacity=".14"/>
      <path d="${TUMBLED_SHAPE}"
        fill="${pal[0]}" stroke="${INK}" stroke-width="1.3"/>
      ${speck}${tex}
      <path d="M 36 48 C 42 38, 54 34, 64 35" fill="none" stroke="${pal[2]}" stroke-width="3.5" stroke-linecap="round" opacity=".7"/>`;
  },
  /* 珍珠這類正圓的東西 */
  sphere(pal, rng) {
    return `<ellipse cx="60" cy="98" rx="30" ry="4" fill="${INK}" opacity=".14"/>
      <circle cx="60" cy="60" r="34" fill="${pal[0]}" stroke="${INK}" stroke-width="1.3"/>
      <circle cx="60" cy="60" r="34" fill="url(#sphgrad${_svgSeq})"/>
      <ellipse cx="47" cy="45" rx="10" ry="6" fill="${pal[2]}" opacity=".85" transform="rotate(-32 47 45)"/>
      <path d="M 40 76 C 52 88, 72 87, 82 74" fill="none" stroke="${pal[1]}" stroke-width="2.6" stroke-linecap="round" opacity=".4"/>
      <defs><radialGradient id="sphgrad${_svgSeq}" cx="36%" cy="30%" r="80%">
        <stop offset="0%" stop-color="${pal[2]}" stop-opacity=".8"/><stop offset="55%" stop-color="${pal[0]}" stop-opacity="0"/>
        <stop offset="100%" stop-color="${pal[1]}" stop-opacity=".55"/></radialGradient></defs>`;
  },
  /* 六方柱＋平頂（祖母綠這類綠柱石的外形） */
  prism(pal, rng) {
    const cx = 60, top = 28, bot = 100, w = 34, l = cx - w / 6, r = cx + w / 6, L = cx - w / 2, R = cx + w / 2;
    return `<ellipse cx="60" cy="102" rx="30" ry="4" fill="${INK}" opacity=".14"/>
      ${_poly([[L, top + 4], [l, top + 8], [l, bot], [L, bot - 4]], pal[1], `stroke="${INK}" stroke-width=".8"`)}
      ${_poly([[l, top + 8], [r, top + 8], [r, bot], [l, bot]], pal[0], `stroke="${INK}" stroke-width=".8"`)}
      ${_poly([[r, top + 8], [R, top + 4], [R, bot - 4], [r, bot]], pal[2], `stroke="${INK}" stroke-width=".8"`)}
      ${_poly([[L, top + 4], [cx - 6, top - 3], [cx + 6, top - 3], [R, top + 4], [r, top + 8], [l, top + 8]], pal[2], `stroke="${INK}" stroke-width=".8" opacity=".95"`)}
      ${[0.3, 0.55, 0.8].map(q => `<line x1="${l + 1}" y1="${top + 8 + (bot - top - 8) * q}" x2="${r - 1}" y2="${top + 8 + (bot - top - 8) * q}" stroke="${INK}" stroke-width=".4" opacity=".35"/>`).join("")}`;
  },
  cab(pal, rng, c = {}) {
    const tex = c.tex && CAB_TEX[c.tex] ? CAB_TEX[c.tex](crystalRng(c.id + "|tex"), c, _svgSeq) : "";
    return `<ellipse cx="60" cy="96" rx="36" ry="4.5" fill="${INK}" opacity=".14"/>
      <ellipse cx="60" cy="62" rx="34" ry="30" fill="${pal[0]}" stroke="${INK}" stroke-width="1.3"/>
      ${tex}
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

/* 品種（variants）只覆蓋「長相」：配色與紋理；形狀、亂數種子都沿用本尊，換色時石頭不會變形 */
function crystalLook(c, variant) {
  if (!variant) return c;
  const look = { ...c };
  for (const k of ["pal", "tex", "texCol", "texCol2", "eye"]) if (variant[k] !== undefined) look[k] = variant[k];
  if (variant.texCol2 === undefined) delete look.texCol2;   // 本尊的雙色設定不外洩到其他品種
  return look;
}

/* 產生一張復古插圖 SVG（含斜線陰影 overlay）；variant 為 c.variants 裡的一筆時，改用該品種的配色 */
function crystalSVG(c, cls = "", variant = null) {
  const look = crystalLook(c, variant);
  const rng = crystalRng(c.id);
  const seq = ++_svgSeq;
  const body = (CRYSTAL_FORMS[look.form] || CRYSTAL_FORMS.tumbled)(look.pal, rng, look);
  const label = variant ? `${c.zh}（${variant.name}）` : c.zh;
  return `<svg class="${cls}" viewBox="0 0 120 120" role="img" aria-label="${esc(label)}插圖" stroke-linejoin="round">
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
      /* 品種名（例：鷹眼石、錦鯉膠花、白兔毛）也要搜得到 */
      const hay = [c.zh, c.en, c.alias, c.family, ...c.fx, ...(c.common || []), ...c.uses,
        ...(c.variants || []).flatMap(v => [v.name, v.en || ""])].join(" ").toLowerCase();
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
    ${c.variants?.length ? `<p class="small"><b>🎨 顏色・品種</b> <span class="muted">點一下，上方插圖會換成那一種</span></p>
      <div class="var-chips">${c.variants.map((v, i) => `
        <button type="button" class="chip var-chip ${i === 0 ? "on" : ""}" data-vi="${i}">
          <i class="var-dot" style="background:${esc(v.sw || "#999")}"></i>${esc(v.name)}</button>`).join("")}</div>
      <div class="var-note" id="cd-var-note"></div>` : ""}
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
  /* 品種切換：換插圖配色＋換說明；預設選第一個 */
  if (c.variants?.length) {
    const showVariant = i => {
      const v = c.variants[i];
      $(".cd-fig", m).innerHTML = crystalSVG(c, "", v);
      $$(".var-chip", m).forEach(b => b.classList.toggle("on", +b.dataset.vi === i));
      $("#cd-var-note", m).innerHTML = `<b>${esc(v.name)}</b>${v.en ? ` <span class="cd-en">${esc(v.en)}</span>` : ""}<br>${esc(v.note || "")}`;
    };
    $$(".var-chip", m).forEach(b => b.addEventListener("click", () => showVariant(+b.dataset.vi)));
    showVariant(0);
  }
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
