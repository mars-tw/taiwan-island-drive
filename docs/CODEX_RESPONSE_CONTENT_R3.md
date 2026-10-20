# 島嶼交通學院：新內容第 3 輪

版本 **2.15.0／原生來源 build11**，分支 **r1-fun-polish**，基線 `b4ee339`。依 `docs/content/CONTENT_REVIEW_R2_MUSE.md`「下一輪最該做的 5 件事」實作。本機可做的內容與證據已 VERIFIED；真人、原生裝置及外部評分仍 BLOCKED。**尚無新的 Muse 分數，沒有宣稱已達 8 分。**

三課入口都是 **首頁橘色「海岸實作課」→ 選課 → 一起出發**。`docs/content/r3/phone-home.png`、`phone-picker.png` 可直接核對。全程背景／無頭、本機作業；沒有派工、推送、部署、商店帳號操作或對外傳訊。既有未追蹤 Muse 文件保留。

## 三項內容與玩法

| 課程 | 這輪做了什麼、怎麼玩 | 完成與存檔 |
|---|---|---|
| 把蛋糕平穩送到 | 按住踏板、方向與煞車；旗子及奶油依實際加速度／轉向側力變動。修正停住仍按煞車時持續歪旗的錯誤，補可見旗角和綠色水平基準。三站改為完整起步坡、燈塔連續彎、榕樹臨停灣，站次與道路圖示同框。 | 無倒數、扣分、破壞或淘汰。三站都走到終點並停穩後才完成；結局是切片分享蛋糕。重開接續下一站，完成紀錄保留。 |
| 路口停看聽 | 下方四個大鈕依序停下、看左、看右、等三位朋友過完再出發。上方只顯示狀態，不再擺一組像操作鈕的圖示；移除重複的站次圓點。 | 提早出發留在原地並提示。三站順序不同，行人、腳踏車、菜籃奶奶各保留兩種真正不同姿勢；全部過完才可下一站。結局為三位朋友在人行道揮手。 |
| 形狀車票，找對月台 | 直接點同一條橫向月台上的站牌；顏色與形狀都相同才可接客。列車從左側駛入，錯站也會實際停靠；重選保持目前位置，再沿同一軌道開往新站。停穩再開門，朋友分開排隊、走到門口、逐一出現在車窗。 | 錯站、行進中、尚未到站都不能開門。上客期間不顯示下一站，保留操作列位置以免場景跳高。最後完成圖由實際目標補上綠方月台牌及綠方車票，不再依賴可能被裁掉的背景物件。三站完成及重開保存已實跑。 |

這些是 2D 互動插畫。小旗／奶油是物理讀值的形變，路人與上客是雙姿勢加位置補間；未宣稱骨架動畫、完整 3D 蛋糕物理或新增歌曲。三課開頭與休息使用 3D 火車主線既有的阿路安全車窗與同款本機字體；是靜態角色視覺錨點，沒有宣稱新的入場動畫。

## Muse 唯一五項驗收

下列 PNG 都在 **`docs/content/r3/`**，是 **390×844 原尺寸手機直式執行截圖**，沒有後製縮放或貼字。完整逐項路徑／尺寸／SHA-256 見 `acceptance.json`，全圖索引見 `screenshots.json`；離線並排看圖可開 `review.html`。人物姿勢、車輛位置與小旗角度來自截圖當時的遊戲；技術測試數、斷網及時間閘以操作 JSON 為據，不把單張圖當成所有技術驗證。煞車拍照時只暫停 RAF、擷取當下畫面與讀值後恢復，沒有直接設定速度、角度或完成狀態。

