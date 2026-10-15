# 星塵帳號：要重蓋嗎？用 Supabase？用 Booking 會員？（決策＋教學）

> 狀態：**草案，供 Blue 決策**（2026-10-15 Blue 當場提問）。
> 這份是「查證＋建議＋操作教學」，**沒有改任何帳號程式、沒有動任何線上資料**。
> 動星塵帳號的加密／KV、新增會收集使用者資料的功能＝🔴（CLAUDE.md §7），你點頭才施工；
> 定案後請把決定寫進 Engine 的 `DECISIONS.md`（CLAUDE.md §8）。

## 0. 三句話結論

1. **不用重蓋。** 星塵帳號早就蓋好了，而且線上是開著的：2026-10-15 查
   `stardust.bluechiou.com/api/account?action=status` → `{"enabled":true}`。只是設定頁還掛著「測試中」。
2. **「Supabase 已有」其實是「Supabase 有帳號功能（Auth），但還沒啟用」。**
   運作中的專案（Blue Booking System）**Auth 登入使用者是 0 位**（另一個專案已暫停，沒辦法檢查），星塵也完全沒接 Supabase。
3. **Booking 會員帳號不能直接拿來登入星塵。** 不是不想，是技術與隱私上對不上（§2）。
   想串的話，做「選擇性連結」，不要合併成同一個帳號。

## 1. 現況盤點（只讀中繼資料，沒讀任何客戶資料）

| 項目 | 現況 | 來源 |
|---|---|---|
| 星塵帳號（email＋密碼，端對端加密） | **已上線、enabled:true**；存在 Upstash Redis（密文）；設定頁標「測試中」 | `/api/account?action=status`、`api/account.js` |
| Google Drive 備份（`cloud.js`） | 線上 `/api/config` 已回 Google Client ID，按鈕應該已亮（舊文件寫「空的」已過期） | `/api/config` |
| Supabase 專案 ①「Blue Booking System」（東京） | 運作中；只有 `customer_charts`、`member_charts` 兩張表，**都是 0 筆**；RLS 全開、anon 全擋；**Auth 使用者 0** | Supabase MCP（結構） |
| Supabase 專案 ②「Blue's Project」（新加坡） | **已暫停（INACTIVE）**；暫停中，所以裡面有沒有 Auth 使用者**沒檢查** | Supabase MCP |
| Supabase 方案 | **Free**（官方：Free 專案一週內活動太少會被暫停；暫停後 90 天內可從後台按 Resume） | Supabase 官方文件 |
| Blue-Booking 會員 | 存在 **Cloudflare D1**（不是 Supabase）；Supabase 只放「自助輸入生辰表單」 | `src/worker.js`、`supabase/README.md` |
| `member_charts` 表 | Supabase 有、但 repo 裡**找不到建表檔**（`supabase/` 只有 001–004，沒有它）→ 疑似在後台手動建的，**待確認用途** | grep 結果 |

## 2. 為什麼 Booking 會員帳號不能「直接用」

1. **cookie 過不來，也沒有給第三方用的登入端點。** 會員登入 cookie（`blue_portal`）沒設 Domain，
   只送給 `booking.bluechiou.com` 這個主機（另外是 `HttpOnly`），`stardust.bluechiou.com` 的程式讀不到；
   Booking 也沒有任何 token／OAuth／CORS 端點可以讓別的站來驗證會員。（兩個子網域其實同屬一個 site，
   所以 `SameSite=Strict` 不是主因；真正擋住的是「host-only cookie ＋ 沒有對外的驗證端點」。）
2. **「密碼」是生日。** 會員登入＝Email ＋ 本人生日 8 碼（＋訂單末 2 碼英文，舊版純生日）。
   生日是低熵值（約 3 萬多種日期），**不能當星塵端對端加密的金鑰來源**；而且生日本身就是敏感資料。
3. **只有下過預約單的客人才有帳號。** 會員是「下單當下自動建立」（不必等付款，README：下單即開通），
   一般星塵使用者沒有；而且下單≠付款，預約的狀態可能還是未付款。
4. **簽章金鑰＝後台密碼。** Booking 的 session 簽章金鑰是 `'blue-booking::' + ADMIN_PASSWORD`，
   要跟星塵共用＝把後台密碼的風險擴散出去。
5. **身分綁在一起＝資料關聯。** 星塵（心情、夢境）和 Booking（生辰、CRM、付費紀錄）本來刻意分庫；
   同一個登入會讓兩邊可以被對起來（CLAUDE.md §1：敏感度至少等同生辰）。

