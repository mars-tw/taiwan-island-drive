# 島嶼交通學院：新內容第 5 輪

VERIFIED，2026-10-19。版本 **2.17.0／原生來源 build13**，分支 **r1-fun-polish**，基線 `aa28ddc`。依 Muse R4 的五件事完成本機修正與驗證；尚未取得 Muse 複審分數，沒有宣稱已達 8 分。

三課入口都是 **首頁「海岸實作課」→ 選課 →「一起出發」**。

| 課程 | 這輪做了什麼、怎麼玩 | 完成與保存 |
|---|---|---|
| 把蛋糕平穩送到 | 按住踏板起步、放開放慢；蛋糕本體、奶油、小旗與車身同步受力。移除角度數字與重複大路牌，改用綠黃力道條、扶正箭頭及阿路安心／提醒表情；過斜快行時自動逐步減速，給孩子修正機會。 | 第 2 站左右各修正才能通過；第 3 站在虛線灣位停穩、再起步，最後停下完成。結算記錄扶正、灣位停穩與阿路慢行輔助。 |
| 路口停看聽 | 先停穩，看左／看右時取景明顯平移，看到該側等候者；三站過街順序不同。未看右或有人還在斑馬線上，出發鈕保持灰色且不能出發，阿路在旁提醒。 | 三人通過才可出發，保留各人的雙姿勢。結算記錄看左、看右及等待人數；各站與完成狀態可重開接續。 |
| 形狀車票，找對月台 | 點場景站牌，前進、停穩再開門。錯站真實停靠、門關閉，車票與站牌並排比較；改選保留原車位再沿軌移動。上客改為約四秒，三人依序走到門口、逐一出現在座位。 | 三站正確位置不同，必須同時看形狀與顏色。完成收起浮動車票，保留正確場景站牌、三席與車位；結算區分「自己改選 3 次」與「一次就找對」。 |

三課都從正常入口進入，沒有新增第四課、分數競速、淘汰、倒數懲罰、付費、帳號、廣告、連線或 SDK。蛋糕是實際物理讀值驅動的 2D 圖層形變，人物是既有兩種肢體姿勢與位置補間；沒有宣稱類比壓感、骨架動畫或完整 3D 蛋糕物理。

## Muse 五項驗收與原圖

以下路徑均相對於 repo；未重列資料夾的檔名均位於 `docs/content/r5/`，全部是 **390×844 手機直式原始 PNG**。完整逐圖路徑、尺寸、SHA-256 與當時狀態在 `docs/content/r5/acceptance.json`；`docs/content/r5/review.html` 可開啟完整五項圖集。

1. **不用讀數字也看得懂受力**：`docs/content/r5/phone-cake-force-starting.png`、`phone-cake-force-overturning.png`、`phone-cake-force-settled.png`。同次連續操作中，旗角絕對值為 14.60°／21.16°／4.23°，奶油讀值為 −2.94／−8.75／2.05；圖內不顯示角度。蛋糕、奶油位置、教練表情、箭頭及綠黃條一起改變，最後實際降到低速回穩。
2. **三站規則差異**：蛋糕的 `docs/content/r5/phone-cake-stage-1-process.png`、`phone-cake-stage-2-process.png`、`phone-cake-stage-3-process.png`；另有 `phone-cake-both-corrections.png`、`phone-cake-bay-stopped.png`。路口三站各有 `phone-crossing-stage-1-look-left.png`、`phone-crossing-stage-2-look-left.png`、`phone-crossing-stage-3-look-left.png`；車票三站各有 `phone-tickets-corrected-stage-1-moving.png`、`phone-tickets-corrected-stage-2-moving.png`、`phone-tickets-corrected-stage-3-moving.png`。遊玩時隱藏站名標籤，靠路況、人物及形色任務區分。單元測試證明直開無法略過連彎或灣位，固定點第 1 站的位置也無法在第 2、3 站配對成功。
3. **左右觀察與出發閘**：`docs/content/r5/phone-crossing-stage-1-look-left.png`、`phone-crossing-stage-1-look-right.png`，可直接比較取景、人物與按鈕狀態；只有看左時及有人過街時，都實際嘗試出發並確認無法完成。三站各有左右、清空及三位朋友兩種姿勢的原圖，完整 27 張見驗收索引第 3 項。
4. **錯站與上客因果**：`docs/content/r5/phone-tickets-corrected-stage-1-wrong-closed.png` → `-reselected.png` → `-moving.png` → `-matched.png` → `-first-walking.png` → `-seat-1.png` → `-seat-2.png` → `-seat-3.png`。上述縮寫沿用同一檔名前綴，每個完整路徑均列在驗收索引第 4 項，第 2、3 站也有完整鏈。`phone-tickets-saved-complete.png` 是重新載入後的正確站牌、車位、三席及同一事實結算。
5. **剛才事實與首頁同步**：`docs/content/r5/phone-tickets-corrected-complete.png`、`phone-tickets-direct-complete.png` 是兩個乾淨存檔各從入口完整玩三站，結算確實不同。三課各有 `phone-home-after-cake.png`／`phone-picker-after-cake.png`、`phone-home-after-crossing.png`／`phone-picker-after-crossing.png`、`phone-home-after-tickets.png`／`phone-picker-after-tickets.png`，不用重開就同步增加到 1／3、2／3、3／3 課。蛋糕與路口結算事實另見 `phone-cake-stage-3-result.png`、`phone-crossing-stage-3-result.png`。