1. **蛋糕過程：本機 VERIFIED，五人遮字排序 BLOCKED。** 急煞 `phone-cake-hard-brake-1.png`、`-2.png`、`-3.png`；低速輕煞 `phone-cake-gentle-brake-1.png`、`-2.png`、`-3.png`；平穩綠線 `phone-cake-steady.png`。兩組都連續擷取，直接顯示旗角，並檢查蛋糕區域本身的像素變動。輕煞是先鬆踏板、低速後煞停，未宣稱按鈕具有不存在的類比力道。起步 `phone-cake-starting.png`、轉彎 `phone-cake-turning.png`。遮字找 5 人排序、至少 4 人排對的條件尚未執行，不能據像素檢查宣稱真人門檻通過。
2. **三站與分享：本機 VERIFIED。** `phone-cake-stage-1.png` 為海風坡，`phone-cake-stage-2.png` 為燈塔連彎，`phone-cake-stage-3.png` 為榕樹臨停區；三張都有站次。`phone-cake-complete.png` 清楚看到缺一角的蛋糕、分裝小盤與遞盤動作，沿用既有分享結局。沒有把背景更換說成新路線物理。
3. **三位過街者與單一操作列：本機 VERIFIED，實機聽感 BLOCKED。** 代表雙姿勢為 `phone-crossing-stage-1-child-pose-0.png`／`-1.png`、`phone-crossing-stage-2-grandma-pose-0.png`／`-1.png`、`phone-crossing-stage-3-bike-pose-0.png`／`-1.png`。其餘每站每人也都有兩張，共 18 張；完整路徑在 `acceptance.json`。提早出發 `phone-crossing-blocked.png`；三站放行 `phone-crossing-stage-1-clear.png` 至 `stage-3-clear.png`；結局 `phone-crossing-complete.png`。只有下方操作鈕負責流程，上方狀態無按鈕／互動圖示。
4. **橫向月台、錯對與上客：本機 VERIFIED。** 每站都有 `phone-tickets-stage-N-wrong.png`、`phone-tickets-stage-N-right.png`，N＝1、2、3；列車水平位置不同，錯站開門被擋。每站上客 `phone-tickets-stage-N-boarding-1.png` 至 `-3.png`，由排隊、移到門口至逐一落座；另有 `phone-tickets-stage-1-seated.png`、`stage-2-seated.png`。`phone-tickets-complete.png` 同框保留第三站綠方站牌、綠方車票與三位落座朋友。車票依序藍圓、橘三角、綠方；各站另有同形異色、同色異形干擾牌，沒有把干擾牌誤列為下一站目標。
5. **全域收尾：本機 VERIFIED，兒童與原生裝置 BLOCKED。** `phone-picker.png` 已無蛋糕下方「—」殘影；三張 `phone-cake-paused.png`、`phone-crossing-paused.png`、`phone-tickets-paused.png` 有阿路、課名、目前站次。並排看 `phone-cake-intro.png`、`phone-crossing-intro.png`、`phone-tickets-intro.png` 與 `phone-train-driving.png`，可核對相同角色原圖與本機字體。未招募 5 位 3～8 歲兒童，沒有 4/5 獨立完成的真人結論。

## 自動驗證

| 項目 | 狀態／證據 |
|---|---|
| 單元 | VERIFIED：`npm test`，177／177；保留原 172 項，新增 5 項煞停、橫移、非法站牌、依序落座測試。`unit-tests.txt`。 |
| 建置 | VERIFIED：`npm run build`，210 個本機快取資源；既有車體表面閘通過。`build.txt`。 |
| 新內容 | VERIFIED：94 項檢查／98 張不重複原圖（含 6 張商店圖）。`npm run test:content:r3`，另以 `R3_SCOPE=gallery`、`brakes` 補拍第一站開頭、到站商店圖與同步讀值。8 視口觸控／角落命中與三課完整三站、checkpoint 重開、完成保存、斷網三站、休息與減少動態、儲存失敗可繼續玩；零執行錯誤、外部請求或 HTTP 失敗。`browser-all.json`、`final-browser-test.txt`、`gallery-test.txt`、`brakes-test.txt`。 |
| 主線整合 | VERIFIED：`npm run test:merge`，5286；11 尺寸、132 項檢查／25 張原圖，零執行錯誤及外部請求。`merge-test.txt`、`merge/merge-path.json`。 |
| 商店回歸 | VERIFIED：`npm run test:store`，5113；12 尺寸、101 項檢查／26 張原圖，冷開、觀察課、第一目標、重開存檔、拒絕儲存及離線流程通過，零執行錯誤與外部請求。`store-test.txt`、`store/review-path.json`。 |
| 並發負載效能 | VERIFIED／參考：6 模式×3 視口，共 18 組，各取 3 次 2 秒實際 rAF 樣本的 p95 中位數，最大 16.8ms≤18ms。`performance.json`、`performance-test.txt`。與其他線路共用主機，沒有控制背景負載；不是原生裝置或引擎 CPU render time。 |
| 版本／秘密／原檔保留 | VERIFIED：2.15.0／來源 build11，全 repo 受掃文字檔秘密掃描零命中；22 個既有測試檔以 Git 正規化 blob 逐檔比對，無來源或斷言變更。美術、98 張新內容原圖與整合／商店原圖皆逐一核對 SHA-256；無新依賴、GLB 修改或 Muse 原稿改寫。`release-proof.json`、`release-test.txt`。 |

