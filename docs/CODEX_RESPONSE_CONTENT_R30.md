# 新內容第30輪交付

工單日期2026-10-18，本機執行2026-10-21。VERIFIED：版本 **2.42.0／build 38**，只在 `r1-fun-polish` 工作。三課維持原入口：首頁 → 海岸實作課 → 選課 → 大圖示選站卡。沒有增加課程。

## 三課修正與怎麼玩

**把蛋糕平穩送到**：方向盤開車、另一組雙手扶蛋糕。蛋糕歪了先減速，再往相反方向扶。回正百分比只表示顯示傾角相對直立的比例：`100 − round(abs(角度) / 28 × 100)`，0°唯一對應坐穩100%，不表示路程、分數或累積完成度。沒有扶正輸入時寫「蛋糕歪了」，正確扶正時才寫「扶正中」。同一階段函式決定站名、提示與唯一亮鍵。休息灣依序開進格子、煞停休息、坐穩出灣、離格、完全回主路，再到分享站煞停，休息灣不再寫到家。主畫面車頂蛋糕放大，傾斜尺同步顯示歪向；特寫可遮掉。

**路口停看等**：停在線前，自選何時看左右。三站皆在第一位朋友過街途中，由另一側出現新車，該側舊勾立即變成紅框重看符號。新車會在線前讓正在過街的朋友，之後通過；看錯側或車未通過都不能解除失效。車過後玩家必須親自重看，再看清兩側，三人到岸後才能出發。左右小視野在過街時持續保留，放在操作區上方，完全避開人物；窄視口收起重複站名與計數，保留實景、主要提示及雙側視野。出場路線箭頭只在真的出發時出現，不壓住待過街的朋友。灰色出發鈕旁只先指出下一個缺件。沒有催促或計時懲罰。

**形狀車票，找對月台**：朋友胸前持有大票，點朋友可切換放大的朋友票；選月台後與月台票並排，輪廓與票色各用一組圖示比對。形狀錯、顏色錯分開指出，不亮正解。停對、停穩、開門後，點朋友有描邊與「輪到」姓名，底部固定出現邀他上車。按住陪同，到門檻放開站穩，再按住進走道；下半身由車內遮擋，真正坐下才增加人數。

選站卡只留站名與短句。蛋糕用坡道、雙彎、煞車及傾斜蛋糕；路口用來車方向與三位真實角色順序；車票用大形色票。重玩以圖示「上次→這次」比較，不再塞多行小字。

## Muse唯一五項驗收與原尺寸路徑

| 審查項目 | 狀態與證據 |
| --- | --- |
| 1 狀態語言一致 | VERIFIED。`docs/content/r30/nine/`、其 `replay-1/`、`replay-2/` 各完成三站，共九次站點驗證。每站 `phone-cake-stage-N-idle.png`、`slowing.png`／`steadying.png`、`destination-braking.png`、`finished.png`；第三站另有 `bay-braking.png`、`resting.png`、`parked.png`、`leaving.png`、`main-road.png`。非休息灣站不虛構離灣狀態。每張遊玩圖自動核對0°=100%與唯一亮鍵=當前動作。 |
| 2 遮特寫仍可判讀 | VERIFIED。`docs/content/r30/phone-cake-masked-left.png`、`phone-cake-masked-right.png`、`phone-cake-masked-upright.png`，皆390×844原尺寸，由瀏覽器截圖直接遮住特寫，沒有改造遊戲圖層。人類辨識率仍待真人驗證。 |
| 3 三站確認失效 | VERIFIED。每站 `docs/content/r30/phone-crossing-stage-N-look-first.png` → `first-clear.png` → `new-car-invalidated.png`／`car-still-wait.png` → `new-car-clear-unconfirmed.png` → `look-again-confirmed.png`；另有 `wrong-side-stays-locked.png` 與 `ready.png`。N=1、2、3，每站刷新計數皆1。 |
| 4 主畫面票面比對 | VERIFIED。每站 `docs/content/r30/phone-tickets-stage-N-decision.png`、`wrong-shape.png`、`wrong-color.png`、`matched.png`、`selected-friend.png`。原圖同時保留胸前票與並排大票，錯誤畫面的輪廓／票色標記分開；沒有直接顯示答案。N=1、2、3。 |
| 5 大圖示選站與重玩 | VERIFIED。`docs/content/r30/phone-cake-select-stations.png`／`phone-cake-replay-new-conditions.png`，crossing、tickets同名替換。八視口首次卡在 `layout/device-WxH-KIND-ready.png`，真實完成後重玩卡在 `layout/device-WxH-KIND-replay.png`。遮字理解的真人測試列BLOCKED。 |

`phone-cake-stage-3-parked.png` → `leaving.png` → `main-road.png` 證明正常進出灣。`phone-cake-controlled-initial.png`、`controlled-high-support.png`、`controlled-brake-support.png` 及 `controlled-comparison.json` 記錄兩個獨立瀏覽器context、完全相同初始資料與640ms輸入；煞車加扶正的車速與傾角皆較低。

車票同人連續 `phone-tickets-stage-1-holding.png` → `paused.png` → `paused-still.png` → `aisle.png` → `seated-1.png`。放開700ms，進度與人物螢幕座標逐值相同；每站三位朋友皆完成。各課 `phone-KIND-complete.png` 與 `phone-KIND-saved.png` 核對完成與完整保存資料相同。斷網同流程在 `docs/content/r30/offline/`。

