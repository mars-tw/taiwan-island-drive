# R4 美術重做交付

2026-10-16。版本 **2.8.0／原生來源 build 4**，分支 **r1-fun-polish**。本機美術與無頭驗證 VERIFIED；原生出貨、真人試玩與正式效能閘 BLOCKED。沒有 push、部署、操作商店、傳訊、派工、可見視窗、讀取全機 secrets 或新增第三方 SDK／外部連結。

## 三項主要改變

1. **有臉的朋友。** 戴黃帽的石虎「阿路教練」進入首頁、數學、觀察課、火車與飛機；六位乘客小臉取代數學課已入座圓點，總數與移車守恆不變。連接器改「相連／分開」，避免看成減號；答案三鈕統一白底，不再把最後一個可能錯誤的選項預先上色；交接鈕縮為「去接朋友」。新增的是靜態插畫，沒有假稱人物行走／骨架動畫。
2. **陽光海岸與交通登車票。** 海岸學院原畫替代程式天空；米色大表單變成海藍路牌與橘白邊材。主線有獨立教練舞台，三種交通入口共用車票切線、橘色出發鈕，保留真正 Blender 車輛預覽。手機、iPad、矮筆電各有版型，數學課以海岸月台場景取代死空白。
3. **三模式同一間學院。** 白／海藍面板與橘色主操作接入汽車、火車、飛機、學生證和觀察課。替換主圖示、Logo 與 Web App 圖示；原深青飛行大卡與火車兒童控制底色改亮。兒童主要操作維持至少 60px，為完整矩形命中把按鈕圓角收為 8px，面板維持 22～28px；手機鍵盤提示改為觸控指引。橘底小字對比 4.95:1，正文白底 11.49:1。

## 新素材與來源

**17 個獨立視覺設計、18 個 runtime 檔案，8 次生成／編修。** 實際工具 **`image_gen.imagegen`**；工具沒有回傳模型 slug，manifest 明記 `model_slug: null`，沒有把規劃檔中的 gpt-image-2 當成實際證據。

| 素材 | 實際接入／數量 |
|---|---|
| `public/art/r4/coast.webp` | 海岸學院背景；首頁、數學與觀察課 |
| `coach.png` | 阿路教練全身，RGBA；五個教學／遊戲表面 |
| `passenger-1.png`～`passenger-6.png` | 六位靜態乘客，RGBA；數學座位 |
| `car.png`、`train.png`、`flight.png` | 三個交通貼紙；首頁、導覽、練習入口 |
| `badge.png`、`signal.png`、`bag.png` | 星章、號誌與書包；學生證、星架與觀察入口 |
| `panel.png` | 生成路牌原畫上緣裁成 UI 紋理；主線路牌 |
| `logo.png` | 正確「島嶼交通學院」六字；首頁品牌 |
| `app-icon-192.png`、`app-icon-512.png` | 同一 App 圖示兩尺寸；Web manifest／favicon／首頁；原生 catalog 仍是提案待換 |

所有提示使用同一風格前綴，見 [PROMPTS.json](art/PROMPTS.json)。[asset-manifest.json](art/asset-manifest.json) 記錄原畫、原生 alpha mask、RGB 留存、交付尺寸及 SHA-256；原畫在 `docs/art/source/`，首版乘客與飽和度修訂均保留。後製只做去背 alpha 清理、裁切、縮圖、透明 RGB 清零、背景 WebP q83；人物與圖示保留真 RGBA PNG。背景壓縮，圖片新增 **1,638,592 bytes，約 1.56 MiB**；加上共用樣式與少量接線程式，未引入新依賴。原畫、遮罩與證據圖屬文件，不會進 Web／native payload。

7 位角色的亮度／飽和雙閘均 VERIFIED；阿路亮度 0.5043、近黑 6.73%、平均飽和 0.7108、低飽和 10.00%。RGBA 四角透明、可見 bbox、occupancy 與 hash 已檢查；[thumbnail-64.png](art/thumbnail-64.png) 是白底／海藍底的原生 64px 讀圖證據。沒有把這個自審說成三人辨識或五人跨款盲測。

新圖授權紀錄加入 [CREDITS.md](../CREDITS.md)，既有模型、字型、音樂、Apache-2.0／CC BY 4.0 移植紀錄與完整 LICENSE／NOTICE 保留。未將 AI 圖像權利擅自寫成程式碼 MIT 授權。

## 審查與前後對照

