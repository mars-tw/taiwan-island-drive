# 新內容第32輪交付

VERIFIED：工單2026-10-18，本機2026-10-21。分支 `r1-fun-polish`，版本 **2.44.0／原生來源build40**。本輪修既有三課，沒有增加廣告、內購、帳號、外部連結、第三方SDK或線上功能。MIT、免費、離線；全程背景／無頭，僅本機commit。

## 三課入口與玩法

共同入口：**首頁 → 海岸實作課 → 選課 → 選站 → 自己試試**；原「一起出發」保留引導。三課均保留玩家決定與安全邏輯，不會自動代做答案。R31的單一狀態投影保留：文字、車輛、蛋糕、觀察窗共用每幀物件。

**把蛋糕平穩送到**：自主模式不亮正解鍵。玩家自己選何時煞車、扶哪邊與扶多久；扶錯會更斜，延後煞車會滑向托盤邊，煞車＋反向扶可以救回100%。車與蛋糕保持中央安全構圖，特寫可收起，主蛋糕與針錶仍同步。休息灣入灣、停妥、離灣、主路均有實際位置變化；道路原畫、標線隨距離移動。重玩反向道路與車位共用 `roadPicture`，預覽用相同原畫。

**路口停看等**：玩家可試著提早出發，收到具體原因並留在原處；安全條件不放寬。三名朋友各有未過、斑馬線上、到岸原圖。來車有接近、通過、離開，遇朋友過街在線前停讓，主場景與左右道路縮圖同源。新車只使該側確認失效，另一側保留；車過後仍須自己重看。合併重複提示，畫面只留一處主要句子；主車出發有較明顯距離。

**形狀車票，找對月台**：形狀、顏色分成兩行大圖示，錯誤只說明原因，不亮出正解。選站時列車可見。開門後當前朋友在選取前就有亮框與具名邀請，其他人變淡。新增車廂剖面近景：同一朋友69%在門檻、86%在車廂走道，最後走到座位坐下才+1。放開700ms位置不變，再按接續。三人持同站同款票，不宣稱不同目的地；不同站與重玩會換票色。

## Muse唯一五項驗收與原尺寸路徑

所有 `phone-*.png` 為390×844直接截圖，未縮放或拼貼。下列是完整證據；精選每課五張的取捨另列。

| 驗收 | 原尺寸證據與驗證 |
| --- | --- |
| 1 真正判斷與救回 | `docs/content/r32/phone-cake-before-wrong.png` → `phone-cake-wrong-support.png` → `phone-cake-late-brake-edge.png` → `phone-cake-rescued.png`。正常觸控，錯扶使傾角增加，繼續行駛滑到托盤邊，再減速反向扶回100%。全程來自同一狀態，沒有注入模型數值。 |
| 2 構圖與休息灣路程 | `docs/content/r32/phone-cake-bay-parked.png` → `phone-cake-bay-leaving.png` → `phone-cake-bay-main-road.png`。瀏覽器斷言主車與屋頂蛋糕完整位於道路視窗；特寫收起後仍看得見方向。三站完成另為 `phone-cake-stage-N-finished.png`。 |
| 3 行人與來車走完 | `docs/content/r32/phone-crossing-N-WHO-before.png` → `on-zebra.png` → `arrived.png`；N=1、2、3，WHO=child、bike、grandma，共27張。來車各站 `phone-crossing-stage-N-car-approach.png` → `car-passing.png` → `car-leaving.png` → `car-left.png`。新車 `new-car-yields.png` → `clear-needs-recheck.png` → `ready.png`；錯誤出發 `unsafe-start.png`。重複主要句子0筆。 |
| 4 形色與上客位置 | `docs/content/r32/phone-tickets-stage-N-wrong-shape.png`、`wrong-color.png`；同人連拍 `threshold-0.png`（69%、0/3）→ `aisle-0.png`（86%、0/3）→ `seated-1.png`（坐下、1/3）。每站三位具名邀請 `invitation-0.png`／`invitation-1.png`／`invitation-2.png`。放開700ms位置與進度逐值相等。 |
| 5 重玩實際不同 | 三課各有 `docs/content/r32/phone-KIND-opening.png`、`phone-KIND-replay-opening.png`、`phone-KIND-replay-new-conditions.png`，KIND=cake／crossing／tickets。原seed0、新seed1，蛋糕道路反向、來車換邊、票面換色；預覽與實玩共用資料。道路圖54px，小視口36px；車與方向圖示至少36px，車頭方向一致。 |

## 精選、商店、美術

