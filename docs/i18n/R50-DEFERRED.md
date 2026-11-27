# 第 50 輪另案待辦（這一輪不做）

版本 2.51.0 已把畫面上的文字接上英文。下面兩件事留到下一輪，這一輪沒有改圖。

## 首頁標誌要出英文版

- 現在首頁抬頭用的是 `public/art/r8/logo.png`。
- 圖裡寫的是「島嶼交通學院」。英文模式的替代文字已經是 Island Transport Academy，圖本身仍是中文。
- 上一輪指定的繪圖額度用完，所以沒有重畫。下一輪再做一張英文標誌，接到同一個位置。
- 舊檔也有同樣的中文字標，現在的首頁沒有用到它們：`public/art/r4/logo.png`、`public/art/r5/logo.png`、`public/art/r6/logo.png`、`public/art/r7/logo.png`。

## 各線盤到的圖片中文

這一輪只列清單，沒有改像素。

| 檔案 | 圖裡的字 | 出現位置 |
| --- | --- | --- |
| `public/art/r8/logo.png` | 島嶼交通學院 | 首頁抬頭的字標。英文模式看得到這張圖。 |
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