手機直橫、iPad 直橫與矮視口的兒童按鈕均至少 60px、在視口內且中心／角落可命中。新增課程不顯示鍵盤說明。原有測試不刪除、不修改、不放寬斷言，沒有改動 GLB、SDK 或依賴清單。

## 美術與商店畫面

新增 **5 次 `image_gen.imagegen`、5 個設計、5 張遊戲 WebP**；三站道路、單一橫向月台、側面藍黃列車。原尺寸 PNG 與完整實際提示在 `docs/content/r3/art/`，來源／WebP 的 SHA-256 與透明度在 `art/manifest.json`。模型 slug 未揭露，記為 null。固定既有 PROMPTS 完整前綴；只做格式轉換，沒有用方塊、純色塊或 emoji 代替人物或背景。原圖與執行素材已放回本 repo。

五張執行美術合計 2,005,852 bytes（約 1.91 MiB）。本輪沒有覆蓋或刪除既有美術；R2 的三層月台原圖仍保留供追溯，正常車票流程改用新的單一月台。

新增以下原始瀏覽器商店截圖，既有商店圖保留：

- **1290×2796**：`docs/store/screenshots/content-r3/iphone-cake.png`、`iphone-crossing.png`、`iphone-tickets.png`。
- **2064×2752**：`docs/store/screenshots/content-r3/ipad-cake.png`、`ipad-crossing.png`、`ipad-tickets.png`。
- 整合與商店回歸額外原圖各在同資料夾的 `merge/`、`store/`。全部是 Web 證據，**不是原生 iPhone／iPad 截圖**。

## 文案與未完成

本輪採繁中文案 mode 2，直接套用。原有句子「海風起步坡／藍圓形車票」補為「第 1 站・海風起步坡／第 1 站・藍圓形車票」，方便核對當站；「休息一下」補課名、站次與教練，讓孩子知道回到哪裡；上客期間顯示「上車中」，避免誤認操作消失。課名「路口停看聽」保留，沒有歌曲宣稱。遊戲內短句搭配操作圖示與既有語音能力，沒有宣稱已驗過真人聽感。

**Apple 4.3 風險：中。** 三課的力道照顧、停看等待、雙線索停靠與上客決策具有交通題材特性，結局不同且接在正常首頁；阿路與字型已共用，但 2D 新課與既有 3D 駕駛仍是混合媒材。此為本機設計評估，不代表 Apple 核准，也不是 Muse ≥8 分的證明。

BLOCKED：①五人遮字排序，需 5 位受測者與紀錄，至少 4 人正確；②兒童測試需家長同意、5 位 3～8 歲兒童、無成人代讀與實際操作紀錄，至少 4 人完成一課第一站；③原生觸控、語音與截圖需 iPhone、iPad、可用原生建置環境及安裝測試；④Muse 需要讀本輪手機原圖並獨立評分。沒有假造受測者、原生畫面、聽感或分數。本機遊戲素材無缺件；上述人群／裝置／外部複審條件尚未完成。
