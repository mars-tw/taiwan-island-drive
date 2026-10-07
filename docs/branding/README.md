# 島嶼交通學院 LOGO

2026-10-07，使用內建 `image_gen` 製作新 LOGO：深藍綠底、台灣島與汽車、通勤火車、教練機。透明字標使用「島嶼交通學院」與 `ISLAND TRANSPORT ACADEMY`。

| 用途 | 檔案 |
| --- | --- |
| 圖示原稿，1254×1254 | [game-logo-v2-master.png](../../resources/branding/game-logo-v2-master.png) |
| 透明字標，1983×793 | [game-wordmark-v2.png](../../resources/branding/game-wordmark-v2.png) |
| App Store 圖示，1024×1024 RGB | [app-store-icon-v2-1024.png](../../store/assets/app-store-icon-v2-1024.png) |
| Google Play 圖示，512×512 RGB | [google-play-icon-v2-512.png](../../store/assets/google-play-icon-v2-512.png) |
| PWA 圖示 | [192](../../public/branding/icon-v2-192.png)／[512](../../public/branding/icon-v2-512.png) |

原稿 bytes 與透明字標的 alpha 完整保留，其餘尺寸只做技術縮放。來源、尺寸與 SHA-256 見 [素材 manifest](../../resources/branding/manifest-v2.json)，完整生成提示詞見 [imagegen-prompts-v2.md](imagegen-prompts-v2.md)。既有 PNG 與 SVG 留存。

iOS 使用新 `TransportIconV2` asset set；Android 使用新版本的 legacy 圖示與有安全留白的 adaptive 圖示。13 張原生 PNG 的尺寸、RGB／RGBA、alpha 與來源引用已核對，73 個既有原生資源的雜湊保持相同，詳見 [原生圖示報告](../../resources/branding/native-icons-v2-report.json)。本機 `native:build` 產生 69 個隨附檔案、42,130,239 bytes，原生包 22 項檢查通過；這項建置產生網頁資源包，尚未重新編譯或簽章原生安裝包。

網站首頁與安裝圖示採用 v2。原生 App 圖示採用獨立版本的 asset set；舊的已簽章 IPA 與八張已上傳原生截圖仍屬先前版本，未包含新 LOGO。後續發佈須重新建製簽章包，並更新相關商店媒體；本次 LOGO 製作不代表 App 已上傳、送審或核准。

重建衍生尺寸：

```sh
node scripts/prepare-branding-v2.mjs
node scripts/prepare-native-branding-v2.mjs
```

本文件記錄製作與套用狀態；上架憑證與最新建製證據見根目錄 [APPLE_RELEASE_CREDENTIALS.md](../../APPLE_RELEASE_CREDENTIALS.md)及 [native-build-verification.md](../native-build-verification.md)。
