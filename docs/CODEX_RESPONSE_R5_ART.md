# R5 美術第二輪交付

2026-10-16。版本 **2.9.0／原生來源build 5**，分支 **r1-fun-polish**。本機美術與回歸逐項驗證；沒有push、部署、操作商店、外部派工、發訊息、可見視窗或讀取 `.secrets`。原有未追蹤的 `ART_RESCORE_MUSE.md` 保留。

## 最大三項改變

1. 首頁灰棚車模圖換成單輛、同視角、同光源的繪本三車登車票。只保留一顆橘色主線行動；學生證加入阿路與實際星數。進入課程仍是真正Blender模型與原物理。
2. 火車幼兒課拔除深色駕駛艙遮擋，使用明亮海島天空、紙白速度圓表與下一站站牌。中文儀表、綠旗阿路與流程黃燈接回同一學院；保留原六個控制，以三個主鈕與輔助列分層，兒童命中維持60px。
3. 數學課加入全身朋友、兩張不同肢體姿勢、700ms上車／跨車、650ms脫鉤，並拆成排隊、大加法牌、問號翻牌與雙獎章票。結算列車短演出、兩姿勢阿路揮旗，各站台詞不同，減少動態時關閉上述動畫。

## Muse五項逐一回應

| 複審要求 | 狀態／落地與尚缺 |
|---|---|
| 1 整張重做駕駛課 | VERIFIED：深色英文儀表移除，家長駕駛艙也改中文紙白；兩個大讀數、速度52px、流程突出下一鈕，安全煞車改白底加蓋邊，真3D視野保留。部分EXECUTED：新海島天空只是遠景，原低多邊形近景未重製；390手機場景面積約59%，商店手機約63%、iPad約79%，小橫向與SE優先保留60px控制，沒有假稱所有尺寸都達60%。 |
| 2 三輛車插畫與真學生證 | VERIFIED：汽車僅一輛，三車同3/4視角、左上45度光與墨藍輪廓；64px雙底色讀圖。學生證顯示角色、學員稱呼與目前星數；主線仍顯示章節紀錄。 |
| 3 全身乘客真的移動 | VERIFIED：六位乘客各兩姿勢，700ms位置補間配合姿勢切換；保留總量守恆、錯答與存檔判定。新車廂有低窗台剖面、車門、車頂色帶、連結器；脫鉤後後車退開掛「留在海風站」。這是兩幀短動作，不冒稱完整骨架／多方向步行循環。 |
| 4 三站差異與結算 | VERIFIED：裝滿看排隊／上車數，分車看大加法牌，算剩下看問號牌與留站車。結算使用完整課程舞台、列車與雙獎章票，兩算法分區；阿路每站不同提示，慶祝短於2秒且可直接按下一步離開。手機算式與車標重疊已修正。 |
| 5 鎖定商標與盲測 | VERIFIED：全遊戲新教練／Logo／Web圖示統一黃帽石虎、橘背心、藍吊帶褲、調度旗；64px實際輸出與自審完成。BLOCKED：三位陌生玩家縮圖辨識、五人跨款盲測未做；沒有拿自審充當真人結果。 |

**8分目標尚未獨立重評。** 本輪不能把程式測試或自身評分寫成Meta Muse已給8分；新獨立評分與真人反應保留待驗。

## 新素材、後製與授權

十次實際生成／編修，**28個runtime檔、27個不同圖面**。工具 **`image_gen.imagegen`**；沒有回傳可確認的模型slug，manifest如實寫 `null` 與工具名。沒有把預定模型名稱當作證據。

| 新素材 | 數量／實際接入 |
|---|---|
| 月台背景、海島天空 | 2個WebP；數學背景、火車即時世界的裝飾遠景 |
| 同視角汽車／列車／飛機 | 3個RGBA PNG；首頁選課票、導覽及結算 |
| 阿路持旗／舉旗 | 2個RGBA PNG；首頁、教練、學生證與結算 |
| 六位全身乘客 × 兩姿勢 | 12個RGBA PNG；排隊、上車、跨車與留站 |
| 藍／橘剖面車廂 | 2個RGBA PNG；數學兩車，第一版與修訂原畫均留存 |
| 票券、星章、旗、站牌 | 4個RGBA PNG；雙算法獎章、導覽、當前站與下一站 |
| 標題Logo、App圖示 | 1個Logo、同一圖示192／512兩檔；Web已接入，原生catalog仍為提案 |

`PROMPTS.json`連結完整本輪紀錄；`PROMPTS_R5.json`保留每次確切提示、來源與工具名。`source/r5/`保存原畫、原alpha遮罩與opaque master；`asset-manifest-r5.json`列尺寸、hash、後製與每位角色雙閘。`CREDITS.md`新增R5，原第三方模型、音樂、字型、Apache-2.0／CC BY 4.0教材與完整NOTICE保留。

