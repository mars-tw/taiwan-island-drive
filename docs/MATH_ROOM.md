# 數學遊戲室（R48）

首頁的「列車數學課」（主線第 1 章時）和「數學遊戲室」按鈕都會打開遊戲室。遊戲室分四個分頁：數學、觀察與記憶、拼搭與方向、生活與分享。第一批放了《小小列車長》1.11.0 裡 17 種不需要實車照片的玩法，再加上原本的拆合車廂調度台（放在數學分頁第一張）。找火車、記憶翻卡、火車拼圖要等照片授權清單（C 線）。

## 檔案

| 檔案 | 內容 |
|---|---|
| `src/games/math/engine.js` 等 17 個移植檔 | 原版題目產生與判斷，只加署名檔頭、拿掉 `?v=` 快取參數（清單見 `docs/r48-math-room-assets.json`） |
| `src/games/math/room-registry.js` | 分類、年齡級距、`registerMathGame` 註冊介面 |
| `src/games/math/room-play.js` | 一輪的出題、作答、回饋（不碰畫面） |
| `src/games/math/room-store.js` | 學生證 `sections.mathRoom`：年齡級距、集章、最近題目、接回的舊紀錄 |
| `src/games/math/room-ui.js`、`room.css` | 遊戲室對話框、遊玩畫面、集章冊 |
| `tests/math/*-ported.test.js` | 原版 14 個測試檔（93 項） |
| `tests/math/room.test.js` | 遊戲室入口、分頁、17 種各玩完一輪、年齡級距、存檔接回 |

## 年齡級距

家長設定的「數學遊戲室年齡」：3～4 歲（5 以內）、5～6 歲（10 以內）、7～8 歲（20 以內）。家長還沒選時跟著幼兒模式：開＝3～4 歲、關＝5～6 歲（和以前調度台的規則一樣）。調度台也用同一個級距。一輪的題數照原版：3～4 歲 3 題，5～8 歲 5 題。

## 舊進度

- 家長在設定裡帶入的小小列車長備份，原文存在學生證 `academy.archive`。遊戲室打開時會解開它，把列車紀念章、旅程數、小禮物、主題旅程接回集章冊。
- 同網域的舊存檔鍵 `taiwan-train-math.v1` 讀得到就一起接；讀不到、格式壞掉都只略過，不報錯。
- 接回的結果存進 `mathRoom.legacy`，之後舊鍵不見了也不會掉章。兩個來源可能是同一本護照，所以旅程數取最大值，不相加。

## 註冊新玩法（給 B 線火車謎題、新數學玩法）

```js
import { registerMathGame } from '../games/math/room-registry.js';

registerMathGame({
  id: 'harbor-boarding',            // 小寫英數與連字號，不能和現有的重複
  category: 'math',                 // 'math' | 'observe' | 'build' | 'life'
  name: '海風站上下車',              // 16 字以內
  icon: '🚉',                       // 1～4 個字元
  description: '每站有人上車、下車，算算車上幾人。', // 48 字以內
  levels: ['medium', 'large'],      // 'small'＝3～4 歲、'medium'＝5～6 歲、'large'＝7～8 歲
  order: 70,                        // 選填；同分頁排序，原版玩法是 10、20、30…，調度台是 5
  status: () => ({ stamps: 0, note: '', highlight: false }), // 選填；卡片上的章數或小標
  open(ctx) {
    // 小朋友點卡片時呼叫。畫進 ctx.stage，玩完一輪呼叫 ctx.complete()。
    const stop = mountHarborBoarding(ctx.stage, { level: ctx.level, onRoundDone: () => ctx.complete(), onExit: () => ctx.exit() });
    return () => stop();            // 選填；離開時清理（計時器、事件）
  },
});
```

- 什麼時候註冊都可以，遊戲室下一次畫面就會出現卡片；建議和調度台一樣放在 `src/shared/academy-ui.js` 的 `installAcademy()` 裡。格式不對會直接丟錯，開發時就看得到；回傳值是取消註冊的函式。
- `ctx` 內容：
  - `level`、`ageLabel`：目前的年齡級距（例如 `'large'`、`'7～8 歲'`）。
  - `stage`：遊戲室遊玩區裡的空白元素，上方已有「← 遊戲室」和「暫停」。
  - `setTitle(text)`：改上方標題。
  - `complete()`：蓋一個章並放慶祝效果，回傳這個玩法目前的章數。
  - `exit()`：回遊戲室首頁。
  - `hideRoom()`：要開自己的全螢幕對話框時先把遊戲室收起來，結束時呼叫 `exit()` 會再打開（調度台就是這樣）。
  - `speak(text)`：用學院現有的語音唸出來（家長關掉聲音時不唸）。
  - `paused`：遊戲室暫停中為 `true`；暫停時遊戲室會蓋一層「休息一下」。
- 玩法原則同原版：不計時、可以重試、答錯只給方法提示、按鈕至少 60px，手機直式、橫式都要按得到主要按鈕。
