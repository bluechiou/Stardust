# blue-theme

Claude Code 的外觀主題 mod：依專案自動換背景，一眼看出現在在哪個 repo。

| 專案 | 主題 |
|---|---|
| Blue_Astral_Nexus_APP、Blue_Astral_Nexus_Engine、aethnous-web（原 aethnous-landing） | 深色宇宙：慢速漂移的星雲＋極慢閃爍的星點 |
| Blue-Booking、Stardust | 淺色海潮：藍天白雲＋慢速海浪 |

- 只有 Claude 桌面版與手機 App 會畫主題；terminal 不畫。
- `/custom-theme cosmos｜ocean｜auto｜off`：手動指定這個專案的主題（存在本機，跟著專案資料夾），`auto` 回到上表。
- 判斷專案的方式：讀 `.git/config` 的 origin 名稱，找不到就用資料夾名。新增 repo 改 `hooks/register.tsx` 的 `BINDINGS`。
- 背景是純 SVG＋CSS 動畫，由 `scripts/gen-cosmos.mjs`、`scripts/gen-ocean.mjs` 產生；改完在這個資料夾執行 `node scripts/build-scenes.mjs` 重建 `hooks/scenes.ts`。
- `hooks/make-colors.js` 是 Claude Code 附的配色工具，原樣複製，不要手改。

**正本在 `Blue_Astral_Nexus_Engine/.claude/skills/blue-theme/`**，其他 repo 是同樣的副本；改了要五個 repo 一起更新。
