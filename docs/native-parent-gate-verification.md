# Parent Gate 實際 DOM 驗收

2026-10-06，台灣時間。使用獨立 Playwright session `nativeGateQA`，驗收 `http://localhost:5192/` 的最新 `dist-native` 2.3。沒有修改已凍結的 source，也沒有操作其他人的瀏覽器 session。

六組流程均通過，共 17 個 DOM 子檢查，另完成 iOS 最低版本重新覆核。逐項資料見同名 JSON。

| 驗收流程 | 實際結果 |
| --- | --- |
| Home 家長設定 | 先出現算題；錯答與取消都沒有開設定。輸入當前正確答案後只開一次，再開設定仍要新驗證。 |
| 飛機家長設定 summary | 開啟前先驗證，未通過時 details 保持關閉；正答後才打開。 |
| 汽車方向盤 | 啟用前先驗證，未通過時感測 enabled／ready 都是 false。正答後才進入 permission 流程。 |
| Native 外連與下載 | 正答後只顯示家長說明，頁面 URL 不變、分頁始終一個，沒有 ZIP 資源請求。 |
| 鍵盤、中鍵及 contextmenu | Enter 開啟驗證而非外連；中鍵沒有新頁；右鍵 contextmenu 被 prevent。外連原始 href 已移除。 |
| 遊戲中驗證與取消 | 汽車由 running 變 paused；驗證中及取消後，elapsed 都維持 44.55 秒，沒有暗中恢復遊戲。 |

額外觀察到動作感測 callback 的手勢鏈：驗證按鈕 click 為 `trusted=true`、`userActivation=true`；批准後重派方向盤 click 雖為 `trusted=false`，但 `userActivation` 仍為 true。這是實際瀏覽器事件讀值，沒有替換感測 API 或注入假的感測資料。

環境是 Windows HeadlessChrome 154、1280×720。native build 標記生效，但 `Capacitor.getPlatform()` 實際為 `web`。桌面沒有方向感測 sample，最後按既有超時機制回到 unavailable／觸控轉向，沒有宣稱 ready 或原生硬體已通過。Native TTS、Android／iOS 感測硬體、WKWebView 的真人觸控長按仍須裝置驗收。

測試自動化讀取畫面上目前的加法題，計算答案以驗證批准路徑；這不是兒童實測，也沒有宣稱孩子能解算題。

截圖位於：

- `output/playwright/nativeGateQA/native-external-info.png`
- `output/playwright/nativeGateQA/flight-approved-settings.png`
- `output/playwright/nativeGateQA/car-tilt-gate-paused.png`

最後重新讀取 iOS 專案，四個 PBX deployment target 均為 **16.4**，`store/app.json.minimumIOSVersion` 也為 **16.4**。先前 15.0 的相容性問題已解決，不沿用舊結論。WebKit 官方說明 [Safari 15.4 加入 dialog、structuredClone、Array.at 與動態 viewport 單位](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/)；目前最低 16.4 覆蓋這些功能。

本次 DOM 驗收未發現阻擋發布的 Parent Gate 問題。原生裝置與商店提交的驗收範圍由原生建置流程另外記錄。
