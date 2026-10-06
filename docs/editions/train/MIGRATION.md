# 合併至島嶼交通學校

火車版現為共用 Vite 專案內的 `train/index.html` 與 `src/games/train/`，使用相同網站根目錄下的 `/train/` 路由。原獨立專案保留為遷移來源，本次只讀取，沒有修改其原始檔。

- 車體及駕駛艙載入改為共用 `assetUrl('models/train.glb')`、`assetUrl('models/train-cab.glb')`，不再依火車頁面相對目錄取模型。
- 頁面以 `island-app-root=../` 指定共同根目錄。圖示、Apple 主畫面圖示與 manifest 指向共同根目錄。
- 主程式匯入 `src/shared/bootstrap.js`。火車本身不再註冊獨立 Service Worker，也不攔截安裝提示；導覽與離線快取由共同入口管理。
- 幼兒模式、靜音和畫質使用 `readSettings()`、`updateSettings()`、`subscribeSettings()`，在各模式之間共用。音效與中文教練都遵守靜音；按操作按鈕啟用 AudioContext 時，不會自行解除靜音。低畫質像素比例上限為 1，高畫質上限為 1.6。
- 完整物理、課程和互鎖保留。驗收 API 仍為 `window.__trainSchool`，原 13 項測試位於 `tests/train/physics.test.js`，模組匯入指向 `src/games/train/`。
- Blender 來源現位於 `blender/train/`；材質貼圖仍位於共用 `public/textures/train.png`。資產建製腳本的 portable 路徑由資產整理工作修正。

遷移時執行 `node --test tests/train/*.test.js`，13 項通過。原 `audio.js`、`config.js`、`game.js`、`physics.js` 對照 SHA-256 完全相同。`styles.css` 只增加共同導覽高度的版面調整，保留手機 38dvh 駕駛視野與原 114×87 px 幼兒按鈕。

在共用開發網站 `/train/` 實際驗證：兩個 GLB 由網站根目錄 `/models/` 載入且回報 ready；四個導覽連結皆留在同一網站；開源連結指向同一 canonical repository。共用設定更改幼兒模式後，主操作可切至進階面板；靜音時點擊準備按鈕不會重新啟動語音；低畫質回讀 renderer DPR 為 1。手機寬 390 px，文件無水平溢出，瀏覽器主控台 0 個錯誤。


