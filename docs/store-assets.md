# 商店圖片與截圖

品牌沿用「島嶼交通學院」的山、道路與深綠色系。新圖示加入汽車、火車與飛機；SVG 原稿與重建工具都保留在專案內。沒有新增 AI 插畫，也沒有使用其他品牌的圖示。

`resources/` 提供 Capacitor 的 1024² 圖示來源、Android adaptive 前景／背景，以及 2732² 明暗啟動畫面。使用 `@capacitor/assets` 的 `--assetPath resources` 產生原生專案資源；本資料夾的圖片本身不代表已完成商店上架。[Capacitor v8 規格](https://capacitorjs.com/docs/guides/splash-screens-and-icons)、[assets 工具檔名與參數](https://github.com/ionic-team/capacitor-assets)。

商店圖檔放在 `store/assets/`：App Store 圖示為 1024² 不透明 PNG；Google Play 圖示為 512² RGBA PNG，所有像素皆不透明；特色圖為 1024×500 RGB PNG。特色圖使用專案既有 Blender 成品圖，是宣傳美術，沒有把它當成遊戲實際截圖。[Google 官方圖示與特色圖要求](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en)。

查核日期為 2026 年 10 月 6 日。Apple 當日文件的必需 iPhone 類別是 Dynamic Island medium；本包採 1206×2622。支援 iPad 時另附 13 吋的 2064×2752。Android 手機採 1080×1920，遊戲畫面至少三張。PNG 截圖移除 alpha，不加入假的裝置外框、手指、評分或原生狀態列。[Apple 截圖要求](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/)、[Google 截圖要求](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en)。

本包的截圖從 `dist-native` 網頁包實際運行的畫面擷取，使用 Chrome 的尺寸與觸控模擬。它們不是 iOS Simulator、Android Emulator 或實體手機擷取。manifest 會逐張記錄 CSS viewport、DPR、尺寸、SHA-256 與 `simulated: true`；正式原生裝置的安全區、狀態列與平台行為仍需由原生測試確認。

完整清單與數值驗收見 `store/assets/manifest.json`。Apple Developer Program 已啟用，App Store Connect 已建立「島嶼交通學院」（Apple ID `6819605203`），免費、台灣地區、商店 metadata、身分與審查聯絡資料已儲存並經擁有者確認。目前候選包來自 [Apple signed run 37465941274](https://github.com/mars-tw/taiwan-island-drive/actions/runs/37465941274)：32,592,399 bytes、1.0.0／build 1，已包含 UIKit 安全區約束及語音清理修正，下載後的 SHA-256 與報告相符，簽章及隨附資源驗證通過。上傳用 p8 尚未備妥，Apple 平台驗證、上傳與送審均未完成；「不收集資料」隱私聲明已獲擁有者最終確認，並已在 App Store Connect 發布。

Google Play 身分審核已通過，電話與實體 Android 裝置驗證、商店問卷及審查聯絡資料仍待完成，尚未建立 App 或上傳。上述 Chrome 瀏覽器模擬截圖繼續保留 `simulated: true`。含安全區修正的 [原生截圖 run 37465941350](https://github.com/mars-tw/taiwan-island-drive/actions/runs/37465941350) 尚在執行，本版原生 UI 與完整原生媒體驗收尚未通過。
