# 島嶼交通學院：新內容第 6 輪

VERIFIED，2026-10-19。版本 **2.18.0／原生來源 build14**，分支 **r1-fun-polish**，基線 `e24b0c1`。依 `docs/content/CONTENT_REVIEW_R5_MUSE.md` 的五項驗收完成本機修正、實玩與原圖驗證；Muse 複審尚未發生，不宣稱已達 8 分。

三課入口都是 **首頁「海岸實作課」→ 選課 →「一起出發」**。

| 課程 | 本輪修改、怎麼玩 | 完成回饋 |
|---|---|---|
| 把蛋糕平穩送到 | 按住踏板起步、放開放慢，依路況左右修正。蛋糕底、奶油與草莓分開位移，小旗延遲擺動；車頂箭頭與勾勾直接標示扶正／回穩，過斜時教練放大。第 2 站顯示左、右連彎順序；第 3 站顯示停穩→再起步，並保留唯一虛線灣位。 | 結算顯示真實扶正次數、灣位停穩／再起步次數、慢行輔助次數。 |
| 路口停看聽 | 停下、看左、看右、等三人到對側再出發。朋友到對側後繼續留在畫面，進度逐一加到 3／3，出發由灰變綠。三站的先行者與人物順序不同；點人物觀察先後，請錯人時提醒目前先行者，無法改寫過街順序。奶奶改用大跨步／抬膝兩張不同姿勢。 | 結算顯示看左、看右、等待人數，以及實際提早出發的提醒次數。沒有扣分或懲罰。 |
| 形狀車票，找對月台 | 比較形狀與顏色，點站牌、前進、停穩再開門。錯站維持關門、朋友不上車；改選後列車從現有車位繼續前進。車門雙門片滑開、入口明亮；朋友從排隊位置走到門口，再逐一入座。 | 月台／車內人數同步，總人數維持三人；保留「自己改選 3 次／一次就找對」的真實差異。 |

這是原有三課的完成度修正。路口正式名稱維持「路口停看聽」，對應觀察與等待玩法。沒有新增第四課、分數競速、淘汰、倒數懲罰、廣告、付費、帳號、網路功能、外部連結或 SDK。蛋糕是即時物理讀值驅動的 2D 圖層；人物是兩張不同肢體姿勢與位置補間，沒有宣稱骨架動畫或原生完整 3D 蛋糕物理。

## Muse 五項驗收與原尺寸圖

以下手機 PNG 均為 **390×844**。完整路徑、尺寸、當時狀態與 SHA-256 以 `docs/content/r6/acceptance.json`、`screenshots.json` 為索引。以下所有縮寫檔名皆位於 `docs/content/r6/`。

