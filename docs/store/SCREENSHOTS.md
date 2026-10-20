# 真實畫面截圖清單

## 2.12.0／R8 現行美術送審準備圖

現行選圖以 [`screenshots/art-r8/SELECTED.json`](screenshots/art-r8/SELECTED.json) 為準：每裝置七張不同階段，共14張。原尺寸為iPhone1290×2796、iPad2064×2752，全部無合成Web實載，不冒充原生截圖；尚未上傳。

| 階段 | iPhone原圖 | iPad原圖 |
|---|---|---|
| 學院首頁 | [01-home](screenshots/art-r8/iphone-01-home.png) | [01-home](screenshots/art-r8/ipad-01-home.png) |
| 海岸駕駛 | [02-driving](screenshots/art-r8/iphone-02-driving.png) | [02-driving](screenshots/art-r8/ipad-02-driving.png) |
| 自然碰撞得星 | [03-car-star](screenshots/art-r8/iphone-03-car-star.png) | [03-car-star](screenshots/art-r8/ipad-03-car-star.png) |
| 真正離地起飛 | [04-takeoff](screenshots/art-r8/iphone-04-takeoff.png) | [04-takeoff](screenshots/art-r8/ipad-04-takeoff.png) |
| 空中找到星星 | [05-flight-star](screenshots/art-r8/iphone-05-flight-star.png) | [05-flight-star](screenshots/art-r8/ipad-05-flight-star.png) |
| 前四後一分車 | [06-split](screenshots/art-r8/iphone-06-split.png) | [06-split](screenshots/art-r8/ipad-06-split.png) |
| 月台停靠結算 | [07-complete](screenshots/art-r8/iphone-07-complete.png) | [07-complete](screenshots/art-r8/ipad-07-complete.png) |

另外的裝載／同狀態前後圖在 `docs/art/compare/r8-after/`，工程與離線流程證據在 `docs/evidence/deep-r1/`。`scripts/check-deep-r1.mjs`使用UI與自然事件拍攝；舊八場景回歸圖組與歷史manifest保留在下方紀錄，不混進本輪七張選圖。

## 歷史觀察課圖組

狀態：PREPARED／EXECUTED；最終尺寸與 SHA-256 以 `screenshots/manifest.json` 為準。沒有疊字、拼接、替換模型或生成宣傳圖。全部來自本機 production web build 的真實操作畫面，**不是 iOS 模擬器／實機截圖**，上傳商店前要從相同版本的原生包重擷取。

兩組尺寸：iPhone CSS 430×932、DPR 3 → 1290×2796；iPad CSS 1032×1376、DPR 2 → 2064×2752。檔名前綴分別為 `iphone-store`、`ipad13-store`。

| 檔名後段 | 真正畫面 | 一句說明 |
|---|---|---|
| `01-home.png` | 冷啟動大廳，新課入口與三種交通工具 | 先學會停看，再選一台交通工具。 |
| `02-road-wait.png` | 親手煞停後，紅燈與觀察進度 | 停穩了，還要等路口清空。 |
| `03-train-boarding.png` | 開門後，乘客上車的等候狀態 | 朋友上車後，關好車門再走。 |
| `04-runway-clear.png` | 等候跑道清空後的確認狀態 | 先等一等，再確認出發。 |
| `05-stamp.png` | 真正完成三站後的安全觀察章 | 三種交通，都練一次觀察。 |
| `06-car-offline.png` | 斷網後開啟的 3D 公路遊玩畫面 | 在海岸公路練轉向與煞車。 |
| `06-train-offline.png` | 斷網後開啟的 3D 列車操作畫面 | 慢慢起步，準備接朋友。 |
| `06-flight-offline.png` | 斷網後開啟的 3D 飛機活動 | 開飛機，沿山海找星星。 |

擷取腳本：`scripts/check-store-review.mjs`；新觀察課只走正常 UI 與真實等候，沒有直接寫入完成旗標、瞬移或修改存檔。既有 3D 截圖在離線模式用 UI 啟動後擷取，不冒稱完成整關。before 圖在 `docs/evidence/r3-store/before/`，其餘尺寸的首頁與矩陣證據在 `after/`。
# 2.7.0 整合版入口

新增山海同行主線、拆合教材與學生證的 16 張實際畫面見 [SCREENSHOTS_MERGE.md](SCREENSHOTS_MERGE.md)及 `screenshots/merge/manifest.json`。下方觀察課清單保留作既有功能回歸，本輪另重擷取為 2.7.0；全部仍是無頭 Chromium，不能當作原生實機截圖。