## 審查精選集

**`docs/content/r5/review-set/` 正好 15 張，01～15 排序，每課分配 5 張。** 其中 12 張是遊玩／上客，另含兩種車票打法的結算與路口完成後立即回首頁的進度。沒有說明頁；三課都有實際操作中的畫面。

- 01～05：蛋糕三格受力、連彎、灣位停穩。
- 06～10：看左、看右、奶奶兩格動作、完成路口後首頁進度。
- 11～15：錯站關門、第一人與第三人落座、改選與一次找對的不同結算。

每張都是原圖位元組直接複製，沒有縮放、加字或拼貼；`review-set-manifest.json` 保存原圖與精選副本的相同雜湊。完整中間步驟仍保留在 R5 根目錄及五項驗收索引，沒有用完成頁取代過程證據。

## 測試結果

| 項目 | 結果與證據 |
|---|---|
| `npm test` | VERIFIED：190／190，零失敗；原 182 項保留，新增 8 項。`docs/content/r5/unit-tests.txt`。所有既有測試檔逐檔與基線比對相同，沒有刪測試或放寬斷言。 |
| `npm run build` | VERIFIED：車體表面檢查通過，211 個本機快取檔。`build.txt`。 |
| R5 無頭操作 | VERIFIED：117 項檢查、114 張原圖；8 視口的開場／遊玩／休息控制全部 ≥60px，手機沒有鍵盤說明。三課完整三站、逐站保存、兩種打法、重開完成、離線路口三站、拒絕儲存、減少動態及暫停通過，零執行錯誤、外部請求與 HTTP 失敗。`browser-matrix.json`、`browser-play.json`、`browser-store.json`、`browser-force.json`、`browser-replay.json`。 |
| 重玩補測 | VERIFIED：完成存檔範例可再玩、逐一上客、進入下一站，舊完成紀錄保留。這項只驗功能，沒有輸出審查 PNG；所有審查圖均來自正常入口的實玩。`replay-test.txt`。 |
| `npm run test:merge`，5286 | VERIFIED：11 尺寸、132 項、25 張原圖，零執行錯誤與外部請求。`merge-test.txt`、`merge/merge-path.json`。 |
| `npm run test:store`，5113 | VERIFIED：12 尺寸、101 項、26 張原圖；冷開、第一目標、保存、拒絕儲存及安裝後離線通過，零執行錯誤與外部請求。`store-test.txt`、`store/review-path.json`。 |
| 並發負載效能 | VERIFIED／參考：6 模式 × 3 視口，各三次 2 秒 rAF 取樣，p95 中位數最高 **16.8ms ≤18ms**。`performance.json`、`performance-test.txt`。這是瀏覽器幀間隔參考，沒有當成原生裝置或乾淨機況的 CPU／GPU render time。 |
| 交付檢查 | VERIFIED：版本／來源 build、指定分支、依賴不變、既有測試不變、沒有刪檔或 GLB 修改、原圖／精選／商店圖雜湊及尺寸讀回、RGBA 透明素材與 dist 一致、沿用美術雜湊一致、秘密掃描零命中。`release-proof.json`、`release-test.txt`。 |

全部在背景／無頭執行，兩個 preview 依序開啟，瀏覽器與伺服器皆已關閉。沒有派工、push、部署、商店後台操作或對外傳訊；原有十份未追蹤 Muse 審查檔保留，不納入提交。

## 美術、商店圖與文案

**新增生成 1 次／新設計 1 個／新遊戲點陣圖 1 張。** 實際工具 `image_gen.imagegen`，模型 slug 未揭露；阿路提醒表情沿用同一風格前綴、安全車窗、黃帽與安全帶。原圖與完整提示在 `docs/content/r5/art/`，遊戲圖為 `public/art/content-r5/coach-reminder.png`，只做透明等比縮圖。其餘道路、蛋糕、列車、月台與雙姿勢人物沿用受管原畫。形狀、箭頭、力道條與路面灣位只作教學資訊，沒有以方塊或 emoji 冒充美術。

新增商店原圖，舊圖全部保留：

- 1290×2796：`docs/store/screenshots/content-r5/iphone-cake-care.png`。
- 2064×2752：`docs/store/screenshots/content-r5/ipad-cake-care.png`。

這些是 Web 無頭原圖，並非原生 iPhone／iPad 裝置截圖。主線與商店回歸原圖分別保存在同層 `merge/`、`store/`。

繁中文案採 mode 2 直接套用三處：原「小旗 n°」需要讀角度，改「坐穩了／放開，扶正」配表情與力道條；原「學生證・n／4 章」缺少新課狀態，加上「海岸 n／3 課」；原「海岸實作課」入口未顯示進度，加上「已完成 n／3 課」。三課正式名稱與既有交通教育方向保持一致。

**Apple 4.3 風險：中。** 照顧蛋糕、主動觀察路口與雙線索停靠有不同操作、實際因果及個別事實回饋；仍與既有 3D 駕駛混合媒材。這是本機設計評估，沒有 Apple 或 Muse 核准結論。

**BLOCKED**：實體 iPhone／iPad 觸控與離線語音，需要裝置與原生簽署測試環境；真人親子試玩，需要家長同意、3～8 歲兒童與觀察紀錄；乾淨機況效能，需要其他線路停載的專用時段；Muse ≥8 分複審，需要審查員讀取本輪 15 張精選並回評。上述均未假造完成。
