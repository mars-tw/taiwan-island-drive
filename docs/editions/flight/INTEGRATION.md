# 飛行學校整合

本版已併入「島嶼公路」共同專案，入口為 `/flight/`，可從根目錄大廳切換汽車、火車與飛機。此目錄其餘文件保留原飛機版的素材、教學及驗證紀錄；現在以共同專案根目錄 README、build 與部署流程為準。

- 程式：`src/games/flight/`。
- 飛行測試：`tests/flight/flight.test.js`，保留 24 項物理及完整課程測試。
- Blender 原檔與重建腳本：`blender/flight/`。
- IMG 材質：`public/textures/aircraft.png`。
- 機體與座艙：`public/models/aircraft.glb`、`aircraft-cab.glb`。
- 素材、共用 manifest、圖示、原始碼下載均從共同 app root 載入；飛機頁不另註冊 Service Worker。
- 幼兒模式、靜音與畫質使用 `src/shared/settings.js`。家長手動選擇及靜音按鈕會同步其他交通工具。
- 語音與引擎同時服從靜音設定；低畫質 DPR 上限 1，高畫質上限 1.6。

在共同專案根目錄執行 `node --test tests/flight/*.test.js`，即可單獨驗證飛行。全部遊戲的 build、測試、PWA cache 與 MIT 開源下載由共同流程處理。