[ART_REVIEW_R4.md](art/ART_REVIEW_R4.md) 是先擷取 2.7.0 後的嚴格審查；施工中到達的 [ART_REVIEW_MUSE.md](art/ART_REVIEW_MUSE.md) 已全文納入。採納有臉角色、場景填白、去深青面板、圖示統一、答案色彩語意與短交接文案；選擇石虎水粉繪本方案，沒有照抄另一位人類站長或把插畫冒充3D遊戲畫面。該獨立文件只看改前截圖，並非新版獨立驗收。

[ART_DIRECTION.md](art/ART_DIRECTION.md) 包含 HEX、字體層級、按鈕／面板、角色／背景、其他款唯讀比對，以及 GCompris／SuperTuxKart 官方美術研究的實際應用。繁中文案 mode 2 事後紀錄見 [COPY_REVIEW_R4.md](art/COPY_REVIEW_R4.md)。

- `docs/art/compare/before/`、`after/`：同視口首頁、數學、學生證、觀察課與三工具；22 組相同尺寸配對。
- `docs/art/compare/R4-before-after.jpg`：七個主要畫面的讀圖對照；`pairs.json` 保存逐張 hash。
- `docs/store/screenshots/art-r4/`：手機 **1290×2796**、iPad **2064×2752** 各 11 張，含主頁、數學各階段、學生證、觀察與三模式；manifest 驗證尺寸與 hash。
- 既有 merge／store runner 另重擷取其標準商店圖。全部是無合成的無頭 Chromium 實際 Web 畫面，**不是原生截圖**。

## 驗證讀回

| 項目 | 狀態與證據 |
|---|---|
| `npm test` | VERIFIED：162／162，既有斷言保留；`art/unit-tests.txt` |
| `npm run build` | VERIFIED：8 個既有車輛表面檢查、Vite、96 個 precache 檔；`art/build.txt` |
| `npm run test:merge`，5286 | VERIFIED：11 尺寸、132 檢查、25 截圖；數學→火車→公路→飛機→重開學生證，0 runtime errors／外部請求；`art/merge-test.txt`、`evidence/merge/merge-path.json` |
| `npm run test:store`，5113 | VERIFIED：12 尺寸、101 檢查、26 實際截圖；離線重開／保存／家長關卡，0 runtime errors／外部請求；`art/store-test.txt`、`art/store-evidence/review-path.json` |
| 既有 mobile／reachability | VERIFIED：100 情境、578 次主要控制檢查；3 視口×7情境可達；`art/mobile-test.txt`、`art/reachability-test.txt` |
| 既有 flight layout | VERIFIED：28 項、7 尺寸；`art/flight-layout-test.txt`、`art/evidence/flight-layout.json` |
| 新視覺語意與商店圖 | VERIFIED：3 尺寸、5 位入座乘客圖、答案一致白底與 60px、手機無鍵盤提示，12 張階段截圖；另有22組同尺寸前後配對與22張指定尺寸商店圖；`art/visual-semantics.json`、`art/compare/pairs.json` |
| 原生截圖政策 Python | VERIFIED：6／6；僅政策測試，非 iOS 執行；`art/python-tests.txt` |
| 素材／色彩／秘密掃描 | VERIFIED：7 位角色雙閘、RGBA／來源 hash、舊 app 版號零殘留、指定秘密格式零命中；未讀全機 `.secrets`；`art/asset-verification.json` |
| p95 三跑 | EXECUTED：12 組三跑中位 16.7～16.8ms，均 ≤18ms；`art/frame-times.txt`、`art/performance.json` |

效能是**並發載量測，僅供參考**，Intel ANGLE、每跑約 2 秒 rAF 間隔，不能當成 CPU／GPU frame time 或原生實機證據。量測在本輪美術／乘客接線後，最後只再收文字對比與觸控提示；物理／frame loop 沒有更動。閒置機器正式效能出貨閘仍 BLOCKED。沒有為通過測試刪除測試、放寬斷言、改數值判定或降低模型。

## Apple 4.3 與剩餘風險

**Apple 4.3 風險：中。** 本作已具海岸繪本、石虎教練、乘客、交通路牌與統一交通學院識別，降低深青模板的第一眼相似；仍保留同源交通內容與既有3D預覽，且獨立文件未審新版、帳號退件歷史未消失。這是視覺／產品風險評估，不是 Apple 已接受或法律結論；本輪沒有操作商店或聲稱即時政策核驗。

BLOCKED／未完成：iPhone／iPad／Android 原生實機與 WebKit、本輪新簽章包與原生 App 圖示 catalog、親子 beta、三人64px辨識與五人跨款盲測、閒置效能、人物行走／表情／三視圖與可逛地圖演出。乘客目前是靜態小臉，沒有假裝完成上車／分車人物動畫；家長長設定清單仍可捲動。既有大廳音樂權利與內容提供者／直接提交關係待負責人補證，沒有因本輪美術改動冒稱消除。
