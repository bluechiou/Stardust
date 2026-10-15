# 星塵夢汐 Stardust DreamTide

stardust.bluechiou.com — 靜態 PWA ＋ Vercel serverless functions。

功能：CBT 情緒紀錄（喜怒哀樂下拉＋強度滑桿）、內在報告、顯化儀式、
睡前引導、連續徽章、夢汐 AI 陪伴與解夢（Anthropic API）、Notion 同步、
水晶圖鑑（89 種・復古博物插圖，部分有顏色／品種切換）與虛擬水晶收藏架（月相×許願搭配）。

2026-07-16 自 `Blue-essay-Jung` repo 的 `app/` 目錄遷出獨立（該 repo 回歸
心理學論文研究用途）。

## 結構

```
index.html            單頁 App
app.js / style.css    前端邏輯與樣式
crystal-data.js       水晶知識庫（CRYSTAL_DB、最普遍功效標籤；前台與後台共用）
crystals.js           水晶圖鑑・虛擬收藏架・月相×許願儀式（見 docs/crystal-vision.md）
copy.js               可由後台修改的預設文案登記表＋C(key)（見 docs/admin-setup.md）
admin.html / admin.js 後台管理 App（/admin；密碼＋指紋登入）
api/admin.js          後台 API（登入、passkey、文案儲存／歷史）
api/copy.js           公開文案（前台開啟時讀取後台改過的字）
cloud.js              Google Drive 備份
account.js            星塵帳號（email＋密碼・端對端加密同步，見 docs/account-setup.md）
sw.js                 Service Worker（網路優先）
manifest.webmanifest  PWA 安裝設定
api/ai-chat.js        夢汐 AI（Anthropic）
api/notion-sync.js    Notion 同步
api/account.js        星塵帳號後端（Upstash Redis）
api/config.js         前端組態
Moon_altar/           召喚祭壇背景原圖（PNG，來源檔）
assets/altar/         同一批圖壓成 1280px WebP，App 實際載入的版本
icons/                App 圖示
```

召喚祭壇背景每次切進「召喚寶庫」分頁隨機換一張（頁內重繪——加小勝利、封膠囊——沿用同一張）。要新增背景：把原圖放進 `Moon_altar/`，
壓成 WebP 放進 `assets/altar/`，再把檔名加進 `app.js` 的 `ALTAR_BACKDROPS`。

## 召喚寶庫（2026-10-15 由「召喚」＋「寶庫」合併）

一頁由上而下：祭壇（召喚）→ 召喚能量怎麼累積 → 神奇海螺收藏（**全頁只此一份**）→ 時空膠囊 →
小勝利聖杯 → 洞察 → 內在報告 → 睡眠 → 顧問服務。程式在 `renderMore()`，祭壇拆成
`altarHTML()`／`mountAltar()`。分頁 key 只剩 `more`；`switchTab("summon")` 仍會導到這一頁（相容舊呼叫端）。
舊使用者的 `settings.tabsOff` 由 `migrateMergedTabs()` 啟動時換算一次：只有「兩顆本來都收起」才維持收起。

**時空膠囊 = 扭蛋＋保齡球道收藏架**：每顆膠囊是一顆小扭蛋（上蓋＋下殼），一顆顆放進木紋球道
（`CAP_PER_LANE` = 6 顆一條，放滿換下一條）。狀態三種：封存中（🔒＋倒數天數）／到期可開（金色呼吸光暈）／
已開啟（蓋子掀開）。新封存的一顆會從球道左端滾進自己的格子（`.rollin`，`--i` 是格子序號）。
點扭蛋開 `openCapsuleInfo()`：封存中只看得到日期與倒數，內容到期才開得了。膠囊按建立順序排，不按到期日排。

## 水晶圖鑑：新增種類與顏色品種

