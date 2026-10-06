# 商店圖片與截圖

品牌沿用「島嶼交通學院」的山、道路與深綠色系。新圖示加入汽車、火車與飛機；SVG 原稿與重建工具都保留在專案內。沒有新增 AI 插畫，也沒有使用其他品牌的圖示。

`resources/` 提供 Capacitor 的 1024² 圖示來源、Android adaptive 前景／背景，以及 2732² 明暗啟動畫面。使用 `@capacitor/assets` 的 `--assetPath resources` 產生原生專案資源；本資料夾的圖片本身不代表已完成商店上架。[Capacitor v8 規格](https://capacitorjs.com/docs/guides/splash-screens-and-icons)、[assets 工具檔名與參數](https://github.com/ionic-team/capacitor-assets)。

商店圖檔放在 `store/assets/`：App Store 圖示為 1024² 不透明 PNG；Google Play 圖示為 512² RGBA PNG，所有像素皆不透明；特色圖為 1024×500 RGB PNG。特色圖使用專案既有 Blender 成品圖，是宣傳美術，沒有把它當成遊戲實際截圖。[Google 官方圖示與特色圖要求](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en)。

查核日期為 2026 年 10 月 6 日。Apple 當日文件的必需 iPhone 類別是 Dynamic Island medium；本包採 1206×2622。支援 iPad 時另附 13 吋的 2064×2752。Android 手機採 1080×1920，遊戲畫面至少三張。PNG 截圖移除 alpha，不加入假的裝置外框、手指、評分或原生狀態列。[Apple 截圖要求](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/)、[Google 截圖要求](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en)。

原有 Chrome 參考截圖保留在既有資料夾，`store/assets/manifest.json` 的 `simulated: true` 標記維持不變。新增的八張 iOS 原生圖片放在 `store/screenshots/native-ios/iphone/` 與 `ipad/`，由 [原生截圖 run 37465941350](https://github.com/mars-tw/taiwan-island-drive/actions/runs/37465941350) 真正啟動 iOS Simulator、安裝並執行 App，再用 `XCUIScreen.main.screenshot` 擷取大廳及三個遊戲；圖檔逐 byte 複製，沒有縮放或改圖。[原生媒體 manifest](../store/screenshots/native-ios/manifest.json) 記錄來源 commit、尺寸、RGB 解碼、SHA-256 與 Simulator 標記。

Root 已逐張完成視覺覆核，確認安全區導覽、模型與按鈕可見，並將八張圖上傳至 Apple 素材庫；介面已辨識四張 Dynamic Island medium 與四張 iPad 13 吋圖片。這是 Simulator 畫面與素材庫上傳，App build 尚未上傳、送審或核准，也沒有實體裝置驗收證據。

完整清單與數值驗收見兩份媒體 manifest。Apple Developer Program 已啟用，App Store Connect 已建立「島嶼交通學院」（Apple ID `6819605203`），免費、台灣地區、商店 metadata、身分與審查聯絡資料已儲存並經擁有者確認。目前候選包來自 [Apple signed run 37465941274](https://github.com/mars-tw/taiwan-island-drive/actions/runs/37465941274)：32,592,399 bytes、1.0.0／build 1，已包含 UIKit 安全區約束及語音清理修正，下載後的 SHA-256 與報告相符，簽章及隨附資源驗證通過。擁有者已授權使用 Chrome 建立 Developer API key 及加密儲存新金鑰，目前仍待擁有者在 Chrome 登入 Apple，尚未產生 p8；Apple build 的平台驗證、上傳與送審均未完成。「不收集資料」隱私聲明已獲擁有者最終確認，並已在 App Store Connect 發布。

Google Play 身分審核已通過，電話與實體 Android 裝置驗證、商店問卷及審查聯絡資料仍待完成，尚未建立 App 或上傳。[測試重跑 37489663357](https://github.com/mars-tw/taiwan-island-drive/actions/runs/37489663357) 已通過四個實際 XCTest case；iPhone、iPad 各自的家長 gate 三項最終斷言皆成立。[公開最終證據](../store/review/native-ios-parent-gate/manifest.json) 分開保存重跑來源 `11ebddb`，已上傳圖片仍保留原來源 `7cd0d75` 及原雜湊。這是 Simulator 驗證，實體硬體、網路隱私與離線驗收仍待完成。
