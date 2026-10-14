/* 星塵夢汐 後台（admin.html）— 編修 App 的預設文案
   登入：密碼，或先登記過的指紋／Face ID（WebAuthn passkey）。
   所有畫面都用 textContent／DOM API 組出來，不把任何文案當 HTML 插進頁面。
   這裡只改「預設文案」，碰不到任何使用者的紀錄。 */

const TOKEN_KEY = "sdAdminToken";
const app = document.getElementById("app");
const S = { token: null, values: {}, draft: {}, rev: 0, updatedAt: null, tab: "copy", q: "" };

/* ---------- 小工具 ---------- */
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, "");
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) el.append(k.nodeType ? k : document.createTextNode(k));
  return el;
}
function toast(msg) {
  const t = h("div", { class: "toast", role: "status" }, msg);
  document.body.append(t);
  setTimeout(() => t.remove(), 3000);
}
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const b64u = buf => b64(buf).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64u = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
const lines = s => s.split("\n").map(x => x.trim()).filter(Boolean);

async function api(action, body = {}) {
  const r = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(S.token ? { Authorization: `Bearer ${S.token}` } : {}) },
    body: JSON.stringify({ action, ...body }),
  });
  let j = {};
  try { j = await r.json(); } catch { /* 非 JSON 回應 */ }
  if (r.status === 401 && S.token && action !== "login" && action !== "pk-login") { logout("登入已過期，請重新登入"); throw new Error("expired"); }
  if (!r.ok) { const e = new Error(j.error || `http-${r.status}`); e.status = r.status; e.body = j; throw e; }
  return j;
}
const ERR_TEXT = {
  "invalid-credentials": "密碼或驗證不正確", "too-many-attempts": "嘗試次數太多，請 15 分鐘後再試",
  "admin-not-configured": "後台尚未啟用：請先在 Vercel 設定環境變數 ADMIN_PASSWORD，並確認 Redis（BOARD_KV_URL／BOARD_KV_TOKEN）已接上。",
  conflict: "另一台裝置剛改過內容。請重新載入後再改（你這份未存的修改不會被送出）。", "invalid-input": "內容格式不符，伺服器拒收",
  "too-many-passkeys": "最多登記 5 台裝置，請先刪掉舊的", "invalid-registration": "登記失敗，請再試一次",
};
const errText = e => ERR_TEXT[e.message] || "發生錯誤，請稍後再試";

/* ---------- 登入 ---------- */
function setToken(t) { S.token = t; try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* 無痕模式存不了就算了 */ } }
function logout(msg) { if (S.token) api("logout").catch(() => {}); setToken(null); renderLogin(msg); }

async function renderLogin(msg) {
  const err = h("p", { class: "err", role: "alert" }, msg || "");
  const pw = h("input", { type: "password", autocomplete: "current-password", placeholder: "管理員密碼", "aria-label": "管理員密碼", inputmode: "text" });
  const go = h("button", { class: "btn", type: "button" }, "登入");
  const pkBtn = h("button", { class: "btn secondary hidden-pk", type: "button", style: "display:none;width:100%;margin-top:10px" }, "🔐 用指紋／Face ID 登入");
  const doLogin = async () => {
    if (!pw.value) return;
    go.disabled = true; err.textContent = "";
    try { const j = await api("login", { password: pw.value }); setToken(j.token); await loadMain(); }
    catch (e) { err.textContent = errText(e); go.disabled = false; pw.select(); }
  };
  go.addEventListener("click", doLogin);
  pw.addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); });
  pkBtn.addEventListener("click", async () => {
    err.textContent = "";
    try { await passkeyLogin(); } catch (e) { err.textContent = e.name === "NotAllowedError" ? "已取消" : errText(e); }
  });
  app.replaceChildren(h("main", {}, h("div", { class: "login" },
    h("h1", {}, "星塵夢汐 後台"), h("p", { class: "muted" }, "預設文案管理・僅限管理員"),
    h("div", { class: "card" }, h("label", { class: "f" }, "密碼"), pw, h("div", { class: "row" }, go), pkBtn, err))));
  // 有登記過 passkey 才顯示指紋按鈕（伺服器回有沒有憑證，不回任何憑證內容）
  if (window.PublicKeyCredential) {
    try { const j = await api("pk-challenge"); if (j.credentialIds?.length) { pkBtn.style.display = ""; S.pkChal = j; } }
    catch (e) { if (e.message === "admin-not-configured") err.textContent = errText(e); }
  }
}
async function passkeyLogin() {
  const c = S.pkChal || await api("pk-challenge");
  if (!c.credentialIds?.length) throw new Error("invalid-credentials");
  const cred = await navigator.credentials.get({ publicKey: {
    challenge: fromB64u(c.challenge), rpId: c.rpId, timeout: 60000, userVerification: "required",
    allowCredentials: c.credentialIds.map(id => ({ type: "public-key", id: fromB64u(id) })),
  } });
  const r = cred.response;
  S.pkChal = null;     // 挑戰碼是一次性的，用過就作廢
  const j = await api("pk-login", {
    id: cred.id, clientDataJSON: b64u(r.clientDataJSON), authenticatorData: b64u(r.authenticatorData), signature: b64u(r.signature),
  });
  setToken(j.token); await loadMain();
}