資料在 `crystal-data.js` 的 `CRYSTAL_DB`（欄位說明寫在該檔檔頭），新增後記得在 `CRYSTAL_COMMON_BY_ID`
補 3–4 個最常見功效標籤。插圖是程序化 SVG：`form` 決定形狀，`tex`／`texCol` 決定內含物與光澤
（鈦晶針、兔毛、幽靈層、膠花、虎眼絲光、彼得石風暴、金銀彩虹光澤…，見 `crystals.js` 的
`POINT_INC`／`CAB_TEX`／`TUMBLED_TEX`）。**同一種石頭有顏色／品種**（虎眼石、兔毛水晶、膠花）就寫 `variants`，
詳細頁會出現切換鈕、插圖換色、說明跟著換，搜尋也搜得到品種名。
市場俗稱（紅銅鈦、黑銀鈦、四季幽靈…）沒有統一標準：礦物成因只寫查得到來源的說法，查不到的標「待確認」。

## 宇宙分頁的子分頁

「宇宙」分頁分成 `天象｜專欄｜新聞｜知識` 四個子分頁（`COSMOS_SUBS`），
選了哪個記在 `settings.cosmosSub`。**不要為了新內容去加底部分頁按鈕**——那一列已經
八顆（外加一顆「預約」外連），手機上再加會擠到很難點；新的內容區塊請加成子分頁。
（2026-10-15 起「召喚」與「寶庫」合併為一顆「召喚寶庫」，就是為了讓這一列少一顆。）

要加子分頁：在 `COSMOS_SUBS` 加一筆，再寫一個 `renderCosmosXxx()` 把內容填進
`#cosmos-body`，最後在 `renderCosmos()` 末尾那張對照表登記進去。

## 首頁的連續紀錄火焰（Duolingo 式）

首頁問候卡下方固定一張連續紀錄卡片（`recordStreakHTML()`）：大火焰＋連續天數＋最近
七天的火焰格，像 Duolingo 的連續挑戰天數一樣，把成就感做在最顯眼的地方，提升回訪率。

- **「有紀錄的日子」由 `recordDateSet()` 統一定義**：夢境、日記、思考、專注、心情、
  三件感謝、小本本、小勝利、顯化——任何一種都算今天有來。
- `calcStreak()` 從今天往回數；**今天還沒記錄時先從昨天起算**，不要一到午夜就把數字
  歸零（Duolingo 也是撐到當天結束才算斷），今天一旦留下紀錄就會自動補回今天。連續天數
  一律用日期元件往回推一天來比對，不要改成「現在減 86400000 毫秒」——有日光節約時間的
  地區會算錯，連續紀錄會莫名其妙斷掉。
- 連續紀錄本來就有獎勵：每滿 `SUMMON_PER_STREAK_DAYS` 天換一次召喚機會
  （`checkSummonCharges()`），卡片上會顯示還差幾天。

> 舊的「宇宙知識問答測驗」與其專屬的「連續參加滿 7 天」召喚獎勵已於 2026-08-11 移除，
> 改由這張連續紀錄卡承接連續天數的成就感（`QUIZ_BANK`／`renderCosmosQuiz` 等整組拿掉）。

## 讓使用者收起用不到的功能

收到「功能太多、太複雜」的回饋後，設定分頁多了一張「🧭 功能顯示」卡（`NAV_TABS`）：
勾掉的分頁會從底部分頁列隱藏（`applyTabVisibility()` 加 `.hidden`，開 App 時與每次勾選後
各跑一次），收起哪些記在 `settings.tabsOff`。**首頁與設定是 `fixed: true`，永遠保留**——
一個是主畫面，一個是要能回來重新打開其他功能。這只隱藏底部那一列的按鈕，view 本身還在，
程式內部的跳轉（例如首頁的召喚卡）仍然到得了。

## 發一篇新的星塵專欄

「宇宙」分頁的 🖋 星塵專欄放 Blue 親筆的原創文章，和 NASA 新聞分開（NASA 那批
每週會被 `api/space-news` 整批覆蓋，專欄放進去會被洗掉）。

1. 在 `app.js` 的 `COLUMN` 陣列加一筆：`id`／`date`／`icon`／`zhTitle`／`zhSub`／
   `enTitle`／`enSub`／`zhBody`／`enBody`，並保留 `bilingual: true`。
   `zhBody`／`enBody` 是段落陣列；單獨放一段 `COLUMN_SEP` 會畫一條分隔線。
   閱讀器會先完整呈現中文，再接續英文，不用切換語言。
