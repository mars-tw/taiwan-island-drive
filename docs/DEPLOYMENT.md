# 公開部署紀錄

驗證日期：2026 年 10 月 5 日。

- 遊戲：https://mars-tw.github.io/taiwan-island-drive/
- 開源專案：https://github.com/mars-tw/taiwan-island-drive
- 完整下載：https://mars-tw.github.io/taiwan-island-drive/downloads/island-drive-source.zip
- 平台：GitHub Pages，公開靜態網站；未開通額外付費服務，也未修改 DNS。
- 首次成功流程：https://github.com/mars-tw/taiwan-island-drive/actions/runs/37311751017
- 驗證的程式提交：`d1aa3c8`。

公開首頁、Blender 車輛 GLB、Service Worker 與完整原始碼 ZIP 均已實際讀回 HTTP 200。Chrome 以 390 × 844 手機尺寸載入成功，八個模型全部可用，沒有橫向溢出或 console error。Service Worker 的 scope 為 `/taiwan-island-drive/`；切成離線後重新載入，仍能進入遊戲並取得八個模型。

手機可以直接透過 HTTPS 遊玩，電腦不需要保持開機；支援的瀏覽器可加入主畫面。上述手機操作以 Chrome 模擬驗證，沒有宣稱已在實體 iPhone 或 Android 裝置量測效能。

公開前保留了完整 MIT 與第三方授權，清除 Blender 展示圖 metadata 及 `.blend` 保存的私人資料夾路徑，並以 Blender 重新開啟確認模型仍正常。私人備份與工作暫存沒有進入 Git 或下載包。

## 更新與回復

推送 `main` 後，GitHub Actions 會測試、建置並部署。網站發布的是 `dist/`，下載包包含原始碼、Blender 模型、圖片、授權與正式版，排除依賴、憑證、工作暫存及遞迴 ZIP。要回復程式版本，可以對需要撤回的提交使用 `git revert`，再推送 `main`；工作流程會重新部署。

第一次雲端打包因 Linux 的點檔案需要 `Get-Item -Force` 而失敗；該跨平台問題已修復，後續建置与部署皆通過。