**可以做的版本（之後的事，要 opt-in、要有同意說明）：選擇性連結。**
星塵設定頁多一個「我是 Blue 的預約會員」，輸入預約編號＋Email，星塵後端用 Booking 現有的
`POST /api/lookup`（預約編號＋Email 查狀態）驗證，**只記一個「是會員」旗標**，兩邊登入、資料都不共用。
⚠️ 實作時必須**檢查回傳的預約狀態**（`paid`／`confirmed`／`done` 才算），否則誰都能用未付款的預約冒充會員。

## 3. 三個走法

| | A. 現有帳號補洞 | B. Supabase Auth 當登入層，資料仍端對端加密 | C. Supabase Auth ＋ 明文存後端 |
|---|---|---|---|
| 做什麼 | 補「復原碼」、可選 Email 驗證、拿掉「測試中」 | Supabase 管登入、Email 驗證、Google／Apple；密文存 Supabase | 同左，但資料伺服器讀得到 |
| 忘記密碼 | 靠復原碼救回 | 靠復原碼救回（Auth 的「重設密碼」只重設登入，救不回資料） | 可以重設 |
| 後端看得到夢境心情嗎 | ❌ 看不到 | ❌ 看不到 | ✅ **看得到** |
| Google／Apple 一鍵登入 | 沒有 | 有（但第三方登入沒有密碼 → 要另設「保險箱口令」或只靠復原碼） | 有 |
| 費用 | 約 0（Upstash） | 上線收費的服務建議 **Pro 方案**（官方：Pro 不會因低活動被暫停；⚠️ 價格、多開專案是否另計運算費用，以 supabase.com/pricing 為準）；Apple 年費 ⚠️ US$99；寄信要自己的 SMTP | 同 B |
| 工作量 | 小（幾天） | 中到大（1–2 週，含遷移與測試） | 中 |
| 風險 | 自建驗證，要自己顧安全 | 加密設計要做對（見 §5.3） | **違反「看不到」的賣點與 CLAUDE.md §1，不建議** |

**我的建議：先 A，等要上架／收 Plus 訂閱時再評估 B，C 不做。Booking 帳號不併。**
理由：現有帳號已經滿足「換手機找回紀錄」；B 的好處（Google／Apple 登入、Email 驗證）要等有付費與上架需求才值得；
而 B 建議上 Pro：官方說 Free 專案只在「低活動」時才暫停（每天幾次使用者查詢通常就夠），所以不是「一定」會壞，
但登入服務賭這個不划算，暫停了使用者就登入不了。

### 3.5 走法 A 的補洞清單（審查時已驗證的缺口；動帳號後端＝🔴，你同意才做）

1. **復原碼**：忘記密碼目前是死路（刪帳號也要密碼，鎖定畫面沒有刪除入口，同 email 無法重註冊）。
2. **刪除帳號要讓所有裝置的 session 一起失效**，或 `push`／`pull` 先確認 user 記錄還在；
   否則別台裝置會把密文寫回雲端。這同時是 Apple 5.1.1(v)「帳號刪除」要真的成立的前提
   （`docs/launch-plan.md` 寫「入口都已有」，入口有，但上述缺口沒補前不算完整）。
3. **註冊時的行銷名單勾選**：預設勾選、刪帳號不會移除名單。建議預設不勾，並讓「刪除帳號」同時移除名單。
4. 設定頁拿掉「測試中」之前，先把上面三項測過。

## 4. Supabase 官方文件查到、會影響決策的事

- **Free 專案會被暫停**：一週內資料庫活動太少就暫停；暫停 90 天內可手動還原。要保證不暫停→Pro。（`Project Pausing`）
- **內建寄信服務只是試用**：有很低的每小時上限、不保證送達，而且**只寄得到你組織成員的信箱**——
  其他人註冊會失敗（`Email address not authorized`），所以**一定要接自己的 SMTP**（Resend／SendGrid／SES 等）。
  接上後預設「全專案每小時最多 30 封」（註冊驗證、重設密碼、改 Email 合計；官方 Production Checklist 寫成
  30 new users per hour），可在 Authentication → Rate Limits 調高。（`auth-smtp`、`rate-limits`、`Production Checklist`）
- **Apple 登入（網頁 OAuth 流程）的 secret key 每 6 個月要重新產生**，漏了會直接登入失敗。（`Login with Apple`）
- Email 登入預設就開、且**預設要求 Email 驗證**（托管專案）。
- 帳號刪除（Apple 5.1.1(v)）：B 要自己補「刪除 Supabase 使用者＋刪密文」的流程。

