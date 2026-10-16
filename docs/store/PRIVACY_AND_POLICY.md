# 兒童類與隱私檢查

2026-10-15；2.7.0；來源層：EXECUTED／VERIFIED，最終原生簽章包：BLOCKED。這不是已填入 App Store Connect／Play Console 的宣告證明。

## 實際資料與網路

| 功能／資料 | 用途與去向 | 保存 |
|---|---|---|
| 幼兒模式、聲音、畫質、車款／路線偏好 | 裝置內套用選擇，不上傳 | localStorage；原生家庭設定另透過 Preferences／UserDefaults |
| 累積星星、最佳成績、12 關護照 | 本機進度與最佳評等 | 本機持久儲存，不做跨裝置同步 |
| 新三站安全課 | 只保存已完成站數 0～3，不保存姓名、生日或行為逐筆紀錄 | `island-transport:safety:v1`；寫入失敗會提示且當次可繼續 |
| 可選傾斜轉向 | 家長確認後，在裝置內計算轉向 | 感測值只在記憶體，不寫遊玩紀錄 |
| 中文語音 | 固定教練句子送往已安裝本機音色；無錄音、無自動下載 | 原生篩選 localService 且拒絕 networkConnectionRequired；沒有本機音色用文字 |
| 大廳音樂 | `HEAD audio/lobby-theme.m4a` 檢查及本機檔案播放 | 原生從安裝包讀取；瀏覽器為同源靜態請求 |
| 網頁版載入／更新 | 向同源主機讀取 HTML、JS、CSS、模型、圖片、字型、音樂與 precache.json／sw.js | Service Worker 本機快取。主機可能處理 IP 等一般連線資訊，不能把網頁版說成完全無網路 |
| 支援／隱私 | 家長關卡後可開啟安裝包內本地頁；信箱／GitHub 地址只顯示文字 | 本輪移除瀏覽器支援頁的 window.open；沒有自動傳送支援資料 |

應用程式原始碼未發現 POST、sendBeacon、追蹤像素、分析／廣告 SDK、帳號、定位、相機、麥克風、聯絡人或廣告識別碼功能。套件有 Capacitor／Three.js 等標準第三方元件，**無第三方分析或廣告 SDK**不等於完全無第三方程式。作業系統備份、診斷或語音引擎自身行為，不能由 JS 原始碼斷言為永不連線。

## 家長與外連

- 家長設定使用隨機成人加法題，90 秒有效、三次錯誤鎖定；取消／關閉不會開啟設定。這個算式只用來區隔家長區，不是兒童遊戲內容。
- 全部遊戲入口沒有外部連結、評分要求、購買或第三方追蹤。新支援入口只在家長設定內；支援頁也不會開啟外部網站或郵件工具。
- 新課暫停釋放煞車，背景／失焦暫停；原生 lifecycle 經既有橋接註冊。瀏覽器事件與 mock 測試不能替代 iOS／Android 實機背景切換。
- `capacitor.config.json` 的 loggingBehavior 改為 none，WebView debugging 維持關閉。Android 移除 INTERNET，無敏感或 AD_ID 權限，allowBackup=false；須用最終合併 manifest 再驗證依賴沒有加回權限。

## iOS 隱私清單

`ios/App/App/PrivacyInfo.xcprivacy`：NSPrivacyTracking=false、TrackingDomains 空、CollectedDataTypes 空；UserDefaults 的 Required Reason 為 CA92.1。Xcode project 的 Resources 有納入此檔，與本機偏好用途一致。`node scripts/verify-native-package.mjs` 會檢查，並明示 binarySigningVerifiedByThisCheck=false。SPM 使用 Capacitor／App／Preferences／TTS；Motion 保留原有 web／平台路由，不新增 SDK。

唯讀 native-kit：`../game-store-publisher/native-kit/prepare_apps.py` 已有關閉 Android 備份、移除 INTERNET 及建立 CA92.1 清單的邏輯；`configure_ios.mjs` 有把清單加入 Resources 的邏輯。`native-kit/apps/` 沒有 taiwan-island-drive 專屬目錄，本作使用 repo 內自己的 Capacitor wrapper。未修改 native-kit，也不把其他 App 的清單當本作打包證據。

## Google 資料安全草稿

`store/review/play-data-safety.json` 是 1.0.0 的歷史自評，保留原件。本輪新草稿在 `DATA_SAFETY.draft.json`：無收集／分享宣告的來源檢查未見矛盾，但仍需最終 AAB、合併 manifest、裝置網路紀錄與 Play Console 實際表單讀回。新安全課只存本機站數，不新增資料收集種類。

## 原生送審前缺件

- BLOCKED：2.7.0 新簽章 IPA／AAB、合併清單與依賴隱私資源稽核；本機只驗證 web/native web payload。
- BLOCKED：iPhone／iPad／Android 實機離線、背景恢復、語音引擎與網路封包驗證。
- BLOCKED：App Privacy／Data safety／年齡與 Families 表單的最終實填讀回；本輪禁止操作商店。
- BLOCKED：新安全課親子實測，確認不識字兒童在家長陪讀下的理解程度；不捏造 beta 意見。
- BLOCKED：既有音樂權利歸屬確認。沒有新生成素材，也沒有新素材模型 slug 證據。

核對依據：[Apple Kids Category 與隱私](https://developer.apple.com/app-store/review/guidelines/#kids-category)、[Google Families](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en)、[Google Data safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en-en)。這些政策要求最終行為與申報一致；來源通過不代表商店或法律審查已通過。

## 整合更新補充（2026-10-16）

數學階段、人數、主線章與家長選擇的來源備份原文新增於本機學生證，不上傳。沒有新增第三方 SDK、分析、廣告、內購或評分要求；本輪選取的是本機檔案，不是連另一 App 或外站。來源層已更新公開隱私頁。最終簽章包仍 BLOCKED，前輪稽核屬歷史證據。
