# R1 好玩＋美觀優化報告

日期：2026-10-15　版本：2.3.0 → **2.4.0**　執行者：Claude（全程沒有使用 Codex）
計畫：[OPTIM_PLAN_R1.md](OPTIM_PLAN_R1.md)　證據：`docs/evidence/r1/`

範圍：只改網頁原始碼，做本地 commit。沒有 push，也沒有部署、重建原生包或碰商店設定。全程在背景用 headless Playwright 跑，沒有開任何看得到的視窗，也沒有開 Blender。

## 1. 改了什麼

### 共用：星星獎勵＋慶祝（所有模式）
- `src/shared/rewards.js`：三種模式共用一份星星紀錄（localStorage，用不了時退回記憶體），另外保存每條路線或課程的最佳 1～3 星評等。
- `src/shared/celebrate.js`：程式化的彩紙爆發、大貼紙彈出，以及 WebAudio 上行三和弦音效。會遵守靜音設定和 `prefers-reduced-motion`，不擋點擊；有 modal dialog 開著時，會改掛進 dialog，確保畫面看得到。第一次觸控或按鍵時解鎖音訊，讓 iOS 也能播放。

### 大廳
- 明亮的天空漸層，加上程式化的太陽、雲朵和山丘。三張卡片改成紅、綠、黃三色大卡，出發鈕高 48～56px，按下去有回饋。
- 桌機 1366×768、手機直式 390×844、手機橫式 844×390 都不用捲動，就能看到三張卡片和出發鈕（改動前桌機和橫式都要捲動）。
- 頁首加上星星架，顯示三種模式的星星總數，每張卡片也顯示該模式的星星數。
- 背景音樂：使用者第一次點擊後才會播放；靜音或 ♪ 鈕都能關掉。音樂檔不存在時，♪ 鈕自動隱藏，大廳照常運作。

### 汽車
- 每條路上有 12 顆旋轉的金色星星。只踩油門也能收集一部分（海風 GT 實測：四張地圖各 6～7 顆，單元測試守住 2～11 顆的範圍），轉彎才能全部拿到。
- 收集星星時有叮咚音效、彩紙、HUD 星星計數會彈跳，星星會縮小、旋轉後飛走，不會擋住車子。
- 抵達終點會跳出 1～3 星評等和「收集到 N / 12 顆星星」，並寫入共用星星紀錄。
- 選單改成幼兒語氣（「開車去找星星！」）。車色圓點從 16px 放大到 44px 命中區，模式鈕和頂列按鈕都 ≥44px。修正手機橫式選車面板被路線面板蓋住的問題，也把成人取向的數值欄位（極速、操控、穩定）收起來。
- 調色：天空更藍、海更清、草地更綠。

### 火車
- 幼兒模式下，教練建議的下一顆按鈕會放大、發光脈動，其他按鈕降低存在感（仍然可以按）。緊急煞車永遠維持全亮。
- 每站接客完成：彩紙、貼紙「○○站 接到乘客！」，加 1 顆星。完成整課再加 2 顆，結果視窗顯示 1～3 星。
- 手機橫式原本會多出 53px 捲動，幼兒按鈕被切掉，現在剛好一屏。結果視窗在橫式也已壓縮到一屏內。
- 頁尾連結的命中區加大到 44px；天空和地面調亮。

### 飛機
- 尋寶星星改成飽和金色（不受色調映射影響）並加上脈動，標籤改成黃底「⭐ 星星 N」。改動前星星是淡米色線框，幾乎看不見。
- 找到星星、送到郵件、抵達景點都有慶祝並得星；任務完成另加 2 顆星。
- 四張地圖的天空、陸地、海水換成明亮配色。
- 選單：場地／機型下拉移到活動卡片上方，小螢幕隱藏活動說明，選中的卡片改成亮黃色。直式時「出發」鈕不再蓋住下拉選單。

## 2. 驗證

| 閘門 | 結果 | 證據 |
|---|---|---|
| `npm test`（CI 實跑） | **117 / 117 通過**（原本 104 項＋新增 13 項） | 本機執行輸出 |
| `npm run build`（CI 實跑） | 通過；precache 75 個檔案，包含 `audio/lobby-theme.m4a` | 本機執行輸出 |
| `scripts/package-source.ps1`（CI 實跑） | 通過，產生 `release/island-drive-source.zip`（194,324,216 bytes，該檔已被 gitignore） | 本機執行輸出 |
| 控制可達性守門（新增 `scripts/check-reachability.mjs`） | 3 視口 × 7 情境全綠：大廳、汽車選單／駕駛／結算、火車、飛機選單／飛行 | `docs/evidence/r1/reachability-guard.txt` |
| 效能 p95（三跑取中位數） | 9 組都在 **16.7～16.8 ms**，未超過 18 ms | `docs/evidence/r1/frame-times.txt` |
| 秘密掃描 | `grep -rniE "sk-proj-[A-Za-z0-9_-]{20}\|sk-[a-z0-9]{40}"`（排除 .git、node_modules）**0 命中** | 本機執行輸出 |
| 版本 | `package.json`、`package-lock.json`、`src/games/car/config.js`、`car/index.html` 都改成 2.4.0；這些現行原始碼裡已經沒有 2.3.0／2.2.0 | grep |

