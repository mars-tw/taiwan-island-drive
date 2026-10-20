# 島嶼交通學院：新內容第21輪

VERIFIED：本機實作、清理後回歸及原圖核對完成；真人驗收與獨立評分另列BLOCKED。工單日期2026-10-18，執行2026-10-20；限定 `r1-fun-polish`，基準 `99becd2`，版本 **2.33.0／來源build29**。

共同入口：**首頁「海岸實作課」→選課程車票→「一起出發」**。新增兩項操作機制，並修正原三課；沒有另開通用任務或養成頁。

| 課程 | 做了什麼、怎麼玩 |
|---|---|
| 把蛋糕平穩送到 | 新增主動扶正。放開行車鍵後，按住「向左扶／向右扶」讓蛋糕往中央回來；扶錯或放開只會停住，不扣分。行車與扶正分成不同圖示及名稱。保留上坡看牌轉彎、第二站左右連彎、第三站臨停再起步；移除車外無說明虛線。 |
| 路口停看等 | 第一站左→右、第二站右→左、第三站左→右→左。可觀察實際來車與車聲提示，按錯仍可再選；過街中可繼續看左右。只留「已到對岸 X/3 人」，站名另列；小朋友1／腳踏車2／奶奶3全程不變。朋友落到空位才增加人數，路口未清空按出發會說明原因。 |
| 形狀車票，找對月台 | 三站皆需形狀與顏色同時符合，正確月台逐站換位置。新增按住「陪著上車」、放開暫停的照顧互動；候車者保留本體。生成黃黑邊登車踏階，手機可見完整階面與「踏階」標籤，先收階、再關門、再出發。結算寫「三位都坐好了」，不把重複上車次數寫成人數。 |

## Muse五項清單逐項驗收

下列相對路徑均位於 `docs/content/r21/`。手機為390×844無頭瀏覽器原尺寸，不縮放、不拼貼、不加驗收文字。`acceptance.json` 與 `browser.json` 記錄操作、狀態與原圖SHA。

| 要求 | 原尺寸截圖與結果 |
|---|---|
| ①可操作回穩 | `phone-cake-stage-2-recovery-1.png` → `recovery-2.png` → `recovery-3.png`。按住扶正造成回中央%連續上升，方向鍵可用；測試另確認放開與按錯時位置不變。`phone-cake-wrong-recovery.png` 為可恢復的錯向回饋，沒有「等待回穩」灰鈕。 |
| ②踏階可辨 | `phone-tickets-stage-3-step-out.png`／`phone-tickets-stage-3-step-in.png`：同站、同車門、三人都坐好；階面與標籤一起消失後才可關門。原尺寸階面高46px，階面及標籤區差異3798px，見acceptance。**真人三秒盲看為BLOCKED**，需不知答案的參與者；未以像素差代替真人結果。 |
| ③單一主進度 | 蛋糕只留狀態字＋一條「回中央」量表；路口只留一個X/3。見上述三格與 `phone-crossing-stage-2-right-first.png`。`phone-crossing-stage-3-arrived-3.png` 顯示3/3且出發可用。**真人隨機抽圖解讀為BLOCKED**，需參與者。 |
| ④決策不預亮答案 | `phone-cake-stage-2-wrong.png`、`phone-crossing-stage-2-wrong-depart.png`、`phone-tickets-stage-2-wrong.png`。決策時行車四鈕、路口四鈕／三個月台皆能選；按住才亮黃，按錯有短句及可重選回饋。開門仍遵守停穩與配對的安全條件。 |
| ⑤三站有不同判斷 | 蛋糕第二站錯向與回穩三格／`phone-cake-stage-3-bay.png`；路口第二站 `right-first`／第三站 `recheck`；車票 `phone-tickets-stage-2-decision.png`／`stage-3-decision.png`。三站完整流程、固定人物編號、不同觀察順序與月台答案位置由公開UI操作驗證。 |

精選 **15張、每課5張** 在 `docs/content/r21/review-set/`，含每課第二、第三站及遊玩中畫面：01錯向、02～04扶正三格、05臨停；06第二站右先看、07第三站回看、08～10同一位3號奶奶連續過街；11～12兩站配對決策、13按住陪上車、14～15踏階伸出／收回。`review-set-manifest.json` 逐張列用途、原圖與SHA。其他證據未放進精選，不聲稱審查員已看過。