/* ---------- 主畫面 ---------- */
async function loadMain() {
  try {
    const j = await api("get");
    S.values = j.values || {}; S.draft = structuredClone(S.values); S.rev = j.rev; S.updatedAt = j.updatedAt; S.pkCount = j.passkeys;
  } catch (e) { if (e.message !== "expired") toast(errText(e)); return; }
  renderMain();
}
const isDirty = () => JSON.stringify(sortKeys(S.draft)) !== JSON.stringify(sortKeys(S.values));
const sortKeys = o => Object.fromEntries(Object.keys(o).sort().map(k => [k, o[k]]));
const dirtyKeys = () => [...new Set([...Object.keys(S.draft), ...Object.keys(S.values)])].filter(k => JSON.stringify(S.draft[k]) !== JSON.stringify(S.values[k]));
const sameAsDefault = (v, def) => Array.isArray(def) ? JSON.stringify(v) === JSON.stringify(def) : v === def;

function setDraft(key, def, value) {
  if (sameAsDefault(value, def) || (Array.isArray(value) ? !value.length : !String(value).trim())) delete S.draft[key];
  else S.draft[key] = value;
  refreshSaveBar();
}
function invalidKeys() {
  return Object.keys(S.draft).filter(k => k in COPY_DEFAULTS && !copyValid(k, S.draft[k]));
}

function renderMain() {
  const tabs = [["copy", "文案"], ["crystal", "水晶功效"], ["security", "安全與裝置"], ["history", "歷史版本"]];
  const body = h("main", { id: "body" });
  const top = h("div", { class: "top" },
    h("div", { class: "top-row" }, h("h1", {}, "星塵夢汐 後台"),
      h("span", { class: "muted", id: "revinfo" }, S.rev ? `第 ${S.rev} 版・${new Date(S.updatedAt).toLocaleString("zh-TW")}` : "尚未修改過"),
      h("button", { class: "link", type: "button", onclick: () => confirmLeave() && logout() }, "登出")),
    h("div", { class: "tabs", role: "tablist" }, tabs.map(([k, t]) =>
      h("button", { type: "button", role: "tab", class: S.tab === k ? "on" : "", "aria-selected": S.tab === k, onclick: () => { S.tab = k; renderMain(); } }, t))));
  const bar = h("div", { class: "savebar", id: "savebar" });
  app.replaceChildren(top, body, bar);
  ({ copy: tabCopy, crystal: tabCrystal, security: tabSecurity, history: tabHistory })[S.tab](body);
  refreshSaveBar();
}
const confirmLeave = () => !isDirty() || confirm("有尚未儲存的修改，確定離開？");
addEventListener("beforeunload", e => { if (S.token && isDirty()) { e.preventDefault(); e.returnValue = ""; } });

function refreshSaveBar() {
  const bar = document.getElementById("savebar"); if (!bar) return;
  const n = dirtyKeys().length, bad = invalidKeys();
  const btn = h("button", { class: "btn", type: "button", disabled: !n || bad.length > 0, onclick: save }, n ? `儲存（${n} 項已修改）` : "沒有未儲存的修改");
  const undo = n ? h("button", { class: "btn secondary", type: "button", style: "flex:0 0 auto", onclick: () => { if (confirm("放棄這次所有未儲存的修改？")) { S.draft = structuredClone(S.values); renderMain(); } } }, "放棄") : null;
  bar.replaceChildren(h("div", {}, undo, btn));
  if (bad.length) bar.firstChild.append(h("span", { class: "err small" }, `${bad.length} 項格式不符`));
}
async function save() {
  try {
    const j = await api("save", { values: S.draft, baseRev: S.rev });
    S.values = j.values; S.draft = structuredClone(j.values); S.rev = j.rev; S.updatedAt = j.updatedAt;
    toast("已儲存 ✓ 各裝置約 30 秒內生效");
    renderMain();
  } catch (e) { if (e.message !== "expired") toast(errText(e)); }
}

