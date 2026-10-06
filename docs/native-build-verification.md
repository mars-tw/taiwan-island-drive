# 原生 App 建置驗收

2026 年 10 月 6 日，App 1.0.0／build 1，遊戲原始碼 2.3.0。

Android 測試 APK 與上傳簽章 AAB 已在 Windows 實際編譯。官方 bundletool 1.18.3 的下載雜湊已核對，`validate` 通過，包名為 `tw.mars.islandtransport`，target API 36。JDK jarsigner 驗證上傳包簽章成功；APK 另由 apksigner 驗證。AAB 使用本機新建的 3072-bit RSA 上傳金鑰；私鑰與密碼只存於擁有者的憑證資料夾，完整包及 Git 均不包含它們。這個金鑰尚未向 Play 登記。

先前 macOS 26 GitHub Actions 使用 Xcode 26.6／SDK 26.5，完成未簽章的 iOS Simulator App 與裝置 xcarchive，並驗證 App 內的 PrivacyInfo.xcprivacy 通過 plutil 檢查。後續 [Apple signed run 37454940484](https://github.com/mars-tw/taiwan-island-drive/actions/runs/37454940484) 在 macOS 15 完成發佈簽章、封存、IPA 匯出與本機驗證，產生 1.0.0／build 1、bundle ID `tw.mars.islandtransport` 的 App Store Connect 發佈包。

| 產物 | bytes | 狀態 |
| --- | ---: | --- |
| Android 測試 APK | 37,463,724 | 可安裝測試，debug 簽章 |
| Android 上傳 AAB | 35,453,794 | 本機上傳金鑰簽章，bundletool 通過 |
| iOS Simulator App ZIP | 33,290,296 | macOS CI 真正編譯，未簽章 |
| iOS 裝置 xcarchive ZIP | 35,447,241 | macOS CI 真正封存，未簽章 |
| iOS 發佈簽章 IPA | 32,589,768 | 簽章與封存驗證通過，尚未經 Apple 平台驗證或上傳 |

先前 Android 與未簽章 iOS 產物的 SHA-256、公開簽章憑證資訊與建置來源見 [binary-build-verification.json](../store/review/binary-build-verification.json)。CI：[native run 37424670515](https://github.com/mars-tw/taiwan-island-drive/actions/runs/37424670515)，Android／iOS 兩工作皆成功。

後續簽章 IPA 已下載並獨立核對 SHA-256 與 CI 報告相符；簽章、provisioning profile、entitlements 與隨附資源檢查皆通過。匯出方法為 `app-store-connect`，`internalOnly: false`；包內有必要的 manifest 與遊戲模型，未包含 p8、p12、pem、csr 或私鑰檔案。這些是本機與 CI 的驗證結果，Apple 平台驗證、上傳及審查核准均尚未完成。

本機原生包約 40.75 MB，三個遊戲、模型、字型及政策頁都放在 App 中；不用遠端網站提供遊戲。source ZIP、web Worker 與原始 atlas 檔不進 App，IMG 已嵌入 GLB。22 項原生包檢查、96 項玩法／原生邏輯測試與六組家長 DOM 流程驗收通過。商店 metadata 28 項檢查通過，但嚴格送審 gate 仍為未就緒。

最低 iOS 16.4 對應 Vite 的 Safari 16.4 baseline，以及 dialog、structuredClone、Array.at 與動態視窗單位；Android API 最低 24，裝置需有支援 WebGL 2 的更新版 WebView。畫面仍可用省電設定。

實際界線：本機 Android 模擬器因缺少 hypervisor driver，軟體啟動嘗試退出，沒有取得原生裝置遊玩證據。macOS CI 此次驗證編譯與封存，沒有聲稱已跑過 Simulator 的遊戲或實體裝置。商店截圖是有標記的 Chromium 真遊戲畫面擷取，非原生硬體截圖。感測器、系統音色與真實裝置網路行為仍需實機驗收。

Apple Developer Program 已啟用，App Store Connect 已建立「島嶼交通學院」（Apple ID `6819605203`），免費、台灣地區、商店 metadata、身分與審查聯絡資料已儲存並經擁有者確認。發佈簽章 IPA 已驗證；App Store Connect API 的 p8 尚未備妥，沒有完成平台驗證、上傳或送審。「不收集資料」隱私聲明已獲擁有者最終確認，並已在 App Store Connect 發布。

Google Play 身分審核已通過，電話與實體 Android 裝置驗證仍待完成；尚未建立 Google App 或上傳。Google 商店問卷、商店身分與審查聯絡欄位，以及適用的新個人 Play 帳號封閉測試仍待完成。原生媒體、裝置網路行為、離線與家長 gate 的裝置驗收也尚未通過。