## 5. 操作教學

### 5.1 現在就能做：親手測一次目前的星塵帳號（約 10 分鐘）

> 全程用**假資料**。不要拿真日記來測。

1. 開 `stardust.bluechiou.com` → 設定 → 「🐰 星塵夢汐帳號」。
2. 用**測試信箱**註冊（例：`你的信箱+stardust1@gmail.com`，Gmail 的 `+標籤` 會寄到同一個信箱）。密碼自己記好。
   ⚠️ **取消勾選**「我想搶先體驗新功能，並接收神奇海螺專屬優惠碼」——預設是勾的，勾著會把測試信箱
   （連同暱稱、IP）寫進正式的行銷名單，而且步驟 6 的刪除**不會**把它移掉。
3. 寫一則假日記（例：「測試」），等 3 秒（自動同步）。
4. 用**另一個瀏覽器或無痕視窗**打開同網址 → 登入同一個帳號 → 應該看到那則日記。
5. 想驗「忘記密碼」：這是**刻意沒有**的功能（找不回）。⚠️ **已知缺口**：忘記密碼的對話框建議
   「先刪掉舊的雲端帳號再重註冊」，但刪帳號需要密碼、且「鎖定」畫面沒有刪除按鈕——忘記密碼的人實際上
   **沒有任何出路**，同一個 email 也無法重新註冊（會回「已註冊過」）。這會列入走法 A 的補洞清單（見 §3.5）。
6. 到設定頁按「🗑 刪除雲端帳號」→ 再用同帳密登入，應該失敗。
   ⚠️ **已知缺口**：「登入失敗」不等於「雲端資料已清乾淨」。刪除只會讓**當下這一台**的 session 失效；
   如果另一台裝置（步驟 4 的第二個瀏覽器）還登入著，它下一次自動同步會把密文**重新寫回**雲端
   （審查時用模擬的 Redis 重現過：刪除後再 push，`stardust:acct:d:<email>` 又出現）。
   所以測這步時，請先在其他裝置**登出**，或兩個裝置都不要再改資料。上架前這個一定要補（見 §3.5）。

測完回報我哪一步怪怪的（畫面、錯誤訊息），我來修走法 A。

### 5.2 如果決定走 B：Supabase 設定步驟（Blue 要親自點的部分）

先決定**用哪個專案**：**建議新開一個「Stardust」專案**，不要用「Blue Booking System」——
那個專案放的是客戶生辰，同一把 service key 洩漏的範圍太大，也違背兩邊分庫的設計。

1. **方案**：Supabase 後台 → Organization → Billing → 升級 Pro（避免暫停）。⚠️ 價格看官網。
2. **新專案**：New project → 名字 `Stardust`；區域選東京（和現有專案同區，延遲低）。
3. **Auth → Providers → Email**：開啟、**勾 Confirm email**、OTP 到期設 3600 秒以內。
4. **Auth → URL Configuration**：
   - Site URL：`https://stardust.bluechiou.com`
   - Redirect URLs：加 `https://stardust.bluechiou.com/**`（要測 Vercel 預覽網址就再加那個）。
5. **Auth → Emails → SMTP Settings**：接 Resend（或 SES）。寄件人用 `noreply@bluechiou.com`，
   到網域 DNS 補 Resend 給的 SPF／DKIM 記錄，**關掉連結追蹤**（會把驗證連結弄壞）。
   （沒接 SMTP 前，只有你組織成員的信箱收得到信。）
6. **Google 登入**（選配，免費）：重用你已有的 Google Cloud 專案「Stardust DreamTide」→
   憑證 → 建 **OAuth 用戶端 ID（網頁應用程式）** → 「已授權的重新導向 URI」填
   `https://<專案ref>.supabase.co/auth/v1/callback` → 把 Client ID／Secret 貼進
   Supabase → Auth → Providers → Google。（Secret 只放 Supabase，不進 git。）
   ⚠️ 若那個 Google 專案的 OAuth 同意畫面還在「**測試中**」，只有你手動加進名單的**最多 100 位**測試使用者能登入，
   其餘人會看到「未經驗證」警告；要對外開放得「發布」並送 Google 驗證（見 `social-login-setup.md` §一）。
