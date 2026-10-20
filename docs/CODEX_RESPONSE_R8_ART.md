# R8／送審前深度優化第一輪

2026-10-18，島嶼交通學院 **2.12.0／原生來源build8**，僅分支 `r1-fun-polish`。基線 `bcbba9193665df6a34ecbf787e37069177801a3d`／2.11.0。美術實作EXECUTED；本機工程與證據讀回VERIFIED。不push、不部署、不操作商店、不派工、不開可見視窗、不讀取全機secrets。四份原有未追蹤Muse檔未改動、未刪除、未順帶提交。

## Muse第四輪五件事

| 項目 | 實際改變 | 原尺寸手機／iPad證據 |
|---|---|---|
| 七張去重 | 首頁、駕駛、汽車得星、真起飛、飛行得星、分車、結算各一張；每種裝置七張 | `docs/store/screenshots/art-r8/SELECTED.json`；`docs/art/store-seven-r8.jpg`僅為縮圖索引 |
| 飛行狀態 | 真實離地、斜後視角、跑道退到下方；金星限制在天空側上方，新開闊海岸天空不再把星黏上山壁；離地／速度格取代成人數字 | `docs/store/screenshots/art-r8/iphone-04-takeoff.png`、`iphone-05-flight-star.png`；`ipad-04-takeoff.png`、`ipad-05-flight-star.png` |
| 分車人數 | 靜止後窗內前4、後1；移動中禁連點並暫停算式，700ms入座後才顯示4＋1＝5，月台沒有同一位乘客副本 | `docs/store/screenshots/art-r8/iphone-06-split.png`、`ipad-06-split.png`；`acceptance-r8.json`的真實DOM數量與可見性 |
| 畫風與落地 | 保留Blender網格，藍車黃機平塗＋墨藍線；道路燈塔路牌、跑道海岸徽記；結算新列車每輪接觸軌道，教練腳下有連續月台，獎章框不壓算式 | `docs/store/screenshots/art-r8/iphone-02-driving.png`、`iphone-04-takeoff.png`、`iphone-07-complete.png`；相同名稱的`ipad-`原圖 |
| 導覽與安全 | 學生證固定第五格；四玩法暫停同為右12／上76／60×60px；速度格只依速度、得星不改語意；阿路在閉合車窗內繫安全帶，教學小窗可清楚看臉 | `docs/store/screenshots/art-r8/iphone-02-driving.png`、`iphone-03-car-star.png`、`iphone-06-split.png`；相同名稱的`ipad-`原圖 |

這14張均為 **1290×2796／2064×2752** 無合成Chromium實載截圖，不是原生裝置截圖；只透過UI、真實經過時間、自然碰撞得星。前後六組同視口原圖與hash在 `docs/art/compare/pairs-r8.json`；合併讀圖在 `docs/art/compare/R8-before-after.jpg`。改前檔名takeoff實為空中尋寶，對照保留真實課程狀態，未把改名前後當成起飛證明。

## 新圖與專屬識別

**8個新設計、8次實際生成、11個Web輸出**（含兩個既有月台細節裁圖）。工具 **`image_gen.imagegen`**；工具沒有揭露實際模型slug，manifest記null，沒有假填gpt-image版本。新增圖片2,246,041 bytes，約 **2.14 MiB**；無新增依賴、第三方SDK或外部連結。1024 App圖示提案留文件區，Web用192／512，原生catalog沿用R7。

素材：`public/art/r8/airborne-coast.webp`、`coach-safe-window.png`、`train-platform.png`、`ocean-ticket.png`、`coast-star.png`、`coast-sign.png`、`logo.png`、`app-icon-192.png`、`app-icon-512.png`、`platform-floor.webp`、`rail-strip.webp`。角色與列車身份沿用受管參考圖，沒有新增3D模型。原圖、opaque master、mask、真透明邊緣、尺寸、來源與runtime SHA-256見 `docs/art/asset-manifest-r8.json`；共同前綴與每次提示在 `docs/art/PROMPTS_R8.json`，並接入總 `PROMPTS.json`；授權記錄在 `CREDITS.md`，既有授權／NOTICE完整保留。

安全車窗教練亮度0.435、近黑15.68%、平均飽和0.681、低飽和9.44%，角色雙閘通過。面板的白閱讀面不冒充角色色彩閘。`docs/art/thumbnail-64-r8.png`為白／海藍雙底64px自審，不宣稱真人辨識；沿用R7人物三視圖，新增車窗只是靜態教學插畫，沒有冒稱新的骨架或動作循環。分車仍使用真正雙姿勢與700ms通道行走，減少動態立即入座。

