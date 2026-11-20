// 重新產生 hooks/scenes.ts：node scripts/build-scenes.mjs（在 blue-theme 資料夾裡執行）
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
const run = f => execFileSync(process.execPath, [new URL(f, import.meta.url).pathname]).toString()
writeFileSync(new URL('../hooks/scenes.ts', import.meta.url),
  '// 由 scripts/build-scenes.mjs 產生，不要手改\n' +
  `export const COSMOS = ${JSON.stringify(run('./gen-cosmos.mjs'))}\n` +
  `export const OCEAN = ${JSON.stringify(run('./gen-ocean.mjs'))}\n`)
