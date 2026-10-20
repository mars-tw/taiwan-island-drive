# 新內容第 10 輪計畫

PREPARED，2026-10-19。分支 r1-fun-polish，基線 ddaba07，版本預定 2.22.0／build18。已讀三份 R9 審查、ART_DIRECTION 與最近交付；repo 及上層未找到 AGENTS.md／CLAUDE.md，遵循本次提供的全域指令。保留既有未追蹤審查文件。全程本機、背景／無頭，不派工、不推送、不部署。

## 三課修改與驗收

1. 蛋糕：統一主要動作、儀表與亮鍵。未踩、踩住、已放開有不同標籤與按壓態；鬆踏板時灰色，停穩再起步不亮轉向。縮小重複蛋糕，增加道路高度，車輪沿道路與灣位前進。390×844 實際按住／放開／停穩／再起步逐格驗證，三站完成並重開保存。
2. 路口：每位朋友到岸後清除左右確認，新朋友方向箭頭；只看一邊出發須不移車、不增人數且指明缺哪邊。等待者使用站立姿態、灰階與等待標記。奶奶等待、行走、到岸同高（差 ≤10%），獨立路線避免與騎車孩子重疊；完成勾掛在剛到岸者框內，卡片同步。五格量測人物框高度／交集，三格原尺寸動態證據，三站完成保存。課名依實際操作改為「路口停看等」，不冒稱有聽聲判斷玩法。
3. 車票：三面站牌加柱／編號接到實際月台段，完整不遮擋；單一路徑、序號和前後排隊。補生成門框、車廂內部及踏板，門口人物框須與門框相交，再進走道落座；人數與可見位置一致，前人落座後下一人才動，關門後文字改「門關好了」。三站皆正常操作、錯站三連點阻擋、逐人三格與關門證據，三站完成保存。

Muse 五項逐項驗收：①踏板三態；②每人重置觀察；③單列上車路徑；④站牌與月台對應；⑤等待／通過狀態。Claude 五個嚴重問題及 GPT 停穩提示、勾選問題一併處理。

## 預定檔案

- src/shared/content-r1.js、content-r1-ui.js、content-r5-feedback.js（逐人觀察的結算單位改「次」）；新增 content-r10-scene.js、content-r10.css。
- public/art/content-r10/ 與 docs/content/r10/art/：僅補本輪修正必要圖，實際工具 image_gen.imagegen；沿用 R7 完整風格前綴並記錄提示、來源、alpha、hash。
- tests/shared/content-r10.test.js、scripts/check-content-r10.mjs、scripts/verify-content-r10-release.mjs。
- package.json／lock、汽車版本、模型目錄、iOS／Android 來源版本同步。
- docs/content/r10/ 原圖與證據、review-set/ 精選 15 張（每課 5 張）、docs/store/screenshots/content-r10/ 兩尺寸、docs/CODEX_RESPONSE_CONTENT_R10.md。

## 品質閘

VERIFIED 須有 npm test（保留舊測試與斷言）、build、5286 test:merge、5113 test:store；三課無頭實玩／保存／離線、手機直橫與 iPad 控制 ≥60px、手機無鍵盤提示、零外部請求／執行錯誤、秘密掃描零命中。依序單一 preview／單一無頭瀏覽器，用完關閉。效能沿用並發機況三次 p95 參考量測，門檻 ≤18ms；超標照實記錄。視覺、排版、選單、人物、回饋、文字、色彩與動態均依本輪五項交叉檢查。

BLOCKED：實體 iPhone／iPad、原生語音與真人親子試玩需要裝置與受測者；乾淨機況需要獨占硬體；Muse ≥8 需要審查員複審，不自給分。只做繁中訊息本機 commit，明確 git add 路徑。

執行回讀：VERIFIED，五項本機驗收均已附原圖；207 單元測試、117 組三課／RWD 等檢查、132 合併與 101 商店檢查通過，並發機況最高 p95 16.8ms。新增 6 張 runtime 美術（4 次 image_gen.imagegen，含被取代的一版月台），15 張精選每課 5 張。完整交付與 BLOCKED 邊界見 CODEX_RESPONSE_CONTENT_R10.md。