後製為native alpha清理、透明RGB清零、裁切、LANCZOS縮圖；背景以WebP q84壓縮，人物保留RGBA PNG。不以方塊、純色或emoji代替新美術。runtime新圖約 **2.90 MiB**；原畫、mask、截圖屬文件，不進遊戲payload。沒有新依賴、外連或SDK。14個角色姿勢通過亮度0.30～0.75、近黑<35%、平均飽和≥0.32、低飽和<20%；兩幀差分只證明圖面不同，不能取代動作審美判斷。

## 前後對照與商店截圖

- `docs/art/ART_REVIEW_R5.md`：施工前四尺寸嚴格自審；R4方向與兩份Muse皆讀入。
- `docs/art/compare/r5-before/`、`r5-after/`：同尺寸首頁／數學／學生證／觀察課／汽車／火車／飛機，22組配對及hash。
- `docs/art/compare/R5-before-after.jpg`、`pairs-r5.json`：七畫面縮覽與原圖索引。
- `docs/art/evidence/r5/`：三站、獎章與火車的多尺寸實載；`visual-r5.json`另存700ms動作位置／兩姿勢與減少動態結果。
- `docs/store/screenshots/art-r5/`：1290×2796、2064×2752各7張；每裝置推薦6張、分車圖保留為額外證據，避免連排重複數學頁。`SELECTED.json`與manifest保留尺寸／hash。

全部截圖均為未合成的本機無頭Chromium **Web實載**，不是iOS／iPadOS原生實機證據。三視口證據另由原merge runner寫入 `docs/evidence/merge/`。

## 驗證

| 檢查 | 狀態與證據 |
|---|---|
| npm test | VERIFIED：162／162，原測試與斷言未改；`art/unit-tests-r5.txt` |
| npm run build | VERIFIED：原8個車模表面檢查、Vite、124個precache本機檔；`art/build-r5.txt` |
| npm run test:merge，5286 | VERIFIED：11尺寸、132項、25圖、零執行錯誤／外部請求；`art/merge-test-r5.txt` |
| 原mobile | VERIFIED：100情境、578控制、零執行錯誤／外部請求；`art/mobile-test-r5.txt` |
| 原reachability | VERIFIED：3視口×7情境，主要控制全可達；`art/reachability-test-r5.txt` |
| 新美術實載 | VERIFIED：10尺寸＋減少動態、70張實拍；角色至少40×60px且完整位於控制列上方、答案≥60px且同色、兩姿勢完整載入、700ms實際位置採樣；`art/visual-test-r5.txt`、`art/visual-r5.json` |
| npm run test:store，5113 | VERIFIED：12尺寸、101檢查、26張未合成截圖，含離線安裝快取重開、家長閘、保存／恢復；零執行錯誤／外部請求；`art/store-test-r5.txt`、`art/store-evidence-r5/review-path.json` |
| 資產／配對／縮圖 | VERIFIED：28檔、24個RGBA透明圖、14個角色姿勢雙閘、來源與交付hash、22組配對、14張指定商店尺寸；`art/asset-verification-r5.json`、`art/thumbnail-64-r5.png` |
| 原生截圖政策Python | VERIFIED：6／6，只有政策測試，非原生實機；`art/python-tests-r5.txt` |
| 配色與來源 | VERIFIED：內文11.49:1、橘鈕4.95:1；版本同步、原測試未改、指定秘密格式零命中；`art/contrast-r5.json`、`art/source-audit-r5.json` |
| p95三跑 | EXECUTED：12組（三種視口×四模式）三跑中位16.7～16.8ms；`art/frame-times-r5.txt`、`art/performance-r5.json`。並發載、Intel ANGLE、60Hz無頭rAF間隔，每跑約2秒，僅供參考，不能當CPU／GPU frame time或原生出貨證明；最後SE320內距修補不適用於這三個量測視口。 |

## Apple4.3與缺件

**風險：中。** 本作的綠旗石虎、海岸交通票、可操作拆合數學與三交通主線已明顯區別於唯讀比對的夜海銅卡框／暖像素農場；但美術不同不能單獨消除同帳號與產品內容相似的審查風險。[Apple 4.3官方條款](https://developer.apple.com/app-store/review/guidelines/#spam)仍要求避免同一App多個Bundle ID及難以區別的產品。本判斷是本線風險推論，沒有操作App Store Connect或宣稱Apple接受。

BLOCKED／未完成：新版獨立8分重評、真人縮圖／跨款盲測／親子試玩，原生裝置與WebKit、新簽章包／原生圖示catalog、乾淨機況／實機效能、全3D紙雕近景與完整多方向人物動畫。小尺寸為保留全部60px既有控制，未達Muse建議60%場景比例；沒有放寬測試隱藏控制。R4既有音樂權利與內容提供者／直接提交關係缺件仍由負責人補證。本輪只本機commit。