7. **資料表**（草案；**確認前不要執行**）：

   ```sql
   -- 一人一列，只存密文；伺服器看不到明文
   create table public.stardust_vault (
     user_id      uuid primary key references auth.users(id) on delete cascade,
     blob         jsonb not null,        -- { v, iv, ct }：整包紀錄的密文
     wrapped_keys jsonb,                 -- 主金鑰分別用「密碼」「復原碼」包起來的兩份（也是密文）
     updated_at   timestamptz not null default now()
   );
   alter table public.stardust_vault enable row level security;
   create policy "own row only" on public.stardust_vault
     for all to authenticated
     using ((select auth.uid()) = user_id)
     with check ((select auth.uid()) = user_id);
   -- 新開的 Supabase 專案不再自動把新表開放給 API 角色，要明講（只給 authenticated，不給 anon）。
   -- 與 RLS 放在同一支 migration。少了這行，前端會得到 42501 permission denied。
   grant select, insert, update, delete on table public.stardust_vault to authenticated;
   ```
   （`updated_at` 只有預設值，UPDATE 不會自動更新：由前端每次 upsert 時帶入，或加 trigger。）
8. **Vercel 環境變數**（Settings → Environment Variables）：`SUPABASE_URL`，以及 Project Settings → API 裡
   給前端用的公開金鑰（新版叫 **publishable key**，舊版叫 **anon key**；兩者是同一個角色的不同名字，
   新專案以 publishable 為準，變數名自訂即可）。**不要**把 service_role／secret key 放進前端或 git。
9. **Apple 登入**（最後再做）：Apple Developer（⚠️ 約 US$99／年）→ App ID、Service ID、`.p8` 金鑰；
   **設定貼在 Supabase → Auth → Providers → Apple**，Service ID 的 Return URL 填
   `https://<專案ref>.supabase.co/auth/v1/callback`；**在行事曆設 6 個月提醒重新產生 secret key**。
   `docs/social-login-setup.md` §二 那份是「自建後端 `api/apple-callback.js`」的做法（不走 Supabase），
   只有 Apple Developer 後台的前置步驟（App ID／Service ID／`.p8`）可以參考，其餘不要照抄。

### 5.3 走 B 時，端對端加密要這樣設計（先講概念，施工前再細談）

- **問題**：用 Supabase 登入時，密碼會送到它的伺服器；如果加密金鑰也是同一個密碼推出來的，
  理論上伺服器能自己算出金鑰。**所以登入密碼和加密金鑰必須分開。**
- **做法（業界常見的「主金鑰＋復原碼」）**：
  1. 註冊時在手機上隨機產生一把 256-bit **主金鑰**，資料全部用它加密。
  2. 主金鑰再被「由密碼推出的金鑰」包起來存一份、被「復原碼」包起來存一份（都是密文）。
  3. 註冊當下請使用者把**復原碼**（一串字或 QR）存起來；忘記密碼時用復原碼解開主金鑰、再設新密碼。
- **代價**：復原碼弄丟＋密碼忘記＝資料仍然救不回（這是端對端的本質）；但比現在「忘記密碼就全沒了」多一道保險。
- Google／Apple 登入沒有密碼 → 只能靠「保險箱口令」或復原碼保護資料，要在畫面上講清楚。

## 6. 需要 Blue 回答的決策

1. 走 **A（補洞）** 還是 **B（Supabase）**？（建議 A；B 等上架／Plus 訂閱）
2. 要不要先做「**復原碼**」？（A、B 都用得上，是最划算的一步）
3. 「選擇性連結 Booking 會員」要不要做？（建議等有 Plus 訂閱、需要「會員優惠」時再說）
4. `member_charts` 那張表是誰建的、用途是？（repo 裡找不到建表檔；若沒在用，建議補一支 migration 或刪掉）
5. Supabase 要不要升級 Pro？（B 的前提；A 不需要）
6. 要不要先修 §3.5 的三個缺口？（建議要；它們不等 Supabase，是現有帳號本來就有的）

## 7. 這次查證做了什麼／沒做什麼

- 做了：讀 `api/account.js`、`account.js`、Booking 的會員程式、`supabase/`；呼叫 `/api/account?action=status`、`/api/config`；
  Supabase 只讀**專案清單、資料表結構、RLS 政策數、資安建議、Auth 使用者「數量」**。
- 沒做：沒讀任何客戶資料列、沒建立／刪除任何帳號、沒改任何資料庫或環境變數。
- ⚠️ 未核實：Supabase Pro 價格、Apple 年費；以官方頁面為準。
- 事後審查（同日）：另有 8 位獨立審查員對照程式碼與官方文件逐條檢查，上面標「已知缺口」「⚠️」的修正即來自審查結果；
  刪帳號後密文復活、忘記密碼死路、註冊勾選行銷名單，都用程式碼或模擬重現過。
