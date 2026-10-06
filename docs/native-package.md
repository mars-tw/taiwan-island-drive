# 完整 App 與商店資料包

原生 App 暫定名稱「島嶼交通學院」，1.0.0／build 1。App ID `tw.mars.islandtransport` 尚待擁有者確認及平台查重。

完整交付 ZIP：`release/island-transport-store-1.0.0.zip`。

| 位置 | 內容 |
| --- | --- |
| `android/island-transport-test.apk` | Android 可安裝測試版 |
| `android/island-transport-upload-signed.aab` | 已驗證上傳簽章的 Play 包，尚未提交 |
| `ios/IslandTransport-simulator.app.zip` | 真正建製的 Simulator App |
| `ios/IslandTransport-unsigned.xcarchive.zip` | 真正建製的 iOS 裝置封存，需 Apple 帳號簽章 |
| `source/island-drive-source.zip` | 全遊戲、Blender、Android／iOS 工程、資源、建置腳本與測試 |
| `store/` | 圖示、12 張尺寸合規的準備截圖、中英商店文字、政策、自評與 review notes |
| `docs/` | 原生建置、素材與上架流程證據 |

ZIP 排除簽章私鑰、密碼、SDK 本機路徑、build cache、試拍 audit 與遞迴下載包。原生 App 中也不塞 Blender 原檔或完整 source ZIP。

## 重建

```sh
npm ci
npm test
npm run native:build
node scripts/verify-native-package.mjs
npx cap sync
```

Android 用 JDK21 與 Android SDK36，執行 `android/gradlew -p android assembleDebug bundleRelease`。Windows 可執行 `scripts/prepare-android-tools.ps1` 安裝到獨立工具資料夾。Release signing 只讀 `ISLAND_UPLOAD_STORE_FILE`、`ISLAND_UPLOAD_STORE_PASSWORD`、`ISLAND_UPLOAD_KEY_ALIAS`、`ISLAND_UPLOAD_KEY_PASSWORD` 環境變數；不寫進工程或命令列。

iOS 用 macOS／Xcode26 以上，開啟 `ios/App/App.xcodeproj`，選擇擁有者的開發者 Team 才能做正式發佈。SPM dependencies 使用固定 Capacitor 8.5.2，其他插件版本鎖在 package-lock。

正式建立 App／上傳前，先讀 [商店送審說明](store-submission.md)及 `store/review/submission-readiness.json`。Apple／Google 帳號的身分、費用、合約及真實聯絡人仍由擁有者辦理，商店審核與上架尚未完成。