## 審查精選、美術與商店

`docs/content/r30/review-set/` **只有15張手機直式PNG**，每張390×844：01～05蛋糕、06～10路口、11～15車票，每課5張且含遊玩。連續對照包含煞車扶正、停妥到回主路、新車造成確認失效，以及門檻700ms暫停至真正入座。由原圖逐位元複製，SHA與用途在 `review-set.json`。15張優先證明核心互動；完整五項逐狀態驗收另按上表索引，未聲稱精選能容納全部狀態。

新增商店原圖：`docs/store/screenshots/content-r30/ticket-comparison-1290x2796.png`、`ticket-comparison-2064x2752.png`，由430×932／DPR3、1032×1376／DPR2瀏覽器直接輸出。所有既有商店圖保留。R29矛盾畫面與R30回主路、手機橫式、iPad原尺寸副本在 `docs/evidence/content-r30/`，來源SHA在 `before-after.json`。

新增美術 **0張、生成呼叫0次**。沿用 `docs/art/ART_DIRECTION.md`、受管蛋糕分層、人物姿勢、汽車與列車原畫；來源SHA在 `art-manifest.json`。方向、形色及傾斜尺為原生SVG教學介面符號。沒有宣稱新骨架、真3D奶油物理或新的角色動畫。

## 測試、清理與保留

VERIFIED：`npm test` **317/317**、`npm run build`、5286 `npm run test:merge` **132項**、5113 `npm run test:store` **101項**。輸出存本輪 `tests-output.txt`／`build-output.txt`／`merge-output.txt`／`store-output.txt`。既有51個測試及輔助檔SHA未變，未刪測試、未放寬斷言。全部指定測試於舊媒體清理後執行。

VERIFIED：三課九站正常UI完成與存檔讀回；蛋糕另三輪九次站點驗證；安裝快取後斷網重載再完成三課。八視口320×568、568×320、390×844、844×390、768×1024、1024×768、1366×600、1280×640，包含選站、操作、觀察、比對、按住／放開及真實完成後重玩。所有可互動控制≥60px，文字／圖示無重疊或裁切，手機無鍵盤提示；遊戲外部請求與腳本錯誤皆0。完整資料在 `browser-all.json`、`browser-cake-nine.json`、`browser-layout.json`、`offline/browser-offline.json`。

效能狀態 **VERIFIED**：三視口各三次180幀真實RAF，p95三跑中位 390×844：16.7ms、768×1024：16.8ms、1366×600：16.8ms。門檻18ms，並發載工作站量測只供參考；實體裝置與乾淨機表現未驗證。秘密掃描0命中、現行版本檔舊版號0命中；歷史報告／舊輪驗證器保留原版本契約。工單的storm-apocalypse Playwright路徑不存在，使用既有npm-cache Playwright；未安裝新套件。

EXECUTED並回讀VERIFIED：移除 **68個**已追蹤、未修改且被取代的舊媒體，工作樹檔案大小合計 **91,049,035 bytes（86.83 MiB）**，含R29全部15張舊review-set。清單、絕對範圍、SHA與逐檔結果在 `cleanup-plan.json`／`cleanup-result.json`；Git歷史未改寫。

保留舊媒體8352個：86個原畫／美術契約、8,214個仍被歷史驗證manifest讀取並核對SHA的來源、52個腳本明確輸入。每檔保留原因及manifest讀取來源均列在清冊，沒有宣稱舊證據已全數刪除。各輪Markdown、審查意見、商店圖與93個原有未追蹤檔全部保留。只明確加入本輪檔案與核定刪除清單，本機提交，沒有push、部署、商店操作、訊息或外部服務派工。

另移除本輪自行產生、已由最終驗證原圖取代的中間產物60個，合計19,582,387 bytes（18.68 MiB），清冊在 `intermediate-cleanup.json`；不含任何接手前既有未追蹤檔。最終九次站點原圖獨立保存在 `nine/`，避免重跑時覆蓋同名圖造成SHA失配。

## 未完成與風險

Apple 4.3風險：**中**。三課保有交通生活特有的平順運送、重新觀察讓行、形色辨識與陪同，沒有增加通用任務、徽章或換數值課程；共用學院與三站外框仍有相似感。這是本機設計評估，不是Apple審核結果。

BLOCKED：實體iPhone／iPad觸控、原生語音需實機；真人親子與遮字辨識需參與家庭；乾淨機效能需獨占硬體；Muse≥8需獨立複審。沒有製作原生簽章包。維持MIT、免費、離線，沒有廣告、內購、外部連結、第三方SDK、帳號或線上功能。全程背景／無頭，瀏覽器與preview依序使用、收尾關閉。

文案mode2：原「到家了，煞車再扶穩」把離灣與送達混在一起，改成階段對應的「坐穩了，按住踏板出灣」「已回主路，按住踏板向前」「到分享站了，按住煞車」；原接近0°仍「快扶正99%」改由同一顯示角度產生狀態與百分比；原路口以問號串缺件改成單一必要行動；車票錯誤改直接說形狀或顏色不同。課名、角色名與保存識別保留。
