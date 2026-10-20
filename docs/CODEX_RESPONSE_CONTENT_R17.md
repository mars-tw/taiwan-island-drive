# 新內容第17輪：修正路口空間與上車比例

VERIFIED：本機修正、指定回歸與證據驗證完成。工單2026-10-18，執行2026-10-19；只在 `r1-fun-polish`，版本 **2.29.0／來源build25**。已讀R15／R16的Muse、GPT、Claude六份審查。只修既有三課，沒有新增課程。

## 三課做了什麼、怎麼玩、入口

共同入口：**首頁「海岸實作課」→課程車票→「一起出發」**。

- **把蛋糕平穩送到**：維持踏板起步、自己判斷左右彎、放開回穩與臨停再起步。按住是實心黃與下沉邊，建議下一步是白底外框及短標；持續過久到盤緣則緩停、顯示有色的等待回穩。車頭依轉向讀值偏轉，車頂與特寫使用同一份蛋糕角度。重玩互換彎向，沿用第一輪方向會溫和停下並提示方向相反。
- **路口停看等**：停在線後，先看左再看右，等來車離開與朋友到岸，再自己出發。新背景畫出橫向車道及人行區，來車只在橫向路面移動。三站只顯示同一張阿路安全駕駛車，不再疊背面藍車。觀察圈對準來車或空車道入口，虛線終點在圈內；過街時一起收起。三站保留不同先後、出發側與車流；朋友分開等候，對岸依空位停好。重玩互換來車方向，安全的先左後右順序保留。先看右會在右鍵留下「剛才先按」與橘框，字幕指出剛才的動作。
- **形狀車票，找對月台**：先看形狀及顏色、點牌、前進停穩，再開門、點朋友並邀請。列車全程同尺寸比例，候車人物保持固定三個起點，錯站不擠到車身；人物圖像低於門高，互動容器仍至少60px。朋友走向車門，入門時逐漸被門框範圍遮擋；全畫面只有同三個身份，沒有重複人物放大窗。三人坐好後仍由玩家收踏階、關門及前進。錯選牌有外框與「你選的」小籤，正確牌不提前提示；重玩換形色組合與位置。

三課仍使用既有2D受力、路徑及雙姿勢，沒有宣稱新骨架、真實3D奶油物理或新增揮手循環。遊玩端未新增廣告、付費、帳號、外連、第三方SDK、線上功能、暴力、淘汰或計時懲罰。

## Muse R16 五項驗收與原尺寸證據

手機原圖390×844，以下以repo為根。完整狀態、幾何與SHA在 `docs/content/r17/acceptance.json`、`screenshots.json`。

| 審查項目 | 實作與原尺寸路徑 |
| --- | --- |
| 1．按住與下一步分態 | 同站 `docs/content/r17/phone-cake-stage-2-wrong-turn.png` → `phone-cake-stage-2-left-half-second.png` → `phone-cake-stage-2-left-recovered.png`。按住0.5秒實心黃；放開回穩白底下一步。盤緣回歸：`phone-cake-tray-edge-sliding.png` → `phone-cake-tray-edge-stopped.png` → `phone-cake-tray-edge-recovered.png`。 |
| 2．觀察圈有明確道路目標 | 第一站 `phone-crossing-stage-1-child-look-left.png`／`look-right.png`；第二站 `phone-crossing-stage-2-grandma-look-left.png`／`look-right.png`；第三站 `phone-crossing-stage-3-bike-look-left.png`／`look-right.png`，皆在 `docs/content/r17/`。每站另有 `phone-crossing-stage-N-traffic.png` 及 `traffic-moving-1.png` → `traffic-moving-2.png` → `traffic-moving-3.png`。車道高度、車與人物零重疊、觀察圈不切名牌由瀏覽器幾何斷言驗證。**遮字幕請真人說出方向與目標仍BLOCKED，需要參與者。** |
| 3．消除重複小安 | 三站各有 `docs/content/r17/phone-tickets-stage-N-chosen.png` → `boarding-1-2.png` → `seated-1.png`。圖內唯一身份與月台／車內計數同步；跨門檻前另有 `boarding-1-1.png`。移除人物放大窗，保留主場景三人。 |
| 4．畫面指出剛才錯選／錯序 | `docs/content/r17/phone-tickets-stage-1-wrong.png` 的牌面外框與「你選的」；`phone-crossing-wrong-side.png` 的右鍵痕跡與具體字幕。兩者都能修正且不淘汰。 |
| 5．重玩換題 | 蛋糕 `phone-cake-first-bend.png` → `phone-cake-replay-bend.png` → `phone-cake-replay-old-direction.png`；路口 `phone-crossing-stage-1-child-look-left.png` → `phone-crossing-replay-traffic.png`；車票 `phone-tickets-unselected.png` → `phone-tickets-replay-layout.png` → `phone-tickets-replay-old-position.png`，皆在 `docs/content/r17/`。蛋糕舊方向不增加路程、車票舊欄位給形色差異且門不能開。 |

本線路五項問題的對照：橫向道路、只在車道上的來車及圈位見上表第2項；三站同一玩家車見 `phone-crossing-stage-1-start.png`、stage-2、stage-3及各站過街圖；車票同一列車比例與門邊上車見第3項、`phone-tickets-stage-1-wrong.png`、`phone-tickets-saved-result.png`。門高約為人物圖像高度1.25倍；縮小的是圖像，觸控容器仍有60px。

