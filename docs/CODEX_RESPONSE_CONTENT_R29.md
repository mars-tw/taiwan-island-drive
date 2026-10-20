# 島嶼交通學院：新內容第29輪

VERIFIED：2026-10-21，分支 `r1-fun-polish`，版本 **2.41.0／來源 build37**，基準 `4cd8714`。本機修正、指定測試與原尺寸證據核對完成；最終來源及成果SHA見 `docs/content/r29/release-proof.json`。Muse複審尚未執行，不宣稱達8分。

三課入口皆為首頁「海岸實作課」→課程車票→三張選站卡→「一起出發」。需真正完成三站才記全課完成，直接選第三站不會跳過前兩站。

| 課程 | 本輪做了什麼、怎麼玩 |
|---|---|
| 把蛋糕平穩送到 | 方向盤負責轉車，雙手扶蛋糕圖負責扶正；六鍵固定，可多指操作。按住時按鍵與相應物件亮框，特寫和車頂共用真實傾角。「回中央」改「蛋糕回正」，快慢用三格圖示與短句。進灣煞停、蛋糕坐穩後踏板亮起，再按住離格回主路；離灣提示跟實際位置同步。 |
| 路口停看等 | 停穩看左右，來車的主畫面與側向視野共用進度；無臉側向車頭朝行進方向。出發鍵旁直接列出「還有一台車」「等小安到對岸」「再看右邊」等實際缺件。車走遠留下空路；三人都到岸才由灰轉亮。人物與名牌一起走，候行、抵岸位置錯開，右轉箭頭落在道路內。 |
| 形狀車票，找對月台 | 全部規則統一「形狀、顏色都一樣」，照字面配對即可選對。停妥開門後點朋友，再按住陪同；第一次有動畫手指，之後不重複。到門邊必須放開並站穩，提早續按也不能跳過；放開藍底暫停、續按黃底，圓環與百分比同源。未滿100%仍是走路全身，真正入座才加人數；走道終點與入座共用座位座標，場景高度不跳。 |

## Muse唯一五項逐項驗收

以下均為本機無頭Chromium直接輸出的 **390×844手機直式原尺寸PNG**，未拼接、未重繪UI、未注入遊戲完成狀態。Playwright clock只推進真正的RAF／計時器；多指由CDP觸控事件實際操作。

| 項目 | 原尺寸證據與驗收 |
|---|---|
| 1．轉向與扶正一眼分開 | `docs/content/r29/phone-cake-turn-only.png`：方向盤按住、車身開始轉向，受力延遲使蛋糕仍顯示0°。`docs/content/r29/phone-cake-support-only-before.png`→`phone-cake-support-only-after.png`：只按扶蛋糕，蛋糕回正，車速、車位與行進方向不變。兩組圖形與對應亮框不同。 |
| 2．受控對照與真正離灣 | `docs/content/r29/phone-cake-controlled-initial.png`、`phone-cake-controlled-high-support.png`、`phone-cake-controlled-brake-support.png`。兩個全新情境以完全相同的UI輸入前綴走到同站、同彎、相同初始傾斜，再各操作640ms；減速同扶比高速只扶更回正。`controlled-comparison.json`逐欄比對初始狀態相同，修正力8／22。這是受控分支重跑，不把不同站的畫面當對照。另有 `phone-cake-speed-tilt-1.png`→`2.png`→`3.png` 的先變速、後傾斜；`phone-cake-bay-parked.png`→`phone-cake-bay-leaving.png`→`phone-cake-bay-main-road.png` 的停妥、離格、回主路，車位變化超過半車身。 |
| 3．出發旁說明原因與淨空 | `docs/content/r29/phone-crossing-stage-1-1-middle.png`：人物過街中、出發鎖灰，旁邊寫等誰到對岸。`phone-crossing-stage-1-traffic-2.png`→`phone-crossing-stage-1-traffic-3.png`→`phone-crossing-stage-1-traffic-clear.png`：同站來車離場留下空路。`phone-crossing-stage-1-ready.png`：三人到岸、主路淨空，出發亮黃。三站皆有同格式完整證據。 |
| 4．按住、放開、續按 | `docs/content/r29/phone-tickets-stage-3-holding.png`→`phone-tickets-stage-3-paused.png`→`phone-tickets-stage-3-paused-still.png`→`phone-tickets-stage-3-resumed.png`→`phone-tickets-stage-3-aisle-end.png`→`phone-tickets-stage-3-seated-1.png`。黃色手指／圓環、藍色暫停、黃色續行可不用讀字分辨。放開700ms，進度與人物螢幕座標完全相同；坐下才變1/3。`phone-tickets-first-press-teaching-1.png`→`2.png`及manifest中的實際animation／scale值證明首次手指動畫；九人每次入段均檢查只在首次顯示。 |
| 5．九站選卡與重玩預告 | `docs/content/r29/phone-cake-select-stations.png`對照`phone-cake-replay-new-conditions.png`；`phone-crossing-select-stations.png`對照`phone-crossing-replay-new-conditions.png`；`phone-tickets-select-stations.png`對照`phone-tickets-replay-new-conditions.png`。每課三張卡，出發前顯示彎向、來車方向／人物次序、票面形色；重玩卡直接列真實「上次／這次」。六趟循環含回繞，每次至少改變一項實際條件。 |

