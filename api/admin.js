/* 星塵夢汐 · 後台管理 API（只管「預設文案」，不碰任何使用者紀錄）
   ────────────────────────────────────────
   登入方式：
     1. 密碼：環境變數 ADMIN_PASSWORD（只放在 Vercel，不進 git）
     2. 指紋／Face ID：WebAuthn passkey。先用密碼登入後在「安全」分頁登記這支手機，之後可用生物辨識登入。
   登入成功後發一組隨機 token，伺服器端存 12 小時（Redis），前端帶在 Authorization 標頭。
   未設定 ADMIN_PASSWORD 或沒有 KV → 後台整個停用（503），不會有「預設密碼」這種東西。

   全部走 POST { action, ... }：
     login{password} · pk-challenge{} · pk-login{...}                 （免登入）
     get · save{values,baseRev} · history · restore{i}                 （需登入）
     pk-reg-challenge · pk-register{...} · pk-list · pk-delete{id} · logout
*/
import { createHash, randomBytes, timingSafeEqual, createPublicKey, verify as cryptoVerify } from "node:crypto";
import { KEYS, HIST_MAX, kvConf, redis, safeParse, sanitizeValues } from "./_adminlib.js";

const SESSION_TTL = 12 * 3600;
const LOGIN_LIMIT = { max: 5, windowSec: 900 };    // 同一 IP 十五分鐘內最多錯 5 次
const CHAL_LIMIT = { max: 30, windowSec: 600 };    // 要挑戰碼的頻率上限
const MAX_PASSKEYS = 5;

const sha256 = d => createHash("sha256").update(d).digest();
const b64u = b => Buffer.from(b).toString("base64url");
const fromB64u = s => Buffer.from(String(s || ""), "base64url");
const ipOf = req => (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
const hostOf = req => String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
const rpIdOf = req => hostOf(req).split(":")[0];

/* 簡易頻率限制：回傳目前次數（含這一次）。peek=true 只看不加。 */
async function hit(bucket, id, { windowSec }, peek = false) {
  const key = KEYS.rl(bucket, id);
  if (peek) { const o = await redis([["GET", key]]); return Number(o?.[0]?.result || 0); }
  const o = await redis([["INCR", key], ["EXPIRE", key, windowSec]]);
  return Number(o?.[0]?.result || 0);
}

async function newSession() {
  const token = randomBytes(32).toString("hex");
  await redis([["SET", KEYS.sess(sha256(token).toString("hex")), "1", "EX", String(SESSION_TTL)]]);
  return token;
}
async function authed(req) {
  const m = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || "");
  if (!m) return false;
  const o = await redis([["GET", KEYS.sess(sha256(m[1]).toString("hex"))]]);
  return o?.[0]?.result === "1";
}

function passwordOk(input) {
  const real = process.env.ADMIN_PASSWORD || "";
  if (!real || typeof input !== "string") return false;
  return timingSafeEqual(sha256(input), sha256(real));   // 先雜湊成等長再比，不洩漏長度與比對時間
}

