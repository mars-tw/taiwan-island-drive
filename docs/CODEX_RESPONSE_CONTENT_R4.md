# 島嶼交通學院：新內容第 4 輪

VERIFIED，2026-10-19。版本 **2.16.0／原生來源 build12**，分支 **r1-fun-polish**，基線 `e974bda`。本輪只依 Muse R3 審查的五件事修正三課，尚無新的 Muse 分數，不能宣稱已達 8 分。

共同入口：**首頁橘色「海岸實作課」→ 選課 → 一起出發**。全程背景／無頭，只做本機修改與提交；沒有派工、推送、部署、商店後台操作或對外傳訊。原有未追蹤 Muse 審查檔保留，不納入提交。

## 三項內容與操作

| 課程 | 這輪修改、怎麼玩 | 完成與保存 |
|---|---|---|
| 把蛋糕平穩送到 | 按住踏板起步、放開放慢，用方向及煞車照顧蛋糕。實際加速度／轉向側力同時帶動整顆蛋糕傾斜、奶油滑移、旗子彎曲、車身俯仰；車依路程往道路深處前進，連彎有左右移動，臨停灣向右靠。 | 第 1 站海風坡練起步；第 2 站左右各修正至少一小段才可前進；第 3 站必須在臨停灣停穩、再起步，最後停下才可完成。沒有倒數、破壞、扣分或淘汰。各站完成後保存下一站，三站完成分享蛋糕。 |
| 路口停看聽 | 先按住停下，再點看左與看右：取景左右平移，各側觀察窗顯示實際還在等待過街的人；看過的按鈕有勾號。接著等行人、腳踏車、菜籃奶奶依當站順序全部通過。 | 還在移動、沒看完左右、朋友尚未過完都無法出發。保留三站不同路景、順序與三人雙姿勢；完成後朋友在安全人行道揮手。重開接續保存站次。課名為「路口停看聽」，沒有歌曲宣稱。 |
| 形狀車票，找對月台 | 點場景站牌，按住前進、停穩再開門。錯站也會實際停靠並擋住開門；重選維持列車位置，再沿原軌道前進。三人分開排隊、走到門口、逐一坐進車窗。 | 三站各保留真實列車、落座乘客與同步亮起的場景站牌；完成圖取消原本右上方浮動月台貼紙，阿路在天空區陪旅行。完成記錄重開時也還原正確站牌、車位及三個座位。 |

三課都是 2D 互動插畫。蛋糕是物理讀值驅動的圖層形變，車是路程投影；人物沿用兩種真正不同姿勢加位置補間。沒有宣稱新骨架動畫、完整 3D 物理模擬、類比壓感踏板或新增歌曲。

## Muse 五項驗收與附圖

以下皆為 **`docs/content/r4/` 下 390×844 手機直式原始 PNG**；沒有後製加字、縮放存檔或拼貼。`review.html` 直接按五項排列全部原圖，`acceptance.json` 列完整路徑、尺寸與 SHA-256。擷取連拍時只暫停 RAF、拍下當時狀態再恢復；沒有改速度、角度、位置、完成進度或存檔欄位。單張圖不替代操作測試。

精確姿勢補拍以 `browser-poses.json`、最後選課與商店補拍以 `browser-store.json` 為準；`screenshots.json` 是合併後的現行原圖雜湊。`recaptures.json` 列出同檔名補拍前後的來源與雜湊，各次執行紀錄保留當時的實際結果。

1. **蛋糕受力可見**：`phone-cake-recovery-1.png`、`phone-cake-recovery-2.png`、`phone-cake-recovery-3.png`、`phone-cake-recovery-4.png`、`phone-cake-recovery-5.png`。同一站按方向後放開，小旗絕對角度逐張下降；整顆蛋糕、奶油與車身有變化，車與固定道路的相對位置也改變。實際同步讀值與位置在 `browser-play.json` 的 recovery；不是只換旗角數字。
2. **三站玩法不同**：`phone-cake-stage-1-intro.png`／`phone-cake-stage-1-process.png`／`phone-cake-stage-1-complete.png`；第 2、3 站同樣各有 `phone-cake-stage-N-intro.png`／`-process.png`／`-complete.png`。另附 `phone-cake-stage-2-left.png`、`phone-cake-stage-2-right.png`、`phone-cake-stage-3-stopped.png`、`phone-cake-stage-3-restarting.png`。道路、事件圖示與必要操作同框，單元測試證明直開不能略過連彎，也不能略過臨停再起步。
3. **真的看左看右**：三站各有 `phone-crossing-stage-N-look-left.png`／`-look-right.png`，可比較取景、該側人物與操作勾號；未看完前出發鎖定。三站每人每姿勢均附圖：`phone-crossing-stage-N-child-pose-0.png`／`-1.png`、`-bike-pose-0.png`／`-1.png`、`-grandma-pose-0.png`／`-1.png`，共 18 張，完整展開清單在 `acceptance.json`。每站另有 `phone-crossing-stage-N-clear.png`，最後 `phone-crossing-complete.png`。
4. **錯站與上客鏈**：三站各有 `phone-tickets-stage-N-wrong.png`、`-moving.png`、`-right.png`、`-boarding-1.png`、`-boarding-2.png`、`-boarding-3.png`、`-seated.png`；完整 21 張原圖已放在同一驗收列，沒有只列報告而漏附。`phone-tickets-complete.png` 是實際第三站三人落座及亮起站牌，`phone-tickets-saved-complete.png` 是重新載入後的同一結局。
5. **選課與全域一致**：`phone-home.png`、`phone-picker-new.png`、`phone-cake-intro.png`、`phone-cake-complete.png` 並排核對同款海岸、字型、路牌按鈕與阿路。`phone-picker-progress.png`／`phone-picker-complete.png` 證明三種狀態；`phone-crossing-intro.png`／`phone-tickets-intro.png` 保留陪練入口；`phone-storage-denied.png` 保留小字儲存失敗提示，不擋主操作。三課休息頁亦各有 `phone-課名-paused.png`。

