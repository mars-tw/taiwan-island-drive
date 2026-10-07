# 原生 App 建置驗收

2026 年 10 月 7 日，App 1.0.0／build 1，遊戲原始碼 2.3.0。來源 `e580ef1` 的 LOGO v2 已納入最新 Android APK／AAB 與 iOS 發佈簽章 IPA；同來源新版八張原生截圖已實際上傳並附加至 Apple 1.0.0 版本。先前 `7cd0d75` 截圖與 `11ebddb` 家長 gate 證據保留為歷史紀錄。詳見 [品牌素材](branding/README.md)。

| 最新 LOGO v2 產物 | bytes | 已驗證範圍 |
| --- | ---: | --- |
| Android 測試 APK | 39,339,054 | debug 簽章，apksigner 通過；硬體遊玩 QA 待完成 |
| Android 上傳 AAB | 37,141,256 | jarsigner、bundletool、憑證／SPKI、69 個隨附檔案雜湊及 12 張編譯後 PNG 像素通過 |
| iOS 發佈簽章 IPA | 37,440,876 | 簽章、profile、entitlements 與隨附資源通過；尚未經 Apple 平台驗證或上傳 |

最新 iOS 包來自 [Apple signed run 37559519552](https://github.com/mars-tw/taiwan-island-drive/actions/runs/37559519552)，來源 `e580ef1`。CI、Root 與 worker 本機核對同一 IPA 的 SHA-256 為 `916a92bc35fad14934a74694e567642b42ef21a62d5a1c58b73e6aea85637bf5`。包內首頁引用 `./branding/icon-v2-512.png`，PNG 為 309,460 bytes、SHA-256 `590f9ccef491aac6200a5223d01e360b46d7d19523134855bc637ecf8c52418b`，與 Git 原稿相符。Info.plist 的 `CFBundleIconName` 是 `TransportIconV2`，且含 `Assets.car`；Windows 沒有 assetutil，iOS 編譯後圖示像素仍未驗證。

[新版原生媒體 run 37561855895](https://github.com/mars-tw/taiwan-island-drive/actions/runs/37561855895) 已成功，來源 `e580ef1`。四個實際 XCTest case 通過、0 失敗；Phone、Pad 的家長 gate 各三項取消斷言皆為 true。原 PNG、manifest 及兩份最終結果的 SHA 已完整核對，Root 已實際檢視八張圖片。12 個版本化公開檔案位於 `store/screenshots/native-ios-logo-v2/`，原始 manifest 保留不改，後續視覺覆核及硬體 false 狀態見 [provenance](../store/screenshots/native-ios-logo-v2/provenance.json)。

Root 已透過 Apple 1.0.0 版本的標準上傳方式，實際上傳並附加這八張：Phone Dynamic Island medium 四張、iPad 13 吋四張，兩組各四張縮圖已確認。操作紀錄見 [apple-logo-v2-media-upload.json](../store/review/apple-logo-v2-media-upload.json)。Apple 仍是準備提交；媒體上傳與版本附加未包含 binary upload、review 或核准，實體硬體驗收仍待完成。Apple 安裝包的上傳進度另記於下方。

最新 Android 驗證的完整 SHA-256 與證據見 [android-logo-v2-verification.json](../store/review/android-logo-v2-verification.json)。[公開測試版 native-v1.0.0-rc.2](https://github.com/mars-tw/taiwan-island-drive/releases/tag/native-v1.0.0-rc.2) 已發布 APK、AAB 與 verification.json，三個遠端 asset digest 均已核對相符。Google 已接受上傳的 AAB，封閉 Alpha 的 15 項變更目前正式審查中；核准與可測試狀態另以 [Google Console 進度](../store/review/google-console-progress.json)為準。

以下保留 LOGO v2 之前的歷史建置與媒體證據。

Android 測試 APK 與上傳簽章 AAB 已在 Windows 實際編譯。官方 bundletool 1.18.3 的下載雜湊已核對，`validate` 通過，包名為 `tw.mars.islandtransport`，target API 36。JDK jarsigner 驗證上傳包簽章成功；APK 另由 apksigner 驗證。AAB 使用本機新建的 3072-bit RSA 上傳金鑰；私鑰與密碼只存於擁有者的憑證資料夾，完整包及 Git 均不包含它們。這是最初建置時的紀錄，當時金鑰尚未向 Play 登記。

先前 macOS 26 GitHub Actions 使用 Xcode 26.6／SDK 26.5，完成未簽章的 iOS Simulator App 與裝置 xcarchive，並驗證 App 內的 PrivacyInfo.xcprivacy 通過 plutil 檢查。舊簽章包來自 [Apple signed run 37465941274](https://github.com/mars-tw/taiwan-island-drive/actions/runs/37465941274)，在 macOS 15 完成發佈簽章、封存、IPA 匯出與本機驗證，產生 1.0.0／build 1、bundle ID `tw.mars.islandtransport` 的 App Store Connect 發佈包，已包含 UIKit 安全區約束，但未包含 LOGO v2。

| 歷史產物 | bytes | 狀態 |
| --- | ---: | --- |
| Android 測試 APK | 37,463,724 | 可安裝測試，debug 簽章 |
| Android 上傳 AAB | 35,453,794 | 本機上傳金鑰簽章，bundletool 通過 |
| iOS Simulator App ZIP | 33,290,296 | macOS CI 真正編譯，未簽章 |
| iOS 裝置 xcarchive ZIP | 35,447,241 | macOS CI 真正封存，未簽章 |
| iOS 舊發佈簽章 IPA（7cd0d75） | 32,592,399 | 含安全區修正；簽章與封存驗證通過，不含 LOGO v2 |

先前 Android 與未簽章 iOS 產物的 SHA-256、公開簽章憑證資訊與建置來源見 [binary-build-verification.json](../store/review/binary-build-verification.json)。CI：[native run 37424670515](https://github.com/mars-tw/taiwan-island-drive/actions/runs/37424670515)，Android／iOS 兩工作皆成功。

舊簽章 IPA 已下載並獨立核對 SHA-256 與 CI 報告相符；來源 commit 為 `7cd0d7517f1cb2e221a3c13b38a0131df5e32813`，簽章、provisioning profile、entitlements 與隨附資源檢查皆通過。匯出方法為 `app-store-connect`，`internalOnly: false`；包內有必要的 manifest 與遊戲模型，未包含 p8、p12、pem、csr 或私鑰檔案。這些是歷史本機與 CI 驗證結果，沒有完成 Apple 平台驗證、上傳或審查核准。

語音停止的 350 ms 有界等待與序號保護已在先前版本加入並保留；28 項 native focused 測試使用 mock 驗證通過，不代表原生音色或硬體驗收完成。

先前原生網頁素材包約 40.75 MB；LOGO v2 素材包為 69 個隨附檔案、42,130,239 bytes。三個遊戲、模型、字型及政策頁都放在 App 中；source ZIP、web Worker 與原始 atlas 檔不進 App，IMG 已嵌入 GLB。原生包 22 項檢查與目前 104 項程式測試通過；先前 96 項玩法／原生邏輯測試、六組家長 DOM 流程及商店 metadata 28 項驗證仍保留為歷史紀錄，嚴格送審 gate 仍未就緒。

最低 iOS 16.4 對應 Vite 的 Safari 16.4 baseline，以及 dialog、structuredClone、Array.at 與動態視窗單位；Android API 最低 24，裝置需有支援 WebGL 2 的更新版 WebView。畫面仍可用省電設定。

舊原生媒體：[原生截圖 run 37465941350](https://github.com/mars-tw/taiwan-island-drive/actions/runs/37465941350) 已成功，來源為 `7cd0d75`、1.0.0／build 1。iPhone 與 iPad 各取得大廳、汽車、火車、飛機四張 `XCUIScreen` 畫面，八張 PNG 的尺寸、雜湊及完整 RGB 解碼通過，Root 視覺覆核也已通過。原檔已逐 byte 複製至 `store/screenshots/native-ios/` 並上傳 Apple 素材庫，辨識為四張 Dynamic Island medium 與四張 iPad 13 吋圖片。這八張不含 LOGO v2，原始雜湊與已上傳來源保持不變；目前仍是準備提交，App build 未上傳、送審或核准。

2026 年 10 月 7 日，[舊來源測試重跑 37489663357](https://github.com/mars-tw/taiwan-island-drive/actions/runs/37489663357) 的四個實際 XCTest case 全部通過：iPhone、iPad 各一個導覽擷取案例與一個家長 gate 案例。兩份最終結果各三項取消相關斷言皆為 true，SHA 與 artifact manifest 相符，[公開最終證據](../store/review/native-ios-parent-gate/manifest.json) 已保存。重跑來源為 `11ebddb`，當時正式 runtime 相較 `7cd0d75` 沒有變更；這不是 `e580ef1` 新版的 UI 重跑。既有 Simulator 家長 gate 證據保留，實體硬體、網路隱私與離線驗收仍待完成。

實際界線：本機 Android 模擬器因缺少 hypervisor driver，軟體啟動嘗試退出，沒有取得原生裝置遊玩證據。原有 Chromium 參考圖保留模擬標記；新增 iOS 圖片是真正原生 Simulator 擷取，仍非實體硬體。感測器、系統音色與真實裝置網路行為仍需實機驗收。

Apple Developer Program 已啟用，App Store Connect 已建立「島嶼交通學院」（Apple ID `6819605203`），免費、台灣地區、商店 metadata、身分與審查聯絡資料已儲存並經擁有者確認。最新 LOGO v2 發佈簽章 IPA 已驗證，同來源新版八張原生截圖已上傳並附加至 1.0.0 版本。已取得擁有者授權的共用 App Store Connect API key，Apple 安裝包仍待上傳，平台驗證、送審與後續狀態以 [App metadata](../store/metadata/app.json)及[readiness](../store/review/submission-readiness.json)為準，尚未宣稱平台核准。「不收集資料」隱私聲明已獲擁有者最終確認，並已在 App Store Connect 發布。

Google Play 身分、電話與實體 Android 裝置的帳戶驗證已完成。「島嶼交通學院」（Console App ID `4975824716105626310`）已建立，包名為 `tw.mars.islandtransport`，繁體中文、免費遊戲。11 項 App 設定已完成，客服 email 與「廣告 ID＝否」已儲存；新圖示、特色橫幅、三張 browser-emulated 截圖、政策網址、家長算式的 reviewer instructions、無廣告聲明與 IARC 問卷均已完成。IARC 顯示台灣普遍級、ESRB Everyone、PEGI 3，ID 欄為「-」，未另行編造編號。

AAB code 1／version 1.0.0／min API 24／target API 36 已實際上傳，並由 Google 處理接受；0 個錯誤，1 項缺少 deobfuscation 的資訊提示，建置使用 `minify=false`。Alpha 封閉測試已選台灣一國，16 人白名單已建立並選用；15 項變更已正式送審，發布總覽顯示「變更項目正在審查中」，審查狀態為 `in_review`，尚未核准或可測試。Console 已列測試連結，但複製按鈕仍停用，首個 release 尚無測試可用；16 人白名單不代表 16 人已加入測試，12 人連續 14 天仍待實際累計。最新狀態以 [Google Console 進度](../store/review/google-console-progress.json)為準。Android 遊戲硬體 QA 仍未完成，帳戶裝置驗證不等同遊戲的硬體、網路或離線驗收。
