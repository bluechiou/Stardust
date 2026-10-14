# 後台管理（/admin）設定與使用

用途：不改程式、不重新部署，直接改 App 裡的**預設文案**（水晶功效、心情名稱、首頁卡片標題與提示文字、底部分頁名稱、安慰與鼓勵語等）。
**只管文案，不碰任何使用者紀錄**（CLAUDE.md §1）。

## 啟用（Blue 要做一次）

1. Vercel → Project → Settings → Environment Variables 新增 `ADMIN_PASSWORD`（後台密碼；**不要寫進程式碼或 git**）。
2. 確認 Redis 已接上：`BOARD_KV_URL`／`BOARD_KV_TOKEN` 已存在即可（後台預設沿用；想獨立可另設 `ADMIN_KV_URL`／`ADMIN_KV_TOKEN`）。
3. 重新部署（用最新的 deployment 重新 build；**不要對舊 deployment 按 Redeploy**，CLAUDE.md §4）。
4. 打開 `https://stardust.bluechiou.com/admin`，用密碼登入。

沒設 `ADMIN_PASSWORD` 或沒有 Redis → `/api/admin` 回 503，後台整個停用，不存在預設密碼。

## 指紋／Face ID

先用密碼登入 → 「安全與裝置」→「登記這台裝置的指紋／Face ID」。之後登入頁會多一顆生物辨識按鈕。
技術上是 WebAuthn passkey：生物辨識資料留在手機，伺服器只存公鑰；每次登入都要「使用者在場＋通過生物辨識或螢幕鎖」。最多登記 5 台，可隨時刪除。

## 變成手機 App

- iPhone：Safari 開 `/admin` → 分享 → 加入主畫面
- Android：Chrome 開 `/admin` → ⋮ → 安裝應用程式

## 運作方式

- `copy.js` 的 `COPY_GROUPS` 是「後台能改哪些字」的登記表，也是出廠預設。前台用 `C("key")` 取字：後台有改就用後台的，沒改就用預設。
- 後台存檔 → `api/admin.js` 寫進 Redis（`stardust:admin:copy`）→ 前台開啟時讀 `api/copy`（快取約 30 秒），並把上次的結果留在本機供離線使用。
- 讀不到伺服器時前台保留本機上次的文案，不會悄悄退回預設（CLAUDE.md §9）。
- 每次儲存前會留一份歷史（最多 20 版），可在「歷史版本」還原。兩台裝置同時改時後存的人會收到衝突提示，不會悄悄蓋掉。
- 想讓新的文案能被後台改：在 `copy.js` 的 `COPY_GROUPS` 登記一筆，前台改用 `C("key")`，**輸出前一律 `esc()`**。
- 水晶的細節功效與「最常見功效」標籤以 `crystal.<id>.fx`／`crystal.<id>.common` 存，不需另外登記。

## 安全備註

- 登入錯 5 次鎖 15 分鐘（依 IP）；token 是隨機值，伺服器端存 12 小時，登出即失效。
- 密碼若是容易猜的數字（例如生日），請盡快換成更長的字串，並以指紋登入為主。
- 後台頁面有 `noindex`，且 SW 不快取 `/admin*`。
