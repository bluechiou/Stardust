/* 星塵夢汐 · 公開文案（後台改的預設文案，前台開啟時讀取）
   GET /api/copy → { ok, values, rev }
   沒設 KV、或還沒改過任何字 → values 是空物件，前台自動用內建預設，不會壞。
   KV 連不上 → 503（前台保留本機上次的文案，不會被洗掉）。 */
import { KEYS, redis, safeParse } from "./_adminlib.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });
  // 短快取：後台改完幾十秒內就會在各裝置生效，又不會每次開 App 都打到 Redis
  res.setHeader("Cache-Control", "public, max-age=30, s-maxage=30, stale-while-revalidate=120");
  try {
    const out = await redis([["GET", KEYS.copy]]);
    const doc = safeParse(out?.[0]?.result);
    return res.status(200).json({ ok: true, values: doc?.values || {}, rev: doc?.rev || 0 });
  } catch (e) {
    // 讀不到就照實回錯：回空物件會讓前台把本機快取的文案當成「被清空」而悄悄退回預設
    console.warn("copy read failed", String(e?.message || e).slice(0, 60));
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).json({ ok: false, error: "unavailable" });
  }
}
