# 島嶼交通學院：新內容第26輪

VERIFIED（本機修復與自動驗證）。工單2026-10-18、執行2026-10-20。限 `r1-fun-polish`，基準 `3d036b8`，版本2.38.0／來源build34。只修既有三課，未新增課程。最後測試狀態以 `docs/content/r26/release-proof.json` 為準；尚未取得獨立複評，不宣稱Muse已達8分。

三課入口都是首頁「海岸實作課」→選課車票→「一起出發」。

| 課程 | 本輪修正、操作與回饋 |
|---|---|
| 把蛋糕平穩送到 | 看路牌起步、轉彎、臨停。錯向顯示「越來越歪」，放開為「等你扶正」，按對才「回穩中」，近中央為「快扶正了」，完全正直才100%。單一直立蛋糕參照與方向箭頭，車頂顯示實際傾斜。休息灣停穩、短暫休息後，說明「可以出發」只亮踏板；踏板綠色上箭頭、煞車紅色寬板，重玩用迴轉箭頭。短站名不拆詞；完成改為單張完整分享原畫。 |
| 路口停看等 | 停車、依本站來車方向看左右，逐人等到岸，再出發。名字不帶數字；過街時顯示「現在輪到」與當前朋友，同時禁用灰色出發鍵，實際點按也不能移車。左右確認合成一列，移除重複短標與孤立箭頭，對岸牌有到岸者才出現。黃帽朋友改下車牽車的兩格姿勢。第三站保留車輛離場後再看左邊。 |
| 形狀車票，找對月台 | 三站起始月台全部中性，選錯說明形狀／顏色差異，選對才亮框。點朋友、按住陪同；第一個畫面只說「按住陪上車」，放開之後才說放開。人物70px圖像框、60px以上觸控，名字全程跟人；沿月台走路、登階、全身進門，再沿車內走到指定座位，坐好才計數。陪同時收起選牌，避免擋住人物與車門；完成用同一列車原畫並移除虛線。 |

## Muse五項驗收與原尺寸圖

下列路徑均以 `docs/content/r26/` 為根目錄，手機直式390×844，沒有拼貼、裁切或放大。`browser.json`／各scope的 `browser.json` 記錄當下狀態、說明、實際亮鍵、幾何、尺寸與SHA。公開UI實玩，只用Playwright clock推進真實RAF／計時器，不改遊戲狀態、不注入完成存檔。

| Muse下一輪清單 | 驗收方式與原圖 |
|---|---|
| ①蛋糕臨停狀態一致 | `phone-cake-stage-3-braking.png`→`phone-cake-stage-3-resting.png`→`phone-cake-stage-3-bay.png`：煞停、休息、可出發；最後只亮踏板。`phone-cake-stage-3-restart.png`補實際再起步。錯向 `phone-cake-wrong-recovery.png`、放開 `phone-cake-stage-2-centre-62.png`、持續按對 `supplement/phone-cake-stage-2-correct-recovery.png`、扶正 `phone-cake-stage-2-centre-100.png`。每張自動核對狀態、說明及所有實際黃色按鈕。 |
| ②車票真正判斷 | 每站三張：`phone-tickets-stage-<1至3>-decision.png`／`wrong.png`／`right.png`。起始沒有aria-pressed或到站正解標記，原圖三個白底牌；錯選指出形色原因，點對後才亮框。三站正解移動至不同位置。 |
| ③同人可見的上車過程 | 同小安 `phone-tickets-stage-1-board-start.png`→`walking.png`→`boarding-2.png`→`inside.png`→`aisle.png`→`seated-1.png`，各圖都帶名字；全身圖像框70px、入座頭肩至少24px。`paused.png`放開一秒保持原進度，續按才走。第二、三站同名檔各一套；每站三人真正入座才依次1/3、2/3、3/3。 |
| ④過街鎖定與標籤減量 | `phone-crossing-stage-3-1-middle.png`：出發灰色禁用，實際指標點按不移車；`pavement.png`顯示同一人到岸才增加計數。過街期間收起站名、左右確認列與對岸牌，只留計數及三個人物名牌，整個場景最多四個標籤，逐張幾何檢查無重疊。`phone-crossing-stage-3-ready-depart.png`全員到岸才亮出發。 |
| ⑤九站差異與參照 | 蛋糕 `phone-cake-stage-1-playing.png`、`phone-cake-wrong-recovery.png`、`phone-cake-stage-3-braking.png`；路口 `phone-crossing-stage-1-car.png`、`stage-2-car.png`、`stage-3-recheck-4.png`；車票三站 `decision.png`／`wrong.png`。單一直立參照在蛋糕錯向圖中可見，方向箭頭與車頂實際傾角同源。 |

路口每站每人另有 `phone-crossing-stage-<1至3>-<1至3>-start.png`、`middle.png`、`pavement.png`，以及 `arrived-1.png`～`arrived-3.png`。第三站 `recheck.png`～`recheck-4.png`顯示來車仍在、離場、待複查；錯誤提前出發留 `wrong-depart.png`。

精選 `docs/content/r26/review-set/` 共15張，01～05蛋糕、06～10路口、11～15車票，全部原尺寸；每課包含三站和遊玩中畫面。路口同一人過街兩格、車票登階／進門兩格，加蛋糕與車票完成圖。限15張，完整同人六格及每站未選／錯選／選對保留在本輪根目錄，精選來源與SHA在 `review-set.json`。所有精選的狀態欄、說明列及亮鍵均有逐張自動檢查。

## 八項指定問題回歸

