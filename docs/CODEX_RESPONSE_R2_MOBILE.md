# R2 手機內容與操作交付

日期：2026-10-15。版本：**2.5.0**。分支：`r1-fun-polish`。本機程式與可執行驗證：VERIFIED。出貨效能與手機實機驗收：BLOCKED，理由見限制。

## 三項主要改進

1. **12 關星星護照。** 汽車、火車、飛機各 4 關，從大廳或導覽列直接選關。完成一關才開下一關；每關保存最佳 1～3 星，四關集滿會顯示該交通工具章，共 36 顆評等星、3 個章。完成畫面有關卡短句、重玩與下一關。R1 的累積星星保留，護照另存；儲存失敗可在同一工作階段繼續玩。
2. **關卡進入真正玩法。** 汽車分成海岸 360m、墾丁 600m、城市 850m、森林 1100m，星星位置隨路程縮短；短關與原有 2.4km 最快紀錄分開。火車新增一站接客、城市兩站、紅燈等候、森林三站四課。飛機新增 2 星尋寶、1 封送信、1 處河灣觀景、4 星城市尋寶。沒有用直接寫入完成旗標來驗收。
3. **小手與單手操作。** 兒童主操作、護照分頁／關卡／關閉、暫停與結果按鈕至少 60×60 CSS px。汽車可點自動油門，按住煞車時停止加速；暫停、失焦會關閉自動油門，取消觸控會釋放輸入。飛機活動改為 3 頁，避免出發鈕蓋住活動；修正直式選車卡、矮螢幕選單及返回鈕的遮擋。

遊戲介面已移除外部網站及 ZIP 下載入口，無新增廣告或網路服務；家長設定仍保留驗證。原始碼授權文件未移除。此輪全程無頭執行，沒有 push、部署、商店操作或對外傳訊。

## 自動驗證與證據

瀏覽器使用既有 Playwright `1.63.0-alpha-2026-08-31`／Chromium build 1243，`headless:true`，ANGLE D3D11。設定 `PLAYWRIGHT_MODULE` 指向已安裝的 Playwright `index.mjs`；`BASE_URL=http://127.0.0.1:5110/` 為本機 Vite preview 建置成品。

| 指令／檢查 | 結果 | 證據 |
|---|---|---|
| `npm test` | VERIFIED：134／134；保留原 117 項，新增 17 項 | `evidence/r2-mobile/unit-tests.txt`、`tests/shared/journeys.test.js` |
| `python -m unittest discover -s tests/native-ios -p 'test_*.py'` | VERIFIED：6／6；只驗證 PNG／證據政策，非 iOS 實機 | `evidence/r2-mobile/python-tests.txt` |
| `npm run build` | VERIFIED：素材表面檢查、Vite 建置、76 個本機 precache 檔案 | `evidence/r2-mobile/build.txt` |
| `node scripts/check-mobile.mjs` | VERIFIED：100 情境、578 次控制檢查、0 runtime errors、0 外部請求／外連入口 | `evidence/r2-mobile/mobile-check.txt`、`mobile-check.json` |
| `node scripts/check-reachability.mjs` | VERIFIED：既有 3 視口 × 7 情境全綠 | `evidence/r2-mobile/reachability.txt` |
| `node scripts/run-flight-layout.mjs` | VERIFIED：既有 7 尺寸 × 2 操作模式 × 2 儀表狀態，共 28 項 | `evidence/r2-mobile/flight-layout.txt`、`flight-layout.json` |
| `scripts/package-source.ps1 -OutputPath release/island-drive-r2-mobile-source.zip` | EXECUTED／VERIFIED：本機來源包與 ZIP 讀回，見獨立紀錄 | `evidence/r2-mobile/source-package.json` |
| 秘密掃描，同工作單正規表示式，以 `rg` 執行，只排除 `.git`、`node_modules` | VERIFIED：0 命中；沒有讀取 `.secrets` | `evidence/r2-mobile/secret-scan.txt` |
| 舊應用程式版本搜尋 | VERIFIED：現行程式及應用程式版本欄位無舊版；原生與商店歷史資料未改 | `evidence/r2-mobile/version-check.txt` |
| 三跑 frame p95 | 並發載量測，僅供參考：9 組中位數 16.7～16.8ms；單次最高 33.3ms，不作出貨裁決 | `evidence/r2-mobile/frame-times.txt` |