補充原圖：三課各有 `phone-<課程>-complete.png`／`saved.png`；每站出發或送達三格、第二三站錯選、踏階與關門全留本輪。`offline/` 為斷網後三課實玩完成及重載；`layout/` 為手機直橫、iPad及矮筆電；`negative/` 為休息、取消觸控、減少動態與無法儲存。`before-*.png` 取自基準Git原圖，`after-*.png` 為本輪原圖；比較UI修正，未冒稱同一站逐像素對照。

新增商店圖：`docs/store/screenshots/content-r21/tickets-escort-1290x2796.png`、`tickets-escort-2064x2752.png`，以實際DPR直接擷取陪乘客上車。既有商店截圖全部保留。

## 測試、美術與清理

VERIFIED：單元262項、build、R21公開UI56項、負向4項、整合132項、商店101項全部通過；234張原尺寸證據與15張精選逐檔核對。結果見 `release-proof.json`。固定命令為 `npm test`、`npm run build`、`npm run test:merge`（5286）、`npm run test:store`（5113）；另跑R21公開UI全流程、離線、24組裝置／課程、負向測試及RAF量測。原有41份測試檔以基準Git blob核對完全相同，未刪改或放寬斷言。歷史各輪的情境腳本保留供追溯，本輪新規格由R21情境驗證，不宣稱舊版灰鈕規格仍適用。

效能依既有R20相同D3D11參數、三視口×三課、每組三次2秒實際RAF，九組p95中位均 **16.7ms**，在18ms內；見 `performance.json`。預設無頭渲染的另一次量測，桌機為33.3～33.4ms、手機直橫16.7～16.8ms，未過桌機門檻，完整保留於 `performance-default-renderer.json`。通過結論只限既有D3D量測配置；並發載參考不代表乾淨機、原生或所有渲染路徑都過關。

Playwright使用本機既有npm快取1.61.1及其Chromium，不新增依賴。工單給定的storm-apocalypse模組路徑不存在，改以 `PLAYWRIGHT_MODULE=C:\Users\digimkt\AppData\Local\npm-cache\_npx\e41f203b7505f1fb\node_modules\playwright\index.mjs` 執行。原node_modules缺Vite命令捷徑，已用 `npm rebuild vite --ignore-scripts` 修復，lock只有版本變更。全程一個preview、單一無頭瀏覽器，用完關閉。

新增美術 **1次生成／1個設計／1個runtime WebP**，實際工具 `image_gen.imagegen`，模型slug未揭露，記null。原圖、既有完整風格前綴、提示、透明像素、64px檢視與SHA在 `art/`；Sharp只裁透明邊與編碼，沒有程序畫美術或占用本機GPU產圖。其他角色、場景、車輛沿用受管原畫；未宣稱新骨架、3D物理或新角色。

清理已EXECUTED：刪除 **121檔／122,882,091 bytes（117.19 MiB）**，包含R20舊review-set、重複裝置及舊整合／商店演練副本。刪前確認絕對repo範圍、追蹤狀態、未修改及SHA。另保留5154個舊媒體：5070個歷史驗證器讀取／雜湊的輸入、30個具名或模板引用、54個生成來源／美術契約；`cleanup-result.json` 逐檔列原因及讀取來源。保留全部Markdown、現行商店圖與既有未追蹤檔；清理後重跑測試。

繁中文案mode 2直接套用：原「等待回穩」會讓人只能等，改「向左扶／向右扶」與情境提示；原「傾斜程度＋回中央」改成一條回中央量表；原「全程9位坐好」改「三位都坐好了」，避免把上車事件當人數。保留課程名稱、角色姓名與受管事實。

## 風險與缺件

Apple 4.3風險：**中（本專案自評）**。交通照顧、停看與雙線索車票維持本作識別，兩項主動機制拉開操作；仍共用三站與課程外框。依2026-10-20查閱的[Apple官方4.3](https://developer.apple.com/app-store/review/guidelines/#spam)，相近版本及缺少可辨差異的App仍有風險；此為依本作內容的推論，不是Apple審核結果。

BLOCKED：實體iPhone／iPad觸控與原生語音需裝置；親子試玩、三秒踏階盲看及隨機抽圖解讀需參與者；乾淨機效能需獨占硬體；Muse≥8需獨立複評。並發載p95僅供參考。原生簽章包未重建；本輪交付Web與原生來源版本。只做本機commit，未push、部署、操作商店、傳訊或外部派工。
