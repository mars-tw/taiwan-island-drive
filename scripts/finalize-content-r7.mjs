import {readFile,writeFile} from 'node:fs/promises';
const j=async p=>JSON.parse(await readFile(p,'utf8')),root='docs/content/r7';
const play=await j(`${root}/browser-play.json`),runs=await Promise.all(['play','matrix','done-matrix','resilience','store'].map(s=>j(`${root}/browser-${s}.json`))),perf=await j(`${root}/performance.json`),merge=await j(`${root}/merge/merge-path.json`),store=await j(`${root}/store/review-path.json`),shots=await j(`${root}/screenshots.json`),secret=await j(`${root}/secret-scan.json`);
const force=play.rows.find(r=>r.start),records=play.rows.find(r=>r.records).records,max=Math.max(...perf.rows.map(r=>r.p95));
const report=`# 島嶼交通學院：新內容第 7 輪

VERIFIED，2026-10-19。版本 **2.19.0／原生來源 build15**，分支 **r1-fun-polish**，基線 fbbcba8。依 CONTENT_REVIEW_R6_MUSE.md 的五項驗收完成本機實作、測試與原尺寸證據。Muse 複審尚未發生，不宣稱已取得 8 分。

三課入口均為 **首頁「海岸實作課」→ 選課 →「一起出發」**。

| 課程 | 本輪修改與玩法 | 完成回饋 |
|---|---|---|
| 把蛋糕平穩送到 | 上方 180px 特寫，小手機／矮橫式 144px；三層蛋糕、奶油草莓與旗獨立位移。車頂使用同一圖集。按住起步、放開放慢，左／右轉，煞車慢停；第 2 站需左右連彎，第 3 站需臨停後再起步。 | 實玩扶正 ${records.cake.facts.recoveries} 次、停穩 ${records.cake.facts.bayStops} 次、再起步 ${records.cake.facts.bayRestarts} 次、慢行輔助 ${records.cake.facts.assists} 次。 |
| 路口停看聽 | 每人起步前重新看所在方向，按錯只提醒；不操作就停在判斷點。三站先行者與順序不同；小朋友／奶奶換成大跨步與抬膝兩姿勢，等高同腳底基準，腳下加接觸陰影。圖像與既有離線語音短句提示。 | 各站先看左右共各 ${records.crossing.facts.leftViews} 站；重新確認 ${records.crossing.facts.confirmations} 次、等 ${records.crossing.facts.waited} 位，實際提早出發提醒 ${records.crossing.facts.blockedStarts} 次。 |
| 形狀車票，找對月台 | 比對形狀與顏色，選站、前進、停穩開門。上客時前進灰色不可按，大車票持續保留。錯站關門，改選從現有車位續行；朋友依序走到門口、入座。 | 本趟改選 ${records.tickets.facts.reselections} 次、總共 ${records.tickets.facts.boarded} 位落座；每站畫面始終維持月台＋車內 3 人。 |

三課結算增加本趟三站的道路／人物順序／形色圖帶；首頁與選課進度即時同步，重開仍為完成。沒有新增第四課、分數競速、淘汰、倒數懲罰、外連、廣告、付費、帳號、SDK 或依賴。正式名稱維持「路口停看聽」，沒有把觀察玩法冒稱歌曲。

## Muse 五項驗收與原尺寸證據

以下檔名均在 **docs/content/r7/**，手機 PNG 為 **390×844**。完整當時狀態、結算文字、尺寸與 SHA-256 見 acceptance.json、screenshots.json；精選副本與來源雜湊見 review-set-manifest.json。

1. **蛋糕分層受力**：phone-cake-starting.png → phone-cake-turning.png → phone-cake-settled.png。頂層橫向位移為 **${force.start}／${force.turn}／${force.settled}px**，底層原寬 108px，兩個受力狀態均超過寬度 1／4；三層不再共用整張旋轉圖。phone-cake-noreadout-starting.png、-turning.png、-settled.png 為同次實玩在執行時隱藏文字／輔助圖示的版本，沒有改像素或指定遊戲狀態。phone-cake-recovery-1.png → -2.png → -3.png 顯示回穩與彈簧越過中線。phone-cake-assisted-slowing.png 與原狀態證明車速由 ${force.fast} 降至 ${force.slow}；速度數字沒有放進兒童玩法。真人遮字辨識與扶正方向判讀仍為 BLOCKED。
2. **真正的路口判斷**：phone-crossing-stage-2-decision-1.png → phone-crossing-stage-2-confirmed-1.png → phone-crossing-grandma-mid-pose-0.png。判斷點、確認後短暫準備、起步分開可見。九次判斷均實測不操作與按錯方向不過街；單元測試各停等 12 秒。三站各有 decision-1／confirmed-1、clear、result；提早出發每站實按一次，結算共 3 次，沒有扣分。
3. **上客鎖定前進**：phone-tickets-stage-1-door-open-waiting.png、stage-2 同名、stage-3 同名皆呈灰色前進與持續大車票。每站實際滑鼠連點三次，凍結的僅是拍攝用 rAF 時間；同一時間點的列車位置、月台與座位數完全不變，等待提示仍在。恢復時間後正常逐人入座；phone-tickets-stage-3-seat-1.png → -seat-2.png → -seat-3.png 可逐人核對，沒有修改上客狀態。
4. **三站與結算／首頁鏈**：每課都有 phone-課名-stage-1／2／3-playing.png；路口對應 decision-1.png。另有 phone-cake-double-bend.png、phone-cake-bay-stopped.png；車票每站都有 wrong-closed、door-open-waiting 及 seat-1／2／3。三課結算各為 phone-cake-stage-3-result.png、phone-crossing-stage-3-result.png、phone-tickets-stage-3-result.png；其後各自返回首頁 phone-home-after-cake／crossing／tickets.png，進度依序 1／3、2／3、3／3。phone-課名-saved-result.png 是重開後完成頁。結算數字來自本次實玩紀錄，不是指定數值；三站圖帶讓遮住站名時仍可比對路形、先行者及形色組合。
5. **步態與接觸陰影**：phone-crossing-grandma-mid-pose-0.png → -mid-pose-1.png，在原 390px 寬可見伸腿與抬膝差異、相同頭部尺度與腳底陰影。兩張圖使用不同肢體原畫，沒有靠單圖旋轉冒充步態；保留原腳踏車雙姿勢。這是雙姿勢與位置補間，沒有宣稱骨架動畫或完整流暢步行循環。真人手機不放大辨識尚未做。

## 15 張審查精選

**只看 docs/content/r7/review-set/** 即可。共 15 張原 PNG 位元組直接複製，無縮放、拼貼、加字。

- 01～05：蛋糕起步／過彎／回穩三格、左右連彎遊玩、蛋糕結算。
- 06～10：奶奶先行判斷點、玩家確認、跨步／抬膝兩格、路口結算。
- 11～14：第 3 站灰色前進＋大車票＋開門等待、第一人入座、三人入座、車票結算。
- 15：首頁海岸 3／3 課進度。

蛋糕 5、路口 5、車票 4、共用首頁 1；三課都有遊玩中畫面及結算。完整三站與錯站證據保留在精選以外的原圖索引，沒有把超過 15 張放進審查資料夾。R6／R7 對照見 before-after.json；三視口副本在 docs/evidence/content-r7/。

連彎區段曾以相同檔名重複擷取，索引保留最後一張原圖並移除兩筆已被取代的列；沒有修改圖片。修正前雜湊與收斂規則在 capture-reconciliation.json，擷取腳本亦已避免重複列。

## 測試與交付

| 項目 | 結果與證據 |
|---|---|
| npm test | VERIFIED：198／198、零失敗，保留既有 195 項與全部原斷言，新增 3 項。舊路口測試只補上新玩法要求的明確操作；沒有刪測試、放寬斷言或用自動放行相容舊流程。unit-tests.txt。 |
| npm run build | VERIFIED：表面驗證與正式建置通過，221 個本機快取檔，無新增依賴。build.txt。 |
| R7 無頭實玩 | VERIFIED：${runs.reduce((n,r)=>n+r.rows.length,0)} 組檢查、${shots.length} 張原圖；九站、各課完成與重開、錯邊、提早出發、三次上客連點、離線九次判斷、拒絕儲存、暫停與減少動態通過。browser-play／matrix／done-matrix／resilience／store.json，零執行錯誤、外部請求與 HTTP 失敗。 |
| 控制與 RWD | VERIFIED：8 視口，選課／說明／遊玩／休息 80 組、完成頁 24 組；兒童目標 ≥60px、在視口內可點且未遮擋，手機無鍵盤說明。完成頁 fixture 僅測控制，不輸出審查圖。 |
| npm run test:merge，5286 | VERIFIED：${merge.rows.length} 組整合檢查，11 尺寸；merge-test.txt、merge/merge-path.json。原數學→火車→汽車→飛機→學生證保存流程通過。 |
| npm run test:store，5113 | VERIFIED：${store.rows.length} 組檢查，12 尺寸；store-review-test.txt、store/review-path.json。冷開、第一目標、存檔、拒絕儲存、安裝後離線通過。 |
| 並發機況效能參考 | ${perf.withinReferenceLimit?'VERIFIED':'BLOCKED'}：6 模式 × 3 視口 × 3 次，共 54 次 2 秒 rAF 取樣，18 組 p95 中位數最高 **${max}ms**，門檻 18ms。performance.json／performance-test.txt。只是本機幀間隔參考，不代表原生實機或 CPU／GPU render time；乾淨機況另列 BLOCKED。 |
| 版本、美術與秘密掃描 | VERIFIED：套件、lock、原生來源、汽車標示與模型目錄同步 2.19.0／build15。兩次 image_gen.imagegen、8 張新 runtime PNG，角色亮度／飽和雙閘通過。${secret.files} 個文字檔秘密掃描零命中，沒有讀取秘密目錄；release-verification.txt、art/manifest.json、art/color-check.json、secret-scan.json。 |

新增商店原尺寸截圖為 docs/store/screenshots/content-r7/cake-closeup-1290x2796.png 與 cake-closeup-2064x2752.png，分別以 430×932／DPR3、1032×1376／DPR2 無頭擷取，沒有放大圖片冒充原尺寸；沒有刪除既有商店圖。新素材原圖與完整提示在 docs/content/r7/art/PROMPTS.json，實際工具 image_gen.imagegen，模型 slug 未揭露。

文案 mode 2 修改兩處：原「看左 N 次／看右 N 次」容易與新增重看混淆，改為「先看左 N 站／先看右 N 站」；原結算僅列等候人數，補上「再確認 N 次」，與儲存的 confirmations 對應。其餘新增提示均為短句與方向圖示，不加宣傳套話。

## 未完成、缺件與風險

- **BLOCKED：Muse ≥8 分複審**。本次只依 R6 五項修正與自驗；需要審查員重新看本輪 review-set，沒有偽造分數。
- **BLOCKED：實體 iPhone／iPad 與真人親子試玩／遮字辨識**。需要裝置、原生安裝環境與家長／兒童測試者；手機／iPad 視口模擬不等於實機。本次未產出新原生 archive。
- **BLOCKED：乾淨機況效能與連續播放流暢度的獨立觀察**。本機有其他線路並發，截圖只能證明不同狀態與兩姿勢，不能宣稱真人觀感或完整動畫品質通過。
- **Apple 4.3 風險：中**。交通禮讓、蛋糕平順控制與形色月台配對各有不同因果，沒有新增通用任務／徽章模板；仍屬兒童多課程合集，無法代替 Apple 審查。沒有部署、push、商店操作或對外派工。
`;
await writeFile('docs/CODEX_RESPONSE_CONTENT_R7.md',report);console.log('VERIFIED report written from actual run evidence');