1. **蛋糕分層受力**：`phone-cake-force-starting.png` → `phone-cake-force-overturning.png` → `phone-cake-force-settled.png`。同一段操作另有 `phone-cake-noreadout-starting.png` → `phone-cake-noreadout-overturning.png` → `phone-cake-noreadout-settled.png`，在執行時隱藏力道條、文字提示，保留車頂箭頭、實際蛋糕層與旗；沒有修圖或移動遊戲狀態。`phone-cake-assisted-slowing.png` 與 browser-force.json 綁定持續轉彎時的實際速度，檢查自動慢行。
2. **朋友真的過街**：三站各有 `phone-crossing-stage-N-look-left.png`、`-look-right.png`、`-passed-1.png`、`-passed-2.png`、`-before-clear.png`、`-passed-3.png`、`-clear.png`。N＝1、2、3；每人另有 `-child-curb.png`／`-child-mid-pose-0.png`／`-child-mid-pose-1.png`／`-child-far.png`，bike、grandma 同樣齊備。每站也有 `-blocked-departure.png`，是實際嘗試提早出發仍被阻擋。前後構圖保留，最後一人抵達才解鎖。
3. **三站的玩法差異**：每站 `phone-cake-stage-N-start.png`／`-result.png`、`phone-crossing-stage-N-start.png`／`-result.png`、`phone-tickets-fixed-stage-N-start.png`／`-result.png`，共 18 張開始／完成圖。另有 `phone-cake-both-corrections.png`、同次實玩 `phone-cake-gentle-bay-entering.png` → `phone-cake-gentle-bay-stopped.png` → `phone-cake-gentle-bay-restarted.png` → `phone-cake-gentle-stage-3-result.png`。路口第 2、3 站有 `phone-crossing-stage-N-previous-order-blocked.png`；車票第 2、3 站有 `phone-tickets-fixed-stage-N-wrong-closed.png`，實際沿用上一站正確位置會錯站。可遮住站名與說明，比較道路、人物順序、形色組合。人物按鈕只觀察／請求先後，不讓玩家控制朋友闖越。
4. **門與上客因果**：三站各有 `phone-tickets-fixed-stage-N-wrong-closed.png` → `-reselected.png` → `-moving.png` → `-matched.png` → `-door-open-waiting.png` → `-first-at-door.png` → `-seat-1.png` → `-seat-2.png` → `-seat-3.png`。四張核心連拍同時顯示月台剩餘與車內人數，並以人物位置核對；第一人到門口時仍未計入座位。
5. **各課結算與首頁證據鏈**：蛋糕 `phone-cake-stage-3-result.png` → `phone-home-after-cake.png` → `phone-picker-after-cake.png`；路口 `phone-crossing-stage-3-result.png` → `phone-home-after-crossing.png` → `phone-picker-after-crossing.png`；車票 `phone-tickets-corrected-complete.png` → `phone-home-after-tickets.png` → `phone-picker-after-tickets.png`。三課各自完成後立即返回，沒有在這三張之間重開遊戲；完成數依序 1／3、2／3、3／3。兩種蛋糕打法見 `phone-cake-gentle-complete.png`／`phone-cake-wobble-complete.png`；兩種路口打法見 `phone-crossing-patient-complete.png`／`phone-crossing-reminded-complete.png`；兩種車票打法見 `phone-tickets-corrected-complete.png`／`phone-tickets-direct-complete.png`。三課另各有 `phone-課名-saved-complete.png`，證明重開保存一致。

## 審查精選集

`docs/content/r6/review-set/` **限 15 張，每課 5 張**；全部是手機直式原 PNG 位元組直接複製，無縮放、拼貼或加字。`review-set-manifest.json` 保存來源與副本相同雜湊。

- 01～05：無文字／力道條的蛋糕起步、過斜、回穩三連拍，以及灣位停穩、再起步。
- 06～10：第 2 站奶奶兩格明顯不同步態、第一人抵達、第三人抵達前、全員抵達後解鎖。
- 11～15：第 3 站錯站關門、正確門開三人等待、第一人到門口、第一人入座、第三人入座。

15 張全部是遊玩／上客中。此精選優先呈現核心互動因果；九站與三課兩種結算的完整原圖另外逐項收錄於 acceptance.json，沒有拿說明頁冒充遊玩。R5 原圖與 R6 原圖對照見 before-after.json；三視口的 R6 原圖副本放在 docs/evidence/content-r6/。

兩種完整蛋糕打法的實測扶正為 **7 次／9 次**，兩者皆灣位停穩 1 次、再起步 1 次、慢行輔助 3 次。路口兩種打法皆看左 3 次、看右 3 次、等 9 人，提早出發提醒為 **0 次／3 次**。車票則為改選 3 次／一次找對。持續過斜時實際速度由 **6.85 降至 5.61**（遊戲內部單位），對應 force 原圖與狀態；介面不要求孩子讀速度或角度數字。灣位再起步原圖另要求 bayRestarted=true、速度>0.6 才拍攝。

## 測試與交付