100 情境含 390×844、844×390、1366×600、1280×640。可達性會檢查完整邊界、中央、內角及四邊的 hit testing；含護照三種模式、飛機三頁活動、暫停、結果。手機兩個視口各完成三模式第一關、讀回存檔、重玩、重載護照與進入第二關。其餘關卡由新增測試使用實際車輛時鐘、列車物理、飛行與落下郵件物理逐關完成；時間可加速，沒有瞬移或改寫成功旗標。不是宣稱在手機實機手玩完 12 關。

既有飛機版面測試的幾何、遮擋、85px 場景高度與 28 項斷言均保留，只補上正常回答家長驗證的步驟，並新增無頭 runner。這是同一 Codex 執行線的自動驗證，沒有冒稱獨立模型覆核。

## 截圖與檔案

全部在 `docs/evidence/r2-mobile/`。`before/` 保存本輪修改前的 390×844、844×390、1366×600 各四個入口；`after/` 保存同視口入口、護照、實際遊玩與結果。

- `before/portrait-car.png` → `after/portrait-car.png`：選車、字級與 60px 命中區。
- `before/landscape-flight.png` → `after/landscape-flight.png`：活動分頁與可達出發鈕。
- `after/portrait-car-play.png`、`after/landscape-car-play.png`：自動油門、轉向與煞車。
- `after/portrait-train-passport.png`、`after/landscape-train-passport.png`：四課進度及關閉按鈕。
- `after/390x844-*-complete.png`、`after/844x390-*-complete.png`：真實流程觸發的三模式結果與下一關。
- `evidence-manifest.json`：截圖尺寸、SHA-256 與版本；截圖屬測試證據，非新遊戲素材。

## 八大面向與缺件

| 面向 | 本輪結果與未完成 |
|---|---|
| 美術 | EXECUTED：護照沿用既有介面配色；沒有新增 2D 圖像檔。新原畫列缺件，不宣稱使用過 `gpt-image-2`。 |
| 按鈕 | VERIFIED：兒童主操作 60px 與指定四種視口矩陣；家長次要操作沿用至少 44px。 |
| 選單 | VERIFIED：護照每頁四關、活動分頁、返回與暫停結果可達；家長的進階設定仍可捲動。 |
| 人物 | BLOCKED／未製作：交通工具新表情、臉部及角色化模型缺件。 |
| 地圖模型 | EXECUTED：新玩法使用既有主題場景。新地景 GLB 缺件，未製作程序化方塊模型。 |
| 技能／操作 | VERIFIED：自動油門、煞車優先、觸控取消、暫停清除及完成蓋章。 |
| 角色樣子 | 未宣稱亮度／飽和雙閘及正側背三視圖通過；本輪沒有新增角色模型。 |
| 動作流暢度 | 保留物理、車輪及飛機活動面動畫；未新增人物動畫，不以單圖晃動冒充。 |

## 限制與風險

- **效能：並發載量測，僅供參考。** 本機同時有其他線路及無頭測試；沒有乾淨機況，也沒有手機 GPU 測試，不宣稱通過 p95 ≤18ms 的出貨閘。
- **原生／實機：BLOCKED。** 沒有 macOS／Xcode、iPhone／Android 實機操作證據；沒有重建、簽章、上傳原生包。新關卡原生 URL 轉換有單元測試，不能替代實機驗收。iOS XCTest 尚未執行。
- **素材：BLOCKED／未製作。** 新角色化模型、地景與可追溯 `gpt-image-2` 新原畫未提供。沒有新增音樂或音效素材，沿用 R1；R1 音樂原有授權限制仍在。
- **進度：** 只保存在本機，不提供雲端同步、匯出或跨裝置。瀏覽器儲存無法寫入時，當次可繼續，關閉後不保證保存。
- **版本搜尋例外：** `package-lock.json` 中的 `tslib ^2.4.0` 與 `prettier >=2.4.0` 是第三方依賴宣告，沒有擅改為應用程式版本。其他舊應用程式版號只保留在歷史報告及本輪前後版本說明；不把原始 grep 當成字面零命中。

## 繁中文案檢視（mode 2）

既有文案改 3 處；新增的關卡名稱、目標與短句採具體操作及台灣用語。

| 原句 | 原因 | 改成什麼 |
|---|---|---|
| 「星星全都帶回家！」在三星評等就顯示 | 三星門檻為 75%，不能誤稱全收齊 | 只有真的收齊才用此句，其餘顯示「到終點囉，好棒！」 |
| 「六份寶藏都找到了！」／「三個景點都看到了。」 | 短關任務數不同，固定數字不實 | 顯示這一趟真正的目標數 |
| 「兩份郵件都送到了！」 | 新送信關只有一份 | 顯示這一趟真正的郵件數 |
