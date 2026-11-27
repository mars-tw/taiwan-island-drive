# 中英文切換怎麼用（R50 起）

給接手翻譯的各線（L2 數學遊戲室＋火車謎題、L3 三種駕駛課＋場景）看的說明。
核心程式：`src/shared/i18n.js`；切換鈕：`src/shared/language-ui.js`；英文用字：[GLOSSARY.md](GLOSSARY.md)。

## 原則

- **中文原句就是 key**。中文模式下 `t('開門接客')` 原樣回傳，所以中文版一個字都不會變。
- 英文寫在字典檔，字典找不到時退回中文（畫面不會空白），同時記進 `getMissingTranslations()`。
- 切換不重新整理頁面、不動任何進度；各畫面收到通知後自己重畫字。
- 第一次開啟看裝置語言：裝置第一語言是英文就用英文，其他一律繁中。之後記住家長或孩子的選擇
  （`localStorage` 的 `island-transport:language:v1`，App 版另存一份在 Preferences）。存檔讀不到、內容怪怪的，一律安靜退回中文。

## 字典檔與分工

| 檔案 | 負責 | 範圍 |
| --- | --- | --- |
| `src/shared/i18n/en-core.js` | L1 | 首頁、導覽列、學生證／護照外框、家長設定、家長確認、安全觀察課、主線與列車數學課（academy*.js）、四個 html 的 `<title>`／描述 |
| `src/shared/i18n/en-math.js` | L2 | `src/games/math/`、`data/*.json` 的玩家文字與題目語音 |
| `src/shared/i18n/en-puzzles.js` | L2 | `src/games/puzzles/` |
| `src/shared/i18n/en-car.js` | L3 | `car/index.html` 內文、`src/games/car/` |
| `src/shared/i18n/en-train.js` | L3 | `train/index.html` 內文、`src/games/train/` |
| `src/shared/i18n/en-flight.js` | L3 | `flight/`、`src/games/flight/` |
| `src/shared/i18n/en-scenes.js` | L3 | `content-r*.js`、`content-r*-scene.js`、`content-r*-ui.js`、`journeys.js`、`child-display.js` 等 |

- 每個字典檔都已經被 `i18n.js` 載入（全站每一頁都有全部英文），**各線只改自己的字典檔，不用碰 `i18n.js`**。
- 真的要新開字典檔：放在 `src/shared/i18n/en-*.js`，`export default Object.freeze({...})`，再到 `i18n.js` 加一行 import 和註冊。
  沒接上的話守門測試會失敗。
- 同一句中文在兩個字典給了不同英文，測試會失敗。共用的句子（例如「暫停」）用已經有的那條，不要重複寫。

字典格式：

```js
export default Object.freeze({
  '開門接客': 'Open doors',                                   // 一般
  '第 {n} 站／共 3 站': 'Stop {n} of 3',                       // 帶參數
  '收集到 {n} 顆星星': { one: '{n} star collected', other: '{n} stars collected' }, // 單複數（看 n 或 count）
});
```

## API（`import { … } from '../../shared/i18n.js'`）

| 名稱 | 用途 |
| --- | --- |
| `t(中文, params?)` | 取目前語言的字。`t('第 {n} 章：{name}', { n: 2, name: t('海風站接朋友') })`。參數裡的中文要自己再包一層 `t()`。 |
| `setText(el, 中文, params?)` / `setAttr(el, 'aria-label', 中文)` | 把字放上元素，並把 key 記在元素屬性上（`data-i18n`）。之後每次切換自動更新，**`cloneNode()` 的複本也會跟著換**。元素裡只能有這段文字（會整個換掉 textContent）。 |
| `bindLocalized(root)` | 讓一整塊寫死在 html 或 `innerHTML` 樣板裡的中文自動切換（文字、`aria-label`、`alt`、`title`、`placeholder`）。程式之後自己改掉的字也會重新抓。 |
| `localize(root)` | 同上但只做一次（適合每次重畫都新建的區塊）。 |
| `onLanguageChange(fn)` | 切換後呼叫 `fn(language)`，回傳取消訂閱。動態組出來的畫面在這裡重畫。DOM 事件版：`document` 上的 `academy:languagechange`。 |
| `getLanguage()` / `isEnglish()` | `'zh-Hant'` 或 `'en'`。 |
| `setLanguage(lang)` / `toggleLanguage()` | 切換並記住（一般只有切換鈕會用）。 |
| `joinList(items)` | 中文用「、」，英文用 `, `。 |
| `formatNumber` / `formatDate` / `formatTime` / `formatDuration(秒)` | 依語言格式化（`zh-TW`／`en-US`）。注意：原本中文畫面直接印數字的地方，換成 `formatNumber` 會多出千分位逗號，會改到中文；中文要保持原樣就照舊直接放數字。 |
| `speechLanguage()` / `resolveSpeechLanguage(text, lang?)` | 語音語言（`zh-TW`／`en-US`）。 |
| `translateText(完整中文)` | 給整句已組好的中文找英文（含帶參數的 key 反查）。一般用不到，`bindLocalized` 內部在用。 |

