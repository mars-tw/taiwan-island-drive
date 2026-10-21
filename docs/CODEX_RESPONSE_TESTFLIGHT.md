# TestFlight 測試建置執行報告

**已上傳 2.47.3（46），並提交 TestFlight 外部審查。** 截至 2026-10-21 14:26:21（Asia/Taipei），狀態為 `WAITING_FOR_REVIEW`；公開頁仍暫不接受新測試人員。已設定通過後由 Apple 自動通知。沒有建立 App Store 版本，也沒有送 App Store 審查。

分支：`r1-fun-polish`。已驗證基底：`63e76be`。實際建置 commit：`cb7f6fd1f22e7c602ceff5e149fb9aae4457361f`。最終報告 commit 僅更新證據。

## 建置與上傳

| 項目 | 已驗證結果 |
|---|---|
| App | 島嶼交通學院，`6819605203`／`tw.mars.islandtransport`；API 確認兒童類。 |
| 選號前查核 | builds、buildUploads、App Store versions 分頁核對；最高已上傳為 2.32.0／28，另一筆為 1.0.0／1，沒有後續分頁。本機原為 2.47.2／45。 |
| 版本同步 | package、lockfile、APP_VERSION、Android metadata、iOS App Debug／Release 均為 2.47.3／46；沒有建置或上傳 Android。 |
| macOS 工作 | [39552886681](https://github.com/mars-tw/taiwan-island-drive/actions/runs/39552886681)，success；分支與完整來源 SHA 均吻合。 |
| 工具與裝置 | Xcode 26.6、iPhoneOS SDK 26.5；arm64 裝置 IPA，最低 iOS 16.4，支援 iPhone／iPad。 |
| IPA | 75,759,880 bytes；SHA-256：`7733df00e6ac2a8aba023d992e6e936069c74a45e95801ecb935a1b5b145857f`。 |
| 簽章與驗證 | 原有 codesign、profile、憑證、entitlements、版本、SDK、資源檢查均保留且通過；Apple 官方工具驗證與上傳成功。 |
| 產物讀回 | IPA 與 CI 報告 SHA 相同，GitHub artifact digest 亦吻合，ZIP CRC 通過；Info.plist、架構與裝置家族相符。 |
| Apple build | `af3989ae-afeb-4ec6-b0fa-bbda53ae8b98`，2.47.3／46，VALID、未過期；upload COMPLETE，errors／warnings 為空。 |
| 出口合規 | IPA 宣告及 Apple API 均為 `usesNonExemptEncryption=false`。 |

沿用既有成功的 `apple-release.yml → apple-sign-export.sh → apple-upload.sh` 官方流程，CI 增加 npm test。workflow 與 GitHub apple-release environment 僅新增確切的 r1-fun-polish 分支政策，保留原有 main 政策；沒有切換或修改 main。

## TestFlight 設定與待審狀態

| 項目 | API／公開頁讀回 |
|---|---|
| zh-Hant 測試內容 | 已填寫並逐字讀回吻合；涵蓋三堂課、直橫向、暫停／返回、重開存檔、離線與回饋。全文存於 state JSON。 |
| Beta 說明／審查筆記 | 已改為目前三堂課、實際入口及 2.47.3／46，移除舊 1.0.0／build 1 流程；雜湊讀回吻合，無需示範帳號，未保存聯絡人個資。 |
| 外部群組 | MARS Games Testers，ID `4667fcd7-7b8e-4351-a4ca-69a804983089`；確認包含此次 build。 |
| Beta App Review | 2026-10-21 14:16:23（Asia/Taipei）成功提交，ID 與 build 相同；WAITING_FOR_REVIEW，externalBuildState=WAITING_FOR_BETA_REVIEW。新版沒有回 CLOSED_VERSION。 |
| 通知 | autoNotifyEnabled=true；通過後由 TestFlight 自動通知，避免重複手動通知。目前尚未核准，沒有宣稱通知已送達。 |
| 公開連結 | [公開連結](https://testflight.apple.com/join/pUHeJZFG) 已啟用，原上限 20 保留。 |
| 實際公開頁 | HTTP 200，但顯示 `This beta isn't accepting any new testers right now.`，目前不可加入。 |
| App Store 邊界 | 最終版本列仍僅 2.32.0、1.0.0，均 READY_FOR_SALE，與初始清單完全一致；寫入紀錄僅含 TestFlight 資源。 |

**待 Apple 完成 Beta 審查。** 通過後自動通知已設定；公開頁「可加入」仍須等狀態變更後再確認，現在不宣稱外部測試已開放。完整逐筆 mutation receipt、群組、文案、官方產物與頁面 SHA 見 [testflight-state.json](testflight-state.json)。

## 全部測試與未解結果

全部 **38 個既有 npm 測試指令**均原樣執行，沒有刪除、放寬或跳過斷言。另執行 R37 的 layout、offline、performance、switching、store 範圍、README 行動版檢查及 iOS 證據測試。主要彙整共 46 筆：11 筆退出碼 0、35 筆非零，彙整器如實回傳非零。時間與失敗片段完整保留於 [testflight-validation.json](testflight-validation.json)。

| 檢查 | 本次結果 |
|---|---|
| npm test | 基底 342／342，無 skip；同步版本後再跑仍 342／342；CI 單元測試亦成功。 |
| Web／native build | 基底與 2.47.3 均成功；native 260 檔、79,014,263 bytes。 |
| verify-native-package.mjs | 28 項通過。 |
| iOS screenshot evidence Python tests | 6／6；未宣稱實機 UI 已通過。 |
| R37 all | 通過，4 組完整流程檢查、271 次原始擷取，包含完成、重載與重玩。 |
| R37 layout／offline／switching／store | 全部退出碼 0，涵蓋 8 種直橫尺寸與離線三課完成。 |
| R37 performance | VERIFIED；三尺寸各三跑的 p95 中位數皆約 16.8 ms。較慢樣本保留，並非乾淨機況測試。 |
| test:merge | 132 項通過，0 runtime error、0 external request。 |
| test:store | 101 項通過。 |
| 歷史 R3～R36 UI 腳本 | 34 個指令非零，原始結果完整保留。 |
| check-mobile.mjs | 非零；32 項警報來自隱藏的 timeattack 控件。 |
| 歷史來源比對器 | BLOCKED：唯讀來源 checkout taiwan-train-math 不存在，沒有偽造來源狀態或放寬斷言。 |

失敗不能全部視為過時。R3～R6 的月台選擇鈕是現行操作控件：舊測試查中心及角落，R37 僅查中心，保留為**多點可達性未解失敗**。R34～R36 要求換用 traffic-car，與 R37 固定 car-rear.png 相反；R30～R32 要求舊 contentVersion；R33 selector 對到兩個元素；R8 的舊 500 ms correction／轉向鍵要求與目前漸進傾斜、獨立扶正提示不相容。行動版舊腳本未排除 display:none 的幼兒模式 timeattack，四尺寸各八項零矩形檢查合計 32 項。其他舊提示、傾角、亮鍵與操作時間等失敗仍列於 JSON，未宣稱皆為假警報，也沒有修改遊戲迎合互相衝突的歷史要求。

原生測試詳見 [testflight-native-validation.json](testflight-native-validation.json)。第一次 npx 因缺少 npm bin shim 失敗；已直接使用既有 Capacitor CLI 8.5.2 成功 sync ios，失敗紀錄保留，該次診斷 log 已刪除。同步後 loggingBehavior=none，插件為 TextToSpeechPlugin、AppPlugin、PreferencesPlugin。受管 SPM 最低平台由 iOS 15 更新為 iOS 16；App target 仍為 iOS 16.4。

## 兒童隱私、清理與來源

來源套件與 SPM 依賴未見第三方廣告／追蹤 SDK。實際 archive／IPA 的 root 與內嵌 privacy manifests、已知 SDK 名稱／網域、除錯記錄及加密宣告檢查通過。下載讀回另檢查 3 份 privacy manifest、35 個選定文字檔及 Capacitor／Cordova framework，已知追蹤網域與廣告 SDK 名稱命中均為 0，未見 ATT、GAD、Facebook、SKAdNetwork 宣告。這些是靜態與宣告檢查，不等同實機網路或未知 SDK 動態稽核。

測試清理紀錄為 619 次新生檔刪除、567 次測試輸出還原；原有 untracked 審查檔與截圖保留。預覽服務中斷的 30 筆基礎設施失敗另外保留，受影響檢查已重跑；獨立 loopback 靜態服務隨程序結束關閉。IPA 只在記憶體驗證，本機沒有留下重複下載、ZIP 或專案備份；GitHub 保留原 workflow 的正式建置產物。沒有手動建立 .audit-tmp 匯出包，沒有印出、寫入報告或提交憑證。

首次整批推送回 HTTP 500；19 個 commit 的原始 blob 合計 2,779,024,835 bytes。確認遠端未更新後，依 [GitHub 官方大型推送拆分方法](https://docs.github.com/en/get-started/using-git/troubleshooting-the-2-gb-push-limit) 分成 5 批同分支快轉，各批與最終 SHA 均已驗證。完整歷史保留，沒有 force push。

建置、API 控制與最終數據由獨立上下文唯讀覆核。沒有使用本機語言模型或占用 H3 的 GPU。繁中文案依 speak-human-tw mode 2 直接編寫；新「測試內容」無舊句可對照，Beta 舊說明與舊版本流程已更新為目前實際入口，避免引導測試／審查者走舊流程。