`docs/content/r17/review-set/` **恰15張原尺寸圖，每課5張**：01～05蛋糕錯向、按住、回穩、盤緣與重玩；06～10路口三站觀察與奶奶連續過街；11～15車票錯選、點人、入門、入座及重載結尾。每張是原圖逐位元複製，無拼圖、縮圖或假UI。索引為 `review-guide.md`。15張優先證明本線路五項問題；完整三站左右各兩格、九次過街、收階關門、全部重玩對照及八視口原圖另列補充，不宣稱審查員看過。

## 測試、美術與舊證據清理

- `npm test`：**242／242**。原237項保留，新增5項；基準 `4af0b7f` 的37個既有測試檔逐檔比對相同，未刪除或放寬斷言。
- `npm run build`：通過，離線預載238個本機檔案。六個版本來源均為2.29.0／build25，舊版號只留歷史文件與腳本；沒有新依賴。
- 本輪無頭UI **228項檢查、428張原尺寸內容圖**：三課三站通關、保存重載、可修正錯誤、蛋糕盤緣緩停與臨停再起步、九次左右觀察及到岸計數、九次邀請入座、收踏階／關門／駛離、重玩換題均通過。全課完成後另針對路口站位修正重跑三站、八視口及離線路口，人物、名牌互不重疊，名牌完整留在場景內；最新連拍覆蓋早先同名影像，歷史與現行SHA差異列在 `recaptures.json`，以 `screenshots.json` 為最終原圖索引。角色依次在同側等候，對岸從前方空位依序停好，避免穿過其他朋友。
- 斷網後三課全部完成並重載讀回；拒存仍可玩且有提示，休息不前進，減少動態仍可完成。只透過公開UI與Playwright clock推進RAF／計時器，未指定完成旗標、位置或製作假存檔。
- 八視口320×568、568×320、390×844、844×390、768×1024、1024×768、1366×600、1280×640：可操作按鈕至少60px、在視口內且可命中；手機沒有鍵盤說明。320×568、390×844、568×320三站另檢查標籤完整與互不重疊。
- `npm run test:merge`：**132項**；`npm run test:store`：**101項**。本輪內容與指定回歸的執行錯誤、失敗HTTP及外部請求均為0；一次只使用一個preview及一個無頭瀏覽器。
- 效能 **EXECUTED**：桌機、手機直式及手機橫式各三課、各三跑中位，最高p95 **16.8ms**，九組皆≤18ms；實際RAF量測，並發機況僅作參考，不宣稱原生裝置或獨占機況結果。
- 秘密掃描 **VERIFIED：0命中**，只讀repo文字，排除秘密目錄與symlink，不輸出命中值。完整測試與原圖SHA見 `docs/content/r17/release-proof.json`、`source-manifest.json`、`secret-scan.json`；38份既有未追蹤審查保留並以提交前後SHA核對。


新增商店截圖，既有商店圖保留：

- `docs/store/screenshots/content-r17/tickets-player-boarding-1290x2796.png`
- `docs/store/screenshots/content-r17/tickets-player-boarding-2064x2752.png`

新增美術 **1張runtime WebP／1次 `image_gen.imagegen`**，用於修正路口空間，沿用既有英文風格前綴。工具未揭露模型slug，記null。原圖、提示、SHA及64px檢查圖在 `docs/content/r17/art/`；Sharp只轉檔及產生檢查縮圖，沒有用本機GPU生成。角色、列車及聲音沿用既有來源，無新依賴。

舊證據清理 **EXECUTED：775個檔案，769,763,779 bytes（734.10 MiB）**，依工作樹刪除檔案大小計算，Git歷史保留。範圍只限受管R1～R16內容證據與 `docs/evidence/content-rN/` 舊比較圖。保留2506個影像：2431個是既有release verifier會從browser manifest讀取並核對SHA的原圖、49個美術來源、26個程式直接或以檔名樣板引用的檔案。逐檔原因、SHA與刪除收據在 `cleanup-plan.json`／`cleanup-result.json`。Markdown報告、評審、商店圖、未追蹤檔及本輪證據保留。全部指定測試在刪除後重跑；不刪舊測試、不放寬斷言。

說人話mode 2事後摘要：

| 原句 | 原因 | 改成什麼 |
| --- | --- | --- |
| 先看左邊，再看右邊 | 看不出剛才按錯哪邊 | 你先看了右邊，先看左邊喔。 |
| 這站・不對 | 場景沒有指出自己的選擇 | 你選的・不對 |
| 停下回穩＋空白條 | 幼兒容易看成歸零或壞掉 | 等待回穩＋有色等待條 |

## 風險與未完成

**Apple 4.3風險：中（執行者自評）**。三課維持交通禮讓、照顧乘客與平穩運送的具體互動，沒有換成通用模板；共用選課、三站、提示與結果外殼仍是相似性風險。參照當次讀回的 [Apple 4.3官方條文](https://developer.apple.com/app-store/review/guidelines/#spam)，這是本作風險判斷，不是Apple接受或拒絕結論。

**BLOCKED**：真人遮字幕辨向／辨目標需要參與者；實體iPhone／iPad觸控與原生語音需要裝置；親子試玩需要親子參與者；乾淨機況效能需要獨占硬體；Muse≥8需要重新審查15張精選。來源build25不代表已重建、簽章或驗證原生包。

只做本機繁中commit；沒有push、部署、操作商店、對外發訊息或透過其他服務派工。既有未追蹤審查不納入提交。驗證瀏覽器與preview於收尾關閉。
