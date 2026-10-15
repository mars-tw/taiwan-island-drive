# 真實畫面截圖清單

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
