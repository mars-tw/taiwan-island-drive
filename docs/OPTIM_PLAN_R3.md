# R3 上架可能性優化計畫

日期：2026-10-15。分支：`r1-fun-polish`。基準：R2／2.5.0。目標：2.6.0。本機修改、無頭驗證、僅本機 commit。

已讀共用核心、token-efficient-ai-dispatch、game-optimization-round、game-engine、playwright、speak-human-tw 與 R2 報告。本 repo 無 AGENTS.md／CLAUDE.md／AUDIT_full.md。使用者本輪禁止派工、推送、部署、操作商店，優先於技能的跨模型與部署流程。不開可見視窗、不讀取 `.secrets`、不修改其他 repo 或 native-kit。

## 驗收項目

- PREPARED：新增首次畫面可見的三站安全觀察課：公路煞停與等號誌、月台停穩與接客關門、跑道等候與確認。採實際時間／輸入狀態判定，不能連點完成；每站存檔，關閉／背景暫停，可接續。與數學列車的算術目標明確分開。
- PREPARED：逐一比對同帳號 14 個名稱（含本作自身與已退役拆分作），另比較 App Store 同類公開資料；`docs/store/DIFFERENTIATION.md` 區分可證實差異與尚缺的使用者研究。
- PREPARED：SHA-256 唯讀比對其他遊戲的 runtime／素材／原生圖示，逐檔記錄重複與處理於 SHARED_ASSETS_AUDIT；標準第三方與退役拆分作品清楚揭露。
- PREPARED：檢查模板字、除錯入口、英文裝飾、圖示與載入畫面；新課採本作專屬路線簿介面，沿用有來源的既有圖片，不把 CSS 控制圖解稱為新美術。
- PREPARED：新增狀態機單元測試及審查員 E2E：冷啟動→教學→三站玩法→章→暫停／返回→重開保留；錯誤操作、取消輸入、背景、離線、儲存失敗均驗證。
- PREPARED：既有單元、Python、mobile、reachability、flight-layout 全跑，原斷言不放寬；新增 iPhone SE、大螢幕、iPad 直橫與 13 吋矩陣。
- PREPARED：Kids Category：家長關卡錯答／取消／重開、無廣告分析 SDK、無外連／評分／購買；核對本 repo iOS manifest、Google 宣告與唯讀 native-kit，列原生缺件。關閉正式包除錯 logging。
- PREPARED：繁中名稱／副標題／說明／關鍵字、英文審查備註、真實截圖清單；無頭擷取 1290×2796、2064×2752，含尺寸／hash／來源，不冒稱原生截圖。
- PREPARED：版本 bump、秘密掃描零命中、before/after 證據、R3 交付報告，明確 staging 後本機繁中 commit。

## 八大面向

美術／地圖：重用既有模型與圖片；新 2D 原畫、新角色模型與三視圖沒有生產授權證據時列缺件。按鈕／選單：主操作 ≥60px、返回 ≥44px，矩陣內完整可見且可點。人物／角色樣子：本輪無新增人物，不聲稱亮度、飽和與三視圖通過。技能／操作：以時間與條件判定觀察課，錯誤不扣費，暫停釋放輸入。動作：保留既有 3D 物理動畫，新課為教學儀表而非假人物動畫。

效能若量測，一律註明「並發載量測，僅供參考」；閒置機器效能閘、iOS/Android 實機、簽章成品與 TestFlight 回饋不在本機環境可驗範圍，交付列 BLOCKED，不稱送審完成。

## 執行讀回

VERIFIED：三站狀態機／本機存檔與回歸、12 尺寸 101 項路徑、147 單元測試、6 Python 測試、100 手機情境、28 飛機版面、26 原生 payload 檢查、16 張商店尺寸截圖及秘密掃描零命中。EXECUTED：13 作品目錄唯讀比對；PREPARED：商店草稿與英文備註。BLOCKED：閒置效能與原生實機／簽章包／親子 beta／音樂權利／內容提供者關係證明，及未替換的退役拆分作同源內容。完整證據與界線見 `CODEX_RESPONSE_R3_STORE.md`。
