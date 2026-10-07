# 島嶼交通學院 LOGO

2026-10-07，使用內建 `image_gen` 製作新 LOGO：深藍綠底、台灣島與汽車、通勤火車、教練機。透明字標使用「島嶼交通學院」與 `ISLAND TRANSPORT ACADEMY`。

來源 `e580ef1` 的 v2 已實際納入新版 Android APK／AAB 與 iOS 發佈簽章 IPA。最新包與歷史媒體的驗證範圍分開記錄，詳見 [原生建置驗收](../native-build-verification.md)。

| 用途 | 檔案 |
| --- | --- |
| 圖示原稿，1254×1254 | [game-logo-v2-master.png](../../resources/branding/game-logo-v2-master.png) |
| 透明字標，1983×793 | [game-wordmark-v2.png](../../resources/branding/game-wordmark-v2.png) |
| App Store 圖示，1024×1024 RGB | [app-store-icon-v2-1024.png](../../store/assets/app-store-icon-v2-1024.png) |
| Google Play 圖示，512×512 RGB | [google-play-icon-v2-512.png](../../store/assets/google-play-icon-v2-512.png) |
| PWA 圖示 | [192](../../public/branding/icon-v2-192.png)／[512](../../public/branding/icon-v2-512.png) |

原稿 bytes 與透明字標的 alpha 完整保留，其餘尺寸只做技術縮放。來源、尺寸與 SHA-256 見 [素材 manifest](../../resources/branding/manifest-v2.json)，完整生成提示詞見 [imagegen-prompts-v2.md](imagegen-prompts-v2.md)。既有 PNG 與 SVG 留存。

iOS 使用新 `TransportIconV2` asset set；Android 使用新版本的 legacy 圖示與有安全留白的 adaptive 圖示。先前 13 張原生 PNG 的尺寸、RGB／RGBA、alpha 與來源引用已核對，73 個既有原生資源的雜湊保持相同，詳見 [原生圖示報告](../../resources/branding/native-icons-v2-report.json)。`native:build` 的 69 個隨附檔案為 42,130,239 bytes，原生包 22 項檢查通過。

新版 Android APK 為 39,339,054 bytes，AAB 為 37,141,256 bytes；apksigner、jarsigner、bundletool、憑證／SPKI、69 個隨附檔案雜湊與 12 張編譯後 PNG 像素驗證通過，見 [Android v2 報告](../../store/review/android-logo-v2-verification.json)。[公開測試版 rc.2](https://github.com/mars-tw/taiwan-island-drive/releases/tag/native-v1.0.0-rc.2) 的三個發布檔案 digest 已核對相符，Android 硬體遊玩 QA 尚未完成。

[iOS signed run 37559519552](https://github.com/mars-tw/taiwan-island-drive/actions/runs/37559519552) 已產生 37,440,876 bytes 的 v2 IPA，SHA-256 `916a92bc35fad14934a74694e567642b42ef21a62d5a1c58b73e6aea85637bf5`；簽章、profile、entitlements 與資源通過。包內首頁的新 512 圖示 PNG 與 Git source 相符，Info.plist 指向 `TransportIconV2` 並含 `Assets.car`。Windows 沒有 assetutil，iOS 編譯後圖示像素仍未驗證。

網站首頁與安裝圖示採用 v2，新版原生包已重新建置。[新版媒體 run 37561855895](https://github.com/mars-tw/taiwan-island-drive/actions/runs/37561855895) 來源為 `e580ef1`，四個實際 XCTest case 通過、0 失敗，兩裝置家長 gate 各三項取消斷言皆成立。八張原生 PNG 已核對雜湊並由 Root 實際視覺覆核，12 個版本化來源檔案保存在 [新版媒體 provenance](../../store/screenshots/native-ios-logo-v2/provenance.json) 所指目錄，原始 manifest 保留不改。

新版八張已透過 Apple 1.0.0 版本的標準上傳方式上傳並附加：Dynamic Island medium 四張、iPad 13 吋四張，兩組縮圖均已確認；[上傳紀錄](../../store/review/apple-logo-v2-media-upload.json) 分開記錄此後續操作。先前 `7cd0d75` 舊簽章包／截圖及 `11ebddb` 家長 gate 證據保留原來源與雜湊。Apple 仍是準備提交，已取得擁有者授權的共用 App Store Connect API key，安裝包仍待上傳；平台驗證、送審與後續狀態以 [App metadata](../../store/metadata/app.json)及[readiness](../../store/review/submission-readiness.json)為準，實體硬體驗收仍未完成。

Google v2 圖示、橫幅與三張 browser-emulated 圖片已儲存，11 項 App 設定、客服 email 與「廣告 ID＝否」均完成；IARC 為台灣普遍級／ESRB Everyone／PEGI 3，ID 顯示「-」。AAB code 1／1.0.0／min API 24／target API 36 已上傳並處理接受，0 個錯誤，僅 1 項缺少 deobfuscation 的資訊提示（`minify=false`）。Alpha 選台灣一國，16 人白名單已建立並選用；15 項變更已正式送審，發布總覽顯示「變更項目正在審查中」。尚未核准或可測試，名單不代表已加入測試，連續 14 天仍待實際累計。最新狀態見 [Google Console 紀錄](../../store/review/google-console-progress.json)。

重建衍生尺寸：

```sh
node scripts/prepare-branding-v2.mjs
node scripts/prepare-native-branding-v2.mjs
```

本文件記錄製作與套用狀態；上架憑證與最新建製證據見根目錄 [APPLE_RELEASE_CREDENTIALS.md](../../APPLE_RELEASE_CREDENTIALS.md)及 [native-build-verification.md](../native-build-verification.md)。