## 怎麼翻

### 程式裡直接寫的字

```js
button.textContent = '再練一次';            // 改前
button.textContent = t('再練一次');         // 改後
hint.textContent = t(done ? '完成了！' : '再試一次');   // 三元運算放在 t() 裡面也可以
```

### 動態組字串

不要拆成好幾段拼，整句寫成一個 key，把變數換成 `{名字}`：

```js
label.textContent = `第 ${n} 站／共 3 站`;                 // 改前
label.textContent = t('第 {n} 站／共 3 站', { n });         // 改後：中文輸出一字不差
```

有加減的尾巴（例如「 · 數學調度章」）就把每段各自 `t()`，再用 `' · '` 接起來，確認中文和原本一樣。

### 資料表裡的名稱

名稱、說明留在資料裡（中文），**在顯示的地方**包 `t()`：`title.textContent = t(journey.name)`。
這樣邏輯、存檔、比對都不受影響。資料表要在測試裡列出來檢查（見下方「測試」）。

### html 與 innerHTML 樣板裡的字

- 整塊固定文字：建立後呼叫 `bindLocalized(容器)`（只要呼叫一次）。
- 會被複製（`cloneNode`、`outerHTML`）的小標籤：用 `setText` / `setAttr`，key 跟著複本走。
- 刻意不翻的元素加 `translate="no"`（切換鈕就是這樣）。
- 既有測試有釘住 html 原文的地方，不要改 html 本身，改在 JS 裡 `bindLocalized`。
- CSS `content:'中文'` 不會被翻：另外加 `html[lang=en] .選擇器::after{content:'English'}`。
  目前已知：`src/games/math/room.css`（打開看看／收起）、`content-r17.css`、`content-r18.css`、`content-r21.css`。

### 重畫

```js
function render() { /* 用 t() 組畫面 */ }
onLanguageChange(() => { if (visible) render(); });
```

切換鈕在首頁，打開中的對話框通常是 modal，孩子點不到；但另一個分頁切換時會透過 `storage` 事件同步，所以開著的畫面也要能重畫。

### 語音

- `speakNative(text)` **不要再傳 `lang: 'zh-TW'`**，預設跟著目前語言。舊程式傳了也不會壞：英文模式下英文句子會自動改用英文語音。
- 中文句子永遠用中文語音念（還沒翻的字不會被英文語音亂念）。
- 裝置沒有離線英文語音：不念、不報錯，回傳 `{ spoken: false }`，畫面照常顯示字。

### 圖片裡的中文

`alt` 用 `bindLocalized` 或 `t()` 翻。首頁字標已有英文版：英文模式用 `art/r8/logo-en.png`，中文模式仍用 `art/r8/logo.png`。
其他烘進圖裡的中文（舊版字標、站牌圖）英文模式仍是中文，另案盤點見 [R50-DEFERRED.md](R50-DEFERRED.md)。

## 測試（`tests/shared/i18n-r50.test.js`）

會自動納入、不用改測試的：

- 全部 `src/**/*.js` 裡 `t('…')`、`setText(el, '…')`、`setAttr(el, 'x', '…')` 的字面 key 都要有英文。
- `src/shared/i18n/en-*.js` 新檔一定要被 `i18n.js` 載入；同 key 不能有兩種英文。
- 每條英文：不能有中文、不能有全形標點、`{參數}` 要和中文 key 一樣。
- [GLOSSARY.md](GLOSSARY.md) 第一張表的標籤，所有字典都要一字不差照用。

翻完自己的範圍時要加的：

1. 把檔名加進測試的 `FULLY_TRANSLATED`：之後那個檔裡**每一段中文**都必須有英文，而且 `${}` 樣板裡不能再夾中文。
   html 加進 `HTML_SCOPE`（`'all'` 全頁、`'head'` 只檢查 title 與描述）。不給玩家看的中文（例如拿來比對的訊息開頭）放進 `NOT_UI` 並寫原因。
2. 經過 `t()` 顯示的資料表（關卡名、說明）加進「data shown through t()」那條測試。
3. 改了組字串的地方，在「Chinese mode … like the old templates」那條加一行 `[新寫法, 舊寫法]`，證明中文一字不差。
4. 跑 `npm test`，再用三種尺寸（390×844、844×390、1366×768）各看一次中文、英文畫面：沒有切字、重疊，按鈕仍 ≥60px。