## 驗證

| 項目 | 結果與證據 |
|---|---|
| `npm test` | VERIFIED：182／182，零失敗；`unit-tests.txt`。 |
| `npm run build` | VERIFIED：既有車體表面閘通過，104 模組、210 個本機快取資源；`build.txt`。 |
| 新內容無頭實玩 | VERIFIED：97 項檢查、93 張不重複原圖（89 張手機直式、4 張商店尺寸）。8 視口可達、三課完整三站、必要操作、站次／完成重開保存、離線三站、暫停、減少動態、儲存被拒及進行中狀態皆通過；零執行錯誤、外部請求及 HTTP 失敗。`browser-matrix.json`、`browser-play.json`、`browser-poses.json`、`browser-store.json` 與對應測試輸出。 |
| `npm run test:merge`（5286） | VERIFIED：11 尺寸、132 項、25 張原圖，零執行錯誤及外部請求；`merge-test.txt`、`merge/merge-path.json`。交通主線使用原物理加速取樣，沒有直接改位置或完成狀態。 |
| `npm run test:store`（5113） | VERIFIED：12 尺寸、101 項、26 張原圖；冷開、觀察、第一目標、重開保存、拒絕儲存及安裝後離線通過，零執行錯誤及外部請求；`store-test.txt`、`store/review-path.json`。兩個 preview 依序開啟，均已關閉。 |
| 並發負載效能 | VERIFIED／參考：6 模式 × 3 視口共 18 組，各取 3 次 2 秒實際 rAF 樣本的 p95 中位數，最大 **16.8ms ≤18ms**；`performance.json`、`performance-test.txt`。 |
| 發行檢查 | VERIFIED：2.16.0／來源 build12、指定分支、依賴不變、無刪檔或 GLB 修改、原斷言保留、沿用美術與所有現行原圖 SHA-256／尺寸讀回、秘密掃描零命中；`release-proof.json`、`release-test.txt`。 |

既有測試沒有刪除或放寬斷言。`tests/shared/content-r1.test.js` 原來固定轉單側、一路踩到底的操作，改為依當前彎道轉向並在臨停灣煞停再起步；原始斷言逐字保留、迴圈上限仍為 1000，新增左右彎與臨停再起步四個斷言。新增 R4 五項單元測試。沒有新增依賴或修改 GLB。

所有兒童按鈕在手機直橫、iPad 直橫、320×568、568×320、1366×600、1280×640 都以至少 60px 及中心／角落命中檢查；手機沒有鍵盤說明。離線重新載入後實玩三站，另驗儲存被拒、減少動態與暫停凍結。效能為同主機其他線路並發時的瀏覽器 rAF 參考，不能當原生裝置或乾淨機況的 CPU render time。

## 美術與商店截圖

**新增生成 0 次／新設計 0 個／新遊戲點陣圖 0 張。** 沿用現有 `image_gen.imagegen` 受管原畫：海岸、交通票框、阿路、車、蛋糕、路口、三站道路、單一月台、側面列車與雙姿勢乘客。本輪沒有以程式方塊、純色塊或 emoji 替代美術；幾何形狀與箭頭只作車票及方向教學符號。`docs/content/r4/art/manifest.json` 記錄沿用檔案雜湊、歷史真實生成工具來源與零新增，逐一比對基線及 dist 相同。沒有新呼叫，所以工具欄為 null，不假稱生成。

新增以下實際瀏覽器截圖；舊商店圖全部保留：

- 1290×2796：`docs/store/screenshots/content-r4/iphone-coastal-picker.png`、`iphone-cake.png`。
- 2064×2752：`docs/store/screenshots/content-r4/ipad-coastal-picker.png`、`ipad-cake.png`。
- 主線與商店回歸原圖分別在 `docs/store/screenshots/content-r4/merge/`、`store/`。全部是 Web 無頭證據，**不是原生 iPhone／iPad 裝置截圖**。

## 文案、風險與未完成

繁中文案採 mode 2，直接套用三組修改：原「輕按踏板」無類比力道可供對照，改「按住踏板起步，放開放慢」；原選課「慢慢學，不用趕」無法辨別進度，改未開始／進行中第幾站／已完成；原路口按鈕看過只換底色，改加「✓ 看左／✓ 看右」，同時表達狀態。玩法名與既有承諾不變。

**Apple 4.3 風險：中。** 三課的照顧蛋糕、路口等待與雙線索停靠都連到交通行為，結局與操作各有差別，選課識別已收斂；仍是 2D 新課與既有 3D 駕駛混合媒材。這是本機設計評估，沒有 Apple 或 Muse 核准結論。

**BLOCKED**：實體 iPhone／iPad 觸控與語音，需要實機與原生簽署測試環境；真人親子試玩，需要家長同意、3～8 歲兒童與觀察紀錄；乾淨機況效能，需要其他線路停載的專用時段；Muse 複審 ≥8 分，需要審查員打開本輪完整五項圖集。上述均未假造完成。未做 push、部署或商店上傳。