新增測試：`tests/shared/rewards.test.js`（獎勵、評等、三和弦音效、靜音、背景音樂判斷）、`tests/car/collectibles.test.js`（星星位置、只收一次、只踩油門可收集部分但不能全收、遊戲狀態回報）、`tests/train/rewards.test.js`（每站得星、評等下限、教練提示必定指向存在的按鈕）、`tests/flight/rewards.test.js`。

效能量測說明：headless Chromium 搭配 ANGLE D3D11，使用 Intel 內顯，`requestAnimationFrame` 上限是 60 Hz，所以 16.7 ms 代表達到每幀預算。這不是手機實機數據。SwiftShader 軟體渲染只有約 2 fps，不能拿來當效能數據，已經捨棄。量測期間 AI 派工器的 GPU 任務占用的是 RTX 2060，與 Chrome 使用的 Intel 內顯不同，但機況不算完全乾淨。

實際操作驗證（headless）：
- 汽車開到第一顆星星後 `stars=1`，結算畫面顯示 1 星，星星紀錄寫入 `{car:1}`。
- 火車第一課在三個視口都由幼兒按鈕完成：準備出發 → 開始前進 → 幫我停好 → 開門接客 → 關門出發，結果 98 分、3 星，`{train:3}`。
- 飛機尋寶在三個視口都收集到第一顆星，並出現慶祝貼紙，`{flight:1}`。
- 大廳音樂：點擊後開始播放（`paused=false`）；按 ♪ 停止並記住偏好；家長設定靜音後也會停止。

## 3. 截圖（before／after）

`docs/evidence/r1/before/` 與 `after/`，檔名格式為 `<視口>-<畫面>.jpg`，視口是 desktop、portrait 或 landscape；手機截圖縮成 1x 以節省空間。
- 大廳：`*-home.jpg`；有星星的狀態：`after/extra-home-stars-*.jpg`
- 汽車選單／駕駛：`*-car.jpg`、`*-car-drive.jpg`；收集星星與結算：`after/extra-car-collect-*.jpg`、`after/extra-car-finish-*.jpg`
- 火車：`*-train*.jpg`；到站、接客、完成：`after/extra-tr-*.jpg`
- 飛機：`*-flight*.jpg`；飛行中與得星：`after/extra-fl-*.jpg`
- before 的選單截圖（`before/*-home|car|train|flight.jpg`）用 SwiftShader 擷取；遊玩截圖和所有 after 截圖都用 GPU 擷取。兩組選單截圖的 3D 背景亮度可能略有差異，UI 版面可以直接比對。

## 4. 音樂來源

本機 AI 派工器 `music`，worker 為 `ace_step_turbo`，task `25b5be10-465d-410c-a6d8-d7e5446c1ac1`。第一次派工（`43e97538…`）因為 GPU 佇列逾時失敗，重派後完成。原始 30 秒 FLAC 裁成 26.4 秒，加上淡入淡出，做響度正規化後轉成 AAC 96 kbps（328 KB）。另外用派工器 `asr`（qwen3_asr_17b，task `d8a7c297…`）轉錄，結果為空字串，可以佐證沒有可辨識的人聲，但不等於人工試聽。完整紀錄在 `CREDITS.md`。**我沒有實際聽過這段音樂**；響度、靜音段和長度是用 ffmpeg 量測的。

## 5. 繁中文案

新增的對外文字都按 speak-human-tw 常駐授權（mode 2）自審過，包括大廳說明、汽車標語、慶祝貼紙和 README 的 2.4 段落。這些都是短句、具體動作和台灣用語，審查結果不需要再改寫。

## 6. 未完成項與風險

1. **美術缺件（本輪禁用 Blender MCP 和 2D 生成）**：交通工具沒有臉、表情和角色化（面向 4、7）；大廳預覽圖仍是深灰底的舊算圖，只靠彩色外框和色調覆蓋提亮；飛機與火車場景的地形和建物沒有新素材。可替換架構：大廳圖仍在 `public/previews/*.png`，換檔即可；音樂在 `public/audio/lobby-theme.m4a`，換檔即可。
2. **音樂授權**：模型 README 標示 MIT，但生成音樂在各法域的著作權歸屬還沒有定論。下次重建原生包前，請家長或法務確認。
3. **原生環境沒有驗證**：Capacitor iOS／Android 對 `.m4a` 的 HEAD 回應是否帶 `audio/*` content-type，本輪沒有原生建置，所以沒驗證。不符合時音樂鈕會自動隱藏，不會壞掉。WebAudio 音效在 iOS 靜音開關下的行為也沒有實機驗證。
4. **商店截圖與 XCTest**：大廳版面改了，但 iOS UI 測試用到的文字（「今天，想開」、「開汽車／開火車／開飛機」、「家長設定」、「設定好了」）都保留；手機橫式時標題改成視覺隱藏，仍在無障礙樹裡。本輪沒有跑 XCTest，也沒有更新商店截圖。
5. **選單的捲動區**：大廳頁尾連結（MIT、下載）、飛機選單的家長設定和頁尾，仍然要捲動才看得到。這些是家長用的次要入口，不是幼兒主操作；可達性守門只檢查主操作。
6. **效能**：數據來自桌機內顯的 headless 環境，不是手機實機；仍需要實機量測。
7. **`scripts/check-reachability.mjs` 與 `scripts/measure-frame-times.mjs` 不在 CI 裡**，因為 Playwright 不是專案依賴，需要用 `PLAYWRIGHT_MODULE` 指向既有的 Playwright 才能跑。
8. 原生包、商店與歷史證據檔記錄的是已上架的 2.3.0，刻意不改。
