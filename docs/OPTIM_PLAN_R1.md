# 優化輪 R1 計畫：好玩＋美觀（3～5 歲）

日期：2026-10-15　版本：2.3.0 → 2.4.0　執行者：Claude（本輪不使用 Codex）

依據：`~/.claude/skills/game-optimization-round/SKILL.md` 八大面向與品質閘門、`遊戲/CLAUDE.md`、本 repo `README.md`、`docs/QA.md`。repo 內沒有 `AUDIT_full.md`、`AGENTS.md` 或更早的 `OPTIM_PLAN_R*`，因此本輪編號為 R1。

本輪限制（老闆指示）：

- 只在背景跑 headless。不開有畫面的瀏覽器、遊戲視窗或 Blender。
- 不用 Codex imagegen 或 Blender MCP，也不新增 AI 生成的 2D 原畫。可以做程式化光影、粒子、UI、調色、動畫節奏與音效。
- App Store 已上架。不重建原生包，不碰商店設定，只做本地 commit。

## 0. 基線（改動前，headless 實測）

工具：Playwright 1.61.1 headless Chromium，ANGLE D3D11（Intel 內顯），Vite dev server 埠 5108。

| 發現 | 視口 | 證據 |
|---|---|---|
| 大廳三張交通卡的「出發」按鈕要捲動才看得到；橫式手機連卡片本體都在畫面外 | 桌機、手機橫式 | `before/*-home.png` |
| 大廳色調灰綠、偏成人編輯風，模型預覽圖是深灰背景，不像幼兒遊戲 | 全部 | 同上 |
| 汽車選單文案「把日常，留在後照鏡。」是成人語氣；車色圓點只有 16px（橫式 10px）；模式鈕高 25～32px | 全部 | `before/*-car.png` |
| 汽車橫式選車面板被路線面板蓋住 | 手機橫式 | `before/landscape-car.png` |
| 汽車只能開到終點，沿路沒有可收集的目標，也沒有即時獎勵 | 全部 | `before/*-car-drive.png` |
| 火車頁在橫式多出 50px 捲動，幼兒按鈕被切掉 | 手機橫式 | `before/landscape-train*.png` |
| 火車六顆按鈕亮度相同，只有一圈外框提示下一步 | 全部 | `before/*-train-run.png` |
| 火車到站接客後只有文字提示，沒有慶祝 | 全部 | `before/*-train-boarded.png` |
| 飛機尋寶的星星是淡米色線框，被霧化與色調映射洗白，看不出是星星 | 全部 | `before/*-flight-fly.png` |
| 飛機選單直式時，黏底的「出發」鈕蓋住場地／機型下拉選單 | 手機直式、橫式 | `before/portrait-flight.png` |
| 三個模式天空和地面都偏灰，飽和度低 | 全部 | 所有 before 圖 |
| 命中區小於 44px：大廳頁尾連結、汽車頂列音效／設定鈕（42px）、火車頁尾連結（11～20px） | 多個 | `before/report.json` |

## 1. 計畫清單（逐項可驗收）

### A. 共用獎勵與慶祝系統（好玩）
- [x] A1 `src/shared/rewards.js`：三種模式共用的星星貼紙紀錄，存在 localStorage；儲存失敗時退回記憶體，避免當機。驗收：新單元測試。
- [x] A2 `src/shared/celebrate.js`：程式化彩紙爆發、「+N ⭐」大貼紙彈出、WebAudio 三和弦音效。要遵守靜音設定與 `prefers-reduced-motion`，不擋點擊（`pointer-events:none`）。驗收：單元測試驗證音符序列和靜音行為，headless 截圖可看到慶祝畫面。

### B. 大廳（美觀＋一打開就知道按哪裡）
- [x] B1 換成明亮天空漸層、程式化雲朵與色塊，卡片用三種主色（汽車紅、火車綠、飛機黃）。
- [x] B2 三個視口都不用捲動，就看得到三張卡片的主要按鈕。驗收：Playwright 量 `getBoundingClientRect` 在視口內。
- [x] B3 每張卡片顯示該模式已收集的星星數，頁首顯示總數（貼紙架）。
- [x] B4 卡片有呼吸、彈跳和按壓動畫（reduced-motion 時關閉）。