/* ---------- 文案欄位 ---------- */
function field(item) {
  const def = item.def, cur = item.key in S.draft ? S.draft[item.key] : def;
  const multi = item.type === "lines" || item.type === "area";
  const val = Array.isArray(cur) ? cur.join("\n") : cur;
  const input = multi ? h("textarea", { rows: Math.min(12, Math.max(3, (Array.isArray(cur) ? cur.length : 3) + 1)) }) : h("input", { type: "text" });
  input.value = val;
  const mod = h("span", { class: "mod" }); const hint = h("p", { class: "muted" });
  const sync = () => {
    const changed = item.key in S.draft;
    mod.textContent = changed ? "已改" : "";
    hint.textContent = item.type === "lines" ? `${lines(input.value).length} 行${item.exact ? `（需要剛好 ${item.exact} 行）` : ""}` : "";
    hint.style.color = item.exact && item.type === "lines" && lines(input.value).length !== item.exact ? "var(--danger)" : "";
  };
  input.addEventListener("input", () => { setDraft(item.key, def, item.type === "lines" ? lines(input.value) : input.value); sync(); });
  const reset = h("button", { class: "link", type: "button", onclick: () => { delete S.draft[item.key]; input.value = Array.isArray(def) ? def.join("\n") : def; sync(); refreshSaveBar(); } }, "還原預設");
  sync();
  return h("div", {}, h("label", { class: "f" }, item.label, mod), input, hint, reset);
}
function tabCopy(body) {
  body.append(h("p", { class: "muted" }, "改完按下方「儲存」。留空＝回到內建預設。每個欄位的出廠文字可用「還原預設」找回。"));
  for (const g of COPY_GROUPS) body.append(h("div", { class: "card" }, h("h2", {}, g.title), g.items.map(field)));
}

/* ---------- 水晶功效 ---------- */
function tabCrystal(body) {
  const q = h("input", { type: "search", placeholder: "搜尋水晶名稱⋯", value: S.q, "aria-label": "搜尋水晶" });
  const list = h("div");
  const draw = () => {
    const kw = q.value.trim().toLowerCase();
    list.replaceChildren(...CRYSTAL_DB.filter(c => !kw || `${c.zh} ${c.en}`.toLowerCase().includes(kw)).map(crystalEl));
  };
  q.addEventListener("input", () => { S.q = q.value; draw(); });
  body.append(h("p", { class: "muted" }, "每顆水晶有兩組：「細節功效」（一行一句）與「最常見的功效」標籤（3–4 個，可點下方詞彙加入）。"), q, list);
  draw();
}
function crystalEl(c) {
  const kFx = `crystal.${c.id}.fx`, kCm = `crystal.${c.id}.common`;
  const mark = h("span", { class: "mod" });
  const upd = () => { mark.textContent = (kFx in S.draft || kCm in S.draft) ? "已改" : ""; };
  const mkArea = (key, def, rows) => {
    const ta = h("textarea", { rows }); ta.value = (key in S.draft ? S.draft[key] : def).join("\n");
    ta.addEventListener("input", () => { setDraft(key, def, lines(ta.value)); upd(); });
    return ta;
  };
  const fxTa = mkArea(kFx, c.fx, 5), cmTa = mkArea(kCm, c.common, 3);
  const vocab = h("div", { class: "chips" }, CRYSTAL_COMMON_FX.map(t => h("button", { class: "chip", type: "button", onclick: () => {
    const cur = lines(cmTa.value); if (!cur.includes(t)) { cur.push(t); cmTa.value = cur.join("\n"); setDraft(kCm, c.common, cur); upd(); }
  } }, `＋ ${t}`)));
  const reset = h("button", { class: "link", type: "button", onclick: () => {
    delete S.draft[kFx]; delete S.draft[kCm]; fxTa.value = c.fx.join("\n"); cmTa.value = c.common.join("\n"); upd(); refreshSaveBar();
  } }, "這顆還原預設");
  upd();
  return h("details", {}, h("summary", {}, `${c.zh}　${c.en}`, mark),
    h("div", { class: "in" }, h("label", { class: "f" }, "細節功效（一行一句）"), fxTa,
      h("label", { class: "f" }, "最常見的功效標籤（一行一個）"), cmTa, vocab, reset));
}

