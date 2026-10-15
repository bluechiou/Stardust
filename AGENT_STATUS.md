# AGENT_STATUS.md — 星塵夢汐 Stardust DreamTide

**Updated:** 2026-10-15 · Who Blue is, the agent roster, the 8-repo map and cross-repo rules live **only** in `Blue_Astral_Nexus_Engine/AGENT_STATUS.md` §1–3 — read that once. This file is this repo's current state and open items. Rules: this repo's `CLAUDE.md` (new 2026-09-25).

## Now
- 2026-10-15 (v2026.10.15, Blue 當場指派): 水晶圖鑑 61→89 種（金曜石・紅銅鈦晶・黑銀鈦・四季幽靈・血滴堇青石・兔毛水晶・膠花＋黑髮晶／紅幽靈／銀曜／彩虹曜／雪花曜／堇青石／寶石級／琥珀／珍珠／玉髓系…），虎眼石、兔毛水晶、膠花有顏色品種切換（`variants`），彼得石插圖加藍色風暴；頁尾最左加「B」圖示連 `booking.bluechiou.com`；**「召喚」＋「寶庫」合併為「召喚寶庫」**（海螺收藏只剩一份）；時空膠囊改**扭蛋＋保齡球道收藏架**。細節見 `README.md`。
- 2026-10-15 帳號查證：星塵帳號線上已 `enabled:true`（不用重蓋）；Supabase 有 2 專案但 **Auth 使用者 0**、星塵未接；Booking 會員（D1、生日當密碼）不能直接用。完整分析與操作教學：`docs/account-next-steps.md`（**待 Blue 決策**）。
- Live at `stardust.bluechiou.com`: CBT mood log, inner report, rituals, 夢汐 AI companion, Notion sync, crystal encyclopedia + shelf, 星塵帳號 (E2E-encrypted sync), 星塵專欄, dynamic moon-phase drawer, streak flame, per-feature display toggles.
- 2026-10-14 (v2026.10.14.2): 後台 `/admin`（預設文案；`docs/admin-setup.md`，**需 Blue 在 Vercel 設 `ADMIN_PASSWORD`**）、`copy.js` 文案登記表、水晶「最常見功效」標籤、颱風天安慰視窗、首頁新增事項／月齡連結、三件感謝隨機提示、預約外連、流星雨 3%。上架與收費草案：`docs/launch-plan.md`（待 Blue 決策）。
- Last feature work 2026-10-14 (v2026.10.14): iPhone 標題列避開狀態列安全區、月曆每格加照度%＋詳細月相入口、滿月當天金色動態框、新月／滿月當天開 App 許願提示（每朔望日一次，5 秒，可 SKIP）。2026-08-11: quiz removed, streak flame, feature toggles. Background push (`periodicsync`) was removed 2026-08-06; in-app notices only show when the app is open.
- How-tos (new column post, version bump, notices): `README.md`. Feature history 2026-07-23 → 2026-08-11: `docs/archive/2026-09-25_agent-status-history.md`.

## Open（IDs from the engine repo's `docs/2026-09-25_lab-closeout-ledger.md`）
- 帳號路線決策（A 補洞／B Supabase／Booking 選擇性連結）：5 題在 `docs/account-next-steps.md` §6，Blue 回答前不動帳號加密與 KV（🔴）
- S1 cycle × moon-phase plan (`docs/cycle-moon-vision.md`): 4 questions in §七 await Blue — not started
- S2 whether to continue the crystal roadmap v1.5+ (`docs/crystal-vision.md`: badges, poster export, full-moon reminders; v2.5 depends on the ÆTHNOUS engine)