/* WebAuthn 共用檢查：clientDataJSON 的 type／challenge／origin */
function checkClientData(req, clientDataB64, type, challenge) {
  const raw = fromB64u(clientDataB64);
  const cd = safeParse(raw.toString("utf8"));
  if (!cd || cd.type !== type || cd.challenge !== challenge) return null;
  let originHost = "";
  try { originHost = new URL(cd.origin).host; } catch { return null; }
  if (originHost !== hostOf(req)) return null;
  return raw;
}
async function takeChallenge(challenge, expect) {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(String(challenge || ""))) return false;
  const o = await redis([["GETDEL", KEYS.chal(challenge)]]);   // 一次性：用過就沒了
  return o?.[0]?.result === expect;
}
async function issueChallenge(kind) {
  const c = b64u(randomBytes(32));
  await redis([["SET", KEYS.chal(c), kind, "EX", "300"]]);
  return c;
}
async function passkeys() {
  const o = await redis([["HGETALL", KEYS.pk]]);
  const arr = o?.[0]?.result || [];
  const out = {};
  for (let i = 0; i < arr.length; i += 2) { const v = safeParse(arr[i + 1]); if (v) out[arr[i]] = v; }
  return out;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });
  if (!process.env.ADMIN_PASSWORD || !kvConf()) return res.status(503).json({ error: "admin-not-configured" });

  const body = typeof req.body === "string" ? (safeParse(req.body) || {}) : (req.body || {});
  const action = String(body.action || "");
  const ip = ipOf(req);

  try {
    /* ---------- 免登入 ---------- */
    if (action === "login") {
      if (await hit("login", ip, LOGIN_LIMIT, true) >= LOGIN_LIMIT.max) return res.status(429).json({ error: "too-many-attempts" });
      if (!passwordOk(body.password)) {
        await hit("login", ip, LOGIN_LIMIT);
        return res.status(401).json({ error: "invalid-credentials" });
      }
      await redis([["DEL", KEYS.rl("login", ip)]]);
      return res.status(200).json({ ok: true, token: await newSession() });
    }

    if (action === "pk-challenge") {
      if (await hit("chal", ip, CHAL_LIMIT) > CHAL_LIMIT.max) return res.status(429).json({ error: "too-many-attempts" });
      const ids = Object.keys(await passkeys());
      if (!ids.length) return res.status(200).json({ ok: true, credentialIds: [] });
      return res.status(200).json({ ok: true, challenge: await issueChallenge("login"), rpId: rpIdOf(req), credentialIds: ids });
    }

    if (action === "pk-login") {
      if (await hit("login", ip, LOGIN_LIMIT, true) >= LOGIN_LIMIT.max) return res.status(429).json({ error: "too-many-attempts" });
      const fail = async () => { await hit("login", ip, LOGIN_LIMIT); return res.status(401).json({ error: "invalid-credentials" }); };
      const cred = (await passkeys())[String(body.id || "")];
      if (!cred) return fail();
      // clientDataJSON 裡的 challenge 要先讀出來，才能去 Redis 取那張一次性的挑戰碼
      const cdRaw = fromB64u(body.clientDataJSON);
      const cd = safeParse(cdRaw.toString("utf8"));
      if (!cd || !(await takeChallenge(cd.challenge, "login"))) return fail();
      if (!checkClientData(req, body.clientDataJSON, "webauthn.get", cd.challenge)) return fail();
      const authData = fromB64u(body.authenticatorData);
      if (authData.length < 37 || !authData.subarray(0, 32).equals(sha256(rpIdOf(req)))) return fail();
      const flags = authData[32];
      if (!(flags & 0x01) || !(flags & 0x04)) return fail();    // 要有「使用者在場」＋「通過生物辨識／螢幕鎖」
      const signed = Buffer.concat([authData, sha256(cdRaw)]);
      const key = createPublicKey({ key: Buffer.from(cred.publicKey, "base64"), format: "der", type: "spki" });
      if (!cryptoVerify("sha256", signed, key, fromB64u(body.signature))) return fail();
      const count = authData.readUInt32BE(33);
      if (count || cred.signCount) {                             // 兩邊都是 0 的平台驗證器（如 iCloud 鑰匙圈）不比較次數
        if (count <= cred.signCount) return fail();
        cred.signCount = count;
        await redis([["HSET", KEYS.pk, String(body.id), JSON.stringify(cred)]]);
      }
      await redis([["DEL", KEYS.rl("login", ip)]]);
      return res.status(200).json({ ok: true, token: await newSession() });
    }

    /* ---------- 需登入 ---------- */
    if (!(await authed(req))) return res.status(401).json({ error: "unauthorized" });

    if (action === "logout") {
      const t = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || "")[1];
      await redis([["DEL", KEYS.sess(sha256(t).toString("hex"))]]);
      return res.status(200).json({ ok: true });
    }

    if (action === "get") {
      const o = await redis([["GET", KEYS.copy], ["HLEN", KEYS.pk]]);
      const doc = safeParse(o?.[0]?.result);
      return res.status(200).json({ ok: true, values: doc?.values || {}, rev: doc?.rev || 0, updatedAt: doc?.updatedAt || null, passkeys: Number(o?.[1]?.result || 0) });
    }

    if (action === "save" || action === "restore") {
      const cur = safeParse((await redis([["GET", KEYS.copy]]))?.[0]?.result) || { values: {}, rev: 0 };
      let next;
      if (action === "restore") {
        const i = Number(body.i);
        const h = safeParse((await redis([["LINDEX", KEYS.hist, Number.isInteger(i) && i >= 0 ? i : 0]]))?.[0]?.result);
        if (!h?.values) return res.status(404).json({ error: "not-found" });
        next = h.values;
      } else {
        // 樂觀鎖：兩台裝置同時改，後存的人要先看到對方的修改，不能悄悄蓋掉
        if (body.baseRev !== undefined && Number(body.baseRev) !== cur.rev) return res.status(409).json({ error: "conflict", rev: cur.rev });
        next = sanitizeValues(body.values);
      }
      const doc = { values: next, rev: cur.rev + 1, updatedAt: new Date().toISOString() };
      await redis([
        ["LPUSH", KEYS.hist, JSON.stringify(cur)],
        ["LTRIM", KEYS.hist, 0, HIST_MAX - 1],
        ["SET", KEYS.copy, JSON.stringify(doc)],
      ]);
      return res.status(200).json({ ok: true, rev: doc.rev, updatedAt: doc.updatedAt, values: doc.values });
    }

    if (action === "history") {
      const list = (await redis([["LRANGE", KEYS.hist, 0, HIST_MAX - 1]]))?.[0]?.result || [];
      return res.status(200).json({ ok: true, items: list.map((s, i) => { const h = safeParse(s) || {}; return { i, rev: h.rev || 0, updatedAt: h.updatedAt || null, keys: Object.keys(h.values || {}).length }; }) });
    }

    if (action === "pk-reg-challenge") {
      return res.status(200).json({ ok: true, challenge: await issueChallenge("reg"), rpId: rpIdOf(req) });
    }

    if (action === "pk-register") {
      const existing = await passkeys();
      if (Object.keys(existing).length >= MAX_PASSKEYS) return res.status(400).json({ error: "too-many-passkeys" });
      const cdRaw = fromB64u(body.clientDataJSON);
      const cd = safeParse(cdRaw.toString("utf8"));
      if (!cd || !(await takeChallenge(cd.challenge, "reg")) || !checkClientData(req, body.clientDataJSON, "webauthn.create", cd.challenge)) {
        return res.status(400).json({ error: "invalid-registration" });
      }
      const id = String(body.id || "");
      if (!/^[A-Za-z0-9_-]{10,512}$/.test(id)) return res.status(400).json({ error: "invalid-registration" });
      try { createPublicKey({ key: Buffer.from(String(body.publicKey || ""), "base64"), format: "der", type: "spki" }); }
      catch { return res.status(400).json({ error: "invalid-registration" }); }
      const cred = { publicKey: String(body.publicKey), signCount: 0, name: String(body.name || "這台裝置").slice(0, 40), createdAt: new Date().toISOString() };
      await redis([["HSET", KEYS.pk, id, JSON.stringify(cred)]]);
      return res.status(200).json({ ok: true });
    }

    if (action === "pk-list") {
      const all = await passkeys();
      return res.status(200).json({ ok: true, items: Object.entries(all).map(([id, c]) => ({ id, name: c.name, createdAt: c.createdAt })) });
    }

    if (action === "pk-delete") {
      await redis([["HDEL", KEYS.pk, String(body.id || "")]]);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "unknown-action" });
  } catch (e) {
    // 對外一律通用訊息；細節只進伺服器 log
    console.warn("[admin]", action, String(e?.message || e).slice(0, 80));
    if (/^(bad-|too-)/.test(String(e?.message))) return res.status(400).json({ error: "invalid-input" });
    return res.status(500).json({ error: "server-error" });
  }
}
