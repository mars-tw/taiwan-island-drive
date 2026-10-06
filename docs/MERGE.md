# 三種交通工具合併紀錄

整合日期：2026 年 10 月 6 日。

合併至同一個 taiwan-island-drive 儲存庫，顯示名稱改為「島嶼交通學院」，保留原手機網址。大廳、car、train、flight 由同一個 Vite 建置產生；三種玩法的模組、測試、Blender 檔、材質及文件均已實際移入。

原 57 項汽車／方向盤／火車／飛機測試完整通過，整合建置成功。共用 settings、paths 與 bootstrap 提供幼兒模式、聲音、畫質及同源導航；Worker 快取依 scope 隔離，四頁共享一份 manifest 與素材庫。新增整合測試檢查子目錄模型路徑、無 Storage 時的設定，以及清理快取時保留別的應用程式。

12 個 GLB 的目錄與雜湊已核對。火車與飛機 Blender 原始檔已改成合併後的相對圖片路徑，實際重開確認 234／84 個 mesh、各一張 packed atlas，來源圖可解析。舊兩個獨立本機專案未修改，保留歷史檔案。

新增整合測試後共 60 項測試通過。Chrome 390×844 實際點擊大廳進入三模式，驗證相同 origin 與素材根目錄、靜音／幼兒模式／畫質跨頁共用，三模式均完成模型載入，無橫向溢出。正式版關閉網路後依序進入大廳、汽車、火車、飛機，四頁全部成功，僅一份依 scope 隔離的 transport cache，主控台無錯誤。

完整 ZIP 已讀回包含三種模式來源、三份 Blender 原檔、來源與正式版各 12 個 GLB、四頁入口；暫存、依賴、密鑰及遞迴下載目錄數為 0。大廳畫面保存在 academy-desktop.png 與 academy-mobile.png。

手機畫面與輸入使用 Chrome 模擬，沒有宣稱已在實體 iPhone 或 Android 量測效能或方向感測。語音由裝置提供，無語音時字幕仍可使用。舊 docs/editions 的紀錄屬各模式製作時的歷史證據；公開部署結果由實際完成的 Actions 與公開頁面讀回確認。

## 公開驗收

合併建置與部署成功：[GitHub Actions](https://github.com/mars-tw/taiwan-island-drive/actions/runs/37401139414)。公開大廳與 car／train／flight 四頁實際載入成功，三模式各自模型 ready；全部解析至相同根目錄與同一份 Worker scope，390×844 無橫向溢出。公開網址斷網後再依序進入四頁，全部成功，僅一份 scope 專屬 transport cache，主控台無錯誤。

舊火車與飛機網址已實際驗證會轉到 canonical train／flight 路由。兩個舊儲存庫已封存為唯讀歷史來源，原始本機資料夾未刪除；封存後舊網址仍 HTTP 200 並提供相容轉址。後續開發與部署只使用這一個合併專案。
