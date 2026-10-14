/* 後台（admin）與公開文案 endpoint 共用的小工具。
   檔名開頭的底線＝Vercel 不會把它當成一支 API 路由。

   儲存：Upstash Redis REST，與 board.js／account.js 同一套環境變數風格
     ADMIN_KV_URL／ADMIN_KV_TOKEN（沒設就退回 BOARD_KV_URL／BOARD_KV_TOKEN）
   這裡只放「預設文案的修改」與後台自己的登入資料，不碰任何使用者紀錄。 */

export const KEYS = {
  copy: "stardust:admin:copy",           // { values, rev, updatedAt }
  hist: "stardust:admin:copy:hist",      // 舊版快照（最新在前，最多 HIST_MAX 筆）
  pk: "stardust:admin:passkeys",         // hash：credentialId → 憑證 JSON
  sess: h => `stardust:admin:s:${h}`,    // 登入工作階段（用 token 的雜湊當 key）
  chal: c => `stardust:admin:chal:${c}`, // WebAuthn 一次性挑戰
  rl: (bucket, id) => `stardust:admin:rl:${bucket}:${id}`,
};
export const HIST_MAX = 20;

export function kvConf() {
  const url = (process.env.ADMIN_KV_URL || process.env.BOARD_KV_URL || "").replace(/\/$/, "");
  const token = process.env.ADMIN_KV_TOKEN || process.env.BOARD_KV_TOKEN || "";
  return url && token ? { url, token } : null;
}

export async function redis(commands) {
  const conf = kvConf();
  if (!conf) return null;
  const r = await fetch(`${conf.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${conf.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error(`kv ${r.status}`);
  return r.json();
}

export function safeParse(s) { try { return typeof s === "string" ? JSON.parse(s) : s; } catch { return null; } }

/* 文案修改的檢查：只收「key → 字串」或「key → 字串陣列」，長度都設上限。
   這份內容會被前台直接讀去顯示（前台輸出前一律 esc），所以這裡不改寫內容、只擋形狀與大小。 */
export function sanitizeValues(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("bad-values");
  const out = {};
  const keys = Object.keys(input);
  if (keys.length > 600) throw new Error("too-many-keys");
  for (const k of keys) {
    if (!/^[A-Za-z0-9._-]{1,80}$/.test(k)) throw new Error("bad-key");
    const v = input[k];
    if (typeof v === "string") {
      if (v.length > 2000) throw new Error("too-long");
      if (v.trim()) out[k] = v.trim();
    } else if (Array.isArray(v)) {
      if (v.length > 300) throw new Error("too-long");
      const arr = v.map(x => { if (typeof x !== "string" || x.length > 600) throw new Error("bad-item"); return x.trim(); }).filter(Boolean);
      if (arr.length) out[k] = arr;
    } else throw new Error("bad-value");
  }
  if (JSON.stringify(out).length > 300_000) throw new Error("too-large");
  return out;
}