| 項目 | 結果與證據 |
|---|---|
| `npm test` | VERIFIED：195／195，零失敗；原有 190 項保留，新增 5 項。`docs/content/r6/unit-tests.txt`。 |
| `npm run build` | VERIFIED：車體表面驗證通過，213 個本機快取檔；沒有新增依賴。`build.txt`。 |
| R6 無頭實玩 | VERIFIED：152 項檢查、218 張原圖。三課各三站完整遊玩、逐站存檔、重玩、三課兩種事實結算、即時首頁同步、重開保存、離線路口三站、拒絕儲存、減少動態與暫停通過；零執行錯誤、外部請求與 HTTP 失敗。`browser-matrix.json`、`browser-done-matrix.json`、`browser-play.json`、`browser-force.json`、`browser-contrast.json`、`browser-replay.json`、`browser-store.json`、`browser-tickets-proof.json`。 |
| 控制可達性 | VERIFIED：8 視口的選課、說明、遊玩、休息共 80 項；另 8 視口的完成頁 24 項。所有可操作目標 ≥60px、在畫面內可點，手機無鍵盤說明。完成頁與重玩測試的完成存檔 fixture 僅測控制，不輸出審查 PNG。 |
| `npm run test:merge`，5286 | VERIFIED：11 尺寸、132 項、25 張原圖，零執行錯誤與外部請求。`merge-test.txt`、`merge/merge-path.json`。 |
| `npm run test:store`，5113 | VERIFIED：12 尺寸、101 項、26 張原圖；冷開、第一目標、存檔、拒絕儲存、安裝後離線通過，零執行錯誤與外部請求。`store-review-test.txt`、`store/review-path.json`。 |
| 並發機況效能參考 | VERIFIED：6 模式 × 3 視口 × 3 次，共 54 次 2 秒 rAF 取樣；18 組 p95 中位數最高 **16.8ms ≤18ms**。`performance.json`、`performance-test.txt`。此值是瀏覽器幀間隔參考，不代表原生裝置、乾淨機況或 CPU／GPU render time。 |
| 版本、美術、秘密掃描及原圖完整性 | VERIFIED：指定分支、版本／來源 build、依賴不變、既有 25 個測試檔逐檔不變、沒有刪檔或 GLB 改動；218 張原圖、15 張精選及商店圖的尺寸／雜湊讀回一致。兩張新圖透明與亮度／飽和度門檻通過，dist 素材雜湊一致；秘密掃描零命中。`release-proof.json`、`release-test.txt`、`art/quality.json`。 |

全部在背景／無頭執行，一次只開一個 preview；瀏覽器與 preview 均已關閉。未派工、push、部署、操作商店後台或對外傳訊。原有十一份未追蹤 Muse 審查檔保留且不納入提交。無頭證據批次使用 R6_SCOPE 的 matrix、done-matrix、play、force、contrast、replay、store、tickets-proof，各自留下對應 JSON；補拍只增加證據，沒有修改遊戲狀態或放寬斷言。

新增美術 **1 次生成／1 個角色設計／2 張遊戲步態 PNG**。實際工具 **image_gen.imagegen**；模型 slug 未揭露。完整實際提示、風格前綴、來源原圖與 SHA-256 在 `docs/content/r6/art/PROMPTS.json`、`manifest.json`。遊戲檔案是 `public/art/content-r6/grandma-0.png` 與 `grandma-1.png`，僅在透明分格裁切、移除透明邊界、等比縮放至 350×350，保留 alpha；未重畫。蛋糕、車、車站、其他人物沿用受管原畫，箭頭、形狀與灣位屬教學標記。

新增商店原圖，既有圖保留：1290×2796 的 `docs/store/screenshots/content-r6/iphone-cake-care.png`，2064×2752 的 `docs/store/screenshots/content-r6/ipad-cake-care.png`。這些是 Web 無頭截圖，不是實體 iPhone／iPad 原生截圖。

繁中文案採 mode 2 直接套用：原「有扶正蛋糕／阿路陪你慢下來」無法核對操作差異，改為「扶正 N 次／慢行輔助 N 次」；原「等 N 位朋友」補上實際「出發提醒 N 次」；原「朋友等著過街」在行進期間不精確，改為「朋友正在過街」。名稱、交通教育方向與無責備語氣保留。

**Apple 4.3 風險：中。** 三課有不同觀察、操作與決策，並有可見因果及個別事實結算；仍使用既有交通題材與混合 2D／3D 形式。這是本機設計評估，不代表 Apple 或 Muse 已核准。

**BLOCKED**：實體 iPhone／iPad 觸控與原生離線語音，需裝置及原生簽署測試環境；真人親子試玩，需家長同意、3～8 歲兒童與觀察紀錄；乾淨機況效能，需其他線路停載的專用時段；Muse 至少 8 分複審，需審查員實際讀取本輪 15 張精選並回評。上述均未冒稱完成。本輪不產生原生簽署二進位。