本次唯讀比對裂潮R80夜帆紫／銅卡框與陽光農場R88奶油紙／紅格布像素；本作保留海藍交通路牌、橘色登車票、黃帽石虎與明亮海岸繪本。完整色票、字型層級、UI與圖示規格在 `docs/art/ART_DIRECTION.md`。事前嚴格自審在 `ART_REVIEW_R8.md`，繁中文案mode2事後紀錄在 `COPY_REVIEW_R8.md`。

## 十分鐘玩法與手感

已實際試玩 **606.8秒**，時間軸、失敗嘗試與觀察在 `docs/PLAYTEST_DEEP_R1.md`、`docs/evidence/deep-r1/playtest.json`。成人技術試玩涵蓋裝滿、分車、錯答、結算、汽車、空中找星與重玩、火車操作和返回接續；不是幼兒留存研究。

三項留存修正：移車動畫與算式／下一步同步，增減與移動沿用tap音效、滿員明示下一步；幼兒自動巡航調節在65公里／時附近，保留手動油門煞車；飛行常駐找到X／6和離地格，獎勵消失後仍知道進度。沒有擴建系統或提高獎勵數字。所有模式共用按下回饋、既有tap音色與靜音設定；家長設定、減少動態與原流程保留。

## 最終工程驗證

| 項目 | 狀態與讀回 |
|---|---|
| npm test | VERIFIED：164／164，既有測試與斷言未修改，新增2項速度／離地語意測試；`docs/evidence/deep-r1/unit-tests.txt` |
| npm run build | VERIFIED：8個既有車輛表面守門、Vite與本機precache；`build.txt` |
| npm run test:merge（5286） | VERIFIED：11尺寸、132檢查、25截圖，0 runtime errors／外部請求；`merge/merge-path.json`、`merge-test.txt` |
| npm run test:store（5113） | VERIFIED：12尺寸、101檢查、26實際截圖，冷開、觀察課、離線三交通、重開與保存／無法保存處理通過；`store/review-path.json`、`store-test.txt` |
| 既有美術／手機／車體／飛行守門 | VERIFIED：七支既有runner斷言原封不動；125美術情境、12車體視口、3手機無鍵盤設定、100手機情境／638控制、28飛行版面；`regressions.json`與逐支log |
| 新五項美術驗收 | VERIFIED：七個不同階段×兩裝置，動畫中禁止跳步、前4後1、自然得星、真起飛、固定暫停、學生證可開關接續、新Logo與安全教練實載；`acceptance-r8.json` |
| 原生來源包／政策 | VERIFIED：6個Python政策測試、28個包裝檢查；184本機資源、56,477,514 bytes（53.86 MiB）；`native-policy.txt`、`native-package.txt`、`native-bundle-manifest.json`。沒有簽章或實機驗證 |
| p95三跑中位 | EXECUTED：12組均16.7～16.8ms、≤18ms；`performance.json`。並發載量測，僅供參考；rAF間隔不等於CPU／GPU或原生實機frame time |
| 首次載入 | EXECUTED：localhost冷開首頁，手機／iPad [214, 104]ms；首次進汽車完整導覽至可出發 [1712, 593]ms，真實UI未限速；`acceptance-r8.json`。不代表手機網路下載或原生啟動時間 |
| Web／包體 | VERIFIED：Web（不含downloads）70,431,271 bytes（67.17 MiB），新圖增加2,246,041 bytes；來源母版與報告不進runtime |
| 版本／來源／秘密 | VERIFIED：2.12.0／build8、正式來源舊版號0殘留、687文字檔掃描0命中、圖片／Web／native hash一致、0新增依賴、原GLB未改、既有授權保留；`release-proof.json`。歷史報告仍保留其當時版號 |

上述相對證據名稱均位於 `docs/evidence/deep-r1/`。第一次手機控制檢查抓到火車橫向暫停遮擋，已調整操作列並重跑638控制全綠；375×667飛行選單也補中高度版型，28項版面全綠。沒有刪除測試或放寬斷言，歷史runner只改本次輸出目錄。標準歷史證據保持原版；本輪結果獨立保留。

## Apple 4.3與未驗證邊界

**Apple 4.3風險：中。** 黃帽石虎、海藍路牌、橘色登車票與海岸三種交通已形成差異，本輪收掉重複圖、狀態矛盾與危險乘車示範；同帳號歷史退件與原有內容關係仍需負責人判斷。這是基於本地畫面的產品風險評估，沒有冒稱Apple接受或本次政策核驗。

BLOCKED／未驗證：新版獨立9分、3～8歲親子試玩、三人64px辨識與跨款盲測、原生iPhone／iPad／Android及WebKit、簽章包、閒置實機正式效能。既有音樂權利與內容提供者／提交關係未因美術修正自動補證。本輪只交付可審查的本機程式、資源包與Web證據，沒有把這些缺口寫成已完成。
