# 島嶼交通學院整合交付

2026-10-16；**2.7.0／原生來源 build 3**；分支 **r1-fun-polish**；基準 commit e5e2ec1。來源／本機驗證 VERIFIED；商店草稿 PREPARED；原生出貨與親子實測 BLOCKED。只有本機提交，沒有 push、部署、商店操作、傳訊、對外派工或可見視窗。

## 整合設計與完成內容

玩家是同一位新學員，陪海風站的朋友到山海教室：**列車數學課→停站接客→公路送補給→空中找路標**。數學的實際前車人數帶到下一章，完成一章再交接下一模式；最後收山海同行章。首頁主線只有一個繼續按鈕，原三種交通工具、12 關與安全課仍為學院練習，不把既有玩家鎖回新手。詳見 [MERGE_DESIGN](MERGE_DESIGN.md)。

小小列車長的 dispatch 守恆模型直接移植為模組，不使用 iframe、不帶入來源首頁、另一套貨幣或設定。保留裝滿、可逆移車、減法、錯答重試、有限配方與逐步保存。數學每完成新一班，共用火車星星＋1；重開結果或匯入不加星。原第一個守恆測試完整保留其斷言，另補整合測試；沒有刪既有測試或放寬斷言。

**一份 canonical 學生證**：island-transport:student:v2。舊八個鍵的星星、12 關、觀察站數、設定、汽車選擇／紀錄、飛機分數與大廳音樂一併遷移；原鍵不刪，僅作相容快照。src 中 localStorage 的讀寫收斂到 student-save.js。原生以同一份 record 寫 Preferences 恢復副本；舊 native 設定只補缺值，不訂閱另一條寫入線，也不覆蓋較新學生證。配額不足保留本次 session 並顯示未保存，不宣稱可跨重開保留。

**可選來源備份匯入**：家長關卡後才選本機 JSON。支援來源 backup v1／passport v1，驗證階段與數量、256 KiB 上限；取較高完成班次、不重發星，不能覆蓋正在調度的一班。可續玩拆合；圖鑑、拼圖、收藏、其他旅程／session 原文完整留 archive，沒有移植那些玩法，不能在學院續玩其當次狀態。沒有讀另一個 App 沙盒或改動原 App，家長須保留原備份。測試使用來源相同 schema 的 fixtures，沒有冒稱已匯入真實孩子資料。

**統一外觀與操作**：沿用學院系統繁中字型、紙色／青綠／金色與既有回饋聲，雙車廂是 DOM/CSS 數量教材。主線、新數學與受測主要兒童控制維持至少 60×60 CSS px；修正 320px 導覽、568×320 火車控制、矮筆電與小手機結果交接鈕。返回／暫停、背景、取消與原生 back 共用生命週期；數學逐動作保存。修正窄螢幕車輪換行，實際截圖等待慶祝貼紙結束，算式不被擋住。

## 授權與來源唯讀證據

主 repo 原 MIT LICENSE 原文保留。來源 HEAD：7e25c749f073de321dabc25f982ee41ecac62dca；本線未對來源寫入或 commit，HEAD 與初始 git status 三項既有文案異動吻合。這是本線操作與狀態證據，不假稱對來源整棵未提交工作目錄做過前後 bytes 全比對。

移植程式／測試 Apache-2.0，教育文字 CC BY 4.0；原完整 LICENSE、NOTICE 隨 Web／native payload 保留，byte 核對通過。來源照片、生成圖、音樂未複製。逐檔來源／目的 SHA-256、改動範圍見 [merge-assets.json](merge-assets.json)與 [CREDITS](../CREDITS.md)。沒有新增 raster 素材、未知授權資產或 gpt-image-2 模型使用紀錄；不冒填 slug。

## 最終驗證與證據

全部瀏覽器以 headless Chromium、既有 Playwright 執行；不是實機、兒童 beta 或獨立模型覆核。原生遷移最後補強以單元測試與最終 native payload 驗證；瀏覽器證據不等於原生生命週期驗收。