### C. 汽車（好玩）
- [x] C1 路上沿車道放金色星星（每趟 12 顆）。開過去會收集，並有音效、彈出動畫和 HUD 星數。邏輯放在純函式 `collectibles.js`。驗收：單元測試涵蓋位置固定、命中半徑、重複收集防護。
- [x] C2 抵達終點後，結算卡顯示本趟星星與 1～3 顆評等星，並寫入共用獎勵。
- [x] C3 選單改成幼兒語氣；車色圓點與模式鈕命中區 ≥44px；修正橫式面板重疊。
- [x] C4 場景調色：天空更藍、草地更綠、曝光提高（只調參數，不換素材）。

### D. 火車（好玩＋按得到）
- [x] D1 幼兒模式中，教練建議的下一顆按鈕放大並跳動；其他按鈕降低存在感（降透明度，仍然可以按）。
- [x] D2 每站接客完成都慶祝並得星；完成整課再額外加星。
- [x] D3 橫式不用捲動，幼兒按鈕整排可見。
- [x] D4 天空與地面調色更明亮。
- [x] D5 頁尾小連結的命中區加大到 ≥44px 高。

### E. 飛機（看得見目標＋獎勵）
- [x] E1 星星目標改成飽和金色並略微發光（`toneMapped:false`），加上脈動縮放；郵件與景點目標同步提亮。
- [x] E2 收到星星、郵件、景點事件時觸發共用慶祝並得星。
- [x] E3 直式和橫式選單的「出發」鈕不再蓋住下拉選單。
- [x] E4 調整四張地圖的天空、陸地、海色與霧距，讓畫面更清楚。

### F. 音樂（可選）
- [x] F1 （已完成：task `25b5be10…`，見 CREDITS.md）用本機 AI 派工器（`music`，ACE-Step）產一首 30 秒大廳背景音樂，轉成 m4a 放進 `public/audio/`，並記入 CREDITS。只在使用者第一次點擊後播放，靜音設定要有效。產生失敗就保留可替換架構，並在報告寫明。

### G. 八大面向對照（本輪範圍說明）
| 面向 | 本輪處理 | 不處理原因 |
|---|---|---|
| 1 美術 | 調色、程式化光影、UI 視覺、星星與粒子 | Blender MCP／2D 生成本輪禁用，模型本體不改 |
| 2 按鈕 | B2、C3、D3、D5、E3＋命中區守門測試 | — |
| 3 選單 | 大廳與飛機選單不用捲動就能按、汽車面板不重疊 | — |
| 4 人物 | 本作沒有人物角色，交通工具就是主角 | 交通工具加臉要動 3D 模型，列為缺件 |
| 5 地圖模型 | 調色與霧距 | 新地景素材需要 Blender，列為缺件 |
| 6 技能 | 對應幼兒主動作：下一步按鈕跳動、慶祝回饋 | — |
| 7 角色樣子 | 截圖量亮度與飽和度（場景畫面） | 交通工具模型本體不改 |
| 8 動作流暢度 | 星星旋轉、彈跳、彩紙動畫，不影響物理 | 載具骨架動畫不在本輪 |

### H. 品質閘門
- [x] `npm test` 全綠（原本 104 項＋新增）。
- [x] `npm run build` 成功（CI `pages.yml` 實際會跑的就是 test、build 與 package-source；package-source 會產生 zip，本輪只確認 build）。
- [x] 新功能有單元測試：rewards、celebrate、汽車 collectibles、火車得星規則。
- [x] 效能：headless GPU（D3D11 Intel 內顯）量三個模式、三個視口的 rAF 間隔 p95，各跑三次取中位數。軟體渲染（SwiftShader）只有約 2 fps，不能當效能數據，報告要註明。
- [x] 秘密掃描：`grep -rniE "sk-proj-[A-Za-z0-9_-]{20}|sk-[a-z0-9]{40}"`（排除 .git、node_modules）零命中。
- [x] 版本 bump 到 2.4.0：`package.json`、`package-lock.json`、`src/games/car/config.js`、`car/index.html`。原生包、商店與歷史證據檔記錄的是已上架的 2.3.0，保持原值不改。
- [x] before／after 截圖放進 `docs/evidence/r1/`。
- [x] 本地 commit（繁中訊息），不 push、不部署。


## 執行結果

全部項目已執行，證據與未完成項見 [R1_FUN_AND_POLISH_REPORT.md](R1_FUN_AND_POLISH_REPORT.md)。G 表內「不處理」的部分仍是缺件，沒有假裝完成。
