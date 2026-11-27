# 第 50 輪另案待辦

版本 2.51.0 已把畫面上的文字接上英文。首頁英文標誌已經補上並接到英文模式。各線圖片裡烘進去的中文仍列在下面，那些圖沒有改像素。

## 首頁標誌英文版（已完成）

- 英文模式（`en`）首頁 `.brand-wordmark` 改用 `public/art/r8/logo-en.png`。上排是 ISLAND，下排是 TRANSPORT ACADEMY，透明背景。
- 中文模式（`zh-Hant`，畫面語系 `zh-TW`）仍用 `public/art/r8/logo.png`。這個中文圖檔沒有改過。
- `index.html` 預設仍寫中文標誌。進英文時由 `src/home.js` 換圖，切回中文再換回來。
- 建置的預快取會收進 `public` 裡的 png，所以 `art/r8/logo-en.png` 會進 `dist/precache.json`。`public/sw.js` 照清單抓，不用單獨加檔名。
- 舊的中文字標還在素材夾，現在的首頁沒有掛上：`public/art/r4/logo.png`、`public/art/r5/logo.png`、`public/art/r6/logo.png`、`public/art/r7/logo.png`。

## 各線盤到的圖片中文

這一輪只列清單，沒有改像素。

| 檔案 | 圖裡的字 | 出現位置 |
| --- | --- | --- |
| `public/art/r8/logo.png` | 島嶼交通學院 | 中文模式的首頁字標。英文模式改看 `public/art/r8/logo-en.png`。 |
| `public/art/r4/logo.png` | 島嶼交通學院 | 舊版字標，留在素材夾，現在的首頁沒有掛上。 |
| `public/art/r5/logo.png` | 島嶼交通學院 | 同上。 |
| `public/art/r6/logo.png` | 島嶼交通學院 | 同上。 |
| `public/art/r7/logo.png` | 島嶼交通學院 | 同上。 |

看過、圖上沒有中文句子的：

- `public/art/r5/station.png`：藍色空白站牌。火車下一站的小圖用它（`src/shared/art-round5.css` 的 `.next-station`）。說明文件舉過站牌當例子，這張實際沒有字。
- `public/art/r8/coast-sign.png`：燈塔盾牌，沒有字。汽車、火車、飛機的場景會放這張。
- `public/art/r5/ticket.png`、`public/art/r8/ocean-ticket.png`：空白票框。
- `public/art/content-r2/station.webp`、`public/art/content-r24/station-lighthouse.webp`：月台和燈塔背景，站牌是空白的。

語言切換鈕上的「中文」是按鈕自己的文字，不是烘進圖裡的字。它用來切回中文，英文模式要留著。