`docs/content/r32/review-set/` 僅 **15張手機直式原尺寸圖，每課5張**，排序01～15。蛋糕三格錯扶／滑移／救回，另兩張灣內與主路；路口三格同一朋友未過／線上／到岸，另兩張淨空待重看／確認完成；車票色錯、具名邀請與門檻／走道／入座。離灣中間格、另外兩位行人及來車全程均保留在完整證據，沒有宣稱15張能涵蓋全部狀態。逐位元副本來源與SHA在 `review-set.json`。

商店新增：`docs/store/screenshots/content-r32/cabin-aisle-1290x2796.png`、`cabin-aisle-2064x2752.png`。430×932／DPR3、1032×1376／DPR2直接實玩截圖；既有商店圖全部保留。

新增美術 **1張、1次 `image_gen.imagegen`**：車廂門檻、木地板走道、三席剖面。完整沿用既有風格前綴。原尺寸PNG與提示在 `docs/content/r32/art/`；執行WebP在 `public/art/content-r32/train-cabin.webp`，Sharp只轉格式。`art-manifest.json`列來源SHA及未揭露的模型slug（null）。蛋糕、角色姿勢、來車、道路沿用受管原畫；箭頭、比對、停止線屬交通介面，未用方塊或emoji代替美術。蛋糕是2D受力形變，人物是既有雙姿勢移動，未冒稱真3D物理或新骨架動畫。

## 測試、清理與限制

VERIFIED：`npm test` **326／326**、`npm run build`、5286 `npm run test:merge` **132項**、5113 `npm run test:store` **101項**全部通過。R32五組無頭驗證all／layout／offline／store／performance皆通過，340張來源原圖SHA、每組程式來源雜湊、三課完成及精確存檔重載、15張逐位元精選與商店尺寸由 `release-verification.json` 回讀核對。52個既有測試檔內容與HEAD一致，並保留原有Windows換行，沒有刪測試或放寬斷言；99個接手前未追蹤檔保留。

八視口：320×568、568×320、390×844、844×390、768×1024、1024×768、1366×600、1280×640。控制≥60px、文字裁切0、手機鍵盤說明0、外部請求與執行錯誤0。正常與斷網重載後皆實玩完成九站，原圖分別在根目錄與 `offline/`。此外單元獨立驗證無錯向扶持、只持續高速過彎不煞車也會滑至托盤邊，並能減速扶回；不是兩個錯誤共用同一觸發條件。

並發載工作站參考效能：390×844、768×1024、1366×600各三跑180幀RAF，p95中位 **16.7／16.8／16.8ms**，≤18ms。個別樣本p95曾33.3ms，完整各跑資料在 `performance/performance.json`；沒有宣稱每一跑或實機均達標。秘密掃描0命中。最終指定測試皆在33個舊媒體刪除後執行；瀏覽器與兩個preview收尾關閉。

EXECUTED：清除 **33個**乾淨已追蹤的舊截圖，釋出 **14,104,397 bytes（13.45 MiB）**，含R31全部15張review-set；未改Git歷史。清冊與根目錄／分支／SHA檢查在 `cleanup-plan.json`／`cleanup-result.json`。保留9152個舊媒體：86個原畫／美術契約、9007個歷史manifest雜湊讀取的媒體、59個驗證腳本明確輸入；逐檔有reason與readers。各輪Markdown、審查意見與接手前99個未追蹤檔保留。並非宣稱清空所有歷史媒體。刪後重跑全部指定測試。

Apple4.3風險：**中**。可恢復的易倒物運送、路況改變使親看失效、形色配對與實際陪同進車廂，保留交通生活特色；共用學院／三站選課外框仍可能有陣容相似感。這是本機設計評估，並非Apple審核結論。

BLOCKED：實體iPhone／iPad觸控及原生語音需裝置；真人親子、三位成人辨讀與遮字理解需參與者；乾淨機效能需獨占硬體；Muse≥8需獨立複審。沒有假造試玩、實機結果或評分，沒有原生簽章包，沒有push、部署、商店操作、對外訊息或服務派工。

文案mode2：原「向左扶／向右扶」逐步答案，自主模式改「看蛋糕歪哪邊，自己扶」，保留引導模式；原上下同句路口提醒，合併成一處；原「邀他上車」改具名「邀小晴上車」；原「進走道」文字標籤改成真正車廂位置；原小箭頭重玩卡改受管道路原畫與至少36px來車／票面。原因皆為降低閱讀量、避免代名詞或空間宣告與畫面不符；課名、角色名與保存識別不變。
