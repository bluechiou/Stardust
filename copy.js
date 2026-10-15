/* ============================================================
   星塵夢汐 — 可由後台改的預設文案（前台與 admin.html 共用）
   ────────────────────────────────────────
   COPY_GROUPS 是「後台能改哪些字」的清單，也是這些字的出廠預設。
   前台用 C("key") 取字：後台有改就用後台的，沒改（或改成空的）就用這裡的預設。
   後台的修改存在伺服器（api/copy），前台開啟時抓一次、並留一份在本機供離線使用。

   type：text 單行｜area 多行文字｜lines 一行一則（隨機抽選或固定順序的清單）
   想讓某句文案能被後台改：在這裡登記一個 key，前台改用 C("key")，並記得 esc() 後再輸出。
   水晶的功效（每顆 fx／common）另外動態產生，key 為 crystal.<id>.fx／crystal.<id>.common。
   ============================================================ */

const COPY_GROUPS = [
  { id: "mood", title: "心情", items: [
    { key: "mood.labels", label: "心情 5 級名稱（由好到壞，剛好 5 行）", type: "lines", exact: 5,
      def: ["大晴天", "晴天", "陰天", "雨天", "颱風天"] },
    { key: "mood.comfort", label: "選到最後一級（颱風天）時跳出的安慰話語（一行一句，隨機抽一句）", type: "lines",
      def: [
        "明天一定會更好的 🌤",
        "今天雖然很糟糕，但你已經盡力了，記得謝謝自己 🤍",
        "Everything's gonna be okay. 🌈",
        "今天就快過完了，早點休息，明天好事會發生 🌙",
        "Tomorrow is a new day. 🌅",
        "You did the best you could today, and that's enough.",
        "颱風天也會過去，風雨之後一定有晴天。",
        "Be gentle with yourself. You're doing the best you can.",
        "這一關你已經撐過來了，先抱抱自己。",
        "This too shall pass. 🍃",
        "你不需要一次解決所有事，先喝杯水、深呼吸三下。",
        "Rest is productive too. Go easy on yourself tonight.",
        "再黑的夜，月亮都還是在那裡。",
        "感覺很糟也沒關係，你的感受是被允許的。",
        "Storms don't last forever. 🌈",
        "今天的你，已經很勇敢了。",
      ] },
    { key: "mood.comfortNote", label: "安慰視窗底部的小字", type: "text",
      def: "需要人陪的時候，也可以找信任的朋友，或專業的人聊聊。" },
  ] },
  { id: "home", title: "首頁卡片", items: [
    { key: "home.moon.dream", label: "月相卡・按鈕一", type: "text", def: "🌙 記錄夢境" },
    { key: "home.moon.diary", label: "月相卡・按鈕二", type: "text", def: "✍️ 寫下日記" },
    { key: "home.mood.title", label: "心情卡・標題", type: "text", def: "今天的心情" },
    { key: "home.mood.hint", label: "心情卡・說明", type: "text", def: "每天一個圖示，久了就能看出心情和月相的共時性。" },
    { key: "home.gratitude.title", label: "三件感謝・標題", type: "text", def: "三件感謝" },
    { key: "home.gratitude.intro", label: "三件感謝・說明", type: "text",
      def: "寫下今天三件值得感謝的小事，再小都算數，這是挖掘生命快樂泉源的最佳管道。" },
    { key: "gratitude.pool", label: "三件感謝・前兩格的提示文案（一行一句，每次開 App 隨機抽兩句）", type: "lines",
      def: [
        "有人對我說了一句什麼話，讓我很開心",
        "今天吃到了什麼讓你感到很幸福？",
        "今天有沒有遇到什麼特別的人事物？",
        "今天想記錄下來的一句話",
        "今天讓你感覺快樂的時刻和場景",
        "今天跟誰聊天或傳訊息讓你覺得很開心？",
        "今天有什麼小確幸，讓你心裡暖了一下？",
        "今天身體或心裡，有什麼值得謝謝的地方？",
        "今天誰幫了你一個小忙，或讓你覺得被理解？",
        "今天看見、聽見或聞到什麼，讓你心情變好？",
        "今天哪件事比你想像中順利？",
      ] },
    { key: "gratitude.third", label: "三件感謝・第三格的固定提示文案", type: "text",
      def: "今天忍住、努力撐過去的也寫下來感謝自己" },
    { key: "home.todo.title", label: "待辦事項・標題", type: "text", def: "待辦事項" },
    { key: "home.todo.add", label: "待辦事項・新增欄位的提示文字", type: "text", def: "新增事項⋯按 Enter" },
    { key: "home.notes.add", label: "隨身小本本・輸入欄提示文字", type: "text", def: "想到什麼就寫下來⋯按 Enter" },
    { key: "home.wins.add", label: "小勝利聖杯・輸入欄提示文字", type: "text", def: "例：今天準時起床了⋯按 Enter" },
    { key: "compassion.lines", label: "本日份自我鼓勵（一行一句，依日期輪替）", type: "lines",
      def: [
        "如果今天的你只做到一點點，那也已經足夠了。",
        "對自己說一句，你平常會對好朋友說的安慰話語。",
        "情緒不需要被解決，它只需要先被你發現。",
        "你不必時刻都堅強，一邊流淚一邊勇敢也可以。",
        "犯錯不會損失你的價值，那是你正在學習的證據。",
        "此刻的難受會過去，你已經撐過 99% 的難關。",
        "允許自己慢慢來，我們不需要跟任何人比賽。",
        "願意記錄自己內在輪廓，就是一種很深層的自我照顧。",
      ] },
  ] },
  { id: "tabs", title: "底部分頁名稱", items: [
    { key: "tab.today", label: "首頁", type: "text", def: "首頁" },
    { key: "tab.dream", label: "夢境", type: "text", def: "夢境" },
    { key: "tab.cbt", label: "思考", type: "text", def: "思考" },
    { key: "tab.moon", label: "月曆", type: "text", def: "月曆" },
    { key: "tab.crystal", label: "水晶", type: "text", def: "水晶" },
    { key: "tab.cosmos", label: "宇宙", type: "text", def: "宇宙" },
    { key: "tab.more", label: "召喚寶庫（召喚與寶庫已合併）", type: "text", def: "召喚寶庫" },
    { key: "tab.settings", label: "設定", type: "text", def: "設定" },
    { key: "tab.booking", label: "預約（外部連結）", type: "text", def: "預約" },
  ] },
];