| 問題 | 修正與證據 |
|---|---|
| 1．錯向卻寫回穩中 | 狀態由當下按壓方向判斷。`phone-cake-wrong-recovery.png`顯示越來越歪與改按左邊，同步只亮左鍵。 |
| 2．99%傾斜、可出發亮煞車 | ≥95%顯示快扶正了，真正0傾角才坐穩100%。臨停三格與再起步圖，亮鍵同動作來源；沒有可出發卻亮煞車。 |
| 3．踏板煞車同圖示 | 綠色長箭頭與紅色寬板，形色都不同。原圖 `phone-cake-stage-3-bay.png`；遮文字64px檢視在 `art/controls-panel-64.png`、`go-glyph-64.png`、`brake-glyph-64.png`，色像素及來源在 `art/control-check.json`。重玩另用迴轉箭頭。 |
| 4．蛋糕完成圖接縫 | `.content-finale`覆蓋全場景，原圖 `phone-cake-complete.png`，不再把海岸背景頂帶接上另一張原畫。 |
| 5．路口名牌順序歧義 | 所有名牌只留名字，進度由已到對岸計數負責；`phone-crossing-stage-3-1-middle.png`起的連拍。 |
| 6．車票開場誤稱放開 | `phone-tickets-stage-1-board-start.png`只說按住陪上車；實際操作後的 `paused.png`才說放開。 |
| 7．小安瞬移與太小 | 路徑逐段連續，雙姿勢行走、登階、全身進門、走向座位；身分名牌全程可辨。上表③的六格及全程路徑單元測試。 |
| 8．完成虛線與列車不同 | `phone-tickets-complete.png`不畫已無用途的虛線；遊玩、駛離、完成都取 `art/content-r3/train-side.webp`，同尺寸與朝向邏輯。 |

前後對照及三視口另存 `docs/evidence/content-r26/`，前圖取自基準commit，後圖為本輪原圖；對照來源與雜湊在 `before-after.json`。

## 測試、美術與清理

最後結果VERIFIED：`npm test` 285項全綠（原有281項案例、46個測試檔逐檔維持git blob）；`npm run build`成功；九站實玩、保存重開、未完成重玩保留舊完成紀錄、離線完整重玩與8種RWD全部通過。`npm run test:merge`（5286）132項、`npm run test:store`（5113）101項全綠，執行錯誤與外部請求皆0。每視口每課三次p95中位數16.7～16.8ms，9組皆≤18ms，並發載僅供參考。原尺寸截圖373張、精選15張，秘密掃描0命中。每次只開一個preview與一個瀏覽器，結束即關，兩個埠已釋放。命令輸出見本輪 `*-test.txt`、`final-run-log.txt`、`supplement-run-log.txt`及 `release-proof.json`。

RWD：320×568、568×320、390×844、844×390、768×1024、1024×768、1366×600、1280×640。每張驗證60px控制可點、文字無裁切、人物不遮牌面、標籤不重疊、圖示進度環不壓文字。手機不顯示鍵盤說明。

陪同速度原由舊底層固定為0.3，本輪將實際更新量按0.1縮放，可見上車段約3秒；新增單元確認經過一秒只前進0.1，設定確實生效。`phone-tickets-replay-walking.png`另驗證重玩路徑與未完成重玩不覆蓋已完成存檔。Playwright使用驗證腳本內指定的既有npm cache模組，無新增依賴。

新增生成美術：一次 `image_gen.imagegen`、兩張runtime WebP（下車牽車兩格）。提示沿用R24完整風格前綴，實際工具名及model_slug=null如實記錄；來源、透明圖、64px檢視與SHA在 `docs/content/r26/art/`。其餘使用既有受管原畫。動作是2D路徑及受管姿勢，未宣稱新增骨架或3D物理。

新增商店實玩圖：`docs/store/screenshots/content-r26/tickets-escort-1290x2796.png`、`tickets-escort-2064x2752.png`，無頭原生像素輸出；既有商店圖全部保留。

清理EXECUTED並回讀VERIFIED：刪除65個已追蹤、未修改、被取代的舊媒體檔，釋出90,312,991 bytes（約86.13 MiB），實際Git刪除清單與允許清單完全一致。逐檔SHA、絕對根目錄限制、刪除回讀及保留原因在 `cleanup-plan.json`／`cleanup-result.json`；保留清單6,681檔由歷史腳本／證據鏈引用或屬美術來源契約。全部Markdown、原有未追蹤審查與商店圖均保留；未刪除任何既有測試或放寬原有斷言。刪後完整重跑本輪與指定回歸，全部通過。

## 未完成與風險

Apple 4.3風險：中。三課仍有共用首頁與海岸框架，不能由本機修圖保證審核通過；本輪沒有新增通用任務、付費、帳號、SDK或線上功能。

BLOCKED：實體iPhone／iPad觸控及原生語音需裝置；親子試玩、遮文字辨識與遮站名盲辨需參與者；乾淨機效能需獨占硬體。本機並發載p95僅參考。Muse≥8／三評≥7.5仍需獨立複評，未自行宣稱達標。未重建簽章原生包；未push、部署或操作商店後台。

文案mode 2摘要：原「回穩中」在錯向時改「越來越歪」，原因是趨勢相反；原「傾斜中／99%」改「快扶正了」，原因是接近中央；原初次「放開了」改「按住陪上車」，原因是尚未操作；原「路旁休息區」統一「休息灣」，原因是同地點不同名稱；名牌移除固定數字，原因是避免誤讀通過順序。保留課名、人物姓名、規格與驗收數字。
