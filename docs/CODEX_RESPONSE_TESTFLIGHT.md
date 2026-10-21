# TestFlight 測試建置執行報告

執行日期：2026-10-21（Asia/Taipei）。分支：`r1-fun-polish`。基底：`63e76be`。

## 已核對的初始狀態

- App：島嶼交通學院，`6819605203`／`tw.mars.islandtransport`，Apple API 確認兒童類。
- 分頁讀取 builds、buildUploads、App Store versions；最高已上傳版本為 `2.32.0`／build `28`，另一筆為 `1.0.0`／`1`，沒有後續分頁。
- 本機為 `2.47.2`／`45`；本次預計使用 `2.47.3`／`46`。
- 外部群組 `MARS Games Testers`，ID `4667fcd7-7b8e-4351-a4ca-69a804983089`，公開連結已啟用，上限 20。
- 初始 App Store 版本僅 `2.32.0`、`1.0.0`，均為 `READY_FOR_SALE`。本工單只處理 TestFlight。

## 測試

基底已重跑 `npm test`：342／342，無 skip；`npm run build`：成功，265 個離線檔案；`python -B tests/native-ios/test_screenshot_evidence.py`：6／6。

全部 **38 個既有 npm 測試指令**均已原樣執行。另加 R37 的 layout、offline、performance、switching、store 範圍與 README 的行動版檢查；彙整共 46 筆：11 筆退出碼 0、35 筆非零。逐項結果、時間與失敗片段見 [testflight-validation.json](testflight-validation.json)。彙整器如實回傳非零，沒有放寬、刪除或跳過原有斷言。

| 檢查 | 本次結果 |
|---|---|
| `npm test` | 342／342，無 skip；同步版本後再跑，仍 342／342。 |
| Web／native build | 基底與 2.47.3 均成功；native 260 檔、79,014,263 bytes。 |
| `verify-native-package.mjs` | 28 項通過。 |
| iOS screenshot evidence Python tests | 6／6。未宣稱實機 UI 已通過。 |
| R37 all | 通過，4 組完整流程檢查、271 次原始擷取；完成、重載及重玩。 |
| R37 layout／offline／switching／store | 全部退出碼 0；8 種直橫尺寸及離線三課完成。 |
| R37 performance | VERIFIED；三尺寸各三跑的 p95 中位數皆約 16.8 ms。保留較慢樣本，並非乾淨機況測試。 |
| `test:merge` | 132 項通過；0 runtime error、0 external request。 |
| `test:store` | 101 項通過。 |
| 歷史 R3～R36 UI 腳本 | 34 個指令非零；原始結果完整保留。 |
| `check-mobile.mjs` | 非零，32 項警報來自隱藏的 timeattack 控件。 |
| 歷史來源比對器 | BLOCKED：唯讀來源 checkout `taiwan-train-math` 不存在。沒有偽造來源狀態或放寬其斷言。 |

原生建置、版本同步後測試及直接 CLI 執行結果見 [testflight-native-validation.json](testflight-native-validation.json)。本機缺少 `cap` 的 npm bin shim，第一次 npx 呼叫失敗；已用相同、既有的 Capacitor CLI 8.5.2 直接執行並成功 `sync ios`，失敗紀錄仍保留，該次 npm 診斷 log 已刪除。

歷史 R34／R35／R36 UI 腳本要求主車改用 `traffic-car`，與 R37 固定同一張 `car-rear.png` 的現行契約衝突。這些腳本仍原樣執行；不得將其失敗隱藏或宣稱全部歷史腳本通過。

其他失敗不能全部當成過時而略過。R30～R32 要求舊 contentVersion；R33 的乘客 selector 對到新舊兩個元素。R8 固定 500 ms 後的舊 correction 與目前漸進傾斜／獨立扶正提示不相容。R3～R6 的月台選擇鈕則是現行操作：舊測試查中心及角落，R37 僅查中心，目前保留為**多點可達性未解失敗**。其餘舊提示、傾角、亮鍵等失敗仍列於 JSON，未宣稱皆為假警報，也沒有修改遊戲來迎合互相衝突的歷史契約。

## 版本、簽章與兒童隱私

- package、lockfile、共用 APP_VERSION、Android metadata、iOS App 的 Debug／Release 已同步 `2.47.3`／`46`。沒有建置或上傳 Android。
- `cap sync ios` 後，實際 iOS capacitor.config.json 讀回 `loggingBehavior=none`；插件為 TextToSpeechPlugin、AppPlugin、PreferencesPlugin。已修正原先 stale 的 debug 設定。
- 同步工具將受管 SPM 最低平台由 iOS 15 更新為 iOS 16；App target 的既有最低 iOS 16.4 保持一致。
- 使用過往成功的 `apple-release.yml` → `apple-sign-export.sh` → `apple-upload.sh` 官方 Apple 工具路徑。workflow 允許 `r1-fun-polish`，並保留原有 main；GitHub apple-release environment 僅新增此確切分支政策，原有 main 政策保留。
- 原有簽章、profile、憑證、entitlements、版本、SDK 與資源檢查均保留，CI 另加 `npm test`。
- 套件及 SPM 依賴未見第三方廣告／追蹤 SDK；本機原生 26 個選定文字檔的已知追蹤網域掃描為 0 命中。簽章流程另加入實際 archive／IPA 的 root 與內嵌 privacy manifests、已知 SDK 名稱／網域、logging 及非豁免加密宣告檢查。這是靜態與宣告檢查，未冒稱已完成實機網路或未知 SDK 的動態稽核。
- 建置與 API 控制流程另由獨立上下文唯讀覆核；沒有調用本機語言模型或占用 H3 的 GPU。

## 清理與文案

測試產生的中間擷取在每個指令後清除；原 tracked 證據還原、原有 untracked 審查檔與截圖保留。清理數量見 validation JSON。測試程序的 loopback 靜態服務已隨程序結束關閉。沒有建立專案備份或手動 `.audit-tmp` 匯出包；憑證由既有工具內部讀取，沒有印出、寫入報告或納入 Git。

繁中測試說明依 speak-human-tw mode 2 直接編寫。這是新文案，沒有需對照改寫的舊「測試內容」。Beta 既有說明以舊版三種交通工具為主，將更新為目前三堂課與既有體驗；舊審查說明的 1.0.0／build 1 將改為本次版本與實際入口，原因是避免引導審查者走舊流程。

## 執行狀態

本機測試及版本同步已完成；macOS 簽章、上傳、Beta 審查提交及最終公開連結讀回待執行。初始公開頁 HTTP 200，但顯示 `This beta isn't accepting any new testers right now.`；公開連結啟用本身不代表已有可測 build。