const COPY_DEFAULTS = {};
for (const g of COPY_GROUPS) for (const it of g.items) COPY_DEFAULTS[it.key] = it.def;

let COPY_OVERRIDES = {};

/* 值是否可用：字串不能是空白；清單要有內容，指定 exact 的清單行數必須剛好 */
function copyValid(key, v) {
  const def = COPY_DEFAULTS[key];
  if (Array.isArray(def)) {
    if (!Array.isArray(v)) return false;
    const exact = COPY_GROUPS.flatMap(g => g.items).find(i => i.key === key)?.exact;
    return v.length > 0 && v.every(x => typeof x === "string" && x.trim()) && (!exact || v.length === exact);
  }
  return typeof v === "string" && v.trim() !== "";
}
function C(key) {
  const v = COPY_OVERRIDES[key];
  return copyValid(key, v) ? v : COPY_DEFAULTS[key];
}

/* 套用後台文案。水晶功效直接改在 CRYSTAL_DB 上（第一次先備份出廠值，之後可還原）。 */
function applyCopyOverrides(values) {
  COPY_OVERRIDES = values && typeof values === "object" ? values : {};
  if (typeof CRYSTAL_DB === "undefined") return;
  for (const c of CRYSTAL_DB) {
    c._fx0 ||= c.fx; c._common0 ||= c.common;
    const fx = COPY_OVERRIDES[`crystal.${c.id}.fx`], cm = COPY_OVERRIDES[`crystal.${c.id}.common`];
    const ok = a => Array.isArray(a) && a.length && a.every(x => typeof x === "string" && x.trim());
    c.fx = ok(fx) ? fx : c._fx0;
    c.common = ok(cm) ? cm : c._common0;
  }
}