## GPT／Claude與未見證據補齊

| 審查問題 | 修正與原尺寸路徑 |
|---|---|
| 嚴重：車票規則容易讀反 | 已移除當前UI的「同形不同色／同色不同形」，三站均寫兩樣都相同。`docs/content/r29/phone-tickets-stage-1-decision.png`、`phone-tickets-stage-2-decision.png`、`phone-tickets-stage-3-decision.png`；陪同全程保留同一句與票面。歷史scene與既有測試契約保留。 |
| 三段提示第二、第三段 | 三站各有 `docs/content/r29/phone-tickets-stage-1-mistake-1.png`／`mistake-2.png`／`mistake-3.png`（第2、3站同格式）：第一次只給線索、第二次淡化不符形狀牌、第三次才亮正解。另有三課 `phone-*-no-hint.png`，初始不預亮答案。 |
| 同站左右、看錯來源不記確認 | 每站 `phone-crossing-stage-1-look-away.png`與`phone-crossing-stage-1-look-left.png`（第2站來源right、第3站left）；同站對照，不再以不同站湊左右證據。看錯來源仍未確認來車。 |
| 來車連續通過、提早出發被擋 | 三站 `phone-crossing-stage-1-traffic-1.png`→`2.png`→`3.png`→`traffic-clear.png`。中途真按出發，玩家距離與過街進度不推進；所有鎖定階段共用灰底灰圖示，缺件在按鈕旁。 |
| 名牌跟人、腳下鋪面、出口位置 | 三站每人均有 `docs/content/r29/phone-crossing-stage-1-1-start.png`／`middle.png`／`pavement.png`（stage 1～3、人物1～3共27張）。逐張檢查名牌水平中心距自身人物≤20px、不互壓；人物與名牌離右轉路線≥16px。上車名牌置頭上並加細引線，避開踏階。 |
| 提前入座與位置跳動 | 每站三人皆有 `phone-tickets-stage-1-seated-1.png`～`seated-3.png`；另有同人 `resumed.png`→`aisle-end.png`→`seated-1.png`。未滿100%保留走路全身，坐下才顯示座位人物；前後場景高度一致，終點座標連續。 |
| 完成、回顧與保存 | 三課 `docs/content/r29/phone-cake-complete.png`／`phone-crossing-complete.png`／`phone-tickets-complete.png`，以及各自 `phone-*-saved.png`；讀回完整保存資料逐欄相同。完成回顧用本趟真實操作計數，沒有另加分數或競速。 |

## 精選、美術與商店圖

`docs/content/r29/review-set/`固定15張，01～05蛋糕、06～10路口、11～15車票，各五張原尺寸副本；來源、目的與SHA在 `review-set.json`。包含三課重玩選卡、蛋糕受控兩格、同站來車／空路／過街／解鎖，以及同人按住／放開／續按／坐下。十五張優先證明核心互動；其餘逐項驗收原圖保留於本輪根目錄，沒有宣稱全數放進精選。