2. 想同時發通報，就在 `BROADCASTS` 再加一筆（`articleId` 指向上面的 `id`），
   並把 `sw.js` 的 `BROADCAST` 常數改成同一則、同一個 `id`。

## 改版之後，怎麼讓使用者真的看到新版

`app.js` 的 `APP_VERSION` 和 `sw.js` 的 `CACHE` 要一起往上加。改了 `CACHE` 這個字串，
瀏覽器才會判定 `sw.js` 有變、去安裝新的 Service Worker，前端才跳得出「有新版本」橫幅。

使用者端會發生三件事：啟動時與每次從背景切回前景時主動向伺服器問有沒有新版（5 分鐘節流）；
偵測到新版就跳橫幅，由使用者自己按下重新載入（不自動 reload，免得他正在打日記被刷掉）；
設定分頁隨時看得到目前版本號，回報問題時報這個數字最快。

⚠️ **不要把更新邏輯掛在 `navigator.serviceWorker.register()` 回傳的 promise 上。**
實測 Chromium 在「使用者回訪、頁面已被 SW 接管」時，那個 promise 會遲遲不 resolve，
整套偵測會靜靜地失效。要拿 registration 請用 `navigator.serviceWorker.ready`。

⚠️ **Vercel 後台不要對舊的 deployment 按 Redeploy。** 那等於把 production 回滾到那個
commit（2026-07-28 就這樣把已上線的專欄整個滾掉，表現出來是「清除資料重裝都還是舊的」）。
要回到最新版：對 main 最新的 deployment 按 **Promote to Production**，或讓 main 產生一個
新 commit（合併任何 PR 都可以）。要確認線上到底是哪一版，抓 `stardust.bluechiou.com/app.js`
跟各 commit 的 `app.js` 逐一比對就知道。

## 站內通報怎麼送達

沒有推播伺服器，也沒有跟使用者收 push subscription。**App 沒開就不會跳出任何系統通知**——
2026-08-06 之前 `sw.js` 有一段 `periodicsync` 背景推播（Android 已安裝 PWA 會在 App 關閉
時被瀏覽器排程喚醒跳系統通知），因為沒有已讀去重（判斷式在 Service Worker context 讀不到
`localStorage` 裡的 `settings.broadcasts`），同一則通報會在背景重複跳出，已整支移除。
現在唯一的送達路徑是：下次打開 App 時跳出通報卡片，含全部 iOS 與 Android。
`app.js` 啟動時會主動 `periodicSync.unregister("astro-check")`，撤銷舊版留在使用者裝置上
的背景排程。

要做真正的伺服器推播是另一件工程：VAPID 金鑰（私鑰只放 Vercel 環境變數）、
訂閱清單存 Upstash Redis、一支需要驗證的廣播 API、`sw.js` 補 `push` 事件，
再加一段請求通知權限的流程；iOS 只有「加到主畫面」的 PWA 收得到。做的話務必連同
訂閱時的使用者同意流程與可退訂入口一起做，不要只做送出端。

## 部署（Vercel）

- Root Directory：`/`（repo 根目錄，遷移前是 `app/`）
- 環境變數（只設在 Vercel，絕不進 git）：`ANTHROPIC_API_KEY`、
  `NOTION_TOKEN`、`STARDUST_AI_MODEL`、`STARDUST_GOOGLE_CLIENT_ID`、
  `ACCOUNT_KV_URL`／`ACCOUNT_KV_TOKEN`（星塵帳號，見 `docs/account-setup.md`）、
  `BOARD_KV_URL`／`BOARD_KV_TOKEN`（辣妹留言板）、
  `ADMIN_PASSWORD`（後台密碼，必設；沒設後台就停用）、`ADMIN_KV_URL`／`ADMIN_KV_TOKEN`
  （選填，沒設就用 BOARD_KV_*；後台只存「預設文案」與自己的登入資料）。詳見 `docs/admin-setup.md`
- 自訂網域：`stardust.bluechiou.com`