| 項目 | 結果 | docs/evidence/merge/ 證據 |
|---|---|---|
| npm test | VERIFIED：162／162，原 147 項保留，新增 15 項含移植模型與整合 | unit-tests.txt |
| Python 原生截圖政策 | VERIFIED：6／6 | python-tests.txt |
| 主線整合 | VERIFIED：11 視口、132 檢查，冷啟動→數學→火車→汽車→飛機→重開徽章；0 錯誤／外部請求 | merge-path.json／txt |
| 既有觀察課 store 路徑 | VERIFIED：12 尺寸、101 檢查，家長關卡、保存、離線重開三交通工具 | review-path.json／txt |
| 既有 mobile | VERIFIED：100 情境、578 次主要控制檢查，0 錯誤／外部請求 | mobile-check.json／txt |
| 既有 reachability／flight layout | VERIFIED：3×7 情境／28 項、7 尺寸 | reachability.txt、flight-layout.json／txt |
| Web／native web payload | VERIFIED：最終來源建置、78 個 Web precache 檔，native 73 檔；28 項包裝檢查，含原 LICENSE／NOTICE | build.txt、native-build.txt、native-check.txt、native-bundle-manifest.json |
| 截圖／素材／版本 | VERIFIED：PNG 尺寸／SHA-256、來源授權與 Bundle ID；2.7.0 舊 runtime 版號零殘留 | merge-evidence-check.txt、evidence-check.json、source-checks.json |
| 秘密掃描 | VERIFIED：指定 key 格式零命中，含隱藏與忽略檔；跳過各層 .git／node_modules／.secrets，未讀全機憑證目錄 | secret-scan.json |
| p95 三跑 | EXECUTED：12 組中位 p95 16.7～16.8ms，0 組超過 18ms | perf.json、frame-times.txt |

效能為**並發載量測，僅供參考**，每組三跑、每跑約 2 秒 rAF 間隔。不是實機 CPU／GPU 時間，正式閒置機況效能閘仍 BLOCKED，沒有用平均數或刪異常值冒充全綠。Renderer：ANGLE (Intel, Intel(R) Graphics (0x00007D67) Direct3D11 vs_5_0 ps_5_0, D3D11)。

主線自動操作進入數學課約 0.213～0.882 秒，完成數學並進入第二模式約 1.210～4.601 秒，可在要求的 3／10 分鐘內到達。這不是兒童理解或實際試玩時間。數學全以正常 UI 操作；交通章以原物理固定時間步加速完成，沒有改位置、成功旗標或存檔。原版 reachability 的既有結果視窗快轉只當可達性測試，不當真人遊玩證明。

## 截圖與更新版草稿

[screenshots/merge/manifest.json](store/screenshots/merge/manifest.json)：新增 16 張實際畫面，手機 1290×2796／iPad 2064×2752 各八張；主線、裝滿、分車、減法、交接、火車、公路結果與學生證。另重擷取既有觀察課 16 張草稿。before／after 與 hash 在 merge-evidence-manifest.json／evidence-manifest.json。已讀圖檢查手機首頁／交接、平板分車及窄螢幕，沒有合成、外加字或稱為原生截圖。

docs/store 的繁中名稱、副標、完整說明、關鍵字、更新說明、英文備註與中文對照、另外六款區隔、資料安全與缺件均 PREPARED。建議沿用 **tw.mars.islandtransport／App ID 6819605203** 做更新，不建新 App，也不獨立重送小小列車長。沒有操作商店。文案 mode 2 變更記於 COPY_REVIEW_MERGE.md；名稱 6 字、副標 15 字、關鍵字 69 UTF-8 bytes、Google 短說明 39 字。

## 八大面向與 Apple 風險

美術：同學院教材色票，沒有新 bitmap；按鈕：受測主要控制 60px 與邊界／遮擋；選單：主線交接與可返回暫停；人物／角色樣子：沿用原資產，未新增人物，不假稱新三視圖／亮度飽和閘完成；地圖：沿用原 GLB 與台灣景觀，不造方塊占位；技能／操作：拆合守恆、錯答重試、完成後獎勵；動作：保留三交通物理，DOM 乘客圓點是教材，不宣稱骨架人物動畫。

**Apple 4.3 風險：中。** 這是已有商品的內容合併，第一屏可玩招牌數學、成果進入下一模式，具單一進度與成長。仍有帳號歷史退件、常見教育玩法、同源交通內容，以及缺真機／親子 beta／4.2.6 權利與提交關係的風險。不能保證過審；條款判讀依提供的本機退件文件及上一輪已讀資料，本輪沒有外連即時查核。

## 未完成與下一步

BLOCKED：新簽章 IPA／AAB 與最終 build number、iPhone／iPad／Android 真機及程序終止還原、WebKit 本輪矩陣、真機飛航、親子 TestFlight 與真實回饋、最終 SDK／隱私／權限包裝稽核、內容提供者／直接提交關係、既有 R1 大廳音樂權利確認，以及閒置機器正式 p95。

未移植來源照片／圖鑑／拼圖等其他玩法；歷史原文留存不等於可續玩。沒有製作新人物、敘事動畫或 gpt-image-2 原畫。主線目前是四章文字任務與實際操作交接，沒有把它說成完整故事動畫演出。

下一步先用本次來源準備新簽章包，補真機與親子試玩、來源權利／內容提供者證據及閒置效能；由負責人審閱真實證據後處理既有 App 更新。其他六條線路、商店狀態與來源 repo 均不由本線修改。
