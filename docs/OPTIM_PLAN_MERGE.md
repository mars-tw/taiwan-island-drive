# 交通學院整合計畫

2026-10-16；PREPARED；基準版本 2.6.0；分支 r1-fun-polish。只修改本 repo，來源 taiwan-train-math 唯讀；不派工、不連商店、不 push、不部署，全部無頭。

已讀：共用 core-rules、token-efficient-ai-dispatch、game-optimization-round、game-engine、speak-human-tw；兩 repo 的 R2 MOBILE、R3 STORE、DIFFERENTIATION 與唯讀退件紀錄。兩 repo 沒有 AGENTS.md／CLAUDE.md，亦無 docs/AUDIT_full.md 時不虛稱讀過。來源 HEAD 與工作目錄狀態會在證據記錄；來源既有未提交文案不碰。

## 可驗收項目

- [x] MERGE_DESIGN：同一位學員、同一趟山海補給任務，列車拆合→列車接客→公路運送→空中尋路，主線第一屏可進；原 12 關與觀察課保留為練習。
- [x] 將來源 dispatch 純模型和關鍵守恆測試移入；不使用 iframe／另一套首頁與設定。
- [x] 共用學生證與單一 canonical 存檔，遷移舊 wallet／passport／safety／settings、汽車紀錄與選擇、飛機分數、大廳音樂；保留原鍵相容快照，舊玩家不丟進度。數學成果解鎖列車主線並把乘客數帶入交接提示。
- [x] 家長關卡後可選擇匯入來源備份；完整原文留作歷史，只有可對應數學進度轉入，不假稱支援未移植模式的續玩。拒絕畸形／過大／重複累加。
- [x] UI 沿用學院字型、色票、回饋音；列車教材用 DOM/CSS 沿用既有交通圖片，不新增未知授權 bitmap。Apache LICENSE、NOTICE、原教材署名完整隨 payload 與來源交付。
- [x] 八大面向：美術與教材整合、60px 兒童按鈕、各頁返回／暫停、沿用人物與地景（不造新方塊）、拆合操作回饋、既有角色外觀與車輛動作回歸；沒有新人物時不冒稱三視圖或骨架動畫完成。
- [x] 既有 npm／Python／mobile／reachability／flight layout／store scripts 全跑；新增冷啟動→數學→列車→跨模式解鎖→重開保存、錯答／取消／家長匯入／離線／直橫與 iPad 測試。
- [x] 版本更新 2.7.0／build 3；Web/native payload 建置與檢查、秘密掃描零命中、diff check。
- [x] 1290×2796 與 2064×2752 真實 UI 無頭截圖、before/after、SHA-256；三跑 p95 並發載量測，僅供參考，不冒稱手機真機效能。
- [x] docs/store 更新版草稿與另外六款區隔、保留現有 Bundle ID、MIT README／授權、CODEX_RESPONSE_MERGE 與缺件。繁中明確路徑本機 commit。

原生簽章、真機、TestFlight 親子回饋、內容提供者關係證據與既有音樂權利確認屬本機無法完成的出貨缺口，收尾照實列 BLOCKED。使用者禁止其他服務派工，覆核由本線測試與讀回，不冒稱獨立模型覆核。

收尾：本機整合與自動驗證 VERIFIED；商店草稿 PREPARED；真機、簽章、親子試玩與正式效能 BLOCKED，詳見 CODEX_RESPONSE_MERGE.md。