/* ---------- 安全與裝置 ---------- */
async function tabSecurity(body) {
  const list = h("div", {});
  const refresh = async () => {
    try {
      const j = await api("pk-list");
      list.replaceChildren(...(j.items.length ? j.items.map(p => h("div", { class: "item" },
        h("div", {}, h("b", {}, p.name), h("div", { class: "muted" }, `登記於 ${new Date(p.createdAt).toLocaleDateString("zh-TW")}`)),
        h("button", { class: "btn danger", type: "button", onclick: async () => {
          if (!confirm(`刪除「${p.name}」的指紋登入？`)) return;
          await api("pk-delete", { id: p.id }); toast("已刪除"); refresh();
        } }, "刪除"))) : [h("p", { class: "muted" }, "還沒有登記任何裝置。")]));
    } catch (e) { if (e.message !== "expired") list.replaceChildren(h("p", { class: "err" }, errText(e))); }
  };
  const addBtn = h("button", { class: "btn", type: "button", onclick: async () => {
    try { await registerPasskey(); toast("已登記，下次可用指紋／Face ID 登入"); refresh(); }
    catch (e) { toast(e.name === "NotAllowedError" ? "已取消" : (e.message === "unsupported" ? "這個瀏覽器不支援指紋登入" : errText(e))); }
  } }, "🔐 登記這台裝置的指紋／Face ID");
  let deferred = null;
  const installBtn = h("button", { class: "btn secondary", type: "button", style: "display:none", onclick: async () => { if (deferred) { deferred.prompt(); deferred = null; installBtn.style.display = "none"; } } }, "📲 安裝後台 App");
  addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; installBtn.style.display = ""; });
  body.append(
    h("div", { class: "card" }, h("h2", {}, "指紋／Face ID 登入"),
      h("p", { class: "muted" }, "先用密碼登入，再登記這台手機。之後登入頁會多一顆生物辨識按鈕；生物辨識資料留在手機裡，伺服器只存公鑰。"),
      list, h("div", { class: "row" }, addBtn)),
    h("div", { class: "card" }, h("h2", {}, "把後台裝成手機 App"),
      h("p", { class: "small" }, "iPhone：用 Safari 打開 /admin → 分享 → 加入主畫面。"),
      h("p", { class: "small" }, "Android：用 Chrome 打開 /admin → ⋮ → 安裝應用程式（或按下面按鈕）。"),
      h("div", { class: "row" }, installBtn)),
    h("div", { class: "card" }, h("h2", {}, "密碼"),
      h("p", { class: "muted" }, "密碼只存在 Vercel 的環境變數 ADMIN_PASSWORD（不進程式碼、不進 git）。要換密碼：Vercel → Settings → Environment Variables → 改完重新部署。連續輸錯 5 次會鎖 15 分鐘。")));
  refresh();
}
async function registerPasskey() {
  if (!window.PublicKeyCredential) throw new Error("unsupported");
  const c = await api("pk-reg-challenge");
  const cred = await navigator.credentials.create({ publicKey: {
    challenge: fromB64u(c.challenge), rp: { name: "星塵夢汐 後台", id: c.rpId },
    user: { id: crypto.getRandomValues(new Uint8Array(16)), name: "admin", displayName: "星塵管理員" },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
    authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "preferred" },
    attestation: "none", timeout: 60000,
  } });
  const r = cred.response;
  if (typeof r.getPublicKey !== "function" || !r.getPublicKey()) throw new Error("unsupported");
  const ua = navigator.userAgent;
  const name = `${/iPhone|iPad/.test(ua) ? "iPhone／iPad" : /Android/.test(ua) ? "Android" : /Mac/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : "裝置"}（${new Date().toLocaleDateString("zh-TW")}）`;
  await api("pk-register", { id: cred.id, publicKey: b64(r.getPublicKey()), clientDataJSON: b64u(r.clientDataJSON), name });
}

/* ---------- 歷史版本 ---------- */
async function tabHistory(body) {
  body.append(h("p", { class: "muted" }, "每次儲存前的內容都會留一份（最多 20 版）。還原＝把那一版變成最新一版，原本的最新版也會被存進歷史。"));
  try {
    const j = await api("history");
    body.append(h("div", { class: "card" }, j.items.length ? j.items.map(it => h("div", { class: "item" },
      h("div", {}, h("b", {}, `第 ${it.rev} 版`), h("div", { class: "muted" }, `${it.updatedAt ? new Date(it.updatedAt).toLocaleString("zh-TW") : "—"}・${it.keys} 項修改`)),
      h("button", { class: "btn secondary", type: "button", onclick: async () => {
        if (!confirmLeave() || !confirm(`還原到第 ${it.rev} 版？`)) return;
        try { await api("restore", { i: it.i }); toast("已還原"); await loadMain(); } catch (e) { if (e.message !== "expired") toast(errText(e)); }
      } }, "還原"))) : h("p", { class: "muted" }, "還沒有歷史版本。")));
  } catch (e) { if (e.message !== "expired") body.append(h("p", { class: "err" }, errText(e))); }
}

/* ---------- 啟動 ---------- */
(async function init() {
  try { S.token = localStorage.getItem(TOKEN_KEY); } catch { S.token = null; }
  if (S.token) { await loadMain(); if (document.getElementById("body")) return; }
  renderLogin();
})();