新增商店圖：`docs/store/screenshots/content-r29/cake-bay-1290x2796.png`與`cake-bay-2064x2752.png`，由430×932／DPR3與1032×1376／DPR2直接輸出。所有既有商店圖保留。前後原圖、三視口副本在 `docs/evidence/content-r29/`，SHA對照在 `before-after.json`。

新增美術 **2次 `image_gen.imagegen`、2張runtime透明WebP**：雙手扶蛋糕、無臉側向來車；沿用完整PROMPTS風格前綴，原圖、提示、參照、實際工具與SHA在 `docs/content/r29/art/`。未揭露model slug，記null。Sharp只縮放與編碼，未畫場景。方向盤、手指、暫停與箭頭延伸既有原生SVG介面符號；人物沿用受管姿勢，未宣稱新增人物骨架或奶油物理。

## 測試與清理

VERIFIED：`npm test` **309項全綠**，包含10項R29新測試；原有測試與共用幾何輔助檔以基準SHA核對，未刪除、未修改或放寬。`npm run build`通過；`npm run test:merge`（5286）**132項全綠**，25張原始圖、零腳本錯誤與外部請求。

VERIFIED：R29三課九站與完成存檔重開；安裝快取後斷網重載，再完成九站；八視口96張覆蓋選站、遊玩、觀察／上客、按住與暫停。所有互動控制≥60px、文字不裁切、標籤與圖示不互壓，手機無鍵盤說明。主要實玩／RWD／商店尺寸共346張原圖，15張精選另為原尺寸副本。首次手指兩格的實際動畫名稱與不同scale值在browser-all.json，後續八人皆不重複顯示。

VERIFIED：`npm run test:store`（5113）**101項全綠**，26張原始圖，含安裝後離線與儲存失敗仍可玩。三視口各三次180個真實RAF，p95三跑中位：手機16.8ms、iPad視口16.8ms、桌機16.8ms，皆≤18ms；本機並發載僅供參考，不能視為實體裝置或乾淨機效能。秘密掃描0命中、現行來源舊版號0命中。50個既有測試／共用輔助檔SHA未變，90個原有未追蹤檔全部保留。各scope只使用單一無頭瀏覽器、結束即關，兩個指定埠的preview依序使用，收尾已全部關閉。工單所列storm-apocalypse Playwright路徑不存在，實際使用既有npm-cache中的Playwright，未另裝SDK。

EXECUTED並回讀VERIFIED：刪除 **68個**已追蹤、未修改且被取代的舊媒體，工作樹釋出 **91,486,937 bytes（87.25 MiB）**，包含R28全部15張舊review-set。`cleanup-plan.json`／`cleanup-result.json`逐檔記錄根目錄、路徑、bytes與SHA，刪除清單與Git一致。保留 **7,999個**舊媒體：84個原畫／美術契約、7,864個仍被歷史驗證manifest讀取雜湊的來源、51個腳本明確輸入；每檔原因與可定位的manifest讀取來源均在清冊。各輪Markdown與評審、商店圖、所有既有未追蹤檔保留。指定單元、建置、整合及本輪實玩均在刪除後執行。

## 風險與未完成

Apple 4.3風險：**中**。學院外框仍共用，但三課分別需要平順駕駛與照顧蛋糕、觀察讓行、形色比對與陪同，不以題數、通用任務或徽章充數。此為本機設計評估，不是Apple審核結果。

BLOCKED：實體iPhone／iPad觸控與原生語音需實機；真人親子及遮文字辨識需參與家庭；乾淨機效能需獨占硬體；Muse≥8需獨立複審。未製作原生簽章包。MIT、免費、離線保留，未增加廣告、內購、帳號、外部連結、第三方SDK或線上功能。全程背景／無頭，沒有push、部署、操作商店、發訊息或透過外部服務派工。

文案mode2：原「同形不同色／同色不同形」易被當成選錯牌的指令，改「形狀、顏色都一樣」；原「回中央」主體不清，改「蛋糕回正」；原「可以出發」未指明操作，改「按住踏板出灣」；路口鎖定改直接說缺哪一個條件；門邊先說放開站穩，避免只追百分比。課名、人物名、受控規格與存檔識別保留。
