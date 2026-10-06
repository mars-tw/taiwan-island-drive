# 原生 App 建置驗收

2026 年 10 月 6 日，App 1.0.0／build 1，遊戲原始碼 2.3.0。

Android 測試 APK 與上傳簽章 AAB 已在 Windows 實際編譯。官方 bundletool 1.18.3 的下載雜湊已核對，`validate` 通過，包名為 `tw.mars.islandtransport`，target API 36。JDK jarsigner 驗證上傳包簽章成功；APK 另由 apksigner 驗證。AAB 使用本機新建的 3072-bit RSA 上傳金鑰；私鑰與密碼只存於擁有者的憑證資料夾，完整包及 Git 均不包含它們。這個金鑰尚未向 Play 登記。

macOS 26 GitHub Actions 實際使用 Xcode 26.6／SDK 26.5，完成 iOS Simulator App 與 iOS 裝置 xcarchive。`CODE_SIGNING_ALLOWED=NO`；兩者均為未簽章建置，未產生可以裝入一般 iPhone 或上傳 App Store 的 IPA。建置也驗證 App 中真正包含 PrivacyInfo.xcprivacy，且 plutil 檢查通過。

| 產物 | bytes | 狀態 |
| --- | ---: | --- |
| Android 測試 APK | 37,463,724 | 可安裝測試，debug 簽章 |
| Android 上傳 AAB | 35,453,794 | 本機上傳金鑰簽章，bundletool 通過 |
| iOS Simulator App ZIP | 33,290,296 | macOS CI 真正編譯，未簽章 |
| iOS 裝置 xcarchive ZIP | 35,447,241 | macOS CI 真正封存，未簽章 |

精確 SHA-256、公開簽章憑證資訊與建置來源見 [binary-build-verification.json](../store/review/binary-build-verification.json)。CI：[native run 37424670515](https://github.com/mars-tw/taiwan-island-drive/actions/runs/37424670515)，Android／iOS 兩工作皆成功。

本機原生包約 40.75 MB，三個遊戲、模型、字型及政策頁都放在 App 中；不用遠端網站提供遊戲。source ZIP、web Worker 與原始 atlas 檔不進 App，IMG 已嵌入 GLB。22 項原生包檢查、96 項玩法／原生邏輯測試與六組家長 DOM 流程驗收通過。商店 metadata 28 項檢查通過，但嚴格送審 gate 仍為未就緒。

最低 iOS 16.4 對應 Vite 的 Safari 16.4 baseline，以及 dialog、structuredClone、Array.at 與動態視窗單位；Android API 最低 24，裝置需有支援 WebGL 2 的更新版 WebView。畫面仍可用省電設定。

實際界線：本機 Android 模擬器因缺少 hypervisor driver，軟體啟動嘗試退出，沒有取得原生裝置遊玩證據。macOS CI 此次驗證編譯與封存，沒有聲稱已跑過 Simulator 的遊戲或實體裝置。商店截圖是有標記的 Chromium 真遊戲畫面擷取，非原生硬體截圖。感測器、系統音色與真實裝置網路行為仍需實機驗收。

尚未在 App Store Connect／Play Console 建立 App 或送件。擁有者已確認尚無開發者帳號；還需法定身分、審查聯絡人姓名／電話、iOS 發佈簽章、平台問卷，以及適用的新個人 Play 帳號封閉測試。
